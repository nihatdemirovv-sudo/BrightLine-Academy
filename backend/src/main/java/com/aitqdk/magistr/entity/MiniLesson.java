package com.aitqdk.magistr.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;

@Getter
@Setter
@Entity
@Table(name = "mini_lessons", uniqueConstraints = {
        @UniqueConstraint(name = "uq_mini_lesson_student_slug", columnNames = {"student_id", "slug"})
})
public class MiniLesson extends BaseEntity {

    @Column(name = "student_id", nullable = false)
    private String studentId;

    @Column(name = "fenn", nullable = false)
    private String fenn;

    @Column(name = "movzu", nullable = false)
    private String movzu;

    @Column(name = "slug", nullable = false)
    private String slug;

    @Column(name = "metin", nullable = false, columnDefinition = "TEXT")
    private String metin;

    @Column(name = "basliq", nullable = false)
    private String basliq;

    @Column(name = "oxunma_vaxti", nullable = false)
    private Integer oxunmaVaxti = 5;

    @Column(name = "quiz_suallar", columnDefinition = "TEXT")
    private String quizSuallar;

    @Column(name = "oxundu", nullable = false)
    private Boolean oxundu = false;

    @Column(name = "bookmark_edildi", nullable = false)
    private Boolean bookmarkEdildi = false;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;
}
