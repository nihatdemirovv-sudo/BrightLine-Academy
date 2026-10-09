package com.aitqdk.magistr.repository;

import com.aitqdk.magistr.entity.StudentResume;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface StudentResumeRepository extends JpaRepository<StudentResume, String> {
    Optional<StudentResume> findByStudentId(String studentId);

    void deleteByStudentId(String studentId);
}
