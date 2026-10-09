package com.aitqdk.magistr.service;

import com.aitqdk.magistr.exception.ApiException;
import com.aitqdk.magistr.util.JsonUtil;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;

/** ytdlp.ts qarşılığı — yt-dlp CLI-ı ProcessBuilder ilə (shell yoxdur — injection təhlükəsizdir) icra edir. */
@Slf4j
@Service
public class YtDlpService {

    private final String bin;

    public YtDlpService(@Value("${app.ytdlp.bin}") String bin) {
        this.bin = bin;
    }

    public record SearchResult(String id, String title, String channel, String thumbnail, long duration, String url) {
    }

    public List<Map<String, Object>> search(String query, int maxResults) {
        String target = "ytsearch" + maxResults + ":" + query.trim();
        List<String> args = List.of(bin, "-J", "--flat-playlist", "--no-warnings", "--no-check-certificate", target);

        String stdout;
        try {
            Process process = new ProcessBuilder(args).redirectErrorStream(true).start();
            String out = readStream(process.getInputStream());
            boolean finished = process.waitFor(60, TimeUnit.SECONDS);
            if (!finished) {
                process.destroyForcibly();
                throw ApiException.server("yt-dlp vaxt aşımına uğradı (timeout).");
            }
            if (process.exitValue() != 0 || out.isBlank() || !out.trim().startsWith("{")) {
                String errLine = out.lines().filter(l -> l.contains("ERROR")).findFirst().orElse("");
                throw ApiException.server("Axtarış nəticəsi alına bilmədi. " + errLine);
            }
            stdout = out;
        } catch (IOException e) {
            if (e.getMessage() != null && e.getMessage().toLowerCase().contains("cannot run program")) {
                throw ApiException.server("yt-dlp tapılmadı. Zəhmət olmasa quraşdırın: pip install yt-dlp (və PATH-də olduğundan əmin olun).");
            }
            throw ApiException.server("yt-dlp işə salına bilmədi: " + e.getMessage());
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw ApiException.server("yt-dlp işə salına bilmədi.");
        }

        Map<String, Object> parsed = JsonUtil.fromJson(stdout, Map.class);
        if (parsed == null) return List.of();
        if ("playlist".equals(parsed.get("_type")) && parsed.get("entries") instanceof List<?> entries) {
            return entries.stream()
                    .filter(e -> e instanceof Map)
                    .map(e -> (Map<String, Object>) e)
                    .toList();
        }
        return List.of(parsed);
    }

    private String readStream(java.io.InputStream in) throws IOException {
        StringBuilder sb = new StringBuilder();
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(in, StandardCharsets.UTF_8))) {
            String line;
            while ((line = reader.readLine()) != null) sb.append(line).append('\n');
        }
        return sb.toString();
    }
}
