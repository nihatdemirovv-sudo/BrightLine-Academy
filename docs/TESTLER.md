# Testlər

Bütün testlər backend-dədir: `backend/src/test/`.

```bash
cd backend
./gradlew test                                   # bütün testlər (canlı AI testi avtomatik ötürülür)
./gradlew test --tests '*E2ETest'                # yalnız E2E testlər
./gradlew test --tests '*TeacherApprovalE2ETest' # bir sinif
```

Nəticə hesabatı: `backend/build/reports/tests/test/index.html`.

Windows-da istifadəçi qovluğunun adında boşluq varsa, Gradle-dan əvvəl:

```bash
export JAVA_TOOL_OPTIONS="-Djdk.net.unixdomain.tmpdir=C:/tmpjdk"
```

## Giriş → çıxış formatı

Hər test bütün yoxlamaları keçəndən sonra öz blokunu yazır (`TestIo`): **giriş** (göndərilən sorğu,
parametrlər), **çıxış** (alınan cavab) və **nəticə** (nə yoxlandı). Bloklar həm konsolda görünür,
həm də `backend/build/reports/test-io.md` faylına yığılır. Son real işə salınmanın nəticələri:
[`docs/test-neticeleri/`](test-neticeleri/README.md).

## Necə işləyir

- Testlərin öz konfiqurasiyası var: `src/test/resources/application.yml`. Əsas `application.yml`-i
  (real açarlı, git-də olmayan fayl) tam əvəz edir, ona görə testlər heç bir real açar və ya baza
  tələb etmir və təzə klonlanmış repoda da işləyir.
- Baza: yaddaşda H2 (`create-drop`) — hər işə salmada təmiz.
- Tətbiq təsadüfi boş portda real HTTP server kimi qalxır; testlər ona əsl HTTP sorğuları göndərir
  (controller → service → baza → JSON cavabı — uçdan-uca).
- AI: `FakeAiController` eyni portda OpenAI-uyğun `/fake-ai/chat/completions` endpoint-i açır.
  Gələn hər sorğunu yadda saxlayır (testlər promptun quruluşunu yoxlayır) və rola görə real AI-yə
  bənzəyən cavab qaytarır. Sual cavabında LaTeX qəsdən TƏK backslash ilə yazılır — real modelin ən
  çox etdiyi səhv — ki, bərpa məntiqi yoxlansın.
- Bütün E2E siniflər eyni Spring kontekstini paylaşır, ona görə hər test unikal istifadəçi adı yaradır.

## Nə yoxlanılır

| Sinif | Ssenarilər |
|---|---|
| `TeacherApprovalE2ETest` | Müəllim qeydiyyatı → status tokeni → "Gözləyir" → admin bildirişində görünmə → təsdiq → "Təsdiqləndi" → giriş; rədd → giriş bağlı; admin bildirişləri girişsiz 401; token profil cavabında sızmır |
| `MessagingAndUnreadE2ETest` | Şəxsi mesaj yalnız qəbul edilmiş əlaqədə; kənar tələbə bloklanır; mesaj sayğacı (gəlir, oxunanda sıfırlanır, öz mesajı sayılmır); Azərbaycan hərfləri; öz mesajını silmək; qrup sayğacı; Müəllimim sayğacları (sorğu, tapşırıq, imtahan); müəllimin yoxlanılmamış cavab sayı |
| `AiFlowsE2ETest` | 10 sual: 5 unikal variant, LaTeX bərpası, qarışdırmadan sonra izahdakı cavab hərfi; prompt: `system` rolu, dil/KaTeX/JSON qaydaları, 2 paralel hissədə 10 fərqli mövzu; istifadəçi mövzusu və çətinliyin ayrılması; "Təsadüfi" fənn; AI Müəllim konteksti; günlük plan |
| `JsonUtilTest` | `\frac`, `\theta`, `\neq`, `\beta`, `\right)`, `\sqrt`, `\cdot`, `\,`, `\%`, `\begin{cases}`, `\underline` bərpası; düzgün escape, sətir keçidi və dırnaq toxunulmaz; JSON-da artıq vergül |
| `ArenaE2ETest` | Bilik Arenası: iki iştirakçı fərqli cavab verir — yarış zamanı hər kəs yalnız öz seçimini görür (rəqibdən yalnız cavab sayı), doğru cavablar gizlidir; bitəndən sonra hər iştirakçının hər suala verdiyi cavab görünür |
| `RealtimePrivacyE2ETest` | Real SSE axınına qoşulur: qrupda göndərənin "Məndən sil" filtri, Arenada cavab verənin seçimi digər abunəçilərə gedən yayımda OLMUR |
| `VariantShuffleTest` | Variantlar qarışdırılandan sonra izahdakı "A)", "C variantı", "variant B", "Doğru cavab: A" istinadları yeni hərflərə çevrilir; `P(A)` və həndəsi nöqtələr toxunulmaz |
| `FiguraTest` | Fiqurda şərtdə verilməyən ölçülər "?" ilə gizlədilir (real AI nümunəsi); keyfiyyət filtri bağlanmamış düsturlu, yanlış cavab açarlı və özünü düzəldən izahlı sualı atır, Excel ünvanlarındakı `$`-ı düstur saymır |
| `AiPromptsTest` | Hər qrupun hər fənni üçün mövzu proqramı; backslash səviyyələri; ortaq qaydaların rollara qoşulması |
| `LiveAiQualityTest` | Canlı AI — aşağıya bax |

Testlərin həqiqətən səhv tutduğu yoxlanılıb: LaTeX bərpası müvəqqəti söndürüləndə 4 test yıxıldı.

## Canlı AI keyfiyyət testi

Real Gemini API-yə sorğu göndərir (pul xərcləyir), ona görə yalnız açıq şəkildə işə salınır:

```bash
AI_LIVE_TEST=1 GEMINI_API_KEY=... ./gradlew test --tests '*LiveAiQualityTest'
```

İstəyə bağlı dəyişənlər: `AI_MODEL` (defolt `gemini-3.8-flash`), `AI_BASE_URL`, `AI_REASONING`,
`AI_LIVE_FENN` (məs. `Məntiq,Fizika` — yalnız bu fənlər). Gradle env dəyişənlərini test girişi
saymır, ona görə təkrar işə salanda `./gradlew cleanTest test` istifadə et.

Nə edir: 13 fənn/qrup kombinasiyası + 3 məqsədli riyaziyyat bölməsi (loqarifm, triqonometriya,
fiqurlu həndəsə) üzrə 5-ər sual yaradır (paralel), sonra AI Müəllimdən bir triqonometriya cavabı
alır. Avtomatik yoxlamalar:

- 5 sual gəlib, sual mətni boş deyil, variantlar düz A–E, boş və təkrarlanan variant yoxdur;
- `dogruCavab` variantlardan biridir, izahdakı "Doğru cavab: X" onunla eynidir;
- `cetinlik` — asan / orta / cetin;
- LaTeX: `$` sayı cütdür, hər düsturda `{ }` balanslıdır, `\ce`, `\(`, `\[` yoxdur, pozulmuş escape
  simvolu (form-feed, tab) yoxdur;
- Türkiyə türkcəsi sözləri yoxdur (soru, cevap, denklem, üçgen, sarkaç, hız, ...);
- dəstdə eyni sual təkrarlanmır.

Bütün suallar, variantlar, izahlar, fiqurlar və tapılan problemlər `backend/build/reports/ai-quality.md`
faylına yazılır — markdown görüntüləyicidə açıb məzmunu gözlə yoxlamaq üçün.

### KaTeX render yoxlaması

Canlı test AI-nin yazdığı bütün düsturları `backend/build/reports/latex-snippets.json`-a yazır.
Onları saytın istifadə etdiyi eyni KaTeX və eyni parametrlərlə render etmək üçün (repo kökündən):

```bash
node scripts/katex-render-check.cjs backend/build/reports/latex-snippets.json
```

Nəticə: `backend/build/reports/katex-check.md` (düstur sayı, xəta verənlər, ən çox işlənən əmrlər).

## Yeni test əlavə edəndə

- E2E: `E2eTestBase`-dən törət; köməkçilər: `registerStudent`, `approvedTeacher`, `adminSession`,
  `unread`, `markSeen`, `expectError`.
- Yeni AI rolu əlavə etsən, `FakeAiController.respond()`-a həmin rolun system mətnindən tanınan
  fraqment və uyğun saxta cavab əlavə et.
