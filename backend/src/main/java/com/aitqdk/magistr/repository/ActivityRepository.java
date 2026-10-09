package com.aitqdk.magistr.repository;

import com.aitqdk.magistr.entity.Activity;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.List;

public interface ActivityRepository extends JpaRepository<Activity, String> {
    List<Activity> findByStudentId(String studentId);
    List<Activity> findByStudentIdOrderByCreatedAtDesc(String studentId, Pageable pageable);
    List<Activity> findByStudentIdAndCreatedAtAfter(String studentId, Instant after);
    long countByStudentId(String studentId);
    void deleteByStudentId(String studentId);
}
