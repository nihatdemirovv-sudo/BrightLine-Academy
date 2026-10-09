package com.aitqdk.magistr.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;

@Getter
@Setter
@Entity
@Table(name = "study_sessions")
public class StudySession extends BaseEntity {

    @Column(name = "student_id", nullable = false)
    private String studentId;

    @Column(name = "muddet", nullable = false)
    private Integer muddet;

    @Column(name = "fenn")
    private String fenn;

    @Column(name = "tamamlandi", nullable = false)
    private Boolean tamamlandi = true;

    @Column(name = "baslama_vaxti", nullable = false)
    private Instant baslamaVaxti = Instant.now();

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;
}
