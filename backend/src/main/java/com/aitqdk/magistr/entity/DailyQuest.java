package com.aitqdk.magistr.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;

@Getter
@Setter
@Entity
@Table(name = "daily_quests", uniqueConstraints = {
        @UniqueConstraint(name = "uq_quest_student_tarix", columnNames = {"student_id", "tarix"})
})
public class DailyQuest extends BaseEntity {

    @Column(name = "student_id", nullable = false)
    private String studentId;

    @Column(name = "tarix", nullable = false)
    private String tarix;

    @Column(name = "tasks", nullable = false, columnDefinition = "TEXT")
    private String tasks;

    @Column(name = "tamamlandi", nullable = false)
    private Integer tamamlandi = 0;

    @Column(name = "toplam", nullable = false)
    private Integer toplam = 0;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;
}
