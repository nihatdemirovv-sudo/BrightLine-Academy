package com.aitqdk.magistr.controller;

import com.aitqdk.magistr.service.LibraryMaterialService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

/**
 * Tələbə tərəfi — "Dərs Materialları" bölməsindəki PDF materiallar (READ-ONLY).
 * Əlavə/silmə YALNIZ admin panelindədir (bax AdminController /api/admin/materials).
 */
@RestController
@RequestMapping("/api/materials/library")
@RequiredArgsConstructor
public class LibraryMaterialController {

    private final LibraryMaterialService libraryMaterialService;

    @GetMapping
    public List<Map<String, Object>> list() {
        return libraryMaterialService.listMeta();
    }

    @GetMapping("/{id}")
    public Map<String, Object> get(@PathVariable String id) {
        return libraryMaterialService.getOne(id);
    }
}
