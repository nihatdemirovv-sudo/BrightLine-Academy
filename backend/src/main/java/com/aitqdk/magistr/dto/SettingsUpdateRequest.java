package com.aitqdk.magistr.dto;

import lombok.Data;

@Data
public class SettingsUpdateRequest {
    private String sessionId;
    private SettingsPart settings;
    private ProfilPart profil;
    private ExamConfigPart examConfig;

    @Data
    public static class SettingsPart {
        private Boolean bildirislerAktiv;
        private Boolean gunlukPlanBildirisi;
        private Boolean streakXebardarligi;
        private Integer gunkuSualHediyye;
        private String cetinlikSeviyyesi;
        private Boolean animasyonlar;
        private String valideynEmail;
        private Boolean valideynBildirisiAktiv;
    }

    @Data
    public static class ProfilPart {
        private String ad;
        private String hedefUniversite;
        private String email;
    }

    @Data
    public static class ExamConfigPart {
        private String imtahanTarixi;
        private String nov;
        private Integer müddet;
        private Integer sualSayi;
        private Integer kecidBali;
    }
}
