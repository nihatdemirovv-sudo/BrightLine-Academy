package com.aitqdk.magistr.e2e;

import static org.assertj.core.api.Assertions.assertThat;

import com.aitqdk.magistr.testsupport.TestIo;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/** Bilik Arenası: iştirakçılar bir-birinin cavabını yarış zamanı görmür, nəticədə hamınınkı görünür. */
class ArenaE2ETest extends E2eTestBase {

  @SuppressWarnings("unchecked")
  private static Map<String, Object> mine(Map<String, Object> detail) {
    return (Map<String, Object>) detail.get("menimIstirakim");
  }

  @Test
  @DisplayName("Arena: rəqibin seçimi yarış zamanı gizlidir, bitəndə hər iştirakçının cavabı görünür")
  @SuppressWarnings("unchecked")
  void answersArePrivateDuringRaceAndVisibleAfter() throws InterruptedException {
    Map<String, Object> a = registerStudent(unique("arA"), "1");
    Map<String, Object> b = registerStudent(unique("arB"), "1");
    String sa = (String) a.get("sessionId");
    String sb = (String) b.get("sessionId");

    Map<String, Object> created = post("/api/arena/competitions", Map.of("sessionId", sa, "ad", "Test yarışı",
        "fenn", "Riyaziyyat", "sualSayi", 5, "cetinlik", "orta", "maxIstirakci", 2,
        "gozlemeSaniye", 120, "sualSaniye", 30));
    String id = (String) created.get("id");

    // Suallar müsabiqə yaradılan an AI ilə (burada saxta AI) asinxron hazırlanır.
    for (int i = 0; i < 50 && !Boolean.TRUE.equals(getMap("/api/arena/competitions/" + id + "?sessionId=" + sa).get("suallarHazir")); i++) {
      Thread.sleep(100);
    }
    post("/api/arena/competitions/" + id + "/join", Map.of("sessionId", sb));
    post("/api/arena/competitions/" + id + "/start", Map.of("sessionId", sa));

    // A "A", B "B" seçir — eyni sual, fərqli cavablar.
    post("/api/arena/competitions/" + id + "/answer", Map.of("sessionId", sa, "sualIndex", 0, "secim", "A"));
    Map<String, Object> afterB = post("/api/arena/competitions/" + id + "/answer", Map.of("sessionId", sb, "sualIndex", 0, "secim", "B"));

    // B-nin cavabından sonra A öz vəziyyətinə baxır: yalnız ÖZ seçimini görür.
    Map<String, Object> aView = getMap("/api/arena/competitions/" + id + "?sessionId=" + sa);
    assertThat((Map<String, Object>) mine(aView).get("secimler")).containsExactlyEntriesOf(Map.of("0", "A"));
    assertThat((Map<String, Object>) mine(afterB).get("secimler")).containsExactlyEntriesOf(Map.of("0", "B"));
    List<Map<String, Object>> partsDuringRace = (List<Map<String, Object>>) aView.get("istirakcilar");
    assertThat(partsDuringRace).allSatisfy(p -> assertThat(p).doesNotContainKey("secimler").containsKey("cavabladiSay"));
    assertThat((List<Map<String, Object>>) aView.get("suallar")).allSatisfy(q -> assertThat(q).doesNotContainKey("dogruCavab"));

    // Admin yarışı dayandırır (finalize) — nəticədə hər iştirakçının seçimi görünür.
    String admin = adminSession();
    adminPost("/api/admin/arena/competitions/" + id + "/stop", admin, Map.of());
    Map<String, Object> result = getMap("/api/arena/competitions/" + id + "?sessionId=" + sa);
    List<Map<String, Object>> parts = (List<Map<String, Object>>) result.get("istirakcilar");
    Map<String, Object> pa = parts.stream().filter(p -> p.get("studentId").equals(a.get("id"))).findFirst().orElseThrow();
    Map<String, Object> pb = parts.stream().filter(p -> p.get("studentId").equals(b.get("id"))).findFirst().orElseThrow();
    assertThat((Map<String, Object>) pa.get("secimler")).containsEntry("0", "A");
    assertThat((Map<String, Object>) pb.get("secimler")).containsEntry("0", "B");

    TestIo.record("Bilik Arenası — cavabların məxfiliyi və yekun nəticə",
        io("addımlar", List.of("A müsabiqə yaradır (Riyaziyyat, 5 sual)", "B qoşulur", "A başladır",
            "1-ci sual: A → \"A\", B → \"B\"", "A öz vəziyyətinə baxır", "admin yarışı bitirir")),
        io("yarış zamanı A-nın gördüyü öz seçimləri", mine(aView).get("secimler"),
            "yarış zamanı A-nın gördüyü rəqib məlumatı", partsDuringRace.stream()
                .map(p -> io("ad", p.get("ad"), "cavabladiSay", p.get("cavabladiSay"))).toList(),
            "bitəndən sonra hər iştirakçının seçimi", parts.stream()
                .map(p -> io("ad", p.get("ad"), "secimler", p.get("secimler"), "xal", p.get("xal"))).toList()),
        "yarış zamanı hər kəs yalnız öz seçimini və rəqibin neçə suala cavab verdiyini görür (seçimi yox), "
            + "doğru cavablar gizlidir; bitəndən sonra hər iştirakçının hansı suala nə cavab verdiyi görünür");
  }
}
