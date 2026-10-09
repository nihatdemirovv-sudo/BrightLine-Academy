package com.aitqdk.magistr.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;

/**
 * Bir müsabiqədə bir tələbənin iştirakı. (competition_id, student_id) unikaldır — eyni tələbə
 * eyni müsabiqəyə iki dəfə qoşula bilməz. Yarış zamanı {@code cavablarJson} xam seçimləri saxlayır
 * ([{"i":0,"secim":"A","ms":4200}, ...]); doğru/səhv/xal sahələri YALNIZ müsabiqə finalize
 * olunanda (ArenaService.finalize) donmuş suallara qarşı hesablanır — yarış getdikcə heç kimin
 * düzgünlük/xal məlumatı yayımlanmır.
 */
@Getter
@Setter
@Entity
@Table(name = "arena_participants", uniqueConstraints = {
        @UniqueConstraint(name = "uq_arena_participant", columnNames = {"competition_id", "student_id"})
})
public class CompetitionParticipant extends BaseEntity {

    @Column(name = "competition_id", nullable = false)
    private String competitionId;

    @Column(name = "student_id", nullable = false)
    private String studentId;

    /** Qoşulma sırası (1-dən başlayır) — gözləmə otağında "İştirakçı #N" kimi göstərilir. */
    @Column(name = "istirakci_no", nullable = false)
    private Integer istirakciNo = 1;

    /** Xam cavab seçimləri — [{"i":<sualIndeksi>,"secim":"A-E","ms":<sualdaxili keçən millisaniyə>}]. */
    @Column(name = "cavablar_json", columnDefinition = "TEXT")
    private String cavablarJson;

    @Column(name = "dogru_say", nullable = false)
    private Integer dogruSay = 0;

    @Column(name = "sehv_say", nullable = false)
    private Integer sehvSay = 0;

    @Column(name = "cavabsiz_say", nullable = false)
    private Integer cavabsizSay = 0;

    @Column(name = "xal", nullable = false)
    private Integer xal = 0;

    /** Orta cavab müddəti (saniyə) — yalnız cavablanmış suallar üzrə. */
    @Column(name = "orta_cavab_muddeti", nullable = false)
    private Double ortaCavabMuddeti = 0.0;

    /** Yarışı erkən tərk edibsə (forfeit) və ya finalize olunubsa true. */
    @Column(name = "bitirib", nullable = false)
    private Boolean bitirib = false;

    /** Yekun sıralama (1 = qalib) — finalize-dən sonra doldurulur. */
    @Column(name = "sira")
    private Integer sira;

    @Column(name = "qalib", nullable = false)
    private Boolean qalib = false;

    @CreationTimestamp
    @Column(name = "qosulma_vaxti", updatable = false)
    private Instant qosulmaVaxti;
}
