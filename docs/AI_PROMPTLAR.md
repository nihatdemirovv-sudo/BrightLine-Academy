# AI rolları və promptlar — dəyişikliklər (2026-10-09)

Bu sənəd BrightLine Academy-nin bütün AI funksiyalarında istifadə olunan rol (system) promptlarını,
ortaq keyfiyyət qaydalarını və bu dəyişiklik zamanı edilən düzəlişləri təsvir edir.

## Niyə dəyişdi

Əvvəlki promptlar Groq-un pulsuz planının sərt token limitinə (8000 token/dəqiqə) görə qəsdən çox
qısa saxlanılırdı. Ödənişli Gemini API-yə keçidlə bu məhdudiyyət aradan qalxdı, ona görə bütün
rollar genişləndirildi, dəqiqləşdirildi və bir yerə toplandı.

## Əsas dəyişikliklər

1. **Bütün promptlar bir faylda** — `backend/src/main/java/com/aitqdk/magistr/ai/AiPrompts.java`.
   Dil, LaTeX/KaTeX və JSON qaydaları ortaq sabitlərdir və hər AI funksiyasına eyni şəkildə qoşulur.
2. **Rol mesajı `system` oldu** — əvvəl təlimatlar `assistant` rolu ilə göndərilirdi (model onları
   "öz əvvəlki cavabı" kimi qəbul edir və zəif əməl edirdi). İndi hamısı `system` roludur.
3. **Fənn proqramları genişləndirildi** — hər fənn üçün DİM proqramına uyğun alt-mövzulu siyahı
   (Riyaziyyat 37, Fizika 32, Kimya 31, Biologiya 34, Tarix 26, Coğrafiya 17, Ədəbiyyat 17,
   Azərbaycan dili 23, İngilis dili 23 + magistr 16, İnformatika 15 + magistr 15, Məntiq 21 mövzu)
   və fənnə xas yazılış qaydaları (vahidlər, kimya düsturları, genetika, kod izləmə, Excel və s.).
4. **Sual generatorunda təkrarların qarşısı alındı** — mövzu göstərilməyəndə mövzular artıq
   Java-da təsadüfi paylanır və hər suala ayrıca mövzu verilir. Əvvəl 10–20 suallıq dəstin paralel
   5-lik hissələri eyni promptu aldığı üçün oxşar suallar çıxırdı. Hissələrə "variasiya kodu" də verilir.
5. **"Təsadüfi (qarışıq)" fənn seçimi işləyir** — əvvəl prompt bunu tanımırdı; indi hər sual
   üçün şagirdin qrupunun fənlərindən biri təsadüfi seçilir və sualın `fenn` sahəsi doldurulur.
6. **Çətinlik tələbi ayrıca oxunur** — "(çətin səviyyədə)", "çətinlik səviyyəsi: asan" kimi
   əlavələr mövzu adından ayrılır və prompta ayrıca, dəqiq tələb kimi verilir.
7. **LaTeX/KaTeX düzəlişləri (kod səviyyəsində)** — aşağıya bax.

## Rollar

| Sabit | Harada işlənir | Qısa təsvir |
|---|---|---|
| `TUTOR_SYSTEM` | AI Müəllim söhbəti | DİM-ə hazırlayan repetitor: sual tipinə görə cavab strukturu (məsələ / nəzəriyyə / "məni yoxla" / şagirdin həlli / plan), imtahan biliyi, TTS-ə uyğun üslub, sərhədlər |
| `IMAGE_SOLVER_RULES` | Şəkillə məsələ həlli | Şərti dəqiq köçürmək (oxunmayan yerdə `[oxunmur]`), fiqurun təsviri, Həll / Cavab bölmələri |
| `QUESTION_WRITER_SYSTEM` + `QUESTION_RULES` | Sual Generatoru, İmtahan Simulyatoru, Diaqnostika, Arena, mini-dərs quizi | DİM test tərtibçisi: sual quruluşu və tipləri, distraktor dizaynı, çətinlik tərifləri, izah strukturu, JSON-dan əvvəl 5 addımlı özünüyoxlama |
| `fennQaydalari()` / `movzular()` | Sual generasiyası, gündəlik plan | Fənnə xas qaydalar və DİM mövzu siyahısı |
| `PLANNER_SYSTEM` | Günlük plan | Gündə 40–70 sual, yalnız qrup fənləri, zəif fənlərə prioritet, konkret alt-mövzu |
| `ANALYST_SYSTEM` | Zəif tərəflər | Yalnız verilən rəqəmlərə əsaslanan diaqnoz və ölçülə bilən tövsiyə |
| `PARENT_REPORT_SYSTEM` | Valideyn raportu | Hörmətli, obyektiv ton; uydurma statistika yox; meta-şərh qadağan |
| `EXTRACT_RULES` | PDF/şəkildən sual çıxarma | `box_2d` sahəsinin dəqiq sərhədləri, iki sütunlu səhifə, cavab açarı |
| `ERROR_CLASSIFIER_SYSTEM` | Xəta analizi | 5 xəta tipinin nümunəli tərifləri |
| `ADVICE_SYSTEM` | Qısa məsləhət | Bir cümləlik konkret texnika |
| `MINI_LESSON_SYSTEM` | Dərs Təkrarı | 5 dəqiqəlik strukturlu dərs prinsipləri |
| `WEAK_TOPIC_SYSTEM` | Zəif mövzular | Səhvlərdən alt-mövzu çıxarma, prioritet 1–5 |
| `CV_SYSTEM` | CV Yaratma | ATS-dostu, təbii Azərbaycan dili, uydurma fakt yox |
| `UNIVERSITY_SYSTEM` | Universitet Kodlaşdırması | Yalnız verilən siyahı və ballarla işləmək |
| `CUTOFF_FORMAT_SYSTEM` | Admin: keçid ballarının formatlanması | Rəqəmləri dəyişmədən formatlama |

## Ortaq qaydalar

- **`AZ_DIL`** — ədəbi Azərbaycan dili; tez-tez qarışdırılan 50-dən çox Türkiyə türkcəsi sözünün
  düzgün qarşılığı (soru → sual, hız → sürət, denklem → tənlik və s.); rəsmi dərslik terminləri;
  onluq kəsrdə vergül.
- **`LATEX`** — yalnız KaTeX-in dəstəklədiyi sintaksis: `$...$` / `$$...$$`, balanslı mötərizələr,
  `\operatorname{tg}` (KaTeX-də `\tg` yoxdur), düstur içində `\%`, `0{,}5`, kimya üçün `\mathrm{}`
  (KaTeX-də `\ce` yoxdur), fizika vahidləri `20\,\text{m/s}`, cədvəl xanasında `\lvert x \rvert`,
  pul vahidi üçün `$` işlətməmək.
- **`JSON`** — JSON sətrində LaTeX backslash-ının ikiqat yazılması və səbəbi.

## Kod səviyyəsində LaTeX/KaTeX düzəlişləri

1. **`JsonUtil.repairLatexEscapes()`** (backend) — AI JSON cavabını parse etməzdən əvvəl tək
   backslash-lı LaTeX əmrlərini bərpa edir. Əvvəlki vəziyyət:
   - `\frac` → form-feed + "rac", `\theta` → tab + "heta", `\neq` → yeni sətir + "eq";
   - `\underline`, `\uparrow` → parse xətası (bütün sual dəsti itirdi);
   - `\sqrt`, `\cdot`, `\left`, `\end`, `\,`, `\%` → lenient parser backslash-ı **atırdı**
     ("sqrt{2}" xam mətn qalırdı, `\%` isə `%` olub KaTeX-də düsturun qalanını silirdi).

   İndi: cüt sayda backslash-a toxunulmur; `\"`, `\/` və `\uXXXX` (unicode) saxlanılır;
   `b/f/n/r/t` ilə başlayanlarda yalnız tanınmış LaTeX əmrləri düzəldilir (adi sətir keçidi qalır);
   qalan bütün tək backslash-lar ikiqatlaşdırılır.
2. **`markdown.tsx`** (frontend):
   - KaTeX makroları: `\tg`, `\ctg`, `\arctg`, `\arcctg`;
   - düstur içindəki escape olunmamış `%` avtomatik `\%` olur;
   - köhnə, artıq bazada saxlanmış məzmundakı form-feed/backspace simvolları `\f`/`\b`-yə qaytarılır;
   - `throwOnError: false`, `strict: "ignore"`.

## Kod səviyyəsində keyfiyyət qoruyucuları (sual generatoru)

AI təlimatlara 100% əməl etmədiyi üçün aşağıdakılar promptdan asılı olmayaraq kodda zəmanət altındadır
(hamısı canlı AI testində aşkarlanmış real problemlərdən yaranıb, bax [test-neticeleri](test-neticeleri/README.md)):

| Qoruyucu | Harada | Nə edir |
|---|---|---|
| JSON rejimi | `ChatCompletionClient` (`response_format: json_object`) | Model yalnız etibarlı JSON qaytarır |
| Token limiti 32000 | `AiService.SUAL_MAX_TOKENS` | Çox düşünülən fənlərdə (Məntiq) cavab kəsilmir; kəsiləndə loqa xəbərdarlıq |
| Keyfiyyət filtri | `AiService.keyfiyyetQusuru()` | Bağlanmamış düstur, natamam/təkrar variant, variantlarda olmayan doğru cavab, izahla uyğun gəlməyən cavab açarı, özünü düzəldən izah — sual atılır, yerinə yenisi istənir |
| Fiqur sanitarı | `AiService.gizletHellEdileni()` | Fiqurda şərtdə verilməyən ölçülər "?" olur — fiqur həlli açmır |
| Hərf istinadlarının çevrilməsi | `AiService.remapVariantHerfleri()` | Variantlar qarışdırılandan sonra izahdakı bütün "A)", "C variantı", "Doğru cavab: X" yeni hərflərə uyğunlaşır |
| Tolerant JSON | `JsonUtil` | LaTeX backslash bərpası, artıq vergül və şərh qəbul olunur |
| Şəbəkə təkrarı | `ChatCompletionClient` | "Connection reset"/timeout zamanı avtomatik təkrar cəhd |

## Yoxlanılanlar

- Backend kompilyasiya olunur; prompt sabitlərinin son mətni yoxlanıldı (escape səviyyələri düzgündür).
- `repairLatexEscapes` nümunəsi: `\frac`, `\theta`, `\neq`, `\underline`, `\left…\right)`,
  `\text{}`, `\sqrt{}`, `\begin{cases}…\end{cases}` düzgün bərpa olundu, `\n` sətir keçidi toxunulmaz qaldı.
- Promptlarda tövsiyə olunan bütün KaTeX konstruksiyaları real KaTeX ilə render testindən keçdi.
- Avtomatik testlər yazıldı (bax [TESTLER.md](TESTLER.md)): saxta AI ilə E2E testlər promptun
  quruluşunu, LaTeX bərpasını və mövzu bölgüsünü yoxlayır; `LiveAiQualityTest` isə real AI ilə
  bütün fənlər üzrə sual keyfiyyətini yoxlayır (ödənişli açar aktiv olandan sonra işə salınmalıdır).

## Gələcək dəyişikliklər üçün qeydlər

- `AiPrompts` sabitlərində `%` var — onları **heç vaxt** `String.formatted()`-dən keçirmə, yalnız `+` ilə birləşdir.
- Java mənbəsində, hətta şərhdə də, backslash + `u` yazma — Java onu unicode escape kimi oxuyur və kompilyasiya xətası verir.
- Yeni fənn əlavə edəndə `AiPrompts.fennKey()`, `movzular()` və `fennQaydalari()`-ni yenilə.
