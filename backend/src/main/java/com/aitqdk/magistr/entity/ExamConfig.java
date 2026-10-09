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
@Table(name = "exam_configs", uniqueConstraints = {
        @UniqueConstraint(name = "uq_exam_config_student", columnNames = "student_id")
})
public class ExamConfig extends BaseEntity {

    @Column(name = "student_id", nullable = false)
    private String studentId;

    @Column(name = "imtahan_tarixi", nullable = false)
    private String imtahanTarixi;

    @Column(name = "nov", nullable = false)
    private String nov = "tqdk";

    @Column(name = "muddet", nullable = false)
    private Integer muddet = 180;

    @Column(name = "sual_sayi", nullable = false)
    private Integer sualSayi = 30;

    @Column(name = "kecid_bali", nullable = false)
    private Integer kecidBali = 200;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;
}
