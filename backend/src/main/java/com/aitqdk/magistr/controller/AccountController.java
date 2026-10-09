package com.aitqdk.magistr.controller;

import com.aitqdk.magistr.service.AccountService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/account")
@RequiredArgsConstructor
public class AccountController {

    private final AccountService accountService;

    public record ChangePasswordRequest(String sessionId, String oldPassword, String newPassword) {
    }

    @PostMapping("/change-password")
    public Map<String, Object> changePassword(@RequestBody ChangePasswordRequest req) {
        return accountService.changePassword(req.sessionId(), req.oldPassword(), req.newPassword());
    }

    public record DeleteAccountRequest(String sessionId, String password) {
    }

    @PostMapping("/delete")
    public Map<String, Object> deleteAccount(@RequestBody DeleteAccountRequest req) {
        accountService.deleteOwnAccount(req.sessionId(), req.password());
        return Map.of("success", true);
    }
}
