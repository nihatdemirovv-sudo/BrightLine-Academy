package com.aitqdk.magistr.repository;

import com.aitqdk.magistr.entity.ChatGroupMessage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ChatGroupMessageRepository extends JpaRepository<ChatGroupMessage, String> {
    List<ChatGroupMessage> findByGroupIdOrderByCreatedAtAsc(String groupId);

    long countByGroupId(String groupId);

    long countByGroupIdAndSenderIdNotAndSilinibFalseAndCreatedAtAfter(String groupId, String senderId, java.time.Instant after);

    void deleteByGroupId(String groupId);
}
