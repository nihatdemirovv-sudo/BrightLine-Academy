package com.aitqdk.magistr.service;

import com.aitqdk.magistr.ai.AiPrompts;
import com.aitqdk.magistr.ai.AiService;
import com.aitqdk.magistr.entity.UniversityCutoff;
import com.aitqdk.magistr.exception.ApiException;
import com.aitqdk.magistr.repository.UniversityCutoffRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

/**
 * Universitet kod ballarının idxalı. Gözlənilən format — hər sətir:
 *   Universitet | İxtisas | Qrup | MinBal [| TehsilNovu [| İl]]
 * TehsilNovu: "ödənişli" / "dövlət sifarişi" / boş (naməlum).
 * "#" ilə başlayan sətirlər və boş sətirlər ignore edilir.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class UniversityCutoffAdminService {

    private static final int AI_FORMAT_CHUNK_LINES = 60;
    private static final Pattern NUMBER_RE = Pattern.compile("\\d+(?:[.,]\\d+)?");

    private final UniversityCutoffRepository repository;
    private final AiService aiService;

    public record ImportResult(int əlavəEdildi, int sətirSayı, List<String> xətalar) {
    }

    @Transactional
    public ImportResult importText(String rawText, boolean replaceAll) {
        if (replaceAll) {
            repository.deleteAll();
        }

        List<UniversityCutoff> toSave = new ArrayList<>();
        List<String> xətalar = new ArrayList<>();
        int sətirSayı = 0;

        for (String rawLine : rawText.split("\r?\n")) {
            String line = rawLine.trim();
            if (line.isEmpty() || line.startsWith("#")) continue;
            sətirSayı++;

            String[] parts = line.split("\\|", -1);
            if (parts.length < 4) {
                xətalar.add("Format səhvi (4 sahə lazımdır: Universitet | İxtisas | Qrup | MinBal): " + line);
                continue;
            }
            try {
                UniversityCutoff u = new UniversityCutoff();
                u.setUniversitet(parts[0].trim());
                u.setIxtisas(parts[1].trim());
                u.setQrup(parts[2].trim());
                u.setMinBal(Double.parseDouble(parts[3].trim().replace(",", ".")));
                if (parts.length >= 5 && !parts[4].isBlank()) {
                    u.setTehsilNovu(parts[4].trim());
                }
                if (parts.length >= 6 && !parts[5].isBlank()) {
                    u.setIl(Integer.parseInt(parts[5].trim()));
                }
                toSave.add(u);
            } catch (NumberFormatException e) {
                xətalar.add("Bal/il rəqəmə çevrilmədi: " + line);
            }
        }

        repository.saveAll(toSave);
        return new ImportResult(toSave.size(), sətirSayı, xətalar);
    }

    public record AiFormatResult(String formattedText, List<String> xəbərdarlıqlar) {
    }

    /**
     * Xam (PDF-dən kopyalanmış) mətni AI ilə {@code Universitet | İxtisas | Qrup | MinBal | TehsilNovu}
     * formatına çevirir — admin bunu "İdxal Et"-dən ƏVVƏL nəzərdən keçirib lazım gəlsə düzəldir,
     * AI birbaşa DB-yə yazmır. Sənəd böyük ola bilər (Groq-un 8000 token/dəqiqə limiti üzündən tək
     * sorğuda göndərilə bilməz) — sətir sayına görə kiçik hissələrə bölünüb ARDICIL (paralel YOX,
     * çünki hər hissə əvvəlkinin "son universitet" kontekstinə ehtiyac duyur) emal olunur.
     */
    public AiFormatResult aiFormatText(String rawText) {
        if (rawText == null || rawText.isBlank()) {
            throw ApiException.badRequest("Mətn boşdur.");
        }
        if (!aiService.isConfigured()) {
            throw ApiException.badRequest("AI konfiqurasiya olunmayıb.");
        }

        List<String> lines = List.of(rawText.split("\r?\n"));
        List<String> xəbərdarlıqlar = new ArrayList<>();
        StringBuilder nəticə = new StringBuilder();
        String sonUniversitet = null;

        for (int i = 0; i < lines.size(); i += AI_FORMAT_CHUNK_LINES) {
            String chunk = String.join("\n", lines.subList(i, Math.min(i + AI_FORMAT_CHUNK_LINES, lines.size())));
            if (chunk.isBlank()) continue;

            String prompt = """
                    Aşağıdakı XAM mətn (PDF/sənəddən kopyalanmış) universitet keçid balları haqqındadır.
                    Bunu HƏR sətir üçün DƏQİQ bu formata çevir:

                    Universitet | İxtisas | Qrup | MinBal | TehsilNovu

                    Qaydalar:
                    - Universitet adları mətndə böyük başlıq kimi görünür — hər ixtisas sətri YENİ universitet adı gələnə qədər HƏMİN universitetə aid edilir.%s
                    - Hər ixtisas sətrində adətən "Ə/Q rəqəm(rəqəm)" formatı olur — Ə/Q təhsil forması (əyani/qiyabi, məzmuna təsir etmir), BİRİNCİ rəqəm ödənişli yerin balı, MÖTƏRİZƏDƏKİ rəqəm dövlət sifarişi yerinin balıdır. "-"/"–" o yerin olmadığını bildirir.
                    - Hər mövcud YER NÖVÜ (ödənişli/dövlət sifarişi) üçün AYRI sətir yarat, TehsilNovu sahəsinə "ödənişli" və ya "dövlət sifarişi" yaz.
                    - Qrup nömrəsini mətndəki bölmə başlıqlarından (məs. "I qrup", "1-ci qrup") müəyyən et, yalnız rəqəmi yaz (1, 2, 3...).
                    - MÜTLƏQ QAYDA: HEÇ BİR RƏQƏMİ DƏYİŞMƏ, YUVARLAMA, UYDURMA VƏ YA BURAXMA — bunlar real qəbul ballarıdır, səhv olsa tələbələrə yanlış məsləhət verilər.
                    - Anlaşılmaz/natamam sətri "#" ilə başlayan şərh kimi burax (bu, idxal zamanı avtomatik ignore olunur), UYDURMA DƏYƏR YAZMA.
                    - Yalnız formatlaşdırılmış sətirləri qaytar (hər sətirdə bir proqram) — başqa heç bir izah, başlıq və ya kod-blok işarəsi yazma.

                    Xam mətn:
                    \"\"\"
                    %s
                    \"\"\""""
                    .formatted(
                            sonUniversitet != null
                                    ? " Bu hissə əvvəlki mətnin davamıdır, son məlum universitet: \"%s\" — əgər bu hissənin əvvəlində yeni universitet başlığı yoxdursa, ilk sətirlər HƏLƏ DƏ bu universitetə aiddir.".formatted(sonUniversitet)
                                    : "",
                            chunk);

            String formatted;
            try {
                formatted = aiService.rawText(
                        AiPrompts.CUTOFF_FORMAT_SYSTEM,
                        prompt, 8000).trim();
            } catch (Exception e) {
                log.error("Universitet balları AI formatlama xətası (sətir {}-{}):", i, i + AI_FORMAT_CHUNK_LINES, e);
                xəbərdarlıqlar.add("Sətir %d-%d hissəsi AI ilə formatlana bilmədi (%s) — bu hissəni əl ilə yoxla/yenidən cəhd et."
                        .formatted(i + 1, Math.min(i + AI_FORMAT_CHUNK_LINES, lines.size()), e.getMessage()));
                continue;
            }

            if (nəticə.length() > 0) nəticə.append("\n");
            nəticə.append(formatted);

            String sonSetir = sonQeyriŞerhSetri(formatted);
            if (sonSetir != null) {
                String[] parts = sonSetir.split("\\|", -1);
                if (parts.length > 0 && !parts[0].isBlank()) {
                    sonUniversitet = parts[0].trim();
                }
            }

            int xamRegemSayi = sayRegemler(chunk);
            int formatRegemSayi = sayRegemler(formatted);
            if (xamRegemSayi > 0 && formatRegemSayi < xamRegemSayi * 0.7) {
                xəbərdarlıqlar.add("Sətir %d-%d hissəsində rəqəm sayı uyğun gəlmədi (xam: %d, nəticə: %d) — bu hissəni diqqətlə yoxla."
                        .formatted(i + 1, Math.min(i + AI_FORMAT_CHUNK_LINES, lines.size()), xamRegemSayi, formatRegemSayi));
            }
        }

        return new AiFormatResult(nəticə.toString(), xəbərdarlıqlar);
    }

    private static String sonQeyriŞerhSetri(String text) {
        String[] lines = text.split("\r?\n");
        for (int i = lines.length - 1; i >= 0; i--) {
            String l = lines[i].trim();
            if (!l.isEmpty() && !l.startsWith("#")) {
                return l;
            }
        }
        return null;
    }

    private static int sayRegemler(String text) {
        Matcher m = NUMBER_RE.matcher(text);
        int say = 0;
        while (m.find()) say++;
        return say;
    }

    public Map<String, Object> stats() {
        List<UniversityCutoff> hamısı = repository.findAll();
        Map<String, Long> qrupÜzrə = hamısı.stream()
                .collect(Collectors.groupingBy(UniversityCutoff::getQrup, LinkedHashMap::new, Collectors.counting()));
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("toplam", hamısı.size());
        result.put("qrupUzre", qrupÜzrə);
        return result;
    }
}
