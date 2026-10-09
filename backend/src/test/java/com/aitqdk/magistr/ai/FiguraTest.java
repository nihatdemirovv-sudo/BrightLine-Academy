package com.aitqdk.magistr.ai;

import static org.assertj.core.api.Assertions.assertThat;

import com.aitqdk.magistr.testsupport.TestIo;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/** Həndəsi fiqur şərti göstərməlidir, həllin ara nəticələrini yox. */
class FiguraTest {

  @Test
  @DisplayName("Şərtdə olmayan ölçülər fiqurda '?' ilə gizlədilir (real AI nümunəsi)")
  void hidesDerivedValues() {
    // Canlı AI testində Gemini-nin həqiqətən qaytardığı sual və fiqur.
    String sual = "Düzbucaqlı trapesiyanın daxilinə radiusu $4\\,\\text{sm}$ olan çevrə çəkilmişdir. "
        + "Trapesiyanın böyük yan tərəfi $10\\,\\text{sm}$ olarsa, onun sahəsini tapın.";
    Map<String, Object> figura = new LinkedHashMap<>();
    figura.put("type", "trapezoid");
    figura.put("a", "6");
    figura.put("b", "12");
    figura.put("height", "8");

    Map<String, Object> netice = AiService.gizletHellEdileni(figura, sual);
    assertThat(netice).containsEntry("type", "trapezoid").containsEntry("a", "?").containsEntry("b", "?")
        .containsEntry("height", "?");

    TestIo.record("Fiqur həllin cavabını açmamalıdır",
        Map.of("sual", sual, "AI-nin fiquru", figura),
        Map.of("saytda göstərilən fiqur", netice),
        "şərtdə verilməyən oturacaqlar (6, 12) və hündürlük (8) — həllin ara nəticələri — '?' ilə gizlədildi");
  }

  @Test
  @DisplayName("Keyfiyyət filtri: bağlanmamış düsturlu sual atılır (real AI nümunəsi)")
  void qualityGateDropsBrokenLatex() {
    com.aitqdk.magistr.dto.GeneratedQuestion q = new com.aitqdk.magistr.dto.GeneratedQuestion();
    q.setSual("«AZ», «BY», «CV», «ÇÜ», «?» — növbəti cütü tapın.");
    q.setVariantlar(Map.of("A", "«EU»", "B", "«ET»", "C", "«DU»", "D", "«DÜ»", "E", "«DT»"));
    q.setDogruCavab("C");
    // Canlı testdə Gemini-nin həqiqətən yazdığı izah — "$30-cu" düsturu bağlanmayıb.
    q.setIzah("3-cü hərf: $3$-cü C, $30-cu V (CV); 4-cü hərf: $4$-cü Ç, $29$-cu Ü (ÇÜ). Doğru cavab: C.");
    String qusur = AiService.keyfiyyetQusuru(q);
    assertThat(qusur).isEqualTo("bağlanmamış düstur ($)");

    q.setIzah("3-cü hərf: $3$-cü C, $30$-cu V (CV); 4-cü hərf: $4$-cü Ç, $29$-cu Ü (ÇÜ). Doğru cavab: C.");
    assertThat(AiService.keyfiyyetQusuru(q)).isNull();

    // Excel ünvanlarındakı "$" kodun içindədir — düstur sayılmamalıdır.
    q.setIzah("`=$A$1*B2` düsturu köçürüləndə `$A1` qarışıq ünvanı dəyişir. Doğru cavab: C.");
    assertThat(AiService.keyfiyyetQusuru(q)).isNull();

    TestIo.record("Keyfiyyət filtri — qüsurlu AI sualı istifadəçiyə çatmır",
        Map.of("AI-nin izahı", "... $30-cu V (CV) ...  (bağlanmayan $)"),
        Map.of("filtrin qərarı", qusur, "nəticə", "sual atılır, yerinə AI-dən yenisi istənir"),
        "balanssız düsturlu sual rədd edildi; düzəldilmiş variant qəbul olundu");
  }

  @Test
  @DisplayName("Keyfiyyət filtri: izahdakı cavab dogruCavab ilə uyğun gəlməyən sual atılır (real AI nümunəsi)")
  void qualityGateDropsWrongAnswerKey() {
    com.aitqdk.magistr.dto.GeneratedQuestion q = new com.aitqdk.magistr.dto.GeneratedQuestion();
    q.setSual("$y = \\sqrt{16 - x^2} + \\dfrac{1}{\\sqrt{x^2 - 3x}}$ funksiyasının təyin oblastına daxil olan tam ədədlərin sayını tapın.");
    q.setVariantlar(Map.of("A", "$6$", "B", "$5$", "C", "$2$", "D", "$3$", "E", "$4$"));
    q.setDogruCavab("E"); // AI "4"-ü doğru göstərib
    // Canlı testdə Gemini-nin yazdığı izah: düzgün nəticə 5-dir (B) və model özünü düzəldir.
    q.setIzah("Tam ədədlər: $-4, -3, -2, -1$ və $4$. Yenidən sayaq: cəmi $4 + 1 = 5$ ədəd tam həll var. Doğru cavab: B.");
    String qusur = AiService.keyfiyyetQusuru(q);
    assertThat(qusur).isEqualTo("izahdakı cavab (B) dogruCavab (E) ilə uyğun deyil");

    q.setDogruCavab("B");
    assertThat(AiService.keyfiyyetQusuru(q)).isEqualTo("izahda AI öz hesabını düzəldir (etibarsız həll)");

    TestIo.record("Keyfiyyət filtri — yanlış cavab açarı olan AI sualı istifadəçiyə çatmır",
        Map.of("AI-nin sualı", "təyin oblastındakı tam ədədlərin sayı", "AI-nin dogruCavab", "E ($4$)",
            "AI-nin izahı", "... Yenidən sayaq: cəmi 5 ... Doğru cavab: B."),
        Map.of("filtrin qərarı", qusur, "nəticə", "sual atılır, yerinə AI-dən yenisi istənir"),
        "izah 5 (B) deyir, cavab açarı 4 (E) göstərir — uyğunsuz sual rədd edildi; özünü düzəldən izah da rədd olunur");
  }

  @Test
  @DisplayName("Şərtdə verilən ölçülər fiqurda qalır, etiketlər saxlanılır")
  void keepsGivenValues() {
    String sual = "Yan tərəfləri $10\\,\\text{sm}$, oturacağı $12\\,\\text{sm}$ olan bərabəryanlı üçbucağın sahəsini tapın.";
    Map<String, Object> figura = new LinkedHashMap<>();
    figura.put("type", "triangle");
    figura.put("sides", List.of("AB=10", "BC=10", "AC=12"));
    figura.put("angles", List.of("?", "?", "?"));
    figura.put("rightAngleAt", null);

    Map<String, Object> netice = AiService.gizletHellEdileni(figura, sual);
    assertThat(netice.get("sides")).isEqualTo(List.of("AB=10", "BC=10", "AC=12"));

    Map<String, Object> hundurluklu = new LinkedHashMap<>(figura);
    hundurluklu.put("sides", List.of("AB=10", "BC=10", "AC=12", "h=8"));
    assertThat(AiService.gizletHellEdileni(hundurluklu, sual).get("sides"))
        .isEqualTo(List.of("AB=10", "BC=10", "AC=12", "h=?"));
  }
}
