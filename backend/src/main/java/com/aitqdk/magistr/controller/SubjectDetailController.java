package com.aitqdk.magistr.controller;

import com.aitqdk.magistr.service.SubjectDetailService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequiredArgsConstructor
public class SubjectDetailController {

    private final SubjectDetailService subjectDetailService;

    @GetMapping("/api/subject-detail")
    public Map<String, Object> get(@RequestParam String sessionId, @RequestParam String fenn) {
        return subjectDetailService.get(sessionId, fenn);
    }
}
