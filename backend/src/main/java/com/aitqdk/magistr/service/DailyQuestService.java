package com.aitqdk.magistr.service;

import com.aitqdk.magistr.ai.AiService;
import com.aitqdk.magistr.dto.DailyTask;
import com.aitqdk.magistr.entity.DailyQuest;
import com.aitqdk.magistr.entity.Student;
import com.aitqdk.magistr.entity.SubjectProgress;
import com.aitqdk.magistr.exception.ApiException;
import com.aitqdk.magistr.repository.DailyQuestRepository;
import com.aitqdk.magistr.repository.SubjectProgressRepository;
import com.aitqdk.magistr.util.DateUtil;
import com.aitqdk.magistr.util.JsonUtil;
import com.fasterxml.jackson.core.type.TypeReference;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class DailyQuestService {

    private final AiService aiService;
    private final StudentService studentService;
    private final SubjectProgressRepository progressRepository;
    private final DailyQuestRepository dailyQuestRepository;
    private final ActivityLogService activityLogService;

    @Transactional
    public Map<String, Object> getOrCreate(String sessionId) {
        Student student = studentService.findBySessionIdOrThrow(sessionId);
        String bugun = DateUtil.today();

        DailyQuest quest = dailyQuestRepository.findByStudentIdAndTarix(student.getId(), bugun).orElse(null);
        if (quest == null) {
            List<SubjectProgress> progress = progressRepository.findByStudentId(student.getId());
            List<AiService.ZəifFenn> zəifFənnlər = progress.stream()
                    .filter(p -> p.getHallSualSayi() > 0)
                    .sorted(Comparator.comparingInt(SubjectProgress::getSeviyye))
                    .limit(4)
                    .map(p -> new AiService.ZəifFenn(p.getFenn(), p.getSeviyye()))
                    .toList();

            List<DailyTask> tasks = aiService.generateDailyPlan(student.getQrup(), zəifFənnlər, student.getHedefUniversite());

            quest = new DailyQuest();
            quest.setStudentId(student.getId());
            quest.setTarix(bugun);
            quest.setTasks(JsonUtil.toJson(tasks));
            quest.setToplam(tasks.size());
            quest = dailyQuestRepository.save(quest);
        }

        Map<String, Object> result = JsonUtil.asMap(quest);
        result.put("tasks", JsonUtil.fromJson(quest.getTasks(), new TypeReference<List<DailyTask>>() {
        }));
        return result;
    }

    public record CompleteTaskRequest(String sessionId, Integer taskIndex) {
    }

    @Transactional
    public Map<String, Object> completeTask(CompleteTaskRequest req) {
        Student student = studentService.findBySessionIdOrThrow(req.sessionId());
        String bugun = DateUtil.today();
        DailyQuest quest = dailyQuestRepository.findByStudentIdAndTarix(student.getId(), bugun)
                .orElseThrow(() -> ApiException.notFound("Plan tapılmadı"));

        List<Map<String, Object>> tasks = JsonUtil.fromJson(quest.getTasks(), new TypeReference<List<Map<String, Object>>>() {
        });
        if (req.taskIndex() != null && req.taskIndex() >= 0 && req.taskIndex() < tasks.size()) {
            tasks.get(req.taskIndex()).put("tamamlandi", true);
        }

        int yeniTamamlandi = quest.getTamamlandi() + 1;
        quest.setTasks(JsonUtil.toJson(tasks));
        quest.setTamamlandi(yeniTamamlandi);
        dailyQuestRepository.save(quest);

        activityLogService.log(student.getId(), "quest",
                "Tapşırıq " + (req.taskIndex() != null ? req.taskIndex() + 1 : "?") + " tamamlandı");

        Map<String, Object> result = new java.util.LinkedHashMap<>();
        result.put("tasks", tasks);
        result.put("tamamlandi", yeniTamamlandi);
        return result;
    }
}
