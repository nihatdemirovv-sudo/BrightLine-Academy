package com.aitqdk.magistr.controller;

import com.aitqdk.magistr.dto.ProgressUpdateRequest;
import com.aitqdk.magistr.entity.SubjectProgress;
import com.aitqdk.magistr.service.ProgressService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/progress")
@RequiredArgsConstructor
public class ProgressController {

    private final ProgressService progressService;

    @GetMapping
    public List<SubjectProgress> get(@RequestParam String sessionId) {
        return progressService.getOrInit(sessionId);
    }

    @PostMapping
    public Map<String, Object> update(@RequestBody ProgressUpdateRequest req) {
        return progressService.update(req);
    }
}
