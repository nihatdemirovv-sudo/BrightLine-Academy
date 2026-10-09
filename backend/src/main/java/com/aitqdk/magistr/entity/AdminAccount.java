package com.aitqdk.magistr.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "admin_accounts", uniqueConstraints = {
        @UniqueConstraint(name = "uq_admin_username", columnNames = "username")
})
public class AdminAccount extends BaseEntity {

    @Column(name = "username", nullable = false)
    private String username;

    @Column(name = "password_hash", nullable = false)
    private String passwordHash;

    @Column(name = "session_token")
    private String sessionToken;
}
