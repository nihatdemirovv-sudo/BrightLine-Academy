package com.aitqdk.magistr.repository;

import com.aitqdk.magistr.entity.RealMagistrSual;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RealMagistrSualRepository extends JpaRepository<RealMagistrSual, String> {
    List<RealMagistrSual> findByFennAndQrup(String fenn, String qrup);
}
