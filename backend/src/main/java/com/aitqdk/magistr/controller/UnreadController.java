package com.aitqdk.magistr.controller;

import com.aitqdk.magistr.service.UnreadService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/unread")
@RequiredArgsConstructor
public class UnreadController {

    private final UnreadService unreadService;

    @GetMapping
    public Map<String, Object> counts(@RequestParam String sessionId) {
        return unreadService.counts(sessionId);
    }

    public record SeenRequest(String sessionId, String key) {
    }

    @PostMapping("/seen")
    public Map<String, Object> seen(@RequestBody SeenRequest req) {
        unreadService.markSeen(req.sessionId(), req.key());
        return Map.of("success", true);
    }
}
