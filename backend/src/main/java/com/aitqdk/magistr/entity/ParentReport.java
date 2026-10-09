package com.aitqdk.magistr.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;

@Getter
@Setter
@Entity
@Table(name = "parent_reports")
public class ParentReport extends BaseEntity {

    @Column(name = "student_id", nullable = false)
    private String studentId;

    @Column(name = "baslama_tarixi", nullable = false)
    private String baslamaTarixi;

    @Column(name = "bitme_tarixi", nullable = false)
    private String bitmeTarixi;

    @Column(name = "metin", nullable = false, columnDefinition = "TEXT")
    private String metin;

    @Column(name = "pdf_yol")
    private String pdfYol;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;
}
