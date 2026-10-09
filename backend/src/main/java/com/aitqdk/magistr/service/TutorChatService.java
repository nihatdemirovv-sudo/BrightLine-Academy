package com.aitqdk.magistr.service;

import com.aitqdk.magistr.ai.AiService;
import com.aitqdk.magistr.dto.AnalyzeImageRequest;
import com.aitqdk.magistr.dto.TutorChatRequest;
import com.aitqdk.magistr.entity.ChatMessage;
import com.aitqdk.magistr.entity.Student;
import com.aitqdk.magistr.entity.SubjectProgress;
import com.aitqdk.magistr.exception.ApiException;
import com.aitqdk.magistr.repository.ChatMessageRepository;
import com.aitqdk.magistr.repository.StudentRepository;
import com.aitqdk.magistr.repository.SubjectProgressRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class TutorChatService {

    private final AiService aiService;
    private final StudentRepository studentRepository;
    private final SubjectProgressRepository progressRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final ActivityLogService activityLogService;

    @Transactional
    public Map<String, String> chat(TutorChatRequest req) {
        if (req.getSessionId() == null || req.getMessages() == null || req.getMessages().isEmpty()) {
            throw ApiException.badRequest("parametrlər çatışmır");
        }

        Student student = studentRepository.findBySessionId(req.getSessionId()).orElse(null);

        List<String> zəifFənnlər = List.of();
        if (student != null) {
            List<SubjectProgress> progress = progressRepository.findByStudentId(student.getId());
            zəifFənnlər = progress.stream()
                    .filter(p -> p.getSeviyye() < 50)
                    .sorted(Comparator.comparingInt(SubjectProgress::getSeviyye))
                    .limit(3)
                    .map(SubjectProgress::getFenn)
                    .toList();
        }

        AiService.TutorContext context = new AiService.TutorContext(
                student != null ? student.getQrup() : null,
                student != null ? student.getHedefUniversite() : null,
                zəifFənnlər);

        String reply;
        try {
            reply = aiService.tutorChat(req.getMessages(), context);
        } catch (Exception e) {
            log.error("tutorChat AI xətası:", e);
            throw ApiException.server("AI xidməti mövcud deyil. Bir az sonra yenidən cəhd edin.");
        }

        if (student != null) {
            Map<String, String> lastUser = req.getMessages().get(req.getMessages().size() - 1);
            saveMessage(student.getId(), "user", lastUser.get("content"), Boolean.TRUE.equals(req.getImageQuestion()));
            saveMessage(student.getId(), "assistant", reply, false);
            activityLogService.log(student.getId(), "chat");
        }

        return Map.of("reply", reply);
    }

    @Transactional
    public Map<String, String> analyzeImage(AnalyzeImageRequest req) {
        if (req.getImageBase64() == null || req.getMimeType() == null) {
            throw ApiException.badRequest("şəkil tələb olunur");
        }

        Student student = req.getSessionId() != null
                ? studentRepository.findBySessionId(req.getSessionId()).orElse(null)
                : null;

        String reply;
        try {
            reply = aiService.analyzeProblemImage(req.getImageBase64(), req.getMimeType(),
                    req.getQuestion() != null ? req.getQuestion() : "",
                    student != null ? student.getQrup() : null);
        } catch (Exception e) {
            log.error("analyzeImage AI xətası:", e);
            throw ApiException.server("Şəkil analizi mümkün olmadı. Yenidən cəhd edin.");
        }

        if (student != null) {
            String userContent = (req.getQuestion() != null && !req.getQuestion().isBlank())
                    ? req.getQuestion() : "[Şəkil yükləndi]";
            saveMessage(student.getId(), "user", userContent, true);
            saveMessage(student.getId(), "assistant", reply, false);
            activityLogService.log(student.getId(), "chat", "şəkil analiz");
        }

        return Map.of("reply", reply);
    }

    private void saveMessage(String studentId, String role, String content, boolean hasImage) {
        ChatMessage m = new ChatMessage();
        m.setStudentId(studentId);
        m.setRole(role);
        m.setContent(content);
        m.setHasImage(hasImage);
        chatMessageRepository.save(m);
    }
}
