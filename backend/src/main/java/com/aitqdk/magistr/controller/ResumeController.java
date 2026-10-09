package com.aitqdk.magistr.controller;

import com.aitqdk.magistr.service.ResumeService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/resume")
@RequiredArgsConstructor
public class ResumeController {

    private final ResumeService resumeService;

    @GetMapping
    public Map<String, Object> get(@RequestParam String sessionId) {
        return resumeService.get(sessionId);
    }

    public record SaveRequest(String sessionId, Map<String, Object> data) {
    }

    @PostMapping
    public Map<String, Object> save(@RequestBody SaveRequest req) {
        return resumeService.save(req.sessionId(), req.data());
    }

    public record ImproveRequest(String sessionId, String metn, String kontext) {
    }

    @PostMapping("/ai-improve")
    public Map<String, Object> improve(@RequestBody ImproveRequest req) {
        return Map.of("netice", resumeService.aiImprove(req.sessionId(), req.metn(), req.kontext()));
    }
}
