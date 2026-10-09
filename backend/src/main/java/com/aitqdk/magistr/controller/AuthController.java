package com.aitqdk.magistr.controller;

import com.aitqdk.magistr.dto.LoginRequest;
import com.aitqdk.magistr.dto.RegisterRequest;
import com.aitqdk.magistr.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public Map<String, Object> login(@RequestBody LoginRequest req) {
        return authService.login(req);
    }

    @GetMapping("/teacher-status")
    public Map<String, Object> teacherStatus(@RequestParam String token) {
        return authService.teacherStatus(token);
    }

    @PostMapping("/register")
    public Map<String, Object> register(@RequestBody RegisterRequest req) {
        return authService.register(req);
    }
}
