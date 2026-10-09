package com.aitqdk.magistr.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;

@Getter
@Setter
@Entity
@Table(name = "error_patterns", uniqueConstraints = {
        @UniqueConstraint(name = "uq_error_pattern_student_tip_fenn", columnNames = {"student_id", "tip", "fenn"})
})
public class ErrorPattern extends BaseEntity {

    @Column(name = "student_id", nullable = false)
    private String studentId;

    @Column(name = "tip", nullable = false)
    private String tip;

    @Column(name = "fenn", nullable = false)
    private String fenn;

    @Column(name = "say", nullable = false)
    private Integer say = 1;

    @Column(name = "tovsie", columnDefinition = "TEXT")
    private String tovsie;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;
}
