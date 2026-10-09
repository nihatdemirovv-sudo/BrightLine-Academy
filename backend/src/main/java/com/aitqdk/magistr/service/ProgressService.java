package com.aitqdk.magistr.service;

import com.aitqdk.magistr.ai.Subjects;
import com.aitqdk.magistr.dto.ProgressUpdateRequest;
import com.aitqdk.magistr.entity.Student;
import com.aitqdk.magistr.entity.SubjectProgress;
import com.aitqdk.magistr.exception.ApiException;
import com.aitqdk.magistr.repository.StudentRepository;
import com.aitqdk.magistr.repository.SubjectProgressRepository;
import com.aitqdk.magistr.util.JsonUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ProgressService {

    private final StudentService studentService;
    private final StudentRepository studentRepository;
    private final SubjectProgressRepository progressRepository;
    private final ActivityLogService activityLogService;

    @Transactional
    public List<SubjectProgress> getOrInit(String sessionId) {
        Student student = studentService.findBySessionIdOrThrow(sessionId);
        List<SubjectProgress> progress = progressRepository.findByStudentId(student.getId());
        if (progress.isEmpty()) {
            for (String fenn : Subjects.BÜTÜN_FENLER) {
                SubjectProgress p = new SubjectProgress();
                p.setStudentId(student.getId());
                p.setFenn(fenn);
                progressRepository.save(p);
            }
            progress = progressRepository.findByStudentId(student.getId());
        }
        return progress;
    }

    @Transactional
    public Map<String, Object> update(ProgressUpdateRequest req) {
        if (req.getSessionId() == null || req.getFenn() == null) {
            throw ApiException.badRequest("parametrlər çatışmır");
        }
        Student student = studentService.findBySessionIdOrThrow(req.getSessionId());
        boolean dogru = Boolean.TRUE.equals(req.getDogru());
        int say = req.getSay() != null ? req.getSay() : 1;

        SubjectProgress record = progressRepository.findByStudentIdAndFenn(student.getId(), req.getFenn())
                .orElseGet(() -> {
                    SubjectProgress p = new SubjectProgress();
                    p.setStudentId(student.getId());
                    p.setFenn(req.getFenn());
                    return progressRepository.save(p);
                });

        int yeniDogru = record.getDogruCavab() + (dogru ? 1 : 0);
        int yeniHall = record.getHallSualSayi() + say;
        int yeniSeviyye = Math.min(100, Math.round(100f * yeniDogru / Math.max(yeniHall, 1)));
        int yeniYildiz = yeniSeviyye >= 90 ? 5 : yeniSeviyye >= 75 ? 4 : yeniSeviyye >= 50 ? 3 : yeniSeviyye >= 25 ? 2 : 1;

        record.setDogruCavab(yeniDogru);
        record.setHallSualSayi(yeniHall);
        record.setSeviyye(yeniSeviyye);
        record.setYildiz(yeniYildiz);
        record = progressRepository.save(record);

        activityLogService.log(student.getId(), "sual_helli", req.getFenn() + " - " + (dogru ? "doğru" : "səhv"));

        return JsonUtil.asMap(record);
    }
}
