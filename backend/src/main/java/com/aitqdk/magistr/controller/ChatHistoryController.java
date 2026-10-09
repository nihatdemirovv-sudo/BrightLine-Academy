package com.aitqdk.magistr.controller;

import com.aitqdk.magistr.entity.ChatMessage;
import com.aitqdk.magistr.service.ChatHistoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
public class ChatHistoryController {

    private final ChatHistoryService chatHistoryService;

    @GetMapping("/api/chat-history")
    public List<ChatMessage> history(@RequestParam String sessionId) {
        return chatHistoryService.history(sessionId);
    }

    @GetMapping("/api/chat-history/search")
    public Map<String, Object> search(@RequestParam String sessionId,
                                       @RequestParam(name = "q", required = false, defaultValue = "") String q) {
        return chatHistoryService.search(sessionId, q);
    }
}
