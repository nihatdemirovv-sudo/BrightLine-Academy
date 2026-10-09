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
@Table(name = "student_settings", uniqueConstraints = {
        @UniqueConstraint(name = "uq_settings_student", columnNames = "student_id")
})
public class StudentSettings extends BaseEntity {

    @Column(name = "student_id", nullable = false)
    private String studentId;

    @Column(name = "bildirisler_aktiv", nullable = false)
    private Boolean bildirislerAktiv = true;

    @Column(name = "gunluk_plan_bildirisi", nullable = false)
    private Boolean gunlukPlanBildirisi = true;

    @Column(name = "streak_xebardarligi", nullable = false)
    private Boolean streakXebardarligi = true;

    @Column(name = "gunku_sual_hediyye", nullable = false)
    private Integer gunkuSualHediyye = 10;

    @Column(name = "cetinlik_seviyyesi", nullable = false)
    private String cetinlikSeviyyesi = "orta";

    @Column(name = "animasyonlar", nullable = false)
    private Boolean animasyonlar = true;

    @Column(name = "valideyn_email")
    private String valideynEmail;

    @Column(name = "valideyn_bildirisi_aktiv", nullable = false)
    private Boolean valideynBildirisiAktiv = false;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;
}
