package com.aitqdk.magistr.util;

import com.fasterxml.jackson.core.JsonFactory;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.json.JsonReadFeature;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import lombok.extern.slf4j.Slf4j;

import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;

@Slf4j
public final class JsonUtil {

    // AI (LLM) modelləri bəzən JSON string dəyərləri daxilində LaTeX kimi
    // düzgün escape olunmamış backslash-lar (məs. "\c", "\f") qaytarır —
    // ALLOW_BACKSLASH_ESCAPING_ANY_CHARACTER bunları sərt JSON qaydası
    // yerinə hərfi backslash kimi qəbul edir ki, parse xətası olmasın.
    private static final JsonFactory LENIENT_FACTORY = JsonFactory.builder()
            .enable(JsonReadFeature.ALLOW_BACKSLASH_ESCAPING_ANY_CHARACTER)
            .enable(JsonReadFeature.ALLOW_UNESCAPED_CONTROL_CHARS)
            // AI bəzən (JSON rejimində belə) son elementdən sonra vergül və ya şərh qoyur.
            .enable(JsonReadFeature.ALLOW_TRAILING_COMMA)
            .enable(JsonReadFeature.ALLOW_JAVA_COMMENTS)
            .build();

    public static final ObjectMapper MAPPER = new ObjectMapper(LENIENT_FACTORY)
            .registerModule(new JavaTimeModule())
            .configure(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS, false)
            .configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);

    private JsonUtil() {
    }

    public static String toJson(Object value) {
        try {
            return MAPPER.writeValueAsString(value);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("JSON serialization xətası", e);
        }
    }

    public static <T> T fromJson(String json, Class<T> type) {
        try {
            return MAPPER.readValue(json, type);
        } catch (Exception e) {
            log.warn("JSON parse xətası: {}", e.getMessage());
            return null;
        }
    }

    public static <T> T fromJson(String json, TypeReference<T> type) {
        try {
            return MAPPER.readValue(json, type);
        } catch (Exception e) {
            log.warn("JSON parse xətası: {}", e.getMessage());
            return null;
        }
    }

    public static List<Map<String, Object>> parseListOfMaps(String json) {
        return fromJson(json, new TypeReference<>() {
        });
    }

    /** Bir entity/DTO-nu LinkedHashMap-ə çevirir ki, controller səviyyəsində əlavə sahələr
     * (əlaqəli siyahılar, hesablanmış dəyərlər) asanlıqla "spread" edilə bilsin. */
    @SuppressWarnings("unchecked")
    public static Map<String, Object> asMap(Object value) {
        return MAPPER.convertValue(value, java.util.LinkedHashMap.class);
    }

    /** AI cavabındakı ```json ... ``` bloklarını təmizləyir və LaTeX backslash-larını bərpa edir. */
    public static String stripMarkdownFences(String content) {
        if (content == null) return "";
        return repairLatexEscapes(content
                .replaceAll("```json\\n?", "")
                .replaceAll("```\\n?", "")
                .trim());
    }

    // AI LaTeX-i JSON sətrinin içində tez-tez TƏK backslash ilə yazır və bu parse zamanı SƏSSİZ pozulur:
    //  - backslash + f/n/t/b/r ETİBARLI JSON escape-dir: frac → form-feed + "rac", theta → tab + "heta",
    //    neq → yeni sətir + "eq";
    //  - backslash + u 4 hex tələb edir: underline, uparrow → parse xətası;
    //  - qalan hər şey (sqrt, cdot, left, end, vergül, faiz, fiqurlu mötərizə) etibarsız escape-dir və
    //    lenient parser backslash-ı ATIR: "sqrt{2}" xam mətn qalır, faiz işarəsi isə KaTeX-də şərhə çevrilib
    //    düsturun qalanını silir.
    // Parse-dan ƏVVƏL tək (tək sayda) backslash-ı ikiqatlaşdırırıq. f/n/t/b/r ilə başlayan hallarda yalnız
    // tanınmış LaTeX əmrləri düzəldilir — adi sətir keçidi (yeni sətir + söz) toxunulmaz qalsın.
    private static final Pattern LATEX_BFNRT = Pattern.compile(
            "(?:frac|theta|times|tau|tilde|triangle|tg|therefore|tanh|tan|top"
                    + "|neq|nabla|notin|nmid|nu|ne|neg|ni|nleq|ngeq|nexists"
                    + "|beta|binom|boxed|bullet|backslash|bigl|bigr|biggl|biggr|bmod|boldsymbol|bigcup|bigcap|bot"
                    + "|rho|rangle|rceil|rfloor|rightarrow|rightleftharpoons|rm|rvert|rVert|rbrace"
                    + "|forall|flat)(?![A-Za-z])"
                    + "|(?:text|textbf|textit|textrm|textnormal|begin|bar|frac)(?=\\{)"
                    + "|right(?=[)\\].|\\\\])");
    private static final Pattern HEX4 = Pattern.compile("[0-9a-fA-F]{4}");

    static String repairLatexEscapes(String json) {
        StringBuilder sb = new StringBuilder(json.length() + 32);
        int n = json.length();
        int i = 0;
        while (i < n) {
            char ch = json.charAt(i);
            if (ch != '\\') {
                sb.append(ch);
                i++;
                continue;
            }
            int j = i;
            while (j < n && json.charAt(j) == '\\') j++;
            sb.append(json, i, j);
            // Cüt sayda backslash — artıq düzgün escape olunub ("\\frac" və ya "\\\\"), toxunma.
            if ((j - i) % 2 == 1 && j < n && isLatexEscape(json, j)) {
                sb.append('\\');
            }
            i = j;
        }
        return sb.toString();
    }

    private static boolean isLatexEscape(String s, int pos) {
        char c = s.charAt(pos);
        if (c == '"' || c == '/') {
            return false; // etibarlı JSON escape (dırnaq, slash)
        }
        if (c == 'u') {
            return !HEX4.matcher(s).region(pos + 1, s.length()).lookingAt(); // unicode escape deyilsə — underline və s.
        }
        if ("bfnrt".indexOf(c) >= 0) {
            return LATEX_BFNRT.matcher(s).region(pos, s.length()).lookingAt();
        }
        return true; // sqrt, cdot, left, end, alpha, vergül, faiz, mötərizə — JSON-da etibarsız, LaTeX-dir
    }
}
