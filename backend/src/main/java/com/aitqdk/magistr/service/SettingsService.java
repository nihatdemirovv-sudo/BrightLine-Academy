package com.aitqdk.magistr.service;

import com.aitqdk.magistr.dto.SettingsUpdateRequest;
import com.aitqdk.magistr.entity.*;
import com.aitqdk.magistr.exception.ApiException;
import com.aitqdk.magistr.repository.*;
import com.aitqdk.magistr.util.JsonUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class SettingsService {

    private final StudentService studentService;
    private final StudentRepository studentRepository;
    private final StudentSettingsRepository settingsRepository;
    private final ExamConfigRepository examConfigRepository;

    private final SubjectProgressRepository progressRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final QuestionSetRepository questionSetRepository;
    private final DailyQuestRepository dailyQuestRepository;
    private final ParentReportRepository parentReportRepository;
    private final ActivityRepository activityRepository;
    private final BookmarkRepository bookmarkRepository;
    private final StudentAchievementRepository achievementRepository;
    private final StudySessionRepository studySessionRepository;
    private final ExamAttemptRepository examAttemptRepository;
    private final ScoreSimulationRepository scoreSimulationRepository;
    private final ErrorPatternRepository errorPatternRepository;
    private final FlashcardRepository flashcardRepository;
    private final WeakTopicRepository weakTopicRepository;
    private final MiniLessonRepository miniLessonRepository;

    @Transactional
    public Map<String, Object> get(String sessionId) {
        Student student = studentService.findBySessionIdOrThrow(sessionId);
        StudentSettings settings = settingsRepository.findByStudentId(student.getId())
                .orElseGet(() -> {
                    StudentSettings s = new StudentSettings();
                    s.setStudentId(student.getId());
                    return settingsRepository.save(s);
                });
        ExamConfig examConfig = examConfigRepository.findByStudentId(student.getId()).orElse(null);

        Map<String, Object> profil = new LinkedHashMap<>();
        profil.put("ad", student.getAd());
        profil.put("qrup", student.getQrup());
        profil.put("hedefUniversite", student.getHedefUniversite());
        profil.put("email", student.getEmail());
        profil.put("streak", student.getStreak());
        profil.put("createdAt", student.getCreatedAt());

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("settings", settings);
        result.put("profil", profil);
        result.put("examConfig", examConfig);
        return result;
    }

    @Transactional
    public Map<String, Object> update(SettingsUpdateRequest req) {
        if (req.getSessionId() == null) throw ApiException.badRequest("sessionId tələb olunur");
        Student student = studentService.findBySessionIdOrThrow(req.getSessionId());

        if (req.getSettings() != null) {
            var s = req.getSettings();
            StudentSettings settings = settingsRepository.findByStudentId(student.getId())
                    .orElseGet(() -> {
                        StudentSettings ns = new StudentSettings();
                        ns.setStudentId(student.getId());
                        return ns;
                    });
            if (s.getBildirislerAktiv() != null) settings.setBildirislerAktiv(s.getBildirislerAktiv());
            if (s.getGunlukPlanBildirisi() != null) settings.setGunlukPlanBildirisi(s.getGunlukPlanBildirisi());
            if (s.getStreakXebardarligi() != null) settings.setStreakXebardarligi(s.getStreakXebardarligi());
            if (s.getGunkuSualHediyye() != null) settings.setGunkuSualHediyye(s.getGunkuSualHediyye());
            if (s.getCetinlikSeviyyesi() != null) settings.setCetinlikSeviyyesi(s.getCetinlikSeviyyesi());
            if (s.getAnimasyonlar() != null) settings.setAnimasyonlar(s.getAnimasyonlar());
            if (s.getValideynEmail() != null) settings.setValideynEmail(s.getValideynEmail());
            if (s.getValideynBildirisiAktiv() != null) settings.setValideynBildirisiAktiv(s.getValideynBildirisiAktiv());
            settingsRepository.save(settings);
        }

        if (req.getProfil() != null) {
            var p = req.getProfil();
            if (p.getAd() != null) student.setAd(p.getAd());
            if (p.getHedefUniversite() != null) student.setHedefUniversite(p.getHedefUniversite());
            if (p.getEmail() != null) student.setEmail(p.getEmail().isBlank() ? null : p.getEmail().trim());
            studentRepository.save(student);
        }

        if (req.getExamConfig() != null && req.getExamConfig().getImtahanTarixi() != null) {
            var ec = req.getExamConfig();
            ExamConfig config = examConfigRepository.findByStudentId(student.getId())
                    .orElseGet(() -> {
                        ExamConfig nc = new ExamConfig();
                        nc.setStudentId(student.getId());
                        return nc;
                    });
            config.setImtahanTarixi(ec.getImtahanTarixi());
            if (ec.getNov() != null) config.setNov(ec.getNov());
            if (ec.getMüddet() != null) config.setMuddet(ec.getMüddet());
            if (ec.getSualSayi() != null) config.setSualSayi(ec.getSualSayi());
            if (ec.getKecidBali() != null) config.setKecidBali(ec.getKecidBali());
            examConfigRepository.save(config);
        }

        Student refreshed = studentRepository.findById(student.getId()).orElseThrow();
        StudentSettings settings = settingsRepository.findByStudentId(refreshed.getId()).orElse(null);
        ExamConfig examConfig = examConfigRepository.findByStudentId(refreshed.getId()).orElse(null);

        Map<String, Object> profil = new LinkedHashMap<>();
        profil.put("ad", refreshed.getAd());
        profil.put("qrup", refreshed.getQrup());
        profil.put("hedefUniversite", refreshed.getHedefUniversite());
        profil.put("email", refreshed.getEmail());
        profil.put("streak", refreshed.getStreak());

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("settings", settings);
        result.put("profil", profil);
        result.put("examConfig", examConfig);
        result.put("success", true);
        return result;
    }

    @Transactional
    public Map<String, Object> reset(String sessionId) {
        Student student = studentService.findBySessionIdOrThrow(sessionId);
        String id = student.getId();

        progressRepository.deleteByStudentId(id);
        chatMessageRepository.deleteByStudentId(id);
        questionSetRepository.deleteByStudentId(id);
        dailyQuestRepository.deleteByStudentId(id);
        parentReportRepository.deleteByStudentId(id);
        activityRepository.deleteByStudentId(id);
        bookmarkRepository.deleteByStudentId(id);
        achievementRepository.deleteByStudentId(id);
        studySessionRepository.deleteByStudentId(id);
        examAttemptRepository.deleteByStudentId(id);
        scoreSimulationRepository.deleteByStudentId(id);
        errorPatternRepository.deleteByStudentId(id);
        flashcardRepository.deleteByStudentId(id);
        weakTopicRepository.deleteByStudentId(id);
        miniLessonRepository.deleteByStudentId(id);

        student.setStreak(0);
        student.setDiagnosticDone(false);
        studentRepository.save(student);

        examConfigRepository.deleteByStudentId(id);

        return Map.of("success", true, "mesaj", "Bütün proqres sıfırlandı");
    }
}
