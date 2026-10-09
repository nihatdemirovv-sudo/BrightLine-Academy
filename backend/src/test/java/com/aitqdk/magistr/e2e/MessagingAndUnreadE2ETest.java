package com.aitqdk.magistr.e2e;

import static org.assertj.core.api.Assertions.assertThat;

import com.aitqdk.magistr.testsupport.TestIo;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.web.client.RestClientResponseException;

/** Müəllim ↔ tələbə şəxsi çatı və bütün bölmələrin oxunmamış sayğacları (badge). */
class MessagingAndUnreadE2ETest extends E2eTestBase {

  private String teacherSession;
  private String teacherId;
  private String studentSession;
  private String studentId;
  private String outsiderSession;

  @BeforeEach
  void setUp() {
    Map<String, Object> teacher = approvedTeacher(unique("tm"));
    teacherSession = (String) teacher.get("sessionId");
    teacherId = (String) teacher.get("id");

    Map<String, Object> student = registerStudent(unique("st"), "1");
    studentSession = (String) student.get("sessionId");
    studentId = (String) student.get("id");

    outsiderSession = (String) registerStudent(unique("out"), "2").get("sessionId");
  }

  private void linkTeacherAndStudent() {
    post("/api/teacher/students", Map.of("sessionId", teacherSession, "studentId", studentId));
    post("/api/student/teacher-requests/" + teacherId + "/respond", Map.of("sessionId", studentSession, "accept", true));
  }

  @Test
  @DisplayName("Şəxsi mesaj yalnız qəbul edilmiş müəllim–tələbə arasında mümkündür")
  void dmRequiresAcceptedLink() {
    RestClientResponseException before = expectError(
        () -> post("/api/dm/" + studentId, Map.of("sessionId", teacherSession, "mesaj", "salam")));
    assertThat(before.getStatusCode().value()).isEqualTo(401);

    // Sorğu göndərilib, amma hələ qəbul edilməyib — yenə bağlıdır, tələbədə isə sorğu sayğacı var.
    post("/api/teacher/students", Map.of("sessionId", teacherSession, "studentId", studentId));
    assertThat(((Map<?, ?>) unread(studentSession).get("myTeacher")).get("requests")).isEqualTo(1);
    expectError(() -> post("/api/dm/" + studentId, Map.of("sessionId", teacherSession, "mesaj", "salam")));

    post("/api/student/teacher-requests/" + teacherId + "/respond", Map.of("sessionId", studentSession, "accept", true));
    Map<String, Object> thread = post("/api/dm/" + studentId, Map.of("sessionId", teacherSession, "mesaj", "Salam!"));
    assertThat((List<?>) thread.get("mesajlar")).hasSize(1);

    // Əlaqəsi olmayan tələbə müəllimə yaza bilməz.
    RestClientResponseException outsider = expectError(
        () -> post("/api/dm/" + teacherId, Map.of("sessionId", outsiderSession, "mesaj", "hey")));
    assertThat(outsider.getStatusCode().value()).isEqualTo(401);

    TestIo.record("Şəxsi mesaj — yalnız qəbul edilmiş əlaqədə",
        io("1. əlaqəsiz müəllim → tələbə", "POST /api/dm/{studentId} {mesaj: \"salam\"}",
            "2. müəllim sorğu göndərir", "POST /api/teacher/students",
            "3. tələbə qəbul edir, müəllim yazır", "POST /api/dm/{studentId} {mesaj: \"Salam!\"}",
            "4. kənar tələbə → müəllim", "POST /api/dm/{teacherId} {mesaj: \"hey\"}"),
        io("1. cavab", io("HTTP", before.getStatusCode().value(), "body", before.getResponseBodyAsString()),
            "2. tələbədə gələn sorğu sayğacı", 1,
            "3. söhbət", thread.get("mesajlar"),
            "4. cavab", io("HTTP", outsider.getStatusCode().value())),
        "əlaqə qəbul edilməyənə qədər yazışma bağlıdır (401), qəbuldan sonra açılır, kənar şəxs yaza bilmir");
  }

  @Test
  @DisplayName("Mesaj sayğacı: gələn mesajlar sayılır, oxunanda sıfırlanır, öz mesajın sayılmır")
  @SuppressWarnings("unchecked")
  void dmUnreadCounter() throws InterruptedException {
    linkTeacherAndStudent();
    post("/api/dm/" + studentId, Map.of("sessionId", teacherSession, "mesaj", "Sabah dərs var"));
    Thread.sleep(20); // eyni millisaniyədə yaranan iki mesajın "son mesaj" sırası təsadüfi olmasın
    post("/api/dm/" + studentId, Map.of("sessionId", teacherSession, "mesaj", "Əla, şükür — ğ ç ş ö ü ı ə"));

    Map<String, Object> u = unread(studentSession);
    assertThat(sectionTotal(u, "messages")).isEqualTo(2);
    assertThat(((Map<String, Object>) ((Map<String, Object>) u.get("messages")).get("items")).get(teacherId)).isEqualTo(2);

    List<Map<String, Object>> conv = getList("/api/dm?sessionId=" + studentSession);
    assertThat(conv).hasSize(1);
    assertThat(conv.get(0).get("oxunmamis")).isEqualTo(2);
    assertThat(conv.get(0).get("sonMesaj")).isEqualTo("Əla, şükür — ğ ç ş ö ü ı ə");

    markSeen(studentSession, "dm:" + teacherId);
    assertThat(sectionTotal(unread(studentSession), "messages")).isZero();
    assertThat(sectionTotal(unread(teacherSession), "messages")).as("öz mesajları sayılmır").isZero();

    post("/api/dm/" + teacherId, Map.of("sessionId", studentSession, "mesaj", "Oldu, müəllim"));
    Map<String, Object> teacherUnread = unread(teacherSession);
    assertThat(sectionTotal(teacherUnread, "messages")).isEqualTo(1);

    TestIo.record("Mesaj sayğacı (badge)",
        io("müəllim tələbəyə 2 mesaj yazır", List.of("Sabah dərs var", "Əla, şükür — ğ ç ş ö ü ı ə"),
            "sonra", "tələbə söhbəti açır: POST /api/unread/seen {key: \"dm:<teacherId>\"}",
            "sonra", "tələbə cavab yazır: \"Oldu, müəllim\""),
        io("tələbənin sayğacı (açmadan əvvəl)", u.get("messages"),
            "söhbət siyahısı", conv,
            "tələbənin sayğacı (açandan sonra)", 0,
            "müəllimin sayğacı (tələbə cavab yazandan sonra)", teacherUnread.get("messages")),
        "gələn mesajlar sayılır, söhbət açılanda sıfırlanır, öz mesajın sayılmır, Azərbaycan hərfləri olduğu kimi qalır");
  }

  @Test
  @DisplayName("Öz mesajını silmək olar, başqasınınkını yox")
  @SuppressWarnings("unchecked")
  void deleteOwnMessageOnly() {
    linkTeacherAndStudent();
    Map<String, Object> thread = post("/api/dm/" + studentId, Map.of("sessionId", teacherSession, "mesaj", "silinəcək"));
    String messageId = (String) ((List<Map<String, Object>>) thread.get("mesajlar")).get(0).get("id");

    expectError(() -> delete("/api/dm/" + teacherId + "/messages/" + messageId + "?sessionId=" + studentSession));

    Map<String, Object> after = delete("/api/dm/" + studentId + "/messages/" + messageId + "?sessionId=" + teacherSession);
    Map<String, Object> msg = ((List<Map<String, Object>>) after.get("mesajlar")).get(0);
    assertThat(msg.get("silinib")).isEqualTo(true);
    assertThat(msg.get("mesaj")).isEqualTo("Mesaj silindi");
  }

  @Test
  @DisplayName("Qrup sayğacı: başqalarının mesajları sayılır, qrup açılanda sıfırlanır")
  @SuppressWarnings("unchecked")
  void groupUnreadCounter() {
    String groupId = (String) post("/api/groups", Map.of("sessionId", studentSession, "ad", unique("qrup"), "sifre", "1234")).get("id");
    post("/api/groups/" + groupId + "/join", Map.of("sessionId", outsiderSession, "sifre", "1234"));
    for (int i = 1; i <= 3; i++) {
      post("/api/groups/" + groupId + "/messages", Map.of("sessionId", outsiderSession, "mesaj", "mesaj " + i));
    }
    post("/api/groups/" + groupId + "/messages", Map.of("sessionId", studentSession, "mesaj", "öz mesajım"));

    Map<String, Object> u = unread(studentSession);
    assertThat(sectionTotal(u, "groups")).isEqualTo(3);
    assertThat(((Map<String, Object>) ((Map<String, Object>) u.get("groups")).get("items")).get(groupId)).isEqualTo(3);

    markSeen(studentSession, "group:" + groupId);
    assertThat(sectionTotal(unread(studentSession), "groups")).isZero();
    assertThat(sectionTotal(unread(outsiderSession), "groups")).isEqualTo(1);

    TestIo.record("Qrup sayğacı (badge)",
        io("digər üzv qrupa yazır", List.of("mesaj 1", "mesaj 2", "mesaj 3"),
            "tələbə özü yazır", "öz mesajım",
            "sonra", "tələbə qrupu açır: POST /api/unread/seen {key: \"group:<groupId>\"}"),
        io("tələbənin sayğacı (açmadan əvvəl)", u.get("groups"),
            "tələbənin sayğacı (açandan sonra)", 0,
            "digər üzvün sayğacı", 1),
        "başqalarının 3 mesajı sayıldı, öz mesajı sayılmadı, qrup açılanda sıfırlandı");
  }

  @Test
  @DisplayName("Müəllimim sayğacları və müəllimin yoxlanılmamış imtahan cavabları")
  @SuppressWarnings("unchecked")
  void teacherSectionCounters() {
    linkTeacherAndStudent();
    post("/api/teacher/tasks", Map.of("sessionId", teacherSession, "studentId", studentId,
        "baslik", "Ev tapşırığı", "items", List.of("1-ci addım", "2-ci addım")));
    Map<String, Object> mt = (Map<String, Object>) unread(studentSession).get("myTeacher");
    assertThat(mt.get("tasks")).isEqualTo(1);

    markSeen(studentSession, "mt:tasks");
    assertThat(((Map<String, Object>) unread(studentSession).get("myTeacher")).get("tasks")).isEqualTo(0);

    String examId = (String) post("/api/teacher/exams", Map.of("sessionId", teacherSession,
        "baslik", "Sınaq 1", "telimat", "Sabaha qədər")).get("id");
    assertThat(((Map<String, Object>) unread(studentSession).get("myTeacher")).get("exams")).isEqualTo(1);

    post("/api/student/exams/" + examId + "/submit", Map.of("sessionId", studentSession, "cavab", "Cavabım"));
    assertThat(unread(teacherSession).get("exams")).as("yoxlanılmamış cavab").isEqualTo(1);

    TestIo.record("Müəllimim bölməsinin və müəllim panelinin sayğacları",
        io("1. müəllim tapşırıq yaradır", "POST /api/teacher/tasks {baslik: \"Ev tapşırığı\"}",
            "2. tələbə Tapşırıqlar tabını açır", "POST /api/unread/seen {key: \"mt:tasks\"}",
            "3. müəllim imtahan elan edir", "POST /api/teacher/exams {baslik: \"Sınaq 1\"}",
            "4. tələbə cavab göndərir", "POST /api/student/exams/{id}/submit"),
        io("1. tələbənin 'tapşırıq' sayğacı", mt.get("tasks"),
            "2. tabı açandan sonra", 0,
            "3. tələbənin 'imtahan' sayğacı", 1,
            "4. müəllimin 'yoxlanılmamış cavab' sayğacı", 1),
        "yeni tapşırıq/imtahan tələbədə, yeni cavab müəllimdə sayğac kimi görünür; tab açılanda sıfırlanır");
  }
}
