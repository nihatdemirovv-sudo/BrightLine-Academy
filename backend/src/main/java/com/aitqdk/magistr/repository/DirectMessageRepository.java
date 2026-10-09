package com.aitqdk.magistr.repository;

import com.aitqdk.magistr.entity.DirectMessage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface DirectMessageRepository extends JpaRepository<DirectMessage, String> {
    List<DirectMessage> findTop200ByTeacherIdAndStudentIdOrderByCreatedAtDesc(String teacherId, String studentId);

    Optional<DirectMessage> findTopByTeacherIdAndStudentIdOrderByCreatedAtDesc(String teacherId, String studentId);

    long countByTeacherIdAndStudentIdAndSenderIdNotAndSilinibFalseAndCreatedAtAfter(
            String teacherId, String studentId, String senderId, Instant after);

    void deleteByTeacherId(String teacherId);

    void deleteByStudentId(String studentId);
}
