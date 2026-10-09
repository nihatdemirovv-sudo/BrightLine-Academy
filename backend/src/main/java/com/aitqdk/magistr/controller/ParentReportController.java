package com.aitqdk.magistr.controller;

import com.aitqdk.magistr.service.ParentReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequiredArgsConstructor
public class ParentReportController {

    private final ParentReportService parentReportService;

    @GetMapping("/api/parent-report")
    public Map<String, Object> generate(@RequestParam String sessionId) {
        return parentReportService.generate(sessionId);
    }
}
