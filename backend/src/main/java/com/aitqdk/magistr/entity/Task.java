package com.aitqdk.magistr.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;

/** Müəllimin fərdi bir tələbəyə açdığı tapşırıq — checklist (items) + fayllar (attachments),
 * YALNIZ o tələbə + müəllim görür. items/attachments JSON-blob (DailyQuest.tasks pattern-i). */
@Getter
@Setter
@Entity
@Table(name = "tasks")
public class Task extends BaseEntity {

    @Column(name = "teacher_id", nullable = false)
    private String teacherId;

    @Column(name = "student_id", nullable = false)
    private String studentId;

    @Column(name = "baslik", nullable = false, columnDefinition = "TEXT")
    private String baslik;

    @Column(name = "items", columnDefinition = "TEXT")
    private String items; // JSON: [{id, metn, tamam}]

    @Column(name = "attachments", columnDefinition = "TEXT")
    private String attachments; // JSON: [{id, ad, tip, data}]

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;
}
