package com.aitqdk.magistr.controller;

import com.aitqdk.magistr.dto.AnalyzeImageRequest;
import com.aitqdk.magistr.dto.TutorChatRequest;
import com.aitqdk.magistr.service.TutorChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequiredArgsConstructor
public class TutorChatController {

    private final TutorChatService tutorChatService;

    @PostMapping("/api/tutor-chat")
    public Map<String, String> tutorChat(@RequestBody TutorChatRequest req) {
        return tutorChatService.chat(req);
    }

    @PostMapping("/api/analyze-image")
    public Map<String, String> analyzeImage(@RequestBody AnalyzeImageRequest req) {
        return tutorChatService.analyzeImage(req);
    }
}
