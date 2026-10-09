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
@Table(name = "students", uniqueConstraints = {
        @UniqueConstraint(name = "uq_student_session_id", columnNames = "session_id"),
        @UniqueConstraint(name = "uq_student_username", columnNames = "username")
})
public class Student extends BaseEntity {

    @Column(name = "session_id", nullable = false)
    private String sessionId;

    @Column(name = "username")
    private String username;

    @Column(name = "password_hash")
    private String passwordHash;

    @Column(name = "ad", nullable = false)
    private String ad;

    @Column(name = "qrup", nullable = false)
    private String qrup;

    @Column(name = "hedef_universite")
    private String hedefUniversite = "";

    @Column(name = "onboarded", nullable = false)
    private Boolean onboarded = false;

    @Column(name = "diagnostic_done", nullable = false)
    private Boolean diagnosticDone = false;

    @Column(name = "streak", nullable = false)
    private Integer streak = 0;

    @Column(name = "last_active_date")
    private String lastActiveDate;

    // ==================== ROL / MÜƏLLİM SAHƏLƏRİ ====================
    // Hamısı nullable — mövcud (dolu) students cədvəlinə NOT NULL sütun əlavə etmək
    // ddl-auto:update-i sükutla uğursuz edir (bax PROJECT_NOTES.md). null = köhnə tələbə davranışı.

    @Column(name = "rol")
    private String rol; // null / "telebe" = tələbə, "muellim" = müəllim

    @Column(name = "email")
    private String email;

    @Column(name = "telefon")
    private String telefon;

    @Column(name = "dogum_tarixi")
    private String dogumTarixi; // ISO tarix (YYYY-MM-DD)

    @Column(name = "muellim_fenni")
    private String muellimFenni; // "hansı fənni tədris edir" (sərbəst mətn)

    @Column(name = "muellim_sened", columnDefinition = "TEXT")
    private String muellimSened; // təsdiqedici sənədin şəkli, base64 data-URI

    @Column(name = "muellim_status")
    private String muellimStatus; // "GOZLEYIR" / "TESDIQLENIB" / "RED" (yalnız müəllimlərdə)

    // Təsdiq gözləyən müəllimin qeydiyyat ekranı bu token ilə statusunu canlı yoxlayır
    // (təsdiq/rədd olunanda ekranda dərhal bildiriş çıxsın). sessionId-dən ayrıdır, çünki
    // təsdiqlənməmiş müəllim tətbiqə daxil ola bilməməlidir.
    @com.fasterxml.jackson.annotation.JsonIgnore
    @Column(name = "muellim_status_token")
    private String muellimStatusToken;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;
}
