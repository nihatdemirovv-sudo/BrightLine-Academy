package com.aitqdk.magistr.repository;

import com.aitqdk.magistr.entity.CompetitionParticipant;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface CompetitionParticipantRepository extends JpaRepository<CompetitionParticipant, String> {

    List<CompetitionParticipant> findByCompetitionIdOrderByIstirakciNoAsc(String competitionId);

    List<CompetitionParticipant> findByCompetitionIdIn(Collection<String> competitionIds);

    Optional<CompetitionParticipant> findByCompetitionIdAndStudentId(String competitionId, String studentId);

    boolean existsByCompetitionIdAndStudentId(String competitionId, String studentId);

    long countByCompetitionId(String competitionId);

    List<CompetitionParticipant> findByStudentId(String studentId);

    void deleteByCompetitionIdAndStudentId(String competitionId, String studentId);

    void deleteByCompetitionId(String competitionId);

    void deleteByStudentId(String studentId);
}
