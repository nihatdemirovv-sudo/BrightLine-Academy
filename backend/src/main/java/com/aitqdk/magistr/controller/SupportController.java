package com.aitqdk.magistr.controller;

import com.aitqdk.magistr.service.SupportService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/support")
@RequiredArgsConstructor
public class SupportController {

    private final SupportService supportService;

    public record CreateTicketRequest(String sessionId, String movzu, String mesaj, String sekil) {
    }

    @PostMapping("/tickets")
    public Map<String, Object> create(@RequestBody CreateTicketRequest req) {
        return supportService.createTicket(req.sessionId(), req.movzu(), req.mesaj(), req.sekil());
    }

    @GetMapping("/tickets")
    public List<Map<String, Object>> list(@RequestParam String sessionId) {
        return supportService.listTickets(sessionId);
    }

    @GetMapping("/tickets/{id}")
    public Map<String, Object> get(@PathVariable String id, @RequestParam String sessionId) {
        return supportService.getTicket(sessionId, id);
    }

    public record ReplyRequest(String sessionId, String mesaj, String sekil) {
    }

    @PostMapping("/tickets/{id}/reply")
    public Map<String, Object> reply(@PathVariable String id, @RequestBody ReplyRequest req) {
        return supportService.addStudentReply(req.sessionId(), id, req.mesaj(), req.sekil());
    }

    @GetMapping("/tickets/{id}/stream")
    public SseEmitter stream(@PathVariable String id, @RequestParam String sessionId) {
        return supportService.subscribeStudent(sessionId, id);
    }
}
