package com.aitqdk.magistr.service;

import com.aitqdk.magistr.entity.Student;
import com.aitqdk.magistr.entity.SupportMessage;
import com.aitqdk.magistr.entity.SupportTicket;
import com.aitqdk.magistr.exception.ApiException;
import com.aitqdk.magistr.repository.SupportMessageRepository;
import com.aitqdk.magistr.repository.SupportTicketRepository;
import com.aitqdk.magistr.util.UploadLimits;
import jakarta.annotation.PreDestroy;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

/**
 * Tələbə-Admin dəstək (ticket) sistemi. Tələbə problem üzrə ticket açır, admin panel
 * bütün ticket-ləri görür və cavab yazır. AI heç bir yerdə iştirak etmir — sadə mesajlaşma.
 * Real-vaxt yeniləmə SSE (Server-Sent Events) ilə — WebSocket-dən sadədir, tək istiqamətli
 * server→client push kifayət edir (client mesaj göndərməni artıq mövcud REST /reply ilə edir).
 */
@Service
@RequiredArgsConstructor
public class SupportService {

    private static final long EMITTER_TIMEOUT_MS = 30L * 60 * 1000; // 30 dəqiqə
    private static final long HEARTBEAT_SECONDS = 20; // proxy/load-balancer boş qalan bağlantını kəsməsin deyə

    private final StudentService studentService;
    private final SupportTicketRepository ticketRepository;
    private final SupportMessageRepository messageRepository;

    // ticketId -> canlı abunəçilər (bir ticket-i həm tələbə, həm admin eyni anda aça bilər)
    private final Map<String, CopyOnWriteArrayList<SseEmitter>> emitters = new ConcurrentHashMap<>();
    private final ScheduledExecutorService heartbeatExecutor = Executors.newSingleThreadScheduledExecutor(r -> {
        Thread t = new Thread(r, "support-sse-heartbeat");
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

    // ==================== TƏLƏBƏ TƏRƏFİ ====================

    @Transactional
    public Map<String, Object> createTicket(String sessionId, String movzu, String mesaj, String sekil) {
        Student student = studentService.findBySessionIdOrThrow(sessionId);
        if (movzu == null || movzu.isBlank()) {
            throw ApiException.badRequest("Mövzu boş ola bilməz.");
        }
        UploadLimits.check(sekil);
        boolean sekilVar = sekil != null && !sekil.isBlank();
        if ((mesaj == null || mesaj.isBlank()) && !sekilVar) {
            throw ApiException.badRequest("Problemin təsvirini yaz.");
        }

        SupportTicket ticket = new SupportTicket();
        ticket.setStudentId(student.getId());
        ticket.setMovzu(movzu.trim());
        ticket.setStatus("ACIQ");
        ticketRepository.save(ticket);

        SupportMessage message = new SupportMessage();
        message.setTicketId(ticket.getId());
        message.setGonderen("STUDENT");
        message.setMesaj(mesaj != null ? mesaj.trim() : "");
        if (sekilVar) {
            message.setSekil(sekil);
        }
        messageRepository.save(message);

        return toSummary(ticket);
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> listTickets(String sessionId) {
        Student student = studentService.findBySessionIdOrThrow(sessionId);
        return ticketRepository.findByStudentIdOrderByUpdatedAtDesc(student.getId())
                .stream().map(this::toSummary).toList();
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getTicket(String sessionId, String ticketId) {
        Student student = studentService.findBySessionIdOrThrow(sessionId);
        SupportTicket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> ApiException.notFound("Müraciət tapılmadı."));
        if (!ticket.getStudentId().equals(student.getId())) {
            throw ApiException.notFound("Müraciət tapılmadı.");
        }
        return toDetail(ticket);
    }

    @Transactional
    public Map<String, Object> addStudentReply(String sessionId, String ticketId, String mesaj, String sekil) {
        Student student = studentService.findBySessionIdOrThrow(sessionId);
        SupportTicket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> ApiException.notFound("Müraciət tapılmadı."));
        if (!ticket.getStudentId().equals(student.getId())) {
            throw ApiException.notFound("Müraciət tapılmadı.");
        }
        UploadLimits.check(sekil);
        boolean sekilVar = sekil != null && !sekil.isBlank();
        if ((mesaj == null || mesaj.isBlank()) && !sekilVar) {
            throw ApiException.badRequest("Mesaj boş ola bilməz.");
        }

        SupportMessage message = new SupportMessage();
        message.setTicketId(ticket.getId());
        message.setGonderen("STUDENT");
        message.setMesaj(mesaj != null ? mesaj.trim() : "");
        if (sekilVar) {
            message.setSekil(sekil);
        }
        messageRepository.save(message);

        ticket.setStatus("ACIQ");
        ticketRepository.save(ticket);

        Map<String, Object> detail = toDetail(ticket);
        broadcast(ticket.getId(), detail);
        return detail;
    }

    public SseEmitter subscribeStudent(String sessionId, String ticketId) {
        Student student = studentService.findBySessionIdOrThrow(sessionId);
        SupportTicket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> ApiException.notFound("Müraciət tapılmadı."));
        if (!ticket.getStudentId().equals(student.getId())) {
            throw ApiException.notFound("Müraciət tapılmadı.");
        }
        return register(ticketId);
    }

    // ==================== ADMIN TƏRƏFİ ====================

    @Transactional(readOnly = true)
    public List<Map<String, Object>> listAllForAdmin() {
        return ticketRepository.findAllByOrderByUpdatedAtDesc()
                .stream().map(this::toAdminSummary).toList();
    }

    // Admin panelin "Dəstək" tab badge-i — cavab gözləyən (ACIQ) müraciətlərin sayı.
    @Transactional(readOnly = true)
    public long countOpenTickets() {
        return ticketRepository.countByStatus("ACIQ");
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getTicketForAdmin(String ticketId) {
        SupportTicket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> ApiException.notFound("Müraciət tapılmadı."));
        Map<String, Object> detail = toDetail(ticket);
        studentService.findByIdOptional(ticket.getStudentId()).ifPresent(s -> {
            detail.put("telebeAdi", s.getAd());
            detail.put("telebeUsername", s.getUsername());
        });
        return detail;
    }

    @Transactional
    public Map<String, Object> addAdminReply(String ticketId, String mesaj, String sekil) {
        SupportTicket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> ApiException.notFound("Müraciət tapılmadı."));
        UploadLimits.check(sekil);
        boolean sekilVar = sekil != null && !sekil.isBlank();
        if ((mesaj == null || mesaj.isBlank()) && !sekilVar) {
            throw ApiException.badRequest("Mesaj boş ola bilməz.");
        }

        SupportMessage message = new SupportMessage();
        message.setTicketId(ticket.getId());
        message.setGonderen("ADMIN");
        message.setMesaj(mesaj != null ? mesaj.trim() : "");
        if (sekilVar) {
            message.setSekil(sekil);
        }
        messageRepository.save(message);

        ticket.setStatus("CAVABLANDI");
        ticketRepository.save(ticket);

        Map<String, Object> detail = getTicketForAdmin(ticketId);
        broadcast(ticketId, detail);
        return detail;
    }

    @Transactional
    public Map<String, Object> setStatus(String ticketId, String status) {
        SupportTicket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> ApiException.notFound("Müraciət tapılmadı."));
        if (!"ACIQ".equals(status) && !"CAVABLANDI".equals(status) && !"BAGLI".equals(status)) {
            throw ApiException.badRequest("Yanlış status.");
        }
        ticket.setStatus(status);
        ticketRepository.save(ticket);
        Map<String, Object> detail = getTicketForAdmin(ticketId);
        broadcast(ticketId, detail);
        return detail;
    }

    public SseEmitter subscribeAdmin(String ticketId) {
        if (!ticketRepository.existsById(ticketId)) {
            throw ApiException.notFound("Müraciət tapılmadı.");
        }
        return register(ticketId);
    }

    @Transactional
    public void deleteTicket(String ticketId) {
        if (!ticketRepository.existsById(ticketId)) {
            throw ApiException.notFound("Müraciət tapılmadı.");
        }
        CopyOnWriteArrayList<SseEmitter> list = emitters.remove(ticketId);
        if (list != null) {
            list.forEach(SseEmitter::complete);
        }
        messageRepository.deleteByTicketId(ticketId);
        ticketRepository.deleteById(ticketId);
    }

    // ==================== KÖMƏKÇİ ====================

    private SseEmitter register(String ticketId) {
        SseEmitter emitter = new SseEmitter(EMITTER_TIMEOUT_MS);
        CopyOnWriteArrayList<SseEmitter> list = emitters.computeIfAbsent(ticketId, k -> new CopyOnWriteArrayList<>());
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

    private void broadcast(String ticketId, Map<String, Object> detail) {
        CopyOnWriteArrayList<SseEmitter> list = emitters.get(ticketId);
        if (list == null || list.isEmpty()) return;
        for (SseEmitter emitter : list) {
            try {
                emitter.send(SseEmitter.event().name("ticket").data(detail));
            } catch (Exception e) {
                list.remove(emitter);
            }
        }
    }

    private void sendHeartbeats() {
        emitters.forEach((ticketId, list) -> {
            for (SseEmitter emitter : list) {
                try {
                    emitter.send(SseEmitter.event().comment("ping"));
                } catch (Exception e) {
                    list.remove(emitter);
                }
            }
        });
    }

    private Map<String, Object> toSummary(SupportTicket ticket) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", ticket.getId());
        m.put("movzu", ticket.getMovzu());
        m.put("status", ticket.getStatus());
        m.put("createdAt", ticket.getCreatedAt());
        m.put("updatedAt", ticket.getUpdatedAt());
        List<SupportMessage> messages = messageRepository.findByTicketIdOrderByCreatedAtAsc(ticket.getId());
        m.put("mesajSayi", messages.size());
        if (!messages.isEmpty()) {
            SupportMessage son = messages.get(messages.size() - 1);
            m.put("sonMesaj", (son.getMesaj() == null || son.getMesaj().isBlank()) && son.getSekil() != null
                    ? "📷 Şəkil"
                    : son.getMesaj());
            m.put("sonGonderen", son.getGonderen());
        }
        return m;
    }

    private Map<String, Object> toAdminSummary(SupportTicket ticket) {
        Map<String, Object> m = toSummary(ticket);
        studentService.findByIdOptional(ticket.getStudentId()).ifPresent(s -> {
            m.put("telebeAdi", s.getAd());
            m.put("telebeUsername", s.getUsername());
        });
        return m;
    }

    private Map<String, Object> toDetail(SupportTicket ticket) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", ticket.getId());
        m.put("movzu", ticket.getMovzu());
        m.put("status", ticket.getStatus());
        m.put("createdAt", ticket.getCreatedAt());
        m.put("updatedAt", ticket.getUpdatedAt());
        List<Map<String, Object>> mesajlar = messageRepository.findByTicketIdOrderByCreatedAtAsc(ticket.getId())
                .stream().map(msg -> {
                    Map<String, Object> mm = new LinkedHashMap<>();
                    mm.put("id", msg.getId());
                    mm.put("gonderen", msg.getGonderen());
                    mm.put("mesaj", msg.getMesaj());
                    mm.put("sekil", msg.getSekil());
                    mm.put("createdAt", msg.getCreatedAt());
                    return mm;
                }).toList();
        m.put("mesajlar", mesajlar);
        return m;
    }
}
