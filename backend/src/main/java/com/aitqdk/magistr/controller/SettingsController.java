package com.aitqdk.magistr.controller;

import com.aitqdk.magistr.dto.SettingsUpdateRequest;
import com.aitqdk.magistr.service.SettingsService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/settings")
@RequiredArgsConstructor
public class SettingsController {

    private final SettingsService settingsService;

    @GetMapping
    public Map<String, Object> get(@RequestParam String sessionId) {
        return settingsService.get(sessionId);
    }

    @PutMapping
    public Map<String, Object> update(@RequestBody SettingsUpdateRequest req) {
        return settingsService.update(req);
    }

    @DeleteMapping
    public Map<String, Object> reset(@RequestParam String sessionId) {
        return settingsService.reset(sessionId);
    }
}
