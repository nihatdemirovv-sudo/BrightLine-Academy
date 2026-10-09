package com.aitqdk.magistr.service;

import com.aitqdk.magistr.dto.GeneratedQuestion;
import com.aitqdk.magistr.entity.RealMagistrSual;
import com.aitqdk.magistr.repository.RealMagistrSualRepository;
import com.aitqdk.magistr.util.JsonUtil;
import com.fasterxml.jackson.core.type.TypeReference;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Magistr OL-un rəsmi "Test Bank" kitablarından (istifadəçinin verdiyi PDF-lərdən, {@link
 * RealMagistrSual} kimi əvvəlcədən idxal edilmiş) REAL suallardan təsadüfi seçim. Sual Generatoru
 * (və onun paylaşdığı İmtahan Simulyatoru) üçün — Magistr rejimində Məntiq/İnformatika seçiləndə AI-nın
 * "üsluba bənzər" yaratdığı suallar ƏVƏZİNƏ, kitabın öz mətni + öz cavabı istifadə olunur.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class RealMagistrSualService {

    private final RealMagistrSualRepository repository;

    /** Bu fənn üçün real sual bankı mövcuddursa true. Yalnız Məntiq/İnformatika idxal edilib (bax
     * `RealMagistrSual` sinif izahı — İngilis dili kitabının cavab açarı etibarlı parse olunmadı). */
    public boolean movcudFennUcun(String fenn, String qrup) {
        if (fenn == null || qrup == null) return false;
        return !repository.findByFennAndQrup(fenn, qrup).isEmpty();
    }

    /** Sualın (kobud, saxlanılmayan) tipini müəyyən edir — "movzu" sahəsi PDF-dən çıxarılan zaman
     * çox vaxt "Ümumi"/"?" kimi mənasız qalıb, ona görə diversifikasiya üçün istifadə oluna bilmir.
     * Bunun əvəzinə sualın MƏTNİNƏ görə kobud təsnifat aparılır ki, təsadüfi seçimdə eyni "hiss"də
     * olan suallar (məs. hamısı xalis rəqəm ardıcıllığı) bir-birinin ardınca klasterlənməsin. */
    private String tip(String sual) {
        if (sual == null || sual.isBlank()) return "digər";
        String yalnizRemazlar = sual.replaceAll("[0-9\\s,;.?+\\-*/=()]+", "");
        if (yalnizRemazlar.isEmpty()) return "ardıcıllıq";
        long sozSayi = java.util.regex.Pattern.compile("[a-zA-ZəğüşçöıƏĞÜŞÇÖİ]{3,}")
                .matcher(sual).results().count();
        return sozSayi >= 3 ? "mətnli" : "digər";
    }

    /** `say` ədəd təsadüfi real sual qaytarır (bankda azdırsa, mövcud olanların hamısını). Seçim
     * `tip()`-ə görə YUVARLAQ-SIRA (round-robin) aparılır — eyni tipdən suallar bir-birinin ardınca
     * klasterlənməsin deyə (məs. bir dəstdə 5 sualın hamısı xalis rəqəm ardıcıllığı olmasın). */
    @Transactional(readOnly = true)
    public List<GeneratedQuestion> randomSual(String fenn, String qrup, int say) {
        List<RealMagistrSual> hamısı = repository.findByFennAndQrup(fenn, qrup);
        if (hamısı.isEmpty()) return List.of();

        Map<String, List<RealMagistrSual>> bucketlər = hamısı.stream()
                .collect(Collectors.groupingBy(s -> tip(s.getSual()), LinkedHashMap::new, Collectors.toList()));
        bucketlər.values().forEach(Collections::shuffle);
        List<String> bucketAçarları = new ArrayList<>(bucketlər.keySet());
        Collections.shuffle(bucketAçarları);

        List<RealMagistrSual> seçilmiş = new ArrayList<>();
        Map<String, Integer> mövqe = new HashMap<>();
        boolean hərhansıQaldı = true;
        while (seçilmiş.size() < say && hərhansıQaldı) {
            hərhansıQaldı = false;
            for (String açar : bucketAçarları) {
                if (seçilmiş.size() >= say) break;
                int i = mövqe.getOrDefault(açar, 0);
                List<RealMagistrSual> bucket = bucketlər.get(açar);
                if (i < bucket.size()) {
                    seçilmiş.add(bucket.get(i));
                    mövqe.put(açar, i + 1);
                    hərhansıQaldı = true;
                }
            }
        }

        List<GeneratedQuestion> nəticə = new ArrayList<>();
        for (RealMagistrSual s : seçilmiş) {
            Map<String, String> variantlar = JsonUtil.fromJson(s.getVariantlar(), new TypeReference<>() {
            });
            if (variantlar == null) continue;
            GeneratedQuestion q = new GeneratedQuestion();
            q.setSual(s.getSual());
            q.setVariantlar(variantlar);
            q.setDogruCavab(s.getDogruCavab());
            q.setIzah(s.getIzah() != null && !s.getIzah().isBlank()
                    ? s.getIzah()
                    : "Doğru cavab: " + s.getDogruCavab() + ". (Magistr OL test bankının rəsmi cavab açarı.)");
            q.setMovzu(s.getMovzu());
            q.setCetinlik("orta");
            q.setFenn(s.getFenn());
            nəticə.add(q);
        }
        return nəticə;
    }

    /** Mövcud sualların YALNIZ izahını güncəlləyir (id → yeni izah) — Groq günlük kvotası sonradan
     * açılanda, əvvəllər fallback izahla idxal olunmuş sualları geriyə doldurmaq üçün. */
    @Transactional
    public int updateIzahById(Map<String, String> idToIzah) {
        int say = 0;
        for (var entry : idToIzah.entrySet()) {
            RealMagistrSual s = repository.findById(entry.getKey()).orElse(null);
            if (s == null || entry.getValue() == null || entry.getValue().isBlank()) continue;
            s.setIzah(entry.getValue());
            repository.save(s);
            say++;
        }
        return say;
    }

    // === Admin idxal ===

    @Data
    public static class ImportItem {
        private String fenn;
        private String qrup;
        private String movzu;
        private String sual;
        private Map<String, String> variantlar;
        private String dogruCavab;
        private String izah;
    }

    public record ImportResult(int əlavəEdildi) {
    }

    @Transactional
    public ImportResult importList(List<ImportItem> items, boolean replaceFenn) {
        if (items.isEmpty()) return new ImportResult(0);
        if (replaceFenn) {
            String fenn = items.get(0).getFenn();
            String qrup = items.get(0).getQrup();
            repository.deleteAll(repository.findByFennAndQrup(fenn, qrup));
        }
        List<RealMagistrSual> toSave = new ArrayList<>();
        for (ImportItem it : items) {
            if (it.getFenn() == null || it.getSual() == null || it.getVariantlar() == null || it.getDogruCavab() == null) {
                continue;
            }
            RealMagistrSual s = new RealMagistrSual();
            s.setFenn(it.getFenn());
            s.setQrup(it.getQrup() != null ? it.getQrup() : "magistr");
            s.setMovzu(it.getMovzu());
            s.setSual(it.getSual());
            s.setVariantlar(JsonUtil.toJson(it.getVariantlar()));
            s.setDogruCavab(it.getDogruCavab());
            s.setIzah(it.getIzah());
            toSave.add(s);
        }
        repository.saveAll(toSave);
        log.info("RealMagistrSual idxalı: {} sual əlavə edildi", toSave.size());
        return new ImportResult(toSave.size());
    }
}
