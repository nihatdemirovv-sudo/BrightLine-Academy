package com.aitqdk.magistr.repository;

import com.aitqdk.magistr.entity.Flashcard;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.List;

public interface FlashcardRepository extends JpaRepository<Flashcard, String> {
    List<Flashcard> findByStudentIdOrderByNextReviewAsc(String studentId);
    List<Flashcard> findByStudentIdAndFenn(String studentId, String fenn);
    List<Flashcard> findByStudentIdAndNextReviewLessThanEqualOrderByNextReviewAsc(String studentId, Instant now);
    long countByStudentId(String studentId);
    long countByStudentIdAndNextReviewLessThanEqual(String studentId, Instant now);
    void deleteByStudentId(String studentId);
}
