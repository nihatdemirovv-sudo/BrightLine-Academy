package com.aitqdk.magistr.controller;

import com.aitqdk.magistr.service.ScoreSimulatorService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/score-simulator")
@RequiredArgsConstructor
public class ScoreSimulatorController {

    private final ScoreSimulatorService scoreSimulatorService;

    @GetMapping
    public Map<String, Object> get(@RequestParam String sessionId) {
        return scoreSimulatorService.get(sessionId);
    }

    @PostMapping
    public Map<String, Object> submit(@RequestBody ScoreSimulatorService.ScoreSimulatorRequest req) {
        return scoreSimulatorService.submit(req);
    }
}
