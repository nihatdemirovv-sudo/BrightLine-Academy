package com.aitqdk.magistr.repository;

import com.aitqdk.magistr.entity.ArenaNotification;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ArenaNotificationRepository extends JpaRepository<ArenaNotification, String> {

    List<ArenaNotification> findTop30ByStudentIdOrderByCreatedAtDesc(String studentId);

    List<ArenaNotification> findByStudentIdAndOxunubFalse(String studentId);

    long countByStudentIdAndOxunubFalse(String studentId);

    void deleteByStudentId(String studentId);
}
