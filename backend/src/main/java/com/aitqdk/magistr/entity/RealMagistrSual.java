package com.aitqdk.magistr.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

/**
 * Magistr OL-un rəsmi "Test Bank" kitablarından (istifadəçinin verdiyi PDF-lərdən) çıxarılmış REAL
 * (AI-generasiya olunmamış) suallar — mövcud "Magistr" üslub-təqlidli AI generasiyasından fərqli olaraq,
 * bunlar kitabın öz mətni + öz cavab açarıdır. Yalnız Məntiq və İnformatika üçün (İngilis dili kitabının
 * cavab açarı formatı etibarlı parse oluna bilmədi). `variantlar` JSON blob kimi saxlanılır (A-E).
 */
@Getter
@Setter
@Entity
@Table(name = "real_magistr_suallar")
public class RealMagistrSual extends BaseEntity {

    @Column(name = "fenn", nullable = false)
    private String fenn;

    /** Hazırda həmişə "magistr" — gələcəkdə başqa qrup/mənbə əlavə olunarsa genişlənə bilər. */
    @Column(name = "qrup", nullable = false)
    private String qrup;

    @Column(name = "movzu")
    private String movzu;

    @Column(name = "sual", nullable = false, columnDefinition = "TEXT")
    private String sual;

    /** JSON: {"A":"...","B":"...","C":"...","D":"...","E":"..."} */
    @Column(name = "variantlar", nullable = false, columnDefinition = "TEXT")
    private String variantlar;

    @Column(name = "dogru_cavab", nullable = false)
    private String dogruCavab;

    @Column(name = "izah", columnDefinition = "TEXT")
    private String izah;
}
