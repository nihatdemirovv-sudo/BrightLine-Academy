package com.aitqdk.magistr.service;

import com.aitqdk.magistr.ai.AiService;
import com.aitqdk.magistr.dto.ExamQuestion;
import com.aitqdk.magistr.exception.ApiException;
import com.aitqdk.magistr.util.UploadLimits;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class DocumentParseService {

    private final AiService aiService;
    private final StudentService studentService;

    public record FileInput(String base64, String mimeType) {
    }

    public Map<String, Object> pastExamParse(String sessionId, List<FileInput> files) {
        if (sessionId == null || files == null || files.isEmpty()) {
            throw ApiException.badRequest("fayl tələb olunur");
        }
        studentService.findBySessionIdOrThrow(sessionId);
        files.forEach(f -> UploadLimits.checkRaw(f.base64(), f.mimeType()));

        List<ExamQuestion> suallar = extract(files);
        if (suallar.isEmpty()) {
            throw ApiException.unprocessable("Sənəddə sual tapılmadı. Şəklin aydın olduğuna əmin olun və yenidən cəhd edin.");
        }
        return Map.of("suallar", suallar);
    }

    public Map<String, Object> adminParse(List<FileInput> files) {
        if (files == null || files.isEmpty()) throw ApiException.badRequest("fayl tələb olunur");
        files.forEach(f -> UploadLimits.checkRaw(f.base64(), f.mimeType()));
        log.info("Admin parse: {} fayl göndərildi", files.size());

        List<ExamQuestion> suallar;
        try {
            suallar = extract(files);
        } catch (Exception e) {
            log.error("Admin parse xətası:", e);
            throw ApiException.server("Sənəd analiz edilə bilmədi: " + e.getMessage());
        }
        if (suallar.isEmpty()) {
            throw ApiException.unprocessable("Sənəddə sual tapılmadı. AI_API_KEY təyin olunubmu? Şəklin/PDF-in aydın olduğuna əmin olun.");
        }
        log.info("Admin parse: {} sual çıxarıldı", suallar.size());
        return Map.of("suallar", suallar);
    }

    private List<ExamQuestion> extract(List<FileInput> files) {
        List<AiService.DocumentFile> docs = files.stream()
                .map(f -> new AiService.DocumentFile(f.base64(), f.mimeType()))
                .toList();
        try {
            return aiService.extractQuestionsFromDocument(docs);
        } catch (Exception e) {
            log.error("extractQuestionsFromDocument xətası", e);
            throw ApiException.server("Sənəd analiz edilə bilmədi. Yenidən cəhd edin.");
        }
    }
}
