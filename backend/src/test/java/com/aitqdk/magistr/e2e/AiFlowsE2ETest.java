package com.aitqdk.magistr.e2e;

import static org.assertj.core.api.Assertions.assertThat;

import com.aitqdk.magistr.ai.Subjects;
import com.aitqdk.magistr.testsupport.TestIo;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * AI funksiyaları uçdan-uca (saxta AI ilə): promptun düzgün qurulması (system rolu, dil və KaTeX
 * qaydaları, mövzu bölgüsü, çətinlik), AI cavabının emalı (LaTeX bərpası, variant qarışdırma,
 * izahdakı cavab hərfi) və nəticənin API-dən düzgün qaytarılması.
 */
class AiFlowsE2ETest extends E2eTestBase {

  private static final String WRITER = "test tərtibçisi";
  private String studentSession;

  @BeforeEach
  void setUp() {
    fakeAi.calls.clear();
    studentSession = (String) registerStudent(unique("ai"), "1").get("sessionId");
  }

  private Map<String, Object> requestBody(String fenn, int say, String movzu) {
    Map<String, Object> body = new LinkedHashMap<>();
    body.put("sessionId", "<tələbə sessiyası>");
    body.put("fenn", fenn);
    body.put("say", say);
    if (movzu != null) {
      body.put("movzu", movzu);
    }
    return body;
  }

  @SuppressWarnings("unchecked")
  private List<Map<String, Object>> generate(String fenn, int say, String movzu) {
    Map<String, Object> body = requestBody(fenn, say, movzu);
    body.put("sessionId", studentSession);
    return (List<Map<String, Object>>) post("/api/generate-questions", body).get("suallar");
  }

  @Test
  @DisplayName("Sual generatoru: 10 sual, 5 variant, LaTeX bərpası, izahda düzgün cavab hərfi")
  @SuppressWarnings("unchecked")
  void generatesValidQuestions() {
    List<Map<String, Object>> suallar = generate("Riyaziyyat", 10, "Ümumi mövzu, çətin səviyyədə");
    assertThat(suallar).hasSize(10);

    for (Map<String, Object> q : suallar) {
      Map<String, String> v = (Map<String, String>) q.get("variantlar");
      String dogru = (String) q.get("dogruCavab");
      assertThat(v).containsOnlyKeys("A", "B", "C", "D", "E");
      assertThat(v).containsKey(dogru);
      assertThat(new HashSet<>(v.values())).as("variantlar təkrarlanmır").hasSize(5);

      String sual = (String) q.get("sual");
      // AI "\frac" və "\%"-i TƏK backslash ilə yazıb — bərpadan sonra əmr bütöv qalmalıdır.
      assertThat(sual).contains("\\frac{").contains("\\sqrt{4}").contains("\\cdot").contains("25\\%");
      assertThat(sual).doesNotContain("\f").doesNotContain("\t");
      String izah = (String) q.get("izah");
      assertThat(izah).contains("\\dfrac{a}{b}").contains("\\theta").contains("\\neq");
      // Variantlar qarışdırıldıqdan sonra izahdakı hərf yeni doğru cavaba uyğunlaşdırılmalıdır.
      assertThat(izah).contains("Doğru cavab: " + dogru + ".");
    }

    TestIo.record("Sual generatoru — 10 sual, LaTeX bərpası",
        io("endpoint", "POST /api/generate-questions",
            "body", requestBody("Riyaziyyat", 10, "Ümumi mövzu, çətin səviyyədə"),
            "AI-nin xam cavabı (nümunə)", "\"sual\": \"Hesablayın: $\\frac{1}{2} + \\sqrt{4} \\cdot 25\\%$\" — tək backslash"),
        io("sual sayı", suallar.size(), "ilk 2 sual", suallar.subList(0, 2)),
        "10 sual qayıtdı; hər birində 5 unikal variant (A–E); \\frac, \\sqrt, \\theta, \\neq, \\% bütöv qaldı; "
            + "variantlar qarışdırılandan sonra izahdakı 'Doğru cavab' hərfi dogruCavab ilə eynidir");
  }

  @Test
  @DisplayName("Sual promptu: system rolu, dil/KaTeX/JSON qaydaları, hissələr arası fərqli mövzular")
  void questionPromptIsBuiltCorrectly() {
    generate("Riyaziyyat", 10, "Ümumi mövzu, çətin səviyyədə");

    List<FakeAiController.Call> calls = fakeAi.callsWithSystem(WRITER);
    assertThat(calls).as("10 sual = 5-lik 2 paralel hissə").hasSize(2);

    Pattern topicLine = Pattern.compile("(?m)^\\d+\\. (.+)$");
    Set<String> movzular = new HashSet<>();
    int topicLineCount = 0;
    for (FakeAiController.Call c : calls) {
      assertThat(c.system()).contains("AZƏRBAYCAN DİLİ QAYDALARI").contains("KaTeX").contains("JSON QAYDALARI")
          .contains("\\operatorname{tg}");
      assertThat(c.user()).contains("MÖVZU BÖLGÜSÜ").contains("ÇƏTİNLİK: çətin səviyyədə")
          .contains("1-ci ixtisas qrupu").contains("FƏNN QAYDALARI — RİYAZİYYAT").contains("YOXLAMA");
      Matcher m = topicLine.matcher(c.user().substring(c.user().indexOf("MÖVZU BÖLGÜSÜ"), c.user().indexOf("ÇƏTİNLİK")));
      while (m.find()) {
        movzular.add(m.group(1));
        topicLineCount++;
      }
    }
    assertThat(topicLineCount).isEqualTo(10);
    assertThat(movzular).as("10 sual 10 fərqli mövzudan (proqramda 37 mövzu var)").hasSize(10);

    TestIo.record("Sual promptunun quruluşu — 2 paralel hissə, 10 fərqli mövzu",
        io("endpoint", "POST /api/generate-questions", "body", requestBody("Riyaziyyat", 10, "Ümumi mövzu, çətin səviyyədə")),
        io("AI-yə gedən sorğu sayı", calls.size(),
            "system rolunda olan qaydalar", List.of("AZƏRBAYCAN DİLİ QAYDALARI", "RİYAZİ YAZILIŞ (KaTeX)", "JSON QAYDALARI"),
            "hissələrə paylanan mövzular", movzular,
            "1-ci hissənin istifadəçi promptu (başlanğıc)", calls.get(0).user().substring(0, calls.get(0).user().indexOf("ÇƏTİNLİK") + 30)),
        "5-lik 2 hissə; hər hissədə system rolu + dil/KaTeX/JSON qaydaları; 10 sualın hər biri proqramdan fərqli mövzu aldı");
  }

  @Test
  @DisplayName("İstifadəçi mövzusu və çətinlik ayrıca oxunur")
  void userTopicAndDifficulty() {
    generate("Fizika", 3, "Kinematika (orta çətinlikdə)");
    FakeAiController.Call c = fakeAi.callsWithSystem(WRITER).get(0);
    assertThat(c.user()).contains("MÖVZU: \"Kinematika\"").contains("ÇƏTİNLİK: orta çətinlikdə")
        .doesNotContain("MÖVZU BÖLGÜSÜ").contains("FƏNN QAYDALARI — FİZİKA");

    TestIo.record("Şagirdin mövzusu və çətinliyi ayrıca oxunur",
        io("endpoint", "POST /api/generate-questions", "body", requestBody("Fizika", 3, "Kinematika (orta çətinlikdə)")),
        io("AI-yə gedən promptdan sətirlər", c.user().lines()
            .filter(l -> l.startsWith("MÖVZU:") || l.startsWith("ÇƏTİNLİK:") || l.contains("FƏNN QAYDALARI")).toList()),
        "mövzu \"Kinematika\" və çətinlik \"orta çətinlikdə\" ayrı-ayrı tələb kimi verildi, fizika qaydaları qoşuldu");
  }

  @Test
  @DisplayName("Təsadüfi (qarışıq) fənn: hər sual qrupun fənlərindən birinə aiddir")
  void randomSubjectMode() {
    List<Map<String, Object>> suallar = generate("Təsadüfi", 8, null);
    assertThat(suallar).hasSize(8);
    List<String> qrupFenleri = Subjects.fennleriForQrup("1");
    for (Map<String, Object> q : suallar) {
      assertThat(qrupFenleri).contains((String) q.get("fenn"));
    }

    TestIo.record("Təsadüfi (qarışıq) fənn rejimi",
        io("endpoint", "POST /api/generate-questions", "body", requestBody("Təsadüfi", 8, null), "tələbənin qrupu", "1"),
        io("sual sayı", suallar.size(), "hər sualın fənni", suallar.stream().map(q -> q.get("fenn")).toList()),
        "8 sual qayıtdı, hər birinin fənni 1-ci qrupun fənlərindəndir: " + qrupFenleri);
  }

  @Test
  @DisplayName("AI Müəllim: system rolunda müəllim qaydaları və şagird konteksti")
  void tutorChat() {
    List<Map<String, String>> messages = List.of(Map.of("role", "user", "content", "x^2 - 5x + 6 = 0 tənliyini həll et"));
    Map<String, Object> res = post("/api/tutor-chat", Map.of("sessionId", studentSession, "messages", messages));
    assertThat((String) res.get("reply")).contains("$$D = b^2 - 4ac$$");

    FakeAiController.Call c = fakeAi.callsWithSystem("fərdi AI müəllimisən").get(0);
    assertThat(c.system()).contains("ŞAGİRD HAQQINDA").contains("1-ci ixtisas qrupu")
        .contains("İmtahan fənləri: Riyaziyyat").contains("RİYAZİ YAZILIŞ");
    assertThat(c.user()).contains("tənliyini həll et");

    String sys = c.system();
    TestIo.record("AI Müəllim — şagird konteksti ilə söhbət",
        io("endpoint", "POST /api/tutor-chat", "body", io("sessionId", "<1-ci qrup tələbəsi>", "messages", messages)),
        io("cavab (reply)", res.get("reply"),
            "AI-yə verilən şagird konteksti", sys.substring(sys.indexOf("ŞAGİRD HAQQINDA")).strip()),
        "cavab LaTeX düsturu ilə qayıtdı; system rolunda müəllim qaydaları, şagirdin qrupu, imtahan fənləri və zəif fənləri var");
  }

  @Test
  @DisplayName("Günlük plan: planlayıcı rolu, yalnız qrup fənləri")
  @SuppressWarnings("unchecked")
  void dailyPlan() {
    Map<String, Object> plan = getMap("/api/daily-quest?sessionId=" + studentSession);
    List<Map<String, Object>> tasks = (List<Map<String, Object>>) plan.get("tasks");
    assertThat(tasks).hasSize(4);
    FakeAiController.Call c = fakeAi.callsWithSystem("təhsil planlayıcısı").get(0);
    assertThat(c.user()).contains("İmtahan fənləri (yalnız bunlardan seç");

    TestIo.record("Günlük AI plan",
        io("endpoint", "GET /api/daily-quest?sessionId=<1-ci qrup tələbəsi>"),
        io("tapşırıqlar", tasks),
        "4 tapşırıqlıq plan yaradıldı; AI-yə yalnız qrupun imtahan fənlərindən seçmək tapşırıldı");
  }
}
