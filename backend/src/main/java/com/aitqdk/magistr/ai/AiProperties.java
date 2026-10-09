package com.aitqdk.magistr.ai;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "app.ai")
public class AiProperties {
    private String baseUrl;
    /** Audio (ASR/TTS) üçün baza URL — çoxu OpenAI-uyğun provayder yalnız chat/vision dəstəkləyir,
     * bu səbəbdən audio üçün ayrıca provayder göstərmək lazım ola bilər. Boşdursa baseUrl istifadə olunur. */
    private String audioBaseUrl;
    private String apiKey;
    /** Boşdursa apiKey istifadə olunur. */
    private String audioApiKey;
    private String chatModel;
    private String transcriptionModel;
    private String ttsModel;
    private String ttsVoice;
    private int maxRetries = 4;
    /** Yalnız reasoning modelləri (məs. Groq-un "openai/gpt-oss-*") dəstəkləyir: "low"/"medium"/"high".
     * Boşdursa sorğuya əlavə edilmir (digər provayderlərə təsir etmir). */
    private String reasoningEffort;
    /** Cavabın maksimal token sayı — bəzi provayderlər (məs. Groq-un pulsuz tier-i) bunu boş
     * qoyanda çox kiçik defolt tətbiq edir (kəsilmiş/boş JSON cavab riski). 0-dırsa əlavə edilmir. */
    private int maxTokens;

    public String effectiveAudioBaseUrl() {
        return (audioBaseUrl != null && !audioBaseUrl.isBlank()) ? audioBaseUrl : baseUrl;
    }

    public String effectiveAudioApiKey() {
        return (audioApiKey != null && !audioApiKey.isBlank()) ? audioApiKey : apiKey;
    }
}
