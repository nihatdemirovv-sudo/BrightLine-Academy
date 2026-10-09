package com.aitqdk.magistr.repository;

import com.aitqdk.magistr.entity.ScoreSimulation;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ScoreSimulationRepository extends JpaRepository<ScoreSimulation, String> {
    List<ScoreSimulation> findByStudentIdOrderByCreatedAtDesc(String studentId, Pageable pageable);
    void deleteByStudentId(String studentId);
}
