package com.aitqdk.magistr.controller;

import com.aitqdk.magistr.service.AchievementService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequiredArgsConstructor
public class AchievementController {

    private final AchievementService achievementService;

    @GetMapping("/api/achievements")
    public Map<String, Object> get(@RequestParam String sessionId) {
        return achievementService.get(sessionId);
    }
}
