package com.aitqdk.magistr.repository;

import com.aitqdk.magistr.entity.ChatMessage;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, String> {
    List<ChatMessage> findByStudentIdOrderByCreatedAtDesc(String studentId, Pageable pageable);
    List<ChatMessage> findByStudentIdAndContentContainingIgnoreCaseOrderByCreatedAtDesc(
            String studentId, String query, Pageable pageable);
    long countByStudentIdAndRole(String studentId, String role);
    void deleteByStudentId(String studentId);
}
