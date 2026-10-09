package com.aitqdk.magistr.controller;

import com.aitqdk.magistr.service.DocumentParseService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
public class DocumentParseController {

    private final DocumentParseService documentParseService;

    public record PastExamParseRequest(String sessionId, List<DocumentParseService.FileInput> files) {
    }

    public record AdminParseRequest(List<DocumentParseService.FileInput> files) {
    }

    @PostMapping("/api/past-exam/parse")
    public Map<String, Object> pastExamParse(@RequestBody PastExamParseRequest req) {
        return documentParseService.pastExamParse(req.sessionId(), req.files());
    }

    @PostMapping("/api/admin/parse")
    public Map<String, Object> adminParse(@RequestBody AdminParseRequest req) {
        return documentParseService.adminParse(req.files());
    }
}
