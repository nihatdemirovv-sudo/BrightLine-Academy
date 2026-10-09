package com.aitqdk.magistr.repository;

import com.aitqdk.magistr.entity.StudentAchievement;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface StudentAchievementRepository extends JpaRepository<StudentAchievement, String> {
    List<StudentAchievement> findByStudentId(String studentId);
    Optional<StudentAchievement> findByStudentIdAndKod(String studentId, String kod);
    void deleteByStudentId(String studentId);
}
