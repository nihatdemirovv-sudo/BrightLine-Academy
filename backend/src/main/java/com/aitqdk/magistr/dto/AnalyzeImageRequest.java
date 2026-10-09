package com.aitqdk.magistr.dto;

import lombok.Data;

@Data
public class AnalyzeImageRequest {
    private String sessionId;
    private String imageBase64;
    private String mimeType;
    private String question;
}
