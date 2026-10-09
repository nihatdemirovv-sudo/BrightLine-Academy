package com.aitqdk.magistr.repository;

import com.aitqdk.magistr.entity.Task;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TaskRepository extends JpaRepository<Task, String> {
    List<Task> findByTeacherIdAndStudentIdOrderByCreatedAtDesc(String teacherId, String studentId);

    List<Task> findByStudentIdOrderByCreatedAtDesc(String studentId);

    List<Task> findByTeacherId(String teacherId);

    long countByStudentIdAndCreatedAtAfter(String studentId, java.time.Instant after);

    void deleteByStudentId(String studentId);

    void deleteByTeacherId(String teacherId);
}
