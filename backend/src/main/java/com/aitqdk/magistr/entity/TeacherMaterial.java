package com.aitqdk.magistr.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;

/** Müəllimin himayəsindəki BÜTÜN tələbələrin READ-ONLY gördüyü ümumi material — bir sətir = bir fayl. */
@Getter
@Setter
@Entity
@Table(name = "teacher_materials")
public class TeacherMaterial extends BaseEntity {

    @Column(name = "teacher_id", nullable = false)
    private String teacherId;

    @Column(name = "ad", nullable = false)
    private String ad;

    @Column(name = "tip", nullable = false)
    private String tip; // "image" / "pdf"

    @Column(name = "data", nullable = false, columnDefinition = "TEXT")
    private String data; // base64 data-URI

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;
}
