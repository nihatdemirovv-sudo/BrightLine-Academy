package com.aitqdk.magistr.service;

import com.aitqdk.magistr.entity.*;
import com.aitqdk.magistr.exception.ApiException;
import com.aitqdk.magistr.repository.*;
import com.aitqdk.magistr.util.JsonUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@RequiredArgsConstructor
public class SubjectDetailService {

    private final StudentService studentService;
    private final SubjectProgressRepository progressRepository;
    private final BookmarkRepository bookmarkRepository;
    private final WeakTopicRepository weakTopicRepository;
    private final MiniLessonRepository miniLessonRepository;
    private final FlashcardRepository flashcardRepository;
    private final ExamAttemptRepository examAttemptRepository;
    private final ActivityRepository activityRepository;

    @Transactional
    public Map<String, Object> get(String sessionId, String fenn) {
        if (fenn == null) throw ApiException.badRequest("sessionId və fenn tələb olunur");
        Student student = studentService.findBySessionIdOrThrow(sessionId);

        List<SubjectProgress> allProgress = progressRepository.findByStudentId(student.getId());
        SubjectProgress progress = allProgress.stream().filter(p -> p.getFenn().equals(fenn)).findFirst().orElse(null);

        List<Bookmark> bookmarks = bookmarkRepository.findByStudentIdAndFennOrderByCreatedAtDesc(
                student.getId(), fenn, PageRequest.of(0, 30));
        List<WeakTopic> weakTopics = weakTopicRepository.findByStudentIdAndFenn(student.getId(), fenn);
        List<MiniLesson> miniLessons = miniLessonRepository.findByStudentIdAndFennOrderByCreatedAtDesc(
                student.getId(), fenn, PageRequest.of(0, 10));
        List<Flashcard> flashcards = flashcardRepository.findByStudentIdAndFenn(student.getId(), fenn);
        List<ExamAttempt> examAttempts = examAttemptRepository.findByStudentIdAndTamamlandiTrueOrderByCreatedAtDesc(
                student.getId(), PageRequest.of(0, 20));
        List<Activity> allActivities = activityRepository.findByStudentIdOrderByCreatedAtDesc(
                student.getId(), PageRequest.of(0, 300));

        int seviyye = progress != null ? progress.getSeviyye() : 0;
        int yildiz = progress != null ? progress.getYildiz() : 0;
        int dogruCavab = progress != null ? progress.getDogruCavab() : 0;
        int hallSualSayi = progress != null ? progress.getHallSualSayi() : 0;
        int dəqiqlik = hallSualSayi > 0 ? Math.round(100f * dogruCavab / hallSualSayi) : 0;

        Map<String, int[]> movzuStatRaw = new LinkedHashMap<>(); // [toplam, sehv, dogru]
        for (Bookmark b : bookmarks) {
            String movzu = b.getMovzu() != null ? b.getMovzu() : "Ümumi";
            movzuStatRaw.putIfAbsent(movzu, new int[3]);
            movzuStatRaw.get(movzu)[0]++;
            movzuStatRaw.get(movzu)[1]++;
        }
        List<Map<String, Object>> movzuStat = movzuStatRaw.entrySet().stream().map(e -> {
            int toplam = e.getValue()[0], sehv = e.getValue()[1], dogru = e.getValue()[2];
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("movzu", e.getKey());
            m.put("toplam", toplam);
            m.put("sehv", sehv);
            m.put("dogru", dogru);
            m.put("sehvNisbeti", toplam > 0 ? Math.round(100f * sehv / toplam) : 0);
            return m;
        }).sorted((a, b) -> (Integer) b.get("sehv") - (Integer) a.get("sehv")).toList();

        List<Map<String, Object>> balTrend = new ArrayList<>();
        for (ExamAttempt exam : examAttempts) {
            try {
                Map<?, ?> fennBolugu = JsonUtil.fromJson(exam.getFennBolugu(), Map.class);
                if (fennBolugu != null && fennBolugu.containsKey(fenn)) {
                    List<Map<String, Object>> suallar = JsonUtil.fromJson(exam.getSuallar(), List.class);
                    Map<?, ?> cavablar = JsonUtil.fromJson(exam.getCavablar(), Map.class);
                    int dogru = 0;
                    for (int idx = 0; idx < suallar.size(); idx++) {
                        Map<String, Object> s = suallar.get(idx);
                        Object cavab = cavablar != null ? cavablar.get(String.valueOf(idx)) : null;
                        if (fenn.equals(s.get("fenn")) && Objects.equals(cavab, s.get("dogruCavab"))) dogru++;
                    }
                    Map<String, Object> tm = new LinkedHashMap<>();
                    tm.put("tarix", exam.getCreatedAt().toString().substring(0, 10));
                    tm.put("bal", dogru * 10);
                    tm.put("dogru", dogru);
                    balTrend.add(tm);
                }
            } catch (Exception ignored) {
            }
        }

        List<Activity> filteredActivities = allActivities.stream().filter(a -> {
            String detal = a.getDetal();
            return switch (a.getNov()) {
                case "sual_helli" -> detal != null && detal.contains(fenn);
                case "exam_complete" -> true;
                case "lesson_read" -> detal != null && detal.contains(fenn);
                case "flashcard_review" -> detal != null && detal.contains(fenn);
                default -> false;
            };
        }).limit(50).toList();

        List<Map<String, Object>> sonAktivlik = filteredActivities.stream().limit(10).map(a -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("nov", a.getNov());
            m.put("detal", a.getDetal());
            m.put("tarix", a.getCreatedAt());
            return m;
        }).toList();

        List<Map<String, Object>> zəifMövzular = weakTopics.stream().map(w -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("movzu", w.getMovzu());
            m.put("sehvNisbeti", w.getSehvNisbeti());
            m.put("sualSayi", w.getSualSayi());
            m.put("oncelik", w.getOncelik());
            m.put("oynenildi", w.getOynenildi());
            m.put("tovsie", w.getTovsie());
            return m;
        }).toList();

        Map<String, Object> progressMap = new LinkedHashMap<>();
        progressMap.put("fenn", fenn);
        progressMap.put("seviyye", seviyye);
        progressMap.put("yildiz", yildiz);
        progressMap.put("dogruCavab", dogruCavab);
        progressMap.put("hallSualSayi", hallSualSayi);
        progressMap.put("dəqiqlik", dəqiqlik);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("fenn", fenn);
        result.put("progress", progressMap);
        result.put("movzuStat", movzuStat);
        result.put("balTrend", balTrend);
        result.put("sonAktivlik", sonAktivlik);
        result.put("zəifMövzular", zəifMövzular);
        result.put("bookmarkSayi", bookmarks.size());
        result.put("miniDersSayi", miniLessons.size());
        result.put("flashcardSayi", flashcards.size());
        result.put("oxunmusDersSayi", miniLessons.stream().filter(MiniLesson::getOxundu).count());
        return result;
    }
}
