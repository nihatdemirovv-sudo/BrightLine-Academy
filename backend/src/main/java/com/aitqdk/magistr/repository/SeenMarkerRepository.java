package com.aitqdk.magistr.repository;

import com.aitqdk.magistr.entity.SeenMarker;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SeenMarkerRepository extends JpaRepository<SeenMarker, String> {
    List<SeenMarker> findByStudentId(String studentId);

    Optional<SeenMarker> findByStudentIdAndKey(String studentId, String key);

    void deleteByStudentId(String studentId);
}
