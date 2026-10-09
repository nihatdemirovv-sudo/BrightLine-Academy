package com.aitqdk.magistr.repository;

import com.aitqdk.magistr.entity.UniversityCutoff;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface UniversityCutoffRepository extends JpaRepository<UniversityCutoff, String> {
    List<UniversityCutoff> findByQrup(String qrup);
}
