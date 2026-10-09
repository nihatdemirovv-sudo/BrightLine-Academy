package com.aitqdk.magistr.controller;

import com.aitqdk.magistr.entity.WeakTopic;
import com.aitqdk.magistr.service.WeakTopicService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/weak-topics")
@RequiredArgsConstructor
public class WeakTopicController {

    private final WeakTopicService weakTopicService;

    public record PatchRequest(String topicId, Boolean oynenildi) {
    }

    @GetMapping
    public Map<String, Object> get(@RequestParam String sessionId) {
        return weakTopicService.get(sessionId);
    }

    @PatchMapping
    public WeakTopic patch(@RequestBody PatchRequest req) {
        return weakTopicService.patch(req.topicId(), req.oynenildi());
    }
}
