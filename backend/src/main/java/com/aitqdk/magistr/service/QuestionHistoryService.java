package com.aitqdk.magistr.service;

import com.aitqdk.magistr.entity.Bookmark;
import com.aitqdk.magistr.entity.QuestionSet;
import com.aitqdk.magistr.entity.Student;
import com.aitqdk.magistr.repository.BookmarkRepository;
import com.aitqdk.magistr.repository.QuestionSetRepository;
import com.aitqdk.magistr.util.JsonUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class QuestionHistoryService {

    private final StudentService studentService;
    private final QuestionSetRepository questionSetRepository;
    private final BookmarkRepository bookmarkRepository;

    @Transactional
    public Map<String, Object> get(String sessionId, String fenn, int limit) {
        Student student = studentService.findBySessionIdOrThrow(sessionId);

        List<QuestionSet> questionSets = (fenn != null
                ? questionSetRepository.findByStudentIdAndFennOrderByCreatedAtDesc(student.getId(), fenn, PageRequest.of(0, 20))
                : questionSetRepository.findByStudentIdOrderByCreatedAtDesc(student.getId(), PageRequest.of(0, 20)));

        List<Bookmark> bookmarks = (fenn != null
                ? bookmarkRepository.findByStudentIdAndFennOrderByCreatedAtDesc(student.getId(), fenn, PageRequest.of(0, limit))
                : bookmarkRepository.findByStudentIdOrderByCreatedAtDesc(student.getId()).stream().limit(limit).toList());

        List<Map<String, Object>> sualDəstləri = questionSets.stream().map(qs -> {
            int sualSayi = qs.getSay();
            try {
                List<?> parsed = JsonUtil.fromJson(qs.getSuallar(), List.class);
                if (parsed != null) sualSayi = parsed.size();
            } catch (Exception ignored) {
            }
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", qs.getId());
            m.put("fenn", qs.getFenn());
            m.put("sualSayi", sualSayi);
            m.put("tarix", qs.getCreatedAt());
            m.put("nov", "generated");
            return m;
        }).toList();

        List<Map<String, Object>> səhvCavablar = bookmarks.stream().map(b -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", b.getId());
            m.put("fenn", b.getFenn());
            m.put("movzu", b.getMovzu() != null ? b.getMovzu() : "Ümumi");
            m.put("sual", b.getSual());
            m.put("sehvCavab", b.getSehvCavab());
            m.put("dogruCavab", b.getDogruCavab());
            m.put("variantlar", JsonUtil.fromJson(b.getVariantlar(), Map.class));
            m.put("izah", b.getIzah());
            m.put("tekrarEdildi", b.getTekrarEdildi());
            m.put("tarix", b.getCreatedAt());
            m.put("nov", "wrong_answer");
            return m;
        }).toList();

        int toplamSual = sualDəstləri.stream().mapToInt(d -> (Integer) d.get("sualSayi")).sum();
        long təkrarEdilən = səhvCavablar.stream().filter(s -> Boolean.TRUE.equals(s.get("tekrarEdildi"))).count();

        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("toplamDəst", sualDəstləri.size());
        stats.put("toplamSual", toplamSual);
        stats.put("toplamSəhv", səhvCavablar.size());
        stats.put("təkrarEdilən", təkrarEdilən);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("sualDəstləri", sualDəstləri);
        result.put("səhvCavablar", səhvCavablar);
        result.put("stats", stats);
        return result;
    }
}
