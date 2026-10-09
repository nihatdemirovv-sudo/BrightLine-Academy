package com.aitqdk.magistr.service;

import com.aitqdk.magistr.ai.AiService;
import com.aitqdk.magistr.entity.Bookmark;
import com.aitqdk.magistr.entity.ErrorPattern;
import com.aitqdk.magistr.entity.Student;
import com.aitqdk.magistr.exception.ApiException;
import com.aitqdk.magistr.repository.BookmarkRepository;
import com.aitqdk.magistr.repository.ErrorPatternRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@RequiredArgsConstructor
public class ErrorPatternService {

    private record XetaTip(String kod, String ad, String tesvir, String icon, String reng) {
    }

    private static final List<XetaTip> XƏTA_TİPLƏRİ = List.of(
            new XetaTip("konseptual", "Konseptual", "Mövzunu tam başa düşməmisən", "🧠", "destructive"),
            new XetaTip("hesab", "Hesab Xətası", "Riyazi/hesab səhvi etmisən", "🔢", "warning"),
            new XetaTip("oxumaq", "Oxu Xətası", "Sualı yanlış oxumusan", "👁️", "warning"),
            new XetaTip("vaxt", "Vaxt Çatışmazlığı", "Vaxt azlığından qalmısan", "⏰", "warning"),
            new XetaTip("diqqet", "Diqqətsizlik", "Sadə diqqətsizlik", "⚠️", "accent")
    );

    private final AiService aiService;
    private final StudentService studentService;
    private final ErrorPatternRepository errorPatternRepository;
    private final BookmarkRepository bookmarkRepository;

    @Transactional
    public Map<String, Object> get(String sessionId) {
        Student student = studentService.findBySessionIdOrThrow(sessionId);
        List<ErrorPattern> patterns = errorPatternRepository.findByStudentId(student.getId());
        List<Bookmark> unclassified = bookmarkRepository.findByStudentIdAndTekrarEdildiFalseOrderByCreatedAtDesc(
                student.getId(), PageRequest.of(0, 20));

        Map<String, Integer> countByTip = new LinkedHashMap<>();
        Map<String, Map<String, Integer>> fennlerByTip = new LinkedHashMap<>();
        for (ErrorPattern p : patterns) {
            countByTip.merge(p.getTip(), p.getSay(), Integer::sum);
            fennlerByTip.computeIfAbsent(p.getTip(), k -> new LinkedHashMap<>()).merge(p.getFenn(), p.getSay(), Integer::sum);
        }
        int toplamXəta = patterns.stream().mapToInt(ErrorPattern::getSay).sum();

        List<Map<String, Object>> nümunələr = XƏTA_TİPLƏRİ.stream().map(tip -> {
            int say = countByTip.getOrDefault(tip.kod(), 0);
            int faiz = toplamXəta > 0 ? Math.round(100f * say / toplamXəta) : 0;
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("kod", tip.kod());
            m.put("ad", tip.ad());
            m.put("tesvir", tip.tesvir());
            m.put("icon", tip.icon());
            m.put("reng", tip.reng());
            m.put("say", say);
            m.put("faiz", faiz);
            m.put("fennler", fennlerByTip.getOrDefault(tip.kod(), Map.of()));
            return m;
        }).sorted((a, b) -> (Integer) b.get("say") - (Integer) a.get("say")).toList();

        Map<String, Integer> fennXəta = new LinkedHashMap<>();
        for (ErrorPattern p : patterns) fennXəta.merge(p.getFenn(), p.getSay(), Integer::sum);
        List<Map<String, Object>> topFennXəta = fennXəta.entrySet().stream()
                .sorted((a, b) -> b.getValue() - a.getValue())
                .limit(5)
                .map(e -> Map.<String, Object>of("fenn", e.getKey(), "say", e.getValue()))
                .toList();

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("nümunələr", nümunələr);
        result.put("toplamXəta", toplamXəta);
        result.put("topFennXəta", topFennXəta);
        result.put("siniflendirilmemishBookmark", unclassified.size());
        result.put("xetaTipleri", XƏTA_TİPLƏRİ);
        return result;
    }

    public record ClassifyRequest(String sessionId, String bookmarkId) {
    }

    @Transactional
    public Map<String, Object> classify(ClassifyRequest req) {
        if (req.sessionId() == null || req.bookmarkId() == null) throw ApiException.badRequest("parametrlər çatışmır");
        Student student = studentService.findBySessionIdOrThrow(req.sessionId());
        Bookmark bookmark = bookmarkRepository.findById(req.bookmarkId())
                .orElseThrow(() -> ApiException.notFound("Bookmark tapılmadı"));
        if (!bookmark.getStudentId().equals(student.getId())) throw ApiException.notFound("Bookmark tapılmadı");

        String tip = aiService.classifyError(bookmark.getSual(), bookmark.getIzah(),
                bookmark.getSehvCavab(), bookmark.getDogruCavab(), bookmark.getFenn());

        var existing = errorPatternRepository.findByStudentIdAndTipAndFenn(student.getId(), tip, bookmark.getFenn());
        if (existing.isPresent()) {
            ErrorPattern p = existing.get();
            p.setSay(p.getSay() + 1);
            errorPatternRepository.save(p);
        } else {
            String tovsie = "";
            try {
                String tipAd = XƏTA_TİPLƏRİ.stream().filter(x -> x.kod().equals(tip)).findFirst().map(XetaTip::ad).orElse(tip);
                tovsie = aiService.shortAdvice("%s fənnində %s tipində xəta üçün qısa tövsiyə ver (1 cümlə, Azerbaycan dilində)."
                        .formatted(bookmark.getFenn(), tipAd));
            } catch (Exception ignored) {
            }
            ErrorPattern p = new ErrorPattern();
            p.setStudentId(student.getId());
            p.setTip(tip);
            p.setFenn(bookmark.getFenn());
            p.setSay(1);
            p.setTovsie(tovsie);
            errorPatternRepository.save(p);
        }

        return Map.of("success", true, "tip", tip);
    }
}
