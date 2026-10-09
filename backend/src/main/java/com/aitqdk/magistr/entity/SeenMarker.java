package com.aitqdk.magistr.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

/** "Bu bölməyə/söhbətə ən son nə vaxt baxdım" işarəsi — oxunmamış sayğacları (nav badge-ləri)
 * bundan SONRA yaranan məlumatı sayır. key nümunələri: "group:{id}", "support:{ticketId}",
 * "dm:{partnerId}", "mt:tasks", "mt:materials", "mt:exams", "t:students". */
@Getter
@Setter
@Entity
@Table(name = "seen_markers", uniqueConstraints = {
        @UniqueConstraint(name = "uq_seen_marker", columnNames = {"student_id", "marker_key"})
})
public class SeenMarker extends BaseEntity {

    @Column(name = "student_id", nullable = false)
    private String studentId;

    @Column(name = "marker_key", nullable = false, length = 160)
    private String key;

    @Column(name = "seen_at", nullable = false)
    private Instant seenAt;
}
