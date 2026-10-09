package com.aitqdk.magistr.repository;

import com.aitqdk.magistr.entity.WeakTopic;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface WeakTopicRepository extends JpaRepository<WeakTopic, String> {
    List<WeakTopic> findByStudentIdOrderByOncelikDesc(String studentId);
    List<WeakTopic> findByStudentIdAndFenn(String studentId, String fenn);
    Optional<WeakTopic> findByStudentIdAndFennAndMovzu(String studentId, String fenn, String movzu);
    void deleteByStudentId(String studentId);
}
