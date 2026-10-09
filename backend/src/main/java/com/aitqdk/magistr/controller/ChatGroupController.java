package com.aitqdk.magistr.controller;

import com.aitqdk.magistr.service.ChatGroupService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/groups")
@RequiredArgsConstructor
public class ChatGroupController {

    private final ChatGroupService chatGroupService;

    @GetMapping
    public List<Map<String, Object>> list(@RequestParam String sessionId) {
        return chatGroupService.listGroups(sessionId);
    }

    public record CreateGroupRequest(String sessionId, String ad, String sifre, List<String> memberIds) {
    }

    @PostMapping
    public Map<String, Object> create(@RequestBody CreateGroupRequest req) {
        return chatGroupService.createGroup(req.sessionId(), req.ad(), req.sifre(), req.memberIds());
    }

    public record JoinGroupRequest(String sessionId, String sifre) {
    }

    @PostMapping("/{id}/join")
    public Map<String, Object> join(@PathVariable String id, @RequestBody JoinGroupRequest req) {
        return chatGroupService.joinGroup(req.sessionId(), id, req.sifre());
    }

    @GetMapping("/{id}")
    public Map<String, Object> get(@PathVariable String id, @RequestParam String sessionId) {
        return chatGroupService.getGroup(sessionId, id);
    }

    public record MessageRequest(String sessionId, String mesaj, String sekil, String ses, String cavabId) {
    }

    @PostMapping("/{id}/messages")
    public Map<String, Object> sendMessage(@PathVariable String id, @RequestBody MessageRequest req) {
        return chatGroupService.addMessage(req.sessionId(), id, req.mesaj(), req.sekil(), req.ses(), req.cavabId());
    }

    public record EditMessageRequest(String sessionId, String mesaj) {
    }

    @PostMapping("/{id}/messages/{messageId}/edit")
    public Map<String, Object> editMessage(@PathVariable String id, @PathVariable String messageId, @RequestBody EditMessageRequest req) {
        return chatGroupService.editMessage(req.sessionId(), id, messageId, req.mesaj());
    }

    @DeleteMapping("/{id}/messages/{messageId}")
    public Map<String, Object> deleteMessage(@PathVariable String id, @PathVariable String messageId, @RequestParam String sessionId) {
        return chatGroupService.deleteMessage(sessionId, id, messageId);
    }

    @PostMapping("/{id}/messages/{messageId}/hide")
    public Map<String, Object> hideMessageForMe(@PathVariable String id, @PathVariable String messageId, @RequestParam String sessionId) {
        return chatGroupService.hideMessageForMe(sessionId, id, messageId);
    }

    public record KickRequest(String sessionId, String memberId) {
    }

    @PostMapping("/{id}/kick")
    public Map<String, Object> kick(@PathVariable String id, @RequestBody KickRequest req) {
        return chatGroupService.kickMember(req.sessionId(), id, req.memberId());
    }

    public record SettingsRequest(String sessionId, String ad, String sifre) {
    }

    @PostMapping("/{id}/settings")
    public Map<String, Object> updateSettings(@PathVariable String id, @RequestBody SettingsRequest req) {
        return chatGroupService.updateSettings(req.sessionId(), id, req.ad(), req.sifre());
    }

    public record ClosedRequest(String sessionId, boolean qapali) {
    }

    @PostMapping("/{id}/closed")
    public Map<String, Object> setClosed(@PathVariable String id, @RequestBody ClosedRequest req) {
        return chatGroupService.setClosed(req.sessionId(), id, req.qapali());
    }

    public record MuteRequest(String sessionId, boolean yalnizAdminYaza) {
    }

    @PostMapping("/{id}/mute")
    public Map<String, Object> setMute(@PathVariable String id, @RequestBody MuteRequest req) {
        return chatGroupService.setMute(req.sessionId(), id, req.yalnizAdminYaza());
    }

    @GetMapping("/{id}/stream")
    public SseEmitter stream(@PathVariable String id, @RequestParam String sessionId) {
        return chatGroupService.subscribeStudent(sessionId, id);
    }

    public record ClearChatRequest(String sessionId) {
    }

    @PostMapping("/{id}/clear")
    public Map<String, Object> clearChat(@PathVariable String id, @RequestBody ClearChatRequest req) {
        return chatGroupService.clearChat(req.sessionId(), id);
    }

    @PostMapping("/{id}/leave")
    public Map<String, Object> leave(@PathVariable String id, @RequestBody ClearChatRequest req) {
        chatGroupService.deleteChatAndLeave(req.sessionId(), id);
        return Map.of("success", true);
    }

    @DeleteMapping("/{id}")
    public Map<String, Object> disband(@PathVariable String id, @RequestParam String sessionId) {
        chatGroupService.disbandGroup(sessionId, id);
        return Map.of("success", true);
    }
}
