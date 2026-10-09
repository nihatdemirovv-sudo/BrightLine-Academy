package com.aitqdk.magistr.repository;

import com.aitqdk.magistr.entity.LibraryMaterial;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface LibraryMaterialRepository extends JpaRepository<LibraryMaterial, String> {
    List<LibraryMaterial> findAllByOrderByCreatedAtDesc();
}
