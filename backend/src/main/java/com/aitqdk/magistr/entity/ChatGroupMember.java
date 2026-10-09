package com.aitqdk.magistr.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;

@Getter
@Setter
@Entity
@Table(name = "chat_group_members", uniqueConstraints = {
        @UniqueConstraint(name = "uq_group_member", columnNames = {"group_id", "student_id"})
})
public class ChatGroupMember extends BaseEntity {

    @Column(name = "group_id", nullable = false)
    private String groupId;

    @Column(name = "student_id", nullable = false)
    private String studentId;

    @CreationTimestamp
    @Column(name = "joined_at", updatable = false)
    private Instant joinedAt;

    // "Söhbəti təmizlə" — YALNIZ bu üzv üçün fərdi; bu tarixdən ƏVVƏLKİ mesajlar ona
    // göstərilmir, digər üzvlərə TƏSİR ETMİR (server tərəfdə fərdi filtr, məlumat silinmir).
    @Column(name = "cleared_at")
    private Instant clearedAt;
}
