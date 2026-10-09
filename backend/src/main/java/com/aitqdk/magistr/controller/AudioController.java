package com.aitqdk.magistr.controller;

import com.aitqdk.magistr.ai.AudioClient;
import com.aitqdk.magistr.exception.ApiException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import java.util.Base64;
import java.util.Map;

@Slf4j
@RestController
@RequiredArgsConstructor
public class AudioController {

    private final AudioClient audioClient;

    public record TranscribeRequest(String audioBase64) {
    }

    public record TtsRequest(String text, Double speed) {
    }

    @PostMapping("/api/transcribe")
    public Map<String, String> transcribe(@RequestBody TranscribeRequest req) {
        if (req.audioBase64() == null) throw ApiException.badRequest("səs faylı tələb olunur");
        try {
            byte[] audio = Base64.getDecoder().decode(req.audioBase64());
            String text = audioClient.transcribe(audio, "audio.webm");
            return Map.of("text", text);
        } catch (ApiException e) {
            throw e;
        } catch (Exception e) {
            log.error("transcribe error:", e);
            throw ApiException.server("Səs tanıma mümkün olmadı.");
        }
    }

    @PostMapping("/api/tts")
    public ResponseEntity<byte[]> tts(@RequestBody TtsRequest req) {
        if (req.text() == null || req.text().isBlank()) {
            throw ApiException.badRequest("Mətn tələb olunur");
        }
        try {
            String text = req.text().length() > 1000 ? req.text().substring(0, 1000) : req.text();
            byte[] audio = audioClient.synthesizeSpeech(text, req.speed() != null ? req.speed() : 1.0);
            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType("audio/wav"))
                    .header(HttpHeaders.CACHE_CONTROL, "no-cache")
                    .body(audio);
        } catch (Exception e) {
            log.error("TTS error:", e);
            throw ApiException.server("Səs yaradıla bilmədi. Yenidən cəhd edin.");
        }
    }
}
