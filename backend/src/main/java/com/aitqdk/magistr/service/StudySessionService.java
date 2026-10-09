package com.aitqdk.magistr.service;

import com.aitqdk.magistr.entity.Student;
import com.aitqdk.magistr.entity.StudySession;
import com.aitqdk.magistr.exception.ApiException;
import com.aitqdk.magistr.repository.StudySessionRepository;
import com.aitqdk.magistr.util.JsonUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class StudySessionService {

    private final StudentService studentService;
    private final StudySessionRepository studySessionRepository;
    private final ActivityLogService activityLogService;

    public record CreateRequest(String sessionId, Integer müddet, String fenn) {
    }

    @Transactional
    public Map<String, Object> create(CreateRequest req) {
        if (req.sessionId() == null || req.müddet() == null) throw ApiException.badRequest("parametrlər çatışmır");
        Student student = studentService.findBySessionIdOrThrow(req.sessionId());

        StudySession session = new StudySession();
        session.setStudentId(student.getId());
        session.setMuddet(req.müddet());
        session.setFenn(req.fenn());
        session = studySessionRepository.save(session);

        activityLogService.log(student.getId(), "study_session",
                req.müddet() + " dəqiqə" + (req.fenn() != null ? " · " + req.fenn() : ""));

        return JsonUtil.asMap(session);
    }

    @Transactional
    public Map<String, Object> stats(String sessionId) {
        Student student = studentService.findBySessionIdOrThrow(sessionId);
        List<StudySession> sessions = studySessionRepository.findByStudentId(student.getId());

        int toplamDəqiqə = sessions.stream().mapToInt(StudySession::getMuddet).sum();
        int seansSayı = sessions.size();

        Instant yeddiGünÖnce = Instant.now().minusSeconds(7L * 24 * 60 * 60);
        List<StudySession> sonHəftə = sessions.stream()
                .filter(s -> s.getCreatedAt().isAfter(yeddiGünÖnce)).toList();
        int sonHəftəDəqiqə = sonHəftə.stream().mapToInt(StudySession::getMuddet).sum();

        Map<String, Object> result = new java.util.LinkedHashMap<>();
        result.put("toplamDəqiqə", toplamDəqiqə);
        result.put("seansSayı", seansSayı);
        result.put("sonHəftəDəqiqə", sonHəftəDəqiqə);
        result.put("sonHəftəSeans", sonHəftə.size());
        result.put("toplamSaat", toplamDəqiqə / 60);
        result.put("toplamQalıqDəqiqə", toplamDəqiqə % 60);
        return result;
    }
}
