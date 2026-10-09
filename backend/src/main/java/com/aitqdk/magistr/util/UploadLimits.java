package com.aitqdk.magistr.util;

import com.aitqdk.magistr.exception.ApiException;

/**
 * Yüklənən faylların (base64 data-URI) ölçü hədləri — server az RAM-lıdır (-Xmx320m),
 * böyük base64 sətirlər OutOfMemory ilə prosesi çökdürə bilər. Klient tərəf şəkilləri
 * onsuz da sıxır (bax src/lib/media.ts), bu isə son müdafiə xəttidir.
 */
public final class UploadLimits {

    // PDF həddi istifadəçinin tələbi ilə 250 MB-dır (daha güclü serverə keçid planlaşdırılır).
    // DİQQƏT: cari test serveri -Xmx320m ilə işləyir — bu ölçüdə fayl OutOfMemory verə bilər.
    // Server böyüdüləndə `-Xmx` artırılmalı (və istənilsə PDF diskdə saxlanmalı).
    /** PDF üçün maksimum (təxmini) fayl ölçüsü. */
    public static final long PDF_MAX_BYTES = 250L * 1024 * 1024;
    /** Şəkil əlavələri üçün maksimum (klientdə sıxıldıqdan sonra bundan çox olmamalıdır). */
    public static final long IMAGE_MAX_BYTES = 10L * 1024 * 1024;
    /** Ümumi son hədd (tip məlum olmayanda). */
    public static final long GENERIC_MAX_BYTES = 250L * 1024 * 1024;

    public static final String PDF_TOO_BIG =
            "PDF yaddaşı çox böyük olduğu üçün yüklənə bilmədi (maksimum 250 MB).";
    public static final String FILE_TOO_BIG =
            "Fayl çox böyük olduğu üçün yüklənə bilmədi (maksimum 250 MB).";
    public static final String IMAGE_TOO_BIG =
            "Şəkil çox böyükdür — daha kiçik ölçüdə yükləyin.";

    private UploadLimits() {
    }

    /** data-URI (məs. "data:application/pdf;base64,...") üçün — tipə görə uyğun hədd. */
    public static void check(String dataUri) {
        if (dataUri == null || dataUri.isBlank()) return;
        long bytes = approxBytes(dataUri);
        if (isPdf(dataUri)) {
            if (bytes > PDF_MAX_BYTES) throw ApiException.badRequest(PDF_TOO_BIG);
        } else if (isImage(dataUri)) {
            if (bytes > IMAGE_MAX_BYTES) throw ApiException.badRequest(IMAGE_TOO_BIG);
        } else if (bytes > GENERIC_MAX_BYTES) {
            throw ApiException.badRequest(FILE_TOO_BIG);
        }
    }

    /** Xam base64 + mimeType (data-URI prefiksi olmayan hallar üçün — məs. DocumentParse). */
    public static void checkRaw(String base64, String mimeType) {
        if (base64 == null || base64.isBlank()) return;
        long bytes = base64Bytes(base64);
        boolean pdf = mimeType != null && mimeType.toLowerCase().contains("pdf");
        boolean image = mimeType != null && mimeType.toLowerCase().startsWith("image/");
        if (pdf) {
            if (bytes > PDF_MAX_BYTES) throw ApiException.badRequest(PDF_TOO_BIG);
        } else if (image) {
            if (bytes > IMAGE_MAX_BYTES) throw ApiException.badRequest(IMAGE_TOO_BIG);
        } else if (bytes > GENERIC_MAX_BYTES) {
            throw ApiException.badRequest(FILE_TOO_BIG);
        }
    }

    public static long approxBytes(String dataUri) {
        int comma = dataUri.indexOf(',');
        String b64 = comma >= 0 ? dataUri.substring(comma + 1) : dataUri;
        return base64Bytes(b64);
    }

    private static long base64Bytes(String b64) {
        long len = b64.length();
        long padding = 0;
        if (len >= 2) {
            if (b64.charAt((int) (len - 1)) == '=') padding++;
            if (b64.charAt((int) (len - 2)) == '=') padding++;
        }
        return len * 3L / 4L - padding;
    }

    private static boolean isPdf(String dataUri) {
        return dataUri.regionMatches(true, 0, "data:application/pdf", 0, 20);
    }

    private static boolean isImage(String dataUri) {
        return dataUri.regionMatches(true, 0, "data:image/", 0, 11);
    }
}
