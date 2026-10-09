package com.aitqdk.magistr.service;

import com.aitqdk.magistr.entity.Student;
import com.aitqdk.magistr.exception.ApiException;
import com.aitqdk.magistr.repository.*;
import com.aitqdk.magistr.util.JsonUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AdminStudentsService {

    private static final int PAGE_SIZE = 20;

    private final StudentRepository studentRepository;
    private final SubjectProgressRepository progressRepository;
    private final QuestionSetRepository questionSetRepository;
    private final StudySessionRepository studySessionRepository;
    private final ExamAttemptRepository examAttemptRepository;
    private final BookmarkRepository bookmarkRepository;
    private final ActivityRepository activityRepository;

    @Transactional
    public Map<String, Object> list(int page, String q) {
        int safePage = Math.max(1, page);
        PageRequest pageReq = PageRequest.of(safePage - 1, PAGE_SIZE, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<Student> result = (q != null && !q.isBlank())
                ? studentRepository.searchStudentsForAdmin(q.trim(), pageReq)
                : studentRepository.findStudentsForAdmin(pageReq);

        List<Map<String, Object>> students = result.getContent().stream().map(s -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", s.getId());
            m.put("ad", s.getAd());
            m.put("username", s.getUsername());
            m.put("qrup", s.getQrup());
            m.put("hedefUniversite", s.getHedefUniversite());
            m.put("streak", s.getStreak());
            m.put("onboarded", s.getOnboarded());
            m.put("createdAt", s.getCreatedAt());
            m.put("lastActiveDate", s.getLastActiveDate());
            m.put("progress", progressRepository.findByStudentId(s.getId()));
            m.put("toplamSualSeti", questionSetRepository.countByStudentId(s.getId()));
            m.put("toplamStudySeansi", studySessionRepository.countByStudentId(s.getId()));
            m.put("toplamImtahanCehdi", examAttemptRepository.countByStudentId(s.getId()));
            m.put("toplamBookmark", bookmarkRepository.countByStudentId(s.getId()));
            return m;
        }).toList();

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("students", students);
        response.put("page", safePage);
        response.put("totalPages", result.getTotalPages());
        response.put("totalCount", result.getTotalElements());
        return response;
    }

    @Transactional
    public Map<String, Object> detail(String id) {
        Student student = studentRepository.findById(id).orElseThrow(() -> ApiException.notFound("Tapılmadı"));

        Map<String, Object> m = JsonUtil.asMap(student);
        m.remove("passwordHash");
        m.remove("sessionId");
        m.put("progress", progressRepository.findByStudentId(id));
        m.put("studySessions", studySessionRepository.findByStudentIdOrderByCreatedAtDesc(id, PageRequest.of(0, 30)));
        m.put("examAttempts", examAttemptRepository.findByStudentIdOrderByCreatedAtDesc(id, PageRequest.of(0, 20)));
        m.put("questionSets", questionSetRepository.findByStudentIdOrderByCreatedAtDesc(id, PageRequest.of(0, 20)));
        m.put("activities", activityRepository.findByStudentIdOrderByCreatedAtDesc(id, PageRequest.of(0, 30)));

        return Map.of("student", m);
    }
}
