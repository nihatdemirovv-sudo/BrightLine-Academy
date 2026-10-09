package com.aitqdk.magistr.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;

@Getter
@Setter
@Entity
@Table(name = "student_achievements", uniqueConstraints = {
        @UniqueConstraint(name = "uq_achievement_student_kod", columnNames = {"student_id", "kod"})
})
public class StudentAchievement extends BaseEntity {

    @Column(name = "student_id", nullable = false)
    private String studentId;

    @Column(name = "kod", nullable = false)
    private String kod;

    @CreationTimestamp
    @Column(name = "acildiga", updatable = false)
    private Instant acildiga;
}
