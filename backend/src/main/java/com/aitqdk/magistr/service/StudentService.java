package com.aitqdk.magistr.service;

import com.aitqdk.magistr.dto.StudentUpsertRequest;
import com.aitqdk.magistr.entity.Student;
import com.aitqdk.magistr.exception.ApiException;
import com.aitqdk.magistr.repository.StudentRepository;
import com.aitqdk.magistr.util.DateUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class StudentService {

    private final StudentRepository studentRepository;
    private final ActivityLogService activityLogService;

    public Student findBySessionIdOrThrow(String sessionId) {
        return studentRepository.findBySessionId(sessionId)
                .orElseThrow(() -> ApiException.notFound("Tapılmadı"));
    }

    public Student findByIdOrThrow(String id) {
        return studentRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Tapılmadı"));
    }

    public java.util.Optional<Student> findByIdOptional(String id) {
        return studentRepository.findById(id);
    }

    public java.util.List<Student> findAllByIds(java.util.Collection<String> ids) {
        return studentRepository.findAllById(ids);
    }

    @Transactional
    public Student touchStreak(Student student) {
        int yeniStreak = DateUtil.nextStreak(student.getLastActiveDate(), student.getStreak());
        if (yeniStreak != student.getStreak() || !DateUtil.today().equals(student.getLastActiveDate())) {
            student.setStreak(yeniStreak);
            student.setLastActiveDate(DateUtil.today());
            studentRepository.save(student);
        }
        return student;
    }

    @Transactional
    public Student getOrCreate(StudentUpsertRequest req) {
        if (req.getSessionId() == null || req.getSessionId().isBlank()) {
            throw ApiException.badRequest("sessionId tələb olunur");
        }

        Student student = studentRepository.findBySessionId(req.getSessionId()).orElse(null);

        boolean hasUpdateFields = req.getAd() != null || req.getQrup() != null || req.getHedefUniversite() != null
                || req.getOnboarded() != null || req.getDiagnosticDone() != null;

        if (student == null) {
            student = new Student();
            student.setSessionId(req.getSessionId());
            student.setAd(req.getAd() != null ? req.getAd() : "Şagird");
            student.setQrup(req.getQrup() != null ? req.getQrup() : "1");
            student.setHedefUniversite(req.getHedefUniversite() != null ? req.getHedefUniversite() : "");
            student.setOnboarded(req.getOnboarded() != null ? req.getOnboarded() : false);
            student.setDiagnosticDone(req.getDiagnosticDone() != null ? req.getDiagnosticDone() : false);
            student.setStreak(1);
            student.setLastActiveDate(DateUtil.today());
            student = studentRepository.save(student);
        } else if (hasUpdateFields) {
            int yeniStreak = DateUtil.nextStreak(student.getLastActiveDate(), student.getStreak());
            if (req.getAd() != null) student.setAd(req.getAd());
            if (req.getQrup() != null) student.setQrup(req.getQrup());
            if (req.getHedefUniversite() != null) student.setHedefUniversite(req.getHedefUniversite());
            if (req.getOnboarded() != null) student.setOnboarded(req.getOnboarded());
            if (req.getDiagnosticDone() != null) student.setDiagnosticDone(req.getDiagnosticDone());
            student.setStreak(yeniStreak);
            student.setLastActiveDate(DateUtil.today());
            student = studentRepository.save(student);
        }

        activityLogService.log(student.getId(), "login");
        return student;
    }
}
