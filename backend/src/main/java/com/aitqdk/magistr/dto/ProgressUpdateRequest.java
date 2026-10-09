package com.aitqdk.magistr.dto;

import lombok.Data;

@Data
public class ProgressUpdateRequest {
    private String sessionId;
    private String fenn;
    private Boolean dogru;
    private Integer say = 1;
}
