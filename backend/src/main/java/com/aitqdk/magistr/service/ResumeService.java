package com.aitqdk.magistr.service;

import com.aitqdk.magistr.ai.AiPrompts;
import com.aitqdk.magistr.ai.AiService;
import com.aitqdk.magistr.entity.Student;
import com.aitqdk.magistr.entity.StudentResume;
import com.aitqdk.magistr.exception.ApiException;
import com.aitqdk.magistr.repository.StudentResumeRepository;
import com.aitqdk.magistr.util.JsonUtil;
import com.fasterxml.jackson.core.type.TypeReference;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;

/**
 * Tələbənin CV-si — məzmun tam sərbəst (frontend-in idarə etdiyi) struktur olduğu üçün
 * backend-də JSON blob kimi saxlanılır, forma/sxem validasiyası edilmir. AI yalnız tələbə
 * "AI ilə Yaz/Təkmilləşdir" düyməsinə basanda, YALNIZ göndərdiyi konkret mətn parçası üçün
 * çağırılır (avtomatik/arxa planda heç vaxt yox).
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ResumeService {

    private final StudentService studentService;
    private final StudentResumeRepository resumeRepository;
    private final AiService aiService;

    @Transactional(readOnly = true)
    public Map<String, Object> get(String sessionId) {
        Student student = studentService.findBySessionIdOrThrow(sessionId);
        return resumeRepository.findByStudentId(student.getId())
                .map(r -> {
                    Map<String, Object> data = JsonUtil.fromJson(r.getData(), new TypeReference<Map<String, Object>>() {
                    });
                    return data != null ? data : Map.<String, Object>of();
                })
                .orElse(Map.of());
    }

    @Transactional
    public Map<String, Object> save(String sessionId, Map<String, Object> data) {
        Student student = studentService.findBySessionIdOrThrow(sessionId);
        if (data == null) {
            throw ApiException.badRequest("CV məlumatı boşdur.");
        }
        StudentResume resume = resumeRepository.findByStudentId(student.getId())
                .orElseGet(() -> {
                    StudentResume r = new StudentResume();
                    r.setStudentId(student.getId());
                    return r;
                });
        resume.setData(JsonUtil.toJson(data));
        resumeRepository.save(resume);
        return Map.of("success", true);
    }

    public String aiImprove(String sessionId, String metn, String kontext) {
        studentService.findBySessionIdOrThrow(sessionId);
        if (metn == null || metn.isBlank()) {
            throw ApiException.badRequest("Təkmilləşdirmək üçün əvvəlcə bir şey yaz.");
        }
        if (!aiService.isConfigured()) {
            throw ApiException.badRequest("AI konfiqurasiya olunmayıb.");
        }

        String prompt = """
                Bir CV-nin bir hissəsini peşəkar, qısa və ATS-dostu (açar sözlərlə zəngin, nailiyyətyönümlü) şəkildə yenidən yaz.
                Kontekst: %s

                Orijinal mətn:
                %s

                Qaydalar:
                - Təbii, səlis Azərbaycan dilində yaz — Azərbaycan qrammatikasına uyğun normal söz sırası ilə (fel adətən cümlənin SONUNDA gəlir, məs. "Java və Spring Framework texnologiyaları ilə iş təcrübəm var", "kod keyfiyyətini artırdım"). İngilis dilindən söz-be-söz tərcümə hissi verən, əvvəlinə fel qoyulmuş tərs/qeyri-təbii cümlələr YAZMA (məs. "Mənimsəmişəm...", "Qoruyub saxlayıram..." kimi başlanğıclar YASAQDIR).
                - Sadə, aydın, gündəlik peşəkar dildə yaz — süni, ağır və ya robotvari səslənən ifadələrdən qaç.
                - Konkret və qısa saxla, lazım olmayan sözlərdən qaç.
                - Mətndə olmayan rəqəm/fakt UYDURMA — sadəcə mövcud mətnin strukturunu, qrammatikasını və dilini yaxşılaşdır.
                - Yalnız yenilənmiş mətni qaytar — heç bir başlıq, izah, dırnaq işarəsi yazma."""
                .formatted(kontext != null && !kontext.isBlank() ? kontext : "Ümumi CV bölməsi", metn);

        try {
            return aiService.rawText(AiPrompts.CV_SYSTEM, prompt).trim();
        } catch (Exception e) {
            log.error("CV AI təkmilləşdirmə xətası:", e);
            throw ApiException.badRequest("AI mətni təkmilləşdirə bilmədi, bir az sonra yenidən cəhd et.");
        }
    }
}
