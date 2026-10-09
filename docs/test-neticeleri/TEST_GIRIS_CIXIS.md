# Test nəticələri — giriş və çıxış

İşə salınma: 2026-10-09 17:05

## Keyfiyyət filtri — yanlış cavab açarı olan AI sualı istifadəçiyə çatmır

**Giriş (input):**

```json
{
  "AI-nin dogruCavab" : "E ($4$)",
  "AI-nin izahı" : "... Yenidən sayaq: cəmi 5 ... Doğru cavab: B.",
  "AI-nin sualı" : "təyin oblastındakı tam ədədlərin sayı"
}
```

**Çıxış (output):**

```json
{
  "nəticə" : "sual atılır, yerinə AI-dən yenisi istənir",
  "filtrin qərarı" : "izahdakı cavab (B) dogruCavab (E) ilə uyğun deyil"
}
```

**Nəticə:** ✅ izah 5 (B) deyir, cavab açarı 4 (E) göstərir — uyğunsuz sual rədd edildi; özünü düzəldən izah da rədd olunur

## Keyfiyyət filtri — qüsurlu AI sualı istifadəçiyə çatmır

**Giriş (input):**

```json
{
  "AI-nin izahı" : "... $30-cu V (CV) ...  (bağlanmayan $)"
}
```

**Çıxış (output):**

```json
{
  "nəticə" : "sual atılır, yerinə AI-dən yenisi istənir",
  "filtrin qərarı" : "bağlanmamış düstur ($)"
}
```

**Nəticə:** ✅ balanssız düsturlu sual rədd edildi; düzəldilmiş variant qəbul olundu

## Fiqur həllin cavabını açmamalıdır

**Giriş (input):**

```json
{
  "sual" : "Düzbucaqlı trapesiyanın daxilinə radiusu $4\\,\\text{sm}$ olan çevrə çəkilmişdir. Trapesiyanın böyük yan tərəfi $10\\,\\text{sm}$ olarsa, onun sahəsini tapın.",
  "AI-nin fiquru" : {
    "type" : "trapezoid",
    "a" : "6",
    "b" : "12",
    "height" : "8"
  }
}
```

**Çıxış (output):**

```json
{
  "saytda göstərilən fiqur" : {
    "type" : "trapezoid",
    "a" : "?",
    "b" : "?",
    "height" : "?"
  }
}
```

**Nəticə:** ✅ şərtdə verilməyən oturacaqlar (6, 12) və hündürlük (8) — həllin ara nəticələri — '?' ilə gizlədildi

## Variant qarışdırılması — izahdakı hərflərin düzəldilməsi

**Giriş (input):**

```json
Köhnə → yeni hərf: {E=B, D=D, C=A, B=E, A=C}

AI-nin yazdığı izah:
A) $2^2 + 3^2 = 13$
C) $1^2 + 5^2 = 26$
$4$ qiyməti C variantındadır, variant B isə yanlışdır. Doğru cavab: A.
```

**Çıxış (output):**

```json
Qarışdırmadan sonra izah:
C) $2^2 + 3^2 = 13$
A) $1^2 + 5^2 = 26$
$4$ qiyməti A variantındadır, variant E isə yanlışdır. Doğru cavab: C.
```

**Nəticə:** ✅ 'A)', 'C variantı', 'variant B', 'Doğru cavab: A' bir keçiddə yeni hərflərə çevrildi (A↔C zənciri qarışmadı)

## Günlük AI plan

**Giriş (input):**

```json
{
  "endpoint" : "GET /api/daily-quest?sessionId=<1-ci qrup tələbəsi>"
}
```

**Çıxış (output):**

```json
{
  "tapşırıqlar" : [ {
    "fenn" : "Riyaziyyat",
    "movzu" : "Kvadrat tənliklər",
    "sualSayi" : 15,
    "movzuQisa" : "Viyet teoremi",
    "onem" : "yuksek"
  }, {
    "fenn" : "Fizika",
    "movzu" : "Kinematika",
    "sualSayi" : 10,
    "movzuQisa" : "Bərabərtəcilli hərəkət",
    "onem" : "orta"
  }, {
    "fenn" : "Kimya",
    "movzu" : "Məhlullar",
    "sualSayi" : 10,
    "movzuQisa" : "Kütlə payı",
    "onem" : "orta"
  }, {
    "fenn" : "Azərbaycan dili",
    "movzu" : "Feil",
    "sualSayi" : 10,
    "movzuQisa" : "Feili sifət",
    "onem" : "asagi"
  } ]
}
```

**Nəticə:** ✅ 4 tapşırıqlıq plan yaradıldı; AI-yə yalnız qrupun imtahan fənlərindən seçmək tapşırıldı

## Sual generatoru — 10 sual, LaTeX bərpası

**Giriş (input):**

```json
{
  "endpoint" : "POST /api/generate-questions",
  "body" : {
    "sessionId" : "<tələbə sessiyası>",
    "fenn" : "Riyaziyyat",
    "say" : 10,
    "movzu" : "Ümumi mövzu, çətin səviyyədə"
  },
  "AI-nin xam cavabı (nümunə)" : "\"sual\": \"Hesablayın: $\\frac{1}{2} + \\sqrt{4} \\cdot 25\\%$\" — tək backslash"
}
```

**Çıxış (output):**

```json
{
  "sual sayı" : 10,
  "ilk 2 sual" : [ {
    "sual" : "Hesablayın: $\\frac{1}{2} + \\sqrt{4} \\cdot 25\\%$ (sual 1).",
    "variantlar" : {
      "A" : "$13$",
      "B" : "$12$",
      "C" : "$11$",
      "D" : "$15$",
      "E" : "$14$"
    },
    "dogruCavab" : "C",
    "izah" : "Kəsr: $$\\dfrac{a}{b}$$ Burada $\\theta$ və $x \\neq 0$. Doğru cavab: C.",
    "movzu" : "Riyaziyyat — test mövzusu 1",
    "cetinlik" : "orta",
    "fenn" : "Riyaziyyat"
  }, {
    "sual" : "Hesablayın: $\\frac{2}{2} + \\sqrt{4} \\cdot 25\\%$ (sual 2).",
    "variantlar" : {
      "A" : "$25$",
      "B" : "$22$",
      "C" : "$21$",
      "D" : "$23$",
      "E" : "$24$"
    },
    "dogruCavab" : "C",
    "izah" : "Kəsr: $$\\dfrac{a}{b}$$ Burada $\\theta$ və $x \\neq 0$. Doğru cavab: C.",
    "movzu" : "Riyaziyyat — test mövzusu 2",
    "cetinlik" : "orta",
    "fenn" : "Riyaziyyat"
  } ]
}
```

**Nəticə:** ✅ 10 sual qayıtdı; hər birində 5 unikal variant (A–E); \frac, \sqrt, \theta, \neq, \% bütöv qaldı; variantlar qarışdırılandan sonra izahdakı 'Doğru cavab' hərfi dogruCavab ilə eynidir

## Sual promptunun quruluşu — 2 paralel hissə, 10 fərqli mövzu

**Giriş (input):**

```json
{
  "endpoint" : "POST /api/generate-questions",
  "body" : {
    "sessionId" : "<tələbə sessiyası>",
    "fenn" : "Riyaziyyat",
    "say" : 10,
    "movzu" : "Ümumi mövzu, çətin səviyyədə"
  }
}
```

**Çıxış (output):**

```json
{
  "AI-yə gedən sorğu sayı" : 2,
  "system rolunda olan qaydalar" : [ "AZƏRBAYCAN DİLİ QAYDALARI", "RİYAZİ YAZILIŞ (KaTeX)", "JSON QAYDALARI" ],
  "hissələrə paylanan mövzular" : [ "Triqonometrik tənliklər və bərabərsizliklər", "Triqonometriyanın əsasları: radian ölçü, vahid çevrə, rüblərdə işarələr, çevirmə düsturları, əsas triqonometrik eyniliklər", "Ehtimal və statistika: klassik ehtimal, hadisələrin cəmi və hasili, orta qiymət, moda, median, diaqramların oxunması", "Cəbri ifadələr: qısa vurma düsturları, çoxhədlinin vuruqlara ayrılması, cəbri kəsrlərin sadələşdirilməsi, Bezu teoremi", "Nisbət, tənasüb və faiz: faiz artımı/azalması, ardıcıl faiz dəyişməsi, düz və tərs mütənasiblik, qarışıq və məhlul məsələləri", "Həndəsi silsilə: n-ci hədd, cəm, sonsuz azalan həndəsi silsilənin cəmi", "Loqarifm: tərifi və xassələri, loqarifmik ifadələrin hesablanması", "Triqonometrik düsturlar: toplama, ikiqat və yarım bucaq, cəmin hasilə çevrilməsi, ifadələrin sadələşdirilməsi və hesablanması", "Stereometriyanın əsasları: fəzada düz xətt və müstəvilərin qarşılıqlı vəziyyəti, perpendikulyar və mail, ikiüzlü bucaq", "Xətti tənliklər, parametrli xətti tənlik və iki məchullu tənliklər sistemi" ],
  "1-ci hissənin istifadəçi promptu (başlanğıc)" : "TAPŞIRIQ: \"Riyaziyyat\" fənnindən 5 ədəd ORİJİNAL çoxseçimli (A–E) test sualı hazırla.\nHədəf auditoriya: 1-ci ixtisas qrupu (DİM-in buraxılış və qəbul imtahanı — 11-ci sinfi bitirib universitetə qəbul olunmaq istəyən abituriyent; səviyyə: tam orta məktəb proqramı, İBTİDAİ/ORTA SİNİF DEYİL).\n\nMÖVZU BÖLGÜSÜ — hər sual sıra ilə öz mövzusundan olsun (mövzunun içindən konkret alt-mövzunu özün seç):\n1. Ehtimal və statistika: klassik ehtimal, hadisələrin cəmi və hasili, orta qiymət, moda, median, diaqramların oxunması\n2. Loqarifm: tərifi və xassələri, loqarifmik ifadələrin hesablanması\n3. Triqonometriyanın əsasları: radian ölçü, vahid çevrə, rüblərdə işarələr, çevirmə düsturları, əsas triqonometrik eyniliklər\n4. Cəbri ifadələr: qısa vurma düsturları, çoxhədlinin vuruqlara ayrılması, cəbri kəsrlərin sadələşdirilməsi, Bezu teoremi\n5. Xətti tənliklər, parametrli xətti tənlik və iki məchullu tənliklər sistemi\nÇƏTİNLİK: çətin səviyyədə.\nBu "
}
```

**Nəticə:** ✅ 5-lik 2 hissə; hər hissədə system rolu + dil/KaTeX/JSON qaydaları; 10 sualın hər biri proqramdan fərqli mövzu aldı

## Təsadüfi (qarışıq) fənn rejimi

**Giriş (input):**

```json
{
  "endpoint" : "POST /api/generate-questions",
  "body" : {
    "sessionId" : "<tələbə sessiyası>",
    "fenn" : "Təsadüfi",
    "say" : 8
  },
  "tələbənin qrupu" : "1"
}
```

**Çıxış (output):**

```json
{
  "sual sayı" : 8,
  "hər sualın fənni" : [ "Azərbaycan dili", "Fizika", "Azərbaycan dili", "Xarici dil", "Kimya", "Fizika", "İnformatika", "Riyaziyyat" ]
}
```

**Nəticə:** ✅ 8 sual qayıtdı, hər birinin fənni 1-ci qrupun fənlərindəndir: [Riyaziyyat, Azərbaycan dili, Xarici dil, Fizika, Kimya, İnformatika]

## Şagirdin mövzusu və çətinliyi ayrıca oxunur

**Giriş (input):**

```json
{
  "endpoint" : "POST /api/generate-questions",
  "body" : {
    "sessionId" : "<tələbə sessiyası>",
    "fenn" : "Fizika",
    "say" : 3,
    "movzu" : "Kinematika (orta çətinlikdə)"
  }
}
```

**Çıxış (output):**

```json
{
  "AI-yə gedən promptdan sətirlər" : [ "MÖVZU: \"Kinematika\". Bütün suallar bu mövzu daxilində olsun, amma hər sual FƏRQLİ alt-aspekti, fərqli sual tipini və fərqli ədədləri yoxlasın.", "ÇƏTİNLİK: orta çətinlikdə.", "FƏNN QAYDALARI — FİZİKA:" ]
}
```

**Nəticə:** ✅ mövzu "Kinematika" və çətinlik "orta çətinlikdə" ayrı-ayrı tələb kimi verildi, fizika qaydaları qoşuldu

## AI Müəllim — şagird konteksti ilə söhbət

**Giriş (input):**

```json
{
  "endpoint" : "POST /api/tutor-chat",
  "body" : {
    "sessionId" : "<1-ci qrup tələbəsi>",
    "messages" : [ {
      "role" : "user",
      "content" : "x^2 - 5x + 6 = 0 tənliyini həll et"
    } ]
  }
}
```

**Çıxış (output):**

```json
{
  "cavab (reply)" : "### Həll\nDiskriminant düsturu: $$D = b^2 - 4ac$$ Burada $a = 1$, $b = -5$, $c = 6$. Deməli $D = 1$.\n\n**Cavab: 2 və 3**",
  "AI-yə verilən şagird konteksti" : "ŞAGİRD HAQQINDA (cavabı buna uyğunlaşdır):\n- Səviyyə: 1-ci ixtisas qrupu (DİM-in buraxılış və qəbul imtahanı — 11-ci sinfi bitirib universitetə qəbul olunmaq istəyən abituriyent; səviyyə: tam orta məktəb proqramı, İBTİDAİ/ORTA SİNİF DEYİL)\n- İmtahan fənləri: Riyaziyyat, Azərbaycan dili, Xarici dil, Fizika, Kimya, İnformatika\n- Hədəf universitet/ixtisas: qeyd olunmayıb"
}
```

**Nəticə:** ✅ cavab LaTeX düsturu ilə qayıtdı; system rolunda müəllim qaydaları, şagirdin qrupu, imtahan fənləri və zəif fənləri var

## Bilik Arenası — cavabların məxfiliyi və yekun nəticə

**Giriş (input):**

```json
{
  "addımlar" : [ "A müsabiqə yaradır (Riyaziyyat, 5 sual)", "B qoşulur", "A başladır", "1-ci sual: A → \"A\", B → \"B\"", "A öz vəziyyətinə baxır", "admin yarışı bitirir" ]
}
```

**Çıxış (output):**

```json
{
  "yarış zamanı A-nın gördüyü öz seçimləri" : {
    "0" : "A"
  },
  "yarış zamanı A-nın gördüyü rəqib məlumatı" : [ {
    "ad" : "Test Tələbə arA9e5987cf",
    "cavabladiSay" : 1
  }, {
    "ad" : "Test Tələbə arB322880ef",
    "cavabladiSay" : 1
  } ],
  "bitəndən sonra hər iştirakçının seçimi" : [ {
    "ad" : "Test Tələbə arA9e5987cf",
    "secimler" : {
      "0" : "A"
    },
    "xal" : 0
  }, {
    "ad" : "Test Tələbə arB322880ef",
    "secimler" : {
      "0" : "B"
    },
    "xal" : 0
  } ]
}
```

**Nəticə:** ✅ yarış zamanı hər kəs yalnız öz seçimini və rəqibin neçə suala cavab verdiyini görür (seçimi yox), doğru cavablar gizlidir; bitəndən sonra hər iştirakçının hansı suala nə cavab verdiyi görünür

## Mesaj sayğacı (badge)

**Giriş (input):**

```json
{
  "müəllim tələbəyə 2 mesaj yazır" : [ "Sabah dərs var", "Əla, şükür — ğ ç ş ö ü ı ə" ],
  "sonra" : "tələbə cavab yazır: \"Oldu, müəllim\""
}
```

**Çıxış (output):**

```json
{
  "tələbənin sayğacı (açmadan əvvəl)" : {
    "total" : 2,
    "items" : {
      "4e3de0a3c0c942668a52b81c0b062e1a" : 2
    }
  },
  "söhbət siyahısı" : [ {
    "partnerId" : "4e3de0a3c0c942668a52b81c0b062e1a",
    "ad" : "Test Müəllim tmae28a607",
    "altBaslik" : "Riyaziyyat",
    "muellimdi" : true,
    "sonMesaj" : "Əla, şükür — ğ ç ş ö ü ı ə",
    "sonMesajVaxti" : "2026-10-09T13:05:43.717023Z",
    "sonGonderenMenem" : false,
    "oxunmamis" : 2
  } ],
  "tələbənin sayğacı (açandan sonra)" : 0,
  "müəllimin sayğacı (tələbə cavab yazandan sonra)" : {
    "total" : 1,
    "items" : {
      "efda504cff6b4fa19a3237eb2e581bc9" : 1
    }
  }
}
```

**Nəticə:** ✅ gələn mesajlar sayılır, söhbət açılanda sıfırlanır, öz mesajın sayılmır, Azərbaycan hərfləri olduğu kimi qalır

## Müəllimim bölməsinin və müəllim panelinin sayğacları

**Giriş (input):**

```json
{
  "1. müəllim tapşırıq yaradır" : "POST /api/teacher/tasks {baslik: \"Ev tapşırığı\"}",
  "2. tələbə Tapşırıqlar tabını açır" : "POST /api/unread/seen {key: \"mt:tasks\"}",
  "3. müəllim imtahan elan edir" : "POST /api/teacher/exams {baslik: \"Sınaq 1\"}",
  "4. tələbə cavab göndərir" : "POST /api/student/exams/{id}/submit"
}
```

**Çıxış (output):**

```json
{
  "1. tələbənin 'tapşırıq' sayğacı" : 1,
  "2. tabı açandan sonra" : 0,
  "3. tələbənin 'imtahan' sayğacı" : 1,
  "4. müəllimin 'yoxlanılmamış cavab' sayğacı" : 1
}
```

**Nəticə:** ✅ yeni tapşırıq/imtahan tələbədə, yeni cavab müəllimdə sayğac kimi görünür; tab açılanda sıfırlanır

## Qrup sayğacı (badge)

**Giriş (input):**

```json
{
  "digər üzv qrupa yazır" : [ "mesaj 1", "mesaj 2", "mesaj 3" ],
  "tələbə özü yazır" : "öz mesajım",
  "sonra" : "tələbə qrupu açır: POST /api/unread/seen {key: \"group:<groupId>\"}"
}
```

**Çıxış (output):**

```json
{
  "tələbənin sayğacı (açmadan əvvəl)" : {
    "total" : 3,
    "items" : {
      "e2e0f3ce438843839141ac81fec0d5ec" : 3
    }
  },
  "tələbənin sayğacı (açandan sonra)" : 0,
  "digər üzvün sayğacı" : 1
}
```

**Nəticə:** ✅ başqalarının 3 mesajı sayıldı, öz mesajı sayılmadı, qrup açılanda sıfırlandı

## Şəxsi mesaj — yalnız qəbul edilmiş əlaqədə

**Giriş (input):**

```json
{
  "1. əlaqəsiz müəllim → tələbə" : "POST /api/dm/{studentId} {mesaj: \"salam\"}",
  "2. müəllim sorğu göndərir" : "POST /api/teacher/students",
  "3. tələbə qəbul edir, müəllim yazır" : "POST /api/dm/{studentId} {mesaj: \"Salam!\"}",
  "4. kənar tələbə → müəllim" : "POST /api/dm/{teacherId} {mesaj: \"hey\"}"
}
```

**Çıxış (output):**

```json
{
  "1. cavab" : {
    "HTTP" : 401,
    "body" : "{\"error\":\"Yalnız himayə sorğusu qəbul edilmiş müəllim və tələbə yazışa bilər.\"}"
  },
  "2. tələbədə gələn sorğu sayğacı" : 1,
  "3. söhbət" : [ {
    "id" : "cda80d52738f4821912ce6ad94d782fe",
    "senderId" : "0cce56a353104408ba9851f6884a295f",
    "silinib" : false,
    "mesaj" : "Salam!",
    "createdAt" : "2026-10-09T13:05:46.078326Z"
  } ],
  "4. cavab" : {
    "HTTP" : 401
  }
}
```

**Nəticə:** ✅ əlaqə qəbul edilməyənə qədər yazışma bağlıdır (401), qəbuldan sonra açılır, kənar şəxs yaza bilmir

## Arena real vaxt yayımı — rəqibin seçimi sızmır

**Giriş (input):**

```json
{
  "1" : "A və B yarışa başlayır",
  "2" : "A SSE axınını dinləyir",
  "3" : "B 1-ci suala \"B\" cavabını verir"
}
```

**Çıxış (output):**

```json
{
  "A-ya gələn yayımda 'menimIstirakim'" : false,
  "A-ya gələn iştirakçı məlumatı" : [ {
    "ad" : "Test Tələbə aAfe2c8edc",
    "cavabladiSay" : 0
  }, {
    "ad" : "Test Tələbə aB6595c432",
    "cavabladiSay" : 1
  } ]
}
```

**Nəticə:** ✅ yayımda heç kimin seçimi yoxdur — yalnız neçə suala cavab verildiyi; hər iştirakçı öz seçimini ayrıca öz sorğusu ilə alır

## Qrup real vaxt yayımı — şəxsi filtr sızmır

**Giriş (input):**

```json
{
  "1" : "B qrupa \"B-nin mesajı\" yazır",
  "2" : "A həmin mesajı \"Məndən sil\" edir",
  "3" : "B qrupun SSE axınını dinləyir",
  "4" : "A yeni mesaj yazır"
}
```

**Çıxış (output):**

```json
{
  "B-yə gələn yayımdakı mesajlar" : [ "B-nin mesajı", "A-nın yeni mesajı" ],
  "A-nın öz görünüşü" : [ "A-nın yeni mesajı" ]
}
```

**Nəticə:** ✅ yayım neytraldır: A-nın şəxsi gizlətməsi B-nin ekranından mesajı silmir; A isə öz görünüşündə onu görmür

## Rədd edilmiş müəllim

**Giriş (input):**

```json
{
  "addımlar" : [ "POST /api/auth/register {rol: muellim}", "POST /api/admin/teachers/{id}/reject", "GET /api/auth/teacher-status", "POST /api/auth/login" ]
}
```

**Çıxış (output):**

```json
{
  "status" : "RED",
  "giriş cavabı" : {
    "HTTP" : 401,
    "body" : "{\"error\":\"Müəllim qeydiyyatınız təsdiqlənməyib.\"}"
  }
}
```

**Nəticə:** ✅ rədd ediləndən sonra status RED olur və giriş 401 ilə bağlıdır

## Müəllim qeydiyyatı → admin təsdiqi → canlı status

**Giriş (input):**

```json
{
  "1. qeydiyyat" : "POST /api/auth/register {rol: muellim, username: muelf32612a6, fənn: Riyaziyyat, sənəd şəkli}",
  "2. status sorğusu" : "GET /api/auth/teacher-status?token=<token>",
  "3. təsdiqdən əvvəl giriş" : "POST /api/auth/login",
  "4. admin" : "GET /api/admin/notifications → POST /api/admin/teachers/{id}/approve",
  "5. təsdiqdən sonra" : "status sorğusu + giriş"
}
```

**Çıxış (output):**

```json
{
  "qeydiyyat cavabı" : {
    "pending" : true,
    "username" : "muelf32612a6",
    "mesaj" : "Qeydiyyat sorğunuz göndərildi. Admin sənədinizi yoxladıqdan sonra (adətən 12 saat ərzində) hesabınız təsdiqlənəcək və bu istifadəçi adı/şifrə ilə daxil ola biləcəksiniz.",
    "statusToken" : "mst_b40e7b8d4e9f4e7eaf727585dbdb2017"
  },
  "status (təsdiqdən əvvəl)" : "GOZLEYIR",
  "giriş (təsdiqdən əvvəl)" : {
    "pending" : true,
    "username" : "muelf32612a6",
    "mesaj" : "Hesabınız hələ təsdiqlənməyib. Admin sənədinizi yoxlayan kimi bu ekranda bildiriş görəcəksiniz.",
    "statusToken" : "mst_b40e7b8d4e9f4e7eaf727585dbdb2017"
  },
  "admin bildirişləri girişsiz" : 401,
  "status (təsdiqdən sonra)" : "TESDIQLENIB",
  "giriş (təsdiqdən sonra)" : {
    "sessionId" : "<verildi>",
    "rol" : "muellim",
    "ad" : "Test Müəllim muelf32612a6"
  }
}
```

**Nəticə:** ✅ müəllim təsdiqə qədər daxil ola bilmir, gözləmə ekranı tokenlə statusu izləyir, admin yeni sorğunu görür, təsdiqdən sonra status dərhal dəyişir və giriş açılır

## Canlı AI sual generatoru — Riyaziyyat (1-ci qrup)

**Giriş (input):**

```json
{
  "fenn" : "Riyaziyyat",
  "qrup" : "1",
  "say" : 5,
  "model" : "gemini-3.8-flash"
}
```

**Çıxış (output):**

```json
[ {
  "sual" : "$\\log_{0{,}5}(x^2 - 5x + 6) \\ge -1$ bərabərsizliyinin tam həllərinin cəmini tapın.",
  "variantlar" : {
    "A" : "$10$",
    "B" : "$4$",
    "C" : "$5$",
    "D" : "$3$",
    "E" : "$7$"
  },
  "dogruCavab" : "C",
  "izah" : "Bərabərsizliyin təyin oblastını tapaq: $$x^2 - 5x + 6 > 0 \\implies (x - 2)(x - 3) > 0 \\implies x \\in (-\\infty; 2) \\cup (3; +\\infty)$$ Loqarifmin əsası $0{,}5 < 1$ olduğuna görə işarə əksinə dəyişir: $$x^2 - 5x + 6 \\le (0{,}5)^{-1} \\implies x^2 - 5x + 6 \\le 2 \\implies x^2 - 5x + 4 \\le 0$$ Buradan $(x - 1)(x - 4) \\le 0$, yəni $x \\in [1; 4]$ alınır. Təyin oblastı ilə kəsişməni götürsək: $$x \\in [1; 2) \\cup (3; 4]$$ Bu aralıqdakı tam həllər $1$ və $4$ ədədləridir. Onların cəmi: $1 + 4 = 5$. Ən çox edilən səhv təyin oblastının unudularaq $2$ və $3$ ədədlərinin də daxil edilməsidir. Doğru cavab: C.",
  "movzu" : "Loqarifmik bərabərsizliklər — təyin oblastının nəzərə alınması",
  "cetinlik" : "orta",
  "fenn" : "Riyaziyyat"
}, {
  "sual" : "İfadənin qiymətini hesablayın: $$\\dfrac{1 - 4\\sin^2 15^\\circ \\cos^2 15^\\circ}{\\cos 40^\\circ \\cos 20^\\circ - \\sin 40^\\circ \\sin 20^\\circ}$$",
  "variantlar" : {
    "A" : "$2$",
    "B" : "$0{,}75$",
    "C" : "$1$",
    "D" : "$0{,}5$",
    "E" : "$1{,}5$"
  },
  "dogruCavab" : "E",
  "izah" : "Surətdə ikiqat bucağın sinus düsturunu tətbiq edək: $$2\\sin 15^\\circ \\cos 15^\\circ = \\sin 30^\\circ = \\dfrac{1}{2}$$ Onda $4\\sin^2 15^\\circ \\cos^2 15^\\circ = \\left(\\dfrac{1}{2}\\right)^2 = \\dfrac{1}{4}$ olar. Surətin qiyməti: $$1 - \\dfrac{1}{4} = \\dfrac{3}{4}$$ Məxrəcdə kosinusların toplama düsturunu tətbiq edək: $$\\cos 40^\\circ \\cos 20^\\circ - \\sin 40^\\circ \\sin 20^\\circ = \\cos(40^\\circ + 20^\\circ) = \\cos 60^\\circ = \\dfrac{1}{2}$$ Kəsrin qiyməti: $$\\dfrac{\\dfrac{3}{4}}{\\dfrac{1}{2}} = \\dfrac{3}{2} = 1{,}5$$ Doğru cavab: E.",
  "movzu" : "Triqonometrik düsturlar — ikiqat bucaq və toplama teoremləri",
  "cetinlik" : "asan",
  "fenn" : "Riyaziyyat"
}, {
  "sual" : "$x^2 - (2m - 1)x + m^2 - m - 2 = 0$ kvadrat tənliyinin müxtəlif işarəli iki kökünün olması və mənfi kökün modulunun müsbət kökdən böyük olması üçün $m$ parametrinin ala biləcəyi qiymətlər aralığını tapın.",
  "variantlar" : {
    "A" : "$\\left(-1; \\dfrac{1}{2}\\right)$",
    "B" : "$(-\\infty; -1)$",
    "C" : "$(-1; 2)$",
    "D" : "$\\left(\\dfrac{1}{2}; 2\\right)$",
    "E" : "$\\left(-2; \\dfrac{1}{2}\\right)$"
  },
  "dogruCavab" : "A",
  "izah" : "Viyet teoreminə əsasən köklərin hasili və cəmi: $$x_1 \\cdot x_2 = m^2 - m - 2, \\quad x_1 + x_2 = 2m - 1$$ Köklərin müxtəlif işarəli olması üçün hasil mənfi olmalıdır ($x_1 \\cdot x_2 < 0$ olduqda $D > 0$ avtomatik ödənir): $$m^2 - m - 2 < 0 \\implies (m - 2)(m + 1) < 0 \\implies m \\in (-1; 2)$$ Mənfi kökün modulunun müsbət kökdən böyük olması şərti ($|x_{\\text{mənfi}}| > x_{\\text{müsbət}}$) köklərin cəminin mənfi olmasını tələb edir: $$x_1 + x_2 < 0 \\implies 2m - 1 < 0 \\implies m < \\dfrac{1}{2}$$ Hər iki şərtin kəsişməsi: $$m \\in (-1; 2) \\cap \\left(-\\infty; \\dfrac{1}{2}\\right) = \\left(-1; \\dfrac{1}{2}\\right)$$ Doğru cavab: A.",
  "movzu" : "Kvadrat tənliklər — köklərin işarəsi və parametrli tənliklər",
  "cetinlik" : "cetin",
  "fenn" : "Riyaziyyat"
}, {
  "sual" : "Qutuda $4$ ağ və $6$ qara kürəcik var. Qutudan eyni zamanda təsadüfi çıxarılan $3$ kürəcikdən ən azı ikisinin ağ olması ehtimalını tapın.",
  "variantlar" : {
    "A" : "$\\dfrac{7}{24}$",
    "B" : "$\\dfrac{2}{5}$",
    "C" : "$\\dfrac{1}{3}$",
    "D" : "$\\dfrac{1}{2}$",
    "E" : "$\\dfrac{3}{10}$"
  },
  "dogruCavab" : "C",
  "izah" : "Klassik ehtimal düsturuna əsasən: $$P = \\dfrac{m}{n}$$ Bütün mümkün halların sayı $10$ kürəcikdən $3$-nün seçilməsidir: $$n = C_{10}^3 = \\dfrac{10 \\cdot 9 \\cdot 8}{3 \\cdot 2 \\cdot 1} = 120$$ «Ən azı ikisi ağ» hadisəsi ya $2$ ağ və $1$ qara, ya da $3$ ağ kürəciyin çıxarılması deməkdir. Əlverişli halların sayı: $$m = C_4^2 \\cdot C_6^1 + C_4^3 = \\dfrac{4 \\cdot 3}{2} \\cdot 6 + 4 = 36 + 4 = 40$$ Hadisənin ehtimalı: $$P = \\dfrac{40}{120} = \\dfrac{1}{3}$$ Doğru cavab: C.",
  "movzu" : "Ehtimal nəzəriyyəsi — klassik ehtimal və kombinatorika",
  "cetinlik" : "orta",
  "fenn" : "Riyaziyyat"
}, {
  "sual" : "Tənliyin köklərinin hasilini tapın: $$\\sqrt{x^2 - 3x + 5} + x^2 - 3x = 7$$",
  "variantlar" : {
    "A" : "$-7$",
    "B" : "$-12$",
    "C" : "$-4$",
    "D" : "$4$",
    "E" : "$3$"
  },
  "dogruCavab" : "C",
  "izah" : "Dəyişəni əvəz edək: $t = \\sqrt{x^2 - 3x + 5}$, burada $t \\ge 0$. Hər iki tərəfi kvadrata yüksəltsək: $$t^2 = x^2 - 3x + 5 \\implies x^2 - 3x = t^2 - 5$$ İfadəni tənlikdə nəzərə alaq: $$t + t^2 - 5 = 7 \\implies t^2 + t - 12 = 0$$ Tənliyin kökləri $t_1 = 3$ və $t_2 = -4$-dür. $t \\ge 0$ şərtinə görə $t = -4$ kənar kökdür. Əvəzləməyə qayıdaq: $$\\sqrt{x^2 - 3x + 5} = 3 \\implies x^2 - 3x + 5 = 9 \\implies x^2 - 3x - 4 = 0$$ Viyet teoreminə əsasən köklərin hasili: $$x_1 \\cdot x_2 = -4$$ Ən çox edilən səhv $t = -4$ kənar kökünün də yoxlanılaraq əlavə tənlik kimi həll edilməsidir. Doğru cavab: C.",
  "movzu" : "İrrasional tənliklər — yeni dəyişən daxil etmə üsulu",
  "cetinlik" : "cetin",
  "fenn" : "Riyaziyyat"
} ]
```

**Nəticə:** ✅ 5 sual; hər birində 5 unikal variant, izahdakı cavab hərfi dogruCavab ilə eyni, LaTeX balanslı, KaTeX-də olmayan əmr və Türkiyə türkcəsi sözü yoxdur, suallar təkrarlanmır

## Canlı AI sual generatoru — Fizika (1-ci qrup)

**Giriş (input):**

```json
{
  "fenn" : "Fizika",
  "qrup" : "1",
  "say" : 5,
  "model" : "gemini-3.8-flash"
}
```

**Çıxış (output):**

```json
[ {
  "sual" : "Tutumu $C_1 = 6\\,\\mu\\text{F}$ və $C_2 = 12\\,\\mu\\text{F}$ olan iki kondensator ardıcıl birləşdirilərək gərginliyi $U = 60\\,\\text{V}$ olan sabit gərginlik mənbəyinə qoşulmuşdur. Birinci kondensatorun elektrik sahəsinin enerjisini hesablayın.",
  "variantlar" : {
    "A" : "$10{,}8\\,\\text{mJ}$",
    "B" : "$4{,}8\\,\\text{mJ}$",
    "C" : "$1{,}2\\,\\text{mJ}$",
    "D" : "$2{,}4\\,\\text{mJ}$",
    "E" : "$7{,}2\\,\\text{mJ}$"
  },
  "dogruCavab" : "B",
  "izah" : "Ardıcıl birləşmədə ümumi elektrik tutumu aşağıdakı düsturla təyin olunur: $$C_{\\text{üm}} = \\dfrac{C_1 C_2}{C_1 + C_2}$$ Verilənləri yerinə yazaq: $$C_{\\text{üm}} = \\dfrac{6\\,\\mu\\text{F} \\cdot 12\\,\\mu\\text{F}}{6\\,\\mu\\text{F} + 12\\,\\mu\\text{F}} = 4\\,\\mu\\text{F}$$ Ardıcıl birləşmədə hər iki kondensatordan keçən yük ümumi yükə bərabərdir: $$q = q_1 = q_2 = C_{\\text{üm}} U = 4\\,\\mu\\text{F} \\cdot 60\\,\\text{V} = 240\\,\\mu\\text{C}$$ Birinci kondensatorun elektrik sahəsinin enerjisi: $$W_1 = \\dfrac{q_1^2}{2 C_1} = \\dfrac{(240 \\cdot 10^{-6}\\,\\text{C})^2}{2 \\cdot 6 \\cdot 10^{-6}\\,\\text{F}} = 4{,}8 \\cdot 10^{-3}\\,\\text{J} = 4{,}8\\,\\text{mJ}$$ Ən çox edilən səhv ümumi gərginliyin ($60\\,\\text{V}$) birbaşa birinci kondensatora tətbiq edilməsi və nəticədə $10{,}8\\,\\text{mJ}$ alınmasıdır. Doğru cavab: B.",
  "movzu" : "Kondensatorlar — ardıcıl birləşmə və elektrik sahəsinin enerjisi",
  "cetinlik" : "orta",
  "fenn" : "Fizika"
}, {
  "sual" : "Bor nəzəriyyəsinə əsasən, hidrogen atomu enerjisi $E_4 = -0{,}85\\,\\text{eV}$ olan stasionar haldan enerjisi $E_2 = -3{,}4\\,\\text{eV}$ olan stasionar hala keçdikdə şüalandırdığı fotonun enerjisini hesablayın.",
  "variantlar" : {
    "A" : "$4{,}25\\,\\text{eV}$",
    "B" : "$1{,}70\\,\\text{eV}$",
    "C" : "$3{,}40\\,\\text{eV}$",
    "D" : "$0{,}85\\,\\text{eV}$",
    "E" : "$2{,}55\\,\\text{eV}$"
  },
  "dogruCavab" : "E",
  "izah" : "Borun ikinci postulatına əsasən, atom bir stasionar haldan digərinə keçdikdə şüalanan fotonun enerjisi bu səviyyələrin enerjiləri fərqinə bərabərdir: $$E_{\\text{foton}} = E_k - E_n$$ Atom dördüncü səviyyədən ikinci səviyyəyə keçir: $$E_{\\text{foton}} = -0{,}85\\,\\text{eV} - (-3{,}4\\,\\text{eV}) = 2{,}55\\,\\text{eV}$$ Doğru cavab: E.",
  "movzu" : "Atom fizikası — Bor postulatları və şüalanma enerjisi",
  "cetinlik" : "asan",
  "fenn" : "Fizika"
}, {
  "sual" : "Sərtliyi $k = 200\\,\\text{N/m}$ olan üfüqi yay kütləsi $m = 4\\,\\text{kq}$ olan tirəyə bərkidilmişdir. Tirə yayın təsiri altında üfüqi səth boyunca düzxətli bərabərsürətli hərəkət etdirilir. Səthlə tirə arasındakı sürtünmə əmsalı $\\mu = 0{,}2$ olarsa, yayın uzanmasını hesablayın ($g = 10\\,\\text{m/s}^2$).",
  "variantlar" : {
    "A" : "$8\\,\\text{sm}$",
    "B" : "$10\\,\\text{sm}$",
    "C" : "$2\\,\\text{sm}$",
    "D" : "$16\\,\\text{sm}$",
    "E" : "$4\\,\\text{sm}$"
  },
  "dogruCavab" : "E",
  "izah" : "Tirə düzxətli bərabərsürətli hərəkət etdiyindən ona təsir edən qüvvələrin əvəzləyicisi sıfıra bərabərdir. Üfüqi istiqamətdə elastiklik qüvvəsi sürtünmə qüvvəsinə bərabər olmalıdır: $$F_{\\text{elast}} = F_{\\text{sürt}}$$ Huk qanununa və sürtünmə qüvvəsinin düsturuna əsasən: $$k \\Delta l = \\mu m g$$ Buradan uzanmanı tapaq: $$\\Delta l = \\dfrac{\\mu m g}{k} = \\dfrac{0{,}2 \\cdot 4\\,\\text{kq} \\cdot 10\\,\\text{m/s}^2}{200\\,\\text{N/m}} = \\dfrac{8}{200}\\,\\text{m} = 0{,}04\\,\\text{m} = 4\\,\\text{sm}$$ Ən çox edilən səhv metrlə tapılan nəticənin santimetrə çevrilməsində diqqətsizlik etməkdir. Doğru cavab: E.",
  "movzu" : "Qüvvələr — Huk qanunu və sürtünmə qüvvəsi",
  "cetinlik" : "orta",
  "fenn" : "Fizika"
}, {
  "sual" : "Kütləsi $m_1 = 3\\,\\text{kq}$ olan kürə $v_1 = 4\\,\\text{m/s}$ sürətlə hərəkət edərək sükunətdə olan $m_2 = 1\\,\\text{kq}$ kütləli kürə ilə mütləq qeyri-elastik toqquşur. Toqquşma nəticəsində daxili enerjiyə çevrilən mexaniki enerjini hesablayın.",
  "variantlar" : {
    "A" : "$18\\,\\text{J}$",
    "B" : "$24\\,\\text{J}$",
    "C" : "$6\\,\\text{J}$",
    "D" : "$12\\,\\text{J}$",
    "E" : "$3\\,\\text{J}$"
  },
  "dogruCavab" : "C",
  "izah" : "Toqquşmadan əvvəl sistemin tam kinetik enerjisi yalnız birinci kürənin hərəkəti ilə bağlıdır: $$E_{k1} = \\dfrac{m_1 v_1^2}{2} = \\dfrac{3\\,\\text{kq} \\cdot (4\\,\\text{m/s})^2}{2} = 24\\,\\text{J}$$ İmpulsun saxlanma qanununa əsasən, toqquşmadan sonra birləşmiş kürələrin ortaq sürəti: $$m_1 v_1 = (m_1 + m_2) u \\implies u = \\dfrac{m_1 v_1}{m_1 + m_2} = \\dfrac{3 \\cdot 4}{3 + 1} = 3\\,\\text{m/s}$$ Toqquşmadan sonra sistemin kinetik enerjisi: $$E_{k2} = \\dfrac{(m_1 + m_2) u^2}{2} = \\dfrac{4\\,\\text{kq} \\cdot (3\\,\\text{m/s})^2}{2} = 18\\,\\text{J}$$ Daxili enerjiyə çevrilən mexaniki enerji kinetik enerjilərin fərqinə bərabərdir: $$\\Delta E = E_{k1} - E_{k2} = 24\\,\\text{J} - 18\\,\\text{J} = 6\\,\\text{J}$$ Ən çox edilən səhv toqquşmadan sonrakı kinetik enerjini ($18\\,\\text{J}$) itirilən enerji kimi qəbul etməkdir. Doğru cavab: C.",
  "movzu" : "İmpuls — impulsun saxlanma qanunu və qeyri-elastik toqquşma",
  "cetinlik" : "cetin",
  "fenn" : "Fizika"
}, {
  "sual" : "Vakuumda aralarındakı məsafə $d = 60\\,\\text{sm}$ olan iki nöqtəvi $q_1 = +8\\,\\text{nC}$ və $q_2 = -2\\,\\text{nC}$ yükü yerləşir. Bu yükləri birləşdirən düz xətt üzərində yekun elektrik sahəsinin intensivliyinin sıfıra bərabər olduğu nöqtədən $q_2$ yükünə qədər olan məsafəni hesablayın.",
  "variantlar" : {
    "A" : "$60\\,\\text{sm}$",
    "B" : "$30\\,\\text{sm}$",
    "C" : "$20\\,\\text{sm}$",
    "D" : "$40\\,\\text{sm}$",
    "E" : "$120\\,\\text{sm}$"
  },
  "dogruCavab" : "A",
  "izah" : "Müxtəlifişarəli yüklərin yaratdığı elektrik sahəsinin intensivlikləri yüklər arasındakı parçada eyni istiqamətə yönəldiyindən onların cəmi sıfır ola bilməz. Yekun intensivliyin sıfır olduğu nöqtə modulu kiçik olan yükün ($q_2$) xaricində, ondan $x$ məsafədə yerləşməlidir. Bu halda $q_1$-dən həmin nöqtəyə qədər olan məsafə $d + x$ olar. İntensivliklərin modulları bərabər olmalıdır: $$E_1 = E_2 \\implies k \\dfrac{|q_1|}{(d + x)^2} = k \\dfrac{|q_2|}{x^2}$$ Yüklərin qiymətlərini yerinə yazaq: $$\\dfrac{8}{(60 + x)^2} = \\dfrac{2}{x^2} \\implies \\dfrac{4}{(60 + x)^2} = \\dfrac{1}{x^2}$$ Hər iki tərəfdən kvadrat kök alsaq: $$\\dfrac{2}{60 + x} = \\dfrac{1}{x} \\implies 2x = 60 + x \\implies x = 60\\,\\text{sm}$$ Ən çox edilən səhv sıfır nöqtəsinin yüklərin arasında yerləşdiyini güman edib $20\\,\\text{sm}$ cavabını almaqdır. Doğru cavab: A.",
  "movzu" : "Elektrostatika — elektrik sahə intensivliyi və superpozisiya prinsipi",
  "cetinlik" : "cetin",
  "fenn" : "Fizika"
} ]
```

**Nəticə:** ✅ 5 sual; hər birində 5 unikal variant, izahdakı cavab hərfi dogruCavab ilə eyni, LaTeX balanslı, KaTeX-də olmayan əmr və Türkiyə türkcəsi sözü yoxdur, suallar təkrarlanmır

## Canlı AI sual generatoru — Kimya (1-ci qrup)

**Giriş (input):**

```json
{
  "fenn" : "Kimya",
  "qrup" : "1",
  "say" : 5,
  "model" : "gemini-3.8-flash"
}
```

**Çıxış (output):**

```json
[ {
  "sual" : "$\\mathrm{CO}$ və $\\mathrm{CO_2}$-dən ibarət $7{,}2\\,\\text{q}$ qaz qarışığında cəmi $0{,}2\\,\\text{mol}$ maddə var. Bu qarışıq artıq miqdarda götürülmüş közərdilmiş kömür üzərindən keçirildikdə neçə litr (n.ş.) $\\mathrm{CO}$ qazı alınar?\n($M_r(\\mathrm{CO}) = 28$, $M_r(\\mathrm{CO_2}) = 44$, $V_m = 22{,}4\\,\\text{l/mol}$)",
  "variantlar" : {
    "A" : "$5{,}60$",
    "B" : "$2{,}24$",
    "C" : "$4{,}48$",
    "D" : "$6{,}72$",
    "E" : "$8{,}96$"
  },
  "dogruCavab" : "D",
  "izah" : "Qarışıqdakı qazların mol miqdarlarını $n(\\mathrm{CO}) = x$ və $n(\\mathrm{CO_2}) = y$ qəbul edək:\n$$\\begin{cases} x + y = 0{,}2 \\\\ 28x + 44y = 7{,}2 \\end{cases}$$\nBirinci tənlikdən $x = 0{,}2 - y$ əvəzləməsini aparaq:\n$$28(0{,}2 - y) + 44y = 7{,}2$$\n$$5{,}6 + 16y = 7{,}2 \\implies 16y = 1{,}6 \\implies y = 0{,}1\\,\\text{mol}\\;\\mathrm{CO_2}$$\nBuradan $x = 0{,}2 - 0{,}1 = 0{,}1\\,\\text{mol}\\;\\mathrm{CO}$ tapılır.\nKözərdilmiş kömürlə yalnız $\\mathrm{CO_2}$ reaksiyaya daxil olur:\n$$\\mathrm{CO_2 + C \\xrightarrow{t^\\circ} 2CO}$$\nTənliyə əsasən $0{,}1\\,\\text{mol}$ $\\mathrm{CO_2}$-dən $2 \\times 0{,}1 = 0{,}2\\,\\text{mol}$ yeni $\\mathrm{CO}$ əmələ gəlir.\nReaksiyadan sonra sistemdəki $\\mathrm{CO}$-nun ümumi mol miqdarı ilkin qarışıqdakı ilə birlikdə $0{,}1 + 0{,}2 = 0{,}3\\,\\text{mol}$ olar.\nHəcmi hesablayaq:\n$$V(\\mathrm{CO}) = 0{,}3 \\times 22{,}4 = 6{,}72\\,\\text{l}$$\nƏn çox edilən səhv yalnız reaksiyadan alınan $\\mathrm{CO}$-nu hesablayıb ($4{,}48\\,\\text{l}$), ilkin qarışıqdakı $\\mathrm{CO}$-nu unutmalarıdır.\nDoğru cavab: D.",
  "movzu" : "Karbon oksidləri və onların xassələri",
  "cetinlik" : "orta",
  "fenn" : "Kimya"
}, {
  "sual" : "Qələvi məhlulunda $6{,}2\\,\\text{q}$ ağ fosforun disproporsiyalaşması nəticəsində fosfin və kalium-hipofosfit əmələ gəlir:\n$$\\mathrm{P_4 + 3KOH + 3H_2O \\rightarrow PH_3\\uparrow + 3KH_2PO_2}$$\nAlınan fosfin qazının tam yanmasına neçə litr (n.ş.) oksigen qazı sərf olunar?\n($A_r(\\mathrm{P}) = 31$, $V_m = 22{,}4\\,\\text{l/mol}$)",
  "variantlar" : {
    "A" : "$4{,}48$",
    "B" : "$2{,}24$",
    "C" : "$8{,}96$",
    "D" : "$1{,}12$",
    "E" : "$6{,}72$"
  },
  "dogruCavab" : "B",
  "izah" : "Ağ fosfor dördatomlu molekullardan ibarətdir: $M(\\mathrm{P_4}) = 4 \\times 31 = 124\\,\\text{q/mol}$.\nReaksiyaya daxil olan $\\mathrm{P_4}$-ün mol miqdarını tapaq:\n$$n(\\mathrm{P_4}) = \\dfrac{6{,}2}{124} = 0{,}05\\,\\text{mol}$$\nBirinci reaksiya tənliyinə əsasən $1\\,\\text{mol}$ $\\mathrm{P_4}$-dən $1\\,\\text{mol}$ $\\mathrm{PH_3}$ ayrılır:\n$$n(\\mathrm{PH_3}) = 0{,}05\\,\\text{mol}$$\nFosfinin yanma reaksiyasının tənliyi:\n$$\\mathrm{2PH_3 + 4O_2 \\rightarrow P_2O_5 + 3H_2O}$$\nTənliyə əsasən $2\\,\\text{mol}$ $\\mathrm{PH_3}$-ün yanmasına $4\\,\\text{mol}$ $\\mathrm{O_2}$ sərf olunur (nisbət $1:2$).\nTələb olunan oksigenin mol miqdarı:\n$$n(\\mathrm{O_2}) = 2 \\times 0{,}05 = 0{,}1\\,\\text{mol}$$\nOksigenin həcmi (n.ş.):\n$$V(\\mathrm{O_2}) = 0{,}1 \\times 22{,}4 = 2{,}24\\,\\text{l}$$\nTez-tez edilən səhv ağ fosforun formulunu sadəcə $\\mathrm{P}$ qəbul edərək mol kütləsini $31\\,\\text{q/mol}$ götürməkdir ki, bu da yanlış $8{,}96\\,\\text{l}$ cavabına aparır.\nDoğru cavab: B.",
  "movzu" : "Fosfor və onun birləşmələri",
  "cetinlik" : "cetin",
  "fenn" : "Kimya"
}, {
  "sual" : "Hansı proses kimyəvi hadisəyə aiddir?",
  "variantlar" : {
    "A" : "Neftdən benzin fraksiyasının ayrılması",
    "B" : "Dəmir qırıntılarının xlorid turşusunda həll olması",
    "C" : "Şəkər tozunun suda həll olması",
    "D" : "Kristallik yodun qızdırıldıqda sublimasiyası",
    "E" : "Maye havanın fraksiyalı distilləsi"
  },
  "dogruCavab" : "B",
  "izah" : "Fiziki hadisələrdə maddənin tərkibi dəyişmir, yalnız aqreqat halı, forması və ya həcmi dəyişir (distillə, sublimasiya, şəkərin suda fiziki həll olması). Dəmir qırıntılarının xlorid turşusunda həll olması zamanı isə kimyəvi reaksiya baş verir və yeni maddələr əmələ gəlir:\n$$\\mathrm{Fe + 2HCl \\rightarrow FeCl_2 + H_2\\uparrow}$$\nOna görə də bu proses kimyəvi hadisədir. Digər proseslərdə isə yeni maddə yaranmır.\nDoğru cavab: B.",
  "movzu" : "Fiziki və kimyəvi hadisələr",
  "cetinlik" : "asan",
  "fenn" : "Kimya"
}, {
  "sual" : "Kütləsi $200\\,\\text{q}$ olan $10\\%$-li $\\mathrm{CuSO_4}$ məhluluna $50\\,\\text{q}$ mis(II) sulfat pentahidrat ($\\mathrm{CuSO_4 \\cdot 5H_2O}$) əlavə edilib tam həll edilmişdir. Alınan yeni məhlulda $\\mathrm{CuSO_4}$-ün kütlə payını hesablayın.\n($M_r(\\mathrm{CuSO_4}) = 160$, $M_r(\\mathrm{CuSO_4 \\cdot 5H_2O}) = 250$)",
  "variantlar" : {
    "A" : "$28{,}0\\%$",
    "B" : "$16{,}0\\%$",
    "C" : "$20{,}8\\%$",
    "D" : "$24{,}2\\%$",
    "E" : "$26{,}0\\%$"
  },
  "dogruCavab" : "C",
  "izah" : "Məhlulda həll olan maddənin kütlə payı düsturu:\n$$\\omega = \\dfrac{m(\\text{həll olan})}{m(\\text{məhlul})} \\times 100\\%$$\n1. İlkin məhluldakı susuz duzun kütləsi:\n$$m_1(\\mathrm{CuSO_4}) = 200 \\times 0{,}10 = 20\\,\\text{q}$$\n2. Əlavə edilən $50\\,\\text{q}$ kristallohidratdakı susuz $\\mathrm{CuSO_4}$-ün kütləsi:\n$$m_2(\\mathrm{CuSO_4}) = 50 \\times \\dfrac{160}{250} = 32\\,\\text{q}$$\n3. Son məhlulda həll olan $\\mathrm{CuSO_4}$-ün ümumi kütləsi:\n$$m_{\\text{ümumi}}(\\mathrm{CuSO_4}) = 20 + 32 = 52\\,\\text{q}$$\n4. Son məhlulun ümumi kütləsi:\n$$m_{\\text{ümumi}}(\\text{məhlul}) = 200 + 50 = 250\\,\\text{q}$$\n5. Son kütlə payı:\n$$\\omega = \\dfrac{52}{250} \\times 100\\% = 20{,}8\\%$$\nƏn çox edilən səhv $50\\,\\text{q}$ kristallohidratın hamısını susuz duz kimi qəbul edərək $(20+50)/250 = 28{,}0\\%$ tapmaqdır.\nDoğru cavab: C.",
  "movzu" : "Məhlullar — kristallohidratların həll olması",
  "cetinlik" : "cetin",
  "fenn" : "Kimya"
}, {
  "sual" : "$\\mathrm{X^{2+}}$ ionunun elektron konfiqurasiyası $\\mathrm{...3d^6}$ ilə bitir. Neytral $\\mathrm{X}$ atomu üçün hansı ifadələr doğrudur?\nI. Sıra nömrəsi 26-dır.\nII. Dövri sistemin IV dövr, VIII B qrupunda yerləşir.\nIII. Xarici energetik səviyyəsində 8 elektron var.",
  "variantlar" : {
    "A" : "yalnız I",
    "B" : "I və II",
    "C" : "II və III",
    "D" : "I, II və III",
    "E" : "I və III"
  },
  "dogruCavab" : "B",
  "izah" : "Element ion halına keçərkən ilk növbədə ən xarici energetik səviyyədəki elektronlarını itirir. $\\mathrm{X^{2+}}$ ionunun formulu $\\mathrm{1s^2 2s^2 2p^6 3s^2 3p^6 3d^6}$ olduğundan, neytral $\\mathrm{X}$ atomunun elektron konfiqurasiyası:\n$$\\mathrm{1s^2 2s^2 2p^6 3s^2 3p^6 3d^6 4s^2}$$\n1. Elektronların ümumi sayı: $2 + 2 + 6 + 2 + 6 + 6 + 2 = 26$. Neytral atomda proton sayı elektron sayına bərabər olduğundan, sıra nömrəsi 26-dır (I ifadəsi doğrudur).\n2. Baş kvant ədədinin ən böyük qiyməti $n=4$ olduğu üçün IV dövrdə yerləşir. Valent elektronları $3d^6 4s^2$ cəmi $6 + 2 = 8$ olduğu üçün VIII B əlavə yarımqrupunda yerləşir (II ifadəsi doğrudur).\n3. Xarici energetik səviyyə dördüncü səviyyədir ($n=4$) və orada yalnız $4s^2$, yəni 2 elektron var (III ifadəsi yanlışdır; 8 sayı xarici elektronların yox, ümumi valent elektronlarının sayıdır).\nDoğru cavab: B.",
  "movzu" : "Atomun quruluşu — elektron konfiqurasiyası və dövri sistem",
  "cetinlik" : "orta",
  "fenn" : "Kimya"
} ]
```

**Nəticə:** ✅ 5 sual; hər birində 5 unikal variant, izahdakı cavab hərfi dogruCavab ilə eyni, LaTeX balanslı, KaTeX-də olmayan əmr və Türkiyə türkcəsi sözü yoxdur, suallar təkrarlanmır

## Canlı AI sual generatoru — İnformatika (1-ci qrup)

**Giriş (input):**

```json
{
  "fenn" : "İnformatika",
  "qrup" : "1",
  "say" : 5,
  "model" : "gemini-3.8-flash"
}
```

**Çıxış (output):**

```json
[ {
  "sual" : "Faylların, kataloqların və sistem sahələrinin ilkin vəziyyəti barədə məlumatı yadda saxlayan və sonrakı dəyişiklikləri nəzarət cəminə əsasən aşkar edən antivirus proqramları hansılardır?",
  "variantlar" : {
    "A" : "Həkimlər (Faqlar)",
    "B" : "Müfəttişlər (Revizorlar)",
    "C" : "Filtrlər (Keşikçilər)",
    "D" : "İmmunizatorlar (Vaksinlər)",
    "E" : "Detektorlar"
  },
  "dogruCavab" : "B",
  "izah" : "Müfəttiş (revizor) antivirus proqramları disklərin, kataloqların və faylların ilkin parametrlərini (ölçüsü, nəzarət cəmi, yaranma tarixi və s.) xüsusi bazada saxlayır və sonradan cari vəziyyətlə müqayisə edərək fayllarda baş verən dəyişiklikləri aşkar edir. Filtrlər (keşikçilər) isə əməliyyat sistemində şübhəli əməliyyatları nəzarətdə saxlayan rezident proqramlardır. Doğru cavab: B.",
  "movzu" : "İnformasiya təhlükəsizliyi — Antivirus proqramlarının növləri",
  "cetinlik" : "asan",
  "fenn" : "İnformatika"
}, {
  "sual" : "Verilənlər bazasının cədvəl fraqmenti verilmişdir:\n\n| Familiya | Qrup | İmtahan balı | Təqaüd |\n| :--- | :--- | :--- | :--- | \n| Əliyev | 101 | 85 | Hə |\n| Vəliyev | 102 | 92 | Hə |\n| Həsənov | 101 | 68 | Yox |\n| Məmmədov | 103 | 74 | Hə |\n| Qasımov | 102 | 81 | Yox |\n| Babayev | 101 | 95 | Hə |\n\nAşağıdakı məntiqi sorğu şərtini ödəyən yazıların sayını müəyyən edin:\n`(Qrup = 101 OR İmtahan balı > 80) AND Təqaüd = \"Hə\"`",
  "variantlar" : {
    "A" : "3",
    "B" : "4",
    "C" : "5",
    "D" : "2",
    "E" : "1"
  },
  "dogruCavab" : "A",
  "izah" : "Məntiqi şərti addım-addım hər yazı üçün yoxlayaq:\n1. Əliyev: Qrup = 101 (Doğru), Təqaüd = «Hə» (Doğru). Şərt ödənir.\n2. Vəliyev: Balı 92 > 80 (Doğru), Təqaüd = «Hə» (Doğru). Şərt ödənir.\n3. Həsənov: Qrup = 101 olsa da, Təqaüd = «Yox» olduğu üçün AND əməliyyatı nəticəsində şərt ödənmir.\n4. Məmmədov: Qrup 103 və Bal 74 olduğundan mötərizənin içi Yalan olur. Şərt ödənmir.\n5. Qasımov: Balı 81 > 80 olsa da, Təqaüd = «Yox» olduğundan şərt ödənmir.\n6. Babayev: Qrup = 101 (Doğru), Təqaüd = «Hə» (Doğru). Şərt ödənir.\n\nŞərti ödəyən cəmi 3 yazı var (Əliyev, Vəliyev, Babayev). Şagirdlərin ən çox etdiyi səhv OR və AND əməliyyatlarının prioritetini qarışdırmaq və ya Təqaüd sahəsinin Yox qiymətini nəzərdən qaçırmaqdır. Doğru cavab: A.",
  "movzu" : "Verilənlər bazası — Sorğuların təhlili",
  "cetinlik" : "orta",
  "fenn" : "İnformatika"
}, {
  "sual" : "Ölçüsü $512 \\times 256$ piksel olan və 256 rəng çalarına malik təsvirlə ölçüsü $1024 \\times 512$ piksel olan və 16 rəng çalarına malik digər təsvir birlikdə arxivləşdirilir. Arxivləşdirmə nəticəsində faylların ümumi həcmi $25\\%$ azalarsa, sıxılmış arxiv faylının həcmini kilobaytla (KB) hesablayın.",
  "variantlar" : {
    "A" : "192",
    "B" : "576",
    "C" : "144",
    "D" : "384",
    "E" : "288"
  },
  "dogruCavab" : "E",
  "izah" : "Rastr təsvirin həcmi piksel sayı ilə bir pikselin rəng dərinliyinin hasilinə bərabərdir:\n$$V = K_x \\cdot K_y \\cdot i$$\n1. Birinci təsvir üçün: $N_1 = 256 = 2^8$ olduğundan bir piksel $i_1 = 8\\,\\text{bit} = 1\\,\\text{bayt}$ təşkil edir.\n$$V_1 = 512 \\times 256 \\times 1\\,\\text{bayt} = 2^9 \\times 2^8 = 2^{17}\\,\\text{bayt} = \\dfrac{2^{17}}{2^{10}}\\,\\text{KB} = 128\\,\\text{KB}$$\n2. İkinci təsvir üçün: $N_2 = 16 = 2^4$ olduğundan bir piksel $i_2 = 4\\,\\text{bit} = 0{,}5\\,\\text{bayt}$ təşkil edir.\n$$V_2 = 1024 \\times 512 \\times 0{,}5\\,\\text{bayt} = 2^{10} \\times 2^9 \\times 2^{-1} = 2^{18}\\,\\text{bayt} = \\dfrac{2^{18}}{2^{10}}\\,\\text{KB} = 256\\,\\text{KB}$$\n3. İlkin ümumi həcm: $V_{\\text{cəm}} = 128\\,\\text{KB} + 256\\,\\text{KB} = 384\\,\\text{KB}$.\n4. Həcm $25\\%$ azaldıqdan sonra arxiv faylının həcmi:\n$$V_{\\text{arxiv}} = 384 \\times (1 - 0{,}25) = 384 \\times 0{,}75 = 288\\,\\text{KB}$$\nDoğru cavab: E.",
  "movzu" : "İnformasiyanın kodlaşdırılması — Rastr qrafika",
  "cetinlik" : "cetin",
  "fenn" : "İnformatika"
}, {
  "sual" : "MS PowerPoint proqramında slaydların nümayişini birinci slayddan deyil, cari slayddan başlatmaq üçün hansı klaviatura qısayolundan istifadə olunur?",
  "variantlar" : {
    "A" : "Ctrl + F5",
    "B" : "Alt + F5",
    "C" : "F5",
    "D" : "Shift + F5",
    "E" : "F4"
  },
  "dogruCavab" : "D",
  "izah" : "MS PowerPoint proqramında təqdimatı birinci slayddan başlatmaq üçün F5 düyməsi, məhz cari (ekranda seçilmiş) slayddan nümayiş rejiminə keçmək üçün isə Shift + F5 düymələr kombinasiyası istifadə olunur. Doğru cavab: D.",
  "movzu" : "Təqdimatlar — MS PowerPoint interfeysi və nümayiş",
  "cetinlik" : "asan",
  "fenn" : "İnformatika"
}, {
  "sual" : "Həcmi $45\\,\\text{Mbayt}$ olan fayl ötürmə sürəti $16\\,\\text{Mbit/san}$ olan rabitə kanalı vasitəsilə ötürülür. Şəbəkədəki yüklənmə səbəbindən faktiki ötürmə sürəti $25\\%$ azalarsa, bu faylın tam ötürülməsinə neçə saniyə vaxt sərf olunar?",
  "variantlar" : {
    "A" : "30",
    "B" : "36",
    "C" : "40",
    "D" : "18",
    "E" : "22{,}5"
  },
  "dogruCavab" : "A",
  "izah" : "Ötürmə müddəti faylın həcminin rabitə kanalının faktiki ötürmə sürətinə nisbəti ilə tapılır:\n$$t = \\dfrac{V}{v}$$\n1. Faylın həcmini meqabitə çevirək ($1\\,\\text{bayt} = 8\\,\\text{bit}$):\n$$V = 45\\,\\text{Mbayt} = 45 \\times 8\\,\\text{Mbit} = 360\\,\\text{Mbit}$$\n2. Faktiki sürət nominal sürətdən $25\\%$ azdır:\n$$v = 16\\,\\text{Mbit/san} \\times (1 - 0{,}25) = 16 \\times 0{,}75 = 12\\,\\text{Mbit/san}$$\n3. Tələb olunan zaman:\n$$t = \\dfrac{360\\,\\text{Mbit}}{12\\,\\text{Mbit/san}} = 30\\,\\text{saniyə}$$\nƏn çox edilən səhv Mbayt vahidini Mbit vahidinə çevirmədən birbaşa bölmə aparmaqdır. Doğru cavab: A.",
  "movzu" : "Kompüter şəbəkələri — Ötürmə sürəti üzrə hesablamalar",
  "cetinlik" : "cetin",
  "fenn" : "İnformatika"
} ]
```

**Nəticə:** ✅ 5 sual; hər birində 5 unikal variant, izahdakı cavab hərfi dogruCavab ilə eyni, LaTeX balanslı, KaTeX-də olmayan əmr və Türkiyə türkcəsi sözü yoxdur, suallar təkrarlanmır

## Canlı AI sual generatoru — Azərbaycan dili (1-ci qrup)

**Giriş (input):**

```json
{
  "fenn" : "Azərbaycan dili",
  "qrup" : "1",
  "say" : 5,
  "model" : "gemini-3.8-flash"
}
```

**Çıxış (output):**

```json
[ {
  "sual" : "Hansı cümlədə zərfin iki fərqli məna növü işlənmişdir?",
  "variantlar" : {
    "A" : "O, dünənki söhbəti xatırlayıb cəld otaqdan çıxdı.",
    "B" : "Qonaq bayaq gələrək fikrini ucadan bildirdi.",
    "C" : "Qatar gecikəndə hamı narahatlıqla gözləməyə başladı.",
    "D" : "Uşaqlar qaça-qaça irəli getdilər.",
    "E" : "Dostum səhər tezdən oyanıb dərslərini oxudu."
  },
  "dogruCavab" : "B",
  "izah" : "Cümlədə zərfin fərqli məna növlərinin işlənməsi təhlil edilir:\n«Qonaq bayaq gələrək fikrini ucadan bildirdi» cümləsində «bayaq» zaman zərfi, «ucadan» isə tərzi-hərəkət zərfidir. Beləliklə, cümlədə zərfin iki fərqli məna növü işlənmişdir.\n«dünənki söhbəti...» cümləsindəki «dünənki» sözü zərf deyil, zərfdən düzəlmiş sifətdir; «qaça-qaça» və «gecikəndə» sözləri isə zərf deyil, feli bağlamadır. «səhər tezdən» birləşməsi isə mürəkkəb söz kimi yalnız bir məna növünə (zaman zərfinə) aiddir.\nDoğru cavab: B.",
  "movzu" : "Zərf və onun məna növləri",
  "cetinlik" : "orta",
  "fenn" : "Azərbaycan dili"
}, {
  "sual" : "Hansı cümlədə durğu işarələri «V, – m, – v.» sxeminə uyğundur? (Durğu işarələri buraxılmışdır)",
  "variantlar" : {
    "A" : "Dərslərinizə yaxşı hazırlaşın dedi müəllim imtahan yaxınlaşır",
    "B" : "Bu kitablar dedi müəllim sizin üçün gətirilib",
    "C" : "Mən sabah gələcəyəm dedi qonaq siz hazırlaşın",
    "D" : "Bu işi kim görüb deyə o soruşdu dərhal cavab verin",
    "E" : "Biz qalib gəldik qışqırdı əsgər düşmən geri çəkildi"
  },
  "dogruCavab" : "B",
  "izah" : "Vasitəsiz nitq müəllif sözləri ilə parçalandıqda durğu işarələrinin işlənmə qaydası:\nVasitəsiz nitqin birinci hissəsi bitməmiş cümlə olduqda, həmin hissədən sonra vergül və tire, müəllif sözlərindən sonra vergül və tire qoyulur və vasitəsiz nitqin ikinci hissəsi kiçik hərflə davam edir: «V, – m, – v.»\n«Bu kitablar dedi müəllim sizin üçün gətirilib» cümləsində vasitəsiz nitq bütöv bir sadə cümlədir və müəllif sözləri onun arasına daxil olmuşdur: «Bu kitablar, – dedi müəllim, – sizin üçün gətirilib.»\nBirinci hissəsi bitmiş cümlə olan digər nümunələrdə isə müəllif sözlərindən sonra nöqtə və tire qoyulmalı, ikinci hissə böyük hərflə başlamalıdır («V, – m. – V.»).\nDoğru cavab: B.",
  "movzu" : "Vasitəsiz və vasitəli nitq — durğu işarələri",
  "cetinlik" : "cetin",
  "fenn" : "Azərbaycan dili"
}, {
  "sual" : "Şəxssiz cümləni müəyyən edin.",
  "variantlar" : {
    "A" : "Sabahkı tədbir üçün xeyli hazırlıq görüldü.",
    "B" : "Kəndə çatanda artıq qaranlıq düşmüşdü.",
    "C" : "Bu məsələyə iclasda yenidən baxıldı.",
    "D" : "Görüləcək işləri vaxtında yerinə yetirməlidir.",
    "E" : "Bu barədə ona dünən axşam xəbər verdilər."
  },
  "dogruCavab" : "C",
  "izah" : "Sadə cümlənin şəxsə görə növlərinin təyini qaydası:\nŞəxssiz cümlələrdə mübtəda olmur və onun bərpası qeyri-mümkündür. Belə cümlələrin xəbəri III şəxsin təkində olur və adətən şəxssiz növdə olan fel ilə ifadə edilir.\n«Bu məsələyə iclasda yenidən baxıldı» cümləsində xəbər «baxıldı» felidir, cümlədə mübtəda yoxdur və onu bərpa etmək mümkün deyil.\nDigər variantlarda: «qaranlıq düşmüşdü» və «hazırlıq görüldü» cümlələrində qrammatik mübtəda («qaranlıq», «hazırlıq») mövcuddur; «xəbər verdilər» qeyri-müəyyən şəxsli, «yerinə yetirməlidir» isə mübtədası buraxılmış müəyyən şəxsli cümlədir.\nDoğru cavab: C.",
  "movzu" : "Sadə cümlənin şəxsə görə növləri — şəxssiz cümlə",
  "cetinlik" : "orta",
  "fenn" : "Azərbaycan dili"
}, {
  "sual" : "Bütün tayları eyni nitq hissəsinə aid olan omonim sözlər cərgəsini müəyyən edin.",
  "variantlar" : {
    "A" : "sarı, dolu, kök",
    "B" : "çay, biz, qaz",
    "C" : "aşıq, bəbək, əqrəb",
    "D" : "yaz, din, boya",
    "E" : "şiş, daraq, daxma"
  },
  "dogruCavab" : "C",
  "izah" : "Omonimlərin leksik-qrammatik xüsusiyyətləri:\nOmonimlər həm eyni, həm də müxtəlif nitq hissələrinə aid ola bilər.\n«aşıq, bəbək, əqrəb» cərgəsindəki hər bir sözün bütün omonim tayları yalnız isimdir:\n- «aşıq»: oynaq sümüyü (isim) və saz ifaçısı olan sənətkar (isim);\n- «bəbək»: göz bəbəyi (isim) və körpə uşaq (isim);\n- «əqrəb»: buğumayaqlı zəhərli heyvan (isim) və saatın əqrəbi (isim).\nDigər variantlarda verilən sözlərin tayları fərqli nitq hissələrinə aiddir: «sarı» (sifət, fel, qoşma), «kök» (isim, sifət), «yaz» (isim, fel), «biz» (əvəzlik, isim), «qaz» (isim, fel).\nDoğru cavab: C.",
  "movzu" : "Leksika — omonimlər",
  "cetinlik" : "asan",
  "fenn" : "Azərbaycan dili"
}, {
  "sual" : "Mətni oxuyun və onun xüsusiyyətləri ilə bağlı doğru fikirləri müəyyən edin:\n\n«Torpaqşünaslıq tədqiqatları göstərir ki, Kür-Araz ovalığında torpaqların şoranlaşmasının əsas səbəbi qrunt sularının səviyyəsinin qalxması və arid iqlim şəraitində səthdən buxarlanmanın intensiv getməsidir. Minerallaşmış yeraltı suların kapilyar borucuqlar vasitəsilə torpağın üst qatına doğru hərəkəti duz qalıqlarının toplanmasına zəmin yaradır. Aqrotexniki və meliorativ tədbirlərin sistemli aparılması, xüsusən kollektor-drenaj şəbəkələrinin qurulması bu təbii prosesin mənfi təsirlərini minimuma endirməyə imkan verir.»\n\nI. Fikirlər elmi üslubun tələblərinə uyğun olaraq dəqiq və məntiqi ardıcıllıqla ifadə edilmişdir.\nII. Mətndə həm ümumişlək sözlərə, həm də sahəvi terminlərə yer verilmişdir.\nIII. Obrazlılığı təmin etmək üçün bədii təsvir vasitələrindən geniş istifadə olunmuşdur.\nIV. Dil vahidləri əsasən məişət üslubunun normalarına uyğun seçilmişdir.\nV. Xəbərlər əsasən felin xəbər şəklindədir və fikrin bitkinliyini təmin edir.",
  "variantlar" : {
    "A" : "II, III, V",
    "B" : "I, II, V",
    "C" : "I, III, IV",
    "D" : "I, IV",
    "E" : "II, IV, V"
  },
  "dogruCavab" : "B",
  "izah" : "Mətnin funksional üslub xüsusiyyətlərinin təhlili:\nTəqdim olunan mətn elmi üslubdadır.\nI fikir doğrudur: elmi üslub üçün ardıcıllıq, məntiqilik və fikir dəqiqliyi əsas şərtdir.\nII fikir doğrudur: mətndə «torpaq», «səbəb», «təbii» kimi ümumişlək sözlərlə yanaşı, «arid», «meliorativ», «qrunt suları», «kollektor-drenaj» kimi ixtisas terminləri işlənmişdir.\nV fikir doğrudur: cümlələrin xəbərləri («göstərir», «zəmin yaradır», «imkan verir») felin xəbər şəklində işlənərək elmi məlumatın dəqiq və bitkin çatdırılmasını təmin edir.\nIII və IV fikirlər isə yanlışdır: mətndə poetik obrazlılıq (bədii təsvir vasitələri) və məişət üslubuna aid canlı danışıq elementləri yoxdur.\nDoğru cavab: B.",
  "movzu" : "Üslubiyyat və nitq mədəniyyəti — elmi üslub",
  "cetinlik" : "cetin",
  "fenn" : "Azərbaycan dili"
} ]
```

**Nəticə:** ✅ 5 sual; hər birində 5 unikal variant, izahdakı cavab hərfi dogruCavab ilə eyni, LaTeX balanslı, KaTeX-də olmayan əmr və Türkiyə türkcəsi sözü yoxdur, suallar təkrarlanmır

## Canlı AI sual generatoru — Xarici dil (1-ci qrup)

**Giriş (input):**

```json
{
  "fenn" : "Xarici dil",
  "qrup" : "1",
  "say" : 5,
  "model" : "gemini-3.8-flash"
}
```

**Çıxış (output):**

```json
[ {
  "sual" : "Choose the correct words to complete the sentence.\n\nThe government decided to ___ taxes on luxury goods, which caused prices to ___ rapidly.",
  "variantlar" : {
    "A" : "rise, raise",
    "B" : "rise, rise",
    "C" : "raise, rise",
    "D" : "raise, raise",
    "E" : "arise, raise"
  },
  "dogruCavab" : "C",
  "izah" : "\"raise\" feli təsirli feldir (transitive), yəni özündən sonra tamamlıq tələb edir (\"taxes\" tamamlıqdır: vergiləri artırmaq/qaldırmaq). \"rise\" feli isə təsirsiz feldir (intransitive), tamamlıq tələb etmir və mübtədanın özünün qalxmasını, artmasını bildirir (\"prices rise\" — qiymətlər qalxır). \"arise\" feli isə \"meydana çıxmaq, baş vermək\" mənasındadır.\nİngilis dilində nümunə:\nThe shop raised its prices, and living costs rose quickly.\nDoğru cavab: C.",
  "movzu" : "Vocabulary — Commonly confused words (raise / rise)",
  "cetinlik" : "orta",
  "fenn" : "Xarici dil"
}, {
  "sual" : "Choose the correct verb forms to complete the sentence.\n\nIf Mark ___ his alarm clock last night, he ___ late for the interview right now.",
  "variantlar" : {
    "A" : "has set, won't be",
    "B" : "would set, isn't",
    "C" : "had set, wouldn't have been",
    "D" : "set, wouldn't have been",
    "E" : "had set, wouldn't be"
  },
  "dogruCavab" : "E",
  "izah" : "Bu cümlə qarışıq şərt budaq cümləsidir (Mixed Conditional: Type 3 + Type 2). Budaq cümlədəki \"last night\" zaman zərfi keçmişdə baş verməyən hərəkəti bildirdiyi üçün Past Perfect (\"had set\") işlənir. Baş cümlədəki \"right now\" isə həmin keçmiş hərəkətin indiki zamandakı nəticəsini göstərdiyi üçün \"wouldn't + sadə fel\" (\"wouldn't be\") tələb olunur.\nƏn çox edilən səhv: \"last night\" ifadəsinə aldanaraq hər iki tərəfi III tip şərt kimi düşünüb \"had set, wouldn't have been\" variantını seçməkdir; lakin baş cümlədəki \"right now\" nəticənin indiyə aid olduğunu qəti şəkildə müəyyən edir.\nİngilis dilində nümunə:\nIf you had taken the medicine yesterday, you wouldn't feel sick today.\nDoğru cavab: E.",
  "movzu" : "Conditional sentences — Mixed Conditionals",
  "cetinlik" : "cetin",
  "fenn" : "Xarici dil"
}, {
  "sual" : "Choose the line of words that form nouns with the suffix \"-ment\".",
  "variantlar" : {
    "A" : "child, friend, member",
    "B" : "bright, weak, kind",
    "C" : "attract, discuss, direct",
    "D" : "free, king, wise",
    "E" : "agree, entertain, govern"
  },
  "dogruCavab" : "E",
  "izah" : "\"-ment\" şəkilçisi fellərə qoşularaq hərəkətin nəticəsini və ya prosesi bildirən isimlər düzəldir:\nagree (razılaşmaq) → agreement (razılaşma)\nentertain (əyləndirmək) → entertainment (əyləncə)\ngovern (idarə etmək) → government (hökumət)\nDigər variantlardakı sözlər fərqli şəkilçilərlə isim yaradır: \"attract, discuss, direct\" felləri \"-tion / -sion\" şəkilçisi (attraction, discussion, direction); \"bright, weak, kind\" sifətləri \"-ness\" şəkilçisi (brightness, weakness, kindness); \"child, friend, member\" sözləri \"-hood / -ship\" şəkilçisi; \"free, king, wise\" sözləri isə \"-dom\" şəkilçisi (freedom, kingdom, wisdom) qəbul edir.\nDoğru cavab: E.",
  "movzu" : "Word formation — Suffixes forming nouns",
  "cetinlik" : "asan",
  "fenn" : "Xarici dil"
}, {
  "sual" : "Choose the correct modal verb to complete the sentence.\n\nThomas ___ about the surprise party in advance; otherwise, he wouldn't have looked so genuinely shocked when we turned on the lights.",
  "variantlar" : {
    "A" : "should have known",
    "B" : "needn't have known",
    "C" : "can't have known",
    "D" : "could know",
    "E" : "must have known"
  },
  "dogruCavab" : "C",
  "izah" : "Keçmişdə baş vermiş hadisəyə dair qəti inkar ehtimal və ya məntiqi nəticə (qeyri-mümkünlük) bildirmək üçün \"can't + have + V3\" (Perfect Infinitive) quruluşu işlədilir. Cümlədəki \"əks halda işıqları yandıranda bu qədər səmimi şəkildə təəccüblənməzdi\" ifadəsi göstərir ki, Tomasın sürprizdən xəbərdar olması qeyri-mümkün idi (\"can't have known\").\n\"must have known\" təsdiq nəticə (\"yəqin ki, bilirdi\") bildirərək kontekstə ziddir. \"should have known\" keçmişdə yerinə yetirilməyən borc və ya tənqid (\"bilməli idi\"), \"needn't have known\" isə ehtiyacın olmadığını bildirir.\nİngilis dilində nümunə:\nHe can't have stolen the money because he was abroad at that time.\nDoğru cavab: C.",
  "movzu" : "Modal verbs — Modals with Perfect Infinitive",
  "cetinlik" : "cetin",
  "fenn" : "Xarici dil"
}, {
  "sual" : "Choose the correct tense forms to complete the sentence.\n\nBy the time the scientific expedition ___ the base camp next month, they ___ more than five hundred miles across the desert.",
  "variantlar" : {
    "A" : "has reached, will be covering",
    "B" : "reached, had covered",
    "C" : "reaches, will have covered",
    "D" : "reaches, will cover",
    "E" : "will reach, will cover"
  },
  "dogruCavab" : "C",
  "izah" : "Zaman budaq cümlələrində (\"by the time\", \"when\", \"as soon as\") gələcək zamana aid hərəkət olsa belə, \"will\" işlədilmir və onun əvəzinə İndiki Sadə zaman (Present Simple: \"reaches\") işlənir.\n\"By the time + Present Simple\" quruluşu gələcəkdə müəyyən bir vaxta qədər tamamlanacaq hərəkəti bildirdiyi üçün baş cümlədə Gələcək Bitmiş zaman (Future Perfect: \"will have + V3\" → \"will have covered\") tələb olunur.\nƏn çox edilən səhv: \"next month\" zaman zərfini görüb budaq cümlədə də \"will reach\" işlətməkdir; lakin zaman bağlayıcılarından sonra gələcək zaman forması işlənmir.\nİngilis dilində nümunə:\nBy the time she graduates next year, she will have written two books.\nDoğru cavab: C.",
  "movzu" : "Future forms — Future Perfect and time clauses",
  "cetinlik" : "orta",
  "fenn" : "Xarici dil"
} ]
```

**Nəticə:** ✅ 5 sual; hər birində 5 unikal variant, izahdakı cavab hərfi dogruCavab ilə eyni, LaTeX balanslı, KaTeX-də olmayan əmr və Türkiyə türkcəsi sözü yoxdur, suallar təkrarlanmır

## Canlı AI sual generatoru — Tarix (2-ci qrup)

**Giriş (input):**

```json
{
  "fenn" : "Tarix",
  "qrup" : "2",
  "say" : 5,
  "model" : "gemini-3.8-flash"
}
```

**Çıxış (output):**

```json
[ {
  "sual" : "Nadir şah Əfşarın hakimiyyəti dövrünə aid hadisələrin xronoloji ardıcıllığını müəyyən edin:\n1. Qars yaxınlığında Osmanlı qoşunlarının darmadağın edilməsi\n2. Hindistana yürüşün başlanması\n3. Bağdad müqaviləsinin imzalanması\n4. Suqovuşanda Muğan qurultayının keçirilməsi",
  "variantlar" : {
    "A" : "3, 2, 4, 1",
    "B" : "4, 1, 2",
    "C" : "4, 2, 1",
    "D" : "4, 2, 3, 1",
    "E" : "3, 4, 2, 1"
  },
  "dogruCavab" : "C",
  "izah" : "Nadirin şahlıq dövrü 1736-cı ildə Muğan qurultayı ilə başlayır və 1747-ci ilə qədər davam edir. Verilmiş hadisələrin tarixləri: 1. Qars yaxınlığında döyüş — 1745-ci il; 2. Hindistana yürüş — 1738–1739-cu illər; 4. Muğan qurultayı — 1736-cı il. 3-cü bənddəki Bağdad müqaviləsi isə 1733-cü ildə Nadir hələ sərkərdə və qəyyum olduğu dövrdə imzalanmışdır, yəni şahlıq dövrünə aid deyil. Beləliklə, şahlıq dövrünə aid hadisələrin düzgün xronoloji ardıcıllığı 4, 2, 1 olur. Ən çox edilən səhv Bağdad müqaviləsini (1733) Nadirin şahlıq dövrünə daxil etməkdir. Doğru cavab: C.",
  "movzu" : "Nadir şah Əfşar və Əfşarlar dövləti",
  "cetinlik" : "cetin",
  "fenn" : "Tarix"
}, {
  "sual" : "İkinci Dünya müharibəsi illərində Sovet İttifaqı Qəhrəmanı adına iki dəfə layiq görülmüş azərbaycanlı hərbçini müəyyən edin.",
  "variantlar" : {
    "A" : "Gəray Əsədov",
    "B" : "İsrafil Məmmədov",
    "C" : "Mehdi Hüseynzadə",
    "D" : "Həzi Aslanov",
    "E" : "Ziya Bünyadov"
  },
  "dogruCavab" : "D",
  "izah" : "İkinci Dünya müharibəsi illərində göstərdiyi igidliyə görə tank qoşunları general-mayoru Həzi Aslanov iki dəfə (1942 və 1991-ci ildə rəsmiləşdirilmiş) Sovet İttifaqı Qəhrəmanı adına layiq görülmüş yeganə azərbaycanlıdır. İsrafil Məmmədov bu adı almış ilk azərbaycanlıdır (1941-ci il), lakin bir dəfə almışdır. Mehdi Hüseynzadə isə partizan hərəkatındakı qəhrəmanlığına görə ölümündən sonra (1957-ci il) bu ada layiq görülmüşdür. Doğru cavab: D.",
  "movzu" : "İkinci Dünya müharibəsi illərində Azərbaycan",
  "cetinlik" : "asan",
  "fenn" : "Tarix"
}, {
  "sual" : "Azərbaycan ərazisində ibtidai icma quruluşuna aid uyğunluğu müəyyən edin:\n1. Orta Paleolit\n2. Mezolit\n3. Eneolit\na. İstehlak təsərrüfatından istehsal təsərrüfatına keçidin əsasının qoyulması\nb. İlk metalın (misin) kəşf edilməsi\nc. Neandertal tipli insanın yaranması\nd. Toxa əkinçiliyinin xış əkinçiliyi ilə əvəz olunması",
  "variantlar" : {
    "A" : "1 – c, 2 – d, 3 – a",
    "B" : "1 – b, 2 – a, 3 – d",
    "C" : "1 – c, 2 – b, 3 – d",
    "D" : "1 – c, 2 – a, 3 – b",
    "E" : "1 – a, 2 – c, 3 – b"
  },
  "dogruCavab" : "D",
  "izah" : "Orta Paleolit (Mustye mədəniyyəti) dövründə ibtidai insan fiziki cəhətdən inkişaf edərək neandertal tipli insana çevrilmişdir (1 – c). Mezolit dövründə ox və kaman ixtira edilmiş, heyvanların əhliləşdirilməsinə və ibtidai əkinçiliyə başlanmış, bununla da istehlakdan istehsala keçidin əsası qoyulmuşdur (2 – a). Eneolit (mis-daş) dövründə insanlar ilk dəfə metallan — misdən istifadə etməyə başlamışlar (3 – b). Toxa əkinçiliyinin xış əkinçiliyi ilə əvəzlənməsi isə Erkən Tunc dövrünə aiddir və heç birinə uyğun gəlmir. Beləliklə: 1 – c, 2 – a, 3 – b. Doğru cavab: D.",
  "movzu" : "Daş dövrü və ibtidai icma quruluşu",
  "cetinlik" : "orta",
  "fenn" : "Tarix"
}, {
  "sual" : "IX–XI əsrlərdə mövcud olmuş Şəddadilər və Rəvvadilər dövlətlərinin tarixinə aid ümumi cəhəti müəyyən edin.",
  "variantlar" : {
    "A" : "Slavyanların Bərdəyə yürüşünün qarşısını almaları",
    "B" : "Dərbənd əmirliyini özlərindən asılı vəziyyətə salmaları",
    "C" : "Bütün Azərbaycan torpaqlarını vahid dövlətdə birləşdirmələri",
    "D" : "Paytaxtlarının Təbriz şəhəri olması",
    "E" : "Səlcuq türklərinin yürüşlərinə məruz qalmaları"
  },
  "dogruCavab" : "E",
  "izah" : "XI əsrin ortalarından başlayaraq Böyük Səlcuq imperiyasının qərbə yürüşləri nəticəsində həm Şəddadilər (1054-cü ildə tabe edilmiş), həm də Rəvvadilər (1054-cü ildə tabe edilmiş) səlcuqlardan asılı vəziyyətə düşmüş, sonradan onlar tərəfindən süquta uğradılmışdır. Təbriz şəhəri yalnız Rəvvadilərin paytaxtı idi (Şəddadilərin mərkəzi Gəncə olmuşdur). Dərbənd əmirliyini asılı salmaq Şəddadilərə xas idi. Bütün Azərbaycan torpaqlarını vahid dövlətdə birləşdirmək isə Sacilər və Salarilərə aiddir. Doğru cavab: E.",
  "movzu" : "IX–XI əsrlərdə Azərbaycan dövlətləri: Şəddadilər və Rəvvadilər",
  "cetinlik" : "orta",
  "fenn" : "Tarix"
}, {
  "sual" : "1905–1907-ci illər inqilabı dövründə Şimali Azərbaycanda baş vermiş hadisələrlə bağlı verilənlərdən hansı səhvdir?",
  "variantlar" : {
    "A" : "Milli qüvvələrin erməni terroruna qarşı müdafiəsi məqsədilə «Difai» təşkilatı yaradıldı.",
    "B" : "I Dövlət Dumasına Şimali Azərbaycandan azərbaycanlı deputatlar seçildi.",
    "C" : "Həsən bəy Zərdabinin redaktorluğu ilə «Əkinçi» qəzetinin nəşrinə başlandı.",
    "D" : "Əlimərdan bəy Topçubaşovun rəhbərliyi ilə Ümumrusiya müsəlmanlarının I qurultayı keçirildi.",
    "E" : "Bakıda fəhlələrin hüquqlarını müdafiə edən «Müsəlman qrupu» təşkil olundu."
  },
  "dogruCavab" : "C",
  "izah" : "Həsən bəy Zərdabinin redaktorluğu ilə «Əkinçi» qəzeti 1875–1877-ci illərdə nəşr olunmuş və Azərbaycan milli mətbuatının əsasını qoymuşdur. Bu hadisə 1905–1907-ci illər inqilabından xeyli əvvələ — XIX əsrin 70-ci illərinə aiddir. Digər hadisələr isə birbaşa 1905–1907-ci illər inqilabı dövrünə təsadüf edir: «Difai» partiyası 1906-cı ildə Gəncədə yaradılmış, Ümumrusiya müsəlmanlarının qurultayları 1905–1906-cı illərdə təşkil edilmiş, I Dövlət Duması 1906-cı ildə fəaliyyət göstərmişdir. Doğru cavab: C.",
  "movzu" : "XIX əsrin II yarısı – XX əsrin əvvəlində ictimai-siyasi və mədəni həyat",
  "cetinlik" : "orta",
  "fenn" : "Tarix"
} ]
```

**Nəticə:** ✅ 5 sual; hər birində 5 unikal variant, izahdakı cavab hərfi dogruCavab ilə eyni, LaTeX balanslı, KaTeX-də olmayan əmr və Türkiyə türkcəsi sözü yoxdur, suallar təkrarlanmır

## Canlı AI sual generatoru — Coğrafiya (2-ci qrup)

**Giriş (input):**

```json
{
  "fenn" : "Coğrafiya",
  "qrup" : "2",
  "say" : 5,
  "model" : "gemini-3.8-flash"
}
```

**Çıxış (output):**

```json
[ {
  "sual" : "Litosfer plitələrinin sərhəd tipləri və onların qovuşmasında yaranan relyef formaları arasındakı uyğunluğu müəyyən edin:\n1. Qitə və okean tipli plitələrin toqquşması (subduksiya)\n2. İki qitə tipli plitənin toqquşması (kolliziya)\n3. İki okean tipli plitənin aralanması (divergent)\n\na. Peru-Çili dərin okean novu və And dağları\nb. Himalay dağları və Tibet yaylası\nc. Orta Atlantika silsiləsi və rift dərələri",
  "variantlar" : {
    "A" : "1 – a, 2 – c, 3 – b",
    "B" : "1 – b, 2 – a, 3 – c",
    "C" : "1 – a, 2 – b, 3 – c",
    "D" : "1 – b, 2 – c, 3 – a",
    "E" : "1 – c, 2 – a, 3 – b"
  },
  "dogruCavab" : "C",
  "izah" : "Litosfer plitələrinin qarşılıqlı hərəkəti nəticəsində müxtəlif relyef formaları yaranır:\n1. Okean və qitə tipli plitələrin toqquşması (subduksiya zonası) zamanı okean tavası qitə tavasının altına daxil olur; nəticədə dərin okean novları və qitənin kənarında qırışıq dağlar əmələ gəlir (Naska və Cənubi Amerika plitələrinin toqquşmasında Peru-Çili novu və And dağları: 1 – a).\n2. İki qitə tipli plitənin toqquşması (kolliziya zonası) güclü qırışıqlığa və nəhəng dağ sistemlərinin formalaşmasına səbəb olur (Hindistan-Avstraliya və Avrasiya plitələrinin toqquşmasında Himalay dağları və Tibet yaylası: 2 – b).\n3. Okean tipli plitələrin bir-birindən aralanması (divergent zonası) nəticəsində mantiyadan qalxan maddələr hesabına sualtı dağ silsilələri və rift dərələri yaranır (Orta Atlantika silsiləsi: 3 – c).\nBeləliklə, düzgün uyğunluq 1 – a, 2 – b, 3 – c şəklindədir. Doğru cavab: C.",
  "movzu" : "Litosfer plitələrinin hərəkəti və relyef",
  "cetinlik" : "orta",
  "fenn" : "Coğrafiya"
}, {
  "sual" : "Elektrik enerjisi istehsalında su elektrik stansiyalarının (SES) üstünlük təşkil etdiyi ölkələri müəyyən edin:\n1. Norveç\n2. Fransa\n3. Braziliya\n4. Polşa\n5. Tacikistan\n6. CAR",
  "variantlar" : {
    "A" : "3, 5, 6",
    "B" : "1, 2, 4",
    "C" : "1, 4, 5",
    "D" : "1, 3, 5",
    "E" : "2, 4, 6"
  },
  "dogruCavab" : "D",
  "izah" : "Ölkələrin elektroenergetika strukturunu təhlil edək:\n- Norveç dağ relyefi və bol sulu çayları hesabına elektrik enerjisinin $95\\%$-dən çoxunu SES-lərdə istehsal edir.\n- Braziliya zəngin hidroenerji potensialına malikdir və istehsal olunan elektrik enerjisinin $65\\%$-dən çoxu SES-lərin payına düşür (məsələn, İtaypu SES).\n- Tacikistanda dağ çaylarının böyük hidroenerji potensialı sayəsində elektrik enerjisinin $90\\%$-dən çoxu SES-lərdə (Nurek və s.) əldə edilir.\nFransada elektrik enerjisi istehsalında atom elektrik stansiyaları (AES, təxminən $70\\%$), Polşa və CAR-da isə zəngin yerli kömür ehtiyatlarına əsaslanan istilik elektrik stansiyaları (İES) üstünlük təşkil edir. Deməli, SES-lərin üstünlük təşkil etdiyi ölkələr 1, 3 və 5-dir. Doğru cavab: D.",
  "movzu" : "Elektroenergetika sənayesi",
  "cetinlik" : "orta",
  "fenn" : "Coğrafiya"
}, {
  "sual" : "Dağın ətəyində mütləq hündürlük $200\\,\\text{m}$, havanın temperaturu $+18^\\circ\\text{C}$ və atmosfer təzyiqi $740\\,\\text{mm}\\text{ c.st.}$-dir. Havanın temperaturunun hər $100\\,\\text{m}$-də $0{,}6^\\circ\\text{C}$, atmosfer təzyiqinin isə hər $10\\,\\text{m}$-də $1\\,\\text{mm}\\text{ c.st.}$ azaldığını nəzərə alaraq, zirvədə atmosfer təzyiqi $490\\,\\text{mm}\\text{ c.st.}$ olarsa, zirvənin mütləq hündürlüyünü və oradakı havanın temperaturunu müəyyən edin.",
  "variantlar" : {
    "A" : "$2500\\,\\text{m}$; $+3^\\circ\\text{C}$",
    "B" : "$2500\\,\\text{m}$; $+5^\\circ\\text{C}$",
    "C" : "$2700\\,\\text{m}$; $-3^\\circ\\text{C}$",
    "D" : "$2700\\,\\text{m}$; $+3^\\circ\\text{C}$",
    "E" : "$2900\\,\\text{m}$; $0^\\circ\\text{C}$"
  },
  "dogruCavab" : "D",
  "izah" : "Məsələnin həlli ardıcıl addımlarla yerinə yetirilir:\n1. Ətək ilə zirvə arasındakı atmosfer təzyiqi fərqi:\n$$\\Delta P = 740\\,\\text{mm}\\text{ c.st.} - 490\\,\\text{mm}\\text{ c.st.} = 250\\,\\text{mm}\\text{ c.st. Toolbar}$$Hər $10\\,\\text{m}$-də təzyiq $1\\,\\text{mm}\\text{ c.st.}$ azaldığından, dağın nisbi hündürlüyü:\n$$\\Delta h = 250 \\times 10\\,\\text{m} = 2500\\,\\text{m}$$\n2. Zirvənin mütləq hündürlüyü ətəyin mütləq hündürlüyü ilə nisbi hündürlüyün cəminə bərabərdir:\n$$h_{\\text{zirvə}} = 200\\,\\text{m} + 2500\\,\\text{m} = 2700\\,\\text{m}$$\n3. $2500\\,\\text{m}$ hündürlük fərqində temperaturun azalması:\n$$\\Delta T = \\dfrac{2500\\,\\text{m}}{100\\,\\text{m}} \\times 0{,}6^\\circ\\text{C} = 25 \\times 0{,}6^\\circ\\text{C} = 15^\\circ\\text{C}$$\n4. Zirvədəki havanın temperaturu:\n$$T_{\\text{zirvə}} = +18^\\circ\\text{C} - 15^\\circ\\text{C} = +3^\\circ\\text{C}$$\nƏn çox edilən səhv nisbi hündürlüyü ($2500\\,\\text{m}$) birbaşa zirvənin mütləq hündürlüyü kimi qəbul etməkdir. Doğru cavab: D.",
  "movzu" : "Temperatur və atmosfer təzyiqinin hündürlüklə dəyişməsi",
  "cetinlik" : "cetin",
  "fenn" : "Coğrafiya"
}, {
  "sual" : "Yalnız monarxiya idarəetmə formasına malik olan Avropa dövlətlərinin cərgəsini müəyyən edin.",
  "variantlar" : {
    "A" : "Portuqaliya, Belçika, İsveç, Lüksemburq",
    "B" : "İsveç, Danimarka, Niderland, Finlandiya",
    "C" : "Böyük Britaniya, İspaniya, Belçika, Norveç",
    "D" : "Norveç, İspaniya, İtaliya, Monako",
    "E" : "İsveçrə, Böyük Britaniya, Danimarka, Andorra"
  },
  "dogruCavab" : "C",
  "izah" : "Avropada mövcud olan monarxiya dövlətləri: Böyük Britaniya, İspaniya, Belçika, Niderland, Danimarka, Norveç, İsveç, Lüksemburq, Monako, Lixtenşteyn, Andorra və Vatikandır. Təqdim olunan variantları təhlil edək:\n- Böyük Britaniya, İspaniya, Belçika və Norveç dövlətlərinin hamısı konstitusiyalı monarxiyadır (krallıqdır).\n- Digər variantlardakı Finlandiya, İtaliya, Portuqaliya və İsveçrə respublika idarəetmə formasına malikdir. Doğru cavab: C.",
  "movzu" : "Dövlət idarəetmə formaları",
  "cetinlik" : "asan",
  "fenn" : "Coğrafiya"
}, {
  "sual" : "Ölkənin $60\\,\\text{milyard}\\text{ m}^3$ təbii qaz ehtiyatı var. İllik hasilat $3\\,\\text{milyard}\\text{ m}^3$, əhalinin sayı isə $10\\,\\text{milyon}\\text{ nəfər}$-dir. İllik hasilatın həcmi $25\\%$ artırılarsa, qaz ehtiyatı ilə təminatlıq müddətinin neçə il azalacağını və mövcud ehtiyat əsasında adambaşına düşən təbii qazın həcmini müəyyən edin.",
  "variantlar" : {
    "A" : "$4\\,\\text{il}$ və $6000\\,\\text{m}^3$",
    "B" : "$4\\,\\text{il}$ və $600\\,\\text{m}^3$",
    "C" : "$16\\,\\text{il}$ və $600\\,\\text{m}^3$",
    "D" : "$5\\,\\text{il}$ və $6000\\,\\text{m}^3$",
    "E" : "$16\\,\\text{il}$ və $6000\\,\\text{m}^3$"
  },
  "dogruCavab" : "A",
  "izah" : "Təbii ehtiyatlarla təminatlıq düsturu:\n$$E = \\dfrac{\\text{Ehtiyatın həcmi}}{\\text{İllik hasilat}}$$\n1. İlkin illik hasilatla təminatlıq müddəti:\n$$T_1 = \\dfrac{60\\,\\text{milyard}\\text{ m}^3}{3\\,\\text{milyard}\\text{ m}^3/\\text{il}} = 20\\,\\text{il}$$\n2. Hasilat $25\\%$ artırıldıqdan sonra yeni illik hasilat:\n$$H_2 = 3 + 3 \\times 0{,}25 = 3{,}75\\,\\text{milyard}\\text{ m}^3/\\text{il}$$\n3. Yeni hasilat səviyyəsində təminatlıq müddəti:\n$$T_2 = \\dfrac{60\\,\\text{milyard}\\text{ m}^3}{3{,}75\\,\\text{milyard}\\text{ m}^3/\\text{il}} = 16\\,\\text{il}$$\n4. Təminatlıq müddətinin azalması:\n$$\\Delta T = T_1 - T_2 = 20\\,\\text{il} - 16\\,\\text{il} = 4\\,\\text{il}$$\n5. Adambaşına düşən təbii qaz ehtiyatı ($60\\,\\text{milyard}\\text{ m}^3 = 60\\,000\\,\\text{milyon}\\text{ m}^3$):\n$$e_{\\text{adambaşı}} = \\dfrac{60\\,000\\,\\text{milyon}\\text{ m}^3}{10\\,\\text{milyon}\\text{ nəfər}} = 6000\\,\\text{m}^3/\\text{nəfər}$$\nƏn çox edilən səhv təminatlıq müddətinin azalması fərqini deyil, yeni təminatlıq müddətini ($16\\,\\text{il}$) cavab kimi qəbul etməkdir. Doğru cavab: A.",
  "movzu" : "Təbii ehtiyatlar və resurs təminatlığı",
  "cetinlik" : "cetin",
  "fenn" : "Coğrafiya"
} ]
```

**Nəticə:** ✅ 5 sual; hər birində 5 unikal variant, izahdakı cavab hərfi dogruCavab ilə eyni, LaTeX balanslı, KaTeX-də olmayan əmr və Türkiyə türkcəsi sözü yoxdur, suallar təkrarlanmır

## Canlı AI sual generatoru — Ədəbiyyat (3-ci qrup)

**Giriş (input):**

```json
{
  "fenn" : "Ədəbiyyat",
  "qrup" : "3",
  "say" : 5,
  "model" : "gemini-3.8-flash"
}
```

**Çıxış (output):**

```json
[ {
  "sual" : "Cəlil Məmmədquluzadənin «Anamın kitabı» pyesindəki obrazlarla bağlı fikirlərdən hansı yanlışdır?",
  "variantlar" : {
    "A" : "Qardaşlar ananın vəsiyyəti olan kitabı birlikdə oxuyub dərhal səhvlərini başa düşür və birləşirlər.",
    "B" : "Rüstəm bəy rus meyilinin, Mirzə Məhəmmədəli ərəb-fars, Səməd Vahid isə Osmanlı meyilinin daşıyıcısıdır.",
    "C" : "Zəhrabəyim qardaşların milli dil və mənəviyyatdan uzaqlaşmasına dözə bilməyib nəsihətamiz çıxışlar edir.",
    "D" : "Gülbahar qardaşlarının xaricdən gətirdiyi yad ideyaların milli köklərə zidd olduğunu anlayır.",
    "E" : "Əsərdə dil və mədəniyyət birliyi ideyası milli istiqlalın əsası kimi irəli sürülür."
  },
  "dogruCavab" : "A",
  "izah" : "Əsərin sonunda Gülbahar anasının vəsiyyət etdiyi kitabı oxuyur və qardaşlarının yad təsirlərə qapılması nəticəsində yaranan faciəni üzlərinə vurur. Qardaşlar dərhal birləşib səhvlərini düzəltmirlər; əksinə, onların mənəvi böhranı və ananın ölümü ilə nəticələnən faciəvi sonluq təsvir olunur. Ən çox edilən səhv əsərin nikbin, dərhal barışıqla bitdiyini düşünməkdir. Doğru cavab: A.",
  "movzu" : "Cəlil Məmmədquluzadə — «Anamın kitabı» tragikomediyası",
  "cetinlik" : "orta",
  "fenn" : "Ədəbiyyat"
}, {
  "sual" : "Məhəmməd Füzulinin «Leyli və Məcnun» poeması ilə bağlı doğru fikirləri müəyyən edin.\n1. Əsər əruz vəzninin «həzəc» bəhrində yazılmışdır.\n2. Qeysin atası Məcnunu sağaltmaq üçün Kərbəla ziyarətinə aparır.\n3. İbn Səlam Leylinin razılığı və sevgisi ilə onunla evlənir.\n4. Əsərdə aşiqanə və fəlsəfi qəzəllər lirik ricət kimi verilmişdir.\n5. Zeyd Leyli ilə Məcnunun qovuşa bilməyən məhəbbətinin şahidi və sirdaşıdır.",
  "variantlar" : {
    "A" : "1, 4, 5",
    "B" : "2, 3, 5",
    "C" : "1, 3, 4",
    "D" : "1, 2, 5",
    "E" : "2, 3, 4"
  },
  "dogruCavab" : "A",
  "izah" : "«Leyli və Məcnun» poeması məsnəvi janrında, əruz vəzninin həzəc bəhrində («məfā'īlün məfā'īlün fə'ūlün») qələmə alınmışdır (1 doğrudur). Qeysin atası onu şəfa tapmaq üçün Kərbəlaya deyil, Kəbəyə aparır (2 yanlışdır). İbn Səlam Leyli ilə zorla, Leylinin razılığı olmadan evlənir (3 yanlışdır). Əsərə süjet boyu lirik qəzəllər daxil edilmişdir (4 doğrudur). Zeyd obrazı hər iki aşiqin sirdaşıdır və onların qəbirləri üzərində ağlayıb onları yuxuda cənnətdə görən şəxsdir (5 doğrudur). Beləliklə, 1, 4 və 5-ci fikirlər tamamilə doğrudur. Doğru cavab: A.",
  "movzu" : "Məhəmməd Füzuli — «Leyli və Məcnun» poeması",
  "cetinlik" : "cetin",
  "fenn" : "Ədəbiyyat"
}, {
  "sual" : "«Kitabi-Dədə Qorqud» dastanının «Basatın Təpəgözü öldürdiyi boy»una əsasən uyğunluğu müəyyən edin:\n1. Təpəgözün anası\n2. Basatın atası\n3. Basatı əmizdirib böyüdən varlıq\na. Sarı çoban\nb. Pəri qızı\nc. Qonur qoca\nd. Aruz qoca\\ne. Aslan",
  "variantlar" : {
    "A" : "1 – c, 2 – d, 3 – a",
    "B" : "1 – b, 2 – d, 3 – e",
    "C" : "1 – a, 2 – c, 3 – d",
    "D" : "1 – b, 2 – c, 3 – e",
    "E" : "1 – b, 2 – a, 3 – e"
  },
  "dogruCavab" : "E",
  "izah" : "Boyun məzmununa görə:\n1. Təpəgözün anası pəri qızıdır (1 – b).\n2. Sarı çoban pəri qızı ilə bulaq başında qarşılaşır və Təpəgözün atası Sarı çobandır (2 – a).\n3. Basat uşaq ikən düşmən gələndə meşədə itir və onu aslan əmizdirib böyüdür (3 – e). Aruz qoca isə Basatın əsl atasıdır, Təpəgözün deyil. Sarı çoban – pəri qızı – aslan ardıcıllığı düzgündür. Doğru cavab: E.",
  "movzu" : "«Kitabi-Dədə Qorqud» dastanı",
  "cetinlik" : "orta",
  "fenn" : "Ədəbiyyat"
}, {
  "sual" : "Mirzə Fətəli Axundzadənin «Hekayəti Müsyö Jordan həkimi-nəbatat və dərviş Məstəli şah caduküni-məşhur» komediyasında fransız alimi Müsyö Jordanın Qarabağa gəlməkdə əsas məqsədi nə idi?",
  "variantlar" : {
    "A" : "Hətəmxan ağanın mülklərini idarə etməyə kömək etmək",
    "B" : "Qarabağın bitki və otlarını toplayıb tədqiq etmək",
    "C" : "Qarabağ xanlığı ilə Fransa arasında ticarət əlaqələri qurmaq",
    "D" : "Şahbaz bəyi Avropaya aparıb orada təhsil vermək",
    "E" : "Dərviş Məstəli şahın sehir və cadu üsullarını öyrənmək"
  },
  "dogruCavab" : "B",
  "izah" : "Müsyö Jordan təbiətşünas alimdir («həkimi-nəbatat» botanik deməkdir). O, Qarabağın zəngin təbiətini, bitki və ot növlərini («nəbatatını») toplayıb Parisə aparmaq və elmi şəkildə tədqiq etmək məqsədilə gəlmişdir. Şahbaz bəyi təhsil almaq üçün Parisə aparmaq ideyası sonradan yaranır, əsas gəliş məqsədi deyildir. Doğru cavab: B.",
  "movzu" : "Mirzə Fətəli Axundzadə — komediyaları",
  "cetinlik" : "asan",
  "fenn" : "Ədəbiyyat"
}, {
  "sual" : "Molla Pənah Vaqifin yaradıcılığı haqqında hansı fikir elmi baxımdan tamamilə doğrudur?",
  "variantlar" : {
    "A" : "«Müsibətnamə» adlı elegik əsərində yaxın dostu Molla Vəli Vidadinin faciəli ölümünə ağlamışdır.",
    "B" : "Dövrün tarixi hadisələrini təsvir edən genişhəcmli epik poema müəllifidir.",
    "C" : "Azərbaycan poeziyasında real-dünyəvi gözəlliyin təsvirini və canlı xalq dilini qoşma janrında zirvəyə çatdırmışdır.",
    "D" : "Yaradıcılığında sufizm və təsəvvüf fəlsəfəsinin rəmzləri əsas ideya xəttini təşkil edir.",
    "E" : "Əsərlərini yalnız heca vəznində yazmış, əruz vəzninə qətiyyən müraciət etməmişdir."
  },
  "dogruCavab" : "C",
  "izah" : "Molla Pənah Vaqif Azərbaycan realist poeziyasının banilərindəndir. O, qoşma janrını xalq dili ilə zənginləşdirmiş, ilahi-mistik məhəbbət əvəzinə real insanın dünyəvi sevgisini və gözəlliyini tərənnüm etmişdir (bu fikir tamamilə doğrudur). Vaqif təkcə heca ilə deyil, qəzəl, müxəmməs və digər janrlarda əruz vəznində də şeirlər yazmışdır (A yanlışdır). Sufizm onun ideyası deyildir (C yanlışdır). Genişhəcmli poema yazmamışdır (D yanlışdır). «Müsibətnamə» Vaqifə deyil, Vidadiyə məxsusdur (E yanlışdır). Doğru cavab: C.",
  "movzu" : "Molla Pənah Vaqif — həyatı və yaradıcılığı",
  "cetinlik" : "cetin",
  "fenn" : "Ədəbiyyat"
} ]
```

**Nəticə:** ✅ 5 sual; hər birində 5 unikal variant, izahdakı cavab hərfi dogruCavab ilə eyni, LaTeX balanslı, KaTeX-də olmayan əmr və Türkiyə türkcəsi sözü yoxdur, suallar təkrarlanmır

## Canlı AI sual generatoru — Biologiya (4-ci qrup)

**Giriş (input):**

```json
{
  "fenn" : "Biologiya",
  "qrup" : "4",
  "say" : 5,
  "model" : "gemini-3.8-flash"
}
```

**Çıxış (output):**

```json
[ {
  "sual" : "Əlverişli şəraitdə hər 20 dəqiqədən bir bölünən 3 bakteriyadan 2 saatın sonunda cəmi neçə bakteriya əmələ gələr?",
  "variantlar" : {
    "A" : "$384$",
    "B" : "$96$",
    "C" : "$192$",
    "D" : "$128$",
    "E" : "$64$"
  },
  "dogruCavab" : "C",
  "izah" : "Bakteriyaların bölünməsi düsturu:\n$$N = N_0 \\cdot 2^n$$\nBurada $N_0$ — ilkin bakteriyaların sayı, $n$ — bölünmələrin (nəsillərin) sayıdır.\nZaman müddəti: $t = 2\\,\\text{saat} = 120\\,\\text{dəqiqə}$.\nBölünmə intervalı $20\\,\\text{dəqiqə}$ olduğundan nəsillərin sayı:\n$$n = \\dfrac{120}{20} = 6$$\nSonda əmələ gələn bakteriyaların ümumi sayı:\n$$N = 3 \\cdot 2^6 = 3 \\cdot 64 = 192$$\nDoğru cavab: C.\nƏn çox edilən səhv ilkin bakteriya sayını ($3$) nəzərə almayıb yalnız $2^6 = 64$ ($64$ cavabı) hesablamaqdır.",
  "movzu" : "Bakteriyaların çoxalması",
  "cetinlik" : "orta",
  "fenn" : "Biologiya"
}, {
  "sual" : "Verilmiş bitkilərdən hansılarında mayalanma prosesi sudan asılı deyil?\n1. Adi şam\n2. Yaşıl quş mamırı\n3. Çöl qatırquyruğu\n4. Günəbaxan\n5. Erkək qıjı",
  "variantlar" : {
    "A" : "1 və 4",
    "B" : "2 və 3",
    "C" : "1, 4 və 5",
    "D" : "2, 3 və 5",
    "E" : "yalnız 4"
  },
  "dogruCavab" : "A",
  "izah" : "Ali sporlu bitkilərdə (mamırlar, qıjıkimilər, qatırquyruğukimilər) hərəkətli spermatozoidlərin yumurtahüceyrəyə çatması üçün damcı-maye suyu mütləq lazımdır. Toxumlu bitkilərdə (çılpaqtoxumlular və örtülütoxumlular) isə spermilər yumurtahüceyrəyə tozcuq borusu vasitəsilə çatdırıldığından mayalanma sudan asılı deyil.\nSiyahıda:\n- 1 (Adi şam) — çılpaqtoxumlu bitkidir;\n- 4 (Günəbaxan) — örtülütoxumlu bitkidir.\nBu səbəbdən 1 və 4 bitkilərində mayalanma sudan asılı deyildir. Yaşıl quş mamırı (2), çöl qatırquyruğu (3) və erkək qıjı (5) isə ali sporlu bitkilər olduğundan mayalanmaları üçün su tələb olunur.\nDoğru cavab: A.",
  "movzu" : "Bitkilər aləminin təsnifatı — Mayalanmanın xüsusiyyətləri",
  "cetinlik" : "asan",
  "fenn" : "Biologiya"
}, {
  "sual" : "Sakit vəziyyətdə olan insanın ürək tsiklində qulaqcıqların sistolası cəmi $10\\,\\text{san}$ davam etmişdirsə, bu müddət ərzində mədəciklərin diastola vəziyyətində olduğu ümumi vaxtı tapın.",
  "variantlar" : {
    "A" : "$20\\,\\text{san}$",
    "B" : "$70\\,\\text{san}$",
    "C" : "$40\\,\\text{san}$",
    "D" : "$50\\,\\text{san}$",
    "E" : "$30\\,\\text{san}$"
  },
  "dogruCavab" : "D",
  "izah" : "İnsanın normal ürək tsikli $0{,}8\\,\\text{san}$ davam edir:\n- Qulaqcıqların sistolası: $0{,}1\\,\\text{san}$\n- Mədəciklərin sistolası: $0{,}3\\,\\text{san}$\n- Ümumi pauza: $0{,}4\\,\\text{san}$\nMədəciklər hər tsikldə $0{,}3\\,\\text{san}$ sistola (yığılma) vəziyyətində, qalan müddətdə isə diastola (boşalma) vəziyyətində olur:\n$$t_{\\text{diastola}} = 0{,}8\\,\\text{san} - 0{,}3\\,\\text{san} = 0{,}5\\,\\text{san}$$\nQulaqcıqların sistolası ümumi tsiklin $\\dfrac{0{,}1}{0{,}8} = \\dfrac{1}{8}$ hissəsini təşkil edir. Qulaqcıq sistolasının ümumi vaxtı $10\\,\\text{san}$ olduğuna görə, bütün proses üçün keçən ümumi vaxt:\n$$T = 10\\,\\text{san} \\cdot 8 = 80\\,\\text{san}$$\nBu müddət ərzində mədəciklərin diastolada olduğu ümumi vaxt:\n$$t = 80\\,\\text{san} \\cdot \\dfrac{0{,}5}{0{,}8} = 50\\,\\text{san}$$\nDoğru cavab: D.\nƏn çox edilən səhv mədəciklərin diastolasını yalnız ümumi pauza ($0{,}4\\,\\text{san}$) ilə eyniləşdirərək $40\\,\\text{san}$ cavabını seçməkdir; lakin qulaqcıqlar yığılarkən ($0{,}1\\,\\text{san}$) də mədəciklər diastola vəziyyətində qalır.",
  "movzu" : "Qan dövranı sistemi — Ürək tsikli",
  "cetinlik" : "orta",
  "fenn" : "Biologiya"
}, {
  "sual" : "Diploid xromosom yığımı $2n = 16$ olan örtülütoxumlu bitkidə 25 toxumun əmələ gəlməsi zamanı mayalanma prosesində bilavasitə iştirak edən qametlərin və bu qametlərdəki xromosomların ümumi sayını müəyyən edin.",
  "variantlar" : {
    "A" : "50 qamet; 400 xromosom",
    "B" : "75 qamet; 1200 xromosom",
    "C" : "50 qamet; 600 xromosom",
    "D" : "100 qamet; 800 xromosom",
    "E" : "75 qamet; 600 xromosom"
  },
  "dogruCavab" : "E",
  "izah" : "Örtülütoxumlu bitkilərdə ikiqat mayalanma zamanı hər bir toxumun yaranmasında bilavasitə 3 qamet iştirak edir: 1 dişi qamet (yumurtahüceyrə) və 2 erkək qamet (spermilər). Mərkəzi hüceyrə mayalanmada iştirak etsə də, qamet deyildir.\n25 toxumun formalaşmasında bilavasitə iştirak edən qametlərin sayı:\n$$N_{\\text{qamet}} = 25 \\cdot 3 = 75$$\nSomatik hüceyrədə $2n = 16$ xromosom olduğundan, haploid qametdə xromosom sayı:\n$$n = \\dfrac{16}{2} = 8$$\nBütün qametlərdəki xromosomların ümumi sayı:\n$$N_{\\text{xromosom}} = 75 \\cdot 8 = 600$$\nDoğru cavab: E.\nƏn çox edilən səhv mərkəzi hüceyrəni də qamet hesab edərək 1 toxum üçün 4 qamet (cəmi 100 qamet) götürmək və ya hər toxum üçün yalnız 2 qametin birləşdiyini zənn edib 50 qamet seçməkdir.",
  "movzu" : "Örtülütoxumlularda ikiqat mayalanma və toxumun formalaşması",
  "cetinlik" : "cetin",
  "fenn" : "Biologiya"
}, {
  "sual" : "Yalnız ikizarlı orqanoidlər göstərilən variantı müəyyən edin.",
  "variantlar" : {
    "A" : "Mitoxondrilər və lizosomlar",
    "B" : "Mitoxondrilər və plastidlər",
    "C" : "Vakuollar və endoplazmatik şəbəkə",
    "D" : "Ribosomlar və hüceyrə mərkəzi",
    "E" : "Lizosomlar və Holci kompleksi"
  },
  "dogruCavab" : "B",
  "izah" : "Eukariot hüceyrənin orqanoidləri membran quruluşuna görə üç qrupa bölünür:\n1. Zarsız orqanoidlər: ribosom və hüceyrə mərkəzi;\n2. Birzarlı orqanoidlər: endoplazmatik şəbəkə, Holci kompleksi, lizosom və vakuol;\n3. İkizarlı orqanoidlər: mitoxondrilər və plastidlər (xloroplastlar, xromoplastlar, leykoplastlar).\nMitoxondrilər və plastidlər hər ikisi ikizarlı orqanoidlərdir.\nDoğru cavab: B.",
  "movzu" : "Hüceyrənin quruluşu — Orqanoidlər",
  "cetinlik" : "asan",
  "fenn" : "Biologiya"
} ]
```

**Nəticə:** ✅ 5 sual; hər birində 5 unikal variant, izahdakı cavab hərfi dogruCavab ilə eyni, LaTeX balanslı, KaTeX-də olmayan əmr və Türkiyə türkcəsi sözü yoxdur, suallar təkrarlanmır

## Canlı AI sual generatoru — Məntiq (magistr)

**Giriş (input):**

```json
{
  "fenn" : "Məntiq",
  "qrup" : "magistr",
  "say" : 5,
  "model" : "gemini-3.8-flash"
}
```

**Çıxış (output):**

```json
[ {
  "sual" : "Verilmiş mühakimələrin doğru olduğunu qəbul edərək məntiqi nəticəni müəyyən edin:\n\n1. Bütün proqramçılar analitik düşüncəyə malikdirlər.\n2. Şahmat oynamağı bacaran bəzi şəxslər analitik düşüncəyə malik deyillər.\n3. Rauf şahmat oynamağı bacarır, lakin onda analitik düşüncə yoxdur.",
  "variantlar" : {
    "A" : "Rauf proqramçı deyil.",
    "B" : "Bütün şahmatçılar proqramçıdır.",
    "C" : "Şahmat oynayan heç bir şəxs proqramçı ola bilməz.",
    "D" : "Analitik düşüncəsi olan hər kəs proqramçıdır.",
    "E" : "Rauf mütləq proqramçı olmalıdır."
  },
  "dogruCavab" : "A",
  "izah" : "Sillogizm qaydalarına əsasən: Bütün proqramçılar analitik düşüncəyə malikdirsə, analitik düşüncəsi olmayan heç kəs proqramçı ola bilməz ($A \\subset B \\implies \\neg B \\subset \\neg A$). Rauf analitik düşüncəyə malik olmadığına görə, o qətiyyən proqramçı ola bilməz. Beləliklə, «Rauf proqramçı deyil» hökmü mütləq doğrudur. Doğru cavab: A.",
  "movzu" : "Sillogizm və deduktiv nəticə çıxarma",
  "cetinlik" : "asan",
  "fenn" : "Məntiq"
}, {
  "sual" : "Mətni oxuyun və suala cavab verin:\n\n«Son illərdə aparılan tədqiqatlar göstərir ki, distant təhsil alan tələbələrin imtahan nəticələri ənənəvi qaydada təhsil alanların nəticələrindən orta hesabla $15\\%$ yüksəkdir. Təhsil eksperti bu fərqin distant təhsildə tətbiq olunan fərdi öyrənmə tempindən qaynaqlandığını və distant təhsilin ənənəvi təhsildən daha keyfiyyətli olduğunu iddia edir.»\n\nAşağıdakı mühakimələrdən hansı ekspertin arqumentini ən çox zəiflədir?",
  "variantlar" : {
    "A" : "Distant təhsil alan tələbələr kompüter proqramlarını ənənəvi tələbələrə nisbətən daha yaxşı mənimsəyirlər.",
    "B" : "Distant təhsil zamanı imtahanlar onlayn keçirildiyi üçün tələbələrin kənar köməkdən istifadə etməsinə tam nəzarət olunmur.",
    "C" : "Distant təhsildə tələbələr dərslərə istədikləri məkandan qoşulmaq imkanına malikdirlər.",
    "D" : "Distant təhsil formatı son illərdə bir çox nüfuzlu xarici universitetdə geniş yayılmışdır.",
    "E" : "Distant proqramlarda təhsil haqqı ənənəvi proqramlara nisbətən adətən daha aşağı olur."
  },
  "dogruCavab" : "B",
  "izah" : "Ekspert imtahan nəticələrinin yüksək olmasını birbaşa distant təhsilin keyfiyyəti və öyrənmə tempi ilə əlaqələndirir. Lakin imtahanlar zamanı nəzarətin zəif olması və kənar vasitələrdən istifadə ehtimalı nəticələrin obyektivliyini şübhə altına alır. Bu fakt yüksək nəticələrin təhsilin keyfiyyətindən deyil, nəzarətsizlikdən yarandığını göstərərək ekspertin əsas arqumentini zəiflədir. Doğru cavab: B.",
  "movzu" : "Mətn analizi — arqumenti zəiflədən ifadə",
  "cetinlik" : "orta",
  "fenn" : "Məntiq"
}, {
  "sual" : "Qanunauyğunluğu müəyyən edin və sual işarəsinin («?») yerinə uyğun olan ədədi tapın:\n\n$$3, \\; 7, \\; 16, \\; 35, \\; 74, \\; ?$$",
  "variantlar" : {
    "A" : "148",
    "B" : "155",
    "C" : "153",
    "D" : "151",
    "E" : "149"
  },
  "dogruCavab" : "C",
  "izah" : "Ardıcıllığın hədləri arasındakı qanunauyğunluğu təhlil edək:\nİkinci hədd: $$3 \\times 2 + 1 = 7$$\nÜçüncü hədd: $$7 \\times 2 + 2 = 16$$\nDördüncü hədd: $$16 \\times 2 + 3 = 35$$\nBeşinci hədd: $$35 \\times 2 + 4 = 74$$\nQaydaya əsasən hər növbəti hədd əvvəlki həddin $2$ misli ilə artan sıra nömrəsinin cəmidir ($a_{n+1} = 2a_n + n$).\nNövbəti hədd: $$74 \\times 2 + 5 = 148 + 5 = 153$$ olar. Doğru cavab: C.",
  "movzu" : "Ədədi ardıcıllıqlar — qarışıq qanunauyğunluq",
  "cetinlik" : "orta",
  "fenn" : "Məntiq"
}, {
  "sual" : "Hər hansı bir ilin yanvar ayında düz $4$ bazar ertəsi və düz $4$ cümə günü olmuşdur. Həmin ilin yanvar ayının $20$-si həftənin hansı gününə təsadüf etmişdir?",
  "variantlar" : {
    "A" : "çərşənbə axşamı",
    "B" : "bazar",
    "C" : "çərşənbə",
    "D" : "şənbə",
    "E" : "cümə axşamı"
  },
  "dogruCavab" : "B",
  "izah" : "Yanvar ayı $31$ gündən ibarətdir. $31 = 4 \\times 7 + 3$ olduğuna görə, həftənin $4$ günü $4$ dəfə, ardıcıl $3$ günü isə $5$ dəfə təkrarlanır. Şərtə görə bazar ertəsi və cümə günləri hərəsi $4$ dəfə olub. Deməli, $5$ dəfə təkrarlanan $3$ ardıcıl gün bazar ertəsi və cüməni əhatə etməməlidir. Bazar ertəsindən sonrakı və cümədən əvvəlki $3$ ardıcıl gün çərşənbə axşamı, çərşənbə və cümə axşamıdır. Buradan aydın olur ki, ayın $1$-i çərşənbə axşamına təsadüf edir ($1, 2, 3$ yanvar: çərşənbə axşamı, çərşənbə, cümə axşamı). $1$ yanvar çərşənbə axşamı olarsa:\n$$20 - 1 = 19$$\n$$19 \\equiv 5 \\pmod 7$$\nÇərşənbə axşamından $5$ gün irəli saysaq: çərşənbə ($+1$), cümə axşamı ($+2$), cümə ($+3$), şənbə ($+4$), bazar ($+5$). Deməli, yanvar ayının $20$-si bazar günüdür. Doğru cavab: B.",
  "movzu" : "Saat, təqvim və həftə günləri məsələləri",
  "cetinlik" : "cetin",
  "fenn" : "Məntiq"
}, {
  "sual" : "Kvadrat şəkilli şəffaf olmayan kağız vərəq ardıcıl olaraq iki dəfə qatlanır: əvvəlcə sol tərəfi sağ tərəfinin üzərinə gələcək şəkildə şaquli simmetriya oxu boyunca soldan sağa, sonra isə yaranmış düzbucaqlı aşağı tərəfi yuxarı tərəfinin üzərinə gələcək şəkildə üfüqi simmetriya oxu boyunca aşağıdan yuxarıya doğru qatlanır. Alınmış dördqat kiçik kvadratın tam mərkəzində diametri $1\\,\\text{sm}$ olan bir dairəvi dəlik, yuxarı-sağ küncündə (bütün vərəqin ilkin xarici təpə nöqtəsi) isə dörddəbir dairə kəsilib çıxarılır. Vərəq tam açıldıqdan sonra onun üzərində neçə ədəd tam dairəvi dəlik müşahidə olunar?",
  "variantlar" : {
    "A" : "8",
    "B" : "1",
    "C" : "2",
    "D" : "5",
    "E" : "4"
  },
  "dogruCavab" : "E",
  "izah" : "Qatlama ardıcıllığını təhlil edək:\n1. Soldan sağa qatlandıqda qatlama xətti sol tərəfdə qalır.\n2. Aşağıdan yuxarıya qatlandıqda qatlama xətti aşağı tərəfdə qalır.\nNəticədə alınan dördqat kvadratın daxili qapalı mərkəzi küncü sol-aşağı küncdür, xarici açıq küncləri isə yuxarı-sağ küncdür.\n- Kiçik kvadratın tam mərkəzində edilən kəsik vərəq açıldıqda hər dörddəbir hissənin öz mərkəzinə düşəcək və tam $4$ ədəd dairəvi dəlik formalaşdıracaq.\n- Yuxarı-sağ künc isə ilkin böyük kvadratın təbii kənar künclərinə təsadüf edir (vərəqin daxili birləşmə qatına yox). Burada edilən dörddəbir dairə kəsikləri açıldıqda birləşərək tam dairə yaratmır, böyük kvadratın $4$ xarici küncündə kəsik olaraq qalır.\nBeləliklə, vərəqin daxilində bütöv görünən tam dairəvi dəliklərin sayı yalnız mərkəzi kəsiklərdən yaranan $4$ ədəd dəlikdir. Doğru cavab: E.",
  "movzu" : "Kağız qatlama və kəsmə, simmetriya",
  "cetinlik" : "cetin",
  "fenn" : "Məntiq"
} ]
```

**Nəticə:** ✅ 5 sual; hər birində 5 unikal variant, izahdakı cavab hərfi dogruCavab ilə eyni, LaTeX balanslı, KaTeX-də olmayan əmr və Türkiyə türkcəsi sözü yoxdur, suallar təkrarlanmır

## Canlı AI sual generatoru — İnformatika (magistr)

**Giriş (input):**

```json
{
  "fenn" : "İnformatika",
  "qrup" : "magistr",
  "say" : 5,
  "model" : "gemini-3.8-flash"
}
```

**Çıxış (output):**

```json
[ {
  "sual" : "Ölçüsü $512 \\times 256$ piksel olan və CMYK modelində kodlaşdırılmış rastr təsvirin informasiya həcmi, ölçüsü $1024 \\times 128$ piksel olan və RGB modelində kodlaşdırılmış rastr təsvirin informasiya həcmindən neçə kilobayt (KB) çoxdur?",
  "variantlar" : {
    "A" : "$128$",
    "B" : "$256$",
    "C" : "$384$",
    "D" : "$64$",
    "E" : "$512$"
  },
  "dogruCavab" : "A",
  "izah" : "Rastr təsvirin həcmi piksel sayı ilə bir pikselin rəng dərinliyinin hasilinə bərabərdir:\n$$V = X \\cdot Y \\cdot i$$\nCMYK modelində hər piksel $32$ bit ($4$ bayt) yer tutur:\n$$V_1 = 512 \\times 256 \\times 4\\,\\text{bayt} = 2^9 \\cdot 2^8 \\cdot 2^2\\,\\text{bayt} = 2^{19}\\,\\text{bayt}$$\n$$V_1 = \\dfrac{2^{19}}{2^{10}}\\,\\text{KB} = 2^9\\,\\text{KB} = 512\\,\\text{KB}$$\nRGB modelində hər piksel $24$ bit ($3$ bayt) yer tutur:\n$$V_2 = 1024 \\times 128 \\times 3\\,\\text{bayt} = 2^{10} \\cdot 2^7 \\cdot 3\\,\\text{bayt} = 3 \\cdot 2^{17}\\,\\text{bayt}$$\n$$V_2 = \\dfrac{3 \\cdot 2^{17}}{2^{10}}\\,\\text{KB} = 3 \\cdot 2^7\\,\\text{KB} = 3 \\cdot 128\\,\\text{KB} = 384\\,\\text{KB}$$\nHəcmlərin fərqi:\n$$512 - 384 = 128\\,\\text{KB}$$\nDoğru cavab: A.",
  "movzu" : "Kompüter qrafikası və multimedia — Rastr təsvirin informasiya həcmi",
  "cetinlik" : "orta",
  "fenn" : "İnformatika"
}, {
  "sual" : "$21_x \\times 13_x = 303_x$ bərabərliyinin ödənildiyi say sistemində $87_{10}$ ədədinin yazılışını müəyyən edin.",
  "variantlar" : {
    "A" : "$153$",
    "B" : "$162$",
    "C" : "$213$",
    "D" : "$135$",
    "E" : "$144$"
  },
  "dogruCavab" : "A",
  "izah" : "Ədədləri $x$ əsasına görə açıq şəkildə yazaq:\n$$21_x = 2x + 1$$\n$$13_x = x + 3$$\n$$303_x = 3x^2 + 0 \\cdot x + 3 = 3x^2 + 3$$\nBərabərliyi quraq:\n$$(2x + 1)(x + 3) = 3x^2 + 3$$\n$$2x^2 + 7x + 3 = 3x^2 + 3$$\n$$x^2 - 7x = 0 \\implies x(x - 7) = 0$$\nSay sisteminin əsası $x > 3$ şərtini ödəyən natural ədəd olduğundan $x = 7$ tapılır.\nİndi $87_{10}$ ədədini $7$-lik say sisteminə çevirək:\n$$87 : 7 = 12\\quad (\\text{qalıq } 3)$$\n$$12 : 7 = 1\\quad (\\text{qalıq } 5)$$\n$$1 : 7 = 0\\quad (\\text{qalıq } 1)$$\nQalıqları sondan əvvələ yazsaq: $153_7$.\nDoğru cavab: A.",
  "movzu" : "Say sistemləri və onlarda hesab əməlləri — Məchul əsaslı say sistemləri",
  "cetinlik" : "cetin",
  "fenn" : "İnformatika"
}, {
  "sual" : "Buraxılış zolağının sürəti $256\\,\\text{Kbit/san}$ olan rabitə kanalı vasitəsilə fayl $16$ saniyə ərzində ötürülmüşdür. Bu fayl hər səhifəsində $32$ sətir və hər sətrində $64$ simvol olan mətndən ibarətdir. Mətn UNICODE standartında (hər simvol $16$ bit) kodlaşdırılmışsa, sənədin neçə səhifədən ibarət olduğunu tapın.",
  "variantlar" : {
    "A" : "$128$",
    "B" : "$64$",
    "C" : "$256$",
    "D" : "$512$",
    "E" : "$32$"
  },
  "dogruCavab" : "A",
  "izah" : "Kanal vasitəsilə ötürülən ümumi informasiya miqdarı sürətlə zamanın hasilinə bərabərdir:\n$$Q = v \\cdot t$$\n$$Q = 256\\,\\text{Kbit/san} \\times 16\\,\\text{san} = 2^8 \\cdot 2^{10} \\cdot 2^4\\,\\text{bit} = 2^{22}\\,\\text{bit}$$\nUNICODE standartında $1$ simvol $16$ bit ($2^4$ bit) olduğundan, mətndəki ümumi simvolların sayı:\n$$N = \\dfrac{2^{22}}{2^4} = 2^{18}\\,\\text{simvol}$$\nBir səhifədəki simvolların sayı:\n$$K = 32 \\times 64 = 2^5 \\cdot 2^6 = 2^{11}\\,\\text{simvol}$$\nSənəddəki səhifələrin sayı:\n$$S = \\dfrac{N}{K} = \\dfrac{2^{18}}{2^{11}} = 2^7 = 128$$\nDoğru cavab: A.",
  "movzu" : "İnformasiya, ölçü vahidləri və informasiyanın miqdarı — Mətn informasiyasının kodlaşdırılması",
  "cetinlik" : "orta",
  "fenn" : "İnformatika"
}, {
  "sual" : "Verilmiş cədvəl fraqmentinə əsasən `(Sinif = 10 AND Riyaziyyat > 80) OR (İnformatika > 85)` sorğu şərtini ödəyən neçə yazı seçiləcək?\n\n| Şagird | Sinif | Riyaziyyat | İnformatika |\n| :--- | :--- | :--- | :--- |\n| Murad | 10 | 85 | 90 |\n| Aysel | 11 | 75 | 95 |\n| Nigar | 10 | 92 | 80 |\n| Elmir | 11 | 88 | 70 |\n| Leyla | 10 | 68 | 85 |\n| Rauf | 11 | 94 | 88 |",
  "variantlar" : {
    "A" : "$2$",
    "B" : "$3$",
    "C" : "$5$",
    "D" : "$1$",
    "E" : "$4$"
  },
  "dogruCavab" : "E",
  "izah" : "Məntiqi `OR` əməlinə görə mötərizələrdən ən azı birinin doğru olması kifayətdir. Hər yazını ardıcıl yoxlayaq:\n1. Murad: `10 = 10 AND 85 > 80` doğrudur (seçilir).\n2. Aysel: birinci şərt yalandır, lakin `95 > 85` doğrudur (seçilir).\n3. Nigar: `10 = 10 AND 92 > 80` doğrudur (seçilir).\n4. Elmir: birinci şərt yalandır (`11 = 10` yalan), `70 > 85` də yalandır (seçilmir).\n5. Leyla: `68 > 80` yalandır, `85 > 85` də yalandır, çünki bərabərdir (seçilmir).\n6. Rauf: birinci şərt yalandır, lakin `88 > 85` doğrudur (seçilir).\nŞərti ödəyən $4$ yazı seçilir (Murad, Aysel, Nigar, Rauf). Doğru cavab: E.",
  "movzu" : "Verilənlər bazası və VBİS (MS Access) — Məntiqi sorğular",
  "cetinlik" : "asan",
  "fenn" : "İnformatika"
}, {
  "sual" : "Elektron cədvəl fraqmenti verilmişdir:\n\n| | A | B | C |\n| :---: | :---: | :---: | :---: |\n| **1** | 5 | 10 | 15 |\n| **2** | 8 | 12 | 4 |\n| **3** | 3 | 6 | 9 |\n| **4** | 7 | 14 | 2 |\n\nD1 xanasında `=IF(A1>5; B$2+A1; $B1-C2)` düsturu yazılmışdır. Bu düstur D1 xanasından D3 xanasına köçürüldükdən sonra D3 xanasında hesablanmış qiyməti tapın.",
  "variantlar" : {
    "A" : "$15$",
    "B" : "$2$",
    "C" : "$17$",
    "D" : "$4$",
    "E" : "$6$"
  },
  "dogruCavab" : "D",
  "izah" : "Düstur D1 xanasından D3 xanasına köçürüldükdə sütun dəyişmir, sətir nömrəsi isə $2$ vahid artır ($1 \\to 3$):\n- `A1` nisbi ünvanı `A3` olur;\n- `B$2` qarışıq ünvanında sətir mütləq ($) olduğundan dəyişmir: `B$2`;\n- `A1` nisbi ünvanı `A3` olur;\n- `$B1` qarışıq ünvanında sətir nisbi olduğundan `$B3` olur;\n- `C2` nisbi ünvanı `C4` olur.\nBeləliklə, D3 xanasındakı düstur:\n`=IF(A3>5; B$2+A3; $B3-C4)`\nCədvəldən tələb olunan qiymətlər: `A3 = 3`, `B2 = 12`, `B3 = 6`, `C4 = 2`.\nŞərtin yoxlanması:\n$$3 > 5\\quad (\\text{Yalandır / FALSE})$$\nŞərt ödənmədiyinə görə düstur FALSE budağını hesablayır:\n$$$B3 - C4 = 6 - 2 = 4$$\nDoğru cavab: D.",
  "movzu" : "MS Excel — Ünvanlaşma növləri və IF funksiyası",
  "cetinlik" : "cetin",
  "fenn" : "İnformatika"
} ]
```

**Nəticə:** ✅ 5 sual; hər birində 5 unikal variant, izahdakı cavab hərfi dogruCavab ilə eyni, LaTeX balanslı, KaTeX-də olmayan əmr və Türkiyə türkcəsi sözü yoxdur, suallar təkrarlanmır

## Canlı AI sual generatoru — Xarici dil (magistr)

**Giriş (input):**

```json
{
  "fenn" : "Xarici dil",
  "qrup" : "magistr",
  "say" : 5,
  "model" : "gemini-3.8-flash"
}
```

**Çıxış (output):**

```json
[ {
  "sual" : "Read the passage and choose the sentence that best completes it.\n\nTechnological advancement has drastically reshaped the global workforce over the past few decades. While automation has eliminated many routine manual tasks, it has simultaneously created high demand for specialized analytical roles. ___. Therefore, educational institutions must update their curricula to prepare graduates for these evolving workplace demands.",
  "variantlar" : {
    "A" : "Consequently, individuals must acquire modern digital competencies to remain competitive in the job market.",
    "B" : "Despite this, technological progress has had virtually no measurable impact on modern employment structures.",
    "C" : "As a result, manual labor has entirely replaced technical professions across all major economic sectors.",
    "D" : "In contrast, companies have completely ceased recruiting personnel with advanced technical qualifications.",
    "E" : "Furthermore, traditional office environments have become entirely unnecessary for conducting business."
  },
  "dogruCavab" : "A",
  "izah" : "Mətndə texnologiyanın iş mühitini dəyişdiyi, rutin işləri sıradan çıxararaq analitik bacarıqlara tələbatı artırdığı bildirilir. Növbəti cümlə bu tələbatın işçilər üçün nəticəsini ifadə etməli və son cümlədəki təhsil müəssisələrinin tədris proqramlarını yeniləməsi zərurətinə məntiqi körpü yaratmalıdır. «Fərdlərin əmək bazarında rəqabətədavamlı qalması üçün müasir rəqəmsal səriştələrə yiyələnməli olması» fikri abzasın məntiqi və tematik ardıcıllığını tam təmin edir. Şirkətlərin ixtisaslı kadr qəbulunu dayandırdığını, fiziki əməyin texniki peşələri əvəz etdiyini və ya texnologiyanın məşğulluğa təsir etmədiyini bildirən digər variantlar mətnin məzmununa ziddir. Doğru cavab: A.",
  "movzu" : "Sentence completion and paragraph coherence",
  "cetinlik" : "orta",
  "fenn" : "Xarici dil"
}, {
  "sual" : "Choose the correct tense forms to complete the sentence.\n\nBy the time the keynote speaker ___ at the conference hall, the organizers ___ all the technical equipment and the attendees had already taken their seats.",
  "variantlar" : {
    "A" : "arrived / had tested",
    "B" : "arrived / would test",
    "C" : "had arrived / tested",
    "D" : "arrives / have tested",
    "E" : "was arriving / test"
  },
  "dogruCavab" : "A",
  "izah" : "Zaman uzlaşması qaydasına əsasən, keçmişə aid zaman budaq cümlələrində «by the time» bağlayıcısından sonra Past Simple zaman forması işlənir. Baş cümlədə isə həmin vaxta qədər baş verib tamamlanmış hərəkətləri bildirmək üçün Past Perfect işlənməlidir. Cümlənin sonundakı «had already taken» feli də baş cümlədə hərəkətlərin həmcins olaraq Past Perfect formasında olduğunu göstərir. Deməli, birinci boşluqda «arrived», ikinci boşluqda isə «had tested» olmalıdır. Digər variantlar zamanların düzgün ardıcıllığını pozur. Doğru cavab: A.",
  "movzu" : "Tense forms and sequence of tenses",
  "cetinlik" : "orta",
  "fenn" : "Xarici dil"
}, {
  "sual" : "Choose the correct option to complete the sentence.\n\n___ the project manager ___ the potential risks at the beginning, we ___ such serious financial difficulties right now.",
  "variantlar" : {
    "A" : "Should / identify / would not have faced",
    "B" : "Had / identified / would not be facing",
    "C" : "Had / identified / were not facing",
    "D" : "Were / to identify / will not face",
    "E" : "If / had identified / had not faced"
  },
  "dogruCavab" : "B",
  "izah" : "Bu cümlə qarışıq şərt budaq cümləsidir (Mixed Conditional: Type 3 şərt + Type 2 nəticə) və budaq cümlədə inversiya tətbiq edilmişdir. Şərt keçmiş zamana aid olduğu üçün («at the beginning») Past Perfect tələb olunur və «if» bağlayıcısı atıldıqda köməkçi fel mübtədadan əvvələ keçir: «Had the project manager identified...». Nəticə isə indiki zamana aid olduğu üçün («right now») baş cümlədə «would not be facing» (Continuous Conditional) işlənməlidir. Keçmiş nəticə bildirən «had not faced» və ya köməkçi modalsız yazılmış «were not facing» formaları indiki zaman zərfi ilə uzlaşmır. Doğru cavab: B.",
  "movzu" : "Conditionals and wish-clauses; inversion",
  "cetinlik" : "cetin",
  "fenn" : "Xarici dil"
}, {
  "sual" : "Choose the correct articles to complete the sentence.\n\n___ Mount Everest is the highest mountain in ___ world, situated in ___ Himalayas.",
  "variantlar" : {
    "A" : "The / a / the",
    "B" : "- / a / -",
    "C" : "- / the / the",
    "D" : "- / - / the",
    "E" : "The / the / the"
  },
  "dogruCavab" : "C",
  "izah" : "Artiklların işlənmə qaydasına əsasən: 1) Tək dağ zirvələrinin adları (Mount Everest, Elbrus) artiklsız işlənir (-); 2) Vahidlik bildirən varlıqların adları qarşısında müəyyənlik artikli işlənir: «the world»; 3) Silsilə dağ adlarının qarşısında müəyyənlik artikli işlənir: «the Himalayas». Bu səbəbdən ardıcıllıq «- / the / the» şəklində olmalıdır. Doğru cavab: C.",
  "movzu" : "Nouns, articles and determiners in context",
  "cetinlik" : "asan",
  "fenn" : "Xarici dil"
}, {
  "sual" : "Choose the correct sentences with pronouns and quantifiers.\n\n1. Only a few applicants were invited to the second stage of the interview.\n2. Every of the students received a certificate at the end of the course.\n3. Both of the proposed methods were rejected by the scientific board.\n4. Neither of the answers is correct, so no points were awarded.\n5. There is too many equipment in the newly renovated laboratory.",
  "variantlar" : {
    "A" : "1, 2, 4",
    "B" : "3, 4, 5",
    "C" : "2, 3, 5",
    "D" : "1, 2, 5",
    "E" : "1, 3, 4"
  },
  "dogruCavab" : "E",
  "izah" : "Cümlələrin təhlili:\n1. «Only a few» ifadəsi sayılan cəm isimlə («applicants») düzgün işlənib və xəbər cəmdədir («were»). Doğrudur.\n2. «Every» təyini əvəzliyi birbaşa «of» sözönü ilə işlənə bilməz; bu halda «each of» və ya «every one of» işlənməlidir. Yanlışdır.\n3. «Both of» cəm isimlə işlənir və xəbəri cəmdə tələb edir («were rejected»). Doğrudur.\n4. «Neither of + cəm isim» quruluşunda rəsmi qrammatik qaydaya əsasən xəbər təkdə olur («is»). Doğrudur.\n5. «Equipment» sayılmayan isim olduğundan «too many» ilə deyil, «too much» ilə işlənməlidir. Yanlışdır.\nBeləliklə, düzgün cümlələr 1, 3 və 4-dür. Doğru cavab: E.",
  "movzu" : "Pronouns and quantifiers",
  "cetinlik" : "cetin",
  "fenn" : "Xarici dil"
} ]
```

**Nəticə:** ✅ 5 sual; hər birində 5 unikal variant, izahdakı cavab hərfi dogruCavab ilə eyni, LaTeX balanslı, KaTeX-də olmayan əmr və Türkiyə türkcəsi sözü yoxdur, suallar təkrarlanmır

## Canlı AI sual generatoru — Riyaziyyat (1-ci qrup) — Loqarifm: xassələr, loqarifmik tənlik və bərabərsizliklər (çətin səviyyədə)

**Giriş (input):**

```json
{
  "model" : "gemini-3.8-flash",
  "movzu" : "Loqarifm: xassələr, loqarifmik tənlik və bərabərsizliklər (çətin səviyyədə)",
  "qrup" : "1",
  "say" : 5,
  "fenn" : "Riyaziyyat"
}
```

**Çıxış (output):**

```json
[ {
  "sual" : "$\\dfrac{\\log_2(x^2 - 3x + 2) - 1}{\\log_3(x + 5) - 2} \\le 0$ bərabərsizliyinin tam həllərinin cəmini tapın.",
  "variantlar" : {
    "A" : "$-7$",
    "B" : "$-4$",
    "C" : "$0$",
    "D" : "$-3$",
    "E" : "$-10$"
  },
  "dogruCavab" : "A",
  "izah" : "Təyin oblastını müəyyən edək:\n$$\\begin{cases} x^2 - 3x + 2 > 0 \\\\ x + 5 > 0 \\\\ \\log_3(x + 5) \\ne 2 \\end{cases}$$\nBuradan $x \\in (-\\infty; 1) \\cup (2; \\infty)$, $x > -5$ və $x \\ne 4$ alınır. Kəsişmə: $D = (-5; 1) \\cup (2; 4) \\cup (4; \\infty)$.\n\nSürətin sıfırlarını tapaq:\n$$\\log_2(x^2 - 3x + 2) = 1 \\implies x^2 - 3x + 2 = 2 \\implies x(x - 3) = 0$$\n$x = 0$ və $x = 3$.\n\nMəxrəcin sıfırı:\n$$\\log_3(x + 5) = 2 \\implies x + 5 = 9 \\implies x = 4$$\n\nİntervallar üsulunu təyin oblastında tətbiq etsək, kəsrin mənfi və ya sıfır olduğu aralıqlar:\n$$x \\in (-5; 0] \\cup [3; 4)$$\nBu aralıqlara daxil olan tam ədədlər: $-4, -3, -2, -1, 0, 3$.\nTam həllərin cəmi:\n$$(-4) + (-3) + (-2) + (-1) + 0 + 3 = -7$$\nƏn çox edilən səhv təyin oblastında $x \\in (1; 2)$ aralığının kənarlaşdırılmasını və məxrəcin sıfırı olan $x = 4$ nöqtəsinin ciddi çıxarılmasını nəzərdən qaçırmaqdır. Doğru cavab: A.",
  "movzu" : "Loqarifmik bərabərsizliklər — kəsr-loqarifmik bərabərsizlik",
  "cetinlik" : "cetin",
  "fenn" : "Riyaziyyat"
}, {
  "sual" : "İfadənin qiymətini hesablayın: $$\\dfrac{3^{\\log_3^2 5} + 5^{\\log_3 5}}{5^{\\log_3 15}} + \\log_4 \\log_3 \\sqrt{81}$$",
  "variantlar" : {
    "A" : "$\\dfrac{11}{10}$",
    "B" : "$\\dfrac{3}{5}$",
    "C" : "$\\dfrac{9}{10}$",
    "D" : "$1$",
    "E" : "$\\dfrac{7}{10}$"
  },
  "dogruCavab" : "C",
  "izah" : "Əsas loqarifmik eynilikdən istifadə edək:\n$$a^{\\log_a b} = b$$\nBirinci toplananın sürətindəki birinci həddi sadələşdirək:\n$$3^{\\log_3^2 5} = \\left(3^{\\log_3 5}\\right)^{\\log_3 5} = 5^{\\log_3 5}$$\nOnda sürət belə olar:\n$$5^{\\log_3 5} + 5^{\\log_3 5} = 2 \\cdot 5^{\\log_3 5}$$\n\nMəxrəci çevirək:\n$$5^{\\log_3 15} = 5^{\\log_3 (3 \\cdot 5)} = 5^{1 + \\log_3 5} = 5^1 \\cdot 5^{\\log_3 5} = 5 \\cdot 5^{\\log_3 5}$$\nBirinci kəsrin qiyməti:\n$$\\dfrac{2 \\cdot 5^{\\log_3 5}}{5 \\cdot 5^{\\log_3 5}} = \\dfrac{2}{5}$$\n\nİkinci toplananı hesablayaq:\n$$\\sqrt{81} = 9 \\implies \\log_3 9 = 2 \\implies \\log_4 2 = \\dfrac{1}{2}$$\n\nCəmi tapaq:\n$$\\dfrac{2}{5} + \\dfrac{1}{2} = \\dfrac{4 + 5}{10} = \\dfrac{9}{10}$$\nDoğru cavab: C.",
  "movzu" : "Loqarifmik ifadələrin çevrilməsi və xassələri",
  "cetinlik" : "cetin",
  "fenn" : "Riyaziyyat"
}, {
  "sual" : "$\\log_2(x^2 - 1) = \\log_{x^2 - 1} 16$ tənliyinin köklərinin hasilini tapın.",
  "variantlar" : {
    "A" : "$5$",
    "B" : "$\\dfrac{25}{4}$",
    "C" : "$\\dfrac{5}{2}$",
    "D" : "$-\\dfrac{25}{4}$",
    "E" : "$\\dfrac{25}{16}$"
  },
  "dogruCavab" : "B",
  "izah" : "Tənliyin təyin oblastı:\n$$x^2 - 1 > 0 \\quad \\text{və} \\quad x^2 - 1 \\ne 1 \\implies x^2 > 1 \\quad \\text{və} \\quad x^2 \\ne 2$$\n\nƏsası $2$-yə gətirək:\n$$\\log_{x^2 - 1} 16 = \\dfrac{\\log_2 16}{\\log_2(x^2 - 1)} = \\dfrac{4}{\\log_2(x^2 - 1)}$$\n\n$\\log_2(x^2 - 1) = t$ əvəzləməsi aparaq:\n$$t = \\dfrac{4}{t} \\implies t^2 = 4 \\implies t_1 = 2, \\quad t_2 = -2$$\n\nHər iki halı araşdıraq:\n1) $\\log_2(x^2 - 1) = 2 \\implies x^2 - 1 = 4 \\implies x^2 = 5 \\implies x = \\pm\\sqrt{5}$\n2) $\\log_2(x^2 - 1) = -2 \\implies x^2 - 1 = \\dfrac{1}{4} \\implies x^2 = \\dfrac{5}{4} \\implies x = \\pm\\dfrac{\\sqrt{5}}{2}$\n\nBütün köklər təyin oblastını ödəyir. Köklərin hasili:\n$$(\\sqrt{5}) \\cdot (-\\sqrt{5}) \\cdot \\left(\\dfrac{\\sqrt{5}}{2}\\right) \\cdot \\left(-\\dfrac{\\sqrt{5}}{2}\\right) = (-5) \\cdot \\left(-\\dfrac{5}{4}\\right) = \\dfrac{25}{4}$$\nƏn çox edilən səhv mənfi kökləri unudaraq yalnız müsbət kökləri vurmaq və ya işarə xətası etməkdir. Doğru cavab: B.",
  "movzu" : "Loqarifmik tənliklər — yeni dəyişən daxil etmə və əsasın dəyişdirilməsi",
  "cetinlik" : "cetin",
  "fenn" : "Riyaziyyat"
}, {
  "sual" : "$a$-nın hansı tam qiymətlərində $\\log_2^2 x - 2a\\log_2 x + a^2 - 4 = 0$ tənliyinin yalnız bir kökü $(1; 8)$ intervalına daxildir? Həmin tam qiymətlərin cəmini tapın.",
  "variantlar" : {
    "A" : "$10$",
    "B" : "$5$",
    "C" : "$6$",
    "D" : "$4$",
    "E" : "$8$"
  },
  "dogruCavab" : "C",
  "izah" : "$t = \\log_2 x$ əvəzləməsi aparaq. Tənlik kvadrat tənliyə çevrilir:\n$$t^2 - 2at + a^2 - 4 = 0 \\implies (t - a)^2 = 4$$\nBuradan köklər:\n$$t_1 = a - 2, \\quad t_2 = a + 2$$\n\n$x \\in (1; 8)$ şərtindən $t = \\log_2 x \\in (0; 3)$ alınır. Nəzərə alaq ki, köklər arasındakı məsafə $t_2 - t_1 = 4$-dür, bu isə $(0; 3)$ intervalının uzunluğundan ($3$) böyükdür. Deməli, hər iki kök eyni zamanda bu intervala daxil ola bilməz.\n\nYalnız bir kökün $(0; 3)$ intervalında olması üçün iki hal mümkündür:\n1) $t_1 \\in (0; 3) \\implies 0 < a - 2 < 3 \\implies 2 < a < 5$. Bu halda $t_2 = a + 2 > 4$, yəni $t_2 \\notin (0; 3)$. Tam qiymətlər: $a = 3, 4$.\n2) $t_2 \\in (0; 3) \\implies 0 < a + 2 < 3 \\implies -2 < a < 1$. Bu halda $t_1 = a - 2 < -1$, yəni $t_1 \\notin (0; 3)$. Tam qiymətlər: $a = -1, 0$.\n\n$a$-nın ala biləcəyi tam qiymətlərin cəmi:\n$$(-1) + 0 + 3 + 4 = 6$$\nDoğru cavab: C.",
  "movzu" : "Parametrli loqarifmik tənliklər",
  "cetinlik" : "cetin",
  "fenn" : "Riyaziyyat"
}, {
  "sual" : "$\\log_{x-1}(x^2 - 8x + 16) \\le 0$ bərabərsizliyini həll edin.",
  "variantlar" : {
    "A" : "$(1; 2) \\cup (3; 5)$",
    "B" : "$(-\\infty; 2) \\cup [3; 5]$",
    "C" : "$(1; 2) \\cup [3; 4) \\cup (4; 5]$",
    "D" : "$(1; 2) \\cup [3; 5]$",
    "E" : "$[3; 4) \\cup (4; 5]$"
  },
  "dogruCavab" : "C",
  "izah" : "Təyin oblastını müəyyən edək:\n$$\\begin{cases} x - 1 > 0 \\\\ x - 1 \\ne 1 \\\\ x^2 - 8x + 16 > 0 \\end{cases} \\implies \\begin{cases} x > 1 \\\\ x \\ne 2 \\\\ (x - 4)^2 > 0 \\implies x \\ne 4 \\end{cases}$$\nTəyin oblastı: $x \\in (1; 2) \\cup (2; 4) \\cup (4; \\infty)$.\n\nBərabərsizliklərin rasionallaşdırma üsuluna əsasən, $\\log_a b \\le 0$ bərabərsizliyi təyin oblastında $(a - 1)(b - 1) \\le 0$ bərabərsizliyinə ekvivalentdir:\n$$(x - 1 - 1)((x - 4)^2 - 1) \\le 0$$\n$$(x - 2)(x - 4 - 1)(x - 4 + 1) \\le 0$$\n$$(x - 2)(x - 5)(x - 3) \\le 0$$\n\nİntervallar üsuluna görə həll: $(-\\infty; 2] \\cup [3; 5]$.\nBu çoxluğu təyin oblastı ilə kəsişdirək:\n$$x \\in (1; 2) \\cup [3; 4) \\cup (4; 5]$$\nƏn çox edilən səhv $(x - 4)^2 > 0$ şərtindən $x \\ne 4$ məhdudiyyətini nəzərə almayıb $4$ nöqtəsini həllə daxil etməkdir. Doğru cavab: C.",
  "movzu" : "Dəyişən əsaslı loqarifmik bərabərsizliklər",
  "cetinlik" : "cetin",
  "fenn" : "Riyaziyyat"
} ]
```

**Nəticə:** ✅ 5 sual; hər birində 5 unikal variant, izahdakı cavab hərfi dogruCavab ilə eyni, LaTeX balanslı, KaTeX-də olmayan əmr və Türkiyə türkcəsi sözü yoxdur, suallar təkrarlanmır

## Canlı AI sual generatoru — Riyaziyyat (1-ci qrup) — Triqonometrik ifadələr, düsturlar və tənliklər (orta çətinlikdə)

**Giriş (input):**

```json
{
  "model" : "gemini-3.8-flash",
  "movzu" : "Triqonometrik ifadələr, düsturlar və tənliklər (orta çətinlikdə)",
  "qrup" : "1",
  "say" : 5,
  "fenn" : "Riyaziyyat"
}
```

**Çıxış (output):**

```json
[ {
  "sual" : "$\\sin\\alpha - \\cos\\alpha = \\dfrac{1}{2}$ olarsa, $\\sin^3\\alpha - \\cos^3\\alpha$ ifadəsinin qiymətini tapın.",
  "variantlar" : {
    "A" : "$\\dfrac{9}{16}$",
    "B" : "$\\dfrac{5}{8}$",
    "C" : "$\\dfrac{13}{16}$",
    "D" : "$\\dfrac{11}{16}$",
    "E" : "$\\dfrac{7}{16}$"
  },
  "dogruCavab" : "D",
  "izah" : "Əvvəlcə verilmiş bərabərliyin hər iki tərəfini kvadrata yüksəldərək $\\sin\\alpha\\cos\\alpha$ hasilini tapaq: $$(\\sin\\alpha - \\cos\\alpha)^2 = \\left(\\dfrac{1}{2}\\right)^2$$ $$\\sin^2\\alpha - 2\\sin\\alpha\\cos\\alpha + \\cos^2\\alpha = \\dfrac{1}{4}$$ $\\sin^2\\alpha + \\cos^2\\alpha = 1$ eyniliyini nəzərə alsaq: $$1 - 2\\sin\\alpha\\cos\\alpha = \\dfrac{1}{4} \\implies 2\\sin\\alpha\\cos\\alpha = \\dfrac{3}{4} \\implies \\sin\\alpha\\cos\\alpha = \\dfrac{3}{8}$$ İndi isə kublar fərqi düsturunu tətbiq edək: $$\\sin^3\\alpha - \\cos^3\\alpha = (\\sin\\alpha - \\cos\\alpha)(\\sin^2\\alpha + \\sin\\alpha\\cos\\alpha + \\cos^2\\alpha)$$ Məlum qiymətləri yerinə yazaq: $$\\sin^3\\alpha - \\cos^3\\alpha = \\dfrac{1}{2} \\cdot \\left(1 + \\dfrac{3}{8}\\right) = \\dfrac{1}{2} \\cdot \\dfrac{11}{8} = \\dfrac{11}{16}$$ Doğru cavab: D. Ən çox edilən səhv kublar fərqi düsturunun natamam kvadratında işarəni səhv götürməkdir.",
  "movzu" : "Triqonometrik eyniliklər — Əsas eyniliklər və cəbr düsturları",
  "cetinlik" : "orta",
  "fenn" : "Riyaziyyat"
}, {
  "sual" : "İfadənin qiymətini hesablayın: $\\dfrac{\\cos 20^\\circ - \\sqrt{3}\\sin 20^\\circ}{\\sin 10^\\circ}$.",
  "variantlar" : {
    "A" : "$\\dfrac{1}{2}$",
    "B" : "$4$",
    "C" : "$1$",
    "D" : "$2$",
    "E" : "$\\sqrt{3}$"
  },
  "dogruCavab" : "D",
  "izah" : "Surətdə köməkçi bucaq daxil etmə üsulundan istifadə edərək ifadəni $2$-yə vurub bölək: $$\\cos 20^\\circ - \\sqrt{3}\\sin 20^\\circ = 2\\left(\\dfrac{1}{2}\\cos 20^\\circ - \\dfrac{\\sqrt{3}}{2}\\sin 20^\\circ\\right)$$ $\\cos 60^\\circ = \\dfrac{1}{2}$ və $\\sin 60^\\circ = \\dfrac{\\sqrt{3}}{2}$ olduğunu nəzərə alsaq: $$2(\\cos 60^\\circ\\cos 20^\\circ - \\sin 60^\\circ\\sin 20^\\circ) = 2\\cos(60^\\circ + 20^\\circ) = 2\\cos 80^\\circ$$ Çevirmə düsturuna əsasən: $$\\cos 80^\\circ = \\cos(90^\\circ - 10^\\circ) = \\sin 10^\\circ$$ Kəsrdə yerinə yazsaq: $$\\dfrac{2\\cos 80^\\circ}{\\sin 10^\\circ} = \\dfrac{2\\sin 10^\\circ}{\\sin 10^\\circ} = 2$$ Doğru cavab: D.",
  "movzu" : "Triqonometrik düsturlar — Köməkçi bucaq və çevirmə düsturları",
  "cetinlik" : "orta",
  "fenn" : "Riyaziyyat"
}, {
  "sual" : "$\\sin 2x = \\sqrt{3}\\cos x$ tənliyinin $[0; \\pi]$ parçasına daxil olan köklərinin cəmini tapın.",
  "variantlar" : {
    "A" : "$\\dfrac{4\\pi}{3}$",
    "B" : "$\\dfrac{3\\pi}{2}$",
    "C" : "$\\pi$",
    "D" : "$\\dfrac{5\\pi}{6}$",
    "E" : "$2\\pi$"
  },
  "dogruCavab" : "B",
  "izah" : "İkiqat bucağın sinus düsturundan istifadə edək: $$\\sin 2x = 2\\sin x \\cos x$$ Tənliyi bir tərəfə keçirib ortaq vuruğu mötərizə xaricinə çıxaraq: $$2\\sin x \\cos x - \\sqrt{3}\\cos x = 0$$ $$\\cos x (2\\sin x - \\sqrt{3}) = 0$$ Hasilin sıfır olması üçün vuruqlardan ən azı biri sıfır olmalıdır: 1) $\\cos x = 0 \\implies [0; \\pi]$ parçasında $x_1 = \\dfrac{\\pi}{2}$; 2) $2\\sin x - \\sqrt{3} = 0 \\implies \\sin x = \\dfrac{\\sqrt{3}}{2} \\implies [0; \\pi]$ parçasında $x_2 = \\dfrac{\\pi}{3}$ və $x_3 = \\pi - \\dfrac{\\pi}{3} = \\dfrac{2\\pi}{3}$. Köklərin cəmi: $$x_1 + x_2 + x_3 = \\dfrac{\\pi}{2} + \\dfrac{\\pi}{3} + \\dfrac{2\\pi}{3} = \\dfrac{\\pi}{2} + \\pi = \\dfrac{3\\pi}{2}$$ Doğru cavab: B. Ən çox edilən səhv hər iki tərəfi $\\cos x$-ə bölərək $\\cos x = 0$ kökünü itirməkdir.",
  "movzu" : "Triqonometrik tənliklər — İkiqat bucaq və vuruqlara ayırma",
  "cetinlik" : "orta",
  "fenn" : "Riyaziyyat"
}, {
  "sual" : "İfadənin qiymətini hesablayın: $\\cos\\left(\\arcsin\\dfrac{3}{5} + \\arccos\\dfrac{5}{13}\\right)$.",
  "variantlar" : {
    "A" : "$\\dfrac{56}{65}$",
    "B" : "$-\\dfrac{56}{65}$",
    "C" : "$-\\dfrac{33}{65}$",
    "D" : "$\\dfrac{16}{65}$",
    "E" : "$-\\dfrac{16}{65}$"
  },
  "dogruCavab" : "E",
  "izah" : "$\\alpha = \\arcsin\\dfrac{3}{5}$ və $\\beta = \\arccos\\dfrac{5}{13}$ əvəzləmələri aparaq. Arqumentlər müsbət olduğundan $\\alpha, \\beta \\in \\left(0; \\dfrac{\\pi}{2}\\right)$. Buradan: $$\\sin\\alpha = \\dfrac{3}{5} \\implies \\cos\\alpha = \\sqrt{1 - \\left(\\dfrac{3}{5}\\right)^2} = \\dfrac{4}{5}$$ $$\\cos\\beta = \\dfrac{5}{13} \\implies \\sin\\beta = \\sqrt{1 - \\left(\\dfrac{5}{13}\\right)^2} = \\dfrac{12}{13}$$ Kosinuslar cəmi düsturunu tətbiq edək: $$\\cos(\\alpha + \\beta) = \\cos\\alpha\\cos\\beta - \\sin\\alpha\\sin\\beta$$ Qiymətləri yerinə yazaq: $$\\cos(\\alpha + \\beta) = \\dfrac{4}{5} \\cdot \\dfrac{5}{13} - \\dfrac{3}{5} \\cdot \\dfrac{12}{13} = \\dfrac{20}{65} - \\dfrac{36}{65} = -\\dfrac{16}{65}$$ Doğru cavab: E. Ən çox edilən səhv kosinuslar cəmi düsturunda mənfi işarəsini müsbətlə qarışdırmaqdır.",
  "movzu" : "Tərs triqonometrik funksiyalar — Toplama düsturlarının tətbiqi",
  "cetinlik" : "orta",
  "fenn" : "Riyaziyyat"
}, {
  "sual" : "$f(x) = 3\\cos^2 x - 4\\sin x + 1$ funksiyasının ən kiçik qiymətini tapın.",
  "variantlar" : {
    "A" : "$0$",
    "B" : "$-3$",
    "C" : "$-6$",
    "D" : "$5$",
    "E" : "$-4$"
  },
  "dogruCavab" : "B",
  "izah" : "Əsas triqonometrik eynilikdən istifadə edərək $\\cos^2 x$-i sinusla əvəz edək: $$\\cos^2 x = 1 - \\sin^2 x$$ Funksiyanı sadələşdirək: $$f(x) = 3(1 - \\sin^2 x) - 4\\sin x + 1 = -3\\sin^2 x - 4\\sin x + 4$$ $\\sin x = t$ əvəzləməsi aparaq. Sinusun qiymətlər çoxluğuna görə $t \\in [-1; 1]$. Kvadrat üçhədli alırıq: $$g(t) = -3t^2 - 4t + 4, \\quad t \\in [-1; 1]$$ Parabolanın təpə nöqtəsinin absisi: $$t_0 = -\\dfrac{b}{2a} = -\\dfrac{-4}{2 \\cdot (-3)} = -\\dfrac{2}{3} \\in [-1; 1]$$ $a = -3 < 0$ olduğundan parabola təpə nöqtəsində ən böyük qiymətini alır. Ən kiçik qiymət isə parçanın uc nöqtələrindən birində alınır: $$g(-1) = -3(-1)^2 - 4(-1) + 4 = -3 + 4 + 4 = 5$$ $$g(1) = -3(1)^2 - 4(1) + 4 = -3 - 4 + 4 = -3$$ Deməli, funksiyanın ən kiçik qiyməti $-3$-dür. Doğru cavab: B.",
  "movzu" : "Triqonometrik funksiyalar — Qiymətlər çoxluğu və ən kiçik qiymət",
  "cetinlik" : "orta",
  "fenn" : "Riyaziyyat"
} ]
```

**Nəticə:** ✅ 5 sual; hər birində 5 unikal variant, izahdakı cavab hərfi dogruCavab ilə eyni, LaTeX balanslı, KaTeX-də olmayan əmr və Türkiyə türkcəsi sözü yoxdur, suallar təkrarlanmır

## Canlı AI sual generatoru — Riyaziyyat (1-ci qrup) — Həndəsə: üçbucaq, trapesiya, çevrə, silindr və konus — sahə və həcm (orta çətinlikdə)

**Giriş (input):**

```json
{
  "model" : "gemini-3.8-flash",
  "movzu" : "Həndəsə: üçbucaq, trapesiya, çevrə, silindr və konus — sahə və həcm (orta çətinlikdə)",
  "qrup" : "1",
  "say" : 5,
  "fenn" : "Riyaziyyat"
}
```

**Çıxış (output):**

```json
[ {
  "sual" : "Tərəfləri $13$, $14$ və $15$ olan üçbucağın daxilinə çəkilmiş çevrənin radiusunu tapın.",
  "variantlar" : {
    "A" : "$3{,}5$",
    "B" : "$4$",
    "C" : "$4{,}5$",
    "D" : "$5$",
    "E" : "$3$"
  },
  "dogruCavab" : "B",
  "izah" : "Daxilə çəkilmiş çevrənin radiusu düsturu: $$r = \\dfrac{S}{p}$$ Burada $p$ yarımperimetrdir: $$p = \\dfrac{13 + 14 + 15}{2} = 21$$ Heron düsturuna əsasən üçbucağın sahəsi: $$S = \\sqrt{p(p-a)(p-b)(p-c)} = \\sqrt{21 \\cdot (21-13) \\cdot (21-14) \\cdot (21-15)}$$ $$S = \\sqrt{21 \\cdot 8 \\cdot 7 \\cdot 6} = \\sqrt{7056} = 84$$ Daxilə çəkilmiş çevrənin radiusunu tapaq: $$r = \\dfrac{84}{21} = 4$$ Doğru cavab: B. Ən çox edilən səhv yarımperimetr əvəzinə tam perimetrə bölməkdir.",
  "movzu" : "Üçbucağın sahəsi və daxilinə çəkilmiş çevrə",
  "cetinlik" : "orta",
  "fenn" : "Riyaziyyat",
  "figura" : {
    "type" : "triangle",
    "sides" : [ "AB=13", "BC=14", "CA=15" ],
    "angles" : [ "", "", "" ],
    "rightAngleAt" : null
  }
}, {
  "sual" : "Oturacaqları $4$ və $16$ olan bərabəryanlı trapesiyanın daxilinə çevrə çəkilmişdir. Trapesiyanın sahəsini tapın.",
  "variantlar" : {
    "A" : "$96$",
    "B" : "$64$",
    "C" : "$160$",
    "D" : "$40$",
    "E" : "$80$"
  },
  "dogruCavab" : "E",
  "izah" : "Dördbucaqlının daxilinə çevrə çəkildikdə qarşı tərəflərin cəmi bərabər olur: $$a + b = 2c$$ Burada $a = 4$ və $b = 16$ oturacaqlar, $c$ isə yan tərəfdir. $$2c = 4 + 16 = 20 \\implies c = 10$$ Bərabəryanlı trapesiyanın hündürlüyünün böyük oturacaqdan ayırdığı kiçik parça: $$x = \\dfrac{b - a}{2} = \\dfrac{16 - 4}{2} = 6$$ Pifaqor teoreminə görə hündürlük: $$h = \\sqrt{c^2 - x^2} = \\sqrt{10^2 - 6^2} = \\sqrt{64} = 8$$ Trapesiyanın sahəsi: $$S = \\dfrac{a + b}{2} \\cdot h = \\dfrac{4 + 16}{2} \\cdot 8 = 10 \\cdot 8 = 80$$ Doğru cavab: E. Ən çox edilən səhv yan tərəfi hündürlük kimi qəbul edərək $100$ tapmaqdır.",
  "movzu" : "Trapesiyanın sahəsi",
  "cetinlik" : "orta",
  "fenn" : "Riyaziyyat",
  "figura" : {
    "type" : "trapezoid",
    "a" : "4",
    "b" : "16",
    "height" : "?"
  }
}, {
  "sual" : "Çevrədə uzunluğu $6\\sqrt{3}$ olan vətərin gərdiyi qövsün dərəcə ölçüsü $120^\\circ$-dir. Bu vətərin ayırdığı kiçik seqmentin sahəsini tapın.",
  "variantlar" : {
    "A" : "$12\\pi - 6\\sqrt{3}$",
    "B" : "$12\\pi - 18\\sqrt{3}$",
    "C" : "$12\\pi - 9\\sqrt{3}$",
    "D" : "$6\\pi - 9\\sqrt{3}$",
    "E" : "$36\\pi - 9\\sqrt{3}$"
  },
  "dogruCavab" : "C",
  "izah" : "Vətərin uzunluğu ilə radius arasındakı əlaqə: $$a = 2R \\sin\\dfrac{\\alpha}{2}$$ Burada $\\alpha = 120^\\circ$ olduğuna görə: $$6\\sqrt{3} = 2R \\sin 60^\\circ = 2R \\cdot \\dfrac{\\sqrt{3}}{2} = R\\sqrt{3} \\implies R = 6$$ Seqmentin sahəsi sektorun sahəsi ilə uyğun üçbucağın sahəsinin fərqinə bərabərdir: $$S_{\\text{seqment}} = S_{\\text{sektor}} - S_{\\triangle}$$ Sektorun sahəsi: $$S_{\\text{sektor}} = \\dfrac{\\pi R^2 \\cdot 120^\\circ}{360^\\circ} = \\dfrac{\\pi \\cdot 36}{3} = 12\\pi$$ Mərkəzi üçbucağın sahəsi: $$S_{\\triangle} = \\dfrac{1}{2} R^2 \\sin 120^\\circ = \\dfrac{1}{2} \\cdot 36 \\cdot \\dfrac{\\sqrt{3}}{2} = 9\\sqrt{3}$$ Beləliklə, seqmentin sahəsi $12\\pi - 9\\sqrt{3}$ olar. Doğru cavab: C. Ən çox edilən səhv sektor sahəsini hesablayarkən bucağı tam çevrəyə nisbətdə düzgün nəzərə almamaqdır.",
  "movzu" : "Dairə və onun hissələrinin sahəsi",
  "cetinlik" : "orta",
  "fenn" : "Riyaziyyat",
  "figura" : {
    "type" : "circle",
    "radius" : "6"
  }
}, {
  "sual" : "Silindrin ox kəsiyi sahəsi $36$ olan kvadratdır. Silindrin həcmini tapın.",
  "variantlar" : {
    "A" : "$72\\pi$",
    "B" : "$54\\pi$",
    "C" : "$108\\pi$",
    "D" : "$27\\pi$",
    "E" : "$36\\pi$"
  },
  "dogruCavab" : "B",
  "izah" : "Silindrin ox kəsiyi kvadrat olduğundan onun tərəfi $a = \\sqrt{36} = 6$ olar. Ox kəsiyinin tərəfləri silindrin hündürlüyünə və oturacağının diametrinə bərabərdir: $$H = 6$$ $$2R = 6 \\implies R = 3$$ Silindrin həcm düsturu: $$V = \\pi R^2 H$$ Kəmiyyətləri yerinə yazaq: $$V = \\pi \\cdot 3^2 \\cdot 6 = \\pi \\cdot 9 \\cdot 6 = 54\\pi$$ Doğru cavab: B. Ən çox edilən səhv diametri radius kimi götürüb həcmi $216\\pi$ və ya ox kəsiyinin sahəsi ilə qarışdıraraq $36\\pi$ almaqdır.",
  "movzu" : "Silindrin həcmi və kəsikləri",
  "cetinlik" : "orta",
  "fenn" : "Riyaziyyat",
  "figura" : {
    "type" : "cylinder",
    "radius" : "?",
    "height" : "?"
  }
}, {
  "sual" : "Konusun ox kəsiyi tərəfi $12$ olan bərabərtərəfli üçbucaqdır. Konusun həcmini tapın.",
  "variantlar" : {
    "A" : "$108\\sqrt{3}\\pi$",
    "B" : "$36\\sqrt{3}\\pi$",
    "C" : "$72\\sqrt{3}\\pi$",
    "D" : "$48\\sqrt{3}\\pi$",
    "E" : "$144\\sqrt{3}\\pi$"
  },
  "dogruCavab" : "C",
  "izah" : "Konusun ox kəsiyi bərabərtərəfli üçbucaq olduqda oturacağın diametri və doğuran bu üçbucağın tərəfinə bərabər olur: $$2R = 12 \\implies R = 6$$ Doğuran $l = 12$-dir. Bərabərtərəfli üçbucağın hündürlüyü konusun hündürlüyünə bərabərdir: $$H = \\dfrac{a\\sqrt{3}}{2} = \\dfrac{12\\sqrt{3}}{2} = 6\\sqrt{3}$$ Konusun həcm düsturu: $$V = \\dfrac{1}{3}\\pi R^2 H$$ Qiymətləri yerinə yazaq: $$V = \\dfrac{1}{3}\\pi \\cdot 6^2 \\cdot 6\\sqrt{3} = \\dfrac{1}{3}\\pi \\cdot 36 \\cdot 6\\sqrt{3} = 72\\sqrt{3}\\pi$$ Doğru cavab: C. Ən çox edilən səhv konusun həcm düsturundakı $\\dfrac{1}{3}$ əmsalını unudaraq silindr kimi hesablamaq və $216\\sqrt{3}\\pi$ almaqdır.",
  "movzu" : "Konusun həcmi və ox kəsiyi",
  "cetinlik" : "orta",
  "fenn" : "Riyaziyyat",
  "figura" : {
    "type" : "cone",
    "radius" : "?",
    "height" : "?"
  }
} ]
```

**Nəticə:** ✅ 5 sual; hər birində 5 unikal variant, izahdakı cavab hərfi dogruCavab ilə eyni, LaTeX balanslı, KaTeX-də olmayan əmr və Türkiyə türkcəsi sözü yoxdur, suallar təkrarlanmır

## Canlı AI Müəllim

**Giriş (input):**

```json
{
  "mesaj" : "sin^2 x + cos 2x ifadəsini sadələşdir və tg 45° neçədir?",
  "qrup" : "1"
}
```

**Çıxış (output):**

```json
Hər iki suala ardıcıllıqla və ətraflı baxaq.

---

### 1-ci sual: İfadənin sadələşdirilməsi

**Verilir:**  
$$\sin^2 x + \cos 2x$$

**İstifadə olunan qayda:**  
İkiqat bucağın kosinusu üçün əsas eyniliklərdən biri:  
$$\cos 2x = \cos^2 x - \sin^2 x$$

**Addım-addım həll:**

1. İfadəyə ikiqat bucaq düsturunu tətbiq edək:
   $$\sin^2 x + (\cos^2 x - \sin^2 x)$$

2. Mötərizəni açaq və oxşar hədləri islah edək:
   $$\sin^2 x - \sin^2 x + \cos^2 x = \cos^2 x$$

*(Qeyd: Həmçinin $\cos 2x = 1 - 2\sin^2 x$ düsturundan istifadə etsək, nəticə $1 - \sin^2 x$ olar ki, bu da əsas triqonometrik eyniliyə görə elə $\cos^2 x$-ə bərabərdir).*

**Cavab:** **$\cos^2 x$**

---

### 2-ci sual: $\operatorname{tg} 45^\circ$-nin qiyməti

**Qayda:**  
Tangens funksiyası eyni bucağın sinusunun kosinusuna nisbətinə bərabərdir:
$$\operatorname{tg} \alpha = \dfrac{\sin \alpha}{\cos \alpha}$$

**Hesablama:**  
Məlumdur ki:
$$\sin 45^\circ = \dfrac{\sqrt{2}}{2}, \quad \cos 45^\circ = \dfrac{\sqrt{2}}{2}$$

Onda:
$$\operatorname{tg} 45^\circ = \dfrac{\frac{\sqrt{2}}{2}}{\frac{\sqrt{2}}{2}} = 1$$

**Cavab:** **$1$**

---

Triqonometriyanın toplama düsturlarına aid bir test sualı ilə biliyini yoxlayaq?
```

**Nəticə:** ✅ cavab qayıtdı, LaTeX balanslıdır ($ cüt, { } bərabər), KaTeX-də olmayan əmr yoxdur

## LaTeX bərpası — JSON escape ilə toqquşan əmrlər

**Giriş (input):**

```json
AI-nin xam JSON cavabı:
{"izah":"$\frac{1}{2}$ $\theta$ $x \neq 0$ $\beta$ \left(x\right) $\times$ $\text{ m/s}$"}
```

**Çıxış (output):**

```json
Parse-dan sonrakı "izah" sahəsi:
$\frac{1}{2}$ $\theta$ $x \neq 0$ $\beta$ \left(x\right) $\times$ $\text{ m/s}$

Bərpasız olsaydı: \frac → form-feed + "rac", \theta → tab + "heta", \neq → yeni sətir + "eq"
```

**Nəticə:** ✅ bütün LaTeX əmrləri bütöv qaldı, KaTeX düzgün göstərir

## LaTeX bərpası — backslash-ın itməsinin qarşısı

**Giriş (input):**

```json
AI-nin xam JSON cavabı:
{"izah":"$\sqrt{2} \cdot 3$ $0\,5$ $25\%$ $\begin{cases} a \\\\ b \end{cases}$"}
```

**Çıxış (output):**

```json
Parse-dan sonrakı "izah" sahəsi:
$\sqrt{2} \cdot 3$ $0\,5$ $25\%$ $\begin{cases} a \\ b \end{cases}$

Bərpasız olsaydı: "sqrt{2}" xam mətn, \% → % (KaTeX-də düsturun qalanını silir)
```

**Nəticə:** ✅ \sqrt, \cdot, \, , \%, \begin/\end{cases} backslash-ı ilə qaldı
