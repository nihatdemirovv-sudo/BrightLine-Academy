package com.aitqdk.magistr.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;

@Getter
@Setter
@Entity
@Table(name = "exam_attempts")
public class ExamAttempt extends BaseEntity {

    @Column(name = "student_id", nullable = false)
    private String studentId;

    @Column(name = "baslama_vaxti", nullable = false)
    private Instant baslamaVaxti = Instant.now();

    @Column(name = "bitme_vaxti")
    private Instant bitmeVaxti;

    @Column(name = "sual_sayi", nullable = false)
    private Integer sualSayi;

    @Column(name = "dogru_cavab", nullable = false)
    private Integer dogruCavab = 0;

    @Column(name = "sehv_cavab", nullable = false)
    private Integer sehvCavab = 0;

    @Column(name = "bos_cavab", nullable = false)
    private Integer bosCavab = 0;

    @Column(name = "bal", nullable = false)
    private Integer bal = 0;

    @Column(name = "muddet_san", nullable = false)
    private Integer muddetSan = 0;

    @Column(name = "tamamlandi", nullable = false)
    private Boolean tamamlandi = false;

    @Column(name = "suallar", nullable = false, columnDefinition = "TEXT")
    private String suallar;

    @Column(name = "cavablar", nullable = false, columnDefinition = "TEXT")
    private String cavablar = "{}";

    @Column(name = "fenn_bolugu", nullable = false, columnDefinition = "TEXT")
    private String fennBolugu = "{}";

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;
}
