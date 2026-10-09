package com.aitqdk.magistr.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;

/** Tələbənin "Məndən sil" seçdiyi mesajlar — YALNIZ bu tələbənin görünüşündən yox olur,
 * digər üzvlər mesajı normal görməyə davam edir. Əksinə, ChatGroupMessage.silinib=true
 * "Hər kəsdən sil"dir — hamıya "mesaj silindi" placeholder-i kimi görünür. */
@Getter
@Setter
@Entity
@Table(name = "chat_group_message_hides", uniqueConstraints = {
        @UniqueConstraint(name = "uq_message_hide", columnNames = {"student_id", "message_id"})
})
public class ChatGroupMessageHide extends BaseEntity {

    @Column(name = "student_id", nullable = false)
    private String studentId;

    @Column(name = "message_id", nullable = false)
    private String messageId;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;
}
