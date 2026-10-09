package com.aitqdk.magistr.controller;

import com.aitqdk.magistr.dto.GenerateQuestionsRequest;
import com.aitqdk.magistr.service.QuestionGeneratorService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequiredArgsConstructor
public class QuestionGeneratorController {

    private final QuestionGeneratorService questionGeneratorService;

    public record DiagnosticRequest(String qrup) {
    }

    @PostMapping("/api/generate-questions")
    public Map<String, Object> generate(@RequestBody GenerateQuestionsRequest req) {
        return questionGeneratorService.generate(req);
    }

    @PostMapping("/api/diagnostic")
    public Map<String, Object> diagnostic(@RequestBody DiagnosticRequest req) {
        return questionGeneratorService.diagnostic(req.qrup());
    }
}
