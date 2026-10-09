package com.aitqdk.magistr.repository;

import com.aitqdk.magistr.entity.TeacherMaterial;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TeacherMaterialRepository extends JpaRepository<TeacherMaterial, String> {
    List<TeacherMaterial> findByTeacherIdOrderByCreatedAtDesc(String teacherId);

    void deleteByTeacherId(String teacherId);

    long countByTeacherIdInAndCreatedAtAfter(java.util.Collection<String> teacherIds, java.time.Instant after);
}
