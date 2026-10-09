package com.aitqdk.magistr.service;

import com.aitqdk.magistr.ai.AiPrompts;
import com.aitqdk.magistr.ai.AiService;
import com.aitqdk.magistr.entity.Student;
import com.aitqdk.magistr.entity.UniversityCutoff;
import com.aitqdk.magistr.repository.UniversityCutoffRepository;
import com.aitqdk.magistr.util.JsonUtil;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Tələbənin ÖZÜNÜN daxil etdiyi bal + qrup (+ I/III qrup üçün istiqamət) ilə universitet+ixtisas
 * kod ballarını tam deterministik (AI-sız) müqayisə edib sıralayır. AI yalnız 2 yerdə iştirak edir:
 * 1) tələbənin sərbəst mətnlə yazdığı istəyə görə (məs. "yalnız Bakı" / "yalnız bu universitetlər")
 *    artıq HESABLANMIŞ namizəd siyahısından uyğun universitetləri SEÇMƏK (uydurmur, yalnız verilmiş
 *    bağlı siyahıdan seçir), 2) qısa şəxsi şərh mətni. Hər ikisi tələbə+bal+qrup+istək üzrə keşlənir.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class UniversityMatchService {

    private final StudentService studentService;
    private final UniversityCutoffRepository universityCutoffRepository;
    private final AiService aiService;

    public record Match(String universitet, String ixtisas, double minBal, String tehsilNovu, double ferq, boolean kecir) {
    }

    /** Ən yaxından ən uzağa sıralanmış siyahıdan (məs. kəsim balına marjaya görə) BƏRABƏR ARALIQLI
     * nümunə seçir — yalnız siyahının başındakı (ən yaxın/riskili) elementləri yox, bütün spektri
     * (o cümlədən uzaq/"təhlükəsiz" ucunu) əhatə etsin deyə. Siyahı `limit`-dən kiçikdirsə, hamısı qaytarılır. */
    private static <T> List<T> spreadSample(List<T> sorted, int limit) {
        int n = sorted.size();
        if (n <= limit) return sorted;
        LinkedHashSet<Integer> indices = new LinkedHashSet<>();
        for (int i = 0; i < limit; i++) {
            indices.add((int) Math.round(i * (n - 1) / (double) (limit - 1)));
        }
        List<T> result = new ArrayList<>(indices.size());
        for (int idx : indices) result.add(sorted.get(idx));
        return result;
    }

    private record NəticəCacheEntry(List<String> uyğunUniversitetler, List<String> ixtisasAçarSözləri,
                                     String serh, String açar, long ts) {
    }

    private final Map<String, NəticəCacheEntry> nəticəCache = new ConcurrentHashMap<>();

    /** DİM-in rəsmi I qrup Rİ (Riyaziyyat-İnformatika) altqrupuna daxil olan ixtisaslar — qalanı RK-dir. */
    private static final Set<String> Rİ_IXTISASLARI = Set.of(
            "İnformatika müəllimliyi",
            "Riyaziyyat və informatika müəllimliyi",
            "Kompüter elmləri",
            "İnformasiya təhlükəsizliyi",
            "İnformasiya texnologiyaları",
            "Kompüter mühəndisliyi",
            "Mexatronika və robototexnika mühəndisliyi",
            "Proseslərin avtomatlaşdırılması mühəndisliyi",
            "Sistemlər mühəndisliyi"
    );

    private boolean isRiIxtisas(String ixtisas) {
        if (ixtisas == null) return false;
        String norm = ixtisas.toLowerCase(Locale.forLanguageTag("az"));
        return Rİ_IXTISASLARI.stream().anyMatch(ri -> norm.startsWith(ri.toLowerCase(Locale.forLanguageTag("az"))));
    }

    /** DİM-in rəsmi III qrup TC (Tarix-Coğrafiya) altqrupuna daxil olan ixtisaslar — qalanı DT-dir. */
    private static final Set<String> TC_IXTISASLARI = Set.of(
            "Beynəlxalq münasibətlər",
            "Regionşünaslıq"
    );

    private boolean isTcIxtisas(String ixtisas) {
        if (ixtisas == null) return false;
        String norm = ixtisas.toLowerCase(Locale.forLanguageTag("az"));
        return TC_IXTISASLARI.stream().anyMatch(tc -> norm.startsWith(tc.toLowerCase(Locale.forLanguageTag("az"))));
    }

    private record UniMeta(String şəhər, String mülkiyyət) {
    }

    /**
     * Universitetlərin şəhəri və mülkiyyət növü (dövlət/özəl) — DB-də bu sahələr yoxdur, DB-də
     * saxlanılan "tehsilNovu" sadəcə YERİN maliyyələşmə növüdür (ödənişli/dövlət sifarişi), universitetin
     * ÖZÜNÜN statusu ilə eyni şey deyil. Bu xəritə əl ilə (mənbələr yoxlanılaraq: Vikipediya, rəsmi
     * universitet saytları, edu.gov.az, e-qanun.az) tərtib olunub ki, "yalnız Bakı" / "özəl olmasın" kimi
     * sərbəst istəklər AI-nın (Groq-un açıq modelinin) etibarsız yaddaş biliyinə əsaslanmadan, birbaşa
     * verilmiş fakt kimi düzgün süzülsün. Açarlar DB-dəki `universitet` sütununun DƏQİQ mətni ilə üst-üstə
     * düşməlidir (o cümlədən idxal zamanı yaranan hərf-böyüklüyü dublikatları, məs. "iqtisad"/"İqtisad").
     */
    private static final Map<String, UniMeta> UNI_META = Map.<String, UniMeta>ofEntries(
            // DİQQƏT: DB-də bu iki ad CURLY dırnaq (U+201C/U+201D) VƏ dırnaqdan əvvəl boşluqla saxlanılır
            // (məs. "Azərbaycan " + U+201D + " Universiteti") — PDF idxal artefaktı. Açar bu DƏQİQ formaya
            // uyğun olmalıdır, yoxsa uniMeta() bu 2 universitet üçün həmişə "naməlum" fallback-a düşər.
            Map.entry("“Azərbaycan ” Universiteti", new UniMeta("Bakı", "özəl")),
            Map.entry("“Odlar Yurdu ” Universiteti", new UniMeta("Bakı", "özəl")),
            Map.entry("ADA Universiteti", new UniMeta("Bakı", "dövlət")),
            Map.entry("Azərbaycan Dillər Universiteti", new UniMeta("Bakı", "dövlət")),
            Map.entry("Azərbaycan Dövlət Aqrar Universiteti (Gəncə şəhəri)", new UniMeta("Gəncə", "dövlət")),
            Map.entry("Azərbaycan Dövlət Dəniz Akademiyası", new UniMeta("Bakı", "dövlət")),
            Map.entry("Azərbaycan Dövlət iqtisad Universiteti", new UniMeta("Bakı", "dövlət")),
            Map.entry("Azərbaycan Dövlət İqtisad Universiteti", new UniMeta("Bakı", "dövlət")),
            Map.entry("Azərbaycan Dövlət Mədəniyyət və İncəsənət Universiteti", new UniMeta("Bakı", "dövlət")),
            Map.entry("Azərbaycan Dövlət Neft və Sənaye Universiteti", new UniMeta("Bakı", "dövlət")),
            Map.entry("Azərbaycan Dövlət Pedaqoji Universiteti", new UniMeta("Bakı", "dövlət")),
            Map.entry("Azərbaycan Dövlət Rəssamlıq Akademiyası", new UniMeta("Bakı", "dövlət")),
            Map.entry("Azərbaycan Əmək və Sosial Münasibətlər Akademiyası", new UniMeta("Bakı", "özəl")),
            Map.entry("Azərbaycan idman Akademiyası", new UniMeta("Bakı", "dövlət")),
            Map.entry("Azərbaycan İdman Akademiyası", new UniMeta("Bakı", "dövlət")),
            Map.entry("Azərbaycan İlahiyyat İnstitutu", new UniMeta("Bakı", "dövlət")),
            Map.entry("Azərbaycan Kooperasiya Universiteti", new UniMeta("Bakı", "özəl")),
            Map.entry("Azərbaycan Memarlıq və İnşaat Universiteti", new UniMeta("Bakı", "dövlət")),
            Map.entry("Azərbaycan Respublikası Prezidenti yanında Dövlət İdarəçilik Akademiyası", new UniMeta("Bakı", "dövlət")),
            Map.entry("Azərbaycan Texniki Universiteti", new UniMeta("Bakı", "dövlət")),
            Map.entry("Azərbaycan Texnologiya Universiteti (Gəncə şəhəri)", new UniMeta("Gəncə", "dövlət")),
            Map.entry("Azərbaycan Tibb Universiteti", new UniMeta("Bakı", "dövlət")),
            Map.entry("Azərbaycan Turizm və Menecment Universiteti", new UniMeta("Bakı", "dövlət")),
            Map.entry("Bakı Ali Neft Məktəbi", new UniMeta("Bakı", "dövlət")),
            Map.entry("Bakı Avrasiya Universiteti", new UniMeta("Bakı", "özəl")),
            Map.entry("Bakı Biznes Universiteti", new UniMeta("Bakı", "özəl")),
            Map.entry("Bakı Dövlət Universiteti", new UniMeta("Bakı", "dövlət")),
            Map.entry("Bakı Mühəndislik Universiteti", new UniMeta("Bakı", "özəl")),
            Map.entry("Bakı Qızlar Universiteti", new UniMeta("Bakı", "özəl")),
            Map.entry("Bakı Slavyan Universiteti", new UniMeta("Bakı", "dövlət")),
            Map.entry("Dövlət Gömrük Komitəsinin Akademiyası", new UniMeta("Bakı", "dövlət")),
            Map.entry("Gəncə Dövlət Universiteti", new UniMeta("Gəncə", "dövlət")),
            Map.entry("Lənkəran Dövlət Universiteti", new UniMeta("Lənkəran", "dövlət")),
            Map.entry("Milli Aviasiya Akademiyası", new UniMeta("Bakı", "dövlət")),
            Map.entry("Mingəçevir Dövlət Universiteti", new UniMeta("Mingəçevir", "dövlət")),
            Map.entry("Naxçıvan Dövlət Universiteti", new UniMeta("Naxçıvan", "dövlət")),
            Map.entry("Naxçıvan Müəllimlər İnstitutu", new UniMeta("Naxçıvan", "dövlət")),
            Map.entry("Qarabağ Universiteti", new UniMeta("Xankəndi", "dövlət")),
            Map.entry("Qərbi Kaspi Universiteti", new UniMeta("Bakı", "özəl")),
            Map.entry("Sumqayıt Dövlət Universiteti", new UniMeta("Sumqayıt", "dövlət")),
            Map.entry("Türkiyə-Azərbaycan Universiteti", new UniMeta("Bakı", "dövlət")),
            Map.entry("Xəzər Universiteti", new UniMeta("Bakı", "özəl"))
    );

    /** Naməlum (xəritədə olmayan, məs. yeni idxal edilmiş) universitet üçün təhlükəsiz fallback. */
    private static final UniMeta NAMƏLUM_META = new UniMeta("naməlum", "naməlum");

    private UniMeta uniMeta(String universitet) {
        return UNI_META.getOrDefault(universitet, NAMƏLUM_META);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> match(String sessionId, double bal, String qrup, String altQrup, String istek) {
        Student student = studentService.findBySessionIdOrThrow(sessionId);

        List<UniversityCutoff> hamisi = universityCutoffRepository.findByQrup(qrup);

        // I qrup Rİ/RK altqrupuna görə filtrlə — informatika istiqaməti seçilibsə yalnız İKT ixtisasları,
        // kimya istiqaməti seçilibsə yalnız qalan (RK) ixtisasları göstərilir.
        if ("1".equals(qrup) && altQrup != null) {
            if ("ri".equals(altQrup)) {
                hamisi = hamisi.stream().filter(u -> isRiIxtisas(u.getIxtisas())).toList();
            } else if ("rk".equals(altQrup)) {
                hamisi = hamisi.stream().filter(u -> !isRiIxtisas(u.getIxtisas())).toList();
            }
        }
        // III qrup DT/TC altqrupuna görə filtrlə.
        if ("3".equals(qrup) && altQrup != null) {
            if ("tc".equals(altQrup)) {
                hamisi = hamisi.stream().filter(u -> isTcIxtisas(u.getIxtisas())).toList();
            } else if ("dt".equals(altQrup)) {
                hamisi = hamisi.stream().filter(u -> !isTcIxtisas(u.getIxtisas())).toList();
            }
        }

        if (hamisi.isEmpty()) {
            Map<String, Object> boş = new LinkedHashMap<>();
            boş.put("bal", bal);
            boş.put("proqramlar", List.of());
            boş.put("serh", "");
            boş.put("mesaj", "Hələ bu qrup/istiqamət üçün universitet bal bazası əlavə edilməyib.");
            return boş;
        }

        Comparator<Match> tehsilNovuSırası = Comparator.comparingInt(m ->
                "dövlət sifarişi".equals(m.tehsilNovu()) ? 0 : "ödənişli".equals(m.tehsilNovu()) ? 1 : 2);
        Comparator<Match> ənYaxınSırası = tehsilNovuSırası.thenComparing(m -> Math.abs(m.ferq()));

        List<Match> hamısıHesablanmış = hamisi.stream()
                .map(u -> new Match(u.getUniversitet(), u.getIxtisas(), u.getMinBal(), u.getTehsilNovu(),
                        Math.round((bal - u.getMinBal()) * 10) / 10.0, bal >= u.getMinBal()))
                .toList();

        String temizIstek = istek == null ? "" : istek.trim();
        String serh;
        String mesaj = null;

        if (!temizIstek.isEmpty() && aiService.isConfigured()) {
            // Tələbənin sərbəst istəyinə (məs. "yalnız Bakı", "yalnız İT ixtisasları") görə AI
            // artıq hesablanmış namizəd siyahısından SEÇİR (uydurmur). İKİ AYRI süzgəc dəstəklənir:
            // universitet SƏVİYYƏSİ (şəhər/mülkiyyət/konkret ad) və ixtisas SƏVİYYƏSİ (sahə/istiqamət,
            // məs. "İT ixtisasları") — biri digərini əvəz etmir, hər ikisi eyni istəkdə ola bilər.
            IstekNəticesi in = getOrBuildIstekFiltri(student, bal, qrup, altQrup, temizIstek, hamısıHesablanmış);
            serh = in.serh;
            List<Match> filtrlenmis = hamısıHesablanmış;
            boolean hərhansıFiltrTətbiqOlundu = false;

            if (in.uyğunUniversitetler != null && !in.uyğunUniversitetler.isEmpty()) {
                Set<String> icaze = new HashSet<>(in.uyğunUniversitetler);
                filtrlenmis = filtrlenmis.stream().filter(m -> icaze.contains(m.universitet())).toList();
                hərhansıFiltrTətbiqOlundu = true;
            }
            if (in.ixtisasAçarSözləri != null && !in.ixtisasAçarSözləri.isEmpty()) {
                List<String> açarlar = in.ixtisasAçarSözləri.stream()
                        .map(s -> s.toLowerCase(Locale.forLanguageTag("az")))
                        .filter(s -> !s.isBlank())
                        .toList();
                if (!açarlar.isEmpty()) {
                    filtrlenmis = filtrlenmis.stream()
                            .filter(m -> {
                                String ix = m.ixtisas().toLowerCase(Locale.forLanguageTag("az"));
                                return açarlar.stream().anyMatch(ix::contains);
                            })
                            .toList();
                    hərhansıFiltrTətbiqOlundu = true;
                }
            }

            if (hərhansıFiltrTətbiqOlundu && !filtrlenmis.isEmpty()) {
                hamısıHesablanmış = filtrlenmis;
            } else {
                mesaj = "İstəyinə uyğun universitet tapılmadı — bütün nəticələr göstərilir.";
            }
        } else {
            serh = getOrBuildSerh(student, bal, qrup, altQrup, hamısıHesablanmış);
        }

        // Keçən proqramları YALNIZ ən yaxın (bala ən yaxın kəsim balına malik, ən "riskili") 10-u
        // götürmək əvəzinə, bütün marja spektrindən (sərhəddəki riskilidən tutmuş rahat keçəcəyi
        // "təhlükəsiz" seçimlərə qədər) BƏRABƏR ARALIQLI nümunə götürürük — tələbə yalnız dar bal
        // aralığında (məs. 60-60.5) deyil, həm də daha aşağı kəsim balı olan (məs. 50) rahat seçimlər
        // görsün.
        List<Match> keçənlərSıralı = hamısıHesablanmış.stream()
                .filter(Match::kecir)
                .sorted(Comparator.comparingDouble(m -> Math.abs(m.ferq())))
                .toList();
        List<Match> keçənlər = spreadSample(keçənlərSıralı, 10).stream().sorted(ənYaxınSırası).toList();
        List<Match> hədəflər = hamısıHesablanmış.stream().filter(m -> !m.kecir()).sorted(ənYaxınSırası).limit(15 - keçənlər.size()).toList();

        List<Match> proqramlar = new ArrayList<>(keçənlər);
        proqramlar.addAll(hədəflər);

        Map<String, Object> nəticə = new LinkedHashMap<>();
        nəticə.put("bal", bal);
        nəticə.put("qrup", qrup);
        nəticə.put("proqramlar", proqramlar);
        nəticə.put("serh", serh);
        if (mesaj != null) nəticə.put("mesaj", mesaj);
        return nəticə;
    }

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    private static class IstekNəticesiRaw {
        private List<String> uyğunUniversitetlər;
        private List<String> ixtisasAçarSözləri;
        private String serh;
    }

    private record IstekNəticesi(List<String> uyğunUniversitetler, List<String> ixtisasAçarSözləri, String serh) {
    }

    private IstekNəticesi getOrBuildIstekFiltri(Student student, double bal, String qrup, String altQrup,
                                                 String istek, List<Match> namizedler) {
        String açar = "istek|" + bal + "|" + qrup + "|" + altQrup + "|" + istek;
        NəticəCacheEntry cached = nəticəCache.get(student.getId());
        if (cached != null && cached.açar().equals(açar)) {
            return new IstekNəticesi(cached.uyğunUniversitetler(), cached.ixtisasAçarSözləri(), cached.serh());
        }

        // VACİD (Groq pulsuz tier TPM dərsi): Azərbaycan hərfləri (ə/ü/ş/ı...) gpt-oss tokenizer-ində
        // hərf başına ~1 token edir — 40 proqram sətrindən ibarət köhnə prompt ~9400 token idi və
        // promptun ÖZÜ tək 8000 TPM limitini keçirib 413 alırdı. Filtrləmə universitet SƏVİYYƏSİNDƏ
        // aparıldığı üçün proqram detalları lazım deyil: yalnız fərqli universitet adları + ixtisas
        // növləri göndərilir (~1500 token). max_tokens də kiçik saxlanılır (cəmi TPM-ə sığsın).
        // VACİB: şəhər/dövlət-özəl AI-nın öz yaddaşından "təxmin" etmir — aşağıda UNI_META xəritəsindən
        // əvvəlcədən hazır fakt kimi verilir, çünki Groq-un açıq modeli bu faktları etibarlı bilmir və
        // "yalnız Bakı" kimi istəklərdə boş/səhv cavab qaytarırdı.
        List<String> universitetAdlari = namizedler.stream().map(Match::universitet).distinct()
                .map(ad -> {
                    UniMeta m = uniMeta(ad);
                    return "%s (şəhər: %s, mülkiyyət: %s)".formatted(ad, m.şəhər(), m.mülkiyyət());
                })
                .toList();
        List<String> ixtisasNövləri = namizedler.stream().map(Match::ixtisas).distinct().limit(15).toList();

        String prompt = """
                Bir TQDK/Magistr şagirdi universitet seçimi üçün əlavə istək bildirib: "%s"

                Şagird: %s, Bal: %.1f%s, Qrup: %s

                Namizəd universitetlərin TAM siyahısı, hər birinin şəhəri və mülkiyyət növü YANINDA verilib
                (YALNIZ bunlardan seç, başqa ad UYDURMA, şəhər/mülkiyyəti verilən məlumatdan istifadə et,
                öz yaddaşından təxmin etmə — "naməlum" olanlar üçün şəhər/mülkiyyət tələb edən istəyə görə
                qərar vermə, o universiteti nə daxil, nə xaric et, sadəcə ATLA):
                %s

                Bu universitetlərdəki namizəd ixtisaslar:
                %s

                Tapşırıq (istəkdə İKİ FƏRQLİ növ meyar ola bilər, biri digərini əvəz etmir — hər ikisi eyni istəkdə birgə ola bilər):
                1. İstəkdə universitet SƏVİYYƏSİNDƏ meyar (şəhər, dövlət/özəl, konkret universitet adı) varsa, uyğun universitetlərin adlarını DƏQİQ siyahıdakı kimi "uyğunUniversitetlər"-ə yaz (mötərizədəki şəhər/mülkiyyət hissəsini adın özünə DAXİL ETMƏ, adları HƏRFİNƏ qədər siyahıdakı variantla köçür). Belə meyar YOXDURSA, "uyğunUniversitetlər"-i BOŞ burax (bütün universitetlər arasından axtarılsın deməkdir, "heç biri" demək DEYİL).
                2. İstəkdə ixtisas SAHƏSİ/istiqaməti (məs. İT, tibb, hüquq, iqtisadiyyat, pedaqoji) varsa, bu sahəyə aid 5-10 Azərbaycan sözü/kök (kiçik hərflə, ixtisas adının İÇİNDƏ axtarılacaq — məs. İT üçün: informatika, kompüter, proqram, kibertəhlükəsizlik, şəbəkə, süni intellekt, verilənlər bazası) "ixtisasAçarSözləri"-nə yaz. HƏDDİNDƏN ARTIQ ÜMUMİ tək sözlərdən (məs. tənha "texnologiya", "sistem", "informasiya") ÇƏKİN — bunlar əlaqəsiz ixtisasları da tuta bilər (məs. "kimya texnologiyası"). Belə meyar YOXDURSA, boş massiv burax.
                3. 2-3 cümləlik qısa tövsiyə yaz (Azərbaycan dilində, markdown olmadan).

                Yalnız bu JSON formatında qaytar: {"uyğunUniversitetlər": ["ad1","ad2"], "ixtisasAçarSözləri": ["söz1","söz2"], "serh": "..."}"""
                .formatted(istek, student.getAd(), bal, balOlcusu(qrup), "magistr".equals(qrup) ? "Magistr" : qrup + "-ci qrup",
                        String.join("\n", universitetAdlari), String.join(", ", ixtisasNövləri));

        List<String> uyğunlar = List.of();
        List<String> ixtisasAçarSözləri = List.of();
        String serh = "";
        boolean aiCavabVerdi = false;
        try {
            // VACİB: max_tokens reasoning tokenlərini də əhatə edir — kiçik limitdə cavab
            // finish_reason:"length" ilə YARIMÇIQ kəsilir (JSON parse xətası). Gemini-də 6000.
            String cleaned = aiService.rawJsonPrompt(
                    AiPrompts.UNIVERSITY_SYSTEM + AiPrompts.JSON,
                    prompt, 6000);
            IstekNəticesiRaw raw = JsonUtil.fromJson(cleaned, IstekNəticesiRaw.class);
            if (raw != null) {
                aiCavabVerdi = true;
                if (raw.getUyğunUniversitetlər() != null && !raw.getUyğunUniversitetlər().isEmpty()) {
                    // Təhlükəsizlik: AI-nın qaytardığı adları ƏSL namizəd siyahısına bərpa et (fuzzy).
                    uyğunlar = etibarlıAdlaraÇevir(raw.getUyğunUniversitetlər(), namizedler);
                }
                if (raw.getIxtisasAçarSözləri() != null) {
                    ixtisasAçarSözləri = raw.getIxtisasAçarSözləri();
                }
                serh = raw.getSerh() != null ? raw.getSerh() : "";
            }
        } catch (Exception e) {
            // Səssiz udma YOX — kök səbəb (məs. Groq 413 TPM) loqsuz itirdikdə debug olunmur.
            log.warn("Universitet istək filtri AI çağırışı alınmadı: {}", e.getMessage());
        }

        if (aiCavabVerdi) {
            nəticəCache.put(student.getId(),
                    new NəticəCacheEntry(uyğunlar, ixtisasAçarSözləri, serh, açar, System.currentTimeMillis()));
        }
        return new IstekNəticesi(uyğunlar, ixtisasAçarSözləri, serh);
    }

    private String getOrBuildSerh(Student student, double bal, String qrup, String altQrup, List<Match> ənYaxşılar) {
        if (!aiService.isConfigured()) return "";

        String açar = bal + "|" + qrup + "|" + altQrup;
        NəticəCacheEntry cached = nəticəCache.get(student.getId());
        if (cached != null && cached.açar().equals(açar)) {
            return cached.serh();
        }

        String siyahı = ənYaxşılar.stream().limit(5)
                .map(m -> "- %s (%s): keçid balı %.1f, sənin balın %.1f (%s)".formatted(
                        m.universitet(), m.ixtisas(), m.minBal(), bal, m.kecir() ? "keçirsən" : "keçmirsən"))
                .reduce((a, b) -> a + "\n" + b).orElse("");

        String prompt = """
                Bir TQDK/Magistr şagirdinə universitet seçimi üzrə qısa tövsiyə yaz.
                Şagird: %s
                Bal: %.1f%s
                Qrup: %s

                Ən uyğun proqramlar (bal ardıcıllığı ilə):
                %s

                2-3 cümlə ilə, Azərbaycan dilində, real və konkret tövsiyə ver — hansı proqramlara can atsın,
                hansını ehtiyat variantı kimi saxlasın. Yalnız mətn, markdown olmasın, uydurma universitet adı yazma."""
                .formatted(student.getAd(), bal, balOlcusu(qrup), "magistr".equals(qrup) ? "Magistr" : qrup + "-ci qrup", siyahı);

        String serh;
        try {
            serh = aiService.rawText(AiPrompts.UNIVERSITY_SYSTEM, prompt, 4000);
        } catch (Exception e) {
            log.warn("Universitet AI şərhi alınmadı: {}", e.getMessage());
            serh = "";
        }

        nəticəCache.put(student.getId(), new NəticəCacheEntry(List.of(), List.of(), serh, açar, System.currentTimeMillis()));
        return serh;
    }

    /** Universitet adlarında hər yerdə işləyən ümumi sözlər — tək başına iki adı "uyğun" etməyə çatmır. */
    private static final Set<String> AD_ÜMUMİ_SÖZLƏRİ = Set.of(
            "universiteti", "akademiyası", "institutu", "konservatoriyası", "məktəbi",
            "azərbaycan", "bakı", "dövlət", "milli", "elm", "tədris");

    /** AI şərh promptlarında "Bal: X/Y" göstərmək üçün — qrupdan asılı olaraq maksimal bal fərqlidir
     * (bakalavr 1-4: 700, 5-ci qrup: 300, magistr: sabit maksimum yoxdur, ~0-100 aralığında açıq şkala).
     * Əvvəllər hər yerdə hardcode "/700" idi — magistr/5-ci qrup üçün yanlış idi. */
    private static String balOlcusu(String qrup) {
        if ("5".equals(qrup)) return "/300";
        if ("magistr".equals(qrup)) return "";
        return "/700";
    }

    private String normAd(String ad) {
        return ad == null ? "" : ad.toLowerCase(Locale.forLanguageTag("az"))
                .replaceAll("[^\\p{L}\\p{Nd}]+", " ").trim();
    }

    private Set<String> adSözləri(String ad) {
        String n = normAd(ad);
        return n.isEmpty() ? Set.of() : new LinkedHashSet<>(Arrays.asList(n.split(" ")));
    }

    /**
     * AI-nın qaytardığı universitet adlarını ƏSL namizəd siyahısındakı orijinal adlara bərpa edir.
     * Modeller adları öz dünyabaxışındakı rəsmi varianta dəyişə bilir (məs. DB-də
     * "Azərbaycan Texniki Universiteti" olanda AI "Azərbaycan DÖVLƏT Texniki Universiteti" yazır) —
     * sərt bərabərlik yoxlaması bütün siyahını səssizcə atır. Buna görə söz-çoxluğu uyğunluğu
     * istifadə olunur: adlardan biri digərinin söz alt/üst-çoxluğudursa VƏ ortaq sözlər arasında
     * ən azı bir FƏRQLƏNDİRİCİ söz varsa (ümumi "universiteti/bakı/dövlət..." deyil), uyğun sayılır.
     * Siyahıda heç nə ilə uyğunlaşmayan ad (məs. uydurma "Bakı Mədəniyyət Universiteti") atılır.
     */
    private List<String> etibarlıAdlaraÇevir(List<String> aiAdları, List<Match> namizedler) {
        LinkedHashMap<String, Set<String>> namizədSözləri = new LinkedHashMap<>();
        for (Match m : namizedler) {
            namizədSözləri.putIfAbsent(m.universitet(), adSözləri(m.universitet()));
        }
        LinkedHashSet<String> bərpaEdilmiş = new LinkedHashSet<>();
        for (String aiAd : aiAdları) {
            Set<String> aS = adSözləri(aiAd);
            if (aS.isEmpty()) continue;
            for (var e : namizədSözləri.entrySet()) {
                Set<String> nS = e.getValue();
                boolean altÇoxluq = nS.containsAll(aS);
                boolean üstÇoxluq = aS.containsAll(nS);
                if (!altÇoxluq && !üstÇoxluq) continue;
                Set<String> ortaq = new LinkedHashSet<>(aS);
                ortaq.retainAll(nS);
                boolean fərqləndiriciVar = ortaq.stream().anyMatch(söz -> !AD_ÜMUMİ_SÖZLƏRİ.contains(söz));
                if (fərqləndiriciVar) {
                    bərpaEdilmiş.add(e.getKey());
                    break;
                }
            }
        }
        return new ArrayList<>(bərpaEdilmiş);
    }
}
