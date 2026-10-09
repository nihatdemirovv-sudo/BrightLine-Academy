package com.aitqdk.magistr.e2e;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.fail;

import java.io.IOException;
import java.net.ServerSocket;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.MediaType;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

/**
 * Uçdan-uca (E2E) testlərin ortaq bazası: tətbiq real HTTP portunda işə düşür (yaddaşda H2 baza),
 * AI sorğuları isə eyni portdakı saxta AI-yə (FakeAiController) gedir. Bütün test sinifləri eyni
 * Spring kontekstini paylaşır (eyni port/konfiqurasiya) — ona görə hər test unikal istifadəçi adı yaradır.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.DEFINED_PORT)
public abstract class E2eTestBase {

  protected static final int PORT = freePort();
  protected static final String ADMIN_USER = "e2e-admin";
  protected static final String ADMIN_PASS = "e2e-admin-pass";

  @DynamicPropertySource
  static void props(DynamicPropertyRegistry registry) {
    registry.add("server.port", () -> PORT);
    registry.add("app.ai.base-url", () -> "http://localhost:" + PORT + "/fake-ai");
  }

  @Autowired
  protected FakeAiController fakeAi;

  protected final RestClient http = RestClient.create("http://localhost:" + PORT);

  private static int freePort() {
    try (ServerSocket socket = new ServerSocket(0)) {
      return socket.getLocalPort();
    } catch (IOException e) {
      throw new IllegalStateException(e);
    }
  }

  /** Sıralı açar-dəyər xəritəsi — TestIo giriş/çıxış qeydləri üçün: io("a", 1, "b", 2). */
  protected static Map<String, Object> io(Object... kv) {
    Map<String, Object> m = new java.util.LinkedHashMap<>();
    for (int i = 0; i < kv.length; i += 2) {
      m.put((String) kv[i], kv[i + 1]);
    }
    return m;
  }

  protected static String unique(String prefix) {
    return prefix + UUID.randomUUID().toString().replace("-", "").substring(0, 8);
  }

  // ==================== HTTP köməkçiləri ====================

  protected Map<String, Object> post(String path, Object body) {
    return http.post().uri(path).contentType(MediaType.APPLICATION_JSON).body(body)
        .retrieve().body(new ParameterizedTypeReference<>() {
        });
  }

  protected Map<String, Object> adminPost(String path, String adminSession, Object body) {
    return http.post().uri(path).header("X-Admin-Session", adminSession)
        .contentType(MediaType.APPLICATION_JSON).body(body)
        .retrieve().body(new ParameterizedTypeReference<>() {
        });
  }

  protected Map<String, Object> getMap(String path) {
    return http.get().uri(path).retrieve().body(new ParameterizedTypeReference<>() {
    });
  }

  protected List<Map<String, Object>> getList(String path) {
    return http.get().uri(path).retrieve().body(new ParameterizedTypeReference<>() {
    });
  }

  protected Map<String, Object> adminGet(String path, String adminSession) {
    return http.get().uri(path).header("X-Admin-Session", adminSession)
        .retrieve().body(new ParameterizedTypeReference<>() {
        });
  }

  protected Map<String, Object> delete(String path) {
    return http.delete().uri(path).retrieve().body(new ParameterizedTypeReference<>() {
    });
  }

  /** Sorğunun xəta ilə bitdiyini yoxlayır və HTTP statusu + server mesajını qaytarır. */
  protected RestClientResponseException expectError(Runnable call) {
    try {
      call.run();
    } catch (RestClientResponseException e) {
      return e;
    }
    return fail("Sorğu xəta ilə bitməli idi, amma uğurlu oldu");
  }

  /**
   * Real SSE axınına qoşulur, {@code trigger}-i icra edir və adı {@code eventName} olan İLK hadisənin
   * JSON gövdəsini qaytarır — yayımın (bütün abunəçilərə gedən payload-un) nə daşıdığını yoxlamaq üçün.
   */
  @SuppressWarnings("unchecked")
  protected Map<String, Object> firstSseEvent(String path, String eventName, Runnable trigger) throws Exception {
    java.net.http.HttpClient client = java.net.http.HttpClient.newHttpClient();
    java.net.http.HttpRequest req = java.net.http.HttpRequest.newBuilder(
        java.net.URI.create("http://localhost:" + PORT + path)).header("Accept", "text/event-stream").build();
    java.util.concurrent.BlockingQueue<String> data = new java.util.concurrent.LinkedBlockingQueue<>();
    java.util.concurrent.CompletableFuture<?> stream = client.sendAsync(req, java.net.http.HttpResponse.BodyHandlers.ofLines())
        .thenAccept(res -> {
          String[] current = {null};
          res.body().forEach(line -> {
            if (line.startsWith("event:")) current[0] = line.substring(6).trim();
            else if (line.startsWith("data:") && eventName.equals(current[0])) data.add(line.substring(5));
          });
        });
    Thread.sleep(300); // abunəlik qeydə alınsın
    trigger.run();
    String json = data.poll(5, java.util.concurrent.TimeUnit.SECONDS);
    stream.cancel(true);
    assertThat(json).as("SSE hadisəsi '" + eventName + "' gəlmədi").isNotNull();
    return new com.fasterxml.jackson.databind.ObjectMapper().readValue(json, Map.class);
  }

  // ==================== Ssenari köməkçiləri ====================

  /** Admin sessiyası — ilk dəfə bootstrap, sonrakı test siniflərində login (kontekst paylaşılır). */
  protected String adminSession() {
    Map<String, String> creds = Map.of("username", ADMIN_USER, "password", ADMIN_PASS);
    try {
      return (String) post("/api/admin/auth/bootstrap", creds).get("sessionId");
    } catch (RestClientResponseException e) {
      return (String) post("/api/admin/auth/login", creds).get("sessionId");
    }
  }

  protected Map<String, Object> registerStudent(String username, String qrup) {
    Map<String, Object> res = post("/api/auth/register", Map.of(
        "username", username, "password", "1234", "ad", "Test Tələbə " + username,
        "rol", "telebe", "qrup", qrup, "telefon", "0501234567", "dogumTarixi", "2007-05-01"));
    assertThat(res.get("sessionId")).as("tələbə qeydiyyatı sessiya qaytarmalıdır").isNotNull();
    return res;
  }

  protected Map<String, Object> registerTeacher(String username) {
    return post("/api/auth/register", Map.of(
        "username", username, "password", "1234", "ad", "Test Müəllim " + username,
        "rol", "muellim", "email", username + "@test.az", "telefon", "0551234567",
        "dogumTarixi", "1990-01-01", "muellimFenni", "Riyaziyyat",
        "muellimSened", "data:image/png;base64,iVBORw0KGgo="));
  }

  /** Qeydiyyat + admin təsdiqi + login — təsdiqlənmiş müəllimin login cavabı. */
  protected Map<String, Object> approvedTeacher(String username) {
    registerTeacher(username);
    String admin = adminSession();
    String teacherId = pendingTeacherId(admin, username);
    adminPost("/api/admin/teachers/" + teacherId + "/approve", admin, Map.of());
    return post("/api/auth/login", Map.of("username", username, "password", "1234"));
  }

  @SuppressWarnings("unchecked")
  protected String pendingTeacherId(String admin, String username) {
    List<Map<String, Object>> pending =
        (List<Map<String, Object>>) adminGet("/api/admin/notifications", admin).get("pendingTeachers");
    return pending.stream()
        .filter(t -> String.valueOf(t.get("ad")).endsWith(username))
        .map(t -> (String) t.get("id"))
        .findFirst()
        .orElseGet(() -> fail("Gözləyən müəllim siyahısında tapılmadı: " + username));
  }

  @SuppressWarnings("unchecked")
  protected Map<String, Object> unread(String sessionId) {
    return getMap("/api/unread?sessionId=" + sessionId);
  }

  @SuppressWarnings("unchecked")
  protected long sectionTotal(Map<String, Object> unread, String section) {
    return ((Number) ((Map<String, Object>) unread.get(section)).get("total")).longValue();
  }

  protected void markSeen(String sessionId, String key) {
    post("/api/unread/seen", Map.of("sessionId", sessionId, "key", key));
  }
}
