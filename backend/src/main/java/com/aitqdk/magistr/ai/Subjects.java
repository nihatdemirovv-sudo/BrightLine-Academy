package com.aitqdk.magistr.ai;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/** TQDK qrup/fənn sabitləri — ai.ts-dəki QRUP_FENLERI və BÜTÜN_FENLER. */
public final class Subjects {

    private Subjects() {
    }

    public static final Map<String, List<String>> QRUP_FENLERI = Map.of(
            "1", List.of("Riyaziyyat", "Azərbaycan dili", "Xarici dil", "Fizika", "Kimya", "İnformatika"),
            "2", List.of("Riyaziyyat", "Azərbaycan dili", "Xarici dil", "Coğrafiya", "Tarix"),
            "3", List.of("Azərbaycan dili", "Xarici dil", "Tarix", "Ədəbiyyat"),
            "4", List.of("Azərbaycan dili", "Xarici dil", "Biologiya", "Kimya", "Fizika"),
            // 5-ci qrup: tək mərhələli (yalnız Buraxılış, blok yoxdur, 300 bal üzərindən) — ona görə yalnız
            // buraxılış fənləri (Riyaziyyat, Azərbaycan dili, Xarici dil) var, blok fənni yoxdur.
            "5", List.of("Riyaziyyat", "Azərbaycan dili", "Xarici dil"),
            "magistr", List.of("Məntiq", "İnformatika", "Xarici dil")
    );

    public static final List<String> BÜTÜN_FENLER = List.of(
            "Riyaziyyat", "Fizika", "Kimya", "Biologiya", "Tarix",
            "Ədəbiyyat", "Coğrafiya", "Xarici dili", "Azərbaycan dili", "İnformatika"
    );

    public static List<String> fennleriForQrup(String qrup) {
        List<String> f = QRUP_FENLERI.get(qrup);
        return f != null ? f : BÜTÜN_FENLER.subList(0, Math.min(6, BÜTÜN_FENLER.size()));
    }

    // Müəllim-tələbə uyğunluğu üçün AYRICA cədvəl (yuxarıdakı QRUP_FENLERI-dən MÜSTƏQİL —
    // o, imtahan/blok seçimi üçündür və bilərəkdən Riyaziyyat/Az dili/Xarici dil kimi "buraxılış"
    // fənlərini bəzi qruplarda göstərmir). Burada məqsəd fərqlidir: müəllim "Riyaziyyat müəllimiyəm"
    // deyəndə HANSI qruplarda Riyaziyyat oxunur — bunun üçün BÜTÜN buraxılış+blok fənləri lazımdır.
    private static final Map<String, List<String>> MUELLIM_QRUP_FENLERI = Map.of(
            "1", List.of("Azərbaycan dili", "Riyaziyyat", "Xarici dili", "Fizika", "Kimya", "İnformatika"),
            "2", List.of("Azərbaycan dili", "Riyaziyyat", "Xarici dili", "Coğrafiya", "Tarix"),
            "3", List.of("Azərbaycan dili", "Riyaziyyat", "Xarici dili", "Ədəbiyyat", "Tarix", "Coğrafiya"),
            "4", List.of("Azərbaycan dili", "Riyaziyyat", "Xarici dili", "Kimya", "Biologiya", "Fizika"),
            "5", List.of("Azərbaycan dili", "Riyaziyyat", "Xarici dili")
    );

    /** Verilmiş fənni tədris edən müəllimin tələbə axtarışında hansı qruplar görünməlidir.
     * Naməlum/uyğunsuz fənn üçün boş siyahı qaytarır (çağıran tərəf bunu "filtrsiz göstər" kimi şərh edir). */
    public static List<String> qruplarForMuellimFenni(String fenn) {
        if (fenn == null || fenn.isBlank()) return List.of();
        String needle = fenn.trim();
        List<String> qruplar = new ArrayList<>();
        for (var entry : MUELLIM_QRUP_FENLERI.entrySet()) {
            boolean match = entry.getValue().stream().anyMatch(f -> f.equalsIgnoreCase(needle));
            if (match) qruplar.add(entry.getKey());
        }
        return qruplar;
    }
}
