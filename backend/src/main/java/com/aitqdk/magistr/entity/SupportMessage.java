package com.aitqdk.magistr.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;

@Getter
@Setter
@Entity
@Table(name = "support_messages")
public class SupportMessage extends BaseEntity {

    @Column(name = "ticket_id", nullable = false)
    private String ticketId;

    @Column(name = "gonderen", nullable = false)
    private String gonderen; // "STUDENT" | "ADMIN"

    @Column(name = "mesaj", nullable = false, columnDefinition = "TEXT")
    private String mesaj;

    @Column(name = "sekil", columnDefinition = "TEXT")
    private String sekil; // base64 data URI, istəyə bağlı

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;
}
