package com.aitqdk.magistr.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;

/**
 * "Bilik Arenası" müsabiqəsi — real-vaxtlı çoxnəfərlik bilik yarışı. Suallar müsabiqə
 * YARADILAN anda AI ilə BİR DƏFƏ hazırlanıb {@code suallarJson}-a donmuş şəkildə yazılır;
 * yarış başlayandan sonra bütün iştirakçılar tam olaraq eyni sual dəstini, eyni ardıcıllıqla,
 * eyni variantlarla görür (bax ArenaService). Real-vaxt sinxronu server saatına əsaslanır:
 * {@code baslamaVaxti} + sual indeksi * {@code sualSaniye} → hər klient eyni anda eyni suala keçir.
 */
@Getter
@Setter
@Entity
@Table(name = "arena_competitions")
public class Competition extends BaseEntity {

    @Column(name = "ad", nullable = false)
    private String ad;

    @Column(name = "fenn", nullable = false)
    private String fenn;

    @Column(name = "sual_sayi", nullable = false)
    private Integer sualSayi;

    /** "asan" / "orta" / "cetin" / "qarisiq" */
    @Column(name = "cetinlik", nullable = false)
    private String cetinlik = "orta";

    /** AI-nin sual səviyyəsi üçün — yaradanın qeydiyyat qrupu (nullable, köhnə hesablar üçün). */
    @Column(name = "qrup")
    private String qrup;

    @Column(name = "yaradici_id", nullable = false)
    private String yaradiciId;

    @Column(name = "max_istirakci", nullable = false)
    private Integer maxIstirakci = 10;

    /** Gözləmə otağının açıq qala biləcəyi maksimum müddət (saniyə) — sonra avtomatik VAXT_BITDI. */
    @Column(name = "gozleme_saniye", nullable = false)
    private Integer gozlemeSaniye = 300;

    /** Hər sual üçün vaxt limiti (saniyə). */
    @Column(name = "sual_saniye", nullable = false)
    private Integer sualSaniye = 30;

    /** GOZLEYIR / BASLADI / BITDI / LEGV / VAXT_BITDI */
    @Column(name = "status", nullable = false)
    private String status = "GOZLEYIR";

    /** Donmuş sual dəsti — List<GeneratedQuestion> JSON (variantlar artıq qarışdırılıb). */
    @Column(name = "suallar_json", columnDefinition = "TEXT")
    private String suallarJson;

    @Column(name = "suallar_hazir", nullable = false)
    private Boolean suallarHazir = false;

    @Column(name = "suallar_xeta", nullable = false)
    private Boolean suallarXeta = false;

    @Column(name = "baslama_vaxti")
    private Instant baslamaVaxti;

    @Column(name = "bitme_vaxti")
    private Instant bitmeVaxti;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;
}
