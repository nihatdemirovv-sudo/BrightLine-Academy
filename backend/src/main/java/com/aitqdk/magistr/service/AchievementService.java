package com.aitqdk.magistr.service;

import com.aitqdk.magistr.entity.*;
import com.aitqdk.magistr.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.function.Function;
import java.util.function.Predicate;

@Service
@RequiredArgsConstructor
public class AchievementService {

    private final StudentService studentService;
    private final SubjectProgressRepository progressRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final BookmarkRepository bookmarkRepository;
    private final StudySessionRepository studySessionRepository;
    private final StudentAchievementRepository achievementRepository;

    public record Stats(int streak, int toplamSual, int dogruCavab, int chatSayi,
                         int fennSayi, int bookmarkSayi, int studyDəqiqə) {
    }

    private record AchievementDef(String kod, String ad, String tesvir, String icon, String reng,
                                   Predicate<Stats> sərt, Function<Stats, Integer> proqres) {
    }

    private static int pct(int val, int target) {
        return Math.min(100, Math.round(100f * val / target));
    }

    private static final List<AchievementDef> ACHIEVEMENTS = List.of(
            new AchievementDef("first_step", "İlk Addım", "İlk dəfə qeydiyyatdan keçdin", "🎯", "primary", s -> true, s -> null),
            new AchievementDef("first_question", "İlk Sual", "İlk sualı cavablandırdın", "✏️", "primary", s -> s.toplamSual() >= 1, s -> null),
            new AchievementDef("ten_questions", "Onluq", "10 sual həll etdin", "🔢", "accent", s -> s.toplamSual() >= 10, s -> pct(s.toplamSual(), 10)),
            new AchievementDef("fifty_questions", "Cəsarətli", "50 sual həll etdin", "💪", "accent", s -> s.toplamSual() >= 50, s -> pct(s.toplamSual(), 50)),
            new AchievementDef("hundred_questions", "Yüzlu Klub", "100 sual həll etdin", "💯", "warning", s -> s.toplamSual() >= 100, s -> pct(s.toplamSual(), 100)),
            new AchievementDef("first_correct", "İlk Doğru", "İlk doğru cavabını verdin", "✅", "accent", s -> s.dogruCavab() >= 1, s -> null),
            new AchievementDef("streak_3", "3 Gün Seriyası", "3 gün ardıcıl çalışdın", "🔥", "destructive", s -> s.streak() >= 3, s -> pct(s.streak(), 3)),
            new AchievementDef("streak_7", "Həftəlik Seriya", "7 gün ardıcıl çalışdın", "⚡", "warning", s -> s.streak() >= 7, s -> pct(s.streak(), 7)),
            new AchievementDef("ai_chat", "AI Söhbət", "AI Müəllimlə ilk söhbət etdin", "🤖", "primary", s -> s.chatSayi() >= 1, s -> null),
            new AchievementDef("all_subjects", "Çoxyönlü", "9 fənnin hamısında çalışdın", "📚", "accent", s -> s.fennSayi() >= 9, s -> pct(s.fennSayi(), 9)),
            new AchievementDef("perfectionist", "Mükəmməllikçi", "20+ doğru cavab (≥80% dəqiqlik)", "🎖️", "warning",
                    s -> s.dogruCavab() >= 20 && s.toplamSual() > 0 && (double) s.dogruCavab() / s.toplamSual() >= 0.8, s -> null),
            new AchievementDef("learner", "Öyrənən", "İlk səhv cavabı saxladın", "📌", "accent", s -> s.bookmarkSayi() >= 1, s -> null),
            new AchievementDef("focused", "Diqqətli", "60 dəqiqə dərs çalışdın", "⏰", "primary", s -> s.studyDəqiqə() >= 60, s -> pct(s.studyDəqiqə(), 60))
    );

    @Transactional
    public Map<String, Object> get(String sessionId) {
        Student student = studentService.findBySessionIdOrThrow(sessionId);

        List<SubjectProgress> progress = progressRepository.findByStudentId(student.getId());
        int toplamSual = progress.stream().mapToInt(SubjectProgress::getHallSualSayi).sum();
        int dogruCavab = progress.stream().mapToInt(SubjectProgress::getDogruCavab).sum();
        int fennSayi = (int) progress.stream().filter(p -> p.getHallSualSayi() > 0).count();
        int chatSayi = (int) chatMessageRepository.countByStudentIdAndRole(student.getId(), "user");
        long bookmarkSayi = bookmarkRepository.countByStudentId(student.getId());
        int studyDəqiqə = studySessionRepository.findByStudentId(student.getId()).stream()
                .mapToInt(StudySession::getMuddet).sum();

        Stats stats = new Stats(student.getStreak(), toplamSual, dogruCavab,
                chatSayi, fennSayi, (int) bookmarkSayi, studyDəqiqə);

        List<StudentAchievement> unlocked = achievementRepository.findByStudentId(student.getId());
        Set<String> acilanKodlar = new HashSet<>(unlocked.stream().map(StudentAchievement::getKod).toList());
        List<String> yeniAçilan = new ArrayList<>();

        for (AchievementDef ach : ACHIEVEMENTS) {
            if (!acilanKodlar.contains(ach.kod()) && ach.sərt().test(stats)) {
                if (achievementRepository.findByStudentIdAndKod(student.getId(), ach.kod()).isEmpty()) {
                    StudentAchievement sa = new StudentAchievement();
                    sa.setStudentId(student.getId());
                    sa.setKod(ach.kod());
                    achievementRepository.save(sa);
                    yeniAçilan.add(ach.kod());
                    acilanKodlar.add(ach.kod());
                }
            }
        }

        List<StudentAchievement> refreshed = achievementRepository.findByStudentId(student.getId());

        List<Map<String, Object>> hamısı = ACHIEVEMENTS.stream().map(ach -> {
            boolean acildi = acilanKodlar.contains(ach.kod());
            var record = refreshed.stream().filter(r -> r.getKod().equals(ach.kod())).findFirst().orElse(null);
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("kod", ach.kod());
            m.put("ad", ach.ad());
            m.put("tesvir", ach.tesvir());
            m.put("icon", ach.icon());
            m.put("reng", ach.reng());
            m.put("acildi", acildi);
            m.put("acilmaTarixi", record != null ? record.getAcildiga() : null);
            m.put("proqres", !acildi ? ach.proqres().apply(stats) : null);
            return m;
        }).toList();

        List<Map<String, Object>> yeniAçilanFull = hamısı.stream()
                .filter(a -> yeniAçilan.contains(a.get("kod")))
                .toList();

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("achievements", hamısı);
        result.put("yeniAçilan", yeniAçilanFull);
        result.put("stats", stats);
        return result;
    }
}
