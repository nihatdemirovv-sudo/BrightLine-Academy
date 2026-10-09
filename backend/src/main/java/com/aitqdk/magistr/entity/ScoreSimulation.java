package com.aitqdk.magistr.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;

@Getter
@Setter
@Entity
@Table(name = "score_simulations")
public class ScoreSimulation extends BaseEntity {

    @Column(name = "student_id", nullable = false)
    private String studentId;

    @Column(name = "nov", nullable = false)
    private String nov = "tqdk";

    @Column(name = "fenn_netice", nullable = false, columnDefinition = "TEXT")
    private String fennNetice;

    @Column(name = "bal", nullable = false)
    private Double bal = 0.0;

    @Column(name = "maksimal_bal", nullable = false)
    private Integer maksimalBal = 700;

    @Column(name = "qebul_ehtimali", nullable = false)
    private Integer qebulEhtimali = 0;

    @Column(name = "analiz", columnDefinition = "TEXT")
    private String analiz;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;
}
