package com.aitqdk.magistr.repository;

import com.aitqdk.magistr.entity.ExamConfig;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ExamConfigRepository extends JpaRepository<ExamConfig, String> {
    Optional<ExamConfig> findByStudentId(String studentId);
    void deleteByStudentId(String studentId);
}
