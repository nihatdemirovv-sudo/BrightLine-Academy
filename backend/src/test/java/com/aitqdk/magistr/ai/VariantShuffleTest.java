package com.aitqdk.magistr.ai;

import static org.assertj.core.api.Assertions.assertThat;

import com.aitqdk.magistr.testsupport.TestIo;
import java.util.Map;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/** Variantlar qarışdırılandan sonra izahdakı hərf istinadlarının yeni hərflərə çevrilməsi. */
class VariantShuffleTest {

  // Köhnə hərf → yeni hərf (A↔C dəyişib, B→E, E→B, D yerində)
  private static final Map<String, String> MAP = Map.of("A", "C", "C", "A", "B", "E", "E", "B", "D", "D");

  @Test
  @DisplayName("İzahdakı bütün variant hərfləri eyni anda yeni hərflərə çevrilir")
  void remapsAllLetterReferences() {
    String izah = "A) $2^2 + 3^2 = 13$\nC) $1^2 + 5^2 = 26$\n$4$ qiyməti C variantındadır, variant B isə yanlışdır. Doğru cavab: A.";
    String result = AiService.remapVariantHerfleri(izah, MAP);

    assertThat(result).isEqualTo(
        "C) $2^2 + 3^2 = 13$\nA) $1^2 + 5^2 = 26$\n$4$ qiyməti A variantındadır, variant E isə yanlışdır. Doğru cavab: C.");

    TestIo.record("Variant qarışdırılması — izahdakı hərflərin düzəldilməsi",
        "Köhnə → yeni hərf: " + MAP + "\n\nAI-nin yazdığı izah:\n" + izah,
        "Qarışdırmadan sonra izah:\n" + result,
        "'A)', 'C variantı', 'variant B', 'Doğru cavab: A' bir keçiddə yeni hərflərə çevrildi (A↔C zənciri qarışmadı)");
  }

  @Test
  @DisplayName("Funksiya yazılışı və həndəsi nöqtələr toxunulmaz qalır")
  void keepsNonVariantLetters() {
    String izah = "$P(A) = \\dfrac{m}{n}$, ABC üçbucağında B-də düz bucaq var, A nöqtəsi.";
    assertThat(AiService.remapVariantHerfleri(izah, MAP)).isEqualTo(izah);
  }
}
