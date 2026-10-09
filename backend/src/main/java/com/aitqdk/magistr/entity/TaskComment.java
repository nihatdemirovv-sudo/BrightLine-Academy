package com.aitqdk.magistr.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;

/** Tapşırığın altındakı comment-lər (Bitrix-vari) — həm tələbə, həm müəllim yaza bilər. */
@Getter
@Setter
@Entity
@Table(name = "task_comments")
public class TaskComment extends BaseEntity {

    @Column(name = "task_id", nullable = false)
    private String taskId;

    @Column(name = "author_id", nullable = false)
    private String authorId;

    @Column(name = "author_rol", nullable = false)
    private String authorRol; // "telebe" / "muellim"

    @Column(name = "mesaj", nullable = false, columnDefinition = "TEXT")
    private String mesaj;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;
}
