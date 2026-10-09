package com.aitqdk.magistr.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;

/** Müəllim ilə onun (qəbul edilmiş) tələbəsi arasındakı şəxsi söhbətin bir mesajı.
 * Söhbət (teacherId, studentId) cütü ilə müəyyən olunur — senderId ikisindən biridir. */
@Getter
@Setter
@Entity
@Table(name = "direct_messages", indexes = {
        @Index(name = "idx_dm_pair", columnList = "teacher_id, student_id, created_at")
})
public class DirectMessage extends BaseEntity {

    @Column(name = "teacher_id", nullable = false)
    private String teacherId;

    @Column(name = "student_id", nullable = false)
    private String studentId;

    @Column(name = "sender_id", nullable = false)
    private String senderId;

    @Column(name = "mesaj", nullable = false, columnDefinition = "TEXT")
    private String mesaj;

    @Column(name = "sekil", columnDefinition = "TEXT")
    private String sekil; // base64 data URI, istəyə bağlı

    @Column(name = "silinib", nullable = false)
    private Boolean silinib = false;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;
}
