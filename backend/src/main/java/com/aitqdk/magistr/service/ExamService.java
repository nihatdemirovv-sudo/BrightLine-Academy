package com.aitqdk.magistr.service;

import com.aitqdk.magistr.ai.AiService;
import com.aitqdk.magistr.dto.ExamQuestion;
import com.aitqdk.magistr.entity.*;
import com.aitqdk.magistr.exception.ApiException;
import com.aitqdk.magistr.repository.*;
import com.aitqdk.magistr.util.JsonUtil;
import com.fasterxml.jackson.core.type.TypeReference;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class ExamService {

    private static final int DOGRU_BAL = 4;
    private static final int SEHV_BAL = -1;

    private final AiService aiService;
    private final StudentService studentService;
    private final StudentRepository studentRepository;
    private final ExamConfigRepository examConfigRepository;
    private final ExamAttemptRepository examAttemptRepository;
    private final SubjectProgressRepository progressRepository;
    private final ActivityLogService activityLogService;

    public record ExamConfigRequest(String sessionId, String imtahanTarixi, String nov,
                                     Integer müddet, Integer sualSayi, Integer kecidBali) {
    }

    @Transactional
    public Map<String, Object> getConfig(String sessionId) {
        Student student = studentService.findBySessionIdOrThrow(sessionId);
        ExamConfig config = examConfigRepository.findByStudentId(student.getId()).orElse(null);
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("config", config);
        result.put("qrup", student.getQrup());
        return result;
    }

    @Transactional
    public ExamConfig upsertConfig(ExamConfigRequest req) {
        if (req.sessionId() == null || req.imtahanTarixi() == null) throw ApiException.badRequest("parametrlər çatışmır");
        Student student = studentService.findBySessionIdOrThrow(req.sessionId());

        ExamConfig config = examConfigRepository.findByStudentId(student.getId())
                .orElseGet(() -> {
                    ExamConfig c = new ExamConfig();
                    c.setStudentId(student.getId());
                    return c;
                });
        config.setImtahanTarixi(req.imtahanTarixi());
        if (req.nov() != null) config.setNov(req.nov());
        if (req.müddet() != null) config.setMuddet(req.müddet());
        if (req.sualSayi() != null) config.setSualSayi(req.sualSayi());
        if (req.kecidBali() != null) config.setKecidBali(req.kecidBali());
        return examConfigRepository.save(config);
    }

    public record GenerateExamRequest(String sessionId, List<String> fennler) {
    }

    @Transactional
    public Map<String, Object> generateExam(GenerateExamRequest req) {
        if (req.sessionId() == null) throw ApiException.badRequest("sessionId tələb olunur");
        Student student = studentService.findBySessionIdOrThrow(req.sessionId());
        ExamConfig config = examConfigRepository.findByStudentId(student.getId()).orElse(null);

        int sualSayi = config != null ? config.getSualSayi() : 30;

        AiService.ExamSetResult examSet;
        try {
            examSet = aiService.generateExamSet(student.getQrup(), sualSayi, req.fennler());
        } catch (Exception e) {
            log.error("İmtahan generasiyası xətası:", e);
            throw ApiException.server("İmtahan yaradıla bilmədi.");
        }
        if (examSet.suallar().isEmpty()) {
            throw ApiException.server("Sual yaradıla bilmədi. Yenidən cəhd edin.");
        }

        ExamAttempt attempt = new ExamAttempt();
        attempt.setStudentId(student.getId());
        attempt.setSualSayi(examSet.suallar().size());
        attempt.setSuallar(JsonUtil.toJson(examSet.suallar()));
        attempt.setFennBolugu(JsonUtil.toJson(examSet.fennBolugu()));
        attempt.setTamamlandi(false);
        attempt = examAttemptRepository.save(attempt);

        activityLogService.log(student.getId(), "exam_start", sualSayi + " suallıq simulyasiya başladı");

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("attemptId", attempt.getId());
        result.put("suallar", examSet.suallar());
        result.put("fennBolugu", examSet.fennBolugu());
        result.put("sualSayi", examSet.suallar().size());
        result.put("müddet", config != null ? config.getMuddet() : 180);
        return result;
    }

    @Transactional
    public Map<String, Object> history(String sessionId) {
        Student student = studentService.findBySessionIdOrThrow(sessionId);
        List<ExamAttempt> attempts = examAttemptRepository.findByStudentIdAndTamamlandiTrueOrderByCreatedAtDesc(
                student.getId(), PageRequest.of(0, 20));
        ExamConfig config = examConfigRepository.findByStudentId(student.getId()).orElse(null);

        List<Map<String, Object>> cəhdlər = new ArrayList<>();
        for (ExamAttempt a : attempts) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", a.getId());
            m.put("baslamaVaxti", a.getBaslamaVaxti());
            m.put("bitmeVaxti", a.getBitmeVaxti());
            m.put("sualSayi", a.getSualSayi());
            m.put("dogruCavab", a.getDogruCavab());
            m.put("sehvCavab", a.getSehvCavab());
            m.put("bosCavab", a.getBosCavab());
            m.put("bal", a.getBal());
            m.put("müddetSan", a.getMuddetSan());
            m.put("fennBolugu", JsonUtil.fromJson(a.getFennBolugu(), Map.class));
            cəhdlər.add(m);
        }

        int toplamCəhd = cəhdlər.size();
        int enYaxşıBal = toplamCəhd > 0 ? cəhdlər.stream().mapToInt(c -> (Integer) c.get("bal")).max().orElse(0) : 0;
        int ortaBal = toplamCəhd > 0 ? (int) Math.round(cəhdlər.stream().mapToInt(c -> (Integer) c.get("bal")).average().orElse(0)) : 0;
        int sonBal = toplamCəhd > 0 ? (Integer) cəhdlər.get(0).get("bal") : 0;

        Integer günQalıb = null;
        if (config != null) {
            LocalDate imtahan = LocalDate.parse(config.getImtahanTarixi());
            günQalıb = (int) ChronoUnit.DAYS.between(LocalDate.now(), imtahan);
        }

        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("toplamCəhd", toplamCəhd);
        stats.put("enYaxşıBal", enYaxşıBal);
        stats.put("ortaBal", ortaBal);
        stats.put("sonBal", sonBal);
        stats.put("günQalıb", günQalıb);
        stats.put("kecidBali", config != null ? config.getKecidBali() : 200);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("cəhdlər", cəhdlər);
        result.put("config", config);
        result.put("stats", stats);
        return result;
    }

    public record SubmitExamRequest(String attemptId, Map<String, String> cavablar, Integer müddetSan) {
    }

    @Transactional
    public Map<String, Object> submit(SubmitExamRequest req) {
        if (req.attemptId() == null || req.cavablar() == null) throw ApiException.badRequest("parametrlər çatışmır");
        ExamAttempt attempt = examAttemptRepository.findById(req.attemptId())
                .orElseThrow(() -> ApiException.notFound("Cəhd tapılmadı"));
        Student student = studentRepository.findById(attempt.getStudentId())
                .orElseThrow(() -> ApiException.notFound("Tapılmadı"));

        List<ExamQuestion> suallar = JsonUtil.fromJson(attempt.getSuallar(), new TypeReference<List<ExamQuestion>>() {
        });

        int dogru = 0, sehv = 0, bos = 0, bal = 0;
        Map<String, int[]> fennNetice = new LinkedHashMap<>(); // [dogru, sehv, bos]

        for (int idx = 0; idx < suallar.size(); idx++) {
            ExamQuestion sual = suallar.get(idx);
            String cavab = req.cavablar().get(String.valueOf(idx));
            String fenn = sual.getFenn() != null ? sual.getFenn() : "Ümumi";
            fennNetice.putIfAbsent(fenn, new int[3]);
            int[] n = fennNetice.get(fenn);

            if (cavab == null || cavab.isBlank()) {
                bos++;
                n[2]++;
            } else if (cavab.equals(sual.getDogruCavab())) {
                dogru++;
                bal += DOGRU_BAL;
                n[0]++;
            } else {
                sehv++;
                bal += SEHV_BAL;
                n[1]++;
            }
        }

        attempt.setBitmeVaxti(Instant.now());
        attempt.setCavablar(JsonUtil.toJson(req.cavablar()));
        attempt.setDogruCavab(dogru);
        attempt.setSehvCavab(sehv);
        attempt.setBosCavab(bos);
        attempt.setBal(bal);
        attempt.setMuddetSan(req.müddetSan() != null ? req.müddetSan() : 0);
        attempt.setTamamlandi(true);
        examAttemptRepository.save(attempt);

        for (var entry : fennNetice.entrySet()) {
            String fenn = entry.getKey();
            int[] n = entry.getValue();
            SubjectProgress record = progressRepository.findByStudentIdAndFenn(student.getId(), fenn)
                    .orElseGet(() -> {
                        SubjectProgress p = new SubjectProgress();
                        p.setStudentId(student.getId());
                        p.setFenn(fenn);
                        return progressRepository.save(p);
                    });
            int yeniDogru = record.getDogruCavab() + n[0];
            int yeniHall = record.getHallSualSayi() + n[0] + n[1];
            int yeniSeviyye = Math.min(100, Math.round(100f * yeniDogru / Math.max(yeniHall, 1)));
            int yeniYildiz = yeniSeviyye >= 90 ? 5 : yeniSeviyye >= 75 ? 4 : yeniSeviyye >= 50 ? 3 : yeniSeviyye >= 25 ? 2 : 1;
            record.setDogruCavab(yeniDogru);
            record.setHallSualSayi(yeniHall);
            record.setSeviyye(yeniSeviyye);
            record.setYildiz(yeniYildiz);
            progressRepository.save(record);
        }

        activityLogService.log(student.getId(), "exam_complete",
                attempt.getSualSayi() + " sual · " + dogru + " doğru · " + bal + " bal");

        ExamConfig config = examConfigRepository.findByStudentId(student.getId()).orElse(null);

        Map<String, Object> result = JsonUtil.asMap(attempt);
        result.put("fennNetice", fennNeticeToMap(fennNetice));
        result.put("kecidBali", config != null ? config.getKecidBali() : 200);
        return result;
    }

    private Map<String, Map<String, Integer>> fennNeticeToMap(Map<String, int[]> fennNetice) {
        Map<String, Map<String, Integer>> out = new LinkedHashMap<>();
        for (var e : fennNetice.entrySet()) {
            out.put(e.getKey(), Map.of("dogru", e.getValue()[0], "sehv", e.getValue()[1], "bos", e.getValue()[2]));
        }
        return out;
    }

    // === Past-exam (yüklənmiş sənəddən vaxtlı imtahan) ===
    public record PastExamStartRequest(String sessionId, List<ExamQuestion> suallar, Integer müddet) {
    }

    @Transactional
    public Map<String, Object> pastExamStart(PastExamStartRequest req) {
        if (req.sessionId() == null || req.suallar() == null || req.suallar().isEmpty()) {
            throw ApiException.badRequest("suallar tələb olunur");
        }
        Student student = studentService.findBySessionIdOrThrow(req.sessionId());

        Map<String, Integer> fennBolugu = new LinkedHashMap<>();
        for (ExamQuestion q : req.suallar()) {
            String fenn = q.getFenn() != null ? q.getFenn() : "Ümumi";
            fennBolugu.merge(fenn, 1, Integer::sum);
        }

        ExamAttempt attempt = new ExamAttempt();
        attempt.setStudentId(student.getId());
        attempt.setSualSayi(req.suallar().size());
        attempt.setSuallar(JsonUtil.toJson(req.suallar()));
        attempt.setFennBolugu(JsonUtil.toJson(fennBolugu));
        attempt.setTamamlandi(false);
        attempt = examAttemptRepository.save(attempt);

        activityLogService.log(student.getId(), "past_exam_start",
                req.suallar().size() + " suallıq yüklənmiş imtahan başladı");

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("attemptId", attempt.getId());
        result.put("suallar", req.suallar());
        result.put("fennBolugu", fennBolugu);
        result.put("sualSayi", req.suallar().size());
        result.put("müddet", req.müddet() != null ? req.müddet() : 30);
        return result;
    }
}
