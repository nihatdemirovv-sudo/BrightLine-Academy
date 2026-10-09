package com.aitqdk.magistr.controller;

import com.aitqdk.magistr.service.MiniLessonService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequiredArgsConstructor
public class MiniLessonController {

    private final MiniLessonService miniLessonService;

    public record PatchRequest(String lessonId, String action) {
    }

    public record GenerateRequest(String sessionId, String fenn, String movzu) {
    }

    @GetMapping("/api/mini-lesson")
    public Map<String, Object> list(@RequestParam String sessionId) {
        return miniLessonService.list(sessionId);
    }

    @PatchMapping("/api/mini-lesson")
    public Map<String, Object> patch(@RequestBody PatchRequest req) {
        return miniLessonService.togglePatch(req.lessonId(), req.action());
    }

    @PostMapping("/api/mini-lesson/generate")
    public Map<String, Object> generate(@RequestBody GenerateRequest req) {
        return miniLessonService.generate(req.sessionId(), req.fenn(), req.movzu());
    }
}
