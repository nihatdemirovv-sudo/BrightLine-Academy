package com.aitqdk.magistr.repository;

import com.aitqdk.magistr.entity.QuestionSet;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface QuestionSetRepository extends JpaRepository<QuestionSet, String> {
    List<QuestionSet> findByStudentIdOrderByCreatedAtDesc(String studentId, Pageable pageable);
    List<QuestionSet> findByStudentIdAndFennOrderByCreatedAtDesc(String studentId, String fenn, Pageable pageable);
    long countByStudentId(String studentId);
    void deleteByStudentId(String studentId);
}
