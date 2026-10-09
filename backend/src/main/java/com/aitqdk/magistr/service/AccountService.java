package com.aitqdk.magistr.service;

import com.aitqdk.magistr.entity.Student;
import com.aitqdk.magistr.entity.SupportTicket;
import com.aitqdk.magistr.entity.TeacherExam;
import com.aitqdk.magistr.exception.ApiException;
import com.aitqdk.magistr.repository.*;
import lombok.RequiredArgsConstructor;
import org.mindrot.jbcrypt.BCrypt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;

/** Şifrə dəyişmə + hesab silmə — həm tələbə/müəllim özü (sessionId+şifrə ilə), həm admin
 * (birbaşa id ilə, şifrəsiz — admin panelin özü artıq qapıdır). Hesab silmə bütün fənn
 * proqresi/tapşırıq/material/qrup/dəstək tarixçəsini TAM təmizləyir — geri qaytarıla bilməz. */
@Service
@RequiredArgsConstructor
public class AccountService {

    private final StudentService studentService;
    private final StudentRepository studentRepository;
    private final ChatGroupService chatGroupService;
    private final ArenaService arenaService;
    private final DirectMessageService directMessageService;
    private final SeenMarkerRepository seenMarkerRepository;

    // SettingsService.reset()-dəki eyni siyahı (bax orada) + bu sessiyada əlavə olunan yeni cədvəllər.
    private final SubjectProgressRepository progressRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final QuestionSetRepository questionSetRepository;
    private final DailyQuestRepository dailyQuestRepository;
    private final ParentReportRepository parentReportRepository;
    private final ActivityRepository activityRepository;
    private final BookmarkRepository bookmarkRepository;
    private final StudentAchievementRepository achievementRepository;
    private final StudySessionRepository studySessionRepository;
    private final ExamAttemptRepository examAttemptRepository;
    private final ScoreSimulationRepository scoreSimulationRepository;
    private final ErrorPatternRepository errorPatternRepository;
    private final FlashcardRepository flashcardRepository;
    private final WeakTopicRepository weakTopicRepository;
    private final MiniLessonRepository miniLessonRepository;
    private final ExamConfigRepository examConfigRepository;
    private final StudentSettingsRepository settingsRepository;
    private final StudentResumeRepository resumeRepository;

    private final TeacherStudentRepository teacherStudentRepository;
    private final TaskRepository taskRepository;
    private final TeacherMaterialRepository materialRepository;
    private final TeacherExamRepository examRepository;
    private final ExamSubmissionRepository submissionRepository;
    private final SupportTicketRepository supportTicketRepository;
    private final SupportMessageRepository supportMessageRepository;

    @Transactional
    public Map<String, Object> changePassword(String sessionId, String oldPassword, String newPassword) {
        Student student = studentService.findBySessionIdOrThrow(sessionId);
        if (student.getPasswordHash() == null || oldPassword == null
                || !BCrypt.checkpw(oldPassword, student.getPasswordHash())) {
            throw ApiException.unauthorized("Köhnə şifrə yanlışdır.");
        }
        if (newPassword == null || newPassword.length() < 4) {
            throw ApiException.badRequest("Yeni şifrə ən azı 4 simvol olmalıdır.");
        }
        student.setPasswordHash(BCrypt.hashpw(newPassword, BCrypt.gensalt(10)));
        studentRepository.save(student);
        return Map.of("success", true, "mesaj", "Şifrə dəyişdirildi.");
    }

    @Transactional
    public void deleteOwnAccount(String sessionId, String password) {
        Student student = studentService.findBySessionIdOrThrow(sessionId);
        if (student.getPasswordHash() == null || password == null
                || !BCrypt.checkpw(password, student.getPasswordHash())) {
            throw ApiException.unauthorized("Şifrə yanlışdır.");
        }
        deleteAccountData(student.getId());
    }

    @Transactional
    public void deleteAccountByAdmin(String studentId) {
        if (!studentRepository.existsById(studentId)) {
            throw ApiException.notFound("İstifadəçi tapılmadı.");
        }
        deleteAccountData(studentId);
    }

    private void deleteAccountData(String id) {
        progressRepository.deleteByStudentId(id);
        chatMessageRepository.deleteByStudentId(id);
        questionSetRepository.deleteByStudentId(id);
        dailyQuestRepository.deleteByStudentId(id);
        parentReportRepository.deleteByStudentId(id);
        activityRepository.deleteByStudentId(id);
        bookmarkRepository.deleteByStudentId(id);
        achievementRepository.deleteByStudentId(id);
        studySessionRepository.deleteByStudentId(id);
        examAttemptRepository.deleteByStudentId(id);
        scoreSimulationRepository.deleteByStudentId(id);
        errorPatternRepository.deleteByStudentId(id);
        flashcardRepository.deleteByStudentId(id);
        weakTopicRepository.deleteByStudentId(id);
        miniLessonRepository.deleteByStudentId(id);
        examConfigRepository.deleteByStudentId(id);
        settingsRepository.deleteByStudentId(id);
        resumeRepository.deleteByStudentId(id);

        // Dəstək müraciətləri (tələbə tərəfi) — əvvəlcə mesajlar, sonra ticket-lər.
        var myTickets = supportTicketRepository.findByStudentIdOrderByUpdatedAtDesc(id);
        for (SupportTicket ticket : myTickets) {
            supportMessageRepository.deleteByTicketId(ticket.getId());
        }
        supportTicketRepository.deleteAll(myTickets);

        // Müəllim-tələbə əlaqələri — hər iki istiqamətdə (bu şəxs ya tələbə, ya müəllim tərəf ola bilər).
        teacherStudentRepository.deleteByStudentId(id);
        teacherStudentRepository.deleteByTeacherId(id);

        // Tapşırıqlar — həm bu şəxsin ALDIĞI (tələbə), həm AÇDIĞI (müəllim) tapşırıqlar.
        taskRepository.deleteByStudentId(id);
        taskRepository.deleteByTeacherId(id);

        // Materiallar (müəllim tərəfi).
        materialRepository.deleteByTeacherId(id);

        // İmtahanlar (müəllim tərəfi) — əvvəlcə hər imtahanın cavablarını, sonra imtahanların özünü sil.
        for (TeacherExam exam : examRepository.findByTeacherIdOrderByCreatedAtDesc(id)) {
            submissionRepository.deleteByExamId(exam.getId());
        }
        examRepository.deleteByTeacherId(id);
        // Bu şəxsin (tələbə kimi) BAŞQA müəllimlərin imtahanlarına göndərdiyi cavablar.
        submissionRepository.deleteByStudentId(id);

        // Qruplar — yaratdıqları tam dağıdılır, üzvü olduqları qruplardan üzvlüyü silinir.
        chatGroupService.cleanupForDeletedAccount(id);

        // Bilik Arenası — yaratdıqları müsabiqələr tam silinir, iştirakçılığı və bildirişləri təmizlənir.
        arenaService.cleanupForDeletedAccount(id);

        // Müəllim ↔ tələbə şəxsi söhbətləri və oxunmamış sayğac işarələri.
        directMessageService.cleanupForDeletedAccount(id);
        seenMarkerRepository.deleteByStudentId(id);

        studentRepository.deleteById(id);
    }
}
