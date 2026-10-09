package com.aitqdk.magistr.service;

import com.aitqdk.magistr.ai.AiPrompts;
import com.aitqdk.magistr.ai.AiService;
import com.aitqdk.magistr.entity.Bookmark;
import com.aitqdk.magistr.entity.QuestionSet;
import com.aitqdk.magistr.entity.Student;
import com.aitqdk.magistr.entity.WeakTopic;
import com.aitqdk.magistr.exception.ApiException;
import com.aitqdk.magistr.repository.BookmarkRepository;
import com.aitqdk.magistr.repository.QuestionSetRepository;
import com.aitqdk.magistr.repository.WeakTopicRepository;
import com.aitqdk.magistr.util.JsonUtil;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class WeakTopicService {

    private final AiService aiService;
    private final StudentService studentService;
    private final WeakTopicRepository weakTopicRepository;
    private final BookmarkRepository bookmarkRepository;
    private final QuestionSetRepository questionSetRepository;

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    private static class RawWeakTopic {
        private String fenn;
        private String movzu;
        private Integer sehvNisbeti;
        private Integer sualSayi;
        private Integer oncelik;
        private String tovsie;
    }

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    private static class WeakTopicsResponse {
        private List<RawWeakTopic> weakTopics;
    }

    @Transactional
    public Map<String, Object> get(String sessionId) {
        Student student = studentService.findBySessionIdOrThrow(sessionId);

        List<WeakTopic> existing = weakTopicRepository.findByStudentIdOrderByOncelikDesc(student.getId());
        if (!existing.isEmpty()) {
            long kritik = existing.stream().filter(w -> w.getOncelik() >= 4).count();
            return Map.of("weakTopics", existing, "stats", Map.of("toplam", existing.size(), "kritik", kritik));
        }

        List<Bookmark> bookmarks = bookmarkRepository.findByStudentIdOrderByCreatedAtDesc(student.getId())
                .stream().limit(30).toList();
        List<QuestionSet> questionSets = questionSetRepository.findByStudentIdOrderByCreatedAtDesc(
                student.getId(), PageRequest.of(0, 10));

        if (bookmarks.isEmpty() && questionSets.isEmpty()) {
            return Map.of(
                    "weakTopics", List.of(),
                    "stats", Map.of("toplam", 0, "kritik", 0),
                    "mesaj", "Hələ zəif mövzu təyin edilməyib. Sual həll etdikcə AI zəif tərəflərini avtomatik tapacaq."
            );
        }

        String sualMəlumat = bookmarks.stream()
                .map(b -> "[%s] %s: %s (səhv: %s, doğru: %s)".formatted(
                        b.getFenn(), b.getMovzu() != null ? b.getMovzu() : "Ümumi",
                        b.getSual().length() > 100 ? b.getSual().substring(0, 100) : b.getSual(),
                        b.getSehvCavab(), b.getDogruCavab()))
                .reduce((a, c) -> a + "\n" + c).orElse("");

        String prompt = """
                Bir TQDK şagirdinin səhv cavablarına əsaslanaraq, zəif sub-mövzuları təyin et.

                Şagird: %s
                Qrup: %s

                Səhv cavablar (son %d):
                %s

                Hər səhvə görə konkret SUB-MÖVZU təyin et (fənn deyil, sub-mövzu — məs: "Kvadrat tənliklər", "pH hesablamaları", "Stoyiometriya").
                Eyni sub-mövzu təkrarlanırsa, sayını artır.

                YALNIZ JSON qaytar:
                {
                  "weakTopics": [
                    {
                      "fenn": "Riyaziyyat",
                      "movzu": "Kvadrat tənliklər",
                      "sehvNisbeti": 75,
                      "sualSayi": 4,
                      "oncelik": 5,
                      "tovsie": "Kvadrat tənliklərin diskriminant üsulunu təkrar et"
                    }
                  ]
                }

                oncelik 1-5 arası (5 = ən kritik, çox səhv var). Maksimum 8 sub-mövzu."""
                .formatted(student.getAd(), AiPrompts.qrupTesviri(student.getQrup()),
                        bookmarks.size(), sualMəlumat);

        String cleaned = aiService.rawJsonPrompt(AiPrompts.WEAK_TOPIC_SYSTEM, prompt);
        WeakTopicsResponse parsed = JsonUtil.fromJson(cleaned, WeakTopicsResponse.class);
        List<RawWeakTopic> raw = parsed != null && parsed.getWeakTopics() != null ? parsed.getWeakTopics() : List.of();

        List<WeakTopic> saved = raw.stream().limit(8).map(wt -> {
            WeakTopic topic = weakTopicRepository.findByStudentIdAndFennAndMovzu(student.getId(), wt.getFenn(), wt.getMovzu())
                    .orElseGet(() -> {
                        WeakTopic t = new WeakTopic();
                        t.setStudentId(student.getId());
                        t.setFenn(wt.getFenn());
                        t.setMovzu(wt.getMovzu());
                        return t;
                    });
            topic.setSehvNisbeti(wt.getSehvNisbeti() != null ? wt.getSehvNisbeti() : 50);
            topic.setSualSayi(wt.getSualSayi() != null ? wt.getSualSayi() : 1);
            topic.setOncelik(wt.getOncelik() != null ? wt.getOncelik() : 3);
            topic.setTovsie(wt.getTovsie());
            return weakTopicRepository.save(topic);
        }).toList();

        long kritik = saved.stream().filter(w -> w.getOncelik() >= 4).count();
        return Map.of("weakTopics", saved, "stats", Map.of("toplam", saved.size(), "kritik", kritik));
    }

    @Transactional
    public WeakTopic patch(String topicId, Boolean oynenildi) {
        if (topicId == null) throw ApiException.badRequest("topicId tələb olunur");
        WeakTopic topic = weakTopicRepository.findById(topicId).orElseThrow(() -> ApiException.notFound("Tapılmadı"));
        topic.setOynenildi(oynenildi != null ? oynenildi : true);
        return weakTopicRepository.save(topic);
    }
}
