package com.aitqdk.magistr.controller;

import com.aitqdk.magistr.service.StudySessionService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/study-session")
@RequiredArgsConstructor
public class StudySessionController {

    private final StudySessionService studySessionService;

    @PostMapping
    public Map<String, Object> create(@RequestBody StudySessionService.CreateRequest req) {
        return studySessionService.create(req);
    }

    @GetMapping
    public Map<String, Object> stats(@RequestParam String sessionId) {
        return studySessionService.stats(sessionId);
    }
}
