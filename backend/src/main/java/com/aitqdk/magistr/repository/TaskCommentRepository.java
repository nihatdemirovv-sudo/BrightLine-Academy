package com.aitqdk.magistr.repository;

import com.aitqdk.magistr.entity.TaskComment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TaskCommentRepository extends JpaRepository<TaskComment, String> {
    List<TaskComment> findByTaskIdOrderByCreatedAtAsc(String taskId);

    void deleteByTaskId(String taskId);

    long countByTaskIdInAndAuthorRolAndCreatedAtAfter(java.util.Collection<String> taskIds, String authorRol, java.time.Instant after);
}
