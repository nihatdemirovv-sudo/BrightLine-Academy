package com.aitqdk.magistr.service;

import com.aitqdk.magistr.entity.ChatMessage;
import com.aitqdk.magistr.entity.Student;
import com.aitqdk.magistr.repository.ChatMessageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ChatHistoryService {

    private final StudentService studentService;
    private final ChatMessageRepository chatMessageRepository;

    @Transactional
    public List<ChatMessage> history(String sessionId) {
        Student student = studentService.findBySessionIdOrThrow(sessionId);
        List<ChatMessage> messages = chatMessageRepository.findByStudentIdOrderByCreatedAtDesc(
                student.getId(), PageRequest.of(0, 50));
        List<ChatMessage> reversed = new ArrayList<>(messages);
        java.util.Collections.reverse(reversed);
        return reversed;
    }

    @Transactional
    public Map<String, Object> search(String sessionId, String query) {
        Student student = studentService.findBySessionIdOrThrow(sessionId);

        if (query == null || query.isBlank()) {
            List<ChatMessage> messages = chatMessageRepository.findByStudentIdOrderByCreatedAtDesc(
                    student.getId(), PageRequest.of(0, 50));
            List<ChatMessage> reversed = new ArrayList<>(messages);
            java.util.Collections.reverse(reversed);
            return Map.of("messages", reversed, "query", "");
        }

        List<ChatMessage> messages = chatMessageRepository.findByStudentIdAndContentContainingIgnoreCaseOrderByCreatedAtDesc(
                student.getId(), query, PageRequest.of(0, 50));
        List<ChatMessage> reversed = new ArrayList<>(messages);
        java.util.Collections.reverse(reversed);

        Map<String, Object> result = new java.util.LinkedHashMap<>();
        result.put("messages", reversed);
        result.put("query", query);
        result.put("say", messages.size());
        return result;
    }
}
