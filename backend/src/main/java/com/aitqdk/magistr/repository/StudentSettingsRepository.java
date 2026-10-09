package com.aitqdk.magistr.repository;

import com.aitqdk.magistr.entity.StudentSettings;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface StudentSettingsRepository extends JpaRepository<StudentSettings, String> {
    Optional<StudentSettings> findByStudentId(String studentId);
    void deleteByStudentId(String studentId);
}
