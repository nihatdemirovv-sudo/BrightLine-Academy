package com.aitqdk.magistr.service;

import com.aitqdk.magistr.entity.ChatGroupMember;
import com.aitqdk.magistr.entity.SeenMarker;
import com.aitqdk.magistr.entity.Student;
import com.aitqdk.magistr.entity.SupportTicket;
import com.aitqdk.magistr.entity.Task;
import com.aitqdk.magistr.entity.TeacherExam;
import com.aitqdk.magistr.entity.TeacherStudent;
import com.aitqdk.magistr.exception.ApiException;
import com.aitqdk.magistr.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Bütün bölmələr üzrə "oxunmamış" sayğacları (nav badge-ləri: "3", "99+"). Hər bölmə/söhbət
 * üçün SeenMarker-də "son baxış" vaxtı saxlanılır — sayğac ondan SONRA yaranan, başqasının
 * göndərdiyi məlumatı sayır. Marker yoxdursa FLOOR istifadə olunur ki, bu funksiyadan əvvəlki
 * köhnə məlumat birdən-birə yüzlərlə "yeni" kimi görünməsin.
 */
@Service
@RequiredArgsConstructor
public class UnreadService {

    public static final Instant FLOOR = Instant.parse("2026-10-09T00:00:00Z");

    private final StudentService studentService;
    private final SeenMarkerRepository seenMarkerRepository;
    private final ChatGroupMemberRepository groupMemberRepository;
    private final ChatGroupMessageRepository groupMessageRepository;
    private final SupportTicketRepository supportTicketRepository;
    private final SupportMessageRepository supportMessageRepository;
    private final ArenaNotificationRepository arenaNotificationRepository;
    private final TeacherStudentRepository teacherStudentRepository;
    private final TaskRepository taskRepository;
    private final TaskCommentRepository taskCommentRepository;
    private final TeacherMaterialRepository teacherMaterialRepository;
    private final TeacherExamRepository teacherExamRepository;
    private final ExamSubmissionRepository examSubmissionRepository;
    private final DirectMessageService directMessageService;

    @Transactional
    public void markSeen(String sessionId, String key) {
        Student me = studentService.findBySessionIdOrThrow(sessionId);
        if (key == null || key.isBlank() || key.length() > 160) {
            throw ApiException.badRequest("Yanlış açar.");
        }
        SeenMarker marker = seenMarkerRepository.findByStudentIdAndKey(me.getId(), key).orElseGet(() -> {
            SeenMarker m = new SeenMarker();
            m.setStudentId(me.getId());
            m.setKey(key);
            return m;
        });
        marker.setSeenAt(Instant.now());
        try {
            seenMarkerRepository.save(marker);
        } catch (DataIntegrityViolationException ignored) {
            // eyni anda gələn iki sorğu eyni marker-i yaratmağa çalışdı — biri kifayətdir
        }
    }

    @Transactional(readOnly = true)
    public Map<String, Instant> seenMap(String studentId) {
        return seenMarkerRepository.findByStudentId(studentId).stream()
                .collect(Collectors.toMap(SeenMarker::getKey, SeenMarker::getSeenAt, (a, b) -> a));
    }

    @Transactional(readOnly = true)
    public Map<String, Object> counts(String sessionId) {
        Student me = studentService.findBySessionIdOrThrow(sessionId);
        Map<String, Instant> seen = seenMap(me.getId());
        boolean teacher = "muellim".equals(me.getRol());

        Map<String, Object> result = new LinkedHashMap<>();

        // Qruplar — üzv olduğu hər qrup üzrə (qoşulma / "söhbəti təmizlə" anından əvvəlkilər sayılmır).
        Map<String, Long> groupItems = new LinkedHashMap<>();
        for (ChatGroupMember mem : groupMemberRepository.findByStudentId(me.getId())) {
            Instant after = latest(FLOOR, mem.getJoinedAt(), mem.getClearedAt(), seen.get("group:" + mem.getGroupId()));
            long n = groupMessageRepository.countByGroupIdAndSenderIdNotAndSilinibFalseAndCreatedAtAfter(
                    mem.getGroupId(), me.getId(), after);
            if (n > 0) groupItems.put(mem.getGroupId(), n);
        }
        result.put("groups", section(groupItems));

        // Dəstək — admin cavabları.
        Map<String, Long> supportItems = new LinkedHashMap<>();
        for (SupportTicket ticket : supportTicketRepository.findByStudentIdOrderByUpdatedAtDesc(me.getId())) {
            long n = supportMessageRepository.countByTicketIdAndGonderenAndCreatedAtAfter(
                    ticket.getId(), "ADMIN", latest(FLOOR, seen.get("support:" + ticket.getId())));
            if (n > 0) supportItems.put(ticket.getId(), n);
        }
        result.put("support", section(supportItems));

        // Şəxsi mesajlar (müəllim ↔ tələbə).
        result.put("messages", section(directMessageService.unreadByPartner(me, seen, FLOOR)));

        if (teacher) {
            List<String> examIds = teacherExamRepository.findByTeacherIdOrderByCreatedAtDesc(me.getId()).stream()
                    .map(TeacherExam::getId).toList();
            // Yoxlanılmamış imtahan cavabları — müəllim baxıb qiymət verənə qədər qalır.
            result.put("exams", examIds.isEmpty() ? 0L : examSubmissionRepository.countByExamIdInAndStatus(examIds, "GONDERILIB"));

            List<String> taskIds = taskRepository.findByTeacherId(me.getId()).stream().map(Task::getId).toList();
            result.put("students", taskIds.isEmpty() ? 0L : taskCommentRepository.countByTaskIdInAndAuthorRolAndCreatedAtAfter(
                    taskIds, "telebe", latest(FLOOR, seen.get("t:students"))));
        } else {
            result.put("arena", arenaNotificationRepository.countByStudentIdAndOxunubFalse(me.getId()));

            List<TeacherStudent> links = teacherStudentRepository.findByStudentId(me.getId());
            long requests = links.stream().filter(l -> "GOZLEYIR".equals(l.getStatus())).count();
            List<String> teacherIds = links.stream()
                    .filter(l -> l.getStatus() == null || "QEBUL_EDILIB".equals(l.getStatus()))
                    .map(TeacherStudent::getTeacherId).toList();

            Instant tasksAfter = latest(FLOOR, seen.get("mt:tasks"));
            List<String> myTaskIds = taskRepository.findByStudentIdOrderByCreatedAtDesc(me.getId()).stream()
                    .map(Task::getId).toList();
            long tasks = taskRepository.countByStudentIdAndCreatedAtAfter(me.getId(), tasksAfter)
                    + (myTaskIds.isEmpty() ? 0 : taskCommentRepository.countByTaskIdInAndAuthorRolAndCreatedAtAfter(myTaskIds, "muellim", tasksAfter));
            long materials = teacherIds.isEmpty() ? 0
                    : teacherMaterialRepository.countByTeacherIdInAndCreatedAtAfter(teacherIds, latest(FLOOR, seen.get("mt:materials")));
            Instant examsAfter = latest(FLOOR, seen.get("mt:exams"));
            long exams = (teacherIds.isEmpty() ? 0 : teacherExamRepository.countByTeacherIdInAndCreatedAtAfter(teacherIds, examsAfter))
                    + examSubmissionRepository.countByStudentIdAndReviewedAtAfter(me.getId(), examsAfter);

            Map<String, Object> myTeacher = new LinkedHashMap<>();
            myTeacher.put("total", requests + tasks + materials + exams);
            myTeacher.put("requests", requests);
            myTeacher.put("tasks", tasks);
            myTeacher.put("materials", materials);
            myTeacher.put("exams", exams);
            result.put("myTeacher", myTeacher);
        }
        return result;
    }

    private static Map<String, Object> section(Map<String, Long> items) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("total", items.values().stream().mapToLong(Long::longValue).sum());
        m.put("items", items);
        return m;
    }

    private static Instant latest(Instant... values) {
        Instant max = null;
        for (Instant v : values) {
            if (v != null && (max == null || v.isAfter(max))) max = v;
        }
        return max;
    }
}
