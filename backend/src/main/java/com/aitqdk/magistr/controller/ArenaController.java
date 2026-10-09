package com.aitqdk.magistr.controller;

import com.aitqdk.magistr.service.ArenaService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.List;
import java.util.Map;

/**
 * "Bilik Arenası" — real-vaxtlı bilik yarışı API-si. Real-vaxt üçün SSE (bax
 * {@link #stream}) — ChatGroupController-dəki eyni pattern.
 */
@RestController
@RequestMapping("/api/arena")
@RequiredArgsConstructor
public class ArenaController {

    private final ArenaService arenaService;

    @GetMapping("/competitions")
    public List<Map<String, Object>> listActive(@RequestParam String sessionId) {
        return arenaService.listActive(sessionId);
    }

    public record CreateCompetitionRequest(String sessionId, String ad, String fenn, Integer sualSayi,
                                           String cetinlik, Integer maxIstirakci, Integer gozlemeSaniye,
                                           Integer sualSaniye) {
    }

    @PostMapping("/competitions")
    public Map<String, Object> create(@RequestBody CreateCompetitionRequest req) {
        return arenaService.createCompetition(req.sessionId(), new ArenaService.CreateRequest(
                req.ad(), req.fenn(), req.sualSayi(), req.cetinlik(),
                req.maxIstirakci(), req.gozlemeSaniye(), req.sualSaniye()));
    }

    @GetMapping("/competitions/{id}")
    public Map<String, Object> get(@PathVariable String id, @RequestParam String sessionId) {
        return arenaService.getDetail(sessionId, id);
    }

    public record SessionRequest(String sessionId) {
    }

    @PostMapping("/competitions/{id}/join")
    public Map<String, Object> join(@PathVariable String id, @RequestBody SessionRequest req) {
        return arenaService.joinCompetition(req.sessionId(), id);
    }

    @PostMapping("/competitions/{id}/start")
    public Map<String, Object> start(@PathVariable String id, @RequestBody SessionRequest req) {
        return arenaService.startCompetition(req.sessionId(), id);
    }

    @PostMapping("/competitions/{id}/cancel")
    public Map<String, Object> cancel(@PathVariable String id, @RequestBody SessionRequest req) {
        return arenaService.cancelCompetition(req.sessionId(), id);
    }

    @PostMapping("/competitions/{id}/leave")
    public Map<String, Object> leave(@PathVariable String id, @RequestBody SessionRequest req) {
        return arenaService.leaveCompetition(req.sessionId(), id);
    }

    public record AnswerBody(String sessionId, Integer sualIndex, String secim) {
    }

    @PostMapping("/competitions/{id}/answer")
    public Map<String, Object> answer(@PathVariable String id, @RequestBody AnswerBody req) {
        return arenaService.submitAnswer(req.sessionId(), id,
                new ArenaService.AnswerRequest(req.sualIndex(), req.secim()));
    }

    @GetMapping("/competitions/{id}/stream")
    public SseEmitter stream(@PathVariable String id, @RequestParam String sessionId) {
        return arenaService.subscribe(sessionId, id);
    }

    @GetMapping("/me/history")
    public List<Map<String, Object>> history(@RequestParam String sessionId) {
        return arenaService.myHistory(sessionId);
    }

    @GetMapping("/me/stats")
    public Map<String, Object> stats(@RequestParam String sessionId) {
        return arenaService.myStats(sessionId);
    }

    @GetMapping("/leaderboard")
    public Map<String, Object> leaderboard(@RequestParam String sessionId,
                                           @RequestParam(defaultValue = "all") String period) {
        return arenaService.leaderboard(sessionId, period);
    }

    @GetMapping("/notifications")
    public Map<String, Object> notifications(@RequestParam String sessionId) {
        return arenaService.notifications(sessionId);
    }

    @PostMapping("/notifications/read")
    public Map<String, Object> markRead(@RequestBody SessionRequest req) {
        return arenaService.markNotificationsRead(req.sessionId());
    }
}
