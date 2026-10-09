package com.aitqdk.magistr.controller;

import com.aitqdk.magistr.service.TeacherPortalService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/** Təsdiqlənmiş müəllimin özünə xas panel əməliyyatları — tələbə axtarışı/qeydə alma,
 * fərdi tapşırıq, ümumi material, imtahan elanı + cavabların yoxlanması. */
@RestController
@RequestMapping("/api/teacher")
@RequiredArgsConstructor
public class TeacherController {

    private final TeacherPortalService teacherPortalService;

    @GetMapping("/students/search")
    public List<Map<String, Object>> searchStudents(@RequestParam String sessionId, @RequestParam(required = false) String q) {
        return teacherPortalService.searchStudents(sessionId, q);
    }

    public record RegisterStudentRequest(String sessionId, String studentId) {
    }

    @PostMapping("/students")
    public Map<String, Object> registerStudent(@RequestBody RegisterStudentRequest req) {
        return teacherPortalService.registerStudent(req.sessionId(), req.studentId());
    }

    @GetMapping("/students")
    public List<Map<String, Object>> myStudents(@RequestParam String sessionId) {
        return teacherPortalService.listMyStudents(sessionId);
    }

    @DeleteMapping("/students/{id}")
    public Map<String, Object> removeStudent(@PathVariable String id, @RequestParam String sessionId) {
        teacherPortalService.removeStudent(sessionId, id);
        return Map.of("success", true);
    }

    @GetMapping("/students/{id}/activity")
    public Map<String, Object> studentActivity(@PathVariable String id, @RequestParam String sessionId) {
        return teacherPortalService.studentActivityForTeacher(sessionId, id);
    }

    public record CreateTaskRequest(String sessionId, String studentId, String baslik, List<String> items) {
    }

    @PostMapping("/tasks")
    public Map<String, Object> createTask(@RequestBody CreateTaskRequest req) {
        return teacherPortalService.createTask(req.sessionId(), req.studentId(), req.baslik(), req.items());
    }

    @GetMapping("/tasks")
    public List<Map<String, Object>> tasksForStudent(@RequestParam String sessionId, @RequestParam String studentId) {
        return teacherPortalService.listTasksForStudent(sessionId, studentId);
    }

    public record AttachmentRequest(String sessionId, String ad, String tip, String data) {
    }

    @PostMapping("/tasks/{id}/attachments")
    public Map<String, Object> addAttachment(@PathVariable String id, @RequestBody AttachmentRequest req) {
        return teacherPortalService.addAttachment(req.sessionId(), id, req.ad(), req.tip(), req.data());
    }

    @DeleteMapping("/tasks/{id}")
    public Map<String, Object> deleteTask(@PathVariable String id, @RequestParam String sessionId) {
        teacherPortalService.deleteTask(sessionId, id);
        return Map.of("success", true);
    }

    public record MaterialRequest(String sessionId, String ad, String tip, String data) {
    }

    @PostMapping("/materials")
    public Map<String, Object> uploadMaterial(@RequestBody MaterialRequest req) {
        return teacherPortalService.uploadMaterial(req.sessionId(), req.ad(), req.tip(), req.data());
    }

    @GetMapping("/materials")
    public List<Map<String, Object>> myMaterials(@RequestParam String sessionId) {
        return teacherPortalService.listMyMaterials(sessionId);
    }

    @DeleteMapping("/materials/{id}")
    public Map<String, Object> deleteMaterial(@PathVariable String id, @RequestParam String sessionId) {
        teacherPortalService.deleteMaterial(sessionId, id);
        return Map.of("success", true);
    }

    public record CreateExamRequest(String sessionId, String baslik, String sened, String telimat) {
    }

    @PostMapping("/exams")
    public Map<String, Object> createExam(@RequestBody CreateExamRequest req) {
        return teacherPortalService.createExam(req.sessionId(), req.baslik(), req.sened(), req.telimat());
    }

    @GetMapping("/exams")
    public List<Map<String, Object>> myExams(@RequestParam String sessionId) {
        return teacherPortalService.listMyExams(sessionId);
    }

    @GetMapping("/exams/{id}/submissions")
    public List<Map<String, Object>> submissions(@PathVariable String id, @RequestParam String sessionId) {
        return teacherPortalService.listSubmissions(sessionId, id);
    }

    public record FeedbackRequest(String sessionId, String feedback, String netice) {
    }

    @PostMapping("/exams/{examId}/submissions/{submissionId}/feedback")
    public Map<String, Object> giveFeedback(@PathVariable String examId, @PathVariable String submissionId,
                                             @RequestBody FeedbackRequest req) {
        return teacherPortalService.giveFeedback(req.sessionId(), examId, submissionId, req.feedback(), req.netice());
    }

}
