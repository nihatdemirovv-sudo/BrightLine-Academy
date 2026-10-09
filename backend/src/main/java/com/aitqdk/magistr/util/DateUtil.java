package com.aitqdk.magistr.util;

import java.time.LocalDate;
import java.time.ZoneId;

public final class DateUtil {
    private DateUtil() {
    }

    // Bütün istifadəçilər Azərbaycandadır (UTC+4, DST yoxdur) — streak/gün hesablamaları
    // UTC əvəzinə yerli tarixə görə aparılmalıdır, əks halda gecə yarısına yaxın (~00:00-04:00)
    // fəaliyyət UTC-dəki "əvvəlki gün"ə düşüb streak-i yanlış qırır/artırır.
    private static final ZoneId BAKU = ZoneId.of("Asia/Baku");

    public static String today() {
        return LocalDate.now(BAKU).toString();
    }

    public static String yesterday() {
        return LocalDate.now(BAKU).minusDays(1).toString();
    }

    /** Son aktiv günə görə yeni streak hesablayır (login/heartbeat zamanı). */
    public static int nextStreak(String lastActiveDate, int currentStreak) {
        String bugun = today();
        if (bugun.equals(lastActiveDate)) return currentStreak;
        String dunen = yesterday();
        return dunen.equals(lastActiveDate) ? currentStreak + 1 : 1;
    }
}
