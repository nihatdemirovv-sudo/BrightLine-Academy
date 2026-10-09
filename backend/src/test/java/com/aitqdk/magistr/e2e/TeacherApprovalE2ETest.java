package com.aitqdk.magistr.e2e;

import static org.assertj.core.api.Assertions.assertThat;

import com.aitqdk.magistr.testsupport.TestIo;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.web.client.RestClientResponseException;

/** Müəllim qeydiyyatı → admin bildirişi → təsdiq/rədd → müəllimin canlı status izləməsi. */
class TeacherApprovalE2ETest extends E2eTestBase {

  @Test
  @DisplayName("Müəllim qeydiyyatı: gözləmə tokeni, admin bildirişi, təsdiq və giriş")
  void teacherApprovalFlow() {
    String username = unique("muel");
    Map<String, Object> reg = registerTeacher(username);
    assertThat(reg.get("pending")).isEqualTo(true);
    String token = (String) reg.get("statusToken");
    assertThat(token).startsWith("mst_");

    assertThat(getMap("/api/auth/teacher-status?token=" + token).get("status")).isEqualTo("GOZLEYIR");

    // Təsdiqlənməmiş müəllimin girişi xəta yox, eyni tokenli "gözləmə" cavabıdır.
    Map<String, Object> pendingLogin = post("/api/auth/login", Map.of("username", username, "password", "1234"));
    assertThat(pendingLogin.get("pending")).isEqualTo(true);
    assertThat(pendingLogin.get("statusToken")).isEqualTo(token);
    assertThat(pendingLogin).doesNotContainKey("sessionId");

    // Admin paneli yeni sorğunu bildirişlərdə görür; admin girişi olmadan bildiriş bağlıdır.
    String admin = adminSession();
    String teacherId = pendingTeacherId(admin, username);
    RestClientResponseException noAuth = expectError(() -> getMap("/api/admin/notifications"));
    assertThat(noAuth.getStatusCode().value()).isEqualTo(401);

    adminPost("/api/admin/teachers/" + teacherId + "/approve", admin, Map.of());
    assertThat(getMap("/api/auth/teacher-status?token=" + token).get("status")).isEqualTo("TESDIQLENIB");

    Map<String, Object> login = post("/api/auth/login", Map.of("username", username, "password", "1234"));
    assertThat(login.get("sessionId")).isNotNull();
    assertThat(login.get("rol")).isEqualTo("muellim");
    // Status tokeni heç bir profil cavabında sızmamalıdır.
    assertThat(login).doesNotContainKey("muellimStatusToken");

    TestIo.record("Müəllim qeydiyyatı → admin təsdiqi → canlı status",
        io("1. qeydiyyat", "POST /api/auth/register {rol: muellim, username: " + username + ", fənn: Riyaziyyat, sənəd şəkli}",
            "2. status sorğusu", "GET /api/auth/teacher-status?token=<token>",
            "3. təsdiqdən əvvəl giriş", "POST /api/auth/login",
            "4. admin", "GET /api/admin/notifications → POST /api/admin/teachers/{id}/approve",
            "5. təsdiqdən sonra", "status sorğusu + giriş"),
        io("qeydiyyat cavabı", reg,
            "status (təsdiqdən əvvəl)", "GOZLEYIR",
            "giriş (təsdiqdən əvvəl)", pendingLogin,
            "admin bildirişləri girişsiz", noAuth.getStatusCode().value(),
            "status (təsdiqdən sonra)", "TESDIQLENIB",
            "giriş (təsdiqdən sonra)", io("sessionId", "<verildi>", "rol", login.get("rol"), "ad", login.get("ad"))),
        "müəllim təsdiqə qədər daxil ola bilmir, gözləmə ekranı tokenlə statusu izləyir, admin yeni sorğunu görür, təsdiqdən sonra status dərhal dəyişir və giriş açılır");
  }

  @Test
  @DisplayName("Rədd edilmiş müəllim: status RED, giriş bağlı")
  void rejectedTeacher() {
    String username = unique("redd");
    String token = (String) registerTeacher(username).get("statusToken");
    String admin = adminSession();
    adminPost("/api/admin/teachers/" + pendingTeacherId(admin, username) + "/reject", admin, Map.of());

    assertThat(getMap("/api/auth/teacher-status?token=" + token).get("status")).isEqualTo("RED");
    RestClientResponseException e = expectError(
        () -> post("/api/auth/login", Map.of("username", username, "password", "1234")));
    assertThat(e.getStatusCode().value()).isEqualTo(401);
    assertThat(e.getResponseBodyAsString()).contains("təsdiqlənməyib");

    TestIo.record("Rədd edilmiş müəllim",
        io("addımlar", List.of("POST /api/auth/register {rol: muellim}", "POST /api/admin/teachers/{id}/reject",
            "GET /api/auth/teacher-status", "POST /api/auth/login")),
        io("status", "RED", "giriş cavabı", io("HTTP", e.getStatusCode().value(), "body", e.getResponseBodyAsString())),
        "rədd ediləndən sonra status RED olur və giriş 401 ilə bağlıdır");
  }

  @Test
  @DisplayName("Naməlum status tokeni 404 qaytarır")
  void unknownToken() {
    RestClientResponseException e = expectError(() -> getMap("/api/auth/teacher-status?token=mst_yoxdur"));
    assertThat(e.getStatusCode().value()).isEqualTo(404);
  }
}
