package com.aitqdk.magistr.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;

@Getter
@Setter
@Entity
@Table(name = "bookmarks")
public class Bookmark extends BaseEntity {

    @Column(name = "student_id", nullable = false)
    private String studentId;

    @Column(name = "fenn", nullable = false)
    private String fenn;

    @Column(name = "sual", nullable = false, columnDefinition = "TEXT")
    private String sual;

    @Column(name = "variantlar", nullable = false, columnDefinition = "TEXT")
    private String variantlar;

    @Column(name = "dogru_cavab", nullable = false)
    private String dogruCavab;

    @Column(name = "izah", columnDefinition = "TEXT")
    private String izah = "";

    @Column(name = "movzu")
    private String movzu;

    @Column(name = "sehv_cavab", nullable = false)
    private String sehvCavab;

    @Column(name = "tekrar_edildi", nullable = false)
    private Boolean tekrarEdildi = false;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;
}
