package com.aitqdk.magistr.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;

/**
 * "Dərs Materialları" bölməsinin PDF hissəsi — YALNIZ admin panelindən əlavə/silinir,
 * bütün tələbələr READ-ONLY görür (brauzerdə oxuya + yükləyə bilir). Bir sətir = bir fayl.
 * Video axtarışı (yt-dlp) bundan tamamilə müstəqildir və toxunulmayıb.
 */
@Getter
@Setter
@Entity
@Table(name = "library_materials")
public class LibraryMaterial extends BaseEntity {

    @Column(name = "ad", nullable = false)
    private String ad;

    @Column(name = "tesvir", columnDefinition = "TEXT")
    private String tesvir;

    /** İstəyə bağlı fənn etiketi (tələbə tərəfdə filtr üçün) — nullable. */
    @Column(name = "fenn")
    private String fenn;

    @Column(name = "tip", nullable = false)
    private String tip = "pdf"; // hazırda yalnız "pdf"

    @Column(name = "data", nullable = false, columnDefinition = "TEXT")
    private String data; // base64 data-URI

    /** Faylın baytla ölçüsü — tələbə tərəfdə göstərmək üçün (nullable, köhnə sətirlər üçün). */
    @Column(name = "olcu")
    private Long olcu;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;
}
