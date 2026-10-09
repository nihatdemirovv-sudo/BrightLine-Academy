package com.aitqdk.magistr.service;

import com.aitqdk.magistr.ai.AiService;
import com.aitqdk.magistr.dto.GenerateQuestionsRequest;
import com.aitqdk.magistr.dto.GeneratedQuestion;
import com.aitqdk.magistr.entity.QuestionSet;
import com.aitqdk.magistr.entity.Student;
import com.aitqdk.magistr.exception.ApiException;
import com.aitqdk.magistr.repository.QuestionSetRepository;
import com.aitqdk.magistr.repository.StudentRepository;
import com.aitqdk.magistr.util.JsonUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class QuestionGeneratorService {

    private final AiService aiService;
    private final StudentRepository studentRepository;
    private final QuestionSetRepository questionSetRepository;
    private final ActivityLogService activityLogService;

    @Transactional
    public Map<String, Object> generate(GenerateQuestionsRequest req) {
        if (req.getFenn() == null || req.getSay() == null) {
            throw ApiException.badRequest("fenn və say tələb olunur");
        }

        Student student = req.getSessionId() != null
                ? studentRepository.findBySessionId(req.getSessionId()).orElse(null)
                : null;

        String qrup = req.getQrup() != null ? req.getQrup() : (student != null ? student.getQrup() : null);
        List<GeneratedQuestion> suallar;
        try {
            suallar = aiService.generateQuestions(req.getFenn(), req.getSay(), qrup, req.getMovzu());
        } catch (Exception e) {
            log.error("Sual generasiyası xətası ({}):", req.getFenn(), e);
            throw ApiException.server("Sual yaradılmağı mümkün olmadı.");
        }

        if (student != null && !suallar.isEmpty()) {
            QuestionSet qs = new QuestionSet();
            qs.setStudentId(student.getId());
            qs.setFenn(req.getFenn());
            qs.setSay(req.getSay());
            qs.setSuallar(JsonUtil.toJson(suallar));
            questionSetRepository.save(qs);
            activityLogService.log(student.getId(), "sual_helli", req.getFenn() + " - " + req.getSay() + " sual yaradıldı");
        }

        return Map.of("suallar", suallar);
    }

    public Map<String, Object> diagnostic(String qrup) {
        if (qrup == null) throw ApiException.badRequest("qrup tələb olunur");
        try {
            List<GeneratedQuestion> suallar = aiService.generateDiagnosticTest(qrup);
            return Map.of("suallar", suallar);
        } catch (Exception e) {
            log.error("Diagnostik test generasiyası xətası:", e);
            throw ApiException.server("Diagnostik test yaradıla bilmədi.");
        }
    }
}
