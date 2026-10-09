package com.aitqdk.magistr.controller;

import com.aitqdk.magistr.service.TeacherPortalService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/** Tələbənin öz müəllim(lər)i ilə əlaqəli görünüşü — tapşırıqlarım, materiallarım, imtahanlarım. */
@RestController
@RequestMapping("/api/student")
@RequiredArgsConstructor
public class StudentPortalController {

    private final TeacherPortalService teacherPortalService;

    @GetMapping("/tasks")
    public List<Map<String, Object>> myTasks(@RequestParam String sessionId) {
        return teacherPortalService.myTasks(sessionId);
    }

    public record ToggleRequest(String sessionId) {
    }

    @PostMapping("/tasks/{id}/items/{itemId}/toggle")
    public Map<String, Object> toggleItem(@PathVariable String id, @PathVariable String itemId, @RequestBody ToggleRequest req) {
        return teacherPortalService.toggleTaskItem(req.sessionId(), id, itemId);
    }

    @GetMapping("/materials")
    public List<Map<String, Object>> myMaterials(@RequestParam String sessionId) {
        return teacherPortalService.myMaterials(sessionId);
    }

    @GetMapping("/exams")
    public List<Map<String, Object>> myExams(@RequestParam String sessionId) {
        return teacherPortalService.myExams(sessionId);
    }

    public record SubmitExamRequest(String sessionId, String cavab, String sekil) {
    }

    @PostMapping("/exams/{id}/submit")
    public Map<String, Object> submitExam(@PathVariable String id, @RequestBody SubmitExamRequest req) {
        return teacherPortalService.submitExam(req.sessionId(), id, req.cavab(), req.sekil());
    }

    @GetMapping("/my-teacher")
    public List<Map<String, Object>> myTeacher(@RequestParam String sessionId) {
        return teacherPortalService.myTeachers(sessionId);
    }

    @DeleteMapping("/my-teacher/{teacherId}")
    public Map<String, Object> leaveTeacher(@PathVariable String teacherId, @RequestParam String sessionId) {
        teacherPortalService.leaveTeacher(sessionId, teacherId);
        return Map.of("success", true);
    }

    @GetMapping("/teacher-requests")
    public List<Map<String, Object>> pendingRequests(@RequestParam String sessionId) {
        return teacherPortalService.myPendingRequests(sessionId);
    }

    public record RespondRequest(String sessionId, boolean accept) {
    }

    @PostMapping("/teacher-requests/{teacherId}/respond")
    public Map<String, Object> respondToRequest(@PathVariable String teacherId, @RequestBody RespondRequest req) {
        teacherPortalService.respondToRequest(req.sessionId(), teacherId, req.accept());
        return Map.of("success", true);
    }
}
