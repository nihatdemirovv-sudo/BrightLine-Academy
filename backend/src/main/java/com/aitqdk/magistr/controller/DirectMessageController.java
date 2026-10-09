package com.aitqdk.magistr.controller;

import com.aitqdk.magistr.service.DirectMessageService;
import com.aitqdk.magistr.service.StudentService;
import com.aitqdk.magistr.service.UnreadService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.List;
import java.util.Map;

/** Müəllim ↔ tələbə şəxsi söhbəti. */
@RestController
@RequestMapping("/api/dm")
@RequiredArgsConstructor
public class DirectMessageController {

    private final DirectMessageService directMessageService;
    private final UnreadService unreadService;
    private final StudentService studentService;

    @GetMapping
    public List<Map<String, Object>> conversations(@RequestParam String sessionId) {
        String meId = studentService.findBySessionIdOrThrow(sessionId).getId();
        return directMessageService.conversations(sessionId, unreadService.seenMap(meId), UnreadService.FLOOR);
    }

    @GetMapping("/{partnerId}")
    public Map<String, Object> thread(@PathVariable String partnerId, @RequestParam String sessionId) {
        return directMessageService.thread(sessionId, partnerId);
    }

    public record SendRequest(String sessionId, String mesaj, String sekil) {
    }

    @PostMapping("/{partnerId}")
    public Map<String, Object> send(@PathVariable String partnerId, @RequestBody SendRequest req) {
        return directMessageService.send(req.sessionId(), partnerId, req.mesaj(), req.sekil());
    }

    @DeleteMapping("/{partnerId}/messages/{messageId}")
    public Map<String, Object> delete(@PathVariable String partnerId, @PathVariable String messageId, @RequestParam String sessionId) {
        return directMessageService.delete(sessionId, partnerId, messageId);
    }

    @GetMapping("/{partnerId}/stream")
    public SseEmitter stream(@PathVariable String partnerId, @RequestParam String sessionId) {
        return directMessageService.subscribe(sessionId, partnerId);
    }
}
