package com.aitqdk.magistr.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;

/** Tələbənin bir TeacherExam-a göndərdiyi cavab + müəllimin geri feedback-i. */
@Getter
@Setter
@Entity
@Table(name = "exam_submissions", uniqueConstraints = {
        @UniqueConstraint(name = "uq_exam_submission", columnNames = {"exam_id", "student_id"})
})
public class ExamSubmission extends BaseEntity {

    @Column(name = "exam_id", nullable = false)
    private String examId;

    @Column(name = "student_id", nullable = false)
    private String studentId;

    @Column(name = "cavab", columnDefinition = "TEXT")
    private String cavab;

    @Column(name = "sekil", columnDefinition = "TEXT")
    private String sekil;

    @Column(name = "status", nullable = false)
    private String status = "GONDERILIB"; // "GONDERILIB" / "YOXLANILIB"

    @Column(name = "feedback", columnDefinition = "TEXT")
    private String feedback;

    @Column(name = "netice")
    private String netice; // sərbəst mətn, məs. "8/10"

    @CreationTimestamp
    @Column(name = "submitted_at", updatable = false)
    private Instant submittedAt;

    @Column(name = "reviewed_at")
    private Instant reviewedAt; // yalnız feedback verildikdə əl ilə təyin olunur
}
