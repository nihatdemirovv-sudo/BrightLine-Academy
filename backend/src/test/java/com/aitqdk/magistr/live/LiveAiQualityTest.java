package com.aitqdk.magistr.live;

import static org.assertj.core.api.Assertions.assertThat;

import com.aitqdk.magistr.ai.AiService;
import com.aitqdk.magistr.dto.GeneratedQuestion;
import com.aitqdk.magistr.testsupport.TestIo;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.CompletableFuture;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;

/**
 * CANLI AI keyfiyyət testi — real Gemini API-yə sorğu göndərir (pul xərcləyir), ona görə yalnız
 * AI_LIVE_TEST=1 olanda işləyir. Hər fənn üzrə sual yaradır və nəticəni avtomatik yoxlayır:
 * JSON strukturu, 5 unikal variant, izahdakı cavab hərfi, LaTeX balansı ($ və {}), KaTeX-də olmayan
 * əmrlər (\ce, \( \[), pozulmuş escape simvolları, Türkiyə türkcəsi sözləri. Bütün suallar insan
 * gözü ilə baxmaq üçün build/reports/ai-quality.md faylına yazılır.
 *
 * İşə salma: AI_LIVE_TEST=1 GEMINI_API_KEY=... ./gradlew test --tests '*LiveAiQualityTest'
 * (istəyə bağlı: AI_MODEL, AI_BASE_URL)
 */
@EnabledIfEnvironmentVariable(named = "AI_LIVE_TEST", matches = "1")
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.NONE)
class LiveAiQualityTest {

  @DynamicPropertySource
  static void props(DynamicPropertyRegistry r) {
    r.add("app.ai.base-url", () -> env("AI_BASE_URL", "https://generativelanguage.googleapis.com/v1beta/openai"));
    r.add("app.ai.api-key", () -> env("GEMINI_API_KEY", ""));
    r.add("app.ai.chat-model", () -> env("AI_MODEL", "gemini-3.8-flash"));
    r.add("app.ai.reasoning-effort", () -> env("AI_REASONING", "medium"));
    r.add("app.ai.max-retries", () -> 3);
  }

  private static String env(String name, String def) {
    String v = System.getenv(name);
    return v != null && !v.isBlank() ? v : def;
  }

  /** [qrup, fənn, mövzu (null = proqramdan təsadüfi)] — bütün fənlər + riyaziyyatın ən çətin bölmələri. */
  private static final List<String[]> CASES = List.of(
      new String[]{"1", "Riyaziyyat", null}, new String[]{"1", "Fizika", null}, new String[]{"1", "Kimya", null},
      new String[]{"1", "İnformatika", null}, new String[]{"1", "Azərbaycan dili", null}, new String[]{"1", "Xarici dil", null},
      new String[]{"2", "Tarix", null}, new String[]{"2", "Coğrafiya", null}, new String[]{"3", "Ədəbiyyat", null},
      new String[]{"4", "Biologiya", null}, new String[]{"magistr", "Məntiq", null}, new String[]{"magistr", "İnformatika", null},
      new String[]{"magistr", "Xarici dil", null},
      new String[]{"1", "Riyaziyyat", "Loqarifm: xassələr, loqarifmik tənlik və bərabərsizliklər (çətin səviyyədə)"},
      new String[]{"1", "Riyaziyyat", "Triqonometrik ifadələr, düsturlar və tənliklər (orta çətinlikdə)"},
      new String[]{"1", "Riyaziyyat", "Həndəsə: üçbucaq, trapesiya, çevrə, silindr və konus — sahə və həcm (orta çətinlikdə)"});

  private static final Set<String> FIGURA_TIPLERI = Set.of("triangle", "rectangle", "trapezoid", "circle", "angle",
      "cylinder", "cone", "sphere", "cuboid", "pyramid");
  /** Bütün AI düsturları — KaTeX render yoxlaması üçün build/reports/latex-snippets.json-a yazılır. */
  private static final List<String> SNIPPETS = java.util.Collections.synchronizedList(new ArrayList<>());

  private static final int SAY = 5;
  private static final Pattern TURK = Pattern.compile(
      "(?iu)(?<![\\p{L}])(soru|cevap|denklem|üçgen|sarkaç|hız|ivme|kuvvet|öğrenci|örnek|olasılık|yüzde|çözelti|hücre|eşitsizlik)(?![\\p{L}])");
  private static final Pattern DOGRU_CAVAB = Pattern.compile("(?iu)doğru cavab\\s*[:\\-]?\\s*([A-E])\\b");

  @Autowired
  AiService aiService;

  @Test
  @DisplayName("Canlı AI: bütün fənlər üzrə sual keyfiyyəti")
  void questionQuality() throws IOException {
    assertThat(System.getenv("GEMINI_API_KEY")).as("GEMINI_API_KEY təyin edilməyib").isNotBlank();

    // AI_LIVE_FENN="Məntiq,Fizika" — yalnız bu fənləri yoxla (boşdursa hamısı).
    String filter = env("AI_LIVE_FENN", "");
    List<String[]> cases = CASES.stream()
        .filter(c -> filter.isBlank() || List.of(filter.split(",")).stream().anyMatch(f -> c[1].equalsIgnoreCase(f.trim())))
        .toList();

    List<CompletableFuture<List<GeneratedQuestion>>> futures = cases.stream()
        .map(c -> CompletableFuture.supplyAsync(() -> aiService.generateQuestions(c[1], SAY, c[0], c[2])))
        .toList();

    List<String> hardErrors = new ArrayList<>();
    StringBuilder report = new StringBuilder("# Canlı AI keyfiyyət hesabatı\n\nModel: ")
        .append(env("AI_MODEL", "gemini-3.8-flash")).append("\n\n");
    for (int i = 0; i < cases.size(); i++) {
      String[] c = cases.get(i);
      int xetaSayiEvvel = hardErrors.size();
      List<GeneratedQuestion> qs = futures.get(i).join();
      String label = c[1] + " (" + ("magistr".equals(c[0]) ? "magistr" : c[0] + "-ci qrup") + ")"
          + (c[2] != null ? " — " + c[2] : "");
      report.append("## ").append(label).append(" — ").append(qs.size()).append(" sual\n\n");
      if (qs.size() < SAY) {
        hardErrors.add(label + ": " + SAY + " sual gözlənilirdi, " + qs.size() + " gəldi");
      }
      Set<String> sualMetnleri = new HashSet<>();
      for (int n = 0; n < qs.size(); n++) {
        GeneratedQuestion q = qs.get(n);
        List<String> problems = problems(q);
        if (!sualMetnleri.add(q.getSual())) {
          problems.add("eyni sual təkrarlanıb");
        }
        problems.forEach(p -> hardErrors.add(label + " #" + (q.getMovzu()) + ": " + p));
        report.append("### ").append(n + 1).append(". ").append(q.getMovzu()).append(" [").append(q.getCetinlik()).append("]")
            .append(problems.isEmpty() ? "" : " ⚠️ " + String.join("; ", problems)).append("\n\n")
            .append(q.getSual()).append("\n\n");
        q.getVariantlar().forEach((k, v) -> report.append("- ").append(k.equals(q.getDogruCavab()) ? "**" + k + "**" : k)
            .append(") ").append(v).append('\n'));
        report.append("\n> ").append(q.getIzah().replace("\n", "\n> ")).append("\n\n");
        if (q.getFigura() != null) {
          report.append("Fiqur (saytda SVG kimi çəkilir): `").append(q.getFigura()).append("`\n\n");
        }
      }
      if (hardErrors.size() == xetaSayiEvvel) {
        TestIo.record("Canlı AI sual generatoru — " + label,
            c[2] == null ? Map.of("fenn", c[1], "qrup", c[0], "say", SAY, "model", env("AI_MODEL", "gemini-3.8-flash"))
                : Map.of("fenn", c[1], "qrup", c[0], "say", SAY, "movzu", c[2], "model", env("AI_MODEL", "gemini-3.8-flash")),
            qs,
            SAY + " sual; hər birində 5 unikal variant, izahdakı cavab hərfi dogruCavab ilə eyni, LaTeX balanslı, "
                + "KaTeX-də olmayan əmr və Türkiyə türkcəsi sözü yoxdur, suallar təkrarlanmır");
      }
    }

    String tutor = aiService.tutorChat(List.of(Map.of("role", "user",
        "content", "sin^2 x + cos 2x ifadəsini sadələşdir və tg 45° neçədir?")), new AiService.TutorContext("1", "", List.of()));
    report.append("## AI Müəllim nümunəsi\n\n").append(tutor).append("\n");
    List<String> tutorProblems = latexProblems(tutor);
    tutorProblems.forEach(p -> hardErrors.add("AI Müəllim: " + p));
    if (tutorProblems.isEmpty()) {
      TestIo.record("Canlı AI Müəllim",
          Map.of("qrup", "1", "mesaj", "sin^2 x + cos 2x ifadəsini sadələşdir və tg 45° neçədir?"),
          tutor,
          "cavab qayıtdı, LaTeX balanslıdır ($ cüt, { } bərabər), KaTeX-də olmayan əmr yoxdur");
    }

    Path out = Path.of("build", "reports", "ai-quality.md");
    Files.createDirectories(out.getParent());
    new com.fasterxml.jackson.databind.ObjectMapper()
        .writeValue(Path.of("build", "reports", "latex-snippets.json").toFile(), SNIPPETS);
    Files.writeString(out, report.append("\n## Problemlər\n\n").append(hardErrors.isEmpty() ? "Yoxdur ✅" : "- " + String.join("\n- ", hardErrors)),
        StandardCharsets.UTF_8);

    assertThat(hardErrors).as("Problemlər (tam hesabat: " + out.toAbsolutePath() + ")").isEmpty();
  }

  private static List<String> problems(GeneratedQuestion q) {
    List<String> p = new ArrayList<>();
    Map<String, String> v = q.getVariantlar();
    if (q.getSual() == null || q.getSual().isBlank()) p.add("sual boşdur");
    if (v == null || !v.keySet().equals(Set.of("A", "B", "C", "D", "E"))) {
      p.add("variantlar A–E deyil: " + (v == null ? null : v.keySet()));
    } else {
      if (v.values().stream().anyMatch(s -> s == null || s.isBlank())) p.add("boş variant var");
      if (new HashSet<>(v.values()).size() < 5) p.add("variantlar təkrarlanır");
    }
    if (q.getDogruCavab() == null || v == null || !v.containsKey(q.getDogruCavab())) p.add("dogruCavab yanlışdır");
    if (q.getIzah() == null || q.getIzah().isBlank()) {
      p.add("izah boşdur");
    } else {
      Matcher m = DOGRU_CAVAB.matcher(q.getIzah());
      String son = null;
      while (m.find()) son = m.group(1);
      if (son != null && !son.equals(q.getDogruCavab())) p.add("izahda cavab " + son + ", dogruCavab " + q.getDogruCavab());
    }
    if (q.getFigura() != null) {
      Object type = q.getFigura().get("type");
      if (!FIGURA_TIPLERI.contains(String.valueOf(type))) p.add("dəstəklənməyən fiqur tipi: " + type);
    }
    if (q.getCetinlik() == null || !Set.of("asan", "orta", "cetin").contains(q.getCetinlik())) p.add("cetinlik: " + q.getCetinlik());

    List<String> texts = new ArrayList<>(List.of(String.valueOf(q.getSual()), String.valueOf(q.getIzah())));
    if (v != null) texts.addAll(v.values());
    for (String t : texts) {
      p.addAll(latexProblems(t));
      Matcher tm = TURK.matcher(t);
      if (tm.find()) p.add("Türkiyə türkcəsi sözü: " + tm.group(1));
    }
    return p;
  }

  /** $ və {} balansı, KaTeX-də olmayan əmrlər, JSON escape-dən pozulmuş simvollar. */
  static List<String> latexProblems(String t) {
    List<String> p = new ArrayList<>();
    if (t == null) return p;
    if (t.indexOf('\f') >= 0 || t.indexOf('\b') >= 0 || t.indexOf('\t') >= 0) p.add("pozulmuş escape simvolu (\\f/\\b/\\t)");
    if (t.contains("\\ce{")) p.add("KaTeX-də olmayan \\ce");
    if (t.contains("\\(") || t.contains("\\[")) p.add("\\( və ya \\[ ayırıcısı");
    // Kod (```...``` və `...`) KaTeX-ə getmir — məs. Excel "`=$A$1`" düstur deyil.
    String noEscaped = t.replaceAll("```[\\s\\S]*?```|`[^`\\n]*`", "").replace("\\$", "");
    long dollars = noEscaped.chars().filter(ch -> ch == '$').count();
    if (dollars % 2 != 0) p.add("$ sayı tək (" + dollars + ")");
    Matcher m = Pattern.compile("\\$\\$([\\s\\S]+?)\\$\\$|\\$([^$]+?)\\$").matcher(noEscaped);
    while (m.find()) {
      String math = m.group(1) != null ? m.group(1) : m.group(2);
      int depth = 0;
      for (int i = 0; i < math.length(); i++) {
        char ch = math.charAt(i);
        if (i > 0 && math.charAt(i - 1) == '\\') continue;
        if (ch == '{') depth++;
        if (ch == '}') depth--;
        if (depth < 0) break;
      }
      if (depth != 0) p.add("{ } balanssızdır: " + math);
      SNIPPETS.add(math);
    }
    return p;
  }
}
