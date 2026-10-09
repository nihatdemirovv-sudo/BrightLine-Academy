package com.aitqdk.magistr.repository;

import com.aitqdk.magistr.entity.ErrorPattern;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ErrorPatternRepository extends JpaRepository<ErrorPattern, String> {
    List<ErrorPattern> findByStudentId(String studentId);
    Optional<ErrorPattern> findByStudentIdAndTipAndFenn(String studentId, String tip, String fenn);
    void deleteByStudentId(String studentId);
}
