package com.aitqdk.magistr.entity;

import jakarta.persistence.Id;
import jakarta.persistence.MappedSuperclass;
import jakarta.persistence.PrePersist;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
@MappedSuperclass
public abstract class BaseEntity {

    @Id
    private String id;

    @PrePersist
    public void ensureId() {
        if (id == null || id.isBlank()) {
            id = UUID.randomUUID().toString().replace("-", "");
        }
    }
}
