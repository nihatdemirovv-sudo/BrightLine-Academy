package com.aitqdk.magistr.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;

@Getter
@Setter
@Entity
@Table(name = "question_sets")
public class QuestionSet extends BaseEntity {

    @Column(name = "student_id", nullable = false)
    private String studentId;

    @Column(name = "fenn", nullable = false)
    private String fenn;

    @Column(name = "say", nullable = false)
    private Integer say;

    @Column(name = "suallar", nullable = false, columnDefinition = "TEXT")
    private String suallar;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;
}
