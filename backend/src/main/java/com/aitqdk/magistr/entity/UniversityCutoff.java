package com.aitqdk.magistr.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

/** Bir universitet + ixtisas + qrup üzrə qəbul üçün minimum bal (kod balı). */
@Getter
@Setter
@Entity
@Table(name = "university_cutoffs")
public class UniversityCutoff extends BaseEntity {

    @Column(name = "universitet", nullable = false, length = 600)
    private String universitet;

    @Column(name = "ixtisas", nullable = false, length = 600)
    private String ixtisas;

    /** "1", "2", "3", "4", "5" (bakalavr qrupları) və ya "magistr". */
    @Column(name = "qrup", nullable = false)
    private String qrup;

    @Column(name = "min_bal", nullable = false)
    private Double minBal;

    /** "ödənişli" və ya "dövlət sifarişi" — məlum deyilsə null. */
    @Column(name = "tehsil_novu")
    private String tehsilNovu;

    @Column(name = "il")
    private Integer il;
}
