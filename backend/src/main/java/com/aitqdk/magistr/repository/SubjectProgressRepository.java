package com.aitqdk.magistr.repository;

import com.aitqdk.magistr.entity.SubjectProgress;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SubjectProgressRepository extends JpaRepository<SubjectProgress, String> {
    List<SubjectProgress> findByStudentId(String studentId);
    Optional<SubjectProgress> findByStudentIdAndFenn(String studentId, String fenn);
    void deleteByStudentId(String studentId);
}
