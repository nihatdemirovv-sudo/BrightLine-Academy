package com.aitqdk.magistr.controller;

import com.aitqdk.magistr.service.AdminAuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/admin/auth")
@RequiredArgsConstructor
public class AdminAuthController {

    private final AdminAuthService adminAuthService;

    public record CredentialsRequest(String username, String password) {
    }

    public record ChangePasswordRequest(String sessionId, String oldPassword, String newPassword) {
    }

    @PostMapping("/bootstrap")
    public Map<String, Object> bootstrap(@RequestBody CredentialsRequest req) {
        String token = adminAuthService.bootstrap(req.username(), req.password());
        return Map.of("sessionId", token);
    }

    @PostMapping("/login")
    public Map<String, Object> login(@RequestBody CredentialsRequest req) {
        String token = adminAuthService.login(req.username(), req.password());
        return Map.of("sessionId", token);
    }

    @PostMapping("/change-password")
    public Map<String, Object> changePassword(@RequestBody ChangePasswordRequest req) {
        adminAuthService.changePassword(req.sessionId(), req.oldPassword(), req.newPassword());
        return Map.of("success", true);
    }
}
