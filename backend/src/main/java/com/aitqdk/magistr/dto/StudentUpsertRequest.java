package com.aitqdk.magistr.dto;

import lombok.Data;

@Data
public class StudentUpsertRequest {
    private String sessionId;
    private String ad;
    private String qrup;
    private String hedefUniversite;
    private Boolean onboarded;
    private Boolean diagnosticDone;
}
