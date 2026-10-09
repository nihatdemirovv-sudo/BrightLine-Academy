package com.aitqdk.magistr.repository;

import com.aitqdk.magistr.entity.ChatGroupMessageHide;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;

public interface ChatGroupMessageHideRepository extends JpaRepository<ChatGroupMessageHide, String> {
    boolean existsByStudentIdAndMessageId(String studentId, String messageId);

    List<ChatGroupMessageHide> findByStudentIdAndMessageIdIn(String studentId, Collection<String> messageIds);
}
