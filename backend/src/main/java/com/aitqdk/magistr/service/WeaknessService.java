package com.aitqdk.magistr.service;

import com.aitqdk.magistr.ai.AiService;
import com.aitqdk.magistr.dto.WeaknessItem;
import com.aitqdk.magistr.entity.Student;
import com.aitqdk.magistr.entity.SubjectProgress;
import com.aitqdk.magistr.repository.SubjectProgressRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class WeaknessService {

    private static final long CACHE_MS = 5 * 60 * 1000;

    private final StudentService studentService;
    private final SubjectProgressRepository progressRepository;
    private final AiService aiService;

    private record CacheEntry(List<WeaknessItem> data, long ts, String progressHash) {
    }

    private final Map<String, CacheEntry> cache = new ConcurrentHashMap<>();

    private String hashProgress(List<Map<String, Object>> progressData) {
        return progressData.stream()
                .map(p -> p.get("fenn") + ":" + p.get("seviyye") + ":" + p.get("dogruCavab") + ":" + p.get("hallSualSayi"))
                .collect(Collectors.joining("|"));
    }

    public Map<String, Object> get(String sessionId) {
        Student student = studentService.findBySessionIdOrThrow(sessionId);
        List<SubjectProgress> progress = progressRepository.findByStudentId(student.getId());

        List<Map<String, Object>> progressData = progress.stream()
                .filter(p -> p.getHallSualSayi() > 0)
                .map(p -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("fenn", p.getFenn());
                    m.put("seviyye", p.getSeviyye());
                    m.put("dogruCavab", p.getDogruCavab());
                    m.put("hallSualSayi", p.getHallSualSayi());
                    return m;
                }).toList();

        if (progressData.isEmpty()) {
            WeaknessItem demo = new WeaknessItem();
            demo.setFenn("Riyaziyyat");
            demo.setSebəb("Hələ sual həll etməmisiniz");
            demo.setTovsiyə("İlk sual dəstinizlə başlayın");
            demo.setÖvvelik("yuksek");
            return Map.of("zəifTərəflər", List.of(demo));
        }

        String currentHash = hashProgress(progressData);
        CacheEntry cached = cache.get(student.getId());
        if (cached != null && cached.progressHash().equals(currentHash) && System.currentTimeMillis() - cached.ts() < CACHE_MS) {
            return Map.of("zəifTərəflər", cached.data());
        }

        List<WeaknessItem> zəifTərəflər = aiService.analyzeWeaknesses(progressData);
        cache.put(student.getId(), new CacheEntry(zəifTərəflər, System.currentTimeMillis(), currentHash));

        return Map.of("zəifTərəflər", zəifTərəflər);
    }
}
