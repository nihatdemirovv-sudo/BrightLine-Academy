package com.aitqdk.magistr.repository;

import com.aitqdk.magistr.entity.TeacherExam;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TeacherExamRepository extends JpaRepository<TeacherExam, String> {
    List<TeacherExam> findByTeacherIdOrderByCreatedAtDesc(String teacherId);

    void deleteByTeacherId(String teacherId);

    long countByTeacherIdInAndCreatedAtAfter(java.util.Collection<String> teacherIds, java.time.Instant after);
}
