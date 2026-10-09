package com.aitqdk.magistr.service;

import com.aitqdk.magistr.entity.Student;
import com.aitqdk.magistr.entity.TeacherStudent;
import com.aitqdk.magistr.exception.ApiException;
import com.aitqdk.magistr.repository.StudentRepository;
import com.aitqdk.magistr.repository.TeacherStudentRepository;
import com.aitqdk.magistr.util.JsonUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/** Admin panelin "Müəllimlər" tabı — gözləyən/təsdiqlənmiş müəllimlər, təsdiq/rədd, himayə siyahısı. */
@Service
@RequiredArgsConstructor
public class TeacherAdminService {

    private final StudentRepository studentRepository;
    private final TeacherStudentRepository teacherStudentRepository;
    private final StudentService studentService;
    private final TeacherPortalService teacherPortalService;

    @Transactional(readOnly = true)
    public List<Map<String, Object>> listPending() {
        return studentRepository.findByRolAndMuellimStatus("muellim", "GOZLEYIR").stream()
                .sorted(Comparator.comparing(Student::getCreatedAt).reversed())
                .map(this::toSummary)
                .toList();
    }

    // Admin bildiriş sorğusu üçün yüngül siyahı (sənəd şəkli DAXİL DEYİL — tez-tez çağırılır).
    @Transactional(readOnly = true)
    public List<Map<String, Object>> listPendingBrief() {
        return studentRepository.findByRolAndMuellimStatus("muellim", "GOZLEYIR").stream()
                .sorted(Comparator.comparing(Student::getCreatedAt).reversed())
                .map(t -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("id", t.getId());
                    m.put("ad", t.getAd());
                    m.put("muellimFenni", t.getMuellimFenni());
                    m.put("createdAt", t.getCreatedAt());
                    return m;
                })
                .toList();
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> listApproved() {
        return studentRepository.findByRolAndMuellimStatus("muellim", "TESDIQLENIB").stream()
                .sorted(Comparator.comparing(Student::getCreatedAt).reversed())
                .map(t -> {
                    Map<String, Object> m = toSummary(t);
                    m.put("telebeSayi", teacherStudentRepository.countByTeacherId(t.getId()));
                    return m;
                })
                .toList();
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> listRejected() {
        return studentRepository.findByRolAndMuellimStatus("muellim", "RED").stream()
                .sorted(Comparator.comparing(Student::getCreatedAt).reversed())
                .map(this::toSummary)
                .toList();
    }

    @Transactional(readOnly = true)
    public Map<String, Object> detail(String id) {
        Student teacher = studentRepository.findById(id).orElseThrow(() -> ApiException.notFound("Müəllim tapılmadı."));
        if (!"muellim".equals(teacher.getRol())) {
            throw ApiException.notFound("Müəllim tapılmadı.");
        }

        Map<String, Object> m = JsonUtil.asMap(teacher);
        m.remove("passwordHash");
        m.remove("sessionId");

        List<TeacherStudent> links = teacherStudentRepository.findByTeacherId(id);
        Map<String, Student> byId = studentService.findAllByIds(links.stream().map(TeacherStudent::getStudentId).toList())
                .stream().collect(Collectors.toMap(Student::getId, s -> s));
        List<Map<String, Object>> telebeler = links.stream()
                .sorted(Comparator.comparing(TeacherStudent::getCreatedAt).reversed())
                .map(link -> {
                    Student s = byId.get(link.getStudentId());
                    Map<String, Object> tm = new LinkedHashMap<>();
                    tm.put("id", link.getStudentId());
                    tm.put("ad", s != null ? s.getAd() : "Naməlum");
                    tm.put("username", s != null ? s.getUsername() : null);
                    tm.put("qrup", s != null ? s.getQrup() : null);
                    tm.put("himayeTarixi", link.getCreatedAt());
                    return tm;
                }).toList();
        m.put("telebeler", telebeler);

        return m;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> studentActivity(String studentId) {
        return teacherPortalService.weeklyActivity(studentId);
    }

    @Transactional
    public void approve(String id) {
        Student teacher = studentRepository.findById(id).orElseThrow(() -> ApiException.notFound("Müəllim tapılmadı."));
        teacher.setMuellimStatus("TESDIQLENIB");
        studentRepository.save(teacher);
    }

    @Transactional
    public void reject(String id) {
        Student teacher = studentRepository.findById(id).orElseThrow(() -> ApiException.notFound("Müəllim tapılmadı."));
        teacher.setMuellimStatus("RED");
        studentRepository.save(teacher);
    }

    private Map<String, Object> toSummary(Student teacher) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", teacher.getId());
        m.put("ad", teacher.getAd());
        m.put("username", teacher.getUsername());
        m.put("email", teacher.getEmail());
        m.put("telefon", teacher.getTelefon());
        m.put("dogumTarixi", teacher.getDogumTarixi());
        m.put("muellimFenni", teacher.getMuellimFenni());
        m.put("muellimSened", teacher.getMuellimSened());
        m.put("createdAt", teacher.getCreatedAt());
        return m;
    }
}
