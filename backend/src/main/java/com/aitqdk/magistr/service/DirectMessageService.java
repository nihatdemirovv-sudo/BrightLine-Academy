package com.aitqdk.magistr.service;

import com.aitqdk.magistr.entity.DirectMessage;
import com.aitqdk.magistr.entity.Student;
import com.aitqdk.magistr.entity.TeacherStudent;
import com.aitqdk.magistr.exception.ApiException;
import com.aitqdk.magistr.repository.DirectMessageRepository;
import com.aitqdk.magistr.repository.TeacherStudentRepository;
import com.aitqdk.magistr.util.UploadLimits;
import jakarta.annotation.PreDestroy;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Müəllim ↔ tələbə şəxsi söhbəti. YALNIZ qəbul edilmiş himayə əlaqəsi (TeacherStudent) olan
 * cütlər yazışa bilər — əlaqə kəsiləndə söhbət əlçatmaz olur (mesajlar silinmir). Real-vaxt
 * yeniləmə ChatGroupService-dəki eyni SSE pattern-i ilə; açar = "teacherId:studentId".
 */
@Service
@RequiredArgsConstructor
public class DirectMessageService {

    private static final long EMITTER_TIMEOUT_MS = 30L * 60 * 1000;
    private static final long HEARTBEAT_SECONDS = 20;
    private static final String SILINMIS_MESAJ_MATNI = "Mesaj silindi";

    private final StudentService studentService;
    private final TeacherStudentRepository teacherStudentRepository;
    private final DirectMessageRepository messageRepository;

    private final Map<String, CopyOnWriteArrayList<SseEmitter>> emitters = new ConcurrentHashMap<>();
    private final ScheduledExecutorService heartbeatExecutor = Executors.newSingleThreadScheduledExecutor(r -> {
        Thread t = new Thread(r, "dm-sse-heartbeat");
        t.setDaemon(true);
        return t;
    });

    {
        heartbeatExecutor.scheduleAtFixedRate(this::sendHeartbeats, HEARTBEAT_SECONDS, HEARTBEAT_SECONDS, TimeUnit.SECONDS);
    }

    @PreDestroy
    public void shutdown() {
        heartbeatExecutor.shutdownNow();
    }

    /** Söhbətin iki tərəfi — çağıran (me) və qarşı tərəf (partner). */
    private record Pair(Student me, Student teacher, Student student) {
        String key() {
            return teacher.getId() + ":" + student.getId();
        }
    }

    private static boolean isTeacher(Student s) {
        return "muellim".equals(s.getRol());
    }

    // null = köhnə sətir, TeacherPortalService.isAccepted() ilə eyni geriyə-uyğunluq qaydası.
    private static boolean isAccepted(TeacherStudent link) {
        return link.getStatus() == null || "QEBUL_EDILIB".equals(link.getStatus());
    }

    private Pair resolve(String sessionId, String partnerId) {
        Student me = studentService.findBySessionIdOrThrow(sessionId);
        if (isTeacher(me) && !"TESDIQLENIB".equals(me.getMuellimStatus())) {
            throw ApiException.unauthorized("Bu əməliyyat yalnız təsdiqlənmiş müəllimlər üçündür.");
        }
        Student partner = studentService.findByIdOptional(partnerId)
                .orElseThrow(() -> ApiException.notFound("İstifadəçi tapılmadı."));
        Student teacher = isTeacher(me) ? me : partner;
        Student student = isTeacher(me) ? partner : me;
        if (!isTeacher(teacher) || isTeacher(student)) {
            throw ApiException.badRequest("Şəxsi söhbət yalnız müəllim ilə tələbə arasında mümkündür.");
        }
        teacherStudentRepository.findByTeacherIdAndStudentId(teacher.getId(), student.getId())
                .filter(DirectMessageService::isAccepted)
                .orElseThrow(() -> ApiException.unauthorized("Yalnız himayə sorğusu qəbul edilmiş müəllim və tələbə yazışa bilər."));
        return new Pair(me, teacher, student);
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> conversations(String sessionId, Map<String, Instant> seenByKey, Instant floor) {
        Student me = studentService.findBySessionIdOrThrow(sessionId);
        boolean teacherMe = isTeacher(me);
        if (teacherMe && !"TESDIQLENIB".equals(me.getMuellimStatus())) {
            return List.of();
        }
        List<TeacherStudent> links = (teacherMe
                ? teacherStudentRepository.findByTeacherId(me.getId())
                : teacherStudentRepository.findByStudentId(me.getId()))
                .stream().filter(DirectMessageService::isAccepted).toList();
        List<String> partnerIds = links.stream()
                .map(l -> teacherMe ? l.getStudentId() : l.getTeacherId()).toList();
        Map<String, Student> partners = studentService.findAllByIds(partnerIds).stream()
                .collect(Collectors.toMap(Student::getId, Function.identity()));

        List<Map<String, Object>> result = new ArrayList<>();
        for (TeacherStudent link : links) {
            String partnerId = teacherMe ? link.getStudentId() : link.getTeacherId();
            Student partner = partners.get(partnerId);
            if (partner == null) continue;

            Map<String, Object> m = new LinkedHashMap<>();
            m.put("partnerId", partnerId);
            m.put("ad", partner.getAd());
            m.put("altBaslik", teacherMe ? qrupLabel(partner.getQrup()) : partner.getMuellimFenni());
            m.put("muellimdi", isTeacher(partner));
            messageRepository.findTopByTeacherIdAndStudentIdOrderByCreatedAtDesc(link.getTeacherId(), link.getStudentId())
                    .ifPresent(last -> {
                        boolean silinib = Boolean.TRUE.equals(last.getSilinib());
                        m.put("sonMesaj", silinib ? SILINMIS_MESAJ_MATNI
                                : (last.getMesaj() == null || last.getMesaj().isBlank()) && last.getSekil() != null ? "📷 Şəkil" : last.getMesaj());
                        m.put("sonMesajVaxti", last.getCreatedAt());
                        m.put("sonGonderenMenem", last.getSenderId().equals(me.getId()));
                    });
            m.put("oxunmamis", unreadCount(link.getTeacherId(), link.getStudentId(), me.getId(),
                    after(floor, seenByKey.get("dm:" + partnerId))));
            result.add(m);
        }
        result.sort(Comparator.comparing((Map<String, Object> m) -> (Instant) m.get("sonMesajVaxti"),
                Comparator.nullsLast(Comparator.reverseOrder())));
        return result;
    }

    /** Oxunmamış sayğac üçün (UnreadService) — bütün söhbətlər üzrə partnerId → say. */
    @Transactional(readOnly = true)
    public Map<String, Long> unreadByPartner(Student me, Map<String, Instant> seenByKey, Instant floor) {
        boolean teacherMe = isTeacher(me);
        Map<String, Long> result = new LinkedHashMap<>();
        if (teacherMe && !"TESDIQLENIB".equals(me.getMuellimStatus())) return result;
        List<TeacherStudent> links = teacherMe
                ? teacherStudentRepository.findByTeacherId(me.getId())
                : teacherStudentRepository.findByStudentId(me.getId());
        for (TeacherStudent link : links) {
            if (!isAccepted(link)) continue;
            String partnerId = teacherMe ? link.getStudentId() : link.getTeacherId();
            long n = unreadCount(link.getTeacherId(), link.getStudentId(), me.getId(),
                    after(floor, seenByKey.get("dm:" + partnerId)));
            if (n > 0) result.put(partnerId, n);
        }
        return result;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> thread(String sessionId, String partnerId) {
        return toDetail(resolve(sessionId, partnerId));
    }

    @Transactional
    public Map<String, Object> send(String sessionId, String partnerId, String mesaj, String sekil) {
        Pair pair = resolve(sessionId, partnerId);
        boolean sekilVar = sekil != null && !sekil.isBlank();
        if ((mesaj == null || mesaj.isBlank()) && !sekilVar) {
            throw ApiException.badRequest("Mesaj boş ola bilməz.");
        }
        if (mesaj != null && mesaj.length() > 5000) {
            throw ApiException.badRequest("Mesaj çox uzundur (maksimum 5000 simvol).");
        }
        UploadLimits.check(sekil);

        DirectMessage message = new DirectMessage();
        message.setTeacherId(pair.teacher().getId());
        message.setStudentId(pair.student().getId());
        message.setSenderId(pair.me().getId());
        message.setMesaj(mesaj != null ? mesaj.trim() : "");
        if (sekilVar) message.setSekil(sekil);
        messageRepository.save(message);

        Map<String, Object> detail = toDetail(pair);
        broadcast(pair.key(), detail);
        return detail;
    }

    @Transactional
    public Map<String, Object> delete(String sessionId, String partnerId, String messageId) {
        Pair pair = resolve(sessionId, partnerId);
        DirectMessage message = messageRepository.findById(messageId)
                .filter(m -> m.getTeacherId().equals(pair.teacher().getId()) && m.getStudentId().equals(pair.student().getId()))
                .orElseThrow(() -> ApiException.notFound("Mesaj tapılmadı."));
        if (!message.getSenderId().equals(pair.me().getId())) {
            throw ApiException.unauthorized("Yalnız öz mesajını silə bilərsən.");
        }
        message.setSilinib(true);
        message.setMesaj("");
        message.setSekil(null);
        messageRepository.save(message);

        Map<String, Object> detail = toDetail(pair);
        broadcast(pair.key(), detail);
        return detail;
    }

    public SseEmitter subscribe(String sessionId, String partnerId) {
        return register(resolve(sessionId, partnerId).key());
    }

    // Hesab silinərkən (AccountService) — bu şəxsin iştirak etdiyi bütün şəxsi söhbətlər silinir.
    @Transactional
    public void cleanupForDeletedAccount(String id) {
        messageRepository.deleteByTeacherId(id);
        messageRepository.deleteByStudentId(id);
    }

    // ==================== KÖMƏKÇİ ====================

    private long unreadCount(String teacherId, String studentId, String meId, Instant after) {
        return messageRepository.countByTeacherIdAndStudentIdAndSenderIdNotAndSilinibFalseAndCreatedAtAfter(
                teacherId, studentId, meId, after);
    }

    private static Instant after(Instant floor, Instant seen) {
        return seen != null && seen.isAfter(floor) ? seen : floor;
    }

    private static String qrupLabel(String qrup) {
        if (qrup == null) return null;
        return "magistr".equals(qrup) ? "Magistr" : qrup + "-ci qrup";
    }

    private Map<String, Object> toDetail(Pair pair) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("teacher", person(pair.teacher(), pair.teacher().getMuellimFenni()));
        m.put("student", person(pair.student(), qrupLabel(pair.student().getQrup())));

        List<DirectMessage> latestFirst = new ArrayList<>(
                messageRepository.findTop200ByTeacherIdAndStudentIdOrderByCreatedAtDesc(pair.teacher().getId(), pair.student().getId()));
        Collections.reverse(latestFirst);
        m.put("mesajlar", latestFirst.stream().map(msg -> {
            Map<String, Object> mm = new LinkedHashMap<>();
            boolean silinib = Boolean.TRUE.equals(msg.getSilinib());
            mm.put("id", msg.getId());
            mm.put("senderId", msg.getSenderId());
            mm.put("silinib", silinib);
            mm.put("mesaj", silinib ? SILINMIS_MESAJ_MATNI : msg.getMesaj());
            mm.put("sekil", silinib ? null : msg.getSekil());
            mm.put("createdAt", msg.getCreatedAt());
            return mm;
        }).toList());
        return m;
    }

    private static Map<String, Object> person(Student s, String altBaslik) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", s.getId());
        m.put("ad", s.getAd());
        m.put("altBaslik", altBaslik);
        return m;
    }

    private SseEmitter register(String key) {
        SseEmitter emitter = new SseEmitter(EMITTER_TIMEOUT_MS);
        CopyOnWriteArrayList<SseEmitter> list = emitters.computeIfAbsent(key, k -> new CopyOnWriteArrayList<>());
        list.add(emitter);
        emitter.onCompletion(() -> list.remove(emitter));
        emitter.onTimeout(() -> { list.remove(emitter); emitter.complete(); });
        emitter.onError((e) -> list.remove(emitter));
        try {
            emitter.send(SseEmitter.event().name("ready").data("ok"));
        } catch (IOException e) {
            list.remove(emitter);
        }
        return emitter;
    }

    private void broadcast(String key, Map<String, Object> detail) {
        CopyOnWriteArrayList<SseEmitter> list = emitters.get(key);
        if (list == null || list.isEmpty()) return;
        for (SseEmitter emitter : list) {
            try {
                emitter.send(SseEmitter.event().name("dm").data(detail));
            } catch (Exception e) {
                list.remove(emitter);
            }
        }
    }

    private void sendHeartbeats() {
        emitters.forEach((key, list) -> {
            for (SseEmitter emitter : list) {
                try {
                    emitter.send(SseEmitter.event().comment("ping"));
                } catch (Exception e) {
                    list.remove(emitter);
                }
            }
        });
    }
}
