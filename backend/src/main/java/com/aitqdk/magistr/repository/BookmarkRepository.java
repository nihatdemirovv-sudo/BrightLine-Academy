package com.aitqdk.magistr.repository;

import com.aitqdk.magistr.entity.Bookmark;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BookmarkRepository extends JpaRepository<Bookmark, String> {
    List<Bookmark> findByStudentIdOrderByCreatedAtDesc(String studentId);
    List<Bookmark> findByStudentIdAndFennOrderByCreatedAtDesc(String studentId, String fenn, Pageable pageable);
    List<Bookmark> findByStudentIdAndTekrarEdildiFalseOrderByCreatedAtDesc(String studentId, Pageable pageable);
    long countByStudentId(String studentId);
    void deleteByStudentId(String studentId);
}
