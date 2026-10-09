package com.aitqdk.magistr.controller;

import com.aitqdk.magistr.service.ActivityHeatmapService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequiredArgsConstructor
public class ActivityHeatmapController {

    private final ActivityHeatmapService activityHeatmapService;

    @GetMapping("/api/activity-heatmap")
    public Map<String, Object> get(@RequestParam String sessionId) {
        return activityHeatmapService.get(sessionId);
    }
}
