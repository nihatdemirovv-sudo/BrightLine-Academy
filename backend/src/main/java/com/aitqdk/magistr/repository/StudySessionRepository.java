package com.aitqdk.magistr.repository;

import com.aitqdk.magistr.entity.StudySession;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface StudySessionRepository extends JpaRepository<StudySession, String> {
    List<StudySession> findByStudentId(String studentId);
    List<StudySession> findByStudentIdOrderByCreatedAtDesc(String studentId, Pageable pageable);
    long countByStudentId(String studentId);
    void deleteByStudentId(String studentId);
}
