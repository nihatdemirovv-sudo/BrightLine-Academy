package com.aitqdk.magistr.controller;

import com.aitqdk.magistr.entity.Bookmark;
import com.aitqdk.magistr.service.BookmarkService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/bookmarks")
@RequiredArgsConstructor
public class BookmarkController {

    private final BookmarkService bookmarkService;

    @GetMapping
    public List<Map<String, Object>> list(@RequestParam String sessionId) {
        return bookmarkService.list(sessionId);
    }

    @PostMapping
    public Map<String, Object> create(@RequestBody BookmarkService.BookmarkRequest req) {
        return bookmarkService.create(req);
    }

    @PatchMapping
    public Bookmark patch(@RequestBody BookmarkService.PatchRequest req) {
        return bookmarkService.patch(req);
    }

    @DeleteMapping
    public Map<String, Boolean> delete(@RequestParam String id) {
        bookmarkService.delete(id);
        return Map.of("success", true);
    }
}
