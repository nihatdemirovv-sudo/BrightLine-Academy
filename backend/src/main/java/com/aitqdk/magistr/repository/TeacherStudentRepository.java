package com.aitqdk.magistr.repository;

import com.aitqdk.magistr.entity.TeacherStudent;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TeacherStudentRepository extends JpaRepository<TeacherStudent, String> {
    List<TeacherStudent> findByTeacherId(String teacherId);

    List<TeacherStudent> findByStudentId(String studentId);

    Optional<TeacherStudent> findByTeacherIdAndStudentId(String teacherId, String studentId);

    boolean existsByTeacherIdAndStudentId(String teacherId, String studentId);

    long countByTeacherId(String teacherId);

    List<TeacherStudent> findByStudentIdAndStatus(String studentId, String status);

    void deleteByTeacherIdAndStudentId(String teacherId, String studentId);

    void deleteByStudentId(String studentId);

    void deleteByTeacherId(String teacherId);
}
