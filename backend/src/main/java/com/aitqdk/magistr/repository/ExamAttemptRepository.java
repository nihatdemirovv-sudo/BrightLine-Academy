package com.aitqdk.magistr.repository;

import com.aitqdk.magistr.entity.ExamAttempt;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ExamAttemptRepository extends JpaRepository<ExamAttempt, String> {
    List<ExamAttempt> findByStudentIdOrderByCreatedAtDesc(String studentId, Pageable pageable);
    List<ExamAttempt> findByStudentIdAndTamamlandiTrueOrderByCreatedAtDesc(String studentId, Pageable pageable);
    long countByStudentId(String studentId);
    void deleteByStudentId(String studentId);
}
