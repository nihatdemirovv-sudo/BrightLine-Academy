package com.aitqdk.magistr.ai;

import com.aitqdk.magistr.dto.DailyTask;
import com.aitqdk.magistr.dto.ExamQuestion;
import com.aitqdk.magistr.dto.GeneratedQuestion;
import com.aitqdk.magistr.dto.WeaknessItem;
import com.aitqdk.magistr.util.JsonUtil;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.util.ArrayList;
import java.util.Base64;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.ThreadLocalRandom;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

/**
 * ai.ts-in Java qarşılığı — bütün AI biznes məntiqi burada cəmləşir.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AiService {

  private final ChatCompletionClient chatClient;
  private final ImageService imageService;
  private final ExecutorService aiExecutor;

  public boolean isConfigured() {
    return chatClient.isConfigured();
  }

  private static String qrupTesviri(String qrup) {
    return AiPrompts.qrupTesviri(qrup);
  }

  /**
   * Sərbəst mətn cavabı (AI Müəllim, şəkil həlli, mini-dərs) üçün: cavabda bağlanmamış düstur
   * ("$" sayı tək) varsa saytda mətnin qalanı qarışır — bir dəfə yenidən soruşulur, ikinci cavab
   * balanslıdırsa o götürülür (deyilsə ilk cavab qaytarılır, istifadəçi boş qalmasın).
   */
  public String balansliCavab(java.util.function.Supplier<String> sorgu, String ad) {
    String cavab = sorgu.get();
    if (cavab == null || dollarSayi(cavab) % 2 == 0) {
      return cavab;
    }
    log.warn("{} cavabında bağlanmamış düstur ($) — yenidən soruşulur.", ad);
    String ikinci = sorgu.get();
    return ikinci != null && !ikinci.isBlank() && dollarSayi(ikinci) % 2 == 0 ? ikinci : cavab;
  }

  /** Rol (system) mesajı + istifadəçi mesajı — bütün tək-addımlı AI çağırışları üçün. */
  private static List<Map<String, Object>> systemAndUser(String system, Object userContent) {
    return List.of(
        Map.of("role", "system", "content", system),
        Map.of("role", "user", "content", userContent));
  }

  // === 1. AI muellim söhbət ===
  public String tutorChat(List<Map<String, String>> messages, TutorContext context) {
    if (!isConfigured()) {
      return "AI konfiqurasiya olunmayıb. AI_API_KEY təyin edin.";
    }

    StringBuilder system = new StringBuilder(AiPrompts.TUTOR_SYSTEM);
    if (context != null) {
      system.append("\nŞAGİRD HAQQINDA (cavabı buna uyğunlaşdır):\n");
      system.append("- Səviyyə: ")
          .append(context.qrup() != null ? qrupTesviri(context.qrup()) : "məlum deyil").append('\n');
      if (context.qrup() != null) {
        system.append("- İmtahan fənləri: ")
            .append(String.join(", ", Subjects.fennleriForQrup(context.qrup()))).append('\n');
      }
      system.append("- Hədəf universitet/ixtisas: ")
          .append(context.hedefUniversite() != null && !context.hedefUniversite().isBlank()
              ? context.hedefUniversite() : "qeyd olunmayıb").append('\n');
      if (context.zəifFənnlər() != null && !context.zəifFənnlər().isEmpty()) {
        system.append("- Zəif fənləri (səviyyəsi 50%-dən aşağı): ")
            .append(String.join(", ", context.zəifFənnlər())).append('\n');
      }
    }

    List<Map<String, Object>> fullMessages = new ArrayList<>();
    fullMessages.add(Map.of("role", "system", "content", system.toString()));
    for (Map<String, String> m : messages) {
      fullMessages.add(Map.of("role", m.get("role"), "content", m.get("content")));
    }
    // Gemini-də max_tokens düşünmə (thinking) tokenlərini də əhatə edir — kiçik limit cavabı
    // kəsir/boş qoyur; ətraflı addım-addım həll üçün geniş limit.
    return balansliCavab(() -> chatClient.chat(fullMessages, 12000), "AI Müəllim");
  }

  // === 2. Şəkil analizi (VLM) ===
  public String analyzeProblemImage(String imageBase64, String mimeType, String userQuestion,
      String qrup) {
    if (!isConfigured()) {
      return "AI konfiqurasiya olunmayıb.";
    }

    StringBuilder tapshiriq = new StringBuilder();
    tapshiriq.append(userQuestion != null && !userQuestion.isBlank()
        ? "Şagirdin sualı: " + userQuestion
        : "Bu şəkildəki məsələni oxu və addım-addım həll et.");
    if (qrup != null) {
      tapshiriq.append("\nŞagird ").append(qrupTesviri(qrup)).append(" üçün hazırlaşır.");
    }

    List<Map<String, Object>> content = List.of(
        Map.of("type", "text", "text", tapshiriq.toString()),
        Map.of("type", "image_url", "image_url",
            Map.of("url", "data:%s;base64,%s".formatted(mimeType, imageBase64)))
    );
    return balansliCavab(() -> chatClient.chat(systemAndUser(AiPrompts.IMAGE_SOLVER_RULES, content), 12000), "Şəkil həlli");
  }

  // === 4. Sual generatoru ===
  // Böyük "say" (10/15/20) ≤5-lik hissələrə bölünüb paralel (aiExecutor) icra olunur — hər
  // hissənin cavabı qısa qalır (JSON kəsilmə riski az) və ümumi gözləmə vaxtı azalır. Mövzu
  // göstərilməyəndə mövzular Java-da TƏSADÜFİ paylanır ki, paralel hissələr eyni sualı yazmasın.
  private static final int SUAL_CHUNK_SIZE = 5;
  private static final int SUAL_MAX_TOKENS = 32000;

  // Frontend/Arena çətinliyi "movzu" sətrinin sonuna əlavə edir: "(çətin səviyyədə)",
  // "Ümumi mövzu, asan səviyyədə", "istənilən mövzu, çətinlik səviyyəsi: orta" və s.
  private static final Pattern CETINLIK_SUFFIX = Pattern.compile(
      "(?iu)(qarışıq çətinlikdə|çətinlik qarışıq|asan səviyyədə|orta çətinlikdə|çətin səviyyədə"
          + "|çətinlik səviyyəsi:\\s*(asan|orta|çətin))");

  public List<GeneratedQuestion> generateQuestions(String fenn, int say, String qrup,
      String movzu) {
    if (!isConfigured() || say <= 0) {
      return List.of();
    }
    if (AiPrompts.isRandomFenn(fenn)) {
      return generateMixedSubjects(say, qrup, movzu);
    }

    List<String> mövzuPlanı = isUmumiMovzu(movzu) ? randomMovzular(fenn, qrup, say) : List.of();
    int hissəSayı = (say + SUAL_CHUNK_SIZE - 1) / SUAL_CHUNK_SIZE;
    if (hissəSayı == 1) {
      return generateQuestionsBatch(fenn, say, qrup, movzu, mövzuPlanı, 1, 1);
    }

    List<CompletableFuture<List<GeneratedQuestion>>> futures = new ArrayList<>();
    for (int k = 0; k < hissəSayı; k++) {
      int from = k * SUAL_CHUNK_SIZE;
      int bu = Math.min(SUAL_CHUNK_SIZE, say - from);
      List<String> plan = mövzuPlanı.isEmpty() ? List.of() : mövzuPlanı.subList(from, from + bu);
      int hissəNo = k + 1;
      futures.add(CompletableFuture.supplyAsync(
          () -> generateQuestionsBatch(fenn, bu, qrup, movzu, plan, hissəNo, hissəSayı), aiExecutor));
    }
    return futures.stream().flatMap(f -> f.join().stream()).collect(Collectors.toList());
  }

  /** "Təsadüfi (qarışıq)" — hər sual üçün qrupun fənlərindən biri təsadüfi seçilir. */
  private List<GeneratedQuestion> generateMixedSubjects(int say, String qrup, String movzu) {
    List<String> fenler = Subjects.fennleriForQrup(qrup);
    Map<String, Integer> bolgu = new LinkedHashMap<>();
    for (int i = 0; i < say; i++) {
      bolgu.merge(fenler.get(ThreadLocalRandom.current().nextInt(fenler.size())), 1, Integer::sum);
    }
    String cetinlik = cetinlikTelebi(movzu);
    String fennMovzusu = cetinlik != null ? "Ümumi mövzu, " + cetinlik : null;

    List<CompletableFuture<List<GeneratedQuestion>>> futures = bolgu.entrySet().stream()
        .map(e -> CompletableFuture.supplyAsync(() -> {
          List<GeneratedQuestion> qs = safeGenerate(e.getKey(), e.getValue(), qrup, fennMovzusu);
          qs.forEach(q -> q.setFenn(e.getKey()));
          return qs;
        }, aiExecutor))
        .toList();
    List<GeneratedQuestion> hamisi = new ArrayList<>();
    futures.forEach(f -> hamisi.addAll(f.join()));
    Collections.shuffle(hamisi, ThreadLocalRandom.current());
    return hamisi;
  }

  private static boolean isUmumiMovzu(String movzu) {
    if (movzu == null || movzu.isBlank()) {
      return true;
    }
    String m = movzu.trim().toLowerCase(Locale.forLanguageTag("az"));
    return m.startsWith("ümumi mövzu") || m.startsWith("istənilən mövzu");
  }

  /** Mövzu tələbindəki çətinlik ifadəsi (varsa) — məs. "çətin səviyyədə". */
  private static String cetinlikTelebi(String movzu) {
    if (movzu == null) {
      return null;
    }
    Matcher m = CETINLIK_SUFFIX.matcher(movzu);
    return m.find() ? m.group(1) : null;
  }

  /** Şagirdin yazdığı mövzunun özü (çətinlik əlavəsi olmadan). */
  private static String temizMovzu(String movzu) {
    if (movzu == null || isUmumiMovzu(movzu)) {
      return null;
    }
    String t = CETINLIK_SUFFIX.matcher(movzu).replaceAll("");
    t = t.replaceAll("\\(\\s*\\)", "").replaceAll("[\\s,]+$", "").trim();
    return t.isEmpty() ? null : t;
  }

  /** Fənn proqramından say qədər TƏSADÜFİ mövzu — mümkün qədər təkrarsız. */
  private static List<String> randomMovzular(String fenn, String qrup, int say) {
    List<String> hamisi = AiPrompts.movzular(fenn, qrup);
    if (hamisi.isEmpty()) {
      return List.of();
    }
    List<String> netice = new ArrayList<>();
    List<String> qarisiq = new ArrayList<>();
    while (netice.size() < say) {
      if (qarisiq.isEmpty()) {
        qarisiq.addAll(hamisi);
        Collections.shuffle(qarisiq, ThreadLocalRandom.current());
      }
      netice.add(qarisiq.remove(qarisiq.size() - 1));
    }
    return netice;
  }

  private List<GeneratedQuestion> generateQuestionsBatch(String fenn, int say, String qrup,
      String movzu, List<String> mövzuPlanı, int hissəNo, int hissəSayı) {
    String temizMovzu = temizMovzu(movzu);
    String cetinlik = cetinlikTelebi(movzu);

    // DİQQƏT: AiPrompts sabitlərində "%" var — prompt "+" ilə qurulur, formatted() ilə YOX.
    StringBuilder p = new StringBuilder();
    p.append("TAPŞIRIQ: \"").append(fenn).append("\" fənnindən ").append(say)
        .append(" ədəd ORİJİNAL çoxseçimli (A–E) test sualı hazırla.\n");
    if (qrup != null) {
      p.append("Hədəf auditoriya: ").append(qrupTesviri(qrup)).append(".\n");
    }
    if (!mövzuPlanı.isEmpty()) {
      p.append("\nMÖVZU BÖLGÜSÜ — hər sual sıra ilə öz mövzusundan olsun (mövzunun içindən konkret alt-mövzunu özün seç):\n");
      for (int i = 0; i < mövzuPlanı.size(); i++) {
        p.append(i + 1).append(". ").append(mövzuPlanı.get(i)).append('\n');
      }
    } else if (temizMovzu != null) {
      p.append("\nMÖVZU: \"").append(temizMovzu).append("\". Bütün suallar bu mövzu daxilində olsun, ")
          .append("amma hər sual FƏRQLİ alt-aspekti, fərqli sual tipini və fərqli ədədləri yoxlasın.\n");
    }
    p.append("ÇƏTİNLİK: ").append(cetinlik != null ? cetinlik
        : "qarışıq (təxminən 30% asan, 40% orta, 30% çətin)").append(".\n");
    if (hissəSayı > 1) {
      p.append("Bu sorğu ").append(hissəSayı).append(" hissəlik böyük dəstin ").append(hissəNo)
          .append("-ci hissəsidir (variasiya kodu ").append(ThreadLocalRandom.current().nextInt(1000, 9999))
          .append(") — digər hissələrlə üst-üstə düşməsin deyə gözlənilməz ədədlər, kontekst və sual tipləri seç.\n");
    }
    p.append(AiPrompts.fennQaydalari(fenn, qrup));
    p.append(AiPrompts.QUESTION_RULES);
    p.append(AiPrompts.QUESTION_JSON_FORMAT);

    List<Map<String, Object>> messages = systemAndUser(AiPrompts.QUESTION_WRITER_SYSTEM, p.toString());


    // Keyfiyyət filtri: qüsurlu sual (bağlanmamış düstur, çatışmayan variant, variantlarda olmayan
    // doğru cavab) istifadəçiyə HEÇ VAXT göstərilmir — atılır və çatışmayan say üçün yenidən
    // soruşulur. Parse uğursuzluğu da (nadir — JSON rejimi var) eyni cəhd limitinə daxildir.
    List<GeneratedQuestion> qebul = new ArrayList<>();
    for (int cəhd = 1; cəhd <= 2 && qebul.size() < say; cəhd++) {
      // JSON rejimi etibarlı JSON zəmanət verir; geniş limit — Məntiq kimi çox düşünülən
      // fənlərdə 16000 token (düşünmə daxil) cavabı yarımçıq kəsirdi.
      String content = chatClient.chat(messages, SUAL_MAX_TOKENS, true);
      QuestionsResponse parsed = JsonUtil.fromJson(JsonUtil.stripMarkdownFences(content), QuestionsResponse.class);
      if (parsed == null) {
        log.warn("Sual JSON parse xətası (cəhd {}/2).", cəhd);
        continue;
      }
      List<GeneratedQuestion> suallar = parsed.suallar != null ? parsed.suallar
          : parsed.questions != null ? parsed.questions : List.of();
      for (GeneratedQuestion q : suallar) {
        String qusur = keyfiyyetQusuru(q);
        if (qusur != null) {
          log.warn("Qüsurlu sual atıldı ({}): {}", qusur, q.getMovzu());
          continue;
        }
        if (qebul.size() < say) {
          q.setFigura(gizletHellEdileni(q.getFigura(), q.getSual()));
          shuffleVariantlar(q);
          qebul.add(q);
        }
      }
    }
    return qebul;
  }

  /** null — sual qəbul ediləndir; əks halda qüsurun qısa təsviri. */
  static String keyfiyyetQusuru(GeneratedQuestion q) {
    if (q.getSual() == null || q.getSual().isBlank()) {
      return "sual boşdur";
    }
    Map<String, String> v = q.getVariantlar();
    if (v == null || v.size() < 4 || v.values().stream().anyMatch(s -> s == null || s.isBlank())) {
      return "variantlar natamamdır";
    }
    if (new java.util.HashSet<>(v.values()).size() < v.size()) {
      return "variantlar təkrarlanır";
    }
    if (q.getDogruCavab() == null || !v.containsKey(q.getDogruCavab())) {
      return "doğru cavab variantlarda yoxdur";
    }
    // AI bəzən izahda düzgün hesablayır, amma "dogruCavab"-ı başqa varianta qoyur — belə sual
    // istifadəçiyə YANLIŞ cavabı doğru kimi göstərərdi (canlı testdə rast gəlinib).
    if (q.getIzah() != null) {
      Matcher cm = IZAH_DOGRU_CAVAB.matcher(q.getIzah());
      String son = null;
      while (cm.find()) {
        son = cm.group(1);
      }
      if (son != null && !son.equals(q.getDogruCavab())) {
        return "izahdakı cavab (" + son + ") dogruCavab (" + q.getDogruCavab() + ") ilə uyğun deyil";
      }
      if (OZUNU_DUZELTME.matcher(q.getIzah()).find()) {
        return "izahda AI öz hesabını düzəldir (etibarsız həll)";
      }
    }
    List<String> metnler = new ArrayList<>(v.values());
    metnler.add(q.getSual());
    metnler.add(q.getIzah());
    for (String t : metnler) {
      if (t != null && dollarSayi(t) % 2 != 0) {
        return "bağlanmamış düstur ($)";
      }
    }
    return null;
  }

  private static final Pattern IZAH_DOGRU_CAVAB = Pattern.compile("(?iu)doğru cavab\\s*[:\\-]?\\s*([A-E])\\b");
  // İzahda modelin həll zamanı özünü düzəltməsi ("Yenidən sayaq", "səhv hesabladıq") — həll etibarsızdır.
  private static final Pattern OZUNU_DUZELTME = Pattern.compile(
      "(?iu)yenidən (sayaq|hesablayaq|yoxlayaq)|səhv (hesabladıq|etdik|etdim)|düzəliş edək");

  private static final Pattern KOD = Pattern.compile("```[\\s\\S]*?```|`[^`\\n]*`");

  /** Düstur ayırıcısı olan "$" sayı — kod blokları/inline kod (məs. Excel "`=$A$1`") və "\$" sayılmır. */
  public static long dollarSayi(String t) {
    return KOD.matcher(t).replaceAll("").replace("\\$", "").chars().filter(ch -> ch == '$').count();
  }

  /**
   * AI variantları yaradanda doğru cavabı çox tez-tez "A" mövqeyinə qoyur (pozisiya
   * meyilliliyi, LLM-lərdə tanınan bir problemdir) — nəticədə tələbə tez öyrənir ki,
   * "hər zaman A-nı seç" strategiyası işləyir. Buna görə hər sualın variantları
   * generasiyadan SONRA hərflər üzrə YENİDƏN qarışdırılır ki, doğru cavabın hərfi
   * (A-E) hər sualda təsadüfi olsun — mətnlərin özü DƏYİŞMİR, yalnız hansı hərfə
   * düşdükləri.
   */
  private static void shuffleVariantlar(GeneratedQuestion q) {
    Map<String, String> variantlar = q.getVariantlar();
    String dogruCavab = q.getDogruCavab();
    if (variantlar == null || dogruCavab == null || !variantlar.containsKey(dogruCavab)) {
      return;
    }
    List<String> letters = new ArrayList<>(List.of("A", "B", "C", "D", "E"));
    letters.removeIf(l -> variantlar.get(l) == null);
    if (letters.size() < 2) {
      return;
    }
    List<String> qaynaqSira = new ArrayList<>(letters);
    Collections.shuffle(qaynaqSira, ThreadLocalRandom.current());

    Map<String, String> yeni = new LinkedHashMap<>();
    Map<String, String> kohnedenYeniye = new LinkedHashMap<>();
    for (int i = 0; i < letters.size(); i++) {
      String hedefHerf = letters.get(i);
      String qaynaqHerf = qaynaqSira.get(i);
      yeni.put(hedefHerf, variantlar.get(qaynaqHerf));
      kohnedenYeniye.put(qaynaqHerf, hedefHerf);
    }
    q.setVariantlar(yeni);
    q.setDogruCavab(kohnedenYeniye.get(dogruCavab));
    q.setIzah(remapVariantHerfleri(q.getIzah(), kohnedenYeniye));
  }

  private static final Pattern EDED = Pattern.compile("\\d+(?:[.,]\\d+)?");

  /**
   * Fiqur sualın ŞƏRTİNİ göstərməlidir, həllini yox. AI bəzən fiqura şərtdə verilməyən, həll zamanı
   * tapılan ölçüləri yazır (məs. trapesiyanın tapılmalı oturacaqları) — bu, cavabı əvvəlcədən açır.
   * Fiqurdakı hər ədəd sual mətnində yoxdursa, həmin dəyər "?" ilə əvəz olunur (etiket saxlanılır:
   * "AB=6" → "AB=?").
   */
  static Map<String, Object> gizletHellEdileni(Map<String, Object> figura, String sual) {
    if (figura == null || sual == null) {
      return figura;
    }
    java.util.Set<String> serdekiEdedler = new java.util.HashSet<>();
    Matcher sm = EDED.matcher(sual.replace("{,}", ","));
    while (sm.find()) {
      serdekiEdedler.add(sm.group().replace(',', '.'));
    }
    Map<String, Object> netice = new LinkedHashMap<>();
    figura.forEach((k, v) -> {
      if (v instanceof String s) {
        netice.put(k, gizletDeyer(s, serdekiEdedler));
      } else if (v instanceof List<?> list) {
        netice.put(k, list.stream().map(e -> e instanceof String s ? gizletDeyer(s, serdekiEdedler) : e).toList());
      } else {
        netice.put(k, v);
      }
    });
    return netice;
  }

  private static String gizletDeyer(String deyer, java.util.Set<String> serdekiEdedler) {
    Matcher m = EDED.matcher(deyer);
    while (m.find()) {
      if (!serdekiEdedler.contains(m.group().replace(',', '.'))) {
        int ayirici = Math.max(deyer.lastIndexOf('='), deyer.lastIndexOf(':'));
        return ayirici >= 0 ? deyer.substring(0, ayirici + 1) + "?" : "?";
      }
    }
    return deyer;
  }

  // İzahda variantlara hərflə istinadlar: "Doğru cavab: C", sətir başında "C)", "C variantı",
  // "variantı C". ("C-də" kimi formaya TOXUNULMUR — həndəsədə bu "C nöqtəsi" ola bilər.)
  private static final Pattern VARIANT_HERFI = Pattern.compile(
      "((?i:cavab)\\s*[:\\-]?\\s*)([A-E])\\b"
          + "|(?m)(^|[\\s>«\"])([A-E])(?=\\))"
          + "|\\b([A-E])(?=\\s+(?i:variant))"
          + "|((?i:variant)\\p{L}*\\s+)([A-E])\\b");

  /**
   * Variantlar qarışdırıldıqdan SONRA AI-nin yazdığı izah köhnə hərflərə istinad edir (məs. "Doğru
   * cavab: A", "C variantında 4 var") — hamısını bir keçiddə yeni hərflərə çevirir (eyni anda,
   * ardıcıl əvəzləmə A→C, C→A kimi zəncirləri qarışdırmasın deyə).
   */
  static String remapVariantHerfleri(String izah, Map<String, String> kohnedenYeniye) {
    if (izah == null || izah.isBlank()) {
      return izah;
    }
    Matcher m = VARIANT_HERFI.matcher(izah);
    StringBuilder sb = new StringBuilder();
    while (m.find()) {
      String evvel;
      String herf;
      if (m.group(2) != null) {
        evvel = m.group(1);
        herf = m.group(2);
      } else if (m.group(4) != null) {
        evvel = m.group(3);
        herf = m.group(4);
      } else if (m.group(5) != null) {
        evvel = "";
        herf = m.group(5);
      } else {
        evvel = m.group(6);
        herf = m.group(7);
      }
      m.appendReplacement(sb, Matcher.quoteReplacement(evvel + kohnedenYeniye.getOrDefault(herf, herf)));
    }
    m.appendTail(sb);
    return sb.toString();
  }

  // === 5. Diagnostik test ===
  public List<GeneratedQuestion> generateDiagnosticTest(String qrup) {
    List<String> fenler = Subjects.fennleriForQrup(qrup);
    List<String> secilen = fenler.subList(0, Math.min(6, fenler.size()));

    List<CompletableFuture<List<GeneratedQuestion>>> futures = secilen.stream()
        .map(fenn -> CompletableFuture.supplyAsync(
            () -> {
              List<GeneratedQuestion> qs = safeGenerate(fenn, 2, qrup, null);
              qs.forEach(q -> q.setFenn(fenn));
              return qs;
            }, aiExecutor))
        .toList();

    return futures.stream()
        .flatMap(f -> f.join().stream())
        .limit(12)
        .collect(Collectors.toList());
  }

  private List<GeneratedQuestion> safeGenerate(String fenn, int say, String qrup, String movzu) {
    try {
      return generateQuestions(fenn, say, qrup, movzu);
    } catch (Exception e) {
      log.error("Sual generasiyası xətası ({}):", fenn, e);
      return List.of();
    }
  }

  // === 6. Günlük AI planı ===
  public List<DailyTask> generateDailyPlan(String qrup, List<ZəifFenn> zəifFənnlər,
      String hedefUniversite) {
    if (!isConfigured()) {
      List<String> fenler = Subjects.fennleriForQrup(qrup);
      String[] onemSira = {"yuksek", "orta", "orta", "asagi"};
      List<DailyTask> result = new ArrayList<>();
      for (int i = 0; i < Math.min(4, fenler.size()); i++) {
        DailyTask t = new DailyTask();
        t.setFenn(fenler.get(i));
        t.setMovzu("Ümumi təkrar");
        t.setSualSayi(10);
        t.setMovzuQisa("Gündəlik təkrar");
        t.setOnem(onemSira[i % 4]);
        result.add(t);
      }
      return result;
    }

    List<String> qrupFenleri = Subjects.fennleriForQrup(qrup);
    StringBuilder p = new StringBuilder();
    p.append("Şagird üçün BU GÜNÜN öyrənmə planını tərtib et.\n");
    p.append("Səviyyə: ").append(qrupTesviri(qrup)).append(".\n");
    p.append("İmtahan fənləri (yalnız bunlardan seç, adları DƏQİQ belə yaz): ")
        .append(String.join(", ", qrupFenleri)).append(".\n");
    p.append("Hədəf: ").append(hedefUniversite != null && !hedefUniversite.isBlank()
        ? hedefUniversite : "qeyd olunmayıb").append(".\n");
    if (zəifFənnlər != null && !zəifFənnlər.isEmpty()) {
      p.append("\nZƏİF FƏNLƏR (səviyyə faizi) və onların proqramından nümunə mövzular:\n");
      for (ZəifFenn z : zəifFənnlər) {
        p.append("- ").append(z.fenn()).append(" — ").append(z.seviyye()).append("%");
        List<String> numune = randomMovzular(z.fenn(), qrup, 3);
        if (!numune.isEmpty()) {
          p.append("; mümkün mövzular: ").append(String.join(" | ", numune));
        }
        p.append('\n');
      }
    } else {
      p.append("\nŞagirdin zəif tərəfləri haqqında hələ məlumat yoxdur — bütün imtahan fənləri üzrə balanslı plan ver.\n");
    }
    p.append("""

        YALNIZ bu JSON formatında qaytar:
        {
          "tapşırıqlar": [
            {"fenn": "Riyaziyyat", "movzu": "Kvadrat tənliklər", "sualSayi": 15, "movzuQisa": "Viyet teoremi ilə köklərin cəmi və hasili", "onem": "yuksek"}
          ]
        }""");

    String content = chatClient.chat(systemAndUser(AiPrompts.PLANNER_SYSTEM, p.toString()));
    String cleaned = JsonUtil.stripMarkdownFences(content);
    DailyPlanResponse parsed = JsonUtil.fromJson(cleaned, DailyPlanResponse.class);
    if (parsed == null) {
      return List.of();
    }
    if (parsed.tapşırıqlar != null) {
      return parsed.tapşırıqlar;
    }
    if (parsed.tasks != null) {
      return parsed.tasks;
    }
    return List.of();
  }

  // === 7. Zəif tərəflərin analizi ===
  public List<WeaknessItem> analyzeWeaknesses(List<Map<String, Object>> progressData) {
    if (!isConfigured()) {
      return List.of();
    }

    String prompt = """
        Şagirdin fənlər üzrə tərəqqi məlumatı (JSON; "seviyye" — dəqiqlik faizi, "hallSualSayi" — həll etdiyi sual, "dogruCavab" — doğru cavab sayı):
        %s

        Ən zəif 3 fənni/mövzunu müəyyən et və hər biri üçün rəqəmlə əsaslandırılmış səbəb və konkret tövsiyə yaz.

        YALNIZ bu JSON formatında qaytar:
        {
          "zəifTərəflər": [
            {"fenn": "...", "sebəb": "...", "tovsiyə": "...", "övvelik": "yuksek"}
          ]
        }""".formatted(JsonUtil.toJson(progressData));

    String content = chatClient.chat(systemAndUser(AiPrompts.ANALYST_SYSTEM, prompt));
    String cleaned = JsonUtil.stripMarkdownFences(content);
    WeaknessResponse parsed = JsonUtil.fromJson(cleaned, WeaknessResponse.class);
    return parsed != null && parsed.zəifTərəflər != null ? parsed.zəifTərəflər : List.of();
  }

  // === 8. Valideyn həftəlik raportu ===
  public String generateParentReport(ParentReportInput opts) {
    if (!isConfigured()) {
      return "AI konfiqurasiya olunmayıb.";
    }

    int accuracy =
        opts.toplamSual() > 0 ? Math.round(100f * opts.dogruCavab() / opts.toplamSual()) : 0;

    String fennStr = opts.fənnProqresi().stream()
        .map(f -> "%s: %d%%".formatted(f.fenn(), f.seviyye()))
        .collect(Collectors.joining(", "));

    String prompt = """
        Bir şagird üçün VALİDEYNƏ ünvanlı həftəlik performans raportu yaz.
        
        Şagird: %s
        Qrup: %s
        Hədəf: %s
        
        Statistika:
        - Bu həftə həll etdiyi sual: %d
        - Doğru cavab: %d (%d%% dəqiqlik)
        - Ardıcıl aktiv gün: %d
        - Aktiv gün sayı: %d
        - Fənn proqresi: %s
        
        Qeyd: "Fənn proqresi" — hər fənn üzrə dəqiqlik faizidir (0%% — həmin fənndən hələ sual həll edilməyib).
        AŞAĞIDAKI strukturda, hər bölməni Markdown başlığı (##) ilə yaz (hər bölmə 2–5 cümlə və ya bənd):
        
        ## Ümumi Qiymət
        <qısa ümumi qiymət>
        
        ## Güclü Tərəflər
        <güclü tərəflər>
        
        ## Diqqət Tələb Edən Sahələr
        <zəif sahələr>
        
        ## Növbəti Həftə üçün Tövsiyə
        <konkret tövsiyələr>
        
        ## Nəticə
        <qısa nəticə>
        
        ÇOX VACİB: Yalnız raport mətnini yaz. Planlama, düşünmə addımları, "Anlamaq", "Strukturlaşdırma" və ya hər hansı meta-kommentar DAXİL ETMƏ. Birbaşa "## Ümumi Qiymət" başlığından başla."""
        .formatted(opts.ad(), qrupTesviri(opts.qrup()),
            opts.hedefUniversite(), opts.toplamSual(), opts.dogruCavab(), accuracy,
            opts.streak(), opts.aktivGünSayı(), fennStr);

    String content = chatClient.chat(systemAndUser(AiPrompts.PARENT_REPORT_SYSTEM, prompt));
    int idx = content.indexOf("## Ümumi Qiymət");
    return idx > 0 ? content.substring(idx) : content;
  }

  // === 9. İmtahan sual dəsti ===
  public ExamSetResult generateExamSet(String qrup, int sualSayi, List<String> fennlerOverride) {
    List<String> fenler = (fennlerOverride != null && !fennlerOverride.isEmpty())
        ? fennlerOverride : Subjects.fennleriForQrup(qrup);
    List<String> secilen = fenler.subList(0, Math.min(6, fenler.size()));
    int perFenn = Math.max(2, (int) Math.ceil((double) sualSayi / Math.min(secilen.size(), 6)));

    List<CompletableFuture<List<GeneratedQuestion>>> futures = secilen.stream()
        .map(fenn -> CompletableFuture.supplyAsync(() -> safeGenerate(fenn, perFenn, qrup, null),
            aiExecutor))
        .toList();

    List<ExamQuestion> suallar = new ArrayList<>();
    int nomre = 1;
    for (int i = 0; i < secilen.size(); i++) {
      String fenn = secilen.get(i);
      for (GeneratedQuestion q : futures.get(i).join()) {
        suallar.add(ExamQuestion.from(q, fenn, nomre++));
      }
    }

    List<ExamQuestion> finalSuallar =
        suallar.size() > sualSayi ? suallar.subList(0, sualSayi) : suallar;
    Map<String, Integer> fennBolugu = new LinkedHashMap<>();
    for (ExamQuestion q : finalSuallar) {
      fennBolugu.merge(q.getFenn(), 1, Integer::sum);
    }
    return new ExamSetResult(new ArrayList<>(finalSuallar), fennBolugu);
  }

  // === 11. Sənəddən sual çıxarma (PDF/şəkil) ===
  public List<ExamQuestion> extractQuestionsFromDocument(List<DocumentFile> files) {
    if (!isConfigured()) {
      log.error("extractQuestionsFromDocument: AI konfiqurasiya olunmayıb");
      return List.of();
    }

    List<ExamQuestion> all = new ArrayList<>();
    for (DocumentFile f : files) {
      try {
        boolean isPdf = "application/pdf".equals(f.mimeType()) || "pdf".equals(f.mimeType());
        if (isPdf) {
          List<String> pages = imageService.renderPdfPagesAsPngBase64(
              Base64.getDecoder().decode(f.base64()));
          for (int i = 0; i < pages.size(); i++) {
            try {
              all.addAll(extractFromImage(pages.get(i), "image/png"));
            } catch (Exception e) {
              log.error("Səhifə {}/{} xətası, ötürülür:", i + 1, pages.size(), e);
            }
          }
        } else {
          all.addAll(extractFromImage(f.base64(), f.mimeType()));
        }
      } catch (Exception e) {
        log.error("extractQuestionsFromDocument fayl xətası: {}", f.mimeType(), e);
      }
    }

    List<ExamQuestion> result = new ArrayList<>();
    int nomre = 1;
    for (ExamQuestion q : all) {
      if (q.getSualShekil() == null || q.getVariantlar() == null || q.getDogruCavab() == null) {
        continue;
      }
      q.setNomre(nomre++);
      result.add(q);
    }
    log.info("extractQuestionsFromDocument: {} fayl → {} sual çıxarıldı", files.size(),
        result.size());
    return result;
  }

  private static final String[] ALL_LETTERS = {"A", "B", "C", "D", "E"};

  private List<ExamQuestion> extractFromImage(String base64, String mimeType) {
    String prompt = """
        Bu səhifədəki bütün çoxseçimli sualları qaydalara uyğun tap.

        CAVABI YALNIZ bu JSON formatında ver (başqa heç bir mətn, izah, markdown bloku yox):
        {
          "suallar": [
            {
              "box_2d": [100, 20, 340, 480],
              "sonHerf": "D",
              "dogruCavab": "A",
              "izah": "...",
              "fenn": "...",
              "movzu": "...",
              "cetinlik": "orta"
            }
          ]
        }""";

    List<Map<String, Object>> content = List.of(
        Map.of("type", "text", "text", prompt),
        Map.of("type", "image_url", "image_url",
            Map.of("url", "data:%s;base64,%s".formatted(mimeType, base64)))
    );
    String responseContent = chatClient.chat(systemAndUser(AiPrompts.EXTRACT_RULES, content));
    String cleaned = JsonUtil.stripMarkdownFences(responseContent);
    ExtractResponse parsed = JsonUtil.fromJson(cleaned, ExtractResponse.class);
    if (parsed == null || parsed.suallar == null) {
      return List.of();
    }

    List<ExamQuestion> out = new ArrayList<>();
    for (RawExtracted rq : parsed.suallar) {
      if (rq.box_2d == null || rq.box_2d.length != 4 || rq.dogruCavab == null) {
        continue;
      }
      try {
        String cropped = imageService.cropByNormalizedBox(base64, rq.box_2d);
        if (cropped == null) {
          continue;
        }
        String sonHerf = List.of("C", "D", "E").contains(rq.sonHerf) ? rq.sonHerf : "D";
        int sonIdx = List.of(ALL_LETTERS).indexOf(sonHerf);
        Map<String, String> variantlar = new LinkedHashMap<>();
        for (int i = 0; i <= sonIdx; i++) {
          variantlar.put(ALL_LETTERS[i], "•");
        }

        ExamQuestion q = new ExamQuestion();
        q.setSual("");
        q.setVariantlar(variantlar);
        q.setDogruCavab(rq.dogruCavab);
        q.setIzah(rq.izah != null ? rq.izah : "");
        q.setFenn(rq.fenn != null ? rq.fenn : "Ümumi");
        q.setMovzu(rq.movzu != null ? rq.movzu : "");
        q.setCetinlik(rq.cetinlik != null ? rq.cetinlik : "orta");
        q.setSualShekil("data:image/png;base64," + cropped);
        out.add(q);
      } catch (Exception e) {
        log.error("Sual şəkli kəsilə bilmədi, ötürülür:", e);
      }
    }
    return out;
  }

  // === Xəta tipi classify ===
  public String classifyError(String sual, String izah, String sehvCavab, String dogruCavab,
      String fenn) {
    try {
      String prompt = """
          Fənn: %s
          Sual: %s
          Şagirdin seçdiyi (səhv) cavab: %s
          Doğru cavab: %s
          Doğru həllin izahı: %s

          Səhvin əsas səbəbi hansı kateqoriyadır? Yalnız bir söz: konseptual, hesab, oxumaq, vaxt və ya diqqet."""
          .formatted(fenn, sual, sehvCavab, dogruCavab, izah);

      String tip = chatClient.chat(systemAndUser(AiPrompts.ERROR_CLASSIFIER_SYSTEM, prompt), 2000)
          .trim().toLowerCase(Locale.ROOT).replaceAll("[^a-zəıöüğçş]", "");
      return List.of("konseptual", "hesab", "oxumaq", "vaxt", "diqqet").contains(tip) ? tip
          : "diqqet";
    } catch (Exception e) {
      return "diqqet";
    }
  }

  public String shortAdvice(String prompt) {
    return chatClient.chat(systemAndUser(AiPrompts.ADVICE_SYSTEM, prompt), 3000).trim();
  }

  public String rawJsonPrompt(String systemPrompt, String userPrompt) {
    return rawJsonPrompt(systemPrompt, userPrompt, null);
  }

  /**
   * maxTokens — bu çağırış üçün aşkar override (TPM limiti üçün bax ChatCompletionClient.chat).
   */
  public String rawJsonPrompt(String systemPrompt, String userPrompt, Integer maxTokens) {
    return JsonUtil.stripMarkdownFences(chatClient.chat(systemAndUser(systemPrompt, userPrompt), maxTokens));
  }

  /**
   * JSON təmizləmədən — sərbəst mətn (məs. mini-dərs Markdown) üçün.
   */
  public String rawText(String systemPrompt, String userPrompt) {
    return rawText(systemPrompt, userPrompt, null);
  }

  public String rawText(String systemPrompt, String userPrompt, Integer maxTokens) {
    return chatClient.chat(systemAndUser(systemPrompt, userPrompt), maxTokens);
  }

  // === Yardımçı tip/qeyd sinifləri ===
  public record TutorContext(String qrup, String hedefUniversite, List<String> zəifFənnlər) {

  }

  public record ZəifFenn(String fenn, int seviyye) {

  }

  public record FennProqresi(String fenn, int seviyye) {

  }

  public record ParentReportInput(String ad, String qrup, String hedefUniversite, int toplamSual,
                                  int dogruCavab,
                                  int streak, List<FennProqresi> fənnProqresi, int aktivGünSayı) {

  }

  public record ExamSetResult(List<ExamQuestion> suallar, Map<String, Integer> fennBolugu) {

  }

  public record DocumentFile(String base64, String mimeType) {

  }

  @Data
  @JsonIgnoreProperties(ignoreUnknown = true)
  private static class QuestionsResponse {

    private List<GeneratedQuestion> suallar;
    private List<GeneratedQuestion> questions;
  }

  @Data
  @JsonIgnoreProperties(ignoreUnknown = true)
  private static class DailyPlanResponse {

    private List<DailyTask> tapşırıqlar;
    private List<DailyTask> tasks;
  }

  @Data
  @JsonIgnoreProperties(ignoreUnknown = true)
  private static class WeaknessResponse {

    private List<WeaknessItem> zəifTərəflər;
  }

  @Data
  @JsonIgnoreProperties(ignoreUnknown = true)
  private static class ExtractResponse {

    private List<RawExtracted> suallar;
  }

  @Data
  @JsonIgnoreProperties(ignoreUnknown = true)
  private static class RawExtracted {

    private int[] box_2d;
    private String sonHerf;
    private String dogruCavab;
    private String izah;
    private String fenn;
    private String movzu;
    private String cetinlik;
  }
}
