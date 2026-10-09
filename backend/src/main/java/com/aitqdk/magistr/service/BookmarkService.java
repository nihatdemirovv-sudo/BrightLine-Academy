package com.aitqdk.magistr.service;

import com.aitqdk.magistr.entity.Bookmark;
import com.aitqdk.magistr.entity.Student;
import com.aitqdk.magistr.exception.ApiException;
import com.aitqdk.magistr.repository.BookmarkRepository;
import com.aitqdk.magistr.util.JsonUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class BookmarkService {

    private final StudentService studentService;
    private final BookmarkRepository bookmarkRepository;

    public record BookmarkRequest(String sessionId, String fenn, String sual, Map<String, String> variantlar,
                                   String dogruCavab, String izah, String movzu, String sehvCavab) {
    }

    @Transactional
    public List<Map<String, Object>> list(String sessionId) {
        Student student = studentService.findBySessionIdOrThrow(sessionId);
        return bookmarkRepository.findByStudentIdOrderByCreatedAtDesc(student.getId()).stream()
                .map(this::toMap).toList();
    }

    @Transactional
    public Map<String, Object> create(BookmarkRequest req) {
        if (req.sessionId() == null || req.fenn() == null || req.sual() == null
                || req.variantlar() == null || req.dogruCavab() == null) {
            throw ApiException.badRequest("parametrlər çatışmır");
        }
        Student student = studentService.findBySessionIdOrThrow(req.sessionId());

        Bookmark b = new Bookmark();
        b.setStudentId(student.getId());
        b.setFenn(req.fenn());
        b.setSual(req.sual());
        b.setVariantlar(JsonUtil.toJson(req.variantlar()));
        b.setDogruCavab(req.dogruCavab());
        b.setIzah(req.izah() != null ? req.izah() : "");
        b.setMovzu(req.movzu());
        b.setSehvCavab(req.sehvCavab() != null ? req.sehvCavab() : "");
        b = bookmarkRepository.save(b);
        return toMap(b);
    }

    public record PatchRequest(String bookmarkId, Boolean tekrarEdildi) {
    }

    @Transactional
    public Bookmark patch(PatchRequest req) {
        if (req.bookmarkId() == null) throw ApiException.badRequest("bookmarkId tələb olunur");
        Bookmark b = bookmarkRepository.findById(req.bookmarkId()).orElseThrow(() -> ApiException.notFound("Tapılmadı"));
        b.setTekrarEdildi(req.tekrarEdildi() != null ? req.tekrarEdildi() : true);
        return bookmarkRepository.save(b);
    }

    @Transactional
    public void delete(String id) {
        if (id == null) throw ApiException.badRequest("id tələb olunur");
        bookmarkRepository.deleteById(id);
    }

    private Map<String, Object> toMap(Bookmark b) {
        Map<String, Object> m = JsonUtil.asMap(b);
        m.put("variantlar", JsonUtil.fromJson(b.getVariantlar(), Map.class));
        return m;
    }
}
