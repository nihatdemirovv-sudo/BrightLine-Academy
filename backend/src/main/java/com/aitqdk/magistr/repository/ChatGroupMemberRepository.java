package com.aitqdk.magistr.repository;

import com.aitqdk.magistr.entity.ChatGroupMember;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ChatGroupMemberRepository extends JpaRepository<ChatGroupMember, String> {
    List<ChatGroupMember> findByGroupIdOrderByJoinedAtAsc(String groupId);

    List<ChatGroupMember> findByStudentId(String studentId);

    Optional<ChatGroupMember> findByGroupIdAndStudentId(String groupId, String studentId);

    boolean existsByGroupIdAndStudentId(String groupId, String studentId);

    long countByGroupId(String groupId);

    void deleteByGroupIdAndStudentId(String groupId, String studentId);

    void deleteByGroupId(String groupId);
}
