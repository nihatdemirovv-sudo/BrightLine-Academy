package com.aitqdk.magistr.e2e;

import static org.assertj.core.api.Assertions.assertThat;

import com.aitqdk.magistr.testsupport.TestIo;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * Real vaxt yayımları (SSE) bütün abunəçilərə EYNİ payload göndərir — ona görə payload heç bir
 * iştirakçının şəxsi məlumatını (öz seçimləri, "Məndən sil" filtri) daşımamalıdır.
 */
class RealtimePrivacyE2ETest extends E2eTestBase {

  @Test
  @DisplayName("Qrup yayımı: göndərənin 'Məndən sil' filtri digər üzvlərə ötürülmür")
  @SuppressWarnings("unchecked")
  void groupBroadcastIsNeutral() throws Exception {
    String sa = (String) registerStudent(unique("grA"), "1").get("sessionId");
    String sb = (String) registerStudent(unique("grB"), "1").get("sessionId");
    String groupId = (String) post("/api/groups", Map.of("sessionId", sa, "ad", unique("qrup"), "sifre", "1234")).get("id");
    post("/api/groups/" + groupId + "/join", Map.of("sessionId", sb, "sifre", "1234"));

    Map<String, Object> afterB = post("/api/groups/" + groupId + "/messages", Map.of("sessionId", sb, "mesaj", "B-nin mesajı"));
    String bMessageId = (String) ((List<Map<String, Object>>) afterB.get("mesajlar")).get(0).get("id");
    // A bu mesajı YALNIZ özündən silir.
    post("/api/groups/" + groupId + "/messages/" + bMessageId + "/hide?sessionId=" + sa, Map.of());

    // B qrupa baxır; A yeni mesaj yazır — B-yə gələn yayımda B-nin mesajı OLMALIDIR.
    Map<String, Object> event = firstSseEvent("/api/groups/" + groupId + "/stream?sessionId=" + sb, "group",
        () -> post("/api/groups/" + groupId + "/messages", Map.of("sessionId", sa, "mesaj", "A-nın yeni mesajı")));
    List<String> mesajlar = ((List<Map<String, Object>>) event.get("mesajlar")).stream()
        .map(m -> (String) m.get("mesaj")).toList();
    assertThat(mesajlar).containsExactly("B-nin mesajı", "A-nın yeni mesajı");
    assertThat(event.get("menimClearedAt")).isNull();

    // A-nın öz görünüşündə isə gizlətdiyi mesaj yoxdur.
    Map<String, Object> aView = getMap("/api/groups/" + groupId + "?sessionId=" + sa);
    assertThat(((List<Map<String, Object>>) aView.get("mesajlar")).stream().map(m -> m.get("mesaj")).toList())
        .containsExactly("A-nın yeni mesajı");

    TestIo.record("Qrup real vaxt yayımı — şəxsi filtr sızmır",
        io("1", "B qrupa \"B-nin mesajı\" yazır", "2", "A həmin mesajı \"Məndən sil\" edir",
            "3", "B qrupun SSE axınını dinləyir", "4", "A yeni mesaj yazır"),
        io("B-yə gələn yayımdakı mesajlar", mesajlar, "A-nın öz görünüşü", List.of("A-nın yeni mesajı")),
        "yayım neytraldır: A-nın şəxsi gizlətməsi B-nin ekranından mesajı silmir; A isə öz görünüşündə onu görmür");
  }

  @Test
  @DisplayName("Arena yayımı: cavab verənin seçimləri digər iştirakçılara getmir")
  @SuppressWarnings("unchecked")
  void arenaBroadcastIsNeutral() throws Exception {
    String sa = (String) registerStudent(unique("aA"), "1").get("sessionId");
    String sb = (String) registerStudent(unique("aB"), "1").get("sessionId");
    String id = (String) post("/api/arena/competitions", Map.of("sessionId", sa, "ad", "SSE testi",
        "fenn", "Riyaziyyat", "sualSayi", 5, "cetinlik", "orta", "maxIstirakci", 2,
        "gozlemeSaniye", 120, "sualSaniye", 30)).get("id");
    for (int i = 0; i < 50 && !Boolean.TRUE.equals(getMap("/api/arena/competitions/" + id + "?sessionId=" + sa).get("suallarHazir")); i++) {
      Thread.sleep(100);
    }
    post("/api/arena/competitions/" + id + "/join", Map.of("sessionId", sb));
    post("/api/arena/competitions/" + id + "/start", Map.of("sessionId", sa));

    // A axını dinləyir, B cavab verir — A-ya gələn yayımda B-nin seçimi olmamalıdır.
    Map<String, Object> event = firstSseEvent("/api/arena/competitions/" + id + "/stream?sessionId=" + sa, "competition",
        () -> post("/api/arena/competitions/" + id + "/answer", Map.of("sessionId", sb, "sualIndex", 0, "secim", "B")));
    assertThat(event).doesNotContainKey("menimIstirakim");
    List<Map<String, Object>> parts = (List<Map<String, Object>>) event.get("istirakcilar");
    assertThat(parts).allSatisfy(p -> assertThat(p).doesNotContainKey("secimler"));
    assertThat(String.valueOf(event)).doesNotContain("secim=B");

    TestIo.record("Arena real vaxt yayımı — rəqibin seçimi sızmır",
        io("1", "A və B yarışa başlayır", "2", "A SSE axınını dinləyir", "3", "B 1-ci suala \"B\" cavabını verir"),
        io("A-ya gələn yayımda 'menimIstirakim'", event.containsKey("menimIstirakim"),
            "A-ya gələn iştirakçı məlumatı", parts.stream().map(p -> io("ad", p.get("ad"), "cavabladiSay", p.get("cavabladiSay"))).toList()),
        "yayımda heç kimin seçimi yoxdur — yalnız neçə suala cavab verildiyi; hər iştirakçı öz seçimini ayrıca öz sorğusu ilə alır");
  }
}
