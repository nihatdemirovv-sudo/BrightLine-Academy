package com.aitqdk.magistr.service;

import com.aitqdk.magistr.entity.ScoreSimulation;
import com.aitqdk.magistr.entity.Student;
import com.aitqdk.magistr.exception.ApiException;
import com.aitqdk.magistr.repository.ScoreSimulationRepository;
import com.aitqdk.magistr.util.JsonUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

/** score-simulator/route.ts-in Java qarşılığı — DİM rəsmi TQDK bal hesablama formulası. */
@Service
@RequiredArgsConstructor
public class ScoreSimulatorService {

    private final StudentService studentService;
    private final ScoreSimulationRepository scoreSimulationRepository;

    private record FennKonfiq(String fenn, int sualSayi, String merhele, double emsal, int maksimalBal,
                               int qapaliSayi, int aciqKodSayi, int aciqYaziliSayi, String qisa) {
    }

    private static final int BLOK_QAPALI = 22, BLOK_ACIQ_KOD = 5, BLOK_ACIQ_YAZILI = 3;

    private static final List<FennKonfiq> BURAXILIS_FENLERI = List.of(
            new FennKonfiq("Azərbaycan dili", 30, "buraxilis", 1, 100, 20, 0, 10, "20 qapalı (dil qaydaları + mətn) + 10 yazılı (mətn üzərində)"),
            new FennKonfiq("Riyaziyyat", 25, "buraxilis", 1, 100, 13, 5, 7, "13 qapalı + 5 açıq kod + 7 yazılı"),
            new FennKonfiq("Xarici dil", 30, "buraxilis", 1, 100, 23, 0, 7, "23 qapalı (dinləyib-anlama, oxuyub-anlama) + 7 yazılı")
    );

    private static final Map<String, List<FennKonfiq>> BLOK_KONFIG = Map.of(
            "1", List.of(
                    new FennKonfiq("Riyaziyyat", 30, "blok", 1.5, 150, BLOK_QAPALI, BLOK_ACIQ_KOD, BLOK_ACIQ_YAZILI, null),
                    new FennKonfiq("Fizika", 30, "blok", 1.5, 150, BLOK_QAPALI, BLOK_ACIQ_KOD, BLOK_ACIQ_YAZILI, null),
                    new FennKonfiq("Kimya", 30, "blok", 1.0, 100, BLOK_QAPALI, BLOK_ACIQ_KOD, BLOK_ACIQ_YAZILI, null)),
            "1-i", List.of(
                    new FennKonfiq("Riyaziyyat", 30, "blok", 1.5, 150, BLOK_QAPALI, BLOK_ACIQ_KOD, BLOK_ACIQ_YAZILI, null),
                    new FennKonfiq("Fizika", 30, "blok", 1.5, 150, BLOK_QAPALI, BLOK_ACIQ_KOD, BLOK_ACIQ_YAZILI, null),
                    new FennKonfiq("İnformatika", 30, "blok", 1.0, 100, BLOK_QAPALI, BLOK_ACIQ_KOD, BLOK_ACIQ_YAZILI, null)),
            "2", List.of(
                    new FennKonfiq("Riyaziyyat", 30, "blok", 1.5, 150, BLOK_QAPALI, BLOK_ACIQ_KOD, BLOK_ACIQ_YAZILI, null),
                    new FennKonfiq("Coğrafiya", 30, "blok", 1.5, 150, BLOK_QAPALI, BLOK_ACIQ_KOD, BLOK_ACIQ_YAZILI, null),
                    new FennKonfiq("Tarix", 30, "blok", 1.0, 100, BLOK_QAPALI, BLOK_ACIQ_KOD, BLOK_ACIQ_YAZILI, null)),
            "3", List.of(
                    new FennKonfiq("Azərbaycan dili", 30, "blok", 1.5, 150, BLOK_QAPALI, BLOK_ACIQ_KOD, BLOK_ACIQ_YAZILI, null),
                    new FennKonfiq("Tarix", 30, "blok", 1.5, 150, BLOK_QAPALI, BLOK_ACIQ_KOD, BLOK_ACIQ_YAZILI, null),
                    new FennKonfiq("Ədəbiyyat", 30, "blok", 1.0, 100, BLOK_QAPALI, BLOK_ACIQ_KOD, BLOK_ACIQ_YAZILI, null)),
            "4", List.of(
                    new FennKonfiq("Biologiya", 30, "blok", 1.5, 150, BLOK_QAPALI, BLOK_ACIQ_KOD, BLOK_ACIQ_YAZILI, null),
                    new FennKonfiq("Kimya", 30, "blok", 1.0, 100, BLOK_QAPALI, BLOK_ACIQ_KOD, BLOK_ACIQ_YAZILI, null),
                    new FennKonfiq("Fizika", 30, "blok", 1.0, 100, BLOK_QAPALI, BLOK_ACIQ_KOD, BLOK_ACIQ_YAZILI, null))
    );

    private List<FennKonfiq> getKonfiq(String qrup) {
        // 5-ci qrup tək mərhələlidir (yalnız Buraxılış, blok yoxdur) — digər qruplar üçün
        // naməlum qrup gələrsə 1-ci qrupun blok konfiqinə fallback edilir.
        List<FennKonfiq> blok = "5".equals(qrup) ? List.of() : BLOK_KONFIG.getOrDefault(qrup, BLOK_KONFIG.get("1"));
        List<FennKonfiq> all = new ArrayList<>(BURAXILIS_FENLERI);
        all.addAll(blok);
        return all;
    }

    private List<Map<String, Object>> konfiqAsList(List<FennKonfiq> konfiq) {
        return konfiq.stream().map(f -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("fenn", f.fenn());
            m.put("sualSayi", f.sualSayi());
            m.put("merhele", f.merhele());
            m.put("emsal", f.emsal());
            m.put("maksimalBal", f.maksimalBal());
            m.put("qisa", f.qisa());
            m.put("qapaliSayi", f.qapaliSayi());
            m.put("aciqKodSayi", f.aciqKodSayi());
            m.put("aciqYaziliSayi", f.aciqYaziliSayi());
            return m;
        }).toList();
    }

    // === Şagirdin daxil etdiyi fənn nəticəsi ===
    public record FennNeticeInput(String fenn, Integer dogru, Integer sehv, Integer bos, Integer toplamSual,
                                   String merhele, Double emsal, Integer qapaliDogru, Integer qapaliYanlis,
                                   Integer aciqKodDogru, Double yaziliDogru) {
    }

    private record HesablananFenn(String fenn, double bal, int maksimal, int dəqiqlik, String merhele,
                                   double emsal, String sualTipi) {
    }

    private record HesabNeticesi(double bal, int maksimalBal, double buraxilisBal, double blokBal,
                                  List<HesablananFenn> fennBallari) {
    }

    private HesabNeticesi hesablaBal(List<FennNeticeInput> fennNetice) {
        double umumiBal = 0, buraxilisBal = 0, blokBal = 0;
        List<HesablananFenn> fennBallari = new ArrayList<>();

        for (FennNeticeInput f : fennNetice) {
            double emsal = f.emsal() != null ? f.emsal() : 1.0;
            double fennBal;
            int maksimal;
            String sualTipi = null;
            int dogru = f.dogru() != null ? f.dogru() : 0;
            int toplamSual = f.toplamSual() != null ? f.toplamSual() : 0;
            String merhele = f.merhele() != null ? f.merhele() : "blok";

            if ("buraxilis".equals(merhele)) {
                if (f.qapaliDogru() != null && f.yaziliDogru() != null) {
                    int dQ = f.qapaliDogru();
                    int dK = f.aciqKodDogru() != null ? f.aciqKodDogru() : 0;
                    double dY = f.yaziliDogru();
                    int maxRaw;
                    double numerator;
                    if ("Riyaziyyat".equals(f.fenn())) {
                        numerator = dQ + dK + 2.0 * dY;
                        maxRaw = 32;
                        sualTipi = "qapalı: %d/13, kod: %d/5, yazılı: %.2f/7 (2×)".formatted(dQ, dK, dY);
                    } else if ("Xarici dil".equals(f.fenn())) {
                        numerator = dQ + 2.0 * dY;
                        maxRaw = 37;
                        sualTipi = "qapalı: %d/23, yazılı: %.2f/7 (2×)".formatted(dQ, dY);
                    } else {
                        numerator = dQ + 2.0 * dY;
                        maxRaw = 40;
                        sualTipi = "qapalı: %d/20, yazılı: %.2f/10 (2×)".formatted(dQ, dY);
                    }
                    fennBal = Math.round((numerator / maxRaw) * 100 * 10) / 10.0;
                    maksimal = 100;
                } else {
                    maksimal = 100;
                    fennBal = toplamSual > 0 ? Math.round((double) dogru / toplamSual * 100 * 10) / 10.0 : 0;
                    sualTipi = "Sadə giriş";
                }
            } else {
                if (f.qapaliDogru() != null && f.qapaliYanlis() != null) {
                    int dQ = f.qapaliDogru();
                    int yQ = f.qapaliYanlis();
                    int dK = f.aciqKodDogru() != null ? f.aciqKodDogru() : 0;
                    double dY = f.yaziliDogru() != null ? f.yaziliDogru() : 0;
                    double nbqRaw = Math.max(0, dQ - yQ / 4.0);
                    double nbaRaw = dK + 2.0 * dY;
                    double nb = (nbqRaw + nbaRaw) / 33.0 * 100;
                    fennBal = Math.max(0, Math.round(nb * emsal * 10) / 10.0);
                    maksimal = (int) Math.round(100 * emsal);
                    sualTipi = "qapalı: %d/%d, yanlış: %d, kod: %d/%d, yazılı: %.2f/%d"
                            .formatted(dQ, BLOK_QAPALI, yQ, dK, BLOK_ACIQ_KOD, dY, BLOK_ACIQ_YAZILI);
                } else {
                    int toplam = toplamSual > 0 ? toplamSual : 30;
                    int sehv = f.sehv() != null ? f.sehv() : 0;
                    int qapaliToplam = 22, aciqToplam = 8;
                    int qapaliDogru = Math.min(qapaliToplam, Math.round((float) dogru * qapaliToplam / toplam));
                    int qapaliYanlis = Math.min(qapaliToplam - qapaliDogru, Math.round((float) sehv * qapaliToplam / toplam));
                    int aciqDogru = dogru - qapaliDogru;
                    double nbqRaw = Math.max(0, qapaliDogru - qapaliYanlis / 4.0);
                    double nbaRaw = Math.min(aciqToplam, aciqDogru);
                    double nb = (nbqRaw + nbaRaw) / 33.0 * 100;
                    fennBal = Math.max(0, Math.round(nb * emsal * 10) / 10.0);
                    maksimal = (int) Math.round(100 * emsal);
                    sualTipi = "Sadə giriş (proporsional)";
                }
            }

            int dəqiqlik = toplamSual > 0 ? Math.round(100f * dogru / toplamSual) : 0;
            fennBallari.add(new HesablananFenn(f.fenn(), fennBal, maksimal, dəqiqlik, merhele, emsal, sualTipi));

            if ("buraxilis".equals(merhele)) buraxilisBal += fennBal;
            else blokBal += fennBal;
            umumiBal += fennBal;
        }

        // 5-ci qrupda blok mərhələsi yoxdur — yalnız buraxılış sətirləri gələcək, ümumi max 300 olur.
        boolean blokVarMı = fennNetice.stream().anyMatch(f -> "blok".equals(f.merhele()));
        int maksimalBal = blokVarMı ? 700 : 300;

        return new HesabNeticesi(Math.round(umumiBal * 10) / 10.0, maksimalBal,
                Math.round(buraxilisBal * 10) / 10.0, Math.round(blokBal * 10) / 10.0, fennBallari);
    }

    /** Bal analizi mətnini AI-sız, tamamilə hesablanmış rəqəmlərdən qurur. */
    private String buildAnaliz(HesabNeticesi hesab, int dəqiqlik, int qebulEhtimali) {
        String ümumi;
        if (dəqiqlik >= 85) ümumi = "Əla nəticədir — hədəf balına çox yaxınsan.";
        else if (dəqiqlik >= 70) ümumi = "Yaxşı nəticədir, hələ inkişaf üçün yer var.";
        else if (dəqiqlik >= 50) ümumi = "Orta səviyyədədir — daha çox məşq lazımdır.";
        else ümumi = "Hələ başlanğıc mərhələdəsən, ciddi hazırlıq lazımdır.";

        List<HesablananFenn> sortedDesc = hesab.fennBallari().stream()
                .sorted(Comparator.comparingInt(HesablananFenn::dəqiqlik).reversed()).toList();
        List<HesablananFenn> sortedAsc = hesab.fennBallari().stream()
                .sorted(Comparator.comparingInt(HesablananFenn::dəqiqlik)).toList();

        String güclü = sortedDesc.stream()
                .filter(f -> f.dəqiqlik() >= 70)
                .limit(2)
                .map(HesablananFenn::fenn)
                .reduce((a, b) -> a + " və " + b).orElse(null);

        String zəif = sortedAsc.stream()
                .filter(f -> f.dəqiqlik() < 50)
                .limit(2)
                .map(HesablananFenn::fenn)
                .reduce((a, b) -> a + " və " + b).orElse(null);

        StringBuilder sb = new StringBuilder(ümumi);
        sb.append(" Qəbul ehtimalın təxminən %d%%.".formatted(qebulEhtimali));
        if (güclü != null) {
            sb.append(" Güclü tərəfin: %s.".formatted(güclü));
        }
        if (zəif != null) {
            sb.append(" Zəif tərəfin: %s — bu fənlərə əlavə vaxt ayır.".formatted(zəif));
        } else if (güclü == null) {
            sb.append(" Bütün fənlərdə tarazlı işləmisən, ən aşağı balı olan fənnə diqqət et.");
        }
        return sb.toString();
    }

    @Transactional
    public Map<String, Object> get(String sessionId) {
        Student student = studentService.findBySessionIdOrThrow(sessionId);
        List<ScoreSimulation> simulations = scoreSimulationRepository.findByStudentIdOrderByCreatedAtDesc(
                student.getId(), PageRequest.of(0, 10));
        List<FennKonfiq> konfiq = getKonfiq(student.getQrup());

        Map<String, Object> qrupKonfiq = new LinkedHashMap<>();
        qrupKonfiq.put("maksimalBal", "5".equals(student.getQrup()) ? 300 : 700);
        qrupKonfiq.put("fennler", konfiqAsList(konfiq));

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("qrupKonfiq", qrupKonfiq);
        result.put("simulyasiyalar", simulations);
        return result;
    }

    public record ScoreSimulatorRequest(String sessionId, List<FennNeticeInput> fennNetice) {
    }

    @Transactional
    public Map<String, Object> submit(ScoreSimulatorRequest req) {
        if (req.sessionId() == null || req.fennNetice() == null || req.fennNetice().isEmpty()) {
            throw ApiException.badRequest("parametrlər çatışmır");
        }
        Student student = studentService.findBySessionIdOrThrow(req.sessionId());
        List<FennKonfiq> konfiq = getKonfiq(student.getQrup());

        List<FennNeticeInput> enriched = req.fennNetice().stream().map(f -> {
            FennKonfiq matched = konfiq.stream()
                    .filter(k -> k.fenn().equals(f.fenn()) && k.merhele().equals(f.merhele() != null ? f.merhele() : "blok"))
                    .findFirst().orElse(null);
            return new FennNeticeInput(
                    f.fenn(), f.dogru(), f.sehv(), f.bos(),
                    f.toplamSual() != null ? f.toplamSual() : (matched != null ? matched.sualSayi() : 30),
                    f.merhele() != null ? f.merhele() : "blok",
                    f.emsal() != null ? f.emsal() : (matched != null ? matched.emsal() : 1.0),
                    f.qapaliDogru(), f.qapaliYanlis(), f.aciqKodDogru(), f.yaziliDogru());
        }).toList();

        HesabNeticesi hesab = hesablaBal(enriched);
        int dəqiqlik = (int) Math.round(hesab.bal() / hesab.maksimalBal() * 100);
        int qebulEhtimali = Math.min(95, Math.max(0, Math.round(dəqiqlik * 1.3f)));

        String analiz = buildAnaliz(hesab, dəqiqlik, qebulEhtimali);

        ScoreSimulation sim = new ScoreSimulation();
        sim.setStudentId(student.getId());
        sim.setNov("magistr".equals(student.getQrup()) ? "magistr" : "tqdk");
        sim.setFennNetice(JsonUtil.toJson(enriched));
        sim.setBal(hesab.bal());
        sim.setMaksimalBal(hesab.maksimalBal());
        sim.setQebulEhtimali(qebulEhtimali);
        sim.setAnaliz(analiz);
        sim = scoreSimulationRepository.save(sim);

        Map<String, Object> qrupKonfiq = new LinkedHashMap<>();
        qrupKonfiq.put("maksimalBal", hesab.maksimalBal());
        qrupKonfiq.put("fennler", konfiqAsList(konfiq));

        Map<String, Object> result = JsonUtil.asMap(sim);
        result.put("fennNetice", enriched);
        result.put("fennBallari", hesab.fennBallari());
        result.put("buraxilisBal", hesab.buraxilisBal());
        result.put("blokBal", hesab.blokBal());
        result.put("qrupKonfiq", qrupKonfiq);
        return result;
    }
}
