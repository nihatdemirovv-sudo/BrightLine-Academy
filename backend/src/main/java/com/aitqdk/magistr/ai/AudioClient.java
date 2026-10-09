package com.aitqdk.magistr.ai;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;

/** OpenAI-uyğun /audio/transcriptions (ASR) və /audio/speech (TTS) klienti. */
@Slf4j
@Component
@RequiredArgsConstructor
public class AudioClient {

    private final AiProperties props;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final RestClient restClient = RestClient.create();

    public String transcribe(byte[] audioBytes, String filename) {
        if (props.effectiveAudioApiKey() == null || props.effectiveAudioApiKey().isBlank()) {
            log.warn("Audio AI konfiqurasiya olunmayıb");
            return "";
        }
        MultiValueMap<String, Object> form = new LinkedMultiValueMap<>();
        form.add("file", new ByteArrayResource(audioBytes) {
            @Override
            public String getFilename() {
                return filename != null ? filename : "audio.webm";
            }
        });
        form.add("model", props.getTranscriptionModel());

        String response = restClient.post()
                .uri(props.effectiveAudioBaseUrl() + "/audio/transcriptions")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + props.effectiveAudioApiKey())
                .contentType(MediaType.MULTIPART_FORM_DATA)
                .body(form)
                .retrieve()
                .body(String.class);

        try {
            JsonNode root = objectMapper.readTree(response);
            return root.path("text").asText("");
        } catch (Exception e) {
            log.error("ASR cavabı parse edilə bilmədi", e);
            return "";
        }
    }

    public byte[] synthesizeSpeech(String text, double speed) {
        if (props.effectiveAudioApiKey() == null || props.effectiveAudioApiKey().isBlank()) {
            throw new IllegalStateException("Audio AI konfiqurasiya olunmayıb");
        }
        var body = new java.util.HashMap<String, Object>();
        body.put("model", props.getTtsModel());
        body.put("voice", props.getTtsVoice());
        body.put("input", text);
        body.put("speed", speed);
        body.put("response_format", "wav");

        return restClient.post()
                .uri(props.effectiveAudioBaseUrl() + "/audio/speech")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + props.effectiveAudioApiKey())
                .contentType(MediaType.APPLICATION_JSON)
                .body(body)
                .retrieve()
                .body(byte[].class);
    }
}
