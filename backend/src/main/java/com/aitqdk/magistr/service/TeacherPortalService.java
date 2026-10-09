package com.aitqdk.magistr.service;

import com.aitqdk.magistr.entity.*;
import com.aitqdk.magistr.exception.ApiException;
import com.aitqdk.magistr.repository.*;
import com.aitqdk.magistr.util.JsonUtil;
import com.aitqdk.magistr.util.UploadLimits;
import com.fasterxml.jackson.core.type.TypeReference;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Müəllimin "himayəsində olan tələbələr" domeni — axtarıb qeydə alma, fərdi tapşırıq
 * (checklist + fayl + comment), bütün himayədəkilər üçün read-only materiallar, bütün
 * himayədəkilərə elan olunan imtahanlar + cavab/feedback. ChatGroup-dan TAM MÜSTƏQİLDİR
 * (qruplar sırf söhbət üçündür). ChatGroupService-dəki "TƏLƏBƏ TƏRƏFİ"/"ADMIN TƏRƏFİ"
 * bölmə-şablonu ilə eyni struktur: burada "MÜƏLLİM TƏRƏFİ" / "TƏLƏBƏ TƏRƏFİ".
 */
@Service
@RequiredArgsConstructor
public class TeacherPortalService {

    private static final TypeReference<List<Map<String, Object>>> LIST_OF_MAPS = new TypeReference<>() {
    };

    private final StudentService studentService;
    private final StudentRepository studentRepository;
    private final TeacherStudentRepository teacherStudentRepository;
    private final TaskRepository taskRepository;
    private final TaskCommentRepository taskCommentRepository;
    private final TeacherMaterialRepository materialRepository;
    private final TeacherExamRepository examRepository;
    private final ExamSubmissionRepository submissionRepository;
    private final ActivityRepository activityRepository;

    // ==================== KÖMƏKÇİ ====================

    private Student requireApprovedTeacher(String sessionId) {
        Student student = studentService.findBySessionIdOrThrow(sessionId);
        if (!"muellim".equals(student.getRol()) || !"TESDIQLENIB".equals(student.getMuellimStatus())) {
            throw ApiException.unauthorized("Bu əməliyyat yalnız təsdiqlənmiş müəllimlər üçündür.");
        }
        return student;
    }

    // null = köhnə (status sahəsindən əvvəl yaradılmış) sətir, geriyə-uyğunluq üçün qəbul-edilmiş sayılır.
    private boolean isAccepted(TeacherStudent link) {
        return link.getStatus() == null || "QEBUL_EDILIB".equals(link.getStatus());
    }

    // Tapşırıq/material/imtahan/fəaliyyət kimi HİMAYƏ-səviyyəli əməliyyatlar üçün — sorğu YALNIZ
    // GÖNDƏRİLİB, hələ QƏBUL EDİLMƏYİBSƏ bura girmək olmaz.
    private void requireLinked(String teacherId, String studentId) {
        TeacherStudent link = teacherStudentRepository.findByTeacherIdAndStudentId(teacherId, studentId)
                .filter(this::isAccepted)
                .orElse(null);
        if (link == null) {
            throw ApiException.notFound("Bu tələbə sizin tələbəniz deyil.");
        }
    }

    private Task requireOwnTask(String taskId) {
        return taskRepository.findById(taskId).orElseThrow(() -> ApiException.notFound("Tapşırıq tapılmadı."));
    }

    // Xam Activity sətirləri (nov="sual_helli", detal="Riyaziyyat - doğru" kimi daxili
    // kodlar) birbaşa göstərmək müəllim/admin üçün OXUNMAZDIR (onlarla təkrarlanan "login"
    // sətri, texniki kodlar). Günə görə qruplaşdırıb SAY-ƏSASLI, sadə cümlələrə yığırıq.
    public Map<String, Object> weeklyActivity(String studentId) {
        Instant since = Instant.now().minus(7, ChronoUnit.DAYS);
        List<Activity> activities = activityRepository.findByStudentIdAndCreatedAtAfter(studentId, since);
        Map<String, List<Activity>> byDay = new TreeMap<>(Comparator.reverseOrder());
        for (Activity a : activities) {
            String gun = a.getCreatedAt().toString().substring(0, 10);
            byDay.computeIfAbsent(gun, k -> new ArrayList<>()).add(a);
        }

        Map<String, List<Map<String, Object>>> summarized = new LinkedHashMap<>();
        for (var entry : byDay.entrySet()) {
            summarized.put(entry.getKey(), summarizeDay(entry.getValue()));
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("gunler", summarized);
        result.put("cemiSay", activities.size());
        return result;
    }

    private static final java.util.regex.Pattern SUAL_SAYI_PATTERN = java.util.regex.Pattern.compile("(\\d+) sual yaradıldı");

    private List<Map<String, Object>> summarizeDay(List<Activity> gununler) {
        int loginSay = 0, chatSay = 0,
                dersSay = 0, examSay = 0, flashcardSay = 0, bookmarkSay = 0, planSay = 0, studySay = 0;
        List<String> examDetallari = new ArrayList<>();
        // Fənn adına görə: [doğru, səhv] cavab sayı VƏ [dəfə, cəmi sual] yaradılma sayı.
        Map<String, int[]> fennCavab = new LinkedHashMap<>();
        Map<String, int[]> fennYaradildi = new LinkedHashMap<>();

        for (Activity a : gununler) {
            String nov = a.getNov() == null ? "" : a.getNov();
            String detal = a.getDetal() == null ? "" : a.getDetal();
            switch (nov) {
                case "login" -> loginSay++;
                case "chat" -> chatSay++;
                case "sual_helli" -> {
                    int ayirici = detal.indexOf(" - ");
                    String fenn = ayirici > 0 ? detal.substring(0, ayirici).trim() : "Digər";
                    if (detal.endsWith("doğru")) {
                        fennCavab.computeIfAbsent(fenn, k -> new int[2])[0]++;
                    } else if (detal.endsWith("səhv")) {
                        fennCavab.computeIfAbsent(fenn, k -> new int[2])[1]++;
                    } else if (detal.contains("sual yaradıldı")) {
                        int[] arr = fennYaradildi.computeIfAbsent(fenn, k -> new int[2]);
                        arr[0]++;
                        var m = SUAL_SAYI_PATTERN.matcher(detal);
                        if (m.find()) arr[1] += Integer.parseInt(m.group(1));
                    }
                }
                case "lesson_create", "lesson_read" -> dersSay++;
                case "exam_start", "exam_complete", "past_exam_start" -> {
                    examSay++;
                    if ("exam_complete".equals(nov) && !detal.isBlank()) examDetallari.add(detal);
                }
                case "flashcard_review" -> flashcardSay++;
                case "bookmark_added" -> bookmarkSay++;
                case "daily_quest" -> planSay++;
                case "study_session" -> studySay++;
                default -> {
                }
            }
        }

        List<Map<String, Object>> lines = new ArrayList<>();
        for (var e : fennCavab.entrySet()) {
            int dogru = e.getValue()[0], sehv = e.getValue()[1];
            lines.add(activityLine("📝", e.getKey() + " fənnindən " + (dogru + sehv) + " sual həll etdi (" + dogru + " doğru, " + sehv + " səhv)"));
        }
        for (var e : fennYaradildi.entrySet()) {
            int defe = e.getValue()[0], cemi = e.getValue()[1];
            String sualQeydi = cemi > 0 ? cemi + " sual" : defe + " dəfə";
            lines.add(activityLine("✨", e.getKey() + " fənnindən " + sualQeydi + " yeni sual yaratdı"));
        }
        if (examSay > 0) {
            String qeyd = examDetallari.isEmpty() ? "" : " — " + String.join(", ", examDetallari);
            lines.add(activityLine("🎯", examSay + " imtahan/sınaq fəaliyyəti" + qeyd));
        }
        if (dersSay > 0) {
            lines.add(activityLine("📘", dersSay + " dərs mövzusuna baxdı"));
        }
        if (chatSay > 0) {
            lines.add(activityLine("💬", "AI Müəllimlə " + chatSay + " dəfə söhbət etdi"));
        }
        if (flashcardSay > 0) {
            lines.add(activityLine("🔁", flashcardSay + " dəfə təkrar kartlarına baxdı"));
        }
        if (studySay > 0) {
            lines.add(activityLine("⏱️", studySay + " dərs seansı keçirdi"));
        }
        if (planSay > 0) {
            lines.add(activityLine("📋", "Günlük planı yerinə yetirdi"));
        }
        if (bookmarkSay > 0) {
            lines.add(activityLine("🔖", bookmarkSay + " əlfəcin (bookmark) əlavə etdi"));
        }
        if (loginSay > 0) {
            lines.add(activityLine("🔑", loginSay + " dəfə daxil oldu"));
        }
        if (lines.isEmpty()) {
            lines.add(activityLine("—", "Fəaliyyət qeydə alınmayıb"));
        }
        return lines;
    }

    private Map<String, Object> activityLine(String icon, String mesaj) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("icon", icon);
        m.put("mesaj", mesaj);
        return m;
    }

    // ==================== MÜƏLLİM TƏRƏFİ ====================

    // Azərbaycan adlarında "ə" səsi çox vaxt "e" ya da "a" kimi yazılır (məs. "Dəmirov" →
    // "Demirov" VƏ YA "Damirov") — müəllim hansını yazsa da eyni tələbəni tapsın deyə axtarış
    // sorğusunun a↔e-DƏYİŞDİRİLMİŞ variantlarını da (mövcud sorğu ilə yanaşı) yoxlayırıq.
    // Müəllim nəticələr arasından özü doğru adı seçəcək, ona görə bir az "geniş" axtarış OK-dir.
    private List<String> searchVariants(String needle) {
        Set<String> variants = new LinkedHashSet<>();
        variants.add(needle);
        variants.add(needle.replace('a', 'e').replace('A', 'E'));
        variants.add(needle.replace('e', 'a').replace('E', 'A'));
        return new ArrayList<>(variants);
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> searchStudents(String sessionId, String q) {
        requireApprovedTeacher(sessionId);
        if (q == null || q.trim().length() < 2) return List.of();
        String needle = q.trim();

        // "Tələbə axtar" bölməsi — BÜTÜN tələbələr göstərilir (fənn/qrup filtri YOX). Müəllim
        // istənilən tələbəyə himayə sorğusu göndərə bilər. (Əvvəlki muellimFenni→qrup filtri
        // istifadəçinin tələbi ilə götürüldü — 2026-08-27.)
        Map<String, Student> byId = new LinkedHashMap<>();
        for (String variant : searchVariants(needle)) {
            studentRepository.findByAdContainingIgnoreCaseOrUsernameContainingIgnoreCase(
                            variant, variant, org.springframework.data.domain.PageRequest.of(0, 15))
                    .forEach(s -> byId.putIfAbsent(s.getId(), s));
        }

        return byId.values().stream()
                .filter(s -> !"muellim".equals(s.getRol()))
                .limit(15)
                .map(s -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("id", s.getId());
                    m.put("ad", s.getAd());
                    m.put("username", s.getUsername());
                    m.put("qrup", s.getQrup());
                    return m;
                }).toList();
    }

    // Müəllim tələbəyə HİMAYƏ SORĞUSU göndərir — dərhal himayəsinə düşmür, tələbə qəbul
    // edənə qədər "GOZLEYIR" statusunda qalır (bax aşağı "TƏLƏBƏ TƏRƏFİ" — respondToRequest).
    @Transactional
    public Map<String, Object> registerStudent(String sessionId, String studentId) {
        Student teacher = requireApprovedTeacher(sessionId);
        Student student = studentService.findByIdOptional(studentId)
                .orElseThrow(() -> ApiException.notFound("Tələbə tapılmadı."));
        TeacherStudent link = teacherStudentRepository.findByTeacherIdAndStudentId(teacher.getId(), studentId)
                .orElse(null);
        if (link == null) {
            link = new TeacherStudent();
            link.setTeacherId(teacher.getId());
            link.setStudentId(studentId);
            link.setStatus("GOZLEYIR");
            teacherStudentRepository.save(link);
        }
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", student.getId());
        m.put("ad", student.getAd());
        m.put("username", student.getUsername());
        m.put("qrup", student.getQrup());
        m.put("status", link.getStatus() != null ? link.getStatus() : "QEBUL_EDILIB");
        return m;
    }

    @Transactional
    public void removeStudent(String sessionId, String studentId) {
        Student teacher = requireApprovedTeacher(sessionId);
        teacherStudentRepository.deleteByTeacherIdAndStudentId(teacher.getId(), studentId);
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> listMyStudents(String sessionId) {
        Student teacher = requireApprovedTeacher(sessionId);
        List<TeacherStudent> links = teacherStudentRepository.findByTeacherId(teacher.getId());
        List<String> ids = links.stream().map(TeacherStudent::getStudentId).toList();
        Map<String, Student> byId = studentService.findAllByIds(ids).stream()
                .collect(Collectors.toMap(Student::getId, s -> s));
        return links.stream()
                .sorted(Comparator.comparing(TeacherStudent::getCreatedAt).reversed())
                .map(link -> {
                    Student s = byId.get(link.getStudentId());
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("id", link.getStudentId());
                    m.put("ad", s != null ? s.getAd() : "Naməlum");
                    m.put("username", s != null ? s.getUsername() : null);
                    m.put("qrup", s != null ? s.getQrup() : null);
                    m.put("lastActiveDate", s != null ? s.getLastActiveDate() : null);
                    m.put("himayeTarixi", link.getCreatedAt());
                    String status = link.getStatus() != null ? link.getStatus() : "QEBUL_EDILIB";
                    m.put("status", status);
                    // Əlaqə məlumatları YALNIZ qəbul edilmiş (öz) tələbələr üçün — müəllim
                    // "Tələbələrim"də tələbənin üstünə basanda telefon/doğum tarixi/email görsün.
                    if (s != null && "QEBUL_EDILIB".equals(status)) {
                        m.put("telefon", s.getTelefon());
                        m.put("dogumTarixi", s.getDogumTarixi());
                        m.put("email", s.getEmail());
                    }
                    return m;
                }).toList();
    }

    @Transactional(readOnly = true)
    public Map<String, Object> studentActivityForTeacher(String sessionId, String studentId) {
        Student teacher = requireApprovedTeacher(sessionId);
        requireLinked(teacher.getId(), studentId);
        return weeklyActivity(studentId);
    }

    @Transactional
    public Map<String, Object> createTask(String sessionId, String studentId, String baslik, List<String> itemMetinleri) {
        Student teacher = requireApprovedTeacher(sessionId);
        requireLinked(teacher.getId(), studentId);
        if (baslik == null || baslik.isBlank()) {
            throw ApiException.badRequest("Tapşırıq başlığı boş ola bilməz.");
        }

        List<Map<String, Object>> items = new ArrayList<>();
        if (itemMetinleri != null) {
            for (String metn : itemMetinleri) {
                if (metn == null || metn.isBlank()) continue;
                Map<String, Object> item = new LinkedHashMap<>();
                item.put("id", UUID.randomUUID().toString().replace("-", ""));
                item.put("metn", metn.trim());
                item.put("tamam", false);
                items.add(item);
            }
        }

        Task task = new Task();
        task.setTeacherId(teacher.getId());
        task.setStudentId(studentId);
        task.setBaslik(baslik.trim());
        task.setItems(JsonUtil.toJson(items));
        task.setAttachments(JsonUtil.toJson(List.of()));
        taskRepository.save(task);
        return toTaskDetail(task);
    }

    @Transactional
    public Map<String, Object> addAttachment(String sessionId, String taskId, String ad, String tip, String data) {
        Student teacher = requireApprovedTeacher(sessionId);
        Task task = requireOwnTask(taskId);
        if (!task.getTeacherId().equals(teacher.getId())) {
            throw ApiException.unauthorized("Bu tapşırıq sizə aid deyil.");
        }
        UploadLimits.check(data);
        List<Map<String, Object>> attachments = parseList(task.getAttachments());
        Map<String, Object> att = new LinkedHashMap<>();
        att.put("id", UUID.randomUUID().toString().replace("-", ""));
        att.put("ad", ad != null ? ad : "fayl");
        att.put("tip", tip);
        att.put("data", data);
        attachments.add(att);
        task.setAttachments(JsonUtil.toJson(attachments));
        taskRepository.save(task);
        return toTaskDetail(task);
    }

    @Transactional
    public void deleteTask(String sessionId, String taskId) {
        Student teacher = requireApprovedTeacher(sessionId);
        Task task = requireOwnTask(taskId);
        if (!task.getTeacherId().equals(teacher.getId())) {
            throw ApiException.unauthorized("Bu tapşırıq sizə aid deyil.");
        }
        taskCommentRepository.deleteByTaskId(taskId);
        taskRepository.deleteById(taskId);
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> listTasksForStudent(String sessionId, String studentId) {
        Student teacher = requireApprovedTeacher(sessionId);
        requireLinked(teacher.getId(), studentId);
        return taskRepository.findByTeacherIdAndStudentIdOrderByCreatedAtDesc(teacher.getId(), studentId)
                .stream().map(this::toTaskDetail).toList();
    }

    @Transactional
    public Map<String, Object> uploadMaterial(String sessionId, String ad, String tip, String data) {
        Student teacher = requireApprovedTeacher(sessionId);
        if (data == null || data.isBlank()) {
            throw ApiException.badRequest("Fayl boş ola bilməz.");
        }
        UploadLimits.check(data);
        TeacherMaterial material = new TeacherMaterial();
        material.setTeacherId(teacher.getId());
        material.setAd(ad != null && !ad.isBlank() ? ad.trim() : "Material");
        material.setTip(tip);
        material.setData(data);
        materialRepository.save(material);
        return toMaterialSummary(material);
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> listMyMaterials(String sessionId) {
        Student teacher = requireApprovedTeacher(sessionId);
        return materialRepository.findByTeacherIdOrderByCreatedAtDesc(teacher.getId())
                .stream().map(this::toMaterialSummary).toList();
    }

    @Transactional
    public void deleteMaterial(String sessionId, String id) {
        Student teacher = requireApprovedTeacher(sessionId);
        TeacherMaterial material = materialRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Material tapılmadı."));
        if (!material.getTeacherId().equals(teacher.getId())) {
            throw ApiException.unauthorized("Bu material sizə aid deyil.");
        }
        materialRepository.deleteById(id);
    }

    @Transactional
    public Map<String, Object> createExam(String sessionId, String baslik, String sened, String telimat) {
        Student teacher = requireApprovedTeacher(sessionId);
        if (baslik == null || baslik.isBlank()) {
            throw ApiException.badRequest("İmtahanın başlığı boş ola bilməz.");
        }
        UploadLimits.check(sened);
        TeacherExam exam = new TeacherExam();
        exam.setTeacherId(teacher.getId());
        exam.setBaslik(baslik.trim());
        exam.setSened(sened);
        exam.setTelimat(telimat);
        examRepository.save(exam);
        return toExamSummary(exam, null);
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> listMyExams(String sessionId) {
        Student teacher = requireApprovedTeacher(sessionId);
        return examRepository.findByTeacherIdOrderByCreatedAtDesc(teacher.getId()).stream()
                .map(exam -> {
                    Map<String, Object> m = toExamSummary(exam, null);
                    List<ExamSubmission> subs = submissionRepository.findByExamIdOrderBySubmittedAtDesc(exam.getId());
                    m.put("gonderilenSay", subs.size());
                    m.put("yoxlanilmamisSay", subs.stream().filter(s -> "GONDERILIB".equals(s.getStatus())).count());
                    return m;
                }).toList();
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> listSubmissions(String sessionId, String examId) {
        Student teacher = requireApprovedTeacher(sessionId);
        TeacherExam exam = examRepository.findById(examId).orElseThrow(() -> ApiException.notFound("İmtahan tapılmadı."));
        if (!exam.getTeacherId().equals(teacher.getId())) {
            throw ApiException.unauthorized("Bu imtahan sizə aid deyil.");
        }
        List<ExamSubmission> subs = submissionRepository.findByExamIdOrderBySubmittedAtDesc(examId);
        Map<String, Student> byId = studentService.findAllByIds(subs.stream().map(ExamSubmission::getStudentId).toList())
                .stream().collect(Collectors.toMap(Student::getId, s -> s));
        return subs.stream().map(s -> {
            Map<String, Object> m = toSubmissionDetail(s);
            Student st = byId.get(s.getStudentId());
            m.put("studentAdi", st != null ? st.getAd() : "Naməlum");
            return m;
        }).toList();
    }

    @Transactional
    public Map<String, Object> giveFeedback(String sessionId, String examId, String submissionId, String feedback, String netice) {
        Student teacher = requireApprovedTeacher(sessionId);
        TeacherExam exam = examRepository.findById(examId).orElseThrow(() -> ApiException.notFound("İmtahan tapılmadı."));
        if (!exam.getTeacherId().equals(teacher.getId())) {
            throw ApiException.unauthorized("Bu imtahan sizə aid deyil.");
        }
        ExamSubmission submission = submissionRepository.findById(submissionId)
                .filter(s -> s.getExamId().equals(examId))
                .orElseThrow(() -> ApiException.notFound("Cavab tapılmadı."));
        submission.setFeedback(feedback);
        submission.setNetice(netice);
        submission.setStatus("YOXLANILIB");
        submission.setReviewedAt(Instant.now());
        submissionRepository.save(submission);
        return toSubmissionDetail(submission);
    }

    // ==================== TƏLƏBƏ TƏRƏFİ ====================

    @Transactional(readOnly = true)
    public List<Map<String, Object>> myTasks(String sessionId) {
        Student student = studentService.findBySessionIdOrThrow(sessionId);
        List<Task> tasks = taskRepository.findByStudentIdOrderByCreatedAtDesc(student.getId());
        Map<String, Student> teachersById = studentService.findAllByIds(
                        tasks.stream().map(Task::getTeacherId).distinct().toList())
                .stream().collect(Collectors.toMap(Student::getId, s -> s));
        return tasks.stream().map(t -> {
            Map<String, Object> m = toTaskDetail(t);
            Student teacher = teachersById.get(t.getTeacherId());
            m.put("muellimAdi", teacher != null ? teacher.getAd() : "Naməlum");
            return m;
        }).toList();
    }

    @Transactional
    public Map<String, Object> toggleTaskItem(String sessionId, String taskId, String itemId) {
        Student student = studentService.findBySessionIdOrThrow(sessionId);
        Task task = requireOwnTask(taskId);
        if (!task.getStudentId().equals(student.getId())) {
            throw ApiException.unauthorized("Bu tapşırıq sizə aid deyil.");
        }
        List<Map<String, Object>> items = parseList(task.getItems());
        for (Map<String, Object> item : items) {
            if (itemId.equals(item.get("id"))) {
                item.put("tamam", !Boolean.TRUE.equals(item.get("tamam")));
            }
        }
        task.setItems(JsonUtil.toJson(items));
        taskRepository.save(task);
        return toTaskDetail(task);
    }

    // Bu tələbənin QƏBUL ETDİYİ (GOZLEYIR YOX) müəllimlərinin id-ləri — materiallar/imtahanlar
    // yalnız bunlardan yayılır.
    private List<String> acceptedTeacherIds(String studentId) {
        return teacherStudentRepository.findByStudentId(studentId).stream()
                .filter(this::isAccepted)
                .map(TeacherStudent::getTeacherId)
                .toList();
    }

    // Tələbənin QƏBUL ETDİYİ müəllim(lər)i — "Müəllimim" panelinin başlıq hissəsində göstərilir,
    // ki tələbə hansı müəllimə bağlı olduğunu görsün (əvvəllər YALNIZ tapşırıq/material/imtahan
    // olanda görünürdü, ümumiyyətlə hansı müəllimə bağlı olduğunu göstərən ayrıca yer yox idi).
    @Transactional(readOnly = true)
    public List<Map<String, Object>> myTeachers(String sessionId) {
        Student student = studentService.findBySessionIdOrThrow(sessionId);
        List<String> teacherIds = acceptedTeacherIds(student.getId());
        if (teacherIds.isEmpty()) return List.of();
        return studentService.findAllByIds(teacherIds).stream()
                .map(t -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("teacherId", t.getId());
                    m.put("ad", t.getAd());
                    m.put("muellimFenni", t.getMuellimFenni());
                    m.put("username", t.getUsername());
                    return m;
                }).toList();
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> myPendingRequests(String sessionId) {
        Student student = studentService.findBySessionIdOrThrow(sessionId);
        List<TeacherStudent> pending = teacherStudentRepository.findByStudentIdAndStatus(student.getId(), "GOZLEYIR");
        Map<String, Student> byId = studentService.findAllByIds(pending.stream().map(TeacherStudent::getTeacherId).toList())
                .stream().collect(Collectors.toMap(Student::getId, s -> s));
        return pending.stream()
                .sorted(Comparator.comparing(TeacherStudent::getCreatedAt).reversed())
                .map(link -> {
                    Student teacher = byId.get(link.getTeacherId());
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("teacherId", link.getTeacherId());
                    m.put("teacherAdi", teacher != null ? teacher.getAd() : "Naməlum");
                    m.put("muellimFenni", teacher != null ? teacher.getMuellimFenni() : null);
                    m.put("tarix", link.getCreatedAt());
                    return m;
                }).toList();
    }

    @Transactional
    public void respondToRequest(String sessionId, String teacherId, boolean accept) {
        Student student = studentService.findBySessionIdOrThrow(sessionId);
        TeacherStudent link = teacherStudentRepository.findByTeacherIdAndStudentId(teacherId, student.getId())
                .filter(l -> "GOZLEYIR".equals(l.getStatus()))
                .orElseThrow(() -> ApiException.notFound("Sorğu tapılmadı."));
        if (accept) {
            link.setStatus("QEBUL_EDILIB");
            teacherStudentRepository.save(link);
        } else {
            teacherStudentRepository.delete(link);
        }
    }

    // Tələbə öz istəyi ilə müəllimin himayəsindən çıxır (müəllimin tələbəsini "atmasının" əksi —
    // bax TeacherPortalService.removeStudent()). Status GOZLEYIR/QEBUL_EDILIB fərqi etmir, hər
    // ikisi silinə bilər (GOZLEYIR üçün artıq respondToRequest(accept=false) eyni işi görür, amma
    // tələbə "Müəllimim" panelindən artıq qəbul etdiyi müəllimdən də ayrıla bilməlidir).
    @Transactional
    public void leaveTeacher(String sessionId, String teacherId) {
        Student student = studentService.findBySessionIdOrThrow(sessionId);
        teacherStudentRepository.deleteByTeacherIdAndStudentId(teacherId, student.getId());
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> myMaterials(String sessionId) {
        Student student = studentService.findBySessionIdOrThrow(sessionId);
        List<String> teacherIds = acceptedTeacherIds(student.getId());
        if (teacherIds.isEmpty()) return List.of();
        return teacherIds.stream()
                .flatMap(tid -> materialRepository.findByTeacherIdOrderByCreatedAtDesc(tid).stream())
                .map(this::toMaterialSummary)
                .sorted((a, b) -> ((Comparable) b.get("createdAt")).compareTo(a.get("createdAt")))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> myExams(String sessionId) {
        Student student = studentService.findBySessionIdOrThrow(sessionId);
        List<String> teacherIds = acceptedTeacherIds(student.getId());
        if (teacherIds.isEmpty()) return List.of();
        return teacherIds.stream()
                .flatMap(tid -> examRepository.findByTeacherIdOrderByCreatedAtDesc(tid).stream())
                .map(exam -> {
                    ExamSubmission own = submissionRepository.findByExamIdAndStudentId(exam.getId(), student.getId()).orElse(null);
                    return toExamSummary(exam, own);
                })
                .sorted((a, b) -> ((Comparable) b.get("createdAt")).compareTo(a.get("createdAt")))
                .toList();
    }

    @Transactional
    public Map<String, Object> submitExam(String sessionId, String examId, String cavab, String sekil) {
        Student student = studentService.findBySessionIdOrThrow(sessionId);
        TeacherExam exam = examRepository.findById(examId).orElseThrow(() -> ApiException.notFound("İmtahan tapılmadı."));
        boolean accepted = teacherStudentRepository.findByTeacherIdAndStudentId(exam.getTeacherId(), student.getId())
                .filter(this::isAccepted).isPresent();
        if (!accepted) {
            throw ApiException.unauthorized("Bu imtahan sizə aid deyil.");
        }
        if ((cavab == null || cavab.isBlank()) && (sekil == null || sekil.isBlank())) {
            throw ApiException.badRequest("Cavab boş ola bilməz.");
        }
        UploadLimits.check(sekil);
        ExamSubmission submission = submissionRepository.findByExamIdAndStudentId(examId, student.getId())
                .orElseGet(ExamSubmission::new);
        submission.setExamId(examId);
        submission.setStudentId(student.getId());
        submission.setCavab(cavab);
        submission.setSekil(sekil);
        submission.setStatus("GONDERILIB");
        submission.setFeedback(null);
        submission.setNetice(null);
        submission.setReviewedAt(null);
        submissionRepository.save(submission);
        return toSubmissionDetail(submission);
    }

    // ==================== ORTAQ (COMMENT) ====================

    @Transactional
    public Map<String, Object> addComment(String sessionId, String taskId, String mesaj) {
        Student student = studentService.findBySessionIdOrThrow(sessionId);
        Task task = requireOwnTask(taskId);
        boolean muellimdi = task.getTeacherId().equals(student.getId());
        boolean telebedi = task.getStudentId().equals(student.getId());
        if (!muellimdi && !telebedi) {
            throw ApiException.unauthorized("Bu tapşırığa şərh yaza bilməzsiniz.");
        }
        if (mesaj == null || mesaj.isBlank()) {
            throw ApiException.badRequest("Şərh boş ola bilməz.");
        }

        TaskComment comment = new TaskComment();
        comment.setTaskId(taskId);
        comment.setAuthorId(student.getId());
        comment.setAuthorRol(muellimdi ? "muellim" : "telebe");
        comment.setMesaj(mesaj.trim());
        taskCommentRepository.save(comment);
        return toTaskDetail(task);
    }

    // ==================== FORMAT KÖMƏKÇİLƏRİ ====================

    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> parseList(String json) {
        if (json == null || json.isBlank()) return new ArrayList<>();
        List<Map<String, Object>> list = JsonUtil.fromJson(json, LIST_OF_MAPS);
        return list != null ? new ArrayList<>(list) : new ArrayList<>();
    }

    private Map<String, Object> toTaskDetail(Task task) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", task.getId());
        m.put("teacherId", task.getTeacherId());
        m.put("studentId", task.getStudentId());
        m.put("baslik", task.getBaslik());
        m.put("items", parseList(task.getItems()));
        m.put("attachments", parseList(task.getAttachments()));
        m.put("createdAt", task.getCreatedAt());
        m.put("updatedAt", task.getUpdatedAt());

        List<TaskComment> comments = taskCommentRepository.findByTaskIdOrderByCreatedAtAsc(task.getId());
        Map<String, String> adiById = studentService.findAllByIds(
                        comments.stream().map(TaskComment::getAuthorId).distinct().toList())
                .stream().collect(Collectors.toMap(Student::getId, Student::getAd));
        m.put("comments", comments.stream().map(c -> {
            Map<String, Object> cm = new LinkedHashMap<>();
            cm.put("id", c.getId());
            cm.put("authorId", c.getAuthorId());
            cm.put("authorAdi", adiById.getOrDefault(c.getAuthorId(), "Naməlum"));
            cm.put("authorRol", c.getAuthorRol());
            cm.put("mesaj", c.getMesaj());
            cm.put("createdAt", c.getCreatedAt());
            return cm;
        }).toList());

        return m;
    }

    private Map<String, Object> toMaterialSummary(TeacherMaterial material) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", material.getId());
        m.put("ad", material.getAd());
        m.put("tip", material.getTip());
        m.put("data", material.getData());
        m.put("createdAt", material.getCreatedAt());
        return m;
    }

    private Map<String, Object> toExamSummary(TeacherExam exam, ExamSubmission own) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", exam.getId());
        m.put("teacherId", exam.getTeacherId());
        m.put("baslik", exam.getBaslik());
        m.put("sened", exam.getSened());
        m.put("telimat", exam.getTelimat());
        m.put("createdAt", exam.getCreatedAt());
        m.put("menimCavabim", own != null ? toSubmissionDetail(own) : null);
        return m;
    }

    private Map<String, Object> toSubmissionDetail(ExamSubmission s) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", s.getId());
        m.put("examId", s.getExamId());
        m.put("studentId", s.getStudentId());
        m.put("cavab", s.getCavab());
        m.put("sekil", s.getSekil());
        m.put("status", s.getStatus());
        m.put("feedback", s.getFeedback());
        m.put("netice", s.getNetice());
        m.put("submittedAt", s.getSubmittedAt());
        m.put("reviewedAt", s.getReviewedAt());
        return m;
    }
}
