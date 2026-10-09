package com.aitqdk.magistr.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;

@Getter
@Setter
@Entity
@Table(name = "activities")
public class Activity extends BaseEntity {

    @Column(name = "student_id", nullable = false)
    private String studentId;

    @Column(name = "nov", nullable = false)
    private String nov;

    @Column(name = "detal")
    private String detal;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;
}
