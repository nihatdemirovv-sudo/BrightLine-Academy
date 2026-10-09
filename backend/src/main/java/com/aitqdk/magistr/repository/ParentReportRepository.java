package com.aitqdk.magistr.repository;

import com.aitqdk.magistr.entity.ParentReport;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ParentReportRepository extends JpaRepository<ParentReport, String> {
    List<ParentReport> findByStudentIdOrderByCreatedAtDesc(String studentId, Pageable pageable);
    void deleteByStudentId(String studentId);
}
