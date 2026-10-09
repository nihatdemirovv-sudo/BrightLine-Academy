package com.aitqdk.magistr.service;

import com.aitqdk.magistr.exception.ApiException;
import com.aitqdk.magistr.util.JsonUtil;
import com.fasterxml.jackson.core.type.TypeReference;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/** admin/exam-questions/route.ts qarşılığı — data/exam-questions.json faylında saxlanılır. */
@Slf4j
@Service
public class AdminExamQuestionsService {

    private final Path dataDir;
    private final Path dataFile;

    public AdminExamQuestionsService(@Value("${app.data-dir}") String dataDirPath) {
        this.dataDir = Path.of(dataDirPath);
        this.dataFile = dataDir.resolve("exam-questions.json");
    }

    private void ensureFile() {
        try {
            if (!Files.exists(dataDir)) Files.createDirectories(dataDir);
            if (!Files.exists(dataFile)) Files.writeString(dataFile, "[]");
        } catch (IOException e) {
            throw new IllegalStateException("Data faylı yaradıla bilmədi", e);
        }
    }

    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> read() {
        ensureFile();
        try {
            String raw = Files.readString(dataFile);
            List<Map<String, Object>> list = JsonUtil.fromJson(raw, new TypeReference<>() {
            });
            return list != null ? list : new ArrayList<>();
        } catch (IOException e) {
            throw ApiException.server("Oxuna bilmədi");
        }
    }

    private void write(List<Map<String, Object>> questions) {
        ensureFile();
        try {
            Files.writeString(dataFile, JsonUtil.MAPPER.writerWithDefaultPrettyPrinter().writeValueAsString(questions));
        } catch (IOException e) {
            throw ApiException.server("Yadda saxlanıla bilmədi");
        }
    }

    public List<Map<String, Object>> list() {
        return read();
    }

    public Map<String, Object> add(List<Map<String, Object>> questions) {
        if (questions == null) throw ApiException.badRequest("Sual massivi tələb olunur");
        List<Map<String, Object>> existing = read();
        String now = Instant.now().toString();

        List<Map<String, Object>> newQuestions = new ArrayList<>();
        for (int i = 0; i < questions.size(); i++) {
            Map<String, Object> q = questions.get(i);
            Map<String, Object> stored = new LinkedHashMap<>();
            stored.put("id", "eq_" + System.currentTimeMillis() + "_" + i + "_" + UUID.randomUUID().toString().substring(0, 6));
            stored.put("sual", q.get("sual"));
            stored.put("sualShekil", q.get("sualShekil"));
            stored.put("variantlar", q.get("variantlar"));
            stored.put("dogruCavab", q.get("dogruCavab"));
            stored.put("izah", q.getOrDefault("izah", ""));
            stored.put("movzu", q.getOrDefault("movzu", ""));
            stored.put("cetinlik", q.getOrDefault("cetinlik", "orta"));
            stored.put("fenn", q.getOrDefault("fenn", ""));
            stored.put("nomre", existing.size() + i + 1);
            stored.put("uploadedAt", now);
            newQuestions.add(stored);
        }

        List<Map<String, Object>> all = new ArrayList<>(existing);
        all.addAll(newQuestions);
        write(all);

        return Map.of("saved", newQuestions.size(), "total", all.size());
    }

    public Map<String, Object> delete(String id) {
        if (id == null) throw ApiException.badRequest("ID tələb olunur");
        List<Map<String, Object>> existing = read();
        List<Map<String, Object>> filtered = existing.stream()
                .filter(q -> !id.equals(q.get("id")))
                .toList();
        write(filtered);
        return Map.of("deleted", true, "total", filtered.size());
    }
}
