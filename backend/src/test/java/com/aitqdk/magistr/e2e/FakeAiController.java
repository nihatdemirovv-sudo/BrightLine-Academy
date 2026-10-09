package com.aitqdk.magistr.e2e;

import com.fasterxml.jackson.databind.JsonNode;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Testlər üçün saxta OpenAI-uyğun AI serveri — tətbiqin özü ilə eyni portda işləyir
 * (app.ai.base-url = http://localhost:PORT/fake-ai). Gələn hər sorğunu yadda saxlayır ki, testlər
 * promptun DÜZGÜN qurulduğunu (rol, qaydalar, mövzu bölgüsü) yoxlaya bilsin, və rola görə
 * real AI-yə bənzəyən cavab qaytarır. Sual cavabında LaTeX qəsdən TƏK backslash ilə yazılır —
 * real modelin ən çox etdiyi səhv — ki, JsonUtil-in bərpa məntiqi uçdan-uca yoxlansın.
 */
@RestController
@RequestMapping("/fake-ai")
public class FakeAiController {

  /** Hər çağırış: [0] = system mesajı, [1] = son istifadəçi mesajının mətni. */
  public record Call(String system, String user) {
  }

  public final List<Call> calls = new CopyOnWriteArrayList<>();
  private final AtomicInteger counter = new AtomicInteger();

  private static final Pattern SUAL_SAYI = Pattern.compile("fənnindən (\\d+) ədəd");
  private static final Pattern FENN = Pattern.compile("TAPŞIRIQ: \"([^\"]+)\"");

  @PostMapping("/chat/completions")
  public Map<String, Object> chat(@RequestBody JsonNode body) {
    JsonNode messages = body.path("messages");
    String system = "system".equals(messages.path(0).path("role").asText())
        ? messages.path(0).path("content").asText("") : "";
    String user = textOf(messages.path(messages.size() - 1).path("content"));
    calls.add(new Call(system, user));

    return Map.of("choices", List.of(Map.of(
        "index", 0,
        "finish_reason", "stop",
        "message", Map.of("role", "assistant", "content", respond(system, user)))));
  }

  public List<Call> callsWithSystem(String fragment) {
    return calls.stream().filter(c -> c.system().contains(fragment)).toList();
  }

  private static String textOf(JsonNode content) {
    if (content.isTextual()) {
      return content.asText();
    }
    StringBuilder sb = new StringBuilder();
    content.forEach(part -> sb.append(part.path("text").asText("")));
    return sb.toString();
  }

  private String respond(String system, String user) {
    if (system.contains("test tərtibçisi")) {
      return questions(user);
    }
    if (system.contains("fərdi AI müəllimisən")) {
      return "### Həll\nDiskriminant düsturu: $$D = b^2 - 4ac$$ Burada $a = 1$, $b = -5$, $c = 6$. "
          + "Deməli $D = 1$.\n\n**Cavab: 2 və 3**";
    }
    if (system.contains("təhsil planlayıcısı")) {
      return """
          {"tapşırıqlar": [
            {"fenn": "Riyaziyyat", "movzu": "Kvadrat tənliklər", "sualSayi": 15, "movzuQisa": "Viyet teoremi", "onem": "yuksek"},
            {"fenn": "Fizika", "movzu": "Kinematika", "sualSayi": 10, "movzuQisa": "Bərabərtəcilli hərəkət", "onem": "orta"},
            {"fenn": "Kimya", "movzu": "Məhlullar", "sualSayi": 10, "movzuQisa": "Kütlə payı", "onem": "orta"},
            {"fenn": "Azərbaycan dili", "movzu": "Feil", "sualSayi": 10, "movzuQisa": "Feili sifət", "onem": "asagi"}
          ]}""";
    }
    if (system.contains("xətaların pedaqoji diaqnostikası") || system.contains("səhvlərinin pedaqoji diaqnostikası")) {
      return "hesab";
    }
    return "ok";
  }

  /** İstənilən sayda, hər biri unikal sual — LaTeX qəsdən tək backslash ilə (real model kimi). */
  private String questions(String user) {
    Matcher sm = SUAL_SAYI.matcher(user);
    int say = sm.find() ? Integer.parseInt(sm.group(1)) : 5;
    Matcher fm = FENN.matcher(user);
    String fenn = fm.find() ? fm.group(1) : "Riyaziyyat";

    List<String> items = new ArrayList<>();
    for (int i = 0; i < say; i++) {
      int n = counter.incrementAndGet();
      items.add("""
          {"sual": "Hesablayın: $\\frac{%d}{2} + \\sqrt{4} \\cdot 25\\%%$ (sual %d).",
           "variantlar": {"A": "$%d$", "B": "$%d$", "C": "$%d$", "D": "$%d$", "E": "$%d$"},
           "dogruCavab": "A",
           "izah": "Kəsr: $$\\dfrac{a}{b}$$ Burada $\\theta$ və $x \\neq 0$. Doğru cavab: A.",
           "movzu": "%s — test mövzusu %d",
           "cetinlik": "orta",
           "fenn": "%s",
           "figura": null}"""
          .formatted(n, n, n * 10 + 1, n * 10 + 2, n * 10 + 3, n * 10 + 4, n * 10 + 5, fenn, n, fenn));
    }
    return "```json\n{\"suallar\": [" + String.join(",", items) + "]}\n```";
  }
}
