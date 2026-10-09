package com.aitqdk.magistr.repository;

import com.aitqdk.magistr.entity.ChatGroup;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ChatGroupRepository extends JpaRepository<ChatGroup, String> {
    List<ChatGroup> findAllByOrderByCreatedAtDesc();

    boolean existsByYaradiciId(String yaradiciId);
}
