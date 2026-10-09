package com.aitqdk.magistr.service;

import com.aitqdk.magistr.entity.Flashcard;
import com.aitqdk.magistr.entity.Student;
import com.aitqdk.magistr.exception.ApiException;
import com.aitqdk.magistr.repository.FlashcardRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class FlashcardService {

    private final StudentService studentService;
    private final FlashcardRepository flashcardRepository;
    private final ActivityLogService activityLogService;

    private record Sm2Result(int repetitions, double ease, int interval, Instant nextReview) {
    }

    /** SM-2 spaced repetition — quality 0-5 (0=tamamilə yanlış, 5=mükəmməl). */
    private Sm2Result sm2Calculate(int quality, int repetitions, double ease, int interval) {
        double newEase = ease;
        int newRepetitions;
        int newInterval;

        if (quality < 3) {
            newRepetitions = 0;
            newInterval = 1;
        } else {
            newRepetitions = repetitions + 1;
            if (newRepetitions == 1) newInterval = 1;
            else if (newRepetitions == 2) newInterval = 3;
            else newInterval = (int) Math.round(interval * ease);
        }

        newEase = ease + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
        if (newEase < 1.3) newEase = 1.3;

        Instant nextReview = Instant.now().plus(newInterval, ChronoUnit.DAYS);
        return new Sm2Result(newRepetitions, newEase, newInterval, nextReview);
    }

    @Transactional
    public Map<String, Object> list(String sessionId, String mode) {
        Student student = studentService.findBySessionIdOrThrow(sessionId);
        Instant now = Instant.now();

        List<Flashcard> flashcards = "all".equals(mode)
                ? flashcardRepository.findByStudentIdOrderByNextReviewAsc(student.getId())
                : flashcardRepository.findByStudentIdAndNextReviewLessThanEqualOrderByNextReviewAsc(student.getId(), now);

        long toplam = flashcardRepository.countByStudentId(student.getId());
        long buGunTəkrar = flashcardRepository.countByStudentIdAndNextReviewLessThanEqual(student.getId(), now);

        Map<String, Object> stats = Map.of("toplam", toplam, "buGunTəkrar", buGunTəkrar, "öyrənilen", 0);
        return Map.of("flashcards", flashcards, "stats", stats);
    }

    public record CreateRequest(String sessionId, String onYuzu, String cavab, String fenn, String movzu, String bookmarkId) {
    }

    @Transactional
    public Flashcard create(CreateRequest req) {
        if (req.sessionId() == null || req.onYuzu() == null || req.cavab() == null || req.fenn() == null) {
            throw ApiException.badRequest("parametrlər çatışmır");
        }
        Student student = studentService.findBySessionIdOrThrow(req.sessionId());

        Flashcard f = new Flashcard();
        f.setStudentId(student.getId());
        f.setOnYuzu(req.onYuzu());
        f.setCavab(req.cavab());
        f.setFenn(req.fenn());
        f.setMovzu(req.movzu());
        f.setBookmarkId(req.bookmarkId());
        f.setNextReview(Instant.now());
        return flashcardRepository.save(f);
    }

    @Transactional
    public void delete(String id) {
        if (id == null) throw ApiException.badRequest("id tələb olunur");
        flashcardRepository.deleteById(id);
    }

    public record ReviewRequest(String flashcardId, Integer quality) {
    }

    @Transactional
    public Map<String, Object> review(ReviewRequest req) {
        if (req.flashcardId() == null || req.quality() == null || req.quality() < 0 || req.quality() > 5) {
            throw ApiException.badRequest("parametrlər çatışmır");
        }
        Flashcard flashcard = flashcardRepository.findById(req.flashcardId())
                .orElseThrow(() -> ApiException.notFound("Flashcard tapılmadı"));

        Sm2Result result = sm2Calculate(req.quality(), flashcard.getRepetitions(), flashcard.getEase(), flashcard.getInterval());

        flashcard.setRepetitions(result.repetitions());
        flashcard.setEase(result.ease());
        flashcard.setInterval(result.interval());
        flashcard.setNextReview(result.nextReview());
        if (req.quality() >= 3) flashcard.setDogruSayi(flashcard.getDogruSayi() + 1);
        else flashcard.setSehvSayi(flashcard.getSehvSayi() + 1);
        Flashcard saved = flashcardRepository.save(flashcard);

        studentService.findByIdOptional(saved.getStudentId()).ifPresent(student ->
                activityLogService.log(student.getId(), "flashcard_review",
                        saved.getFenn() + " · " + (req.quality() >= 3 ? "doğru" : "səhv")));

        Map<String, Object> resultMap = com.aitqdk.magistr.util.JsonUtil.asMap(saved);
        resultMap.put("növbətiGün", result.interval());
        return resultMap;
    }
}
