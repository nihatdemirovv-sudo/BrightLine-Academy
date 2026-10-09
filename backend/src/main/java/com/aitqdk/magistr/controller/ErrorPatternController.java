package com.aitqdk.magistr.controller;

import com.aitqdk.magistr.service.ErrorPatternService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/error-patterns")
@RequiredArgsConstructor
public class ErrorPatternController {

    private final ErrorPatternService errorPatternService;

    @GetMapping
    public Map<String, Object> get(@RequestParam String sessionId) {
        return errorPatternService.get(sessionId);
    }

    @PostMapping
    public Map<String, Object> classify(@RequestBody ErrorPatternService.ClassifyRequest req) {
        return errorPatternService.classify(req);
    }
}
