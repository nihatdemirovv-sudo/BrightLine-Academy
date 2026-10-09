package com.aitqdk.magistr.repository;

import com.aitqdk.magistr.entity.DailyQuest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface DailyQuestRepository extends JpaRepository<DailyQuest, String> {
    Optional<DailyQuest> findByStudentIdAndTarix(String studentId, String tarix);
    List<DailyQuest> findByStudentIdOrderByCreatedAtDesc(String studentId, Pageable pageable);
    void deleteByStudentId(String studentId);
}
