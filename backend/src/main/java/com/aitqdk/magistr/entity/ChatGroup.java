package com.aitqdk.magistr.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;

@Getter
@Setter
@Entity
@Table(name = "chat_groups")
public class ChatGroup extends BaseEntity {

    @Column(name = "ad", nullable = false)
    private String ad;

    @Column(name = "password_hash", nullable = false)
    private String passwordHash;

    @Column(name = "yaradici_id", nullable = false)
    private String yaradiciId; // qrupu yaradan tələbənin id-si — qrupun öz "inzibatçısı" ("Müəllim")

    @Column(name = "qapali", nullable = false)
    private Boolean qapali = false; // true olanda HEÇ KİM (inzibatçı daxil) mesaj yaza bilmir

    @Column(name = "yalniz_admin_yaza")
    private Boolean yalnizAdminYaza; // nullable, true olanda YALNIZ inzibatçı (Müəllim) mesaj yaza bilir

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;
}
