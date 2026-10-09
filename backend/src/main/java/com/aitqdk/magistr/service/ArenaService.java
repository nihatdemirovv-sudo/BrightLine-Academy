package com.aitqdk.magistr.service;

import com.aitqdk.magistr.ai.AiService;
import com.aitqdk.magistr.dto.GeneratedQuestion;
import com.aitqdk.magistr.entity.ArenaNotification;
import com.aitqdk.magistr.entity.Competition;
import com.aitqdk.magistr.entity.CompetitionParticipant;
import com.aitqdk.magistr.entity.Student;
import com.aitqdk.magistr.exception.ApiException;
import com.aitqdk.magistr.repository.ArenaNotificationRepository;
import com.aitqdk.magistr.repository.CompetitionParticipantRepository;
import com.aitqdk.magistr.repository.CompetitionRepository;
import com.aitqdk.magistr.util.JsonUtil;
import com.fasterxml.jackson.core.type.TypeReference;
import jakarta.annotation.PreDestroy;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

/**
 * "Bilik Arenası" — real-vaxtlı çoxnəfərlik bilik yarışı.
 *
 * <p>ƏDALƏT PRİNSİPİ: suallar müsabiqə YARADILAN anda AI ilə BİR DƏFƏ hazırlanıb
 * {@link Competition#getSuallarJson()}-a donmuş şəkildə yazılır. Yarış başlayandan sonra bu dəst
 * DƏYİŞMİR — bütün iştirakçılar eyni sualları, eyni ardıcıllıqla, eyni (artıq qarışdırılmış)
 * variantlarla görür. Yarış zamanı heç bir iştirakçı üçün ayrıca generator işə salınmır.</p>
 *
 * <p>Real-vaxt sinxronu tam SERVER SAATINA əsaslanır: {@code cariSualIndeksi = floor((indi -
 * baslamaVaxti) / sualSaniye)}. Klient serverin qaytardığı {@code serverTime} ilə öz saatını
 * kalibrləyir, ona görə səhifə yeniləmə / internet kəsilməsi / brauzer bağlanma vəziyyəti bərpa
 * olunur (buraxılan suallar "cavabsız" sayılır). SSE (ChatGroupService-dəki eyni pattern) yalnız
 * vəziyyət dəyişikliklərini (qoşulma, başlama, cavab, finalize) yayımlayır.</p>
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ArenaService {

    private static final long EMITTER_TIMEOUT_MS = 30L * 60 * 1000;
    private static final long HEARTBEAT_SECONDS = 20;
    private static final long SWEEP_SECONDS = 2;
    private static final long ANSWER_GRACE_MS = 1200; // şəbəkə gecikməsi üçün son-saniyə cavaba möhlət
    private static final ZoneId BAKU = ZoneId.of("Asia/Baku");

    private static final Set<Integer> SUAL_SAYI_SET = Set.of(5, 10, 15, 20);
    private static final Set<String> CETINLIK_SET = Set.of("asan", "orta", "cetin", "qarisiq");
    private static final Set<Integer> MAX_ISTIRAKCI_SET = Set.of(2, 5, 10, 20);
    private static final Set<Integer> GOZLEME_SANIYE_SET = Set.of(120, 300, 600, 900, 1800);
    private static final Set<Integer> SUAL_SANIYE_SET = Set.of(15, 20, 30, 45, 60, 90);
    private static final Set<String> HERF_SET = Set.of("A", "B", "C", "D", "E");
    private static final Set<String> BITMIS_STATUSLAR = Set.of("BITDI", "VAXT_BITDI");
    private static final Set<String> AKTIV_STATUSLAR = Set.of("GOZLEYIR", "BASLADI");

    private final CompetitionRepository competitionRepository;
    private final CompetitionParticipantRepository participantRepository;
    private final ArenaNotificationRepository notificationRepository;
    private final StudentService studentService;
    private final AiService aiService;
    private final ActivityLogService activityLogService;
    private final ExecutorService aiExecutor;
    private final PlatformTransactionManager transactionManager;

    private TransactionTemplate txTemplate;

    // competitionId -> canlı SSE abunəçilər
    private final Map<String, CopyOnWriteArrayList<SseEmitter>> emitters = new ConcurrentHashMap<>();
    // competitionId -> ən son yayımlanmış sual indeksi (sweep sual keçidini push edir)
    private final Map<String, Integer> lastBroadcastIndex = new ConcurrentHashMap<>();

    private final ScheduledExecutorService scheduler = Executors.newSingleThreadScheduledExecutor(r -> {
        Thread t = new Thread(r, "arena-scheduler");
        t.setDaemon(true);
        return t;
    });

    {
        scheduler.scheduleAtFixedRate(this::safeSweep, SWEEP_SECONDS, SWEEP_SECONDS, TimeUnit.SECONDS);
        scheduler.scheduleAtFixedRate(this::sendHeartbeats, HEARTBEAT_SECONDS, HEARTBEAT_SECONDS, TimeUnit.SECONDS);
    }

    private TransactionTemplate tx() {
        if (txTemplate == null) {
            txTemplate = new TransactionTemplate(transactionManager);
        }
        return txTemplate;
    }

    @PreDestroy
    public void shutdown() {
        scheduler.shutdownNow();
    }

    // ==================== TƏLƏBƏ TƏRƏFİ ====================

    @Transactional(readOnly = true)
    public List<Map<String, Object>> listActive(String sessionId) {
        Student student = studentService.findBySessionIdOrThrow(sessionId);
        return competitionRepository.findByStatusInOrderByCreatedAtDesc(AKTIV_STATUSLAR).stream()
                .filter(c -> "GOZLEYIR".equals(c.getStatus())
                        || participantRepository.existsByCompetitionIdAndStudentId(c.getId(), student.getId()))
                .map(c -> toCard(c, student.getId()))
                .toList();
    }

    public record CreateRequest(String ad, String fenn, Integer sualSayi, String cetinlik,
                                Integer maxIstirakci, Integer gozlemeSaniye, Integer sualSaniye) {
    }

    @Transactional
    public Map<String, Object> createCompetition(String sessionId, CreateRequest req) {
        Student student = studentService.findBySessionIdOrThrow(sessionId);

        String ad = req.ad() == null ? "" : req.ad().trim();
        if (ad.isEmpty()) throw ApiException.badRequest("Müsabiqə adı boş ola bilməz.");
        if (ad.length() > 80) ad = ad.substring(0, 80);
        if (req.fenn() == null || req.fenn().isBlank()) throw ApiException.badRequest("Fənn seçin.");
        if (req.sualSayi() == null || !SUAL_SAYI_SET.contains(req.sualSayi()))
            throw ApiException.badRequest("Sual sayı 5, 10, 15 və ya 20 ola bilər.");
        String cetinlik = req.cetinlik() == null ? "orta" : req.cetinlik().toLowerCase();
        if (!CETINLIK_SET.contains(cetinlik)) throw ApiException.badRequest("Çətinlik səviyyəsi yanlışdır.");
        if (req.maxIstirakci() == null || !MAX_ISTIRAKCI_SET.contains(req.maxIstirakci()))
            throw ApiException.badRequest("İştirakçı limiti 2, 5, 10 və ya 20 ola bilər.");
        if (req.gozlemeSaniye() == null || !GOZLEME_SANIYE_SET.contains(req.gozlemeSaniye()))
            throw ApiException.badRequest("Gözləmə müddəti yanlışdır.");
        if (req.sualSaniye() == null || !SUAL_SANIYE_SET.contains(req.sualSaniye()))
            throw ApiException.badRequest("Sual üçün vaxt limiti yanlışdır.");

        long aktivSayi = competitionRepository.countByYaradiciIdAndStatusIn(student.getId(), AKTIV_STATUSLAR);
        if (aktivSayi >= 1) {
            throw ApiException.badRequest("Eyni anda yalnız 1 aktiv müsabiqəniz ola bilər. Əvvəlkini bitirin və ya ləğv edin.");
        }

        Competition c = new Competition();
        c.setAd(ad);
        c.setFenn(req.fenn().trim());
        c.setSualSayi(req.sualSayi());
        c.setCetinlik(cetinlik);
        c.setQrup(student.getQrup());
        c.setYaradiciId(student.getId());
        c.setMaxIstirakci(req.maxIstirakci());
        c.setGozlemeSaniye(req.gozlemeSaniye());
        c.setSualSaniye(req.sualSaniye());
        c.setStatus("GOZLEYIR");
        competitionRepository.save(c);

        CompetitionParticipant p = new CompetitionParticipant();
        p.setCompetitionId(c.getId());
        p.setStudentId(student.getId());
        p.setIstirakciNo(1);
        participantRepository.save(p);

        final String compId = c.getId();
        // Suallar YALNIZ tranzaksiya commit olduqdan sonra generasiya edilsin (async task commit-dən
        // əvvəl işə düşüb boş sətir oxumasın).
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                aiExecutor.submit(() -> generateAndFreeze(compId));
            }
        });

        return toDetail(c, student.getId(), false);
    }

    @Transactional
    public Map<String, Object> joinCompetition(String sessionId, String competitionId) {
        Student student = studentService.findBySessionIdOrThrow(sessionId);
        Competition c = competitionRepository.findById(competitionId)
                .orElseThrow(() -> ApiException.notFound("Müsabiqə tapılmadı."));

        if (participantRepository.existsByCompetitionIdAndStudentId(competitionId, student.getId())) {
            return toDetail(c, student.getId(), false); // idempotent — artıq iştirakçıdır
        }
        if (!"GOZLEYIR".equals(c.getStatus())) {
            throw ApiException.badRequest("Bu müsabiqəyə artıq qoşulmaq olmaz (başlayıb və ya bitib).");
        }
        long say = participantRepository.countByCompetitionId(competitionId);
        if (say >= c.getMaxIstirakci()) {
            throw ApiException.conflict("İştirakçı limiti doludur.");
        }

        CompetitionParticipant p = new CompetitionParticipant();
        p.setCompetitionId(competitionId);
        p.setStudentId(student.getId());
        p.setIstirakciNo((int) say + 1);
        participantRepository.save(p);

        notify(c.getYaradiciId(), "QOSULDU", student.getAd() + " \"" + c.getAd() + "\" müsabiqənizə qoşuldu.", competitionId);

        Map<String, Object> detail = toDetail(c, student.getId(), false);
        // Yayım NEYTRAL olmalıdır — şəxsi "menimIstirakim" (seçimlər) yalnız sorğu edənə qaytarılır.
        broadcast(competitionId, toDetail(c, null, false));
        return detail;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getDetail(String sessionId, String competitionId) {
        Student student = studentService.findBySessionIdOrThrow(sessionId);
        Competition c = competitionRepository.findById(competitionId)
                .orElseThrow(() -> ApiException.notFound("Müsabiqə tapılmadı."));
        boolean istirakci = participantRepository.existsByCompetitionIdAndStudentId(competitionId, student.getId());
        if ("BASLADI".equals(c.getStatus()) && !istirakci) {
            throw ApiException.unauthorized("Yarış gedir — yalnız iştirakçılar baxa bilər.");
        }
        return toDetail(c, student.getId(), false);
    }

    @Transactional
    public Map<String, Object> startCompetition(String sessionId, String competitionId) {
        Student student = studentService.findBySessionIdOrThrow(sessionId);
        Competition c = competitionRepository.findById(competitionId)
                .orElseThrow(() -> ApiException.notFound("Müsabiqə tapılmadı."));
        requireCreator(c, student.getId());
        if (!"GOZLEYIR".equals(c.getStatus())) throw ApiException.badRequest("Müsabiqə artıq başlayıb və ya bitib.");
        if (!Boolean.TRUE.equals(c.getSuallarHazir())) {
            throw ApiException.badRequest(Boolean.TRUE.equals(c.getSuallarXeta())
                    ? "Suallar hazırlana bilmədi. Müsabiqəni ləğv edib yenidən yaradın."
                    : "Suallar hələ hazırlanır, bir az gözləyin.");
        }
        long say = participantRepository.countByCompetitionId(competitionId);
        if (say < 2) throw ApiException.badRequest("Başlamaq üçün ən azı 2 iştirakçı lazımdır.");

        c.setStatus("BASLADI");
        c.setBaslamaVaxti(Instant.now());
        competitionRepository.save(c);
        lastBroadcastIndex.put(competitionId, 0);

        for (CompetitionParticipant p : participantRepository.findByCompetitionIdOrderByIstirakciNoAsc(competitionId)) {
            notify(p.getStudentId(), "BASLADI", "\"" + c.getAd() + "\" müsabiqəsi başladı!", competitionId);
        }

        Map<String, Object> detail = toDetail(c, student.getId(), false);
        // Yayım NEYTRAL olmalıdır — şəxsi "menimIstirakim" (seçimlər) yalnız sorğu edənə qaytarılır.
        broadcast(competitionId, toDetail(c, null, false));
        return detail;
    }

    @Transactional
    public Map<String, Object> cancelCompetition(String sessionId, String competitionId) {
        Student student = studentService.findBySessionIdOrThrow(sessionId);
        Competition c = competitionRepository.findById(competitionId)
                .orElseThrow(() -> ApiException.notFound("Müsabiqə tapılmadı."));
        requireCreator(c, student.getId());
        if (!"GOZLEYIR".equals(c.getStatus())) {
            throw ApiException.badRequest("Yalnız başlamamış müsabiqə ləğv edilə bilər.");
        }
        c.setStatus("LEGV");
        competitionRepository.save(c);
        for (CompetitionParticipant p : participantRepository.findByCompetitionIdOrderByIstirakciNoAsc(competitionId)) {
            if (!p.getStudentId().equals(student.getId())) {
                notify(p.getStudentId(), "BITDI", "\"" + c.getAd() + "\" müsabiqəsi yaradıcı tərəfindən ləğv edildi.", competitionId);
            }
        }
        Map<String, Object> detail = toDetail(c, student.getId(), false);
        // Yayım NEYTRAL olmalıdır — şəxsi "menimIstirakim" (seçimlər) yalnız sorğu edənə qaytarılır.
        broadcast(competitionId, toDetail(c, null, false));
        return detail;
    }

    @Transactional
    public Map<String, Object> leaveCompetition(String sessionId, String competitionId) {
        Student student = studentService.findBySessionIdOrThrow(sessionId);
        Competition c = competitionRepository.findById(competitionId)
                .orElseThrow(() -> ApiException.notFound("Müsabiqə tapılmadı."));
        CompetitionParticipant p = participantRepository.findByCompetitionIdAndStudentId(competitionId, student.getId())
                .orElseThrow(() -> ApiException.notFound("Bu müsabiqənin iştirakçısı deyilsən."));

        if ("GOZLEYIR".equals(c.getStatus())) {
            if (c.getYaradiciId().equals(student.getId())) {
                return cancelInternal(c, student.getId());
            }
            participantRepository.deleteByCompetitionIdAndStudentId(competitionId, student.getId());
            Map<String, Object> detail = toDetail(c, null, false);
            // Yayım NEYTRAL olmalıdır — şəxsi "menimIstirakim" (seçimlər) yalnız sorğu edənə qaytarılır.
            broadcast(competitionId, toDetail(c, null, false));
            return detail;
        }
        if ("BASLADI".equals(c.getStatus())) {
            // Yarışdan erkən çıxış = forfeit: cavab verməyi dayandırır, mövcud nəticələri ilə sıralanır.
            p.setBitirib(true);
            participantRepository.save(p);
            Map<String, Object> detail = toDetail(c, student.getId(), false);
            // Yayım NEYTRAL olmalıdır — şəxsi "menimIstirakim" (seçimlər) yalnız sorğu edənə qaytarılır.
            broadcast(competitionId, toDetail(c, null, false));
            return detail;
        }
        return toDetail(c, student.getId(), false);
    }

    public record AnswerRequest(Integer sualIndex, String secim) {
    }

    @Transactional
    public Map<String, Object> submitAnswer(String sessionId, String competitionId, AnswerRequest req) {
        Student student = studentService.findBySessionIdOrThrow(sessionId);
        Competition c = competitionRepository.findById(competitionId)
                .orElseThrow(() -> ApiException.notFound("Müsabiqə tapılmadı."));
        CompetitionParticipant p = participantRepository.findByCompetitionIdAndStudentId(competitionId, student.getId())
                .orElseThrow(() -> ApiException.notFound("Bu müsabiqənin iştirakçısı deyilsən."));
        if (!"BASLADI".equals(c.getStatus())) throw ApiException.badRequest("Yarış aktiv deyil.");
        if (Boolean.TRUE.equals(p.getBitirib())) throw ApiException.badRequest("Yarışı tərk etmisən.");

        Integer sualIndex = req.sualIndex();
        String secim = req.secim() == null ? null : req.secim().trim().toUpperCase();
        if (sualIndex == null || sualIndex < 0 || sualIndex >= c.getSualSayi())
            throw ApiException.badRequest("Sual indeksi yanlışdır.");
        if (secim == null || !HERF_SET.contains(secim))
            throw ApiException.badRequest("Cavab variantı yanlışdır.");

        long baslama = c.getBaslamaVaxti().toEpochMilli();
        long qStart = baslama + (long) sualIndex * c.getSualSaniye() * 1000L;
        long qEnd = qStart + c.getSualSaniye() * 1000L;
        long now = System.currentTimeMillis();
        if (now < qStart) throw ApiException.badRequest("Bu sual hələ açılmayıb.");
        if (now > qEnd + ANSWER_GRACE_MS) throw ApiException.badRequest("Bu sualın vaxtı bitib.");
        long elapsedMs = Math.min(Math.max(now - qStart, 0), (long) c.getSualSaniye() * 1000L);

        List<Map<String, Object>> cavablar = parseCavablar(p.getCavablarJson());
        Map<String, Object> mevcud = null;
        for (Map<String, Object> e : cavablar) {
            if (numInt(e.get("i")) == sualIndex) {
                mevcud = e;
                break;
            }
        }
        if (mevcud == null) {
            Map<String, Object> yeni = new LinkedHashMap<>();
            yeni.put("i", sualIndex);
            yeni.put("secim", secim);
            yeni.put("ms", elapsedMs);
            cavablar.add(yeni);
        } else {
            mevcud.put("secim", secim); // eyni sual pəncərəsində fikri dəyişməyə icazə
            mevcud.put("ms", elapsedMs);
        }
        p.setCavablarJson(JsonUtil.toJson(cavablar));
        participantRepository.save(p);

        Map<String, Object> detail = toDetail(c, student.getId(), false);
        // Yayım NEYTRAL olmalıdır — şəxsi "menimIstirakim" (seçimlər) yalnız sorğu edənə qaytarılır.
        broadcast(competitionId, toDetail(c, null, false));
        return detail;
    }

    public SseEmitter subscribe(String sessionId, String competitionId) {
        Student student = studentService.findBySessionIdOrThrow(sessionId);
        Competition c = competitionRepository.findById(competitionId)
                .orElseThrow(() -> ApiException.notFound("Müsabiqə tapılmadı."));
        boolean istirakci = participantRepository.existsByCompetitionIdAndStudentId(competitionId, student.getId());
        if ("BASLADI".equals(c.getStatus()) && !istirakci) {
            throw ApiException.unauthorized("Yarış gedir — yalnız iştirakçılar baxa bilər.");
        }
        return register(competitionId);
    }

    // ==================== TARİXÇƏ / STATİSTİKA / REYTİNQ ====================

    @Transactional(readOnly = true)
    public List<Map<String, Object>> myHistory(String sessionId) {
        Student student = studentService.findBySessionIdOrThrow(sessionId);
        List<CompetitionParticipant> myParts = participantRepository.findByStudentId(student.getId());
        Set<String> compIds = myParts.stream().map(CompetitionParticipant::getCompetitionId).collect(java.util.stream.Collectors.toSet());
        Map<String, Competition> byId = new HashMap<>();
        competitionRepository.findAllById(compIds).forEach(c -> byId.put(c.getId(), c));

        List<Map<String, Object>> out = new ArrayList<>();
        for (CompetitionParticipant p : myParts) {
            Competition c = byId.get(p.getCompetitionId());
            if (c == null || !BITMIS_STATUSLAR.contains(c.getStatus())) continue;
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("competitionId", c.getId());
            m.put("ad", c.getAd());
            m.put("fenn", c.getFenn());
            m.put("cetinlik", c.getCetinlik());
            m.put("sualSayi", c.getSualSayi());
            m.put("tarix", c.getBitmeVaxti() != null ? c.getBitmeVaxti() : c.getCreatedAt());
            m.put("istirakciSayi", participantRepository.countByCompetitionId(c.getId()));
            m.put("sira", p.getSira());
            m.put("xal", p.getXal());
            m.put("dogruSay", p.getDogruSay());
            m.put("sehvSay", p.getSehvSay());
            m.put("cavabsizSay", p.getCavabsizSay());
            m.put("qalib", Boolean.TRUE.equals(p.getQalib()));
            out.add(m);
        }
        out.sort(Comparator.comparing((Map<String, Object> m) -> ((Instant) m.get("tarix"))).reversed());
        return out;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> myStats(String sessionId) {
        Student student = studentService.findBySessionIdOrThrow(sessionId);
        List<CompetitionParticipant> myParts = participantRepository.findByStudentId(student.getId());
        Set<String> compIds = myParts.stream().map(CompetitionParticipant::getCompetitionId).collect(java.util.stream.Collectors.toSet());
        Map<String, Competition> byId = new HashMap<>();
        competitionRepository.findAllById(compIds).forEach(c -> byId.put(c.getId(), c));

        int istirak = 0, qalib = 0, meglub = 0, umumiXal = 0, enYaxsi = 0;
        Instant sonTarix = null;
        Map<String, Object> son = null;
        for (CompetitionParticipant p : myParts) {
            Competition c = byId.get(p.getCompetitionId());
            if (c == null || !BITMIS_STATUSLAR.contains(c.getStatus())) continue;
            istirak++;
            umumiXal += p.getXal();
            enYaxsi = Math.max(enYaxsi, p.getXal());
            if (Boolean.TRUE.equals(p.getQalib())) qalib++;
            else if (p.getSira() != null) meglub++;
            Instant t = c.getBitmeVaxti() != null ? c.getBitmeVaxti() : c.getCreatedAt();
            if (sonTarix == null || t.isAfter(sonTarix)) {
                sonTarix = t;
                son = new LinkedHashMap<>();
                son.put("ad", c.getAd());
                son.put("fenn", c.getFenn());
                son.put("tarix", t);
                son.put("sira", p.getSira());
                son.put("xal", p.getXal());
                son.put("qalib", Boolean.TRUE.equals(p.getQalib()));
            }
        }
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("istirakSayi", istirak);
        m.put("qalibSayi", qalib);
        m.put("meglubSayi", meglub);
        m.put("umumiXal", umumiXal);
        m.put("enYaxsiXal", enYaxsi);
        m.put("sonMusabiqe", son);
        return m;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> leaderboard(String sessionId, String period) {
        Student student = studentService.findBySessionIdOrThrow(sessionId);
        Instant cutoff = switch (period == null ? "all" : period) {
            case "week" -> Instant.now().minus(java.time.Duration.ofDays(7));
            case "month" -> Instant.now().minus(java.time.Duration.ofDays(30));
            default -> null;
        };
        List<Competition> comps = competitionRepository.findByStatusOrderByCreatedAtDesc("BITDI").stream()
                .filter(c -> cutoff == null || (c.getBitmeVaxti() != null && c.getBitmeVaxti().isAfter(cutoff)))
                .toList();
        Set<String> compIds = comps.stream().map(Competition::getId).collect(java.util.stream.Collectors.toSet());

        Map<String, int[]> agg = new HashMap<>(); // studentId -> [xal, musabiqeSayi, qalibSayi]
        if (!compIds.isEmpty()) {
            for (CompetitionParticipant p : participantRepository.findByCompetitionIdIn(compIds)) {
                int[] a = agg.computeIfAbsent(p.getStudentId(), k -> new int[3]);
                a[0] += p.getXal();
                a[1] += 1;
                if (Boolean.TRUE.equals(p.getQalib())) a[2] += 1;
            }
        }
        Map<String, String> adlar = new HashMap<>();
        studentService.findAllByIds(agg.keySet()).forEach(s -> adlar.put(s.getId(), s.getAd()));

        List<Map<String, Object>> sirali = new ArrayList<>();
        agg.entrySet().stream()
                .sorted((x, y) -> Integer.compare(y.getValue()[0], x.getValue()[0]))
                .forEach(e -> {
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("studentId", e.getKey());
                    row.put("ad", adlar.getOrDefault(e.getKey(), "Naməlum"));
                    row.put("xal", e.getValue()[0]);
                    row.put("musabiqeSayi", e.getValue()[1]);
                    row.put("qalibSayi", e.getValue()[2]);
                    sirali.add(row);
                });
        for (int i = 0; i < sirali.size(); i++) sirali.get(i).put("sira", i + 1);

        Map<String, Object> menim = new LinkedHashMap<>();
        int menimSira = -1, menimXal = 0;
        for (int i = 0; i < sirali.size(); i++) {
            if (student.getId().equals(sirali.get(i).get("studentId"))) {
                menimSira = i + 1;
                menimXal = (int) sirali.get(i).get("xal");
                break;
            }
        }
        menim.put("sira", menimSira > 0 ? menimSira : null);
        menim.put("xal", menimXal);
        menim.put("umumiIstirakci", sirali.size());

        Map<String, Object> out = new LinkedHashMap<>();
        out.put("period", period == null ? "all" : period);
        out.put("liderler", sirali.stream().limit(50).toList());
        out.put("menim", menim);
        return out;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> notifications(String sessionId) {
        Student student = studentService.findBySessionIdOrThrow(sessionId);
        List<Map<String, Object>> rows = notificationRepository.findTop30ByStudentIdOrderByCreatedAtDesc(student.getId())
                .stream().map(this::notifToMap).toList();
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("bildirisler", rows);
        out.put("oxunmamis", notificationRepository.countByStudentIdAndOxunubFalse(student.getId()));
        return out;
    }

    @Transactional
    public Map<String, Object> markNotificationsRead(String sessionId) {
        Student student = studentService.findBySessionIdOrThrow(sessionId);
        List<ArenaNotification> unread = notificationRepository.findByStudentIdAndOxunubFalse(student.getId());
        unread.forEach(n -> n.setOxunub(true));
        notificationRepository.saveAll(unread);
        return Map.of("oxunmamis", 0);
    }

    // ==================== ADMIN TƏRƏFİ ====================

    @Transactional(readOnly = true)
    public List<Map<String, Object>> listForAdmin(String filter) {
        List<Competition> comps = switch (filter == null ? "all" : filter) {
            case "active" -> competitionRepository.findByStatusInOrderByCreatedAtDesc(AKTIV_STATUSLAR);
            case "finished" -> competitionRepository.findByStatusInOrderByCreatedAtDesc(BITMIS_STATUSLAR);
            case "cancelled" -> competitionRepository.findByStatusOrderByCreatedAtDesc("LEGV");
            default -> competitionRepository.findAllByOrderByCreatedAtDesc();
        };
        Map<String, String> adlar = adlarFor(comps.stream().map(Competition::getYaradiciId).toList());
        return comps.stream().map(c -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", c.getId());
            m.put("ad", c.getAd());
            m.put("fenn", c.getFenn());
            m.put("cetinlik", c.getCetinlik());
            m.put("sualSayi", c.getSualSayi());
            m.put("status", c.getStatus());
            m.put("yaradiciAdi", adlar.getOrDefault(c.getYaradiciId(), "Naməlum"));
            m.put("istirakciSayi", participantRepository.countByCompetitionId(c.getId()));
            m.put("maxIstirakci", c.getMaxIstirakci());
            m.put("createdAt", c.getCreatedAt());
            m.put("baslamaVaxti", c.getBaslamaVaxti());
            m.put("bitmeVaxti", c.getBitmeVaxti());
            return m;
        }).toList();
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getForAdmin(String competitionId) {
        Competition c = competitionRepository.findById(competitionId)
                .orElseThrow(() -> ApiException.notFound("Müsabiqə tapılmadı."));
        return toDetail(c, null, true);
    }

    @Transactional
    public Map<String, Object> stopForAdmin(String competitionId) {
        Competition c = competitionRepository.findById(competitionId)
                .orElseThrow(() -> ApiException.notFound("Müsabiqə tapılmadı."));
        if ("BASLADI".equals(c.getStatus())) {
            finalize(c);
        } else if ("GOZLEYIR".equals(c.getStatus())) {
            c.setStatus("VAXT_BITDI");
            competitionRepository.save(c);
            for (CompetitionParticipant p : participantRepository.findByCompetitionIdOrderByIstirakciNoAsc(competitionId)) {
                notify(p.getStudentId(), "BITDI", "\"" + c.getAd() + "\" müsabiqəsi administrator tərəfindən dayandırıldı.", competitionId);
            }
            broadcast(competitionId, toDetail(c, null, false));
        }
        return getForAdmin(competitionId);
    }

    @Transactional
    public void deleteForAdmin(String competitionId) {
        if (!competitionRepository.existsById(competitionId)) {
            throw ApiException.notFound("Müsabiqə tapılmadı.");
        }
        deleteInternal(competitionId);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> adminStats() {
        List<Competition> all = competitionRepository.findAll();
        long aktiv = all.stream().filter(c -> AKTIV_STATUSLAR.contains(c.getStatus())).count();
        Instant gunBasi = LocalDate.now(BAKU).atStartOfDay(BAKU).toInstant();
        long buGun = all.stream().filter(c -> c.getCreatedAt() != null && c.getCreatedAt().isAfter(gunBasi)).count();
        long umumiIstirakci = participantRepository.count();

        Map<String, Integer> fennSay = new HashMap<>();
        Map<String, Integer> yaradanSay = new HashMap<>();
        for (Competition c : all) {
            fennSay.merge(c.getFenn(), 1, Integer::sum);
            yaradanSay.merge(c.getYaradiciId(), 1, Integer::sum);
        }
        Map<String, Integer> qalibSay = new HashMap<>();
        for (CompetitionParticipant p : participantRepository.findAll()) {
            if (Boolean.TRUE.equals(p.getQalib())) qalibSay.merge(p.getStudentId(), 1, Integer::sum);
        }
        Set<String> studentIds = new LinkedHashSet<>();
        studentIds.addAll(yaradanSay.keySet());
        studentIds.addAll(qalibSay.keySet());
        Map<String, String> adlar = adlarFor(studentIds);

        Map<String, Object> out = new LinkedHashMap<>();
        out.put("umumi", all.size());
        out.put("aktiv", aktiv);
        out.put("buGun", buGun);
        out.put("umumiIstirakci", umumiIstirakci);
        out.put("populyarFenler", topN(fennSay, 5, k -> k));
        out.put("enCoxYaradan", topN(yaradanSay, 5, k -> adlar.getOrDefault(k, "Naməlum")));
        out.put("enCoxQalib", topN(qalibSay, 5, k -> adlar.getOrDefault(k, "Naməlum")));
        return out;
    }

    // Hesab silinərkən (AccountService) çağırılır.
    @Transactional
    public void cleanupForDeletedAccount(String studentId) {
        for (Competition c : competitionRepository.findAll()) {
            if (studentId.equals(c.getYaradiciId())) {
                deleteInternal(c.getId());
            }
        }
        participantRepository.deleteByStudentId(studentId);
        notificationRepository.deleteByStudentId(studentId);
    }

    // ==================== SCHEDULER ====================

    private void safeSweep() {
        try {
            List<Map<String, Object>> pushlar = tx().execute(status -> sweepOnce());
            if (pushlar != null) {
                for (Map<String, Object> push : pushlar) {
                    broadcast((String) push.get("__id"), push);
                }
            }
        } catch (Exception e) {
            log.warn("Arena sweep xətası: {}", e.getMessage());
        }
    }

    /** Tranzaksiya daxilində işləyir; yayımlanacaq detalların siyahısını qaytarır (commit-dən sonra push). */
    private List<Map<String, Object>> sweepOnce() {
        List<Map<String, Object>> pushlar = new ArrayList<>();
        Instant now = Instant.now();
        for (Competition c : competitionRepository.findByStatusInOrderByCreatedAtDesc(AKTIV_STATUSLAR)) {
            if ("GOZLEYIR".equals(c.getStatus())) {
                Instant deadline = c.getCreatedAt().plusSeconds(c.getGozlemeSaniye());
                if (now.isAfter(deadline)) {
                    c.setStatus("VAXT_BITDI");
                    competitionRepository.save(c);
                    for (CompetitionParticipant p : participantRepository.findByCompetitionIdOrderByIstirakciNoAsc(c.getId())) {
                        notify(p.getStudentId(), "BITDI",
                                "\"" + c.getAd() + "\" müsabiqəsi vaxtında başladılmadı və avtomatik bağlandı.", c.getId());
                    }
                    Map<String, Object> d = toDetail(c, null, false);
                    d.put("__id", c.getId());
                    pushlar.add(d);
                }
            } else if ("BASLADI".equals(c.getStatus())) {
                long endMs = c.getBaslamaVaxti().toEpochMilli() + (long) c.getSualSayi() * c.getSualSaniye() * 1000L;
                if (System.currentTimeMillis() >= endMs) {
                    finalize(c);
                    Map<String, Object> d = toDetail(c, null, false);
                    d.put("__id", c.getId());
                    pushlar.add(d);
                } else {
                    int idx = currentIndex(c, now);
                    Integer last = lastBroadcastIndex.get(c.getId());
                    if (last == null || last != idx) {
                        lastBroadcastIndex.put(c.getId(), idx);
                        Map<String, Object> d = toDetail(c, null, false);
                        d.put("__id", c.getId());
                        pushlar.add(d);
                    }
                }
            }
        }
        return pushlar;
    }

    // ==================== KÖMƏKÇİ — GENERASIYA & FINALIZE ====================

    private void generateAndFreeze(String competitionId) {
        try {
            Competition c = competitionRepository.findById(competitionId).orElse(null);
            if (c == null || !"GOZLEYIR".equals(c.getStatus())) return;
            List<GeneratedQuestion> qs = aiService.generateQuestions(
                    c.getFenn(), c.getSualSayi(), c.getQrup(), cetinlikMovzu(c.getCetinlik()));
            if (qs == null || qs.size() < 3) {
                markGenerationError(competitionId);
                return;
            }
            c.setSuallarJson(JsonUtil.toJson(qs));
            c.setSualSayi(qs.size());
            c.setSuallarHazir(true);
            competitionRepository.save(c);
            broadcast(competitionId, toDetail(c, null, false));
        } catch (Exception e) {
            log.error("Arena sual generasiyası xətası ({}):", competitionId, e);
            markGenerationError(competitionId);
        }
    }

    private void markGenerationError(String competitionId) {
        Competition c = competitionRepository.findById(competitionId).orElse(null);
        if (c == null) return;
        c.setSuallarXeta(true);
        competitionRepository.save(c);
        notify(c.getYaradiciId(), "BITDI",
                "\"" + c.getAd() + "\" üçün suallar hazırlana bilmədi. Müsabiqəni ləğv edib yenidən yaradın.", competitionId);
        broadcast(competitionId, toDetail(c, null, false));
    }

    private String cetinlikMovzu(String cetinlik) {
        return switch (cetinlik) {
            case "asan" -> "istənilən mövzu, çətinlik səviyyəsi: asan";
            case "cetin" -> "istənilən mövzu, çətinlik səviyyəsi: çətin";
            case "qarisiq" -> "istənilən mövzu, çətinlik qarışıq (asan, orta və çətin suallar birlikdə)";
            default -> "istənilən mövzu, çətinlik səviyyəsi: orta";
        };
    }

    private void finalize(Competition c) {
        List<CompetitionParticipant> parts = participantRepository.findByCompetitionIdOrderByIstirakciNoAsc(c.getId());
        List<GeneratedQuestion> questions = parseQuestions(c.getSuallarJson());

        for (CompetitionParticipant p : parts) {
            Map<Integer, Map<String, Object>> answersByIdx = new HashMap<>();
            for (Map<String, Object> e : parseCavablar(p.getCavablarJson())) {
                answersByIdx.put(numInt(e.get("i")), e);
            }
            int dogru = 0, sehv = 0, cavabsiz = 0, xal = 0, answered = 0;
            double totalSec = 0;
            for (int i = 0; i < c.getSualSayi(); i++) {
                Map<String, Object> e = answersByIdx.get(i);
                if (e == null) {
                    cavabsiz++;
                    continue;
                }
                answered++;
                long ms = numLong(e.get("ms"));
                totalSec += ms / 1000.0;
                String secim = e.get("secim") == null ? "" : e.get("secim").toString();
                String dogruCavab = i < questions.size() && questions.get(i).getDogruCavab() != null
                        ? questions.get(i).getDogruCavab() : "";
                if (!secim.isEmpty() && secim.equalsIgnoreCase(dogruCavab)) {
                    dogru++;
                    xal += 1; // 1 doğru cavab = 1 xal (sürət yalnız bərabərlik zamanı tie-break-dir)
                } else {
                    sehv++;
                }
            }
            p.setDogruSay(dogru);
            p.setSehvSay(sehv);
            p.setCavabsizSay(cavabsiz);
            p.setXal(xal);
            p.setOrtaCavabMuddeti(answered > 0 ? Math.round(totalSec / answered * 10.0) / 10.0 : 0.0);
            p.setBitirib(true);
        }

        // Sıralama: əvvəlcə xal (= doğru cavab sayı), bərabərlik olarsa DAHA TEZ cavablayan
        // qabaqda (orta cavab müddəti kiçik), ən sonda qoşulma sırası (deterministik tie-break).
        parts.sort(Comparator
                .comparingInt(CompetitionParticipant::getDogruSay).reversed()
                .thenComparing(CompetitionParticipant::getOrtaCavabMuddeti)
                .thenComparing(CompetitionParticipant::getIstirakciNo));
        for (int i = 0; i < parts.size(); i++) {
            CompetitionParticipant p = parts.get(i);
            p.setSira(i + 1);
            p.setQalib(i == 0);
        }
        participantRepository.saveAll(parts);

        c.setStatus("BITDI");
        c.setBitmeVaxti(Instant.now());
        competitionRepository.save(c);
        lastBroadcastIndex.remove(c.getId());

        int total = parts.size();
        for (CompetitionParticipant p : parts) {
            String msg = Boolean.TRUE.equals(p.getQalib())
                    ? "🏆 Təbriklər! \"" + c.getAd() + "\" müsabiqəsində " + (total - 1) + " rəqibə qarşı 1-ci oldunuz!"
                    : "\"" + c.getAd() + "\" müsabiqəsi bitdi — " + p.getSira() + "/" + total + " yer, " + p.getXal() + " xal.";
            notify(p.getStudentId(), Boolean.TRUE.equals(p.getQalib()) ? "QALIB" : "BITDI", msg, c.getId());
            activityLogService.log(p.getStudentId(), "arena",
                    c.getFenn() + " - Bilik Arenası: " + p.getSira() + "/" + total + " yer, "
                            + p.getDogruSay() + " doğru, " + p.getXal() + " xal");
        }
    }

    private int currentIndex(Competition c, Instant now) {
        if (c.getBaslamaVaxti() == null) return 0;
        long elapsed = now.toEpochMilli() - c.getBaslamaVaxti().toEpochMilli();
        if (elapsed < 0) return 0;
        return (int) (elapsed / ((long) c.getSualSaniye() * 1000L));
    }

    private Map<String, Object> cancelInternal(Competition c, String creatorId) {
        c.setStatus("LEGV");
        competitionRepository.save(c);
        for (CompetitionParticipant p : participantRepository.findByCompetitionIdOrderByIstirakciNoAsc(c.getId())) {
            if (!p.getStudentId().equals(creatorId)) {
                notify(p.getStudentId(), "BITDI", "\"" + c.getAd() + "\" müsabiqəsi ləğv edildi.", c.getId());
            }
        }
        Map<String, Object> detail = toDetail(c, creatorId, false);
        broadcast(c.getId(), detail);
        return detail;
    }

    private void deleteInternal(String competitionId) {
        CopyOnWriteArrayList<SseEmitter> list = emitters.remove(competitionId);
        if (list != null) list.forEach(SseEmitter::complete);
        lastBroadcastIndex.remove(competitionId);
        participantRepository.deleteByCompetitionId(competitionId);
        competitionRepository.deleteById(competitionId);
    }

    // ==================== KÖMƏKÇİ — SSE ====================

    private SseEmitter register(String competitionId) {
        SseEmitter emitter = new SseEmitter(EMITTER_TIMEOUT_MS);
        CopyOnWriteArrayList<SseEmitter> list = emitters.computeIfAbsent(competitionId, k -> new CopyOnWriteArrayList<>());
        list.add(emitter);
        emitter.onCompletion(() -> list.remove(emitter));
        emitter.onTimeout(() -> {
            list.remove(emitter);
            emitter.complete();
        });
        emitter.onError(e -> list.remove(emitter));
        try {
            emitter.send(SseEmitter.event().name("ready").data("ok"));
        } catch (IOException e) {
            list.remove(emitter);
        }
        return emitter;
    }

    private void broadcast(String competitionId, Map<String, Object> detail) {
        CopyOnWriteArrayList<SseEmitter> list = emitters.get(competitionId);
        if (list == null || list.isEmpty()) return;
        for (SseEmitter emitter : list) {
            try {
                emitter.send(SseEmitter.event().name("competition").data(detail));
            } catch (Exception e) {
                list.remove(emitter);
            }
        }
    }

    private void sendHeartbeats() {
        emitters.forEach((id, list) -> {
            for (SseEmitter emitter : list) {
                try {
                    emitter.send(SseEmitter.event().comment("ping"));
                } catch (Exception e) {
                    list.remove(emitter);
                }
            }
        });
    }

    // ==================== KÖMƏKÇİ — DETAL QURULMASI ====================

    private Map<String, Object> toCard(Competition c, String viewerId) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", c.getId());
        m.put("ad", c.getAd());
        m.put("fenn", c.getFenn());
        m.put("cetinlik", c.getCetinlik());
        m.put("sualSayi", c.getSualSayi());
        m.put("sualSaniye", c.getSualSaniye());
        m.put("status", c.getStatus());
        m.put("suallarHazir", Boolean.TRUE.equals(c.getSuallarHazir()));
        m.put("suallarXeta", Boolean.TRUE.equals(c.getSuallarXeta()));
        m.put("maxIstirakci", c.getMaxIstirakci());
        m.put("istirakciSayi", participantRepository.countByCompetitionId(c.getId()));
        m.put("yaradiciId", c.getYaradiciId());
        m.put("yaradiciAdi", studentService.findByIdOptional(c.getYaradiciId()).map(Student::getAd).orElse("Naməlum"));
        m.put("menimIstirakim", viewerId != null
                && participantRepository.existsByCompetitionIdAndStudentId(c.getId(), viewerId));
        m.put("createdAt", c.getCreatedAt());
        m.put("gozlemeBitir", c.getCreatedAt() != null ? c.getCreatedAt().plusSeconds(c.getGozlemeSaniye()) : null);
        return m;
    }

    private Map<String, Object> toDetail(Competition c, String viewerId, boolean fullReveal) {
        String status = c.getStatus();
        boolean bitib = BITMIS_STATUSLAR.contains(status) || fullReveal;
        Instant now = Instant.now();

        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", c.getId());
        m.put("ad", c.getAd());
        m.put("fenn", c.getFenn());
        m.put("cetinlik", c.getCetinlik());
        m.put("sualSayi", c.getSualSayi());
        m.put("sualSaniye", c.getSualSaniye());
        m.put("gozlemeSaniye", c.getGozlemeSaniye());
        m.put("maxIstirakci", c.getMaxIstirakci());
        m.put("status", status);
        m.put("yaradiciId", c.getYaradiciId());
        m.put("yaradiciAdi", studentService.findByIdOptional(c.getYaradiciId()).map(Student::getAd).orElse("Naməlum"));
        m.put("suallarHazir", Boolean.TRUE.equals(c.getSuallarHazir()));
        m.put("suallarXeta", Boolean.TRUE.equals(c.getSuallarXeta()));
        m.put("createdAt", c.getCreatedAt());
        m.put("baslamaVaxti", c.getBaslamaVaxti());
        m.put("bitmeVaxti", c.getBitmeVaxti());
        m.put("serverTime", now);
        m.put("gozlemeBitir", c.getCreatedAt() != null ? c.getCreatedAt().plusSeconds(c.getGozlemeSaniye()) : null);

        int curIdx = "BASLADI".equals(status) ? currentIndex(c, now) : -1;
        m.put("cariSualIndex", "BASLADI".equals(status) ? Math.min(curIdx, c.getSualSayi()) : null);

        List<CompetitionParticipant> parts = participantRepository.findByCompetitionIdOrderByIstirakciNoAsc(c.getId());
        Map<String, String> adlar = adlarFor(parts.stream().map(CompetitionParticipant::getStudentId).toList());
        m.put("istirakciSayi", parts.size());

        List<Map<String, Object>> istirakcilar = new ArrayList<>();
        for (CompetitionParticipant p : parts) {
            Map<String, Object> pm = new LinkedHashMap<>();
            pm.put("studentId", p.getStudentId());
            pm.put("ad", adlar.getOrDefault(p.getStudentId(), "Naməlum"));
            pm.put("istirakciNo", p.getIstirakciNo());
            pm.put("bitirib", Boolean.TRUE.equals(p.getBitirib()));
            if (bitib) {
                pm.put("dogruSay", p.getDogruSay());
                pm.put("sehvSay", p.getSehvSay());
                pm.put("cavabsizSay", p.getCavabsizSay());
                pm.put("xal", p.getXal());
                pm.put("ortaCavabMuddeti", p.getOrtaCavabMuddeti());
                pm.put("sira", p.getSira());
                pm.put("qalib", Boolean.TRUE.equals(p.getQalib()));
                // Yalnız müsabiqə BİTƏNDƏN sonra: hər iştirakçının hansı suala nə cavab verdiyi.
                // Yarış zamanı rəqiblərin seçimləri heç vaxt göndərilmir.
                Map<Integer, String> secimler = new LinkedHashMap<>();
                for (Map<String, Object> e : parseCavablar(p.getCavablarJson())) {
                    if (e.get("secim") != null) secimler.put(numInt(e.get("i")), e.get("secim").toString());
                }
                pm.put("secimler", secimler);
            } else if ("BASLADI".equals(status)) {
                pm.put("cavabladiSay", parseCavablar(p.getCavablarJson()).size());
            }
            istirakcilar.add(pm);
        }
        m.put("istirakcilar", istirakcilar);

        if (viewerId != null) {
            parts.stream().filter(p -> p.getStudentId().equals(viewerId)).findFirst().ifPresent(p -> {
                Map<String, Object> mine = new LinkedHashMap<>();
                mine.put("istirakciNo", p.getIstirakciNo());
                mine.put("bitirib", Boolean.TRUE.equals(p.getBitirib()));
                List<Integer> cavabladi = new ArrayList<>();
                Map<Integer, String> secimler = new LinkedHashMap<>();
                for (Map<String, Object> e : parseCavablar(p.getCavablarJson())) {
                    int i = numInt(e.get("i"));
                    cavabladi.add(i);
                    if (e.get("secim") != null) secimler.put(i, e.get("secim").toString());
                }
                mine.put("cavabladiIndexler", cavabladi);
                mine.put("secimler", secimler);
                if (bitib) {
                    mine.put("dogruSay", p.getDogruSay());
                    mine.put("sehvSay", p.getSehvSay());
                    mine.put("cavabsizSay", p.getCavabsizSay());
                    mine.put("xal", p.getXal());
                    mine.put("ortaCavabMuddeti", p.getOrtaCavabMuddeti());
                    mine.put("sira", p.getSira());
                    mine.put("qalib", Boolean.TRUE.equals(p.getQalib()));
                }
                m.put("menimIstirakim", mine);
            });
        }

        // Suallar: yarış zamanı YALNIZ cari + keçmiş suallar, doğru cavab/izah OLMADAN. Bitəndə
        // (və ya admin baxışında) hamısı, doğru cavab + izah ilə.
        List<GeneratedQuestion> questions = parseQuestions(c.getSuallarJson());
        List<Map<String, Object>> suallar = new ArrayList<>();
        if (bitib) {
            for (int i = 0; i < questions.size(); i++) suallar.add(questionMap(questions.get(i), true));
        } else if ("BASLADI".equals(status)) {
            int limit = Math.min(curIdx, c.getSualSayi() - 1);
            for (int i = 0; i <= limit && i < questions.size(); i++) suallar.add(questionMap(questions.get(i), false));
        }
        m.put("suallar", suallar);
        return m;
    }

    private Map<String, Object> questionMap(GeneratedQuestion q, boolean reveal) {
        Map<String, Object> qm = new LinkedHashMap<>();
        qm.put("sual", q.getSual());
        qm.put("variantlar", q.getVariantlar());
        qm.put("movzu", q.getMovzu());
        qm.put("cetinlik", q.getCetinlik());
        qm.put("figura", q.getFigura());
        if (reveal) {
            qm.put("dogruCavab", q.getDogruCavab());
            qm.put("izah", q.getIzah());
        }
        return qm;
    }

    // ==================== KÖMƏKÇİ — XIRDA ====================

    private void requireCreator(Competition c, String studentId) {
        if (!c.getYaradiciId().equals(studentId)) {
            throw ApiException.unauthorized("Yalnız müsabiqəni yaradan bunu edə bilər.");
        }
    }

    private void notify(String studentId, String tip, String mesaj, String competitionId) {
        ArenaNotification n = new ArenaNotification();
        n.setStudentId(studentId);
        n.setTip(tip);
        n.setMesaj(mesaj);
        n.setCompetitionId(competitionId);
        notificationRepository.save(n);
    }

    private Map<String, Object> notifToMap(ArenaNotification n) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", n.getId());
        m.put("tip", n.getTip());
        m.put("mesaj", n.getMesaj());
        m.put("competitionId", n.getCompetitionId());
        m.put("oxunub", Boolean.TRUE.equals(n.getOxunub()));
        m.put("createdAt", n.getCreatedAt());
        return m;
    }

    private Map<String, String> adlarFor(Collection<String> ids) {
        Map<String, String> out = new HashMap<>();
        Set<String> unique = new LinkedHashSet<>(ids);
        studentService.findAllByIds(unique).forEach(s -> out.put(s.getId(), s.getAd()));
        return out;
    }

    private List<Map<String, Object>> topN(Map<String, Integer> counts, int n, java.util.function.Function<String, String> label) {
        return counts.entrySet().stream()
                .sorted((a, b) -> Integer.compare(b.getValue(), a.getValue()))
                .limit(n)
                .map(e -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("ad", label.apply(e.getKey()));
                    m.put("say", e.getValue());
                    return m;
                })
                .toList();
    }

    private List<GeneratedQuestion> parseQuestions(String json) {
        if (json == null || json.isBlank()) return List.of();
        List<GeneratedQuestion> qs = JsonUtil.fromJson(json, new TypeReference<List<GeneratedQuestion>>() {
        });
        return qs != null ? qs : List.of();
    }

    private List<Map<String, Object>> parseCavablar(String json) {
        if (json == null || json.isBlank()) return new ArrayList<>();
        List<Map<String, Object>> list = JsonUtil.parseListOfMaps(json);
        return list != null ? new ArrayList<>(list) : new ArrayList<>();
    }

    private int numInt(Object o) {
        return o instanceof Number ? ((Number) o).intValue() : -1;
    }

    private long numLong(Object o) {
        return o instanceof Number ? ((Number) o).longValue() : 0L;
    }
}
