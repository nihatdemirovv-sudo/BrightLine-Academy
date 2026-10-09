package com.aitqdk.magistr.repository;

import com.aitqdk.magistr.entity.Competition;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;

public interface CompetitionRepository extends JpaRepository<Competition, String> {

    List<Competition> findAllByOrderByCreatedAtDesc();

    List<Competition> findByStatusOrderByCreatedAtDesc(String status);

    List<Competition> findByStatusInOrderByCreatedAtDesc(Collection<String> statuses);

    long countByYaradiciIdAndStatusIn(String yaradiciId, Collection<String> statuses);
}
