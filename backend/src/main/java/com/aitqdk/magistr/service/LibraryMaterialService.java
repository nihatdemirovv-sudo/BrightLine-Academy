package com.aitqdk.magistr.service;

import com.aitqdk.magistr.entity.LibraryMaterial;
import com.aitqdk.magistr.exception.ApiException;
import com.aitqdk.magistr.repository.LibraryMaterialRepository;
import com.aitqdk.magistr.util.UploadLimits;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * "Dərs Materialları" → PDF materiallar. Admin əlavə/silir, tələbələr read-only oxuyur/yükləyir.
 * Siyahı sorğusu METADATA-nı qaytarır (base64 `data` YOX) — bir neçə böyük PDF olarsa siyahı
 * yükünü şişirtməmək üçün; faktiki fayl yalnız {@link #getOne(String)} ilə tələb olunanda gəlir.
 */
@Service
@RequiredArgsConstructor
public class LibraryMaterialService {

    private final LibraryMaterialRepository repository;

    @Transactional(readOnly = true)
    public List<Map<String, Object>> listMeta() {
        return repository.findAllByOrderByCreatedAtDesc().stream().map(this::toMeta).toList();
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getOne(String id) {
        LibraryMaterial m = repository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Material tapılmadı."));
        Map<String, Object> out = toMeta(m);
        out.put("data", m.getData());
        return out;
    }

    @Transactional
    public Map<String, Object> add(String ad, String tesvir, String fenn, String tip, String data) {
        if (ad == null || ad.isBlank()) throw ApiException.badRequest("Material adı boş ola bilməz.");
        if (data == null || data.isBlank() || !data.startsWith("data:")) {
            throw ApiException.badRequest("Fayl məlumatı yanlışdır.");
        }
        UploadLimits.check(data);

        LibraryMaterial m = new LibraryMaterial();
        m.setAd(ad.trim());
        m.setTesvir(tesvir != null && !tesvir.isBlank() ? tesvir.trim() : null);
        m.setFenn(fenn != null && !fenn.isBlank() ? fenn.trim() : null);
        m.setTip(tip != null && !tip.isBlank() ? tip.trim() : "pdf");
        m.setData(data);
        m.setOlcu(estimateBytes(data));
        repository.save(m);
        return toMeta(m);
    }

    @Transactional
    public void delete(String id) {
        if (!repository.existsById(id)) {
            throw ApiException.notFound("Material tapılmadı.");
        }
        repository.deleteById(id);
    }

    private Map<String, Object> toMeta(LibraryMaterial m) {
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("id", m.getId());
        out.put("ad", m.getAd());
        out.put("tesvir", m.getTesvir());
        out.put("fenn", m.getFenn());
        out.put("tip", m.getTip());
        out.put("olcu", m.getOlcu());
        out.put("createdAt", m.getCreatedAt());
        return out;
    }

    private long estimateBytes(String dataUri) {
        int comma = dataUri.indexOf(',');
        String b64 = comma >= 0 ? dataUri.substring(comma + 1) : dataUri;
        long padding = b64.endsWith("==") ? 2 : b64.endsWith("=") ? 1 : 0;
        return (long) (b64.length() * 3L) / 4L - padding;
    }
}
