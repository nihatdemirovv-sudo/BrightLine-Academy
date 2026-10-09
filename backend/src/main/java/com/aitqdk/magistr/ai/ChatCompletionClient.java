package com.aitqdk.magistr.ai;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClientResponseException;

import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * OpenAI-uyğun (/chat/completions) sorğuları edən aşağı-səviyyəli klient.
 * ai.ts-dəki callGemini() ilə eyni retry/backoff məntiqini saxlayır.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class ChatCompletionClient {

    private static final Pattern RETRY_DELAY = Pattern.compile("\"retryDelay\":\\s*\"(\\d+)s\"");

    private final AiProperties props;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final RestClient restClient = RestClient.create();

    public boolean isConfigured() {
        return props.getApiKey() != null && !props.getApiKey().isBlank();
    }

    /** messages: List of Map (role/content) — content ya String, ya da List (mətn+şəkil) ola bilər. */
    public String chat(List<Map<String, Object>> messages) {
        return chat(messages, null);
    }

    /** maxTokens null/değil 0-dırsa konfiqurasiyadakı app.ai.max-tokens istifadə olunur.
     * Kiçik cavablı çağırışlarda (məs. qısa JSON seçimləri) aşkar kiçik dəyər ötürülməli —
     * Groq-un pulsuz tier TPM limiti prompt+max_tokens CƏMİNƏ tətbiq olunur. */
    public String chat(List<Map<String, Object>> messages, Integer maxTokens) {
        return chat(messages, maxTokens, false);
    }

    /** jsonMode — provayderdən ETİBARLI JSON tələb edir (OpenAI-uyğun response_format: json_object;
     * Gemini dəstəkləyir). Sual generasiyası kimi yalnız JSON gözlənilən çağırışlar üçün. */
    public String chat(List<Map<String, Object>> messages, Integer maxTokens, boolean jsonMode) {
        if (!isConfigured()) {
            log.warn("AI konfiqurasiya olunmayıb (app.ai.api-key boşdur)");
            return "";
        }

        ObjectNode body = objectMapper.createObjectNode();
        body.put("model", props.getChatModel());
        body.set("messages", objectMapper.valueToTree(messages));
        // Groq-un "gpt-oss" reasoning modelləri bu parametrlə daha dərin düşünür (Gemini/başqa
        // provayderlərdə sadəcə ignore olunur) — boşdursa əlavə edilmir.
        if (props.getReasoningEffort() != null && !props.getReasoningEffort().isBlank()) {
            body.put("reasoning_effort", props.getReasoningEffort());
        }
        int effektivMaxTokens = maxTokens != null && maxTokens > 0 ? maxTokens : props.getMaxTokens();
        if (effektivMaxTokens > 0) {
            body.put("max_tokens", effektivMaxTokens);
        }
        if (jsonMode) {
            body.putObject("response_format").put("type", "json_object");
        }

        String content = requestWithRetry(props.getBaseUrl() + "/chat/completions", body);
        JsonNode root;
        try {
            root = objectMapper.readTree(content);
        } catch (Exception e) {
            log.error("AI cavabı parse edilə bilmədi", e);
            return "";
        }
        JsonNode choices = root.path("choices");
        if (choices.isArray() && !choices.isEmpty()) {
            // "length" — cavab max_tokens-də kəsilib (Gemini-də düşünmə tokenləri də bu limitə daxildir);
            // JSON cavab bu halda yarımçıq qalır və parse olunmur.
            if ("length".equals(choices.get(0).path("finish_reason").asText())) {
                log.warn("AI cavabı max_tokens ({}) limitində kəsildi.", effektivMaxTokens);
            }
            return choices.get(0).path("message").path("content").asText("");
        }
        return "";
    }

    private String requestWithRetry(String url, ObjectNode body) {
        int maxRetries = props.getMaxRetries();
        for (int attempt = 0; ; attempt++) {
            try {
                return restClient.post()
                        .uri(url)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + props.getApiKey())
                        .contentType(MediaType.APPLICATION_JSON)
                        .body(body)
                        .retrieve()
                        .body(String.class);
            } catch (RestClientResponseException e) {
                int status = e.getStatusCode().value();
                String errText = e.getResponseBodyAsString();
                if (status == 429 && errText.contains("PerDay")) {
                    log.warn("AI günlük kvota bitib — retry edilmir (kvota sabaha qədər bərpa olunmayacaq).");
                    throw new RuntimeException("AI günlük sorğu limiti bitib. Sabah yenidən cəhd edin və ya başqa API açarı istifadə edin.", e);
                }
                if ((status == 429 || status == 503) && attempt < maxRetries) {
                    long waitSec = 10L * (attempt + 1);
                    Matcher m = RETRY_DELAY.matcher(errText);
                    if (m.find()) {
                        waitSec = Long.parseLong(m.group(1)) + 1;
                    }
                    log.warn("AI {} xətası — {}s gözlənilir (cəhd {}/{})...", status, waitSec, attempt + 1, maxRetries);
                    sleep(waitSec * 1000);
                    continue;
                }
                throw new RuntimeException("AI API xətası: " + status + " " + errText, e);
            } catch (ResourceAccessException e) {
                // Şəbəkə səviyyəsində qırılma ("Connection reset", timeout) — keçici olur, təkrar cəhd et.
                if (attempt < maxRetries) {
                    long waitSec = 2L * (attempt + 1);
                    log.warn("AI bağlantı xətası ({}) — {}s sonra təkrar (cəhd {}/{})...", e.getMessage(), waitSec, attempt + 1, maxRetries);
                    sleep(waitSec * 1000);
                    continue;
                }
                throw e;
            }
        }
    }

    private void sleep(long ms) {
        try {
            Thread.sleep(ms);
        } catch (InterruptedException ie) {
            Thread.currentThread().interrupt();
        }
    }
}
