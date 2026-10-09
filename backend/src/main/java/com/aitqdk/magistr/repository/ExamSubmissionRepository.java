package com.aitqdk.magistr.repository;

import com.aitqdk.magistr.entity.ExamSubmission;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ExamSubmissionRepository extends JpaRepository<ExamSubmission, String> {
    List<ExamSubmission> findByExamIdOrderBySubmittedAtDesc(String examId);

    Optional<ExamSubmission> findByExamIdAndStudentId(String examId, String studentId);

    List<ExamSubmission> findByStudentId(String studentId);

    void deleteByExamId(String examId);

    void deleteByStudentId(String studentId);

    long countByExamIdInAndStatus(java.util.Collection<String> examIds, String status);

    long countByStudentIdAndReviewedAtAfter(String studentId, java.time.Instant after);
}
