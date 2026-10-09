package com.aitqdk.magistr.controller;

import com.aitqdk.magistr.exception.ApiException;
import com.aitqdk.magistr.service.YtDlpService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
public class MaterialsSearchController {

    private final YtDlpService ytDlpService;

    public record SearchRequest(String query, Integer limit) {
    }

    @PostMapping("/api/materials/search")
    public Map<String, Object> search(@RequestBody SearchRequest req) {
        if (req.query() == null || req.query().isBlank()) {
            throw ApiException.badRequest("Zəhmət olmasa axtarış üçün mövzu daxil edin.");
        }
        int maxResults = Math.min(Math.max(req.limit() != null ? req.limit() : 8, 1), 20);
        List<Map<String, Object>> entries = ytDlpService.search(req.query().trim(), maxResults);

        List<Map<String, Object>> results = entries.stream()
                .filter(e -> e.get("id") != null && e.get("title") != null)
                .map(this::toResult)
                .toList();

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("query", req.query());
        response.put("results", results);
        return response;
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> toResult(Map<String, Object> entry) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", entry.get("id"));
        m.put("title", entry.get("title"));
        m.put("channel", entry.getOrDefault("channel", entry.getOrDefault("uploader", "")));
        m.put("thumbnail", thumbFor(entry));
        Object duration = entry.get("duration");
        m.put("duration", duration instanceof Number n ? n.longValue() : 0L);
        m.put("url", "https://www.youtube.com/watch?v=" + entry.get("id"));
        return m;
    }

    @SuppressWarnings("unchecked")
    private String thumbFor(Map<String, Object> entry) {
        if (entry.get("thumbnail") instanceof String s && !s.isBlank()) return s;
        if (entry.get("thumbnails") instanceof List<?> thumbs && !thumbs.isEmpty()) {
            Object last = thumbs.get(thumbs.size() - 1);
            if (last instanceof Map<?, ?> lm && lm.get("url") instanceof String url) return url;
        }
        if (entry.get("id") != null) return "https://i.ytimg.com/vi/" + entry.get("id") + "/hqdefault.jpg";
        return "";
    }
}
