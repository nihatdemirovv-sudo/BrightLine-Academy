package com.aitqdk.magistr.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;

@Getter
@Setter
@Entity
@Table(name = "subject_progress", uniqueConstraints = {
        @UniqueConstraint(name = "uq_progress_student_fenn", columnNames = {"student_id", "fenn"})
})
public class SubjectProgress extends BaseEntity {

    @Column(name = "student_id", nullable = false)
    private String studentId;

    @Column(name = "fenn", nullable = false)
    private String fenn;

    @Column(name = "seviyye", nullable = false)
    private Integer seviyye = 0;

    @Column(name = "hall_sual_sayi", nullable = false)
    private Integer hallSualSayi = 0;

    @Column(name = "dogru_cavab", nullable = false)
    private Integer dogruCavab = 0;

    @Column(name = "yildiz", nullable = false)
    private Integer yildiz = 0;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;
}
