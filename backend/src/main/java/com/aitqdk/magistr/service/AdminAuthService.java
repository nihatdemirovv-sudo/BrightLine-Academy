package com.aitqdk.magistr.service;

import com.aitqdk.magistr.entity.AdminAccount;
import com.aitqdk.magistr.exception.ApiException;
import com.aitqdk.magistr.repository.AdminAccountRepository;
import lombok.RequiredArgsConstructor;
import org.mindrot.jbcrypt.BCrypt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AdminAuthService {

    private final AdminAccountRepository adminAccountRepository;

    /**
     * İlk admin hesabını yaradır. Yalnız cədvəl BOŞ olanda işləyir (tək-dəfəlik quraşdırma) —
     * ona görə username/parol heç vaxt kodda saxlanmır, bazadan gəlir.
     */
    @Transactional
    public String bootstrap(String username, String password) {
        if (adminAccountRepository.count() > 0) {
            throw ApiException.conflict("Admin hesabı artıq mövcuddur.");
        }
        validateCredentials(username, password);

        AdminAccount account = new AdminAccount();
        account.setUsername(username.trim().toLowerCase());
        account.setPasswordHash(BCrypt.hashpw(password, BCrypt.gensalt(10)));
        account.setSessionToken(newToken());
        account = adminAccountRepository.save(account);
        return account.getSessionToken();
    }

    @Transactional
    public String login(String username, String password) {
        if (username == null || password == null) {
            throw ApiException.badRequest("İstifadəçi adı və şifrə tələb olunur.");
        }
        AdminAccount account = adminAccountRepository.findByUsername(username.trim().toLowerCase()).orElse(null);
        if (account == null || !BCrypt.checkpw(password, account.getPasswordHash())) {
            throw ApiException.unauthorized("İstifadəçi adı və ya şifrə yanlışdır.");
        }
        account.setSessionToken(newToken());
        adminAccountRepository.save(account);
        return account.getSessionToken();
    }

    public boolean isValidSession(String token) {
        if (token == null || token.isBlank()) {
            return false;
        }
        return adminAccountRepository.findBySessionToken(token).isPresent();
    }

    @Transactional
    public void changePassword(String sessionToken, String oldPassword, String newPassword) {
        AdminAccount account = adminAccountRepository.findBySessionToken(sessionToken)
                .orElseThrow(() -> ApiException.unauthorized("Sessiya etibarsızdır."));
        if (oldPassword == null || !BCrypt.checkpw(oldPassword, account.getPasswordHash())) {
            throw ApiException.unauthorized("Köhnə şifrə yanlışdır.");
        }
        if (newPassword == null || newPassword.length() < 4) {
            throw ApiException.badRequest("Yeni şifrə ən azı 4 simvol olmalıdır.");
        }
        account.setPasswordHash(BCrypt.hashpw(newPassword, BCrypt.gensalt(10)));
        adminAccountRepository.save(account);
    }

    private void validateCredentials(String username, String password) {
        if (username == null || username.trim().length() < 3) {
            throw ApiException.badRequest("İstifadəçi adı ən azı 3 simvol olmalıdır.");
        }
        if (password == null || password.length() < 4) {
            throw ApiException.badRequest("Şifrə ən azı 4 simvol olmalıdır.");
        }
    }

    private String newToken() {
        return "admsess_" + UUID.randomUUID().toString().replace("-", "");
    }
}
