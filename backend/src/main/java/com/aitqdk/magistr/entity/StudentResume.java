package com.aitqdk.magistr.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;

/** Tələbənin CV (rezyume) məlumatı — bütün struktur (şəxsi məlumat, təhsil, təcrübə, layihə, bacarıqlar)
 * tək JSON sətir kimi saxlanılır, çünki forması tamamilə frontend-in idarə etdiyi sərbəst mətn məzmunudur. */
@Getter
@Setter
@Entity
@Table(name = "student_resumes")
public class StudentResume extends BaseEntity {

    @Column(name = "student_id", nullable = false, unique = true)
    private String studentId;

    @Column(name = "data", columnDefinition = "TEXT")
    private String data;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;
}
