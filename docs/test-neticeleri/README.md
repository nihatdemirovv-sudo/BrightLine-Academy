# Test nəticələri

> **English summary.** Results of the last real run (2026-10-09, model `gemini-3.8-flash`):
> **34/34 automated tests pass** (E2E, unit and live AI). The live test generated **80 questions**
> with the real Gemini API across 13 subjects/groups plus logarithms, trigonometry and geometry —
> **0** reached the user with a quality issue; **717** AI-written formulas rendered with **0** KaTeX errors.
> Files: [`TEST_GIRIS_CIXIS.md`](TEST_GIRIS_CIXIS.md) — every test as *input → output → verdict*
> (38 blocks); [`CANLI_AI_SUALLARI.md`](CANLI_AI_SUALLARI.md) — all real AI questions with options,
> correct answers, step-by-step explanations and figures; [`KATEX_YOXLAMASI.md`](KATEX_YOXLAMASI.md) —
> render check of every formula. The list below ("Testlərin tapdığı...") documents 12 real bugs the tests
> found and how each was fixed (wrong answer keys, unclosed formulas, leaked answers in figures,
> real-time privacy leaks in the quiz and group chat, etc.). Documentation is in Azerbaijani.

Son işə salınma: 2026-10-09, model `gemini-3.8-flash`. Nəticələr `cd backend && ./gradlew test`
(canlı AI ilə: `AI_LIVE_TEST=1 GEMINI_API_KEY=...`) əmrinin real çıxışıdır.

## Xülasə

| Göstərici | Nəticə |
|---|---|
| Avtomatik testlər | **34 / 34 keçdi** (E2E, unit və canlı AI) |
| Real AI ilə yaradılan sual | **80** (13 fənn/qrup + loqarifm, triqonometriya, həndəsə) |
| İstifadəçiyə çatan qüsurlu sual | **0** |
| Keyfiyyət filtrinin atıb əvəz etdiyi sual | **0** bu run-da (əvvəlki run-larda 3–4: özünü düzəldən izah, bağlanmamış düstur, yanlış cavab açarı) |
| AI-nin yazdığı düstur | **717** |
| KaTeX-də xəta verən düstur | **0** (100% düzgün render) |
| Həndəsi fiqurlu sual | **5** (fiqurda yalnız şərtdə verilən ölçülər) |

## Fayllar

| Fayl | Məzmun |
|---|---|
| [TEST_GIRIS_CIXIS.md](TEST_GIRIS_CIXIS.md) | Hər test: **giriş** (göndərilən sorğu) → **çıxış** (alınan cavab) → **nəticə** (nə yoxlandı). 38 blok. |
| [CANLI_AI_SUALLARI.md](CANLI_AI_SUALLARI.md) | Real AI-nin yaratdığı bütün suallar: şərt, A–E variantları (doğru cavab qalın), addım-addım izah, fiqur məlumatı; sonda AI Müəllim nümunəsi. |
| [KATEX_YOXLAMASI.md](KATEX_YOXLAMASI.md) | Bütün düsturların saytdakı eyni KaTeX parametrləri ilə render nəticəsi və ən çox işlənən LaTeX əmrləri. |

## Canlı AI testinin hər sual üçün yoxladıqları

- 5 sual gəlib, sual mətni boş deyil, variantlar düz A–E, boş və ya təkrarlanan variant yoxdur;
- doğru cavab variantlardan biridir və izahdakı "Doğru cavab: X" onunla eynidir;
- çətinlik dərəcəsi — asan / orta / cetin;
- LaTeX: `$` sayı cütdür (kod blokları istisna), hər düsturda `{ }` balanslıdır, KaTeX-də olmayan
  `\ce`, `\(`, `\[` yoxdur, JSON escape-dən pozulmuş simvol yoxdur;
- Türkiyə türkcəsi sözləri yoxdur;
- fiqur varsa, tipi saytın çəkə bildiyi 10 tipdən biridir;
- dəstdə eyni sual təkrarlanmır.

## Testlərin tapdığı və düzəldilmiş real problemlər

Canlı AI testləri bir neçə real qüsur aşkarladı. Hamısı kodda düzəldildi və hər biri üçün ayrıca test var:

1. **Məntiq sualları 0 qayıdırdı** — model uzun düşünür və cavab token limitində kəsilirdi. Həll:
   JSON rejimi (`response_format: json_object`) və generator üçün 32000 token limiti.
2. **İzah köhnə variant hərflərinə istinad edirdi** ("C variantında...") — variantlar sonradan
   qarışdırıldığı üçün hərflər yanlış olurdu. Həll: qarışdırmadan sonra izahdakı bütün hərf
   istinadları bir keçiddə yeni hərflərə çevrilir (`VariantShuffleTest`).
3. **Fiqur həllin cavabını açırdı** — trapesiya sualında şərtdə verilməyən oturacaqlar fiqurda
   yazılırdı. Həll: şərtdə olmayan ədədlər fiqurda "?" ilə gizlədilir (`FiguraTest`).
4. **Bağlanmamış düstur** (`$30-cu`) — saytda mətni qarışdırırdı. Həll: keyfiyyət filtri qüsurlu
   sualı atır və yerinə yenisini istəyir; Excel ünvanlarındakı `$` (kod içində) sayılmır.
5. **JSON-da artıq vergül** (`,}`) — sual dəsti itirdi. Həll: parser bunu qəbul edir (`JsonUtilTest`).
6. **Şəbəkə qırılması** ("Connection reset") — sorğu dərhal xəta verirdi. Həll: avtomatik təkrar cəhd.
7. **Yanlış cavab açarı** — AI izahda düzgün hesablayıb (5, B) amma `dogruCavab`-ı başqa varianta
   (4, E) qoyurdu; izahda "Yenidən sayaq" kimi özünü düzəltmə var idi. Həll: izahdakı cavab ilə
   `dogruCavab` uyğun gəlmirsə və ya izah özünü düzəldirsə, sual atılır (`FiguraTest`).

## İstifadəçi testində tapılan problemlər

8. **Vektor düsturu xam mətn kimi görünürdü** (`\vec{a}`) — frontend normallaşdırıcısı düsturun
   İÇİNDƏKİ `(2\vec{a} + \vec{b})` mötərizəsini də `$...$`-a salıb düsturu parçalayırdı. Riyazi cavab
   (0,5) doğru idi. Həll: mötərizə çevirmələri yalnız düsturdan kənar mətndə işləyir (`markdown.tsx`).
9. **Bilik Arenasında rəqibin seçimi görünürdü** — kimsə cavab verəndə server real vaxt yeniləməsini
   cavab verənin şəxsi vəziyyəti ilə hamıya göndərirdi. Həll: yayım neytraldır, hər kəs yalnız öz
   seçimini görür; bitəndən sonra hər iştirakçının hər suala verdiyi cavab göstərilir (`ArenaE2ETest`).
10. **Qrup söhbətində eyni tip yayım səhvi** — mesaj yazanın şəxsi "Məndən sil" filtri real vaxt
    yayımı ilə bütün üzvlərə gedirdi: başqasının mesajı üzvlərin ekranından itir, gizlədilmiş mesaj
    isə geri görünürdü. Həll: yayım neytraldır, hər üzv öz görünüşünü ayrıca alır (`RealtimePrivacyE2ETest`
    — real SSE axınını oxuyur; köhnə kodla test yıxılır).
11. **AI mətni bəzi yerlərdə düstursuz (xam) göstərilirdi** — AI tövsiyələri (zəif tərəflər, zəif
    mövzular, fənn detalı), təkrar kartları, keçmiş imtahan siyahısı və admin panelindəki suallar
    `$\frac{...}$` kimi görünürdü. Həll: hamısı KaTeX-li Markdown komponentindən keçir.
12. **Sərbəst mətn cavablarında bağlanmamış düstur** (AI Müəllim, şəkil həlli, mini-dərs) — belə
    cavabda AI-dən bir dəfə yenidən soruşulur.
