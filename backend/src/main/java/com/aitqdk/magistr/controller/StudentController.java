package com.aitqdk.magistr.controller;

import com.aitqdk.magistr.dto.StudentUpsertRequest;
import com.aitqdk.magistr.entity.Student;
import com.aitqdk.magistr.repository.ActivityRepository;
import com.aitqdk.magistr.repository.DailyQuestRepository;
import com.aitqdk.magistr.repository.SubjectProgressRepository;
import com.aitqdk.magistr.service.StudentService;
import com.aitqdk.magistr.util.JsonUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/student")
@RequiredArgsConstructor
public class StudentController {

    private final StudentService studentService;
    private final SubjectProgressRepository progressRepository;
    private final DailyQuestRepository dailyQuestRepository;
    private final ActivityRepository activityRepository;

    @PostMapping
    public Map<String, Object> upsert(@RequestBody StudentUpsertRequest req) {
        Student student = studentService.getOrCreate(req);
        Map<String, Object> result = JsonUtil.asMap(student);
        result.remove("passwordHash");
        result.put("progress", progressRepository.findByStudentId(student.getId()));
        return result;
    }

    @GetMapping
    public Map<String, Object> get(@RequestParam String sessionId) {
        Student student = studentService.findBySessionIdOrThrow(sessionId);
        studentService.touchStreak(student);
        Map<String, Object> result = JsonUtil.asMap(student);
        result.remove("passwordHash");
        result.put("progress", progressRepository.findByStudentId(student.getId()));
        result.put("dailyQuests", dailyQuestRepository.findByStudentIdOrderByCreatedAtDesc(
                student.getId(), PageRequest.of(0, 7)));
        result.put("activities", activityRepository.findByStudentIdOrderByCreatedAtDesc(
                student.getId(), PageRequest.of(0, 50)));
        return result;
    }
}
