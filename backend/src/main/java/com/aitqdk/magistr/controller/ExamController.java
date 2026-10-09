package com.aitqdk.magistr.controller;

import com.aitqdk.magistr.entity.ExamConfig;
import com.aitqdk.magistr.service.ExamService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequiredArgsConstructor
public class ExamController {

    private final ExamService examService;

    @GetMapping("/api/exam/config")
    public Map<String, Object> getConfig(@RequestParam String sessionId) {
        return examService.getConfig(sessionId);
    }

    @PostMapping("/api/exam/config")
    public ExamConfig upsertConfig(@RequestBody ExamService.ExamConfigRequest req) {
        return examService.upsertConfig(req);
    }

    @PostMapping("/api/exam/generate")
    public Map<String, Object> generateExam(@RequestBody ExamService.GenerateExamRequest req) {
        return examService.generateExam(req);
    }

    @GetMapping("/api/exam/history")
    public Map<String, Object> history(@RequestParam String sessionId) {
        return examService.history(sessionId);
    }

    @PostMapping("/api/exam/submit")
    public Map<String, Object> submit(@RequestBody ExamService.SubmitExamRequest req) {
        return examService.submit(req);
    }

    @PostMapping("/api/past-exam/start")
    public Map<String, Object> pastExamStart(@RequestBody ExamService.PastExamStartRequest req) {
        return examService.pastExamStart(req);
    }
}
