package com.aitqdk.magistr.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;

/** Müəllimin axtarıb tələbəyə "himayə sorğusu" göndərdiyi əlaqə — tapşırıq/material/imtahan
 * bunun üzərindən yayılır, AMMA yalnız tələbə sorğunu QƏBUL edəndən sonra. */
@Getter
@Setter
@Entity
@Table(name = "teacher_students", uniqueConstraints = {
        @UniqueConstraint(name = "uq_teacher_student", columnNames = {"teacher_id", "student_id"})
})
public class TeacherStudent extends BaseEntity {

    @Column(name = "teacher_id", nullable = false)
    private String teacherId;

    @Column(name = "student_id", nullable = false)
    private String studentId;

    // nullable — köhnə (bu sahədən əvvəl yaradılmış) sətirlərdə null qalır, tətbiq kodu
    // null-u "QEBUL_EDILIB" kimi şərh edir (geriyə-uyğunluq). Yeni sətirlər HƏMİŞƏ açıq
    // dəyərlə yaranır: "GOZLEYIR" (sorğu göndərilib) / "QEBUL_EDILIB" (tələbə qəbul edib).
    @Column(name = "status")
    private String status;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;
}
