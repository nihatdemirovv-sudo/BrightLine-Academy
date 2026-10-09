package com.aitqdk.magistr.repository;

import com.aitqdk.magistr.entity.Student;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface StudentRepository extends JpaRepository<Student, String> {
    Optional<Student> findBySessionId(String sessionId);
    Optional<Student> findByUsername(String username);
    boolean existsByUsername(String username);

    Page<Student> findByAdContainingIgnoreCaseOrUsernameContainingIgnoreCase(
            String ad, String username, Pageable pageable);

    // Admin "Tələbələr" tab — müəllimləri (rol='muellim') çıxarır, yalnız əsl tələbələr
    @Query("select s from Student s where s.rol is null or s.rol <> 'muellim'")
    Page<Student> findStudentsForAdmin(Pageable pageable);

    @Query("select s from Student s where (s.rol is null or s.rol <> 'muellim') and " +
            "(lower(s.ad) like lower(concat('%', :q, '%')) or lower(s.username) like lower(concat('%', :q, '%')))")
    Page<Student> searchStudentsForAdmin(@Param("q") String q, Pageable pageable);

    java.util.List<Student> findByRol(String rol);

    java.util.List<Student> findByRolAndMuellimStatus(String rol, String muellimStatus);

    java.util.Optional<Student> findByMuellimStatusToken(String muellimStatusToken);
}
