package com.aitqdk.magistr.service;

import com.aitqdk.magistr.dto.LoginRequest;
import com.aitqdk.magistr.dto.RegisterRequest;
import com.aitqdk.magistr.entity.Student;
import com.aitqdk.magistr.exception.ApiException;
import com.aitqdk.magistr.repository.StudentRepository;
import com.aitqdk.magistr.repository.SubjectProgressRepository;
import com.aitqdk.magistr.util.DateUtil;
import com.aitqdk.magistr.util.JsonUtil;
import lombok.RequiredArgsConstructor;
import org.mindrot.jbcrypt.BCrypt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {

    private static final Set<String> VALID_QRUPS = Set.of("1", "2", "3", "4", "5", "magistr");
    private static final String PENDING_MESAJ = "Hesabınız hələ təsdiqlənməyib. Admin sənədinizi yoxlayan kimi bu ekranda bildiriş görəcəksiniz.";

    private final StudentRepository studentRepository;
    private final SubjectProgressRepository progressRepository;
    private final ActivityLogService activityLogService;

    @Transactional
    public Map<String, Object> login(LoginRequest req) {
        if (req.getUsername() == null || req.getPassword() == null) {
            throw ApiException.badRequest("İstifadəçi adı və şifrə tələb olunur.");
        }
        String normalized = req.getUsername().trim().toLowerCase();

        Student student = studentRepository.findByUsername(normalized).orElse(null);
        if (student == null || student.getPasswordHash() == null
                || !BCrypt.checkpw(req.getPassword(), student.getPasswordHash())) {
            throw ApiException.unauthorized("İstifadəçi adı və ya şifrə yanlışdır.");
        }
        if ("muellim".equals(student.getRol()) && !"TESDIQLENIB".equals(student.getMuellimStatus())) {
            if ("RED".equals(student.getMuellimStatus())) {
                throw ApiException.unauthorized("Müəllim qeydiyyatınız təsdiqlənməyib.");
            }
            // Xəta əvəzinə "gözləmə" ekranı qaytarılır — frontend statusu canlı izləyir və
            // admin təsdiqləyən/rədd edən an ekranda bildiriş göstərir.
            return pendingResult(student, PENDING_MESAJ);
        }

        int yeniStreak = DateUtil.nextStreak(student.getLastActiveDate(), student.getStreak());
        student.setStreak(yeniStreak);
        student.setLastActiveDate(DateUtil.today());
        student = studentRepository.save(student);

        activityLogService.log(student.getId(), "login");

        List<?> progress = progressRepository.findByStudentId(student.getId());

        Map<String, Object> result = JsonUtil.asMap(student);
        result.remove("passwordHash");
        result.put("progress", progress);
        return result;
    }

    /** Təsdiq gözləyən müəllimin ekranı bu endpoint-i bir neçə saniyədən bir soruşur. */
    @Transactional(readOnly = true)
    public Map<String, Object> teacherStatus(String token) {
        if (token == null || token.isBlank()) {
            throw ApiException.badRequest("Token tələb olunur.");
        }
        Student teacher = studentRepository.findByMuellimStatusToken(token)
                .orElseThrow(() -> ApiException.notFound("Sorğu tapılmadı."));
        return Map.of(
                "status", teacher.getMuellimStatus() != null ? teacher.getMuellimStatus() : "GOZLEYIR",
                "ad", teacher.getAd(),
                "username", teacher.getUsername()
        );
    }

    private Map<String, Object> pendingResult(Student teacher, String mesaj) {
        if (teacher.getMuellimStatusToken() == null) {
            teacher.setMuellimStatusToken("mst_" + UUID.randomUUID().toString().replace("-", ""));
            studentRepository.save(teacher);
        }
        return Map.of(
                "pending", true,
                "mesaj", mesaj,
                "statusToken", teacher.getMuellimStatusToken(),
                "username", teacher.getUsername()
        );
    }

    @Transactional
    public Map<String, Object> register(RegisterRequest req) {
        boolean muellim = "muellim".equals(req.getRol());

        if (req.getUsername() == null || req.getUsername().trim().length() < 3) {
            throw ApiException.badRequest("İstifadəçi adı ən azı 3 simvol olmalıdır.");
        }
        if (req.getPassword() == null || req.getPassword().length() < 4) {
            throw ApiException.badRequest("Şifrə ən azı 4 simvol olmalıdır.");
        }
        if (req.getAd() == null || req.getAd().trim().isEmpty()) {
            throw ApiException.badRequest("Ad və soyad tələb olunur.");
        }
        if (!muellim && (req.getQrup() == null || !VALID_QRUPS.contains(req.getQrup()))) {
            throw ApiException.badRequest("Düzgün qrup seçin.");
        }
        if (req.getTelefon() == null || req.getTelefon().isBlank()) {
            throw ApiException.badRequest("Telefon nömrəsi tələb olunur.");
        }
        if (req.getDogumTarixi() == null || req.getDogumTarixi().isBlank()) {
            throw ApiException.badRequest("Doğum tarixi tələb olunur.");
        }
        if (muellim) {
            if (req.getEmail() == null || req.getEmail().isBlank()) {
                throw ApiException.badRequest("Email tələb olunur.");
            }
            if (req.getMuellimFenni() == null || req.getMuellimFenni().isBlank()) {
                throw ApiException.badRequest("Hansı fənni tədris etdiyinizi qeyd edin.");
            }
            if (req.getMuellimSened() == null || req.getMuellimSened().isBlank()) {
                throw ApiException.badRequest("Təsdiqedici sənədin şəkli tələb olunur.");
            }
            com.aitqdk.magistr.util.UploadLimits.check(req.getMuellimSened());
        }

        String normalized = req.getUsername().trim().toLowerCase();
        if (studentRepository.existsByUsername(normalized)) {
            throw ApiException.conflict("Bu istifadəçi adı artıq işlədilir.");
        }

        Student student = new Student();
        student.setUsername(normalized);
        student.setPasswordHash(BCrypt.hashpw(req.getPassword(), BCrypt.gensalt(10)));
        student.setSessionId("sess_" + UUID.randomUUID().toString().replace("-", ""));
        student.setAd(req.getAd().trim());
        student.setEmail(req.getEmail());
        student.setTelefon(req.getTelefon());
        student.setDogumTarixi(req.getDogumTarixi());
        student.setHedefUniversite("");
        student.setOnboarded(false);
        student.setDiagnosticDone(false);
        student.setStreak(1);
        student.setLastActiveDate(DateUtil.today());

        if (muellim) {
            student.setRol("muellim");
            student.setQrup("muellim");
            student.setMuellimFenni(req.getMuellimFenni().trim());
            student.setMuellimSened(req.getMuellimSened());
            student.setMuellimStatus("GOZLEYIR");
            student = studentRepository.save(student);

            return pendingResult(student, "Qeydiyyat sorğunuz göndərildi. Admin sənədinizi yoxladıqdan sonra (adətən 12 saat ərzində) hesabınız təsdiqlənəcək və bu istifadəçi adı/şifrə ilə daxil ola biləcəksiniz.");
        }

        student.setRol("telebe");
        student.setQrup(req.getQrup());
        student = studentRepository.save(student);

        activityLogService.log(student.getId(), "login");

        return Map.of(
                "id", student.getId(),
                "sessionId", student.getSessionId(),
                "username", student.getUsername(),
                "ad", student.getAd(),
                "qrup", student.getQrup(),
                "onboarded", student.getOnboarded()
        );
    }
}
