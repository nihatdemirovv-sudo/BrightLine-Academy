package com.aitqdk.magistr.controller;

import com.aitqdk.magistr.service.DailyQuestService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/daily-quest")
@RequiredArgsConstructor
public class DailyQuestController {

    private final DailyQuestService dailyQuestService;

    @GetMapping
    public Map<String, Object> get(@RequestParam String sessionId) {
        return dailyQuestService.getOrCreate(sessionId);
    }

    @PostMapping
    public Map<String, Object> complete(@RequestBody DailyQuestService.CompleteTaskRequest req) {
        return dailyQuestService.completeTask(req);
    }
}
