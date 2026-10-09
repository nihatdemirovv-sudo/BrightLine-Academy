package com.aitqdk.magistr.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;

/**
 * "Bilik Arenası" bildirişləri — layihədə ümumi backend notification sistemi olmadığı üçün
 * arena-ya özəl yüngül lent. Dashboard-dakı "🏆 Təbriklər" banneri, lobbi zəng ikonu və
 * oxunmamış say bundan gəlir.
 */
@Getter
@Setter
@Entity
@Table(name = "arena_notifications")
public class ArenaNotification extends BaseEntity {

    @Column(name = "student_id", nullable = false)
    private String studentId;

    /** QOSULDU / BASLADI / BITDI / QALIB / DEVET */
    @Column(name = "tip", nullable = false)
    private String tip;

    @Column(name = "mesaj", nullable = false, columnDefinition = "TEXT")
    private String mesaj;

    @Column(name = "competition_id")
    private String competitionId;

    @Column(name = "oxunub", nullable = false)
    private Boolean oxunub = false;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;
}
