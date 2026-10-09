package com.aitqdk.magistr.service;

import com.aitqdk.magistr.ai.AiPrompts;
import com.aitqdk.magistr.ai.AiService;
import com.aitqdk.magistr.dto.GeneratedQuestion;
import com.aitqdk.magistr.entity.MiniLesson;
import com.aitqdk.magistr.entity.Student;
import com.aitqdk.magistr.exception.ApiException;
import com.aitqdk.magistr.repository.MiniLessonRepository;
import com.aitqdk.magistr.util.JsonUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class MiniLessonService {

    private final AiService aiService;
    private final StudentService studentService;
    private final MiniLessonRepository miniLessonRepository;
    private final ActivityLogService activityLogService;

    private static final Pattern HEADING = Pattern.compile("^##\\s+(.+)$", Pattern.MULTILINE);

    @Transactional
    public Map<String, Object> list(String sessionId) {
        Student student = studentService.findBySessionIdOrThrow(sessionId);
        List<MiniLesson> lessons = miniLessonRepository.findByStudentIdOrderByCreatedAtDesc(
                student.getId(), PageRequest.of(0, 20));

        List<Map<String, Object>> mapped = lessons.stream().map(this::toMap).toList();

        long oxundu = lessons.stream().filter(MiniLesson::getOxundu).count();
        Map<String, Object> stats = Map.of(
                "toplam", lessons.size(),
                "oxundu", oxundu,
                "oxunmamis", lessons.size() - oxundu,
                "bookmark", lessons.stream().filter(MiniLesson::getBookmarkEdildi).count()
        );

        return Map.of("lessons", mapped, "stats", stats);
    }

    @Transactional
    public Map<String, Object> togglePatch(String lessonId, String action) {
        if (lessonId == null || action == null) throw ApiException.badRequest("parametrlər çatışmır");
        MiniLesson lesson = miniLessonRepository.findById(lessonId)
                .orElseThrow(() -> ApiException.notFound("Dərs tapılmadı"));

        if ("read".equals(action)) lesson.setOxundu(!lesson.getOxundu());
        else if ("bookmark".equals(action)) lesson.setBookmarkEdildi(!lesson.getBookmarkEdildi());

        MiniLesson updated = miniLessonRepository.save(lesson);

        if ("read".equals(action) && updated.getOxundu()) {
            activityLogService.log(lesson.getStudentId(), "lesson_read", lesson.getFenn() + " · " + lesson.getMovzu());
        }

        return toMap(updated);
    }

    @Transactional
    public Map<String, Object> generate(String sessionId, String fenn, String movzu) {
        if (sessionId == null || fenn == null || movzu == null) throw ApiException.badRequest("parametrlər çatışmır");
        Student student = studentService.findBySessionIdOrThrow(sessionId);

        String slug = (fenn + "-" + movzu).toLowerCase(Locale.ROOT)
                .replaceAll("\\s+", "-")
                .replaceAll("[^a-z0-9-]", "");
        if (slug.length() > 60) slug = slug.substring(0, 60);

        var existing = miniLessonRepository.findByStudentIdAndSlug(student.getId(), slug);
        if (existing.isPresent()) {
            return toMap(existing.get());
        }

        String prompt = """
                Bir TQDK şagirdi üçün "%s" fənninin "%s" mövzusunda qısa mini-dərs yaz.

                Şagird: %s
                Qrup: %s
                Hədəf: %s

                Dərs strukturu (Markdown formatında):

                ## %s

                ### Mövzunun qısa tərifi
                <1-2 cümlə ilə mövzunu izah et>

                ### Əsas anlayışlar
                - <Anlayış 1>: <qısa izah>
                - <Anlayış 2>: <qısa izah>
                - <Anlayış 3>: <qısa izah>

                ### Addım-addım izah
                <Mövzunu addım-addım izah et, 3-5 addım>

                ### Nümunə həlli
                <Konkret nümunə üzərindən mövzunu göstər>

                ### Səhv edilən ümumi xətalar
                - <xəta 1>
                - <xəta 2>

                ### Qısa xülasə
                <Mövzunun əsas fikrini 1 cümlə ilə>

                Qaydalar:
                - Azerbaycan dilində, qrammatik düzgün
                - Şagird anlayacaq səviyyədə, aydın və konkret
                - Uzun olmasın (~5 dəqiqə oxunma)
                - Markdown formatında (## başlıqlar, - siyahılar, ** qalın)
                - Uydurma (hallucination) etmə"""
                .formatted(fenn, movzu, student.getAd(),
                        AiPrompts.qrupTesviri(student.getQrup()),
                        student.getHedefUniversite() != null && !student.getHedefUniversite().isBlank() ? student.getHedefUniversite() : "qeyd olunmayıb",
                        movzu);

        String metin = aiService.balansliCavab(() -> aiService.rawText(
                AiPrompts.MINI_LESSON_SYSTEM,
                prompt), "Mini-dərs");

        int firstHeadingIdx = metin.indexOf("## ");
        if (firstHeadingIdx > 0) {
            metin = metin.substring(firstHeadingIdx);
        } else if (firstHeadingIdx < 0) {
            metin = "## " + movzu + "\n\n" + metin;
        }

        String basliq = movzu;
        Matcher m = HEADING.matcher(metin);
        if (m.find()) basliq = m.group(1).trim();

        List<GeneratedQuestion> quizSuallar;
        try {
            quizSuallar = aiService.generateQuestions(fenn, 3, student.getQrup(), movzu);
        } catch (Exception e) {
            quizSuallar = List.of();
        }

        MiniLesson lesson = new MiniLesson();
        lesson.setStudentId(student.getId());
        lesson.setFenn(fenn);
        lesson.setMovzu(movzu);
        lesson.setSlug(slug);
        lesson.setMetin(metin);
        lesson.setBasliq(basliq);
        lesson.setOxunmaVaxti(Math.max(3, (int) Math.ceil(metin.length() / 800.0)));
        lesson.setQuizSuallar(quizSuallar.isEmpty() ? null : JsonUtil.toJson(quizSuallar));
        lesson = miniLessonRepository.save(lesson);

        activityLogService.log(student.getId(), "lesson_create", fenn + " · " + movzu);

        Map<String, Object> result = JsonUtil.asMap(lesson);
        result.put("quizSuallar", quizSuallar.isEmpty() ? null : quizSuallar);
        return result;
    }

    private Map<String, Object> toMap(MiniLesson lesson) {
        Map<String, Object> map = JsonUtil.asMap(lesson);
        if (lesson.getQuizSuallar() != null) {
            map.put("quizSuallar", JsonUtil.fromJson(lesson.getQuizSuallar(), List.class));
        } else {
            map.put("quizSuallar", null);
        }
        return map;
    }
}
