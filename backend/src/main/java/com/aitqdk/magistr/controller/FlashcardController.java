package com.aitqdk.magistr.controller;

import com.aitqdk.magistr.entity.Flashcard;
import com.aitqdk.magistr.service.FlashcardService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequiredArgsConstructor
public class FlashcardController {

    private final FlashcardService flashcardService;

    @GetMapping("/api/flashcards")
    public Map<String, Object> list(@RequestParam String sessionId,
                                     @RequestParam(defaultValue = "due") String mode) {
        return flashcardService.list(sessionId, mode);
    }

    @PostMapping("/api/flashcards")
    public Flashcard create(@RequestBody FlashcardService.CreateRequest req) {
        return flashcardService.create(req);
    }

    @DeleteMapping("/api/flashcards")
    public Map<String, Boolean> delete(@RequestParam String id) {
        flashcardService.delete(id);
        return Map.of("success", true);
    }

    @PostMapping("/api/flashcards/review")
    public Map<String, Object> review(@RequestBody FlashcardService.ReviewRequest req) {
        return flashcardService.review(req);
    }
}
