package com.aitqdk.magistr.repository;

import com.aitqdk.magistr.entity.AdminAccount;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface AdminAccountRepository extends JpaRepository<AdminAccount, String> {
    Optional<AdminAccount> findByUsername(String username);
    Optional<AdminAccount> findBySessionToken(String sessionToken);
}
