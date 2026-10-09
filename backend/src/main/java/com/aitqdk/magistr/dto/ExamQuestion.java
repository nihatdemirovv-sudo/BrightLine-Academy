package com.aitqdk.magistr.dto;

import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class ExamQuestion extends GeneratedQuestion {
    private String fenn;
    private int nomre;

    public static ExamQuestion from(GeneratedQuestion q, String fenn, int nomre) {
        ExamQuestion eq = new ExamQuestion();
        eq.setSual(q.getSual());
        eq.setVariantlar(q.getVariantlar());
        eq.setDogruCavab(q.getDogruCavab());
        eq.setIzah(q.getIzah());
        eq.setMovzu(q.getMovzu());
        eq.setCetinlik(q.getCetinlik());
        eq.setSualShekil(q.getSualShekil());
        eq.setFenn(fenn);
        eq.setNomre(nomre);
        return eq;
    }
}
