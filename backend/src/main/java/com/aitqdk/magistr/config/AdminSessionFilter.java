package com.aitqdk.magistr.config;

import com.aitqdk.magistr.service.AdminAuthService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * /api/admin/** altındakı bütün endpoint-ləri qoruyur — yalnız /api/admin/auth/**
 * (login/bootstrap) sərbəstdir. Admin username/parolu artıq kodda deyil, bazadadır
 * (AdminAccount), ona görə bu filter hər sorğuda X-Admin-Session başlığını bazaya
 * qarşı yoxlayır.
 */
@Component
@RequiredArgsConstructor
public class AdminSessionFilter extends OncePerRequestFilter {

    private final AdminAuthService adminAuthService;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        String path = request.getRequestURI();
        boolean isAdminRoute = path.startsWith("/api/admin/");
        boolean isAuthRoute = path.startsWith("/api/admin/auth/");
        boolean isPreflight = "OPTIONS".equalsIgnoreCase(request.getMethod());

        if (!isAdminRoute || isAuthRoute || isPreflight) {
            chain.doFilter(request, response);
            return;
        }

        String token = request.getHeader("X-Admin-Session");
        if (!adminAuthService.isValidSession(token)) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType("application/json;charset=UTF-8");
            response.getWriter().write("{\"error\":\"Giriş tələb olunur.\"}");
            return;
        }

        chain.doFilter(request, response);
    }
}
