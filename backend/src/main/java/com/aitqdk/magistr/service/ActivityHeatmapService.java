package com.aitqdk.magistr.service;

import com.aitqdk.magistr.entity.Activity;
import com.aitqdk.magistr.entity.Student;
import com.aitqdk.magistr.repository.ActivityRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.*;

@Service
@RequiredArgsConstructor
public class ActivityHeatmapService {

    private final StudentService studentService;
    private final ActivityRepository activityRepository;

    @Transactional
    public Map<String, Object> get(String sessionId) {
        Student student = studentService.findBySessionIdOrThrow(sessionId);
        List<Activity> activities = activityRepository.findByStudentId(student.getId());

        Map<String, Integer> aktivlikTarixi = new HashMap<>();
        for (Activity a : activities) {
            String tarix = a.getCreatedAt().atZone(ZoneOffset.UTC).toLocalDate().toString();
            aktivlikTarixi.merge(tarix, 1, Integer::sum);
        }

        LocalDate today = LocalDate.now(ZoneOffset.UTC);
        List<Map<String, Object>> günlər = new ArrayList<>();
        for (int i = 83; i >= 0; i--) {
            LocalDate d = today.minusDays(i);
            String tarix = d.toString();
            int say = aktivlikTarixi.getOrDefault(tarix, 0);
            int intensivlik = say >= 20 ? 4 : say >= 10 ? 3 : say >= 5 ? 2 : say >= 1 ? 1 : 0;
            Map<String, Object> gun = new LinkedHashMap<>();
            gun.put("tarix", tarix);
            gun.put("say", say);
            gun.put("intensivlik", intensivlik);
            günlər.add(gun);
        }

        List<Map<String, Object>> həftələr = new ArrayList<>();
        for (int i = 0; i < günlər.size(); i += 7) {
            həftələr.add(Map.of("günlər", günlər.subList(i, Math.min(i + 7, günlər.size()))));
        }

        long aktivGünlər = günlər.stream().filter(g -> (Integer) g.get("say") > 0).count();
        int toplamAktivlik = activities.size();
        int buGünSay = (Integer) günlər.get(günlər.size() - 1).get("say");
        int ənYaxşıGün = günlər.stream().mapToInt(g -> (Integer) g.get("say")).max().orElse(0);

        int cariStreak = 0;
        for (int i = günlər.size() - 1; i >= 0; i--) {
            if ((Integer) günlər.get(i).get("say") > 0) cariStreak++;
            else break;
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("həftələr", həftələr);
        result.put("aktivGünlər", aktivGünlər);
        result.put("toplamAktivlik", toplamAktivlik);
        result.put("buGünSay", buGünSay);
        result.put("ənYaxşıGün", ənYaxşıGün);
        result.put("cariStreak", cariStreak);
        return result;
    }
}
