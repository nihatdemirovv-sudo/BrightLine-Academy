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
@Table(name = "flashcards")
public class Flashcard extends BaseEntity {

    @Column(name = "student_id", nullable = false)
    private String studentId;

    @Column(name = "on_yuzu", nullable = false, columnDefinition = "TEXT")
    private String onYuzu;

    @Column(name = "cavab", nullable = false, columnDefinition = "TEXT")
    private String cavab;

    @Column(name = "fenn", nullable = false)
    private String fenn;

    @Column(name = "movzu")
    private String movzu;

    @Column(name = "repetitions", nullable = false)
    private Integer repetitions = 0;

    @Column(name = "ease", nullable = false)
    private Double ease = 2.5;

    @Column(name = "interval_days", nullable = false)
    private Integer interval = 0;

    @Column(name = "next_review", nullable = false)
    private Instant nextReview = Instant.now();

    @Column(name = "sehv_sayi", nullable = false)
    private Integer sehvSayi = 0;

    @Column(name = "dogru_sayi", nullable = false)
    private Integer dogruSayi = 0;

    @Column(name = "bookmark_id")
    private String bookmarkId;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;
}
