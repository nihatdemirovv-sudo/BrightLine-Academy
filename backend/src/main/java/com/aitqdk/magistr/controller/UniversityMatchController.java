package com.aitqdk.magistr.controller;

import com.aitqdk.magistr.service.UniversityMatchService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequiredArgsConstructor
public class UniversityMatchController {

    private final UniversityMatchService universityMatchService;

    @GetMapping("/api/university-match")
    public Map<String, Object> get(@RequestParam String sessionId,
                                    @RequestParam double bal,
                                    @RequestParam String qrup,
                                    @RequestParam(required = false) String altQrup,
                                    @RequestParam(required = false) String istek) {
        return universityMatchService.match(sessionId, bal, qrup, altQrup, istek);
    }
}
