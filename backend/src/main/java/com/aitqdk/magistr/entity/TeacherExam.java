package com.aitqdk.magistr.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;

/** Müəllimin himayəsindəki BÜTÜN tələbələrə elan etdiyi imtahan (sənəd + təlimat). */
@Getter
@Setter
@Entity
@Table(name = "teacher_exams")
public class TeacherExam extends BaseEntity {

    @Column(name = "teacher_id", nullable = false)
    private String teacherId;

    @Column(name = "baslik", nullable = false, columnDefinition = "TEXT")
    private String baslik;

    @Column(name = "sened", columnDefinition = "TEXT")
    private String sened; // base64 data-URI, image/pdf

    @Column(name = "telimat", columnDefinition = "TEXT")
    private String telimat;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;
}
