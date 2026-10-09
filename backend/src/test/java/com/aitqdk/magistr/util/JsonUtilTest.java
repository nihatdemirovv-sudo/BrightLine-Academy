package com.aitqdk.magistr.util;

import static org.assertj.core.api.Assertions.assertThat;

import com.aitqdk.magistr.testsupport.TestIo;
import java.util.Map;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/** AI JSON cavabında tək backslash-lı LaTeX-in bərpası (JsonUtil.repairLatexEscapes). */
class JsonUtilTest {

  private static final String BS = "\\";

  private static String parseIzah(String rawJson) {
    Map<?, ?> m = JsonUtil.fromJson(JsonUtil.stripMarkdownFences(rawJson), Map.class);
    assertThat(m).as("JSON parse olunmalıdır").isNotNull();
    return (String) m.get("izah");
  }

  private static String json(String izah) {
    return "{\"izah\":\"" + izah + "\"}";
  }

  @Test
  @DisplayName("JSON escape hərfləri ilə başlayan əmrlər (frac, theta, neq, beta, right) pozulmur")
  void bfnrtCommands() {
    String raw = json("$" + BS + "frac{1}{2}$ $" + BS + "theta$ $x " + BS + "neq 0$ $"
        + BS + "beta$ " + BS + "left(x" + BS + "right) $" + BS + "times$ $" + BS + "text{ m/s}$");
    String izah = parseIzah(raw);
    assertThat(izah).isEqualTo("$\\frac{1}{2}$ $\\theta$ $x \\neq 0$ $\\beta$ \\left(x\\right) $\\times$ $\\text{ m/s}$");

    TestIo.record("LaTeX bərpası — JSON escape ilə toqquşan əmrlər",
        "AI-nin xam JSON cavabı:\n" + raw,
        "Parse-dan sonrakı \"izah\" sahəsi:\n" + izah
            + "\n\nBərpasız olsaydı: \\frac → form-feed + \"rac\", \\theta → tab + \"heta\", \\neq → yeni sətir + \"eq\"",
        "bütün LaTeX əmrləri bütöv qaldı, KaTeX düzgün göstərir");
  }

  @Test
  @DisplayName("Etibarsız escape-lər (sqrt, cdot, end, vergül, faiz) backslash-ı itirmir")
  void invalidEscapesKeepBackslash() {
    String raw = json("$" + BS + "sqrt{2} " + BS + "cdot 3$ $0" + BS + ",5$ $25" + BS + "%$ $"
        + BS + "begin{cases} a " + BS + BS + BS + BS + " b " + BS + "end{cases}$");
    String izah = parseIzah(raw);
    assertThat(izah).isEqualTo("$\\sqrt{2} \\cdot 3$ $0\\,5$ $25\\%$ $\\begin{cases} a \\\\ b \\end{cases}$");

    TestIo.record("LaTeX bərpası — backslash-ın itməsinin qarşısı",
        "AI-nin xam JSON cavabı:\n" + raw,
        "Parse-dan sonrakı \"izah\" sahəsi:\n" + izah
            + "\n\nBərpasız olsaydı: \"sqrt{2}\" xam mətn, \\% → % (KaTeX-də düsturun qalanını silir)",
        "\\sqrt, \\cdot, \\, , \\%, \\begin/\\end{cases} backslash-ı ilə qaldı");
  }

  @Test
  @DisplayName("underline/uparrow parse xətası vermir, unicode escape saxlanılır")
  void unicodeEscapes() {
    String izah = parseIzah(json("$" + BS + "underline{a} " + BS + "uparrow$ " + BS + "u0259la"));
    assertThat(izah).isEqualTo("$\\underline{a} \\uparrow$ əla");
  }

  @Test
  @DisplayName("Düzgün ikiqat escape, sətir keçidi və dırnaq toxunulmaz qalır")
  void validJsonUntouched() {
    String izah = parseIzah(json("$" + BS + BS + "frac{1}{2}$ birinci" + BS + "nikinci " + BS + "\"sitat" + BS + "\""));
    assertThat(izah).isEqualTo("$\\frac{1}{2}$ birinci\nikinci \"sitat\"");
  }

  @Test
  @DisplayName("Son elementdən sonrakı vergül və şərh parse-ı pozmur (real AI xətası)")
  void trailingCommaTolerated() {
    String raw = "{\"suallar\": [{\"sual\": \"Hüceyrə nüvəsi\", \"figura\": null,},], \"izah\": \"ok\", // şərh\n}";
    assertThat(parseIzah(raw)).isEqualTo("ok");
  }

  @Test
  @DisplayName("```json kod bloku təmizlənir")
  void stripsFences() {
    assertThat(parseIzah("```json\n" + json("ok") + "\n```")).isEqualTo("ok");
  }
}
