package com.aitqdk.magistr.dto;

import lombok.Data;

import java.util.List;
import java.util.Map;

@Data
public class TutorChatRequest {
    private String sessionId;
    private List<Map<String, String>> messages;
    private Boolean imageQuestion;
}
