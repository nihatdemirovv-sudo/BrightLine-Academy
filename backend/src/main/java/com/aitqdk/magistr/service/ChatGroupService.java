package com.aitqdk.magistr.service;

import com.aitqdk.magistr.entity.ChatGroup;
import com.aitqdk.magistr.entity.ChatGroupMember;
import com.aitqdk.magistr.entity.ChatGroupMessage;
import com.aitqdk.magistr.entity.ChatGroupMessageHide;
import com.aitqdk.magistr.entity.Student;
import com.aitqdk.magistr.entity.TeacherStudent;
import com.aitqdk.magistr.exception.ApiException;
import com.aitqdk.magistr.repository.ChatGroupMemberRepository;
import com.aitqdk.magistr.repository.ChatGroupMessageHideRepository;
import com.aitqdk.magistr.repository.ChatGroupMessageRepository;
import com.aitqdk.magistr.repository.ChatGroupRepository;
import com.aitqdk.magistr.repository.TeacherStudentRepository;
import com.aitqdk.magistr.util.UploadLimits;
import jakarta.annotation.PreDestroy;
import lombok.RequiredArgsConstructor;
import org.mindrot.jbcrypt.BCrypt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.time.Instant;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

/**
 * Tələbələr üçün şifrə ilə qorunan qrup söhbəti (WhatsApp qrupu tərzi). Qrupu yaradan
 * tələbə həmin qrupun "inzibatçısı" olur (frontend-də "Müəllim" tag-ı ilə göstərilir) —
 * üzv çıxara, mesaj silə, qrup adını/şifrəsini dəyişə, qrupu bağlaya/dağıda bilir. Qalan
 * tələbələr qrup adı + şifrə ilə qoşulur, öz mesajlarını redaktə/silə, istənilən mesaja
 * cavab yaza, söhbəti (fərdi) təmizləyə, qrupdan çıxa bilir. Sistem admini (admin panel)
 * bütün qrupları şifrəsiz görə/oxuya bilir, amma bu, ADİ ÜZVLÜK YARATMIR — admin heç bir
 * qrupun üzv siyahısında görünmür. Real-vaxt mesajlaşma SupportService-dəki eyni SSE
 * (Server-Sent Events) pattern-i ilə.
 */
@Service
@RequiredArgsConstructor
public class ChatGroupService {

    private static final long EMITTER_TIMEOUT_MS = 30L * 60 * 1000; // 30 dəqiqə
    private static final long HEARTBEAT_SECONDS = 20;
    private static final String SILINMIS_MESAJ_MATNI = "Mesaj silindi";

    private final StudentService studentService;
    private final ChatGroupRepository groupRepository;
    private final ChatGroupMemberRepository memberRepository;
    private final ChatGroupMessageRepository messageRepository;
    private final TeacherStudentRepository teacherStudentRepository;
    private final ChatGroupMessageHideRepository messageHideRepository;

    // groupId -> canlı abunəçilər (üzvlər VƏ admin panel eyni qrupa eyni anda abunə ola bilər)
    private final Map<String, CopyOnWriteArrayList<SseEmitter>> emitters = new ConcurrentHashMap<>();
    private final ScheduledExecutorService heartbeatExecutor = Executors.newSingleThreadScheduledExecutor(r -> {
        Thread t = new Thread(r, "chat-group-sse-heartbeat");
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

    @Transactional(readOnly = true)
    public List<Map<String, Object>> listGroups(String sessionId) {
        Student student = studentService.findBySessionIdOrThrow(sessionId);
        return groupRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(g -> toBrowseSummary(g, student.getId()))
                .toList();
    }

    @Transactional
    public Map<String, Object> createGroup(String sessionId, String ad, String sifre, List<String> memberIds) {
        Student student = studentService.findBySessionIdOrThrow(sessionId);
        if (ad == null || ad.trim().isEmpty()) {
            throw ApiException.badRequest("Qrup adı boş ola bilməz.");
        }
        if (sifre == null || sifre.length() < 4) {
            throw ApiException.badRequest("Şifrə ən azı 4 simvol olmalıdır.");
        }
        boolean muellimdi = "muellim".equals(student.getRol());
        if (!muellimdi && groupRepository.existsByYaradiciId(student.getId())) {
            throw ApiException.badRequest("Yalnız 1 qrup yarada bilərsiniz. Əvvəlcə mövcud qrupunuzu dağıdın.");
        }

        ChatGroup group = new ChatGroup();
        group.setAd(ad.trim());
        group.setPasswordHash(BCrypt.hashpw(sifre, BCrypt.gensalt(10)));
        group.setYaradiciId(student.getId());
        group.setQapali(false);
        groupRepository.save(group);

        ChatGroupMember member = new ChatGroupMember();
        member.setGroupId(group.getId());
        member.setStudentId(student.getId());
        memberRepository.save(member);

        // Müəllim öz TƏLƏBƏLƏRİNİ (yalnız qəbul edilmiş) qrup yaradarkən birbaşa üzv əlavə edə bilər —
        // şifrə tələb olunmur, çünki müəllim onların artıq etibar etdiyi tərəfdir.
        if (muellimdi && memberIds != null) {
            Set<String> acceptedStudentIds = teacherStudentRepository.findByTeacherId(student.getId()).stream()
                    .filter(l -> l.getStatus() == null || "QEBUL_EDILIB".equals(l.getStatus()))
                    .map(TeacherStudent::getStudentId)
                    .collect(java.util.stream.Collectors.toSet());
            for (String studentId : memberIds) {
                if (!acceptedStudentIds.contains(studentId) || studentId.equals(student.getId())) continue;
                ChatGroupMember m = new ChatGroupMember();
                m.setGroupId(group.getId());
                m.setStudentId(studentId);
                memberRepository.save(m);
            }
        }

        return toDetail(group, student.getId());
    }

    @Transactional
    public Map<String, Object> joinGroup(String sessionId, String groupId, String sifre) {
        Student student = studentService.findBySessionIdOrThrow(sessionId);
        ChatGroup group = groupRepository.findById(groupId)
                .orElseThrow(() -> ApiException.notFound("Qrup tapılmadı."));

        boolean alreadyMember = memberRepository.existsByGroupIdAndStudentId(groupId, student.getId());
        if (!alreadyMember) {
            if (sifre == null || !BCrypt.checkpw(sifre, group.getPasswordHash())) {
                throw ApiException.unauthorized("Şifrə yanlışdır.");
            }
            ChatGroupMember member = new ChatGroupMember();
            member.setGroupId(group.getId());
            member.setStudentId(student.getId());
            memberRepository.save(member);
        }

        return toDetail(group, student.getId());
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getGroup(String sessionId, String groupId) {
        Student student = studentService.findBySessionIdOrThrow(sessionId);
        ChatGroup group = groupRepository.findById(groupId)
                .orElseThrow(() -> ApiException.notFound("Qrup tapılmadı."));
        requireMember(groupId, student.getId());
        return toDetail(group, student.getId());
    }

    @Transactional
    public Map<String, Object> addMessage(String sessionId, String groupId, String mesaj, String sekil, String ses, String cavabId) {
        Student student = studentService.findBySessionIdOrThrow(sessionId);
        ChatGroup group = groupRepository.findById(groupId)
                .orElseThrow(() -> ApiException.notFound("Qrup tapılmadı."));
        requireMember(groupId, student.getId());
        if (Boolean.TRUE.equals(group.getQapali())) {
            throw ApiException.unauthorized("Qrup bağlıdır, mesaj yazıla bilməz.");
        }
        if (Boolean.TRUE.equals(group.getYalnizAdminYaza()) && !group.getYaradiciId().equals(student.getId())) {
            throw ApiException.unauthorized("Bu qrupda yalnız İnzibatçı yaza bilər.");
        }
        boolean sekilVar = sekil != null && !sekil.isBlank();
        boolean sesVar = ses != null && !ses.isBlank();
        if ((mesaj == null || mesaj.isBlank()) && !sekilVar && !sesVar) {
            throw ApiException.badRequest("Mesaj boş ola bilməz.");
        }
        UploadLimits.check(sekil);
        UploadLimits.check(ses);

        ChatGroupMessage message = new ChatGroupMessage();
        message.setGroupId(groupId);
        message.setSenderId(student.getId());
        message.setMesaj(mesaj != null ? mesaj.trim() : "");
        if (sekilVar) message.setSekil(sekil);
        if (sesVar) message.setSes(ses);
        if (cavabId != null && !cavabId.isBlank()) {
            // cavablanan mesajın HƏQİQƏTƏN bu qrupa aid olduğunu yoxla (başqa qrupun id-si "sızmasın")
            messageRepository.findById(cavabId)
                    .filter(orig -> orig.getGroupId().equals(groupId))
                    .ifPresent(orig -> message.setCavabId(orig.getId()));
        }
        messageRepository.save(message);

        Map<String, Object> detail = toDetail(group, student.getId());
        // Yayım NEYTRAL olmalıdır — "Məndən sil" filtri və "Söhbəti təmizlə" tarixi şəxsidir, yalnız sorğu edənə.
        broadcast(groupId, toDetail(group, null));
        return detail;
    }

    @Transactional
    public Map<String, Object> editMessage(String sessionId, String groupId, String messageId, String mesaj) {
        Student student = studentService.findBySessionIdOrThrow(sessionId);
        ChatGroup group = groupRepository.findById(groupId)
                .orElseThrow(() -> ApiException.notFound("Qrup tapılmadı."));
        requireMember(groupId, student.getId());

        ChatGroupMessage message = messageRepository.findById(messageId)
                .filter(m -> m.getGroupId().equals(groupId))
                .orElseThrow(() -> ApiException.notFound("Mesaj tapılmadı."));
        if (!message.getSenderId().equals(student.getId())) {
            throw ApiException.unauthorized("Yalnız öz mesajını redaktə edə bilərsən.");
        }
        if (Boolean.TRUE.equals(message.getSilinib())) {
            throw ApiException.badRequest("Silinmiş mesaj redaktə edilə bilməz.");
        }
        if (mesaj == null || mesaj.isBlank()) {
            throw ApiException.badRequest("Mesaj boş ola bilməz.");
        }

        message.setMesaj(mesaj.trim());
        message.setRedaktaEdilib(true);
        messageRepository.save(message);

        Map<String, Object> detail = toDetail(group, student.getId());
        // Yayım NEYTRAL olmalıdır — "Məndən sil" filtri və "Söhbəti təmizlə" tarixi şəxsidir, yalnız sorğu edənə.
        broadcast(groupId, toDetail(group, null));
        return detail;
    }

    @Transactional
    public Map<String, Object> deleteMessage(String sessionId, String groupId, String messageId) {
        Student student = studentService.findBySessionIdOrThrow(sessionId);
        ChatGroup group = groupRepository.findById(groupId)
                .orElseThrow(() -> ApiException.notFound("Qrup tapılmadı."));
        requireMember(groupId, student.getId());

        ChatGroupMessage message = messageRepository.findById(messageId)
                .filter(m -> m.getGroupId().equals(groupId))
                .orElseThrow(() -> ApiException.notFound("Mesaj tapılmadı."));
        boolean menInzibatciyam = group.getYaradiciId().equals(student.getId());
        if (!message.getSenderId().equals(student.getId()) && !menInzibatciyam) {
            throw ApiException.unauthorized("Bu mesajı silmək icazən yoxdur.");
        }

        tombstone(message);
        messageRepository.save(message);

        Map<String, Object> detail = toDetail(group, student.getId());
        // Yayım NEYTRAL olmalıdır — "Məndən sil" filtri və "Söhbəti təmizlə" tarixi şəxsidir, yalnız sorğu edənə.
        broadcast(groupId, toDetail(group, null));
        return detail;
    }

    // "Məndən sil" — mesaj DİGƏR üzvlərə toxunulmadan qalır, YALNIZ bu tələbənin öz görünüşündən
    // yox olur. Buna görə broadcast EDİLMİR (başqalarının ekranı dəyişməməlidir) — yalnız çağıran
    // tələbənin öz sorğusuna fərdiləşdirilmiş nəticə qaytarılır.
    @Transactional
    public Map<String, Object> hideMessageForMe(String sessionId, String groupId, String messageId) {
        Student student = studentService.findBySessionIdOrThrow(sessionId);
        ChatGroup group = groupRepository.findById(groupId)
                .orElseThrow(() -> ApiException.notFound("Qrup tapılmadı."));
        requireMember(groupId, student.getId());

        ChatGroupMessage message = messageRepository.findById(messageId)
                .filter(m -> m.getGroupId().equals(groupId))
                .orElseThrow(() -> ApiException.notFound("Mesaj tapılmadı."));

        if (!messageHideRepository.existsByStudentIdAndMessageId(student.getId(), message.getId())) {
            ChatGroupMessageHide hide = new ChatGroupMessageHide();
            hide.setStudentId(student.getId());
            hide.setMessageId(message.getId());
            messageHideRepository.save(hide);
        }

        return toDetail(group, student.getId());
    }

    @Transactional
    public Map<String, Object> updateSettings(String sessionId, String groupId, String ad, String sifre) {
        Student student = studentService.findBySessionIdOrThrow(sessionId);
        ChatGroup group = groupRepository.findById(groupId)
                .orElseThrow(() -> ApiException.notFound("Qrup tapılmadı."));
        requireInzibatci(group, student.getId());

        if (ad != null && !ad.isBlank()) {
            group.setAd(ad.trim());
        }
        if (sifre != null && !sifre.isBlank()) {
            if (sifre.length() < 4) {
                throw ApiException.badRequest("Şifrə ən azı 4 simvol olmalıdır.");
            }
            group.setPasswordHash(BCrypt.hashpw(sifre, BCrypt.gensalt(10)));
        }
        groupRepository.save(group);

        Map<String, Object> detail = toDetail(group, student.getId());
        // Yayım NEYTRAL olmalıdır — "Məndən sil" filtri və "Söhbəti təmizlə" tarixi şəxsidir, yalnız sorğu edənə.
        broadcast(groupId, toDetail(group, null));
        return detail;
    }

    @Transactional
    public Map<String, Object> setClosed(String sessionId, String groupId, boolean qapali) {
        Student student = studentService.findBySessionIdOrThrow(sessionId);
        ChatGroup group = groupRepository.findById(groupId)
                .orElseThrow(() -> ApiException.notFound("Qrup tapılmadı."));
        requireInzibatci(group, student.getId());

        group.setQapali(qapali);
        groupRepository.save(group);

        Map<String, Object> detail = toDetail(group, student.getId());
        // Yayım NEYTRAL olmalıdır — "Məndən sil" filtri və "Söhbəti təmizlə" tarixi şəxsidir, yalnız sorğu edənə.
        broadcast(groupId, toDetail(group, null));
        return detail;
    }

    @Transactional
    public Map<String, Object> setMute(String sessionId, String groupId, boolean yalnizAdminYaza) {
        Student student = studentService.findBySessionIdOrThrow(sessionId);
        ChatGroup group = groupRepository.findById(groupId)
                .orElseThrow(() -> ApiException.notFound("Qrup tapılmadı."));
        requireInzibatci(group, student.getId());

        group.setYalnizAdminYaza(yalnizAdminYaza);
        groupRepository.save(group);

        Map<String, Object> detail = toDetail(group, student.getId());
        // Yayım NEYTRAL olmalıdır — "Məndən sil" filtri və "Söhbəti təmizlə" tarixi şəxsidir, yalnız sorğu edənə.
        broadcast(groupId, toDetail(group, null));
        return detail;
    }

    @Transactional
    public Map<String, Object> kickMember(String sessionId, String groupId, String memberId) {
        Student student = studentService.findBySessionIdOrThrow(sessionId);
        ChatGroup group = groupRepository.findById(groupId)
                .orElseThrow(() -> ApiException.notFound("Qrup tapılmadı."));
        requireInzibatci(group, student.getId());
        if (memberId.equals(group.getYaradiciId())) {
            throw ApiException.badRequest("İnzibatçı özünü qrupdan çıxara bilməz.");
        }
        memberRepository.deleteByGroupIdAndStudentId(groupId, memberId);

        Map<String, Object> detail = toDetail(group, student.getId());
        // Yayım NEYTRAL olmalıdır — "Məndən sil" filtri və "Söhbəti təmizlə" tarixi şəxsidir, yalnız sorğu edənə.
        broadcast(groupId, toDetail(group, null));
        return detail;
    }

    // "Söhbəti təmizlə" — YALNIZ çağıran üçün fərdi, digər üzvlərə heç bir təsiri yoxdur,
    // heç bir broadcast lazım deyil (başqasının görünüşü dəyişmir).
    @Transactional
    public Map<String, Object> clearChat(String sessionId, String groupId) {
        Student student = studentService.findBySessionIdOrThrow(sessionId);
        ChatGroup group = groupRepository.findById(groupId)
                .orElseThrow(() -> ApiException.notFound("Qrup tapılmadı."));
        ChatGroupMember member = memberRepository.findByGroupIdAndStudentId(groupId, student.getId())
                .orElseThrow(() -> ApiException.notFound("Bu qrupun üzvü deyilsən."));

        member.setClearedAt(Instant.now());
        memberRepository.save(member);

        return toDetail(group, student.getId());
    }

    // "Söhbəti sil" — YALNIZ adi üzvlər üçün (inzibatçı qrupu dağıtmalıdır): öz mesajlarını
    // (hamı üçün) tombstone edir, sonra qrupdan çıxır. Bu, tələbənin qrupdan çıxma üsuludur.
    @Transactional
    public void deleteChatAndLeave(String sessionId, String groupId) {
        Student student = studentService.findBySessionIdOrThrow(sessionId);
        ChatGroup group = groupRepository.findById(groupId)
                .orElseThrow(() -> ApiException.notFound("Qrup tapılmadı."));
        requireMember(groupId, student.getId());
        if (group.getYaradiciId().equals(student.getId())) {
            throw ApiException.badRequest("İnzibatçı (Müəllim) qrupdan bu üsulla çıxa bilməz — qrupu dağıda bilər.");
        }

        List<ChatGroupMessage> mine = messageRepository.findByGroupIdOrderByCreatedAtAsc(groupId).stream()
                .filter(msg -> msg.getSenderId().equals(student.getId()) && !Boolean.TRUE.equals(msg.getSilinib()))
                .toList();
        mine.forEach(this::tombstone);
        messageRepository.saveAll(mine);

        memberRepository.deleteByGroupIdAndStudentId(groupId, student.getId());

        Map<String, Object> detail = toDetail(group, null);
        // Yayım NEYTRAL olmalıdır — "Məndən sil" filtri və "Söhbəti təmizlə" tarixi şəxsidir, yalnız sorğu edənə.
        broadcast(groupId, toDetail(group, null));
    }

    // Qrupu tam dağıtmaq (YALNIZ inzibatçı/Müəllim) — admin panelin `deleteGroup`-u ilə eyni
    // təmizləmə addımlarını paylaşır.
    @Transactional
    public void disbandGroup(String sessionId, String groupId) {
        Student student = studentService.findBySessionIdOrThrow(sessionId);
        ChatGroup group = groupRepository.findById(groupId)
                .orElseThrow(() -> ApiException.notFound("Qrup tapılmadı."));
        requireInzibatci(group, student.getId());
        deleteGroupInternal(groupId);
    }

    public SseEmitter subscribeStudent(String sessionId, String groupId) {
        Student student = studentService.findBySessionIdOrThrow(sessionId);
        requireMember(groupId, student.getId());
        return register(groupId);
    }

    // ==================== ADMIN TƏRƏFİ ====================
    // Sistem admini (admin panel) HEÇ BİR şifrə/üzvlük yaratmadan bütün qrupları görə/oxuya bilir.

    @Transactional(readOnly = true)
    public List<Map<String, Object>> listAllForAdmin() {
        return groupRepository.findAllByOrderByCreatedAtDesc().stream().map(this::toAdminSummary).toList();
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getGroupForAdmin(String groupId) {
        ChatGroup group = groupRepository.findById(groupId)
                .orElseThrow(() -> ApiException.notFound("Qrup tapılmadı."));
        return toDetail(group, null);
    }

    public SseEmitter subscribeAdmin(String groupId) {
        if (!groupRepository.existsById(groupId)) {
            throw ApiException.notFound("Qrup tapılmadı.");
        }
        return register(groupId);
    }

    @Transactional
    public void deleteGroup(String groupId) {
        if (!groupRepository.existsById(groupId)) {
            throw ApiException.notFound("Qrup tapılmadı.");
        }
        deleteGroupInternal(groupId);
    }

    // Hesab silinərkən çağırılır (AccountService) — yaratdığı bütün qrupları TAM DAĞIDIR
    // (digər üzvlər üçün də), qalan (özü yaratmadığı) qruplardan sadəcə ÜZVLÜYÜNÜ silir —
    // qrupun özü və digər üzvlərin mesaj tarixçəsi qorunur.
    @Transactional
    public void cleanupForDeletedAccount(String studentId) {
        for (ChatGroup group : groupRepository.findAllByOrderByCreatedAtDesc()) {
            if (studentId.equals(group.getYaradiciId())) {
                deleteGroupInternal(group.getId());
            }
        }
        memberRepository.findByStudentId(studentId).forEach(mem ->
                memberRepository.deleteByGroupIdAndStudentId(mem.getGroupId(), studentId));
    }

    // ==================== KÖMƏKÇİ ====================

    private void deleteGroupInternal(String groupId) {
        CopyOnWriteArrayList<SseEmitter> list = emitters.remove(groupId);
        if (list != null) {
            list.forEach(SseEmitter::complete);
        }
        messageRepository.deleteByGroupId(groupId);
        memberRepository.deleteByGroupId(groupId);
        groupRepository.deleteById(groupId);
    }

    private void tombstone(ChatGroupMessage message) {
        message.setSilinib(true);
        message.setMesaj("");
        message.setSekil(null);
        message.setSes(null);
    }

    private void requireMember(String groupId, String studentId) {
        if (!memberRepository.existsByGroupIdAndStudentId(groupId, studentId)) {
            throw ApiException.notFound("Bu qrupun üzvü deyilsən.");
        }
    }

    private void requireInzibatci(ChatGroup group, String studentId) {
        if (!group.getYaradiciId().equals(studentId)) {
            throw ApiException.unauthorized("Yalnız qrupun inzibatçısı (Müəllim) bunu edə bilər.");
        }
    }

    private SseEmitter register(String groupId) {
        SseEmitter emitter = new SseEmitter(EMITTER_TIMEOUT_MS);
        CopyOnWriteArrayList<SseEmitter> list = emitters.computeIfAbsent(groupId, k -> new CopyOnWriteArrayList<>());
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

    private void broadcast(String groupId, Map<String, Object> detail) {
        CopyOnWriteArrayList<SseEmitter> list = emitters.get(groupId);
        if (list == null || list.isEmpty()) return;
        for (SseEmitter emitter : list) {
            try {
                emitter.send(SseEmitter.event().name("group").data(detail));
            } catch (Exception e) {
                list.remove(emitter);
            }
        }
    }

    private void sendHeartbeats() {
        emitters.forEach((groupId, list) -> {
            for (SseEmitter emitter : list) {
                try {
                    emitter.send(SseEmitter.event().comment("ping"));
                } catch (Exception e) {
                    list.remove(emitter);
                }
            }
        });
    }

    private Map<String, Object> toBrowseSummary(ChatGroup group, String viewerStudentId) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", group.getId());
        m.put("ad", group.getAd());
        m.put("createdAt", group.getCreatedAt());
        m.put("uzvSayi", memberRepository.countByGroupId(group.getId()));
        m.put("daxilOlub", memberRepository.existsByGroupIdAndStudentId(group.getId(), viewerStudentId));
        return m;
    }

    private Map<String, Object> toAdminSummary(ChatGroup group) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", group.getId());
        m.put("ad", group.getAd());
        m.put("createdAt", group.getCreatedAt());
        m.put("qapali", group.getQapali());
        m.put("uzvSayi", memberRepository.countByGroupId(group.getId()));
        m.put("mesajSayi", messageRepository.countByGroupId(group.getId()));
        studentService.findByIdOptional(group.getYaradiciId()).ifPresent(s -> m.put("inzibatciAdi", s.getAd()));
        return m;
    }

    // Adları TƏK bir batch sorğu ilə (N+1 əvəzinə) yükləyir — hər mesaj/üzv üçün ayrıca DB
    // gedişi elə real-vaxt hisslənən gecikmə yaradırdı (məs. mesaj silinəndə bütün siyahı
    // yenidən qurulur, hər sətir üçün ayrı SELECT olanda bu ciddi ləngimə idi).
    //
    // viewerStudentId — bu detalı ALAN şəxsin id-si (admin üçün null): YALNIZ "menimClearedAt"
    // sahəsi üçün istifadə olunur (həmin şəxsin "Söhbəti təmizlə" tarixi). DİQQƏT: bu Map
    // SSE ilə DİGƏR abunəçilərə də (broadcast) EYNİLƏ göndərilir — "menimClearedAt" onlar üçün
    // düzgün OLMAYA BİLƏR, ona görə frontend bu sahəni YALNIZ birbaşa (SSE-siz) öz sorğusunun
    // cavabından oxumalıdır, SSE push-larından gələn dəyərə etibar etməməlidir (bax groups.tsx).
    // Mesaj siyahısının özü (kim nə yazıb) bütün abunəçilər üçün EYNİDİR, ona görə bu, funksional
    // problem yaratmır — sadəcə "hardan oxunmalı" qaydasıdır.
    private Map<String, Object> toDetail(ChatGroup group, String viewerStudentId) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", group.getId());
        m.put("ad", group.getAd());
        m.put("yaradiciId", group.getYaradiciId());
        m.put("qapali", group.getQapali());
        m.put("yalnizAdminYaza", Boolean.TRUE.equals(group.getYalnizAdminYaza()));
        m.put("createdAt", group.getCreatedAt());

        List<ChatGroupMember> memberRows = memberRepository.findByGroupIdOrderByJoinedAtAsc(group.getId());
        List<ChatGroupMessage> rawMessages = messageRepository.findByGroupIdOrderByCreatedAtAsc(group.getId());

        Set<String> studentIds = new LinkedHashSet<>();
        memberRows.forEach(mem -> studentIds.add(mem.getStudentId()));
        rawMessages.forEach(msg -> studentIds.add(msg.getSenderId()));
        Map<String, String> adiById = new HashMap<>();
        Map<String, Boolean> muellimdiById = new HashMap<>();
        studentService.findAllByIds(studentIds).forEach(s -> {
            adiById.put(s.getId(), s.getAd());
            muellimdiById.put(s.getId(), "muellim".equals(s.getRol()));
        });

        List<Map<String, Object>> members = memberRows.stream()
                .map(mem -> {
                    Map<String, Object> mm = new LinkedHashMap<>();
                    mm.put("studentId", mem.getStudentId());
                    mm.put("ad", adiById.getOrDefault(mem.getStudentId(), "Naməlum"));
                    mm.put("inzibatci", mem.getStudentId().equals(group.getYaradiciId()));
                    mm.put("muellimdi", Boolean.TRUE.equals(muellimdiById.get(mem.getStudentId())));
                    mm.put("joinedAt", mem.getJoinedAt());
                    return mm;
                }).toList();
        m.put("uzvler", members);

        Map<String, ChatGroupMessage> byId = new LinkedHashMap<>();
        for (ChatGroupMessage rm : rawMessages) byId.put(rm.getId(), rm);

        // "Məndən sil" — YALNIZ bu baxan tələbənin siyahısından çıxarılır, `byId` (cavab-sitatı
        // axtarışı üçün) TAM qalır ki, başqasının mesajındakı sitat pozulmasın.
        Set<String> hiddenForViewer = viewerStudentId == null ? Set.of()
                : messageHideRepository.findByStudentIdAndMessageIdIn(viewerStudentId, byId.keySet())
                        .stream().map(ChatGroupMessageHide::getMessageId).collect(java.util.stream.Collectors.toSet());

        List<Map<String, Object>> messages = rawMessages.stream()
                .filter(msg -> !hiddenForViewer.contains(msg.getId()))
                .map(msg -> {
                    Map<String, Object> mm = new LinkedHashMap<>();
                    mm.put("id", msg.getId());
                    mm.put("senderId", msg.getSenderId());
                    mm.put("senderAdi", adiById.getOrDefault(msg.getSenderId(), "Naməlum"));
                    mm.put("muellimdi", Boolean.TRUE.equals(muellimdiById.get(msg.getSenderId())));
                    boolean silinib = Boolean.TRUE.equals(msg.getSilinib());
                    mm.put("silinib", silinib);
                    mm.put("redaktaEdilib", Boolean.TRUE.equals(msg.getRedaktaEdilib()));
                    mm.put("mesaj", silinib ? SILINMIS_MESAJ_MATNI : msg.getMesaj());
                    mm.put("sekil", silinib ? null : msg.getSekil());
                    mm.put("ses", silinib ? null : msg.getSes());
                    mm.put("createdAt", msg.getCreatedAt());

                    if (msg.getCavabId() != null) {
                        Optional.ofNullable(byId.get(msg.getCavabId())).ifPresent(orig -> {
                            Map<String, Object> cavab = new LinkedHashMap<>();
                            cavab.put("id", orig.getId());
                            boolean origSilinib = Boolean.TRUE.equals(orig.getSilinib());
                            cavab.put("senderAdi", adiById.getOrDefault(orig.getSenderId(), "Naməlum"));
                            cavab.put("mesaj", origSilinib ? SILINMIS_MESAJ_MATNI : orig.getMesaj());
                            cavab.put("sekilVar", !origSilinib && orig.getSekil() != null);
                            cavab.put("sesVar", !origSilinib && orig.getSes() != null);
                            mm.put("cavab", cavab);
                        });
                    }
                    return mm;
                }).toList();
        m.put("mesajlar", messages);

        Instant menimClearedAt = null;
        if (viewerStudentId != null) {
            menimClearedAt = memberRows.stream()
                    .filter(mem -> mem.getStudentId().equals(viewerStudentId))
                    .findFirst()
                    .map(ChatGroupMember::getClearedAt)
                    .orElse(null);
        }
        m.put("menimClearedAt", menimClearedAt);

        return m;
    }
}
