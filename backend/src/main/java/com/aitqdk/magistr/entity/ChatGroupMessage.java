package com.aitqdk.magistr.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;

@Getter
@Setter
@Entity
@Table(name = "chat_group_messages")
public class ChatGroupMessage extends BaseEntity {

    @Column(name = "group_id", nullable = false)
    private String groupId;

    @Column(name = "sender_id", nullable = false)
    private String senderId;

    @Column(name = "mesaj", nullable = false, columnDefinition = "TEXT")
    private String mesaj;

    @Column(name = "sekil", columnDefinition = "TEXT")
    private String sekil; // base64 data URI, istəyə bağlı

    @Column(name = "ses", columnDefinition = "TEXT")
    private String ses; // base64 audio data URI, istəyə bağlı

    @Column(name = "cavab_id")
    private String cavabId; // cavablanan mesajın id-si, istəyə bağlı (reply-to)

    @Column(name = "redakta_edilib", nullable = false)
    private Boolean redaktaEdilib = false;

    @Column(name = "silinib", nullable = false)
    private Boolean silinib = false;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;
}
