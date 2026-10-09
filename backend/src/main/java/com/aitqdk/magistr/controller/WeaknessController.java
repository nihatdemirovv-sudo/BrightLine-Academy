package com.aitqdk.magistr.controller;

import com.aitqdk.magistr.service.WeaknessService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequiredArgsConstructor
public class WeaknessController {

    private final WeaknessService weaknessService;

    @GetMapping("/api/weaknesses")
    public Map<String, Object> get(@RequestParam String sessionId) {
        return weaknessService.get(sessionId);
    }
}
