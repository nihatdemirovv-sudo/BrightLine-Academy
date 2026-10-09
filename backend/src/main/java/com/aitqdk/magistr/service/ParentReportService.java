package com.aitqdk.magistr.service;

import com.aitqdk.magistr.ai.AiService;
import com.aitqdk.magistr.entity.Activity;
import com.aitqdk.magistr.entity.ParentReport;
import com.aitqdk.magistr.entity.Student;
import com.aitqdk.magistr.entity.SubjectProgress;
import com.aitqdk.magistr.repository.ActivityRepository;
import com.aitqdk.magistr.repository.ParentReportRepository;
import com.aitqdk.magistr.repository.SubjectProgressRepository;
import com.aitqdk.magistr.util.DateUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ParentReportService {

    private final AiService aiService;
    private final StudentService studentService;
    private final SubjectProgressRepository progressRepository;
    private final ActivityRepository activityRepository;
    private final ParentReportRepository parentReportRepository;

    @Transactional
    public Map<String, Object> generate(String sessionId) {
        Student student = studentService.findBySessionIdOrThrow(sessionId);
        List<SubjectProgress> progress = progressRepository.findByStudentId(student.getId());

        Instant weekAgo = Instant.now().minusSeconds(7L * 24 * 60 * 60);
        List<Activity> activities = activityRepository.findByStudentIdAndCreatedAtAfter(student.getId(), weekAgo);

        int toplamSual = progress.stream().mapToInt(SubjectProgress::getHallSualSayi).sum();
        int dogruCavab = progress.stream().mapToInt(SubjectProgress::getDogruCavab).sum();
        long aktivGünSayı = activities.stream()
                .map(a -> a.getCreatedAt().atZone(ZoneOffset.UTC).toLocalDate())
                .distinct().count();
        List<AiService.FennProqresi> fənnProqresi = progress.stream()
                .filter(p -> p.getHallSualSayi() > 0)
                .map(p -> new AiService.FennProqresi(p.getFenn(), p.getSeviyye()))
                .toList();

        AiService.ParentReportInput input = new AiService.ParentReportInput(
                student.getAd(), student.getQrup(), student.getHedefUniversite(),
                toplamSual, dogruCavab, student.getStreak(), fənnProqresi, (int) aktivGünSayı);

        String metin = aiService.generateParentReport(input);

        String baslamaTarixi = LocalDate.now(ZoneOffset.UTC).minusDays(7).toString();
        String bitmeTarixi = DateUtil.today();

        ParentReport report = new ParentReport();
        report.setStudentId(student.getId());
        report.setBaslamaTarixi(baslamaTarixi);
        report.setBitmeTarixi(bitmeTarixi);
        report.setMetin(metin);
        report = parentReportRepository.save(report);

        List<ParentReport> sonRaportlar = parentReportRepository.findByStudentIdOrderByCreatedAtDesc(
                student.getId(), PageRequest.of(0, 5));

        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("toplamSual", toplamSual);
        stats.put("dogruCavab", dogruCavab);
        stats.put("aktivGünSayı", aktivGünSayı);
        stats.put("streak", student.getStreak());

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("report", report);
        result.put("sonRaportlar", sonRaportlar);
        result.put("stats", stats);
        return result;
    }
}
