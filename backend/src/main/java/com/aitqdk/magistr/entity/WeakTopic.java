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
@Table(name = "weak_topics", uniqueConstraints = {
        @UniqueConstraint(name = "uq_weak_topic_student_fenn_movzu", columnNames = {"student_id", "fenn", "movzu"})
})
public class WeakTopic extends BaseEntity {

    @Column(name = "student_id", nullable = false)
    private String studentId;

    @Column(name = "fenn", nullable = false)
    private String fenn;

    @Column(name = "movzu", nullable = false)
    private String movzu;

    @Column(name = "sehv_nisbeti", nullable = false)
    private Integer sehvNisbeti = 0;

    @Column(name = "sual_sayi", nullable = false)
    private Integer sualSayi = 0;

    @Column(name = "oncelik", nullable = false)
    private Integer oncelik = 3;

    @Column(name = "tovsie", columnDefinition = "TEXT")
    private String tovsie;

    @Column(name = "oynenildi", nullable = false)
    private Boolean oynenildi = false;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;
}
