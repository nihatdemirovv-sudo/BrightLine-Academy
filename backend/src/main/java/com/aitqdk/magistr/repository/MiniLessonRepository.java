package com.aitqdk.magistr.repository;

import com.aitqdk.magistr.entity.MiniLesson;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface MiniLessonRepository extends JpaRepository<MiniLesson, String> {
    List<MiniLesson> findByStudentIdOrderByCreatedAtDesc(String studentId, Pageable pageable);
    List<MiniLesson> findByStudentIdAndFennOrderByCreatedAtDesc(String studentId, String fenn, Pageable pageable);
    Optional<MiniLesson> findByStudentIdAndSlug(String studentId, String slug);
    void deleteByStudentId(String studentId);
}
