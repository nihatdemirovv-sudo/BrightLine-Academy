package com.aitqdk.magistr.testsupport;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

/**
 * Testlərin GİRİŞ → ÇIXIŞ qeydi: hər test göndərdiyi sorğunu, aldığı cavabı və nəticəni həm
 * konsola, həm də build/reports/test-io.md faylına yazır — test nəyi yoxladığını kodu oxumadan
 * görmək üçün. Qeyd yalnız bütün yoxlamalar keçəndən SONRA edilir (yəni yazılan hər blok uğurludur).
 */
public final class TestIo {

  private static final Path FILE = Path.of("build", "reports", "test-io.md");
  private static final ObjectMapper JSON = new ObjectMapper()
      .findAndRegisterModules()
      .enable(SerializationFeature.INDENT_OUTPUT);
  private static final List<String> BLOCKS = new ArrayList<>();
  private static final String STARTED = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm"));

  private TestIo() {
  }

  /**
   * @param test    testin adı (nə yoxlanılır)
   * @param input   sistemə verilən giriş (sorğu gövdəsi, parametrlər)
   * @param output  sistemin qaytardığı çıxış (cavab və ya onun vacib hissəsi)
   * @param verdict yoxlanılan şərtlərin qısa təsviri
   */
  public static synchronized void record(String test, Object input, Object output, String verdict) {
    String in = render(input);
    String out = render(output);
    System.out.println("\n================ TEST: " + test + " ================");
    System.out.println("GİRİŞ:\n" + in);
    System.out.println("ÇIXIŞ:\n" + out);
    System.out.println("NƏTİCƏ: ✅ " + verdict);

    BLOCKS.add("## " + test + "\n\n**Giriş (input):**\n\n```json\n" + in + "\n```\n\n**Çıxış (output):**\n\n```json\n"
        + out + "\n```\n\n**Nəticə:** ✅ " + verdict + "\n");
    write();
  }

  private static String render(Object value) {
    if (value instanceof String s) {
      return s;
    }
    try {
      return JSON.writeValueAsString(value);
    } catch (Exception e) {
      return String.valueOf(value);
    }
  }

  private static void write() {
    try {
      Files.createDirectories(FILE.getParent());
      Files.writeString(FILE, "# Test nəticələri — giriş və çıxış\n\nİşə salınma: " + STARTED + "\n\n"
          + String.join("\n", BLOCKS), StandardCharsets.UTF_8);
    } catch (IOException e) {
      throw new UncheckedIOException(e);
    }
  }
}
