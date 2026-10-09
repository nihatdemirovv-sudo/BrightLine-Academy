# Canlı AI keyfiyyət hesabatı

Model: gemini-3.8-flash

## Riyaziyyat (1-ci qrup) — 5 sual

### 1. Loqarifmik bərabərsizliklər — təyin oblastının nəzərə alınması [orta]

$\log_{0{,}5}(x^2 - 5x + 6) \ge -1$ bərabərsizliyinin tam həllərinin cəmini tapın.

- A) $10$
- B) $4$
- **C**) $5$
- D) $3$
- E) $7$

> Bərabərsizliyin təyin oblastını tapaq: $$x^2 - 5x + 6 > 0 \implies (x - 2)(x - 3) > 0 \implies x \in (-\infty; 2) \cup (3; +\infty)$$ Loqarifmin əsası $0{,}5 < 1$ olduğuna görə işarə əksinə dəyişir: $$x^2 - 5x + 6 \le (0{,}5)^{-1} \implies x^2 - 5x + 6 \le 2 \implies x^2 - 5x + 4 \le 0$$ Buradan $(x - 1)(x - 4) \le 0$, yəni $x \in [1; 4]$ alınır. Təyin oblastı ilə kəsişməni götürsək: $$x \in [1; 2) \cup (3; 4]$$ Bu aralıqdakı tam həllər $1$ və $4$ ədədləridir. Onların cəmi: $1 + 4 = 5$. Ən çox edilən səhv təyin oblastının unudularaq $2$ və $3$ ədədlərinin də daxil edilməsidir. Doğru cavab: C.

### 2. Triqonometrik düsturlar — ikiqat bucaq və toplama teoremləri [asan]

İfadənin qiymətini hesablayın: $$\dfrac{1 - 4\sin^2 15^\circ \cos^2 15^\circ}{\cos 40^\circ \cos 20^\circ - \sin 40^\circ \sin 20^\circ}$$

- A) $2$
- B) $0{,}75$
- C) $1$
- D) $0{,}5$
- **E**) $1{,}5$

> Surətdə ikiqat bucağın sinus düsturunu tətbiq edək: $$2\sin 15^\circ \cos 15^\circ = \sin 30^\circ = \dfrac{1}{2}$$ Onda $4\sin^2 15^\circ \cos^2 15^\circ = \left(\dfrac{1}{2}\right)^2 = \dfrac{1}{4}$ olar. Surətin qiyməti: $$1 - \dfrac{1}{4} = \dfrac{3}{4}$$ Məxrəcdə kosinusların toplama düsturunu tətbiq edək: $$\cos 40^\circ \cos 20^\circ - \sin 40^\circ \sin 20^\circ = \cos(40^\circ + 20^\circ) = \cos 60^\circ = \dfrac{1}{2}$$ Kəsrin qiyməti: $$\dfrac{\dfrac{3}{4}}{\dfrac{1}{2}} = \dfrac{3}{2} = 1{,}5$$ Doğru cavab: E.

### 3. Kvadrat tənliklər — köklərin işarəsi və parametrli tənliklər [cetin]

$x^2 - (2m - 1)x + m^2 - m - 2 = 0$ kvadrat tənliyinin müxtəlif işarəli iki kökünün olması və mənfi kökün modulunun müsbət kökdən böyük olması üçün $m$ parametrinin ala biləcəyi qiymətlər aralığını tapın.

- **A**) $\left(-1; \dfrac{1}{2}\right)$
- B) $(-\infty; -1)$
- C) $(-1; 2)$
- D) $\left(\dfrac{1}{2}; 2\right)$
- E) $\left(-2; \dfrac{1}{2}\right)$

> Viyet teoreminə əsasən köklərin hasili və cəmi: $$x_1 \cdot x_2 = m^2 - m - 2, \quad x_1 + x_2 = 2m - 1$$ Köklərin müxtəlif işarəli olması üçün hasil mənfi olmalıdır ($x_1 \cdot x_2 < 0$ olduqda $D > 0$ avtomatik ödənir): $$m^2 - m - 2 < 0 \implies (m - 2)(m + 1) < 0 \implies m \in (-1; 2)$$ Mənfi kökün modulunun müsbət kökdən böyük olması şərti ($|x_{\text{mənfi}}| > x_{\text{müsbət}}$) köklərin cəminin mənfi olmasını tələb edir: $$x_1 + x_2 < 0 \implies 2m - 1 < 0 \implies m < \dfrac{1}{2}$$ Hər iki şərtin kəsişməsi: $$m \in (-1; 2) \cap \left(-\infty; \dfrac{1}{2}\right) = \left(-1; \dfrac{1}{2}\right)$$ Doğru cavab: A.

### 4. Ehtimal nəzəriyyəsi — klassik ehtimal və kombinatorika [orta]

Qutuda $4$ ağ və $6$ qara kürəcik var. Qutudan eyni zamanda təsadüfi çıxarılan $3$ kürəcikdən ən azı ikisinin ağ olması ehtimalını tapın.

- A) $\dfrac{7}{24}$
- B) $\dfrac{2}{5}$
- **C**) $\dfrac{1}{3}$
- D) $\dfrac{1}{2}$
- E) $\dfrac{3}{10}$

> Klassik ehtimal düsturuna əsasən: $$P = \dfrac{m}{n}$$ Bütün mümkün halların sayı $10$ kürəcikdən $3$-nün seçilməsidir: $$n = C_{10}^3 = \dfrac{10 \cdot 9 \cdot 8}{3 \cdot 2 \cdot 1} = 120$$ «Ən azı ikisi ağ» hadisəsi ya $2$ ağ və $1$ qara, ya da $3$ ağ kürəciyin çıxarılması deməkdir. Əlverişli halların sayı: $$m = C_4^2 \cdot C_6^1 + C_4^3 = \dfrac{4 \cdot 3}{2} \cdot 6 + 4 = 36 + 4 = 40$$ Hadisənin ehtimalı: $$P = \dfrac{40}{120} = \dfrac{1}{3}$$ Doğru cavab: C.

### 5. İrrasional tənliklər — yeni dəyişən daxil etmə üsulu [cetin]

Tənliyin köklərinin hasilini tapın: $$\sqrt{x^2 - 3x + 5} + x^2 - 3x = 7$$

- A) $-7$
- B) $-12$
- **C**) $-4$
- D) $4$
- E) $3$

> Dəyişəni əvəz edək: $t = \sqrt{x^2 - 3x + 5}$, burada $t \ge 0$. Hər iki tərəfi kvadrata yüksəltsək: $$t^2 = x^2 - 3x + 5 \implies x^2 - 3x = t^2 - 5$$ İfadəni tənlikdə nəzərə alaq: $$t + t^2 - 5 = 7 \implies t^2 + t - 12 = 0$$ Tənliyin kökləri $t_1 = 3$ və $t_2 = -4$-dür. $t \ge 0$ şərtinə görə $t = -4$ kənar kökdür. Əvəzləməyə qayıdaq: $$\sqrt{x^2 - 3x + 5} = 3 \implies x^2 - 3x + 5 = 9 \implies x^2 - 3x - 4 = 0$$ Viyet teoreminə əsasən köklərin hasili: $$x_1 \cdot x_2 = -4$$ Ən çox edilən səhv $t = -4$ kənar kökünün də yoxlanılaraq əlavə tənlik kimi həll edilməsidir. Doğru cavab: C.

## Fizika (1-ci qrup) — 5 sual

### 1. Kondensatorlar — ardıcıl birləşmə və elektrik sahəsinin enerjisi [orta]

Tutumu $C_1 = 6\,\mu\text{F}$ və $C_2 = 12\,\mu\text{F}$ olan iki kondensator ardıcıl birləşdirilərək gərginliyi $U = 60\,\text{V}$ olan sabit gərginlik mənbəyinə qoşulmuşdur. Birinci kondensatorun elektrik sahəsinin enerjisini hesablayın.

- A) $10{,}8\,\text{mJ}$
- **B**) $4{,}8\,\text{mJ}$
- C) $1{,}2\,\text{mJ}$
- D) $2{,}4\,\text{mJ}$
- E) $7{,}2\,\text{mJ}$

> Ardıcıl birləşmədə ümumi elektrik tutumu aşağıdakı düsturla təyin olunur: $$C_{\text{üm}} = \dfrac{C_1 C_2}{C_1 + C_2}$$ Verilənləri yerinə yazaq: $$C_{\text{üm}} = \dfrac{6\,\mu\text{F} \cdot 12\,\mu\text{F}}{6\,\mu\text{F} + 12\,\mu\text{F}} = 4\,\mu\text{F}$$ Ardıcıl birləşmədə hər iki kondensatordan keçən yük ümumi yükə bərabərdir: $$q = q_1 = q_2 = C_{\text{üm}} U = 4\,\mu\text{F} \cdot 60\,\text{V} = 240\,\mu\text{C}$$ Birinci kondensatorun elektrik sahəsinin enerjisi: $$W_1 = \dfrac{q_1^2}{2 C_1} = \dfrac{(240 \cdot 10^{-6}\,\text{C})^2}{2 \cdot 6 \cdot 10^{-6}\,\text{F}} = 4{,}8 \cdot 10^{-3}\,\text{J} = 4{,}8\,\text{mJ}$$ Ən çox edilən səhv ümumi gərginliyin ($60\,\text{V}$) birbaşa birinci kondensatora tətbiq edilməsi və nəticədə $10{,}8\,\text{mJ}$ alınmasıdır. Doğru cavab: B.

### 2. Atom fizikası — Bor postulatları və şüalanma enerjisi [asan]

Bor nəzəriyyəsinə əsasən, hidrogen atomu enerjisi $E_4 = -0{,}85\,\text{eV}$ olan stasionar haldan enerjisi $E_2 = -3{,}4\,\text{eV}$ olan stasionar hala keçdikdə şüalandırdığı fotonun enerjisini hesablayın.

- A) $4{,}25\,\text{eV}$
- B) $1{,}70\,\text{eV}$
- C) $3{,}40\,\text{eV}$
- D) $0{,}85\,\text{eV}$
- **E**) $2{,}55\,\text{eV}$

> Borun ikinci postulatına əsasən, atom bir stasionar haldan digərinə keçdikdə şüalanan fotonun enerjisi bu səviyyələrin enerjiləri fərqinə bərabərdir: $$E_{\text{foton}} = E_k - E_n$$ Atom dördüncü səviyyədən ikinci səviyyəyə keçir: $$E_{\text{foton}} = -0{,}85\,\text{eV} - (-3{,}4\,\text{eV}) = 2{,}55\,\text{eV}$$ Doğru cavab: E.

### 3. Qüvvələr — Huk qanunu və sürtünmə qüvvəsi [orta]

Sərtliyi $k = 200\,\text{N/m}$ olan üfüqi yay kütləsi $m = 4\,\text{kq}$ olan tirəyə bərkidilmişdir. Tirə yayın təsiri altında üfüqi səth boyunca düzxətli bərabərsürətli hərəkət etdirilir. Səthlə tirə arasındakı sürtünmə əmsalı $\mu = 0{,}2$ olarsa, yayın uzanmasını hesablayın ($g = 10\,\text{m/s}^2$).

- A) $8\,\text{sm}$
- B) $10\,\text{sm}$
- C) $2\,\text{sm}$
- D) $16\,\text{sm}$
- **E**) $4\,\text{sm}$

> Tirə düzxətli bərabərsürətli hərəkət etdiyindən ona təsir edən qüvvələrin əvəzləyicisi sıfıra bərabərdir. Üfüqi istiqamətdə elastiklik qüvvəsi sürtünmə qüvvəsinə bərabər olmalıdır: $$F_{\text{elast}} = F_{\text{sürt}}$$ Huk qanununa və sürtünmə qüvvəsinin düsturuna əsasən: $$k \Delta l = \mu m g$$ Buradan uzanmanı tapaq: $$\Delta l = \dfrac{\mu m g}{k} = \dfrac{0{,}2 \cdot 4\,\text{kq} \cdot 10\,\text{m/s}^2}{200\,\text{N/m}} = \dfrac{8}{200}\,\text{m} = 0{,}04\,\text{m} = 4\,\text{sm}$$ Ən çox edilən səhv metrlə tapılan nəticənin santimetrə çevrilməsində diqqətsizlik etməkdir. Doğru cavab: E.

### 4. İmpuls — impulsun saxlanma qanunu və qeyri-elastik toqquşma [cetin]

Kütləsi $m_1 = 3\,\text{kq}$ olan kürə $v_1 = 4\,\text{m/s}$ sürətlə hərəkət edərək sükunətdə olan $m_2 = 1\,\text{kq}$ kütləli kürə ilə mütləq qeyri-elastik toqquşur. Toqquşma nəticəsində daxili enerjiyə çevrilən mexaniki enerjini hesablayın.

- A) $18\,\text{J}$
- B) $24\,\text{J}$
- **C**) $6\,\text{J}$
- D) $12\,\text{J}$
- E) $3\,\text{J}$

> Toqquşmadan əvvəl sistemin tam kinetik enerjisi yalnız birinci kürənin hərəkəti ilə bağlıdır: $$E_{k1} = \dfrac{m_1 v_1^2}{2} = \dfrac{3\,\text{kq} \cdot (4\,\text{m/s})^2}{2} = 24\,\text{J}$$ İmpulsun saxlanma qanununa əsasən, toqquşmadan sonra birləşmiş kürələrin ortaq sürəti: $$m_1 v_1 = (m_1 + m_2) u \implies u = \dfrac{m_1 v_1}{m_1 + m_2} = \dfrac{3 \cdot 4}{3 + 1} = 3\,\text{m/s}$$ Toqquşmadan sonra sistemin kinetik enerjisi: $$E_{k2} = \dfrac{(m_1 + m_2) u^2}{2} = \dfrac{4\,\text{kq} \cdot (3\,\text{m/s})^2}{2} = 18\,\text{J}$$ Daxili enerjiyə çevrilən mexaniki enerji kinetik enerjilərin fərqinə bərabərdir: $$\Delta E = E_{k1} - E_{k2} = 24\,\text{J} - 18\,\text{J} = 6\,\text{J}$$ Ən çox edilən səhv toqquşmadan sonrakı kinetik enerjini ($18\,\text{J}$) itirilən enerji kimi qəbul etməkdir. Doğru cavab: C.

### 5. Elektrostatika — elektrik sahə intensivliyi və superpozisiya prinsipi [cetin]

Vakuumda aralarındakı məsafə $d = 60\,\text{sm}$ olan iki nöqtəvi $q_1 = +8\,\text{nC}$ və $q_2 = -2\,\text{nC}$ yükü yerləşir. Bu yükləri birləşdirən düz xətt üzərində yekun elektrik sahəsinin intensivliyinin sıfıra bərabər olduğu nöqtədən $q_2$ yükünə qədər olan məsafəni hesablayın.

- **A**) $60\,\text{sm}$
- B) $30\,\text{sm}$
- C) $20\,\text{sm}$
- D) $40\,\text{sm}$
- E) $120\,\text{sm}$

> Müxtəlifişarəli yüklərin yaratdığı elektrik sahəsinin intensivlikləri yüklər arasındakı parçada eyni istiqamətə yönəldiyindən onların cəmi sıfır ola bilməz. Yekun intensivliyin sıfır olduğu nöqtə modulu kiçik olan yükün ($q_2$) xaricində, ondan $x$ məsafədə yerləşməlidir. Bu halda $q_1$-dən həmin nöqtəyə qədər olan məsafə $d + x$ olar. İntensivliklərin modulları bərabər olmalıdır: $$E_1 = E_2 \implies k \dfrac{|q_1|}{(d + x)^2} = k \dfrac{|q_2|}{x^2}$$ Yüklərin qiymətlərini yerinə yazaq: $$\dfrac{8}{(60 + x)^2} = \dfrac{2}{x^2} \implies \dfrac{4}{(60 + x)^2} = \dfrac{1}{x^2}$$ Hər iki tərəfdən kvadrat kök alsaq: $$\dfrac{2}{60 + x} = \dfrac{1}{x} \implies 2x = 60 + x \implies x = 60\,\text{sm}$$ Ən çox edilən səhv sıfır nöqtəsinin yüklərin arasında yerləşdiyini güman edib $20\,\text{sm}$ cavabını almaqdır. Doğru cavab: A.

## Kimya (1-ci qrup) — 5 sual

### 1. Karbon oksidləri və onların xassələri [orta]

$\mathrm{CO}$ və $\mathrm{CO_2}$-dən ibarət $7{,}2\,\text{q}$ qaz qarışığında cəmi $0{,}2\,\text{mol}$ maddə var. Bu qarışıq artıq miqdarda götürülmüş közərdilmiş kömür üzərindən keçirildikdə neçə litr (n.ş.) $\mathrm{CO}$ qazı alınar?
($M_r(\mathrm{CO}) = 28$, $M_r(\mathrm{CO_2}) = 44$, $V_m = 22{,}4\,\text{l/mol}$)

- A) $5{,}60$
- B) $2{,}24$
- C) $4{,}48$
- **D**) $6{,}72$
- E) $8{,}96$

> Qarışıqdakı qazların mol miqdarlarını $n(\mathrm{CO}) = x$ və $n(\mathrm{CO_2}) = y$ qəbul edək:
> $$\begin{cases} x + y = 0{,}2 \\ 28x + 44y = 7{,}2 \end{cases}$$
> Birinci tənlikdən $x = 0{,}2 - y$ əvəzləməsini aparaq:
> $$28(0{,}2 - y) + 44y = 7{,}2$$
> $$5{,}6 + 16y = 7{,}2 \implies 16y = 1{,}6 \implies y = 0{,}1\,\text{mol}\;\mathrm{CO_2}$$
> Buradan $x = 0{,}2 - 0{,}1 = 0{,}1\,\text{mol}\;\mathrm{CO}$ tapılır.
> Közərdilmiş kömürlə yalnız $\mathrm{CO_2}$ reaksiyaya daxil olur:
> $$\mathrm{CO_2 + C \xrightarrow{t^\circ} 2CO}$$
> Tənliyə əsasən $0{,}1\,\text{mol}$ $\mathrm{CO_2}$-dən $2 \times 0{,}1 = 0{,}2\,\text{mol}$ yeni $\mathrm{CO}$ əmələ gəlir.
> Reaksiyadan sonra sistemdəki $\mathrm{CO}$-nun ümumi mol miqdarı ilkin qarışıqdakı ilə birlikdə $0{,}1 + 0{,}2 = 0{,}3\,\text{mol}$ olar.
> Həcmi hesablayaq:
> $$V(\mathrm{CO}) = 0{,}3 \times 22{,}4 = 6{,}72\,\text{l}$$
> Ən çox edilən səhv yalnız reaksiyadan alınan $\mathrm{CO}$-nu hesablayıb ($4{,}48\,\text{l}$), ilkin qarışıqdakı $\mathrm{CO}$-nu unutmalarıdır.
> Doğru cavab: D.

### 2. Fosfor və onun birləşmələri [cetin]

Qələvi məhlulunda $6{,}2\,\text{q}$ ağ fosforun disproporsiyalaşması nəticəsində fosfin və kalium-hipofosfit əmələ gəlir:
$$\mathrm{P_4 + 3KOH + 3H_2O \rightarrow PH_3\uparrow + 3KH_2PO_2}$$
Alınan fosfin qazının tam yanmasına neçə litr (n.ş.) oksigen qazı sərf olunar?
($A_r(\mathrm{P}) = 31$, $V_m = 22{,}4\,\text{l/mol}$)

- A) $4{,}48$
- **B**) $2{,}24$
- C) $8{,}96$
- D) $1{,}12$
- E) $6{,}72$

> Ağ fosfor dördatomlu molekullardan ibarətdir: $M(\mathrm{P_4}) = 4 \times 31 = 124\,\text{q/mol}$.
> Reaksiyaya daxil olan $\mathrm{P_4}$-ün mol miqdarını tapaq:
> $$n(\mathrm{P_4}) = \dfrac{6{,}2}{124} = 0{,}05\,\text{mol}$$
> Birinci reaksiya tənliyinə əsasən $1\,\text{mol}$ $\mathrm{P_4}$-dən $1\,\text{mol}$ $\mathrm{PH_3}$ ayrılır:
> $$n(\mathrm{PH_3}) = 0{,}05\,\text{mol}$$
> Fosfinin yanma reaksiyasının tənliyi:
> $$\mathrm{2PH_3 + 4O_2 \rightarrow P_2O_5 + 3H_2O}$$
> Tənliyə əsasən $2\,\text{mol}$ $\mathrm{PH_3}$-ün yanmasına $4\,\text{mol}$ $\mathrm{O_2}$ sərf olunur (nisbət $1:2$).
> Tələb olunan oksigenin mol miqdarı:
> $$n(\mathrm{O_2}) = 2 \times 0{,}05 = 0{,}1\,\text{mol}$$
> Oksigenin həcmi (n.ş.):
> $$V(\mathrm{O_2}) = 0{,}1 \times 22{,}4 = 2{,}24\,\text{l}$$
> Tez-tez edilən səhv ağ fosforun formulunu sadəcə $\mathrm{P}$ qəbul edərək mol kütləsini $31\,\text{q/mol}$ götürməkdir ki, bu da yanlış $8{,}96\,\text{l}$ cavabına aparır.
> Doğru cavab: B.

### 3. Fiziki və kimyəvi hadisələr [asan]

Hansı proses kimyəvi hadisəyə aiddir?

- A) Neftdən benzin fraksiyasının ayrılması
- **B**) Dəmir qırıntılarının xlorid turşusunda həll olması
- C) Şəkər tozunun suda həll olması
- D) Kristallik yodun qızdırıldıqda sublimasiyası
- E) Maye havanın fraksiyalı distilləsi

> Fiziki hadisələrdə maddənin tərkibi dəyişmir, yalnız aqreqat halı, forması və ya həcmi dəyişir (distillə, sublimasiya, şəkərin suda fiziki həll olması). Dəmir qırıntılarının xlorid turşusunda həll olması zamanı isə kimyəvi reaksiya baş verir və yeni maddələr əmələ gəlir:
> $$\mathrm{Fe + 2HCl \rightarrow FeCl_2 + H_2\uparrow}$$
> Ona görə də bu proses kimyəvi hadisədir. Digər proseslərdə isə yeni maddə yaranmır.
> Doğru cavab: B.

### 4. Məhlullar — kristallohidratların həll olması [cetin]

Kütləsi $200\,\text{q}$ olan $10\%$-li $\mathrm{CuSO_4}$ məhluluna $50\,\text{q}$ mis(II) sulfat pentahidrat ($\mathrm{CuSO_4 \cdot 5H_2O}$) əlavə edilib tam həll edilmişdir. Alınan yeni məhlulda $\mathrm{CuSO_4}$-ün kütlə payını hesablayın.
($M_r(\mathrm{CuSO_4}) = 160$, $M_r(\mathrm{CuSO_4 \cdot 5H_2O}) = 250$)

- A) $28{,}0\%$
- B) $16{,}0\%$
- **C**) $20{,}8\%$
- D) $24{,}2\%$
- E) $26{,}0\%$

> Məhlulda həll olan maddənin kütlə payı düsturu:
> $$\omega = \dfrac{m(\text{həll olan})}{m(\text{məhlul})} \times 100\%$$
> 1. İlkin məhluldakı susuz duzun kütləsi:
> $$m_1(\mathrm{CuSO_4}) = 200 \times 0{,}10 = 20\,\text{q}$$
> 2. Əlavə edilən $50\,\text{q}$ kristallohidratdakı susuz $\mathrm{CuSO_4}$-ün kütləsi:
> $$m_2(\mathrm{CuSO_4}) = 50 \times \dfrac{160}{250} = 32\,\text{q}$$
> 3. Son məhlulda həll olan $\mathrm{CuSO_4}$-ün ümumi kütləsi:
> $$m_{\text{ümumi}}(\mathrm{CuSO_4}) = 20 + 32 = 52\,\text{q}$$
> 4. Son məhlulun ümumi kütləsi:
> $$m_{\text{ümumi}}(\text{məhlul}) = 200 + 50 = 250\,\text{q}$$
> 5. Son kütlə payı:
> $$\omega = \dfrac{52}{250} \times 100\% = 20{,}8\%$$
> Ən çox edilən səhv $50\,\text{q}$ kristallohidratın hamısını susuz duz kimi qəbul edərək $(20+50)/250 = 28{,}0\%$ tapmaqdır.
> Doğru cavab: C.

### 5. Atomun quruluşu — elektron konfiqurasiyası və dövri sistem [orta]

$\mathrm{X^{2+}}$ ionunun elektron konfiqurasiyası $\mathrm{...3d^6}$ ilə bitir. Neytral $\mathrm{X}$ atomu üçün hansı ifadələr doğrudur?
I. Sıra nömrəsi 26-dır.
II. Dövri sistemin IV dövr, VIII B qrupunda yerləşir.
III. Xarici energetik səviyyəsində 8 elektron var.

- A) yalnız I
- **B**) I və II
- C) II və III
- D) I, II və III
- E) I və III

> Element ion halına keçərkən ilk növbədə ən xarici energetik səviyyədəki elektronlarını itirir. $\mathrm{X^{2+}}$ ionunun formulu $\mathrm{1s^2 2s^2 2p^6 3s^2 3p^6 3d^6}$ olduğundan, neytral $\mathrm{X}$ atomunun elektron konfiqurasiyası:
> $$\mathrm{1s^2 2s^2 2p^6 3s^2 3p^6 3d^6 4s^2}$$
> 1. Elektronların ümumi sayı: $2 + 2 + 6 + 2 + 6 + 6 + 2 = 26$. Neytral atomda proton sayı elektron sayına bərabər olduğundan, sıra nömrəsi 26-dır (I ifadəsi doğrudur).
> 2. Baş kvant ədədinin ən böyük qiyməti $n=4$ olduğu üçün IV dövrdə yerləşir. Valent elektronları $3d^6 4s^2$ cəmi $6 + 2 = 8$ olduğu üçün VIII B əlavə yarımqrupunda yerləşir (II ifadəsi doğrudur).
> 3. Xarici energetik səviyyə dördüncü səviyyədir ($n=4$) və orada yalnız $4s^2$, yəni 2 elektron var (III ifadəsi yanlışdır; 8 sayı xarici elektronların yox, ümumi valent elektronlarının sayıdır).
> Doğru cavab: B.

## İnformatika (1-ci qrup) — 5 sual

### 1. İnformasiya təhlükəsizliyi — Antivirus proqramlarının növləri [asan]

Faylların, kataloqların və sistem sahələrinin ilkin vəziyyəti barədə məlumatı yadda saxlayan və sonrakı dəyişiklikləri nəzarət cəminə əsasən aşkar edən antivirus proqramları hansılardır?

- A) Həkimlər (Faqlar)
- **B**) Müfəttişlər (Revizorlar)
- C) Filtrlər (Keşikçilər)
- D) İmmunizatorlar (Vaksinlər)
- E) Detektorlar

> Müfəttiş (revizor) antivirus proqramları disklərin, kataloqların və faylların ilkin parametrlərini (ölçüsü, nəzarət cəmi, yaranma tarixi və s.) xüsusi bazada saxlayır və sonradan cari vəziyyətlə müqayisə edərək fayllarda baş verən dəyişiklikləri aşkar edir. Filtrlər (keşikçilər) isə əməliyyat sistemində şübhəli əməliyyatları nəzarətdə saxlayan rezident proqramlardır. Doğru cavab: B.

### 2. Verilənlər bazası — Sorğuların təhlili [orta]

Verilənlər bazasının cədvəl fraqmenti verilmişdir:

| Familiya | Qrup | İmtahan balı | Təqaüd |
| :--- | :--- | :--- | :--- | 
| Əliyev | 101 | 85 | Hə |
| Vəliyev | 102 | 92 | Hə |
| Həsənov | 101 | 68 | Yox |
| Məmmədov | 103 | 74 | Hə |
| Qasımov | 102 | 81 | Yox |
| Babayev | 101 | 95 | Hə |

Aşağıdakı məntiqi sorğu şərtini ödəyən yazıların sayını müəyyən edin:
`(Qrup = 101 OR İmtahan balı > 80) AND Təqaüd = "Hə"`

- **A**) 3
- B) 4
- C) 5
- D) 2
- E) 1

> Məntiqi şərti addım-addım hər yazı üçün yoxlayaq:
> 1. Əliyev: Qrup = 101 (Doğru), Təqaüd = «Hə» (Doğru). Şərt ödənir.
> 2. Vəliyev: Balı 92 > 80 (Doğru), Təqaüd = «Hə» (Doğru). Şərt ödənir.
> 3. Həsənov: Qrup = 101 olsa da, Təqaüd = «Yox» olduğu üçün AND əməliyyatı nəticəsində şərt ödənmir.
> 4. Məmmədov: Qrup 103 və Bal 74 olduğundan mötərizənin içi Yalan olur. Şərt ödənmir.
> 5. Qasımov: Balı 81 > 80 olsa da, Təqaüd = «Yox» olduğundan şərt ödənmir.
> 6. Babayev: Qrup = 101 (Doğru), Təqaüd = «Hə» (Doğru). Şərt ödənir.
> 
> Şərti ödəyən cəmi 3 yazı var (Əliyev, Vəliyev, Babayev). Şagirdlərin ən çox etdiyi səhv OR və AND əməliyyatlarının prioritetini qarışdırmaq və ya Təqaüd sahəsinin Yox qiymətini nəzərdən qaçırmaqdır. Doğru cavab: A.

### 3. İnformasiyanın kodlaşdırılması — Rastr qrafika [cetin]

Ölçüsü $512 \times 256$ piksel olan və 256 rəng çalarına malik təsvirlə ölçüsü $1024 \times 512$ piksel olan və 16 rəng çalarına malik digər təsvir birlikdə arxivləşdirilir. Arxivləşdirmə nəticəsində faylların ümumi həcmi $25\%$ azalarsa, sıxılmış arxiv faylının həcmini kilobaytla (KB) hesablayın.

- A) 192
- B) 576
- C) 144
- D) 384
- **E**) 288

> Rastr təsvirin həcmi piksel sayı ilə bir pikselin rəng dərinliyinin hasilinə bərabərdir:
> $$V = K_x \cdot K_y \cdot i$$
> 1. Birinci təsvir üçün: $N_1 = 256 = 2^8$ olduğundan bir piksel $i_1 = 8\,\text{bit} = 1\,\text{bayt}$ təşkil edir.
> $$V_1 = 512 \times 256 \times 1\,\text{bayt} = 2^9 \times 2^8 = 2^{17}\,\text{bayt} = \dfrac{2^{17}}{2^{10}}\,\text{KB} = 128\,\text{KB}$$
> 2. İkinci təsvir üçün: $N_2 = 16 = 2^4$ olduğundan bir piksel $i_2 = 4\,\text{bit} = 0{,}5\,\text{bayt}$ təşkil edir.
> $$V_2 = 1024 \times 512 \times 0{,}5\,\text{bayt} = 2^{10} \times 2^9 \times 2^{-1} = 2^{18}\,\text{bayt} = \dfrac{2^{18}}{2^{10}}\,\text{KB} = 256\,\text{KB}$$
> 3. İlkin ümumi həcm: $V_{\text{cəm}} = 128\,\text{KB} + 256\,\text{KB} = 384\,\text{KB}$.
> 4. Həcm $25\%$ azaldıqdan sonra arxiv faylının həcmi:
> $$V_{\text{arxiv}} = 384 \times (1 - 0{,}25) = 384 \times 0{,}75 = 288\,\text{KB}$$
> Doğru cavab: E.

### 4. Təqdimatlar — MS PowerPoint interfeysi və nümayiş [asan]

MS PowerPoint proqramında slaydların nümayişini birinci slayddan deyil, cari slayddan başlatmaq üçün hansı klaviatura qısayolundan istifadə olunur?

- A) Ctrl + F5
- B) Alt + F5
- C) F5
- **D**) Shift + F5
- E) F4

> MS PowerPoint proqramında təqdimatı birinci slayddan başlatmaq üçün F5 düyməsi, məhz cari (ekranda seçilmiş) slayddan nümayiş rejiminə keçmək üçün isə Shift + F5 düymələr kombinasiyası istifadə olunur. Doğru cavab: D.

### 5. Kompüter şəbəkələri — Ötürmə sürəti üzrə hesablamalar [cetin]

Həcmi $45\,\text{Mbayt}$ olan fayl ötürmə sürəti $16\,\text{Mbit/san}$ olan rabitə kanalı vasitəsilə ötürülür. Şəbəkədəki yüklənmə səbəbindən faktiki ötürmə sürəti $25\%$ azalarsa, bu faylın tam ötürülməsinə neçə saniyə vaxt sərf olunar?

- **A**) 30
- B) 36
- C) 40
- D) 18
- E) 22{,}5

> Ötürmə müddəti faylın həcminin rabitə kanalının faktiki ötürmə sürətinə nisbəti ilə tapılır:
> $$t = \dfrac{V}{v}$$
> 1. Faylın həcmini meqabitə çevirək ($1\,\text{bayt} = 8\,\text{bit}$):
> $$V = 45\,\text{Mbayt} = 45 \times 8\,\text{Mbit} = 360\,\text{Mbit}$$
> 2. Faktiki sürət nominal sürətdən $25\%$ azdır:
> $$v = 16\,\text{Mbit/san} \times (1 - 0{,}25) = 16 \times 0{,}75 = 12\,\text{Mbit/san}$$
> 3. Tələb olunan zaman:
> $$t = \dfrac{360\,\text{Mbit}}{12\,\text{Mbit/san}} = 30\,\text{saniyə}$$
> Ən çox edilən səhv Mbayt vahidini Mbit vahidinə çevirmədən birbaşa bölmə aparmaqdır. Doğru cavab: A.

## Azərbaycan dili (1-ci qrup) — 5 sual

### 1. Zərf və onun məna növləri [orta]

Hansı cümlədə zərfin iki fərqli məna növü işlənmişdir?

- A) O, dünənki söhbəti xatırlayıb cəld otaqdan çıxdı.
- **B**) Qonaq bayaq gələrək fikrini ucadan bildirdi.
- C) Qatar gecikəndə hamı narahatlıqla gözləməyə başladı.
- D) Uşaqlar qaça-qaça irəli getdilər.
- E) Dostum səhər tezdən oyanıb dərslərini oxudu.

> Cümlədə zərfin fərqli məna növlərinin işlənməsi təhlil edilir:
> «Qonaq bayaq gələrək fikrini ucadan bildirdi» cümləsində «bayaq» zaman zərfi, «ucadan» isə tərzi-hərəkət zərfidir. Beləliklə, cümlədə zərfin iki fərqli məna növü işlənmişdir.
> «dünənki söhbəti...» cümləsindəki «dünənki» sözü zərf deyil, zərfdən düzəlmiş sifətdir; «qaça-qaça» və «gecikəndə» sözləri isə zərf deyil, feli bağlamadır. «səhər tezdən» birləşməsi isə mürəkkəb söz kimi yalnız bir məna növünə (zaman zərfinə) aiddir.
> Doğru cavab: B.

### 2. Vasitəsiz və vasitəli nitq — durğu işarələri [cetin]

Hansı cümlədə durğu işarələri «V, – m, – v.» sxeminə uyğundur? (Durğu işarələri buraxılmışdır)

- A) Dərslərinizə yaxşı hazırlaşın dedi müəllim imtahan yaxınlaşır
- **B**) Bu kitablar dedi müəllim sizin üçün gətirilib
- C) Mən sabah gələcəyəm dedi qonaq siz hazırlaşın
- D) Bu işi kim görüb deyə o soruşdu dərhal cavab verin
- E) Biz qalib gəldik qışqırdı əsgər düşmən geri çəkildi

> Vasitəsiz nitq müəllif sözləri ilə parçalandıqda durğu işarələrinin işlənmə qaydası:
> Vasitəsiz nitqin birinci hissəsi bitməmiş cümlə olduqda, həmin hissədən sonra vergül və tire, müəllif sözlərindən sonra vergül və tire qoyulur və vasitəsiz nitqin ikinci hissəsi kiçik hərflə davam edir: «V, – m, – v.»
> «Bu kitablar dedi müəllim sizin üçün gətirilib» cümləsində vasitəsiz nitq bütöv bir sadə cümlədir və müəllif sözləri onun arasına daxil olmuşdur: «Bu kitablar, – dedi müəllim, – sizin üçün gətirilib.»
> Birinci hissəsi bitmiş cümlə olan digər nümunələrdə isə müəllif sözlərindən sonra nöqtə və tire qoyulmalı, ikinci hissə böyük hərflə başlamalıdır («V, – m. – V.»).
> Doğru cavab: B.

### 3. Sadə cümlənin şəxsə görə növləri — şəxssiz cümlə [orta]

Şəxssiz cümləni müəyyən edin.

- A) Sabahkı tədbir üçün xeyli hazırlıq görüldü.
- B) Kəndə çatanda artıq qaranlıq düşmüşdü.
- **C**) Bu məsələyə iclasda yenidən baxıldı.
- D) Görüləcək işləri vaxtında yerinə yetirməlidir.
- E) Bu barədə ona dünən axşam xəbər verdilər.

> Sadə cümlənin şəxsə görə növlərinin təyini qaydası:
> Şəxssiz cümlələrdə mübtəda olmur və onun bərpası qeyri-mümkündür. Belə cümlələrin xəbəri III şəxsin təkində olur və adətən şəxssiz növdə olan fel ilə ifadə edilir.
> «Bu məsələyə iclasda yenidən baxıldı» cümləsində xəbər «baxıldı» felidir, cümlədə mübtəda yoxdur və onu bərpa etmək mümkün deyil.
> Digər variantlarda: «qaranlıq düşmüşdü» və «hazırlıq görüldü» cümlələrində qrammatik mübtəda («qaranlıq», «hazırlıq») mövcuddur; «xəbər verdilər» qeyri-müəyyən şəxsli, «yerinə yetirməlidir» isə mübtədası buraxılmış müəyyən şəxsli cümlədir.
> Doğru cavab: C.

### 4. Leksika — omonimlər [asan]

Bütün tayları eyni nitq hissəsinə aid olan omonim sözlər cərgəsini müəyyən edin.

- A) sarı, dolu, kök
- B) çay, biz, qaz
- **C**) aşıq, bəbək, əqrəb
- D) yaz, din, boya
- E) şiş, daraq, daxma

> Omonimlərin leksik-qrammatik xüsusiyyətləri:
> Omonimlər həm eyni, həm də müxtəlif nitq hissələrinə aid ola bilər.
> «aşıq, bəbək, əqrəb» cərgəsindəki hər bir sözün bütün omonim tayları yalnız isimdir:
> - «aşıq»: oynaq sümüyü (isim) və saz ifaçısı olan sənətkar (isim);
> - «bəbək»: göz bəbəyi (isim) və körpə uşaq (isim);
> - «əqrəb»: buğumayaqlı zəhərli heyvan (isim) və saatın əqrəbi (isim).
> Digər variantlarda verilən sözlərin tayları fərqli nitq hissələrinə aiddir: «sarı» (sifət, fel, qoşma), «kök» (isim, sifət), «yaz» (isim, fel), «biz» (əvəzlik, isim), «qaz» (isim, fel).
> Doğru cavab: C.

### 5. Üslubiyyat və nitq mədəniyyəti — elmi üslub [cetin]

Mətni oxuyun və onun xüsusiyyətləri ilə bağlı doğru fikirləri müəyyən edin:

«Torpaqşünaslıq tədqiqatları göstərir ki, Kür-Araz ovalığında torpaqların şoranlaşmasının əsas səbəbi qrunt sularının səviyyəsinin qalxması və arid iqlim şəraitində səthdən buxarlanmanın intensiv getməsidir. Minerallaşmış yeraltı suların kapilyar borucuqlar vasitəsilə torpağın üst qatına doğru hərəkəti duz qalıqlarının toplanmasına zəmin yaradır. Aqrotexniki və meliorativ tədbirlərin sistemli aparılması, xüsusən kollektor-drenaj şəbəkələrinin qurulması bu təbii prosesin mənfi təsirlərini minimuma endirməyə imkan verir.»

I. Fikirlər elmi üslubun tələblərinə uyğun olaraq dəqiq və məntiqi ardıcıllıqla ifadə edilmişdir.
II. Mətndə həm ümumişlək sözlərə, həm də sahəvi terminlərə yer verilmişdir.
III. Obrazlılığı təmin etmək üçün bədii təsvir vasitələrindən geniş istifadə olunmuşdur.
IV. Dil vahidləri əsasən məişət üslubunun normalarına uyğun seçilmişdir.
V. Xəbərlər əsasən felin xəbər şəklindədir və fikrin bitkinliyini təmin edir.

- A) II, III, V
- **B**) I, II, V
- C) I, III, IV
- D) I, IV
- E) II, IV, V

> Mətnin funksional üslub xüsusiyyətlərinin təhlili:
> Təqdim olunan mətn elmi üslubdadır.
> I fikir doğrudur: elmi üslub üçün ardıcıllıq, məntiqilik və fikir dəqiqliyi əsas şərtdir.
> II fikir doğrudur: mətndə «torpaq», «səbəb», «təbii» kimi ümumişlək sözlərlə yanaşı, «arid», «meliorativ», «qrunt suları», «kollektor-drenaj» kimi ixtisas terminləri işlənmişdir.
> V fikir doğrudur: cümlələrin xəbərləri («göstərir», «zəmin yaradır», «imkan verir») felin xəbər şəklində işlənərək elmi məlumatın dəqiq və bitkin çatdırılmasını təmin edir.
> III və IV fikirlər isə yanlışdır: mətndə poetik obrazlılıq (bədii təsvir vasitələri) və məişət üslubuna aid canlı danışıq elementləri yoxdur.
> Doğru cavab: B.

## Xarici dil (1-ci qrup) — 5 sual

### 1. Vocabulary — Commonly confused words (raise / rise) [orta]

Choose the correct words to complete the sentence.

The government decided to ___ taxes on luxury goods, which caused prices to ___ rapidly.

- A) rise, raise
- B) rise, rise
- **C**) raise, rise
- D) raise, raise
- E) arise, raise

> "raise" feli təsirli feldir (transitive), yəni özündən sonra tamamlıq tələb edir ("taxes" tamamlıqdır: vergiləri artırmaq/qaldırmaq). "rise" feli isə təsirsiz feldir (intransitive), tamamlıq tələb etmir və mübtədanın özünün qalxmasını, artmasını bildirir ("prices rise" — qiymətlər qalxır). "arise" feli isə "meydana çıxmaq, baş vermək" mənasındadır.
> İngilis dilində nümunə:
> The shop raised its prices, and living costs rose quickly.
> Doğru cavab: C.

### 2. Conditional sentences — Mixed Conditionals [cetin]

Choose the correct verb forms to complete the sentence.

If Mark ___ his alarm clock last night, he ___ late for the interview right now.

- A) has set, won't be
- B) would set, isn't
- C) had set, wouldn't have been
- D) set, wouldn't have been
- **E**) had set, wouldn't be

> Bu cümlə qarışıq şərt budaq cümləsidir (Mixed Conditional: Type 3 + Type 2). Budaq cümlədəki "last night" zaman zərfi keçmişdə baş verməyən hərəkəti bildirdiyi üçün Past Perfect ("had set") işlənir. Baş cümlədəki "right now" isə həmin keçmiş hərəkətin indiki zamandakı nəticəsini göstərdiyi üçün "wouldn't + sadə fel" ("wouldn't be") tələb olunur.
> Ən çox edilən səhv: "last night" ifadəsinə aldanaraq hər iki tərəfi III tip şərt kimi düşünüb "had set, wouldn't have been" variantını seçməkdir; lakin baş cümlədəki "right now" nəticənin indiyə aid olduğunu qəti şəkildə müəyyən edir.
> İngilis dilində nümunə:
> If you had taken the medicine yesterday, you wouldn't feel sick today.
> Doğru cavab: E.

### 3. Word formation — Suffixes forming nouns [asan]

Choose the line of words that form nouns with the suffix "-ment".

- A) child, friend, member
- B) bright, weak, kind
- C) attract, discuss, direct
- D) free, king, wise
- **E**) agree, entertain, govern

> "-ment" şəkilçisi fellərə qoşularaq hərəkətin nəticəsini və ya prosesi bildirən isimlər düzəldir:
> agree (razılaşmaq) → agreement (razılaşma)
> entertain (əyləndirmək) → entertainment (əyləncə)
> govern (idarə etmək) → government (hökumət)
> Digər variantlardakı sözlər fərqli şəkilçilərlə isim yaradır: "attract, discuss, direct" felləri "-tion / -sion" şəkilçisi (attraction, discussion, direction); "bright, weak, kind" sifətləri "-ness" şəkilçisi (brightness, weakness, kindness); "child, friend, member" sözləri "-hood / -ship" şəkilçisi; "free, king, wise" sözləri isə "-dom" şəkilçisi (freedom, kingdom, wisdom) qəbul edir.
> Doğru cavab: E.

### 4. Modal verbs — Modals with Perfect Infinitive [cetin]

Choose the correct modal verb to complete the sentence.

Thomas ___ about the surprise party in advance; otherwise, he wouldn't have looked so genuinely shocked when we turned on the lights.

- A) should have known
- B) needn't have known
- **C**) can't have known
- D) could know
- E) must have known

> Keçmişdə baş vermiş hadisəyə dair qəti inkar ehtimal və ya məntiqi nəticə (qeyri-mümkünlük) bildirmək üçün "can't + have + V3" (Perfect Infinitive) quruluşu işlədilir. Cümlədəki "əks halda işıqları yandıranda bu qədər səmimi şəkildə təəccüblənməzdi" ifadəsi göstərir ki, Tomasın sürprizdən xəbərdar olması qeyri-mümkün idi ("can't have known").
> "must have known" təsdiq nəticə ("yəqin ki, bilirdi") bildirərək kontekstə ziddir. "should have known" keçmişdə yerinə yetirilməyən borc və ya tənqid ("bilməli idi"), "needn't have known" isə ehtiyacın olmadığını bildirir.
> İngilis dilində nümunə:
> He can't have stolen the money because he was abroad at that time.
> Doğru cavab: C.

### 5. Future forms — Future Perfect and time clauses [orta]

Choose the correct tense forms to complete the sentence.

By the time the scientific expedition ___ the base camp next month, they ___ more than five hundred miles across the desert.

- A) has reached, will be covering
- B) reached, had covered
- **C**) reaches, will have covered
- D) reaches, will cover
- E) will reach, will cover

> Zaman budaq cümlələrində ("by the time", "when", "as soon as") gələcək zamana aid hərəkət olsa belə, "will" işlədilmir və onun əvəzinə İndiki Sadə zaman (Present Simple: "reaches") işlənir.
> "By the time + Present Simple" quruluşu gələcəkdə müəyyən bir vaxta qədər tamamlanacaq hərəkəti bildirdiyi üçün baş cümlədə Gələcək Bitmiş zaman (Future Perfect: "will have + V3" → "will have covered") tələb olunur.
> Ən çox edilən səhv: "next month" zaman zərfini görüb budaq cümlədə də "will reach" işlətməkdir; lakin zaman bağlayıcılarından sonra gələcək zaman forması işlənmir.
> İngilis dilində nümunə:
> By the time she graduates next year, she will have written two books.
> Doğru cavab: C.

## Tarix (2-ci qrup) — 5 sual

### 1. Nadir şah Əfşar və Əfşarlar dövləti [cetin]

Nadir şah Əfşarın hakimiyyəti dövrünə aid hadisələrin xronoloji ardıcıllığını müəyyən edin:
1. Qars yaxınlığında Osmanlı qoşunlarının darmadağın edilməsi
2. Hindistana yürüşün başlanması
3. Bağdad müqaviləsinin imzalanması
4. Suqovuşanda Muğan qurultayının keçirilməsi

- A) 3, 2, 4, 1
- B) 4, 1, 2
- **C**) 4, 2, 1
- D) 4, 2, 3, 1
- E) 3, 4, 2, 1

> Nadirin şahlıq dövrü 1736-cı ildə Muğan qurultayı ilə başlayır və 1747-ci ilə qədər davam edir. Verilmiş hadisələrin tarixləri: 1. Qars yaxınlığında döyüş — 1745-ci il; 2. Hindistana yürüş — 1738–1739-cu illər; 4. Muğan qurultayı — 1736-cı il. 3-cü bənddəki Bağdad müqaviləsi isə 1733-cü ildə Nadir hələ sərkərdə və qəyyum olduğu dövrdə imzalanmışdır, yəni şahlıq dövrünə aid deyil. Beləliklə, şahlıq dövrünə aid hadisələrin düzgün xronoloji ardıcıllığı 4, 2, 1 olur. Ən çox edilən səhv Bağdad müqaviləsini (1733) Nadirin şahlıq dövrünə daxil etməkdir. Doğru cavab: C.

### 2. İkinci Dünya müharibəsi illərində Azərbaycan [asan]

İkinci Dünya müharibəsi illərində Sovet İttifaqı Qəhrəmanı adına iki dəfə layiq görülmüş azərbaycanlı hərbçini müəyyən edin.

- A) Gəray Əsədov
- B) İsrafil Məmmədov
- C) Mehdi Hüseynzadə
- **D**) Həzi Aslanov
- E) Ziya Bünyadov

> İkinci Dünya müharibəsi illərində göstərdiyi igidliyə görə tank qoşunları general-mayoru Həzi Aslanov iki dəfə (1942 və 1991-ci ildə rəsmiləşdirilmiş) Sovet İttifaqı Qəhrəmanı adına layiq görülmüş yeganə azərbaycanlıdır. İsrafil Məmmədov bu adı almış ilk azərbaycanlıdır (1941-ci il), lakin bir dəfə almışdır. Mehdi Hüseynzadə isə partizan hərəkatındakı qəhrəmanlığına görə ölümündən sonra (1957-ci il) bu ada layiq görülmüşdür. Doğru cavab: D.

### 3. Daş dövrü və ibtidai icma quruluşu [orta]

Azərbaycan ərazisində ibtidai icma quruluşuna aid uyğunluğu müəyyən edin:
1. Orta Paleolit
2. Mezolit
3. Eneolit
a. İstehlak təsərrüfatından istehsal təsərrüfatına keçidin əsasının qoyulması
b. İlk metalın (misin) kəşf edilməsi
c. Neandertal tipli insanın yaranması
d. Toxa əkinçiliyinin xış əkinçiliyi ilə əvəz olunması

- A) 1 – c, 2 – d, 3 – a
- B) 1 – b, 2 – a, 3 – d
- C) 1 – c, 2 – b, 3 – d
- **D**) 1 – c, 2 – a, 3 – b
- E) 1 – a, 2 – c, 3 – b

> Orta Paleolit (Mustye mədəniyyəti) dövründə ibtidai insan fiziki cəhətdən inkişaf edərək neandertal tipli insana çevrilmişdir (1 – c). Mezolit dövründə ox və kaman ixtira edilmiş, heyvanların əhliləşdirilməsinə və ibtidai əkinçiliyə başlanmış, bununla da istehlakdan istehsala keçidin əsası qoyulmuşdur (2 – a). Eneolit (mis-daş) dövründə insanlar ilk dəfə metallan — misdən istifadə etməyə başlamışlar (3 – b). Toxa əkinçiliyinin xış əkinçiliyi ilə əvəzlənməsi isə Erkən Tunc dövrünə aiddir və heç birinə uyğun gəlmir. Beləliklə: 1 – c, 2 – a, 3 – b. Doğru cavab: D.

### 4. IX–XI əsrlərdə Azərbaycan dövlətləri: Şəddadilər və Rəvvadilər [orta]

IX–XI əsrlərdə mövcud olmuş Şəddadilər və Rəvvadilər dövlətlərinin tarixinə aid ümumi cəhəti müəyyən edin.

- A) Slavyanların Bərdəyə yürüşünün qarşısını almaları
- B) Dərbənd əmirliyini özlərindən asılı vəziyyətə salmaları
- C) Bütün Azərbaycan torpaqlarını vahid dövlətdə birləşdirmələri
- D) Paytaxtlarının Təbriz şəhəri olması
- **E**) Səlcuq türklərinin yürüşlərinə məruz qalmaları

> XI əsrin ortalarından başlayaraq Böyük Səlcuq imperiyasının qərbə yürüşləri nəticəsində həm Şəddadilər (1054-cü ildə tabe edilmiş), həm də Rəvvadilər (1054-cü ildə tabe edilmiş) səlcuqlardan asılı vəziyyətə düşmüş, sonradan onlar tərəfindən süquta uğradılmışdır. Təbriz şəhəri yalnız Rəvvadilərin paytaxtı idi (Şəddadilərin mərkəzi Gəncə olmuşdur). Dərbənd əmirliyini asılı salmaq Şəddadilərə xas idi. Bütün Azərbaycan torpaqlarını vahid dövlətdə birləşdirmək isə Sacilər və Salarilərə aiddir. Doğru cavab: E.

### 5. XIX əsrin II yarısı – XX əsrin əvvəlində ictimai-siyasi və mədəni həyat [orta]

1905–1907-ci illər inqilabı dövründə Şimali Azərbaycanda baş vermiş hadisələrlə bağlı verilənlərdən hansı səhvdir?

- A) Milli qüvvələrin erməni terroruna qarşı müdafiəsi məqsədilə «Difai» təşkilatı yaradıldı.
- B) I Dövlət Dumasına Şimali Azərbaycandan azərbaycanlı deputatlar seçildi.
- **C**) Həsən bəy Zərdabinin redaktorluğu ilə «Əkinçi» qəzetinin nəşrinə başlandı.
- D) Əlimərdan bəy Topçubaşovun rəhbərliyi ilə Ümumrusiya müsəlmanlarının I qurultayı keçirildi.
- E) Bakıda fəhlələrin hüquqlarını müdafiə edən «Müsəlman qrupu» təşkil olundu.

> Həsən bəy Zərdabinin redaktorluğu ilə «Əkinçi» qəzeti 1875–1877-ci illərdə nəşr olunmuş və Azərbaycan milli mətbuatının əsasını qoymuşdur. Bu hadisə 1905–1907-ci illər inqilabından xeyli əvvələ — XIX əsrin 70-ci illərinə aiddir. Digər hadisələr isə birbaşa 1905–1907-ci illər inqilabı dövrünə təsadüf edir: «Difai» partiyası 1906-cı ildə Gəncədə yaradılmış, Ümumrusiya müsəlmanlarının qurultayları 1905–1906-cı illərdə təşkil edilmiş, I Dövlət Duması 1906-cı ildə fəaliyyət göstərmişdir. Doğru cavab: C.

## Coğrafiya (2-ci qrup) — 5 sual

### 1. Litosfer plitələrinin hərəkəti və relyef [orta]

Litosfer plitələrinin sərhəd tipləri və onların qovuşmasında yaranan relyef formaları arasındakı uyğunluğu müəyyən edin:
1. Qitə və okean tipli plitələrin toqquşması (subduksiya)
2. İki qitə tipli plitənin toqquşması (kolliziya)
3. İki okean tipli plitənin aralanması (divergent)

a. Peru-Çili dərin okean novu və And dağları
b. Himalay dağları və Tibet yaylası
c. Orta Atlantika silsiləsi və rift dərələri

- A) 1 – a, 2 – c, 3 – b
- B) 1 – b, 2 – a, 3 – c
- **C**) 1 – a, 2 – b, 3 – c
- D) 1 – b, 2 – c, 3 – a
- E) 1 – c, 2 – a, 3 – b

> Litosfer plitələrinin qarşılıqlı hərəkəti nəticəsində müxtəlif relyef formaları yaranır:
> 1. Okean və qitə tipli plitələrin toqquşması (subduksiya zonası) zamanı okean tavası qitə tavasının altına daxil olur; nəticədə dərin okean novları və qitənin kənarında qırışıq dağlar əmələ gəlir (Naska və Cənubi Amerika plitələrinin toqquşmasında Peru-Çili novu və And dağları: 1 – a).
> 2. İki qitə tipli plitənin toqquşması (kolliziya zonası) güclü qırışıqlığa və nəhəng dağ sistemlərinin formalaşmasına səbəb olur (Hindistan-Avstraliya və Avrasiya plitələrinin toqquşmasında Himalay dağları və Tibet yaylası: 2 – b).
> 3. Okean tipli plitələrin bir-birindən aralanması (divergent zonası) nəticəsində mantiyadan qalxan maddələr hesabına sualtı dağ silsilələri və rift dərələri yaranır (Orta Atlantika silsiləsi: 3 – c).
> Beləliklə, düzgün uyğunluq 1 – a, 2 – b, 3 – c şəklindədir. Doğru cavab: C.

### 2. Elektroenergetika sənayesi [orta]

Elektrik enerjisi istehsalında su elektrik stansiyalarının (SES) üstünlük təşkil etdiyi ölkələri müəyyən edin:
1. Norveç
2. Fransa
3. Braziliya
4. Polşa
5. Tacikistan
6. CAR

- A) 3, 5, 6
- B) 1, 2, 4
- C) 1, 4, 5
- **D**) 1, 3, 5
- E) 2, 4, 6

> Ölkələrin elektroenergetika strukturunu təhlil edək:
> - Norveç dağ relyefi və bol sulu çayları hesabına elektrik enerjisinin $95\%$-dən çoxunu SES-lərdə istehsal edir.
> - Braziliya zəngin hidroenerji potensialına malikdir və istehsal olunan elektrik enerjisinin $65\%$-dən çoxu SES-lərin payına düşür (məsələn, İtaypu SES).
> - Tacikistanda dağ çaylarının böyük hidroenerji potensialı sayəsində elektrik enerjisinin $90\%$-dən çoxu SES-lərdə (Nurek və s.) əldə edilir.
> Fransada elektrik enerjisi istehsalında atom elektrik stansiyaları (AES, təxminən $70\%$), Polşa və CAR-da isə zəngin yerli kömür ehtiyatlarına əsaslanan istilik elektrik stansiyaları (İES) üstünlük təşkil edir. Deməli, SES-lərin üstünlük təşkil etdiyi ölkələr 1, 3 və 5-dir. Doğru cavab: D.

### 3. Temperatur və atmosfer təzyiqinin hündürlüklə dəyişməsi [cetin]

Dağın ətəyində mütləq hündürlük $200\,\text{m}$, havanın temperaturu $+18^\circ\text{C}$ və atmosfer təzyiqi $740\,\text{mm}\text{ c.st.}$-dir. Havanın temperaturunun hər $100\,\text{m}$-də $0{,}6^\circ\text{C}$, atmosfer təzyiqinin isə hər $10\,\text{m}$-də $1\,\text{mm}\text{ c.st.}$ azaldığını nəzərə alaraq, zirvədə atmosfer təzyiqi $490\,\text{mm}\text{ c.st.}$ olarsa, zirvənin mütləq hündürlüyünü və oradakı havanın temperaturunu müəyyən edin.

- A) $2500\,\text{m}$; $+3^\circ\text{C}$
- B) $2500\,\text{m}$; $+5^\circ\text{C}$
- C) $2700\,\text{m}$; $-3^\circ\text{C}$
- **D**) $2700\,\text{m}$; $+3^\circ\text{C}$
- E) $2900\,\text{m}$; $0^\circ\text{C}$

> Məsələnin həlli ardıcıl addımlarla yerinə yetirilir:
> 1. Ətək ilə zirvə arasındakı atmosfer təzyiqi fərqi:
> $$\Delta P = 740\,\text{mm}\text{ c.st.} - 490\,\text{mm}\text{ c.st.} = 250\,\text{mm}\text{ c.st. Toolbar}$$Hər $10\,\text{m}$-də təzyiq $1\,\text{mm}\text{ c.st.}$ azaldığından, dağın nisbi hündürlüyü:
> $$\Delta h = 250 \times 10\,\text{m} = 2500\,\text{m}$$
> 2. Zirvənin mütləq hündürlüyü ətəyin mütləq hündürlüyü ilə nisbi hündürlüyün cəminə bərabərdir:
> $$h_{\text{zirvə}} = 200\,\text{m} + 2500\,\text{m} = 2700\,\text{m}$$
> 3. $2500\,\text{m}$ hündürlük fərqində temperaturun azalması:
> $$\Delta T = \dfrac{2500\,\text{m}}{100\,\text{m}} \times 0{,}6^\circ\text{C} = 25 \times 0{,}6^\circ\text{C} = 15^\circ\text{C}$$
> 4. Zirvədəki havanın temperaturu:
> $$T_{\text{zirvə}} = +18^\circ\text{C} - 15^\circ\text{C} = +3^\circ\text{C}$$
> Ən çox edilən səhv nisbi hündürlüyü ($2500\,\text{m}$) birbaşa zirvənin mütləq hündürlüyü kimi qəbul etməkdir. Doğru cavab: D.

### 4. Dövlət idarəetmə formaları [asan]

Yalnız monarxiya idarəetmə formasına malik olan Avropa dövlətlərinin cərgəsini müəyyən edin.

- A) Portuqaliya, Belçika, İsveç, Lüksemburq
- B) İsveç, Danimarka, Niderland, Finlandiya
- **C**) Böyük Britaniya, İspaniya, Belçika, Norveç
- D) Norveç, İspaniya, İtaliya, Monako
- E) İsveçrə, Böyük Britaniya, Danimarka, Andorra

> Avropada mövcud olan monarxiya dövlətləri: Böyük Britaniya, İspaniya, Belçika, Niderland, Danimarka, Norveç, İsveç, Lüksemburq, Monako, Lixtenşteyn, Andorra və Vatikandır. Təqdim olunan variantları təhlil edək:
> - Böyük Britaniya, İspaniya, Belçika və Norveç dövlətlərinin hamısı konstitusiyalı monarxiyadır (krallıqdır).
> - Digər variantlardakı Finlandiya, İtaliya, Portuqaliya və İsveçrə respublika idarəetmə formasına malikdir. Doğru cavab: C.

### 5. Təbii ehtiyatlar və resurs təminatlığı [cetin]

Ölkənin $60\,\text{milyard}\text{ m}^3$ təbii qaz ehtiyatı var. İllik hasilat $3\,\text{milyard}\text{ m}^3$, əhalinin sayı isə $10\,\text{milyon}\text{ nəfər}$-dir. İllik hasilatın həcmi $25\%$ artırılarsa, qaz ehtiyatı ilə təminatlıq müddətinin neçə il azalacağını və mövcud ehtiyat əsasında adambaşına düşən təbii qazın həcmini müəyyən edin.

- **A**) $4\,\text{il}$ və $6000\,\text{m}^3$
- B) $4\,\text{il}$ və $600\,\text{m}^3$
- C) $16\,\text{il}$ və $600\,\text{m}^3$
- D) $5\,\text{il}$ və $6000\,\text{m}^3$
- E) $16\,\text{il}$ və $6000\,\text{m}^3$

> Təbii ehtiyatlarla təminatlıq düsturu:
> $$E = \dfrac{\text{Ehtiyatın həcmi}}{\text{İllik hasilat}}$$
> 1. İlkin illik hasilatla təminatlıq müddəti:
> $$T_1 = \dfrac{60\,\text{milyard}\text{ m}^3}{3\,\text{milyard}\text{ m}^3/\text{il}} = 20\,\text{il}$$
> 2. Hasilat $25\%$ artırıldıqdan sonra yeni illik hasilat:
> $$H_2 = 3 + 3 \times 0{,}25 = 3{,}75\,\text{milyard}\text{ m}^3/\text{il}$$
> 3. Yeni hasilat səviyyəsində təminatlıq müddəti:
> $$T_2 = \dfrac{60\,\text{milyard}\text{ m}^3}{3{,}75\,\text{milyard}\text{ m}^3/\text{il}} = 16\,\text{il}$$
> 4. Təminatlıq müddətinin azalması:
> $$\Delta T = T_1 - T_2 = 20\,\text{il} - 16\,\text{il} = 4\,\text{il}$$
> 5. Adambaşına düşən təbii qaz ehtiyatı ($60\,\text{milyard}\text{ m}^3 = 60\,000\,\text{milyon}\text{ m}^3$):
> $$e_{\text{adambaşı}} = \dfrac{60\,000\,\text{milyon}\text{ m}^3}{10\,\text{milyon}\text{ nəfər}} = 6000\,\text{m}^3/\text{nəfər}$$
> Ən çox edilən səhv təminatlıq müddətinin azalması fərqini deyil, yeni təminatlıq müddətini ($16\,\text{il}$) cavab kimi qəbul etməkdir. Doğru cavab: A.

## Ədəbiyyat (3-ci qrup) — 5 sual

### 1. Cəlil Məmmədquluzadə — «Anamın kitabı» tragikomediyası [orta]

Cəlil Məmmədquluzadənin «Anamın kitabı» pyesindəki obrazlarla bağlı fikirlərdən hansı yanlışdır?

- **A**) Qardaşlar ananın vəsiyyəti olan kitabı birlikdə oxuyub dərhal səhvlərini başa düşür və birləşirlər.
- B) Rüstəm bəy rus meyilinin, Mirzə Məhəmmədəli ərəb-fars, Səməd Vahid isə Osmanlı meyilinin daşıyıcısıdır.
- C) Zəhrabəyim qardaşların milli dil və mənəviyyatdan uzaqlaşmasına dözə bilməyib nəsihətamiz çıxışlar edir.
- D) Gülbahar qardaşlarının xaricdən gətirdiyi yad ideyaların milli köklərə zidd olduğunu anlayır.
- E) Əsərdə dil və mədəniyyət birliyi ideyası milli istiqlalın əsası kimi irəli sürülür.

> Əsərin sonunda Gülbahar anasının vəsiyyət etdiyi kitabı oxuyur və qardaşlarının yad təsirlərə qapılması nəticəsində yaranan faciəni üzlərinə vurur. Qardaşlar dərhal birləşib səhvlərini düzəltmirlər; əksinə, onların mənəvi böhranı və ananın ölümü ilə nəticələnən faciəvi sonluq təsvir olunur. Ən çox edilən səhv əsərin nikbin, dərhal barışıqla bitdiyini düşünməkdir. Doğru cavab: A.

### 2. Məhəmməd Füzuli — «Leyli və Məcnun» poeması [cetin]

Məhəmməd Füzulinin «Leyli və Məcnun» poeması ilə bağlı doğru fikirləri müəyyən edin.
1. Əsər əruz vəzninin «həzəc» bəhrində yazılmışdır.
2. Qeysin atası Məcnunu sağaltmaq üçün Kərbəla ziyarətinə aparır.
3. İbn Səlam Leylinin razılığı və sevgisi ilə onunla evlənir.
4. Əsərdə aşiqanə və fəlsəfi qəzəllər lirik ricət kimi verilmişdir.
5. Zeyd Leyli ilə Məcnunun qovuşa bilməyən məhəbbətinin şahidi və sirdaşıdır.

- **A**) 1, 4, 5
- B) 2, 3, 5
- C) 1, 3, 4
- D) 1, 2, 5
- E) 2, 3, 4

> «Leyli və Məcnun» poeması məsnəvi janrında, əruz vəzninin həzəc bəhrində («məfā'īlün məfā'īlün fə'ūlün») qələmə alınmışdır (1 doğrudur). Qeysin atası onu şəfa tapmaq üçün Kərbəlaya deyil, Kəbəyə aparır (2 yanlışdır). İbn Səlam Leyli ilə zorla, Leylinin razılığı olmadan evlənir (3 yanlışdır). Əsərə süjet boyu lirik qəzəllər daxil edilmişdir (4 doğrudur). Zeyd obrazı hər iki aşiqin sirdaşıdır və onların qəbirləri üzərində ağlayıb onları yuxuda cənnətdə görən şəxsdir (5 doğrudur). Beləliklə, 1, 4 və 5-ci fikirlər tamamilə doğrudur. Doğru cavab: A.

### 3. «Kitabi-Dədə Qorqud» dastanı [orta]

«Kitabi-Dədə Qorqud» dastanının «Basatın Təpəgözü öldürdiyi boy»una əsasən uyğunluğu müəyyən edin:
1. Təpəgözün anası
2. Basatın atası
3. Basatı əmizdirib böyüdən varlıq
a. Sarı çoban
b. Pəri qızı
c. Qonur qoca
d. Aruz qoca\ne. Aslan

- A) 1 – c, 2 – d, 3 – a
- B) 1 – b, 2 – d, 3 – e
- C) 1 – a, 2 – c, 3 – d
- D) 1 – b, 2 – c, 3 – e
- **E**) 1 – b, 2 – a, 3 – e

> Boyun məzmununa görə:
> 1. Təpəgözün anası pəri qızıdır (1 – b).
> 2. Sarı çoban pəri qızı ilə bulaq başında qarşılaşır və Təpəgözün atası Sarı çobandır (2 – a).
> 3. Basat uşaq ikən düşmən gələndə meşədə itir və onu aslan əmizdirib böyüdür (3 – e). Aruz qoca isə Basatın əsl atasıdır, Təpəgözün deyil. Sarı çoban – pəri qızı – aslan ardıcıllığı düzgündür. Doğru cavab: E.

### 4. Mirzə Fətəli Axundzadə — komediyaları [asan]

Mirzə Fətəli Axundzadənin «Hekayəti Müsyö Jordan həkimi-nəbatat və dərviş Məstəli şah caduküni-məşhur» komediyasında fransız alimi Müsyö Jordanın Qarabağa gəlməkdə əsas məqsədi nə idi?

- A) Hətəmxan ağanın mülklərini idarə etməyə kömək etmək
- **B**) Qarabağın bitki və otlarını toplayıb tədqiq etmək
- C) Qarabağ xanlığı ilə Fransa arasında ticarət əlaqələri qurmaq
- D) Şahbaz bəyi Avropaya aparıb orada təhsil vermək
- E) Dərviş Məstəli şahın sehir və cadu üsullarını öyrənmək

> Müsyö Jordan təbiətşünas alimdir («həkimi-nəbatat» botanik deməkdir). O, Qarabağın zəngin təbiətini, bitki və ot növlərini («nəbatatını») toplayıb Parisə aparmaq və elmi şəkildə tədqiq etmək məqsədilə gəlmişdir. Şahbaz bəyi təhsil almaq üçün Parisə aparmaq ideyası sonradan yaranır, əsas gəliş məqsədi deyildir. Doğru cavab: B.

### 5. Molla Pənah Vaqif — həyatı və yaradıcılığı [cetin]

Molla Pənah Vaqifin yaradıcılığı haqqında hansı fikir elmi baxımdan tamamilə doğrudur?

- A) «Müsibətnamə» adlı elegik əsərində yaxın dostu Molla Vəli Vidadinin faciəli ölümünə ağlamışdır.
- B) Dövrün tarixi hadisələrini təsvir edən genişhəcmli epik poema müəllifidir.
- **C**) Azərbaycan poeziyasında real-dünyəvi gözəlliyin təsvirini və canlı xalq dilini qoşma janrında zirvəyə çatdırmışdır.
- D) Yaradıcılığında sufizm və təsəvvüf fəlsəfəsinin rəmzləri əsas ideya xəttini təşkil edir.
- E) Əsərlərini yalnız heca vəznində yazmış, əruz vəzninə qətiyyən müraciət etməmişdir.

> Molla Pənah Vaqif Azərbaycan realist poeziyasının banilərindəndir. O, qoşma janrını xalq dili ilə zənginləşdirmiş, ilahi-mistik məhəbbət əvəzinə real insanın dünyəvi sevgisini və gözəlliyini tərənnüm etmişdir (bu fikir tamamilə doğrudur). Vaqif təkcə heca ilə deyil, qəzəl, müxəmməs və digər janrlarda əruz vəznində də şeirlər yazmışdır (A yanlışdır). Sufizm onun ideyası deyildir (C yanlışdır). Genişhəcmli poema yazmamışdır (D yanlışdır). «Müsibətnamə» Vaqifə deyil, Vidadiyə məxsusdur (E yanlışdır). Doğru cavab: C.

## Biologiya (4-ci qrup) — 5 sual

### 1. Bakteriyaların çoxalması [orta]

Əlverişli şəraitdə hər 20 dəqiqədən bir bölünən 3 bakteriyadan 2 saatın sonunda cəmi neçə bakteriya əmələ gələr?

- A) $384$
- B) $96$
- **C**) $192$
- D) $128$
- E) $64$

> Bakteriyaların bölünməsi düsturu:
> $$N = N_0 \cdot 2^n$$
> Burada $N_0$ — ilkin bakteriyaların sayı, $n$ — bölünmələrin (nəsillərin) sayıdır.
> Zaman müddəti: $t = 2\,\text{saat} = 120\,\text{dəqiqə}$.
> Bölünmə intervalı $20\,\text{dəqiqə}$ olduğundan nəsillərin sayı:
> $$n = \dfrac{120}{20} = 6$$
> Sonda əmələ gələn bakteriyaların ümumi sayı:
> $$N = 3 \cdot 2^6 = 3 \cdot 64 = 192$$
> Doğru cavab: C.
> Ən çox edilən səhv ilkin bakteriya sayını ($3$) nəzərə almayıb yalnız $2^6 = 64$ ($64$ cavabı) hesablamaqdır.

### 2. Bitkilər aləminin təsnifatı — Mayalanmanın xüsusiyyətləri [asan]

Verilmiş bitkilərdən hansılarında mayalanma prosesi sudan asılı deyil?
1. Adi şam
2. Yaşıl quş mamırı
3. Çöl qatırquyruğu
4. Günəbaxan
5. Erkək qıjı

- **A**) 1 və 4
- B) 2 və 3
- C) 1, 4 və 5
- D) 2, 3 və 5
- E) yalnız 4

> Ali sporlu bitkilərdə (mamırlar, qıjıkimilər, qatırquyruğukimilər) hərəkətli spermatozoidlərin yumurtahüceyrəyə çatması üçün damcı-maye suyu mütləq lazımdır. Toxumlu bitkilərdə (çılpaqtoxumlular və örtülütoxumlular) isə spermilər yumurtahüceyrəyə tozcuq borusu vasitəsilə çatdırıldığından mayalanma sudan asılı deyil.
> Siyahıda:
> - 1 (Adi şam) — çılpaqtoxumlu bitkidir;
> - 4 (Günəbaxan) — örtülütoxumlu bitkidir.
> Bu səbəbdən 1 və 4 bitkilərində mayalanma sudan asılı deyildir. Yaşıl quş mamırı (2), çöl qatırquyruğu (3) və erkək qıjı (5) isə ali sporlu bitkilər olduğundan mayalanmaları üçün su tələb olunur.
> Doğru cavab: A.

### 3. Qan dövranı sistemi — Ürək tsikli [orta]

Sakit vəziyyətdə olan insanın ürək tsiklində qulaqcıqların sistolası cəmi $10\,\text{san}$ davam etmişdirsə, bu müddət ərzində mədəciklərin diastola vəziyyətində olduğu ümumi vaxtı tapın.

- A) $20\,\text{san}$
- B) $70\,\text{san}$
- C) $40\,\text{san}$
- **D**) $50\,\text{san}$
- E) $30\,\text{san}$

> İnsanın normal ürək tsikli $0{,}8\,\text{san}$ davam edir:
> - Qulaqcıqların sistolası: $0{,}1\,\text{san}$
> - Mədəciklərin sistolası: $0{,}3\,\text{san}$
> - Ümumi pauza: $0{,}4\,\text{san}$
> Mədəciklər hər tsikldə $0{,}3\,\text{san}$ sistola (yığılma) vəziyyətində, qalan müddətdə isə diastola (boşalma) vəziyyətində olur:
> $$t_{\text{diastola}} = 0{,}8\,\text{san} - 0{,}3\,\text{san} = 0{,}5\,\text{san}$$
> Qulaqcıqların sistolası ümumi tsiklin $\dfrac{0{,}1}{0{,}8} = \dfrac{1}{8}$ hissəsini təşkil edir. Qulaqcıq sistolasının ümumi vaxtı $10\,\text{san}$ olduğuna görə, bütün proses üçün keçən ümumi vaxt:
> $$T = 10\,\text{san} \cdot 8 = 80\,\text{san}$$
> Bu müddət ərzində mədəciklərin diastolada olduğu ümumi vaxt:
> $$t = 80\,\text{san} \cdot \dfrac{0{,}5}{0{,}8} = 50\,\text{san}$$
> Doğru cavab: D.
> Ən çox edilən səhv mədəciklərin diastolasını yalnız ümumi pauza ($0{,}4\,\text{san}$) ilə eyniləşdirərək $40\,\text{san}$ cavabını seçməkdir; lakin qulaqcıqlar yığılarkən ($0{,}1\,\text{san}$) də mədəciklər diastola vəziyyətində qalır.

### 4. Örtülütoxumlularda ikiqat mayalanma və toxumun formalaşması [cetin]

Diploid xromosom yığımı $2n = 16$ olan örtülütoxumlu bitkidə 25 toxumun əmələ gəlməsi zamanı mayalanma prosesində bilavasitə iştirak edən qametlərin və bu qametlərdəki xromosomların ümumi sayını müəyyən edin.

- A) 50 qamet; 400 xromosom
- B) 75 qamet; 1200 xromosom
- C) 50 qamet; 600 xromosom
- D) 100 qamet; 800 xromosom
- **E**) 75 qamet; 600 xromosom

> Örtülütoxumlu bitkilərdə ikiqat mayalanma zamanı hər bir toxumun yaranmasında bilavasitə 3 qamet iştirak edir: 1 dişi qamet (yumurtahüceyrə) və 2 erkək qamet (spermilər). Mərkəzi hüceyrə mayalanmada iştirak etsə də, qamet deyildir.
> 25 toxumun formalaşmasında bilavasitə iştirak edən qametlərin sayı:
> $$N_{\text{qamet}} = 25 \cdot 3 = 75$$
> Somatik hüceyrədə $2n = 16$ xromosom olduğundan, haploid qametdə xromosom sayı:
> $$n = \dfrac{16}{2} = 8$$
> Bütün qametlərdəki xromosomların ümumi sayı:
> $$N_{\text{xromosom}} = 75 \cdot 8 = 600$$
> Doğru cavab: E.
> Ən çox edilən səhv mərkəzi hüceyrəni də qamet hesab edərək 1 toxum üçün 4 qamet (cəmi 100 qamet) götürmək və ya hər toxum üçün yalnız 2 qametin birləşdiyini zənn edib 50 qamet seçməkdir.

### 5. Hüceyrənin quruluşu — Orqanoidlər [asan]

Yalnız ikizarlı orqanoidlər göstərilən variantı müəyyən edin.

- A) Mitoxondrilər və lizosomlar
- **B**) Mitoxondrilər və plastidlər
- C) Vakuollar və endoplazmatik şəbəkə
- D) Ribosomlar və hüceyrə mərkəzi
- E) Lizosomlar və Holci kompleksi

> Eukariot hüceyrənin orqanoidləri membran quruluşuna görə üç qrupa bölünür:
> 1. Zarsız orqanoidlər: ribosom və hüceyrə mərkəzi;
> 2. Birzarlı orqanoidlər: endoplazmatik şəbəkə, Holci kompleksi, lizosom və vakuol;
> 3. İkizarlı orqanoidlər: mitoxondrilər və plastidlər (xloroplastlar, xromoplastlar, leykoplastlar).
> Mitoxondrilər və plastidlər hər ikisi ikizarlı orqanoidlərdir.
> Doğru cavab: B.

## Məntiq (magistr) — 5 sual

### 1. Sillogizm və deduktiv nəticə çıxarma [asan]

Verilmiş mühakimələrin doğru olduğunu qəbul edərək məntiqi nəticəni müəyyən edin:

1. Bütün proqramçılar analitik düşüncəyə malikdirlər.
2. Şahmat oynamağı bacaran bəzi şəxslər analitik düşüncəyə malik deyillər.
3. Rauf şahmat oynamağı bacarır, lakin onda analitik düşüncə yoxdur.

- **A**) Rauf proqramçı deyil.
- B) Bütün şahmatçılar proqramçıdır.
- C) Şahmat oynayan heç bir şəxs proqramçı ola bilməz.
- D) Analitik düşüncəsi olan hər kəs proqramçıdır.
- E) Rauf mütləq proqramçı olmalıdır.

> Sillogizm qaydalarına əsasən: Bütün proqramçılar analitik düşüncəyə malikdirsə, analitik düşüncəsi olmayan heç kəs proqramçı ola bilməz ($A \subset B \implies \neg B \subset \neg A$). Rauf analitik düşüncəyə malik olmadığına görə, o qətiyyən proqramçı ola bilməz. Beləliklə, «Rauf proqramçı deyil» hökmü mütləq doğrudur. Doğru cavab: A.

### 2. Mətn analizi — arqumenti zəiflədən ifadə [orta]

Mətni oxuyun və suala cavab verin:

«Son illərdə aparılan tədqiqatlar göstərir ki, distant təhsil alan tələbələrin imtahan nəticələri ənənəvi qaydada təhsil alanların nəticələrindən orta hesabla $15\%$ yüksəkdir. Təhsil eksperti bu fərqin distant təhsildə tətbiq olunan fərdi öyrənmə tempindən qaynaqlandığını və distant təhsilin ənənəvi təhsildən daha keyfiyyətli olduğunu iddia edir.»

Aşağıdakı mühakimələrdən hansı ekspertin arqumentini ən çox zəiflədir?

- A) Distant təhsil alan tələbələr kompüter proqramlarını ənənəvi tələbələrə nisbətən daha yaxşı mənimsəyirlər.
- **B**) Distant təhsil zamanı imtahanlar onlayn keçirildiyi üçün tələbələrin kənar köməkdən istifadə etməsinə tam nəzarət olunmur.
- C) Distant təhsildə tələbələr dərslərə istədikləri məkandan qoşulmaq imkanına malikdirlər.
- D) Distant təhsil formatı son illərdə bir çox nüfuzlu xarici universitetdə geniş yayılmışdır.
- E) Distant proqramlarda təhsil haqqı ənənəvi proqramlara nisbətən adətən daha aşağı olur.

> Ekspert imtahan nəticələrinin yüksək olmasını birbaşa distant təhsilin keyfiyyəti və öyrənmə tempi ilə əlaqələndirir. Lakin imtahanlar zamanı nəzarətin zəif olması və kənar vasitələrdən istifadə ehtimalı nəticələrin obyektivliyini şübhə altına alır. Bu fakt yüksək nəticələrin təhsilin keyfiyyətindən deyil, nəzarətsizlikdən yarandığını göstərərək ekspertin əsas arqumentini zəiflədir. Doğru cavab: B.

### 3. Ədədi ardıcıllıqlar — qarışıq qanunauyğunluq [orta]

Qanunauyğunluğu müəyyən edin və sual işarəsinin («?») yerinə uyğun olan ədədi tapın:

$$3, \; 7, \; 16, \; 35, \; 74, \; ?$$

- A) 148
- B) 155
- **C**) 153
- D) 151
- E) 149

> Ardıcıllığın hədləri arasındakı qanunauyğunluğu təhlil edək:
> İkinci hədd: $$3 \times 2 + 1 = 7$$
> Üçüncü hədd: $$7 \times 2 + 2 = 16$$
> Dördüncü hədd: $$16 \times 2 + 3 = 35$$
> Beşinci hədd: $$35 \times 2 + 4 = 74$$
> Qaydaya əsasən hər növbəti hədd əvvəlki həddin $2$ misli ilə artan sıra nömrəsinin cəmidir ($a_{n+1} = 2a_n + n$).
> Növbəti hədd: $$74 \times 2 + 5 = 148 + 5 = 153$$ olar. Doğru cavab: C.

### 4. Saat, təqvim və həftə günləri məsələləri [cetin]

Hər hansı bir ilin yanvar ayında düz $4$ bazar ertəsi və düz $4$ cümə günü olmuşdur. Həmin ilin yanvar ayının $20$-si həftənin hansı gününə təsadüf etmişdir?

- A) çərşənbə axşamı
- **B**) bazar
- C) çərşənbə
- D) şənbə
- E) cümə axşamı

> Yanvar ayı $31$ gündən ibarətdir. $31 = 4 \times 7 + 3$ olduğuna görə, həftənin $4$ günü $4$ dəfə, ardıcıl $3$ günü isə $5$ dəfə təkrarlanır. Şərtə görə bazar ertəsi və cümə günləri hərəsi $4$ dəfə olub. Deməli, $5$ dəfə təkrarlanan $3$ ardıcıl gün bazar ertəsi və cüməni əhatə etməməlidir. Bazar ertəsindən sonrakı və cümədən əvvəlki $3$ ardıcıl gün çərşənbə axşamı, çərşənbə və cümə axşamıdır. Buradan aydın olur ki, ayın $1$-i çərşənbə axşamına təsadüf edir ($1, 2, 3$ yanvar: çərşənbə axşamı, çərşənbə, cümə axşamı). $1$ yanvar çərşənbə axşamı olarsa:
> $$20 - 1 = 19$$
> $$19 \equiv 5 \pmod 7$$
> Çərşənbə axşamından $5$ gün irəli saysaq: çərşənbə ($+1$), cümə axşamı ($+2$), cümə ($+3$), şənbə ($+4$), bazar ($+5$). Deməli, yanvar ayının $20$-si bazar günüdür. Doğru cavab: B.

### 5. Kağız qatlama və kəsmə, simmetriya [cetin]

Kvadrat şəkilli şəffaf olmayan kağız vərəq ardıcıl olaraq iki dəfə qatlanır: əvvəlcə sol tərəfi sağ tərəfinin üzərinə gələcək şəkildə şaquli simmetriya oxu boyunca soldan sağa, sonra isə yaranmış düzbucaqlı aşağı tərəfi yuxarı tərəfinin üzərinə gələcək şəkildə üfüqi simmetriya oxu boyunca aşağıdan yuxarıya doğru qatlanır. Alınmış dördqat kiçik kvadratın tam mərkəzində diametri $1\,\text{sm}$ olan bir dairəvi dəlik, yuxarı-sağ küncündə (bütün vərəqin ilkin xarici təpə nöqtəsi) isə dörddəbir dairə kəsilib çıxarılır. Vərəq tam açıldıqdan sonra onun üzərində neçə ədəd tam dairəvi dəlik müşahidə olunar?

- A) 8
- B) 1
- C) 2
- D) 5
- **E**) 4

> Qatlama ardıcıllığını təhlil edək:
> 1. Soldan sağa qatlandıqda qatlama xətti sol tərəfdə qalır.
> 2. Aşağıdan yuxarıya qatlandıqda qatlama xətti aşağı tərəfdə qalır.
> Nəticədə alınan dördqat kvadratın daxili qapalı mərkəzi küncü sol-aşağı küncdür, xarici açıq küncləri isə yuxarı-sağ küncdür.
> - Kiçik kvadratın tam mərkəzində edilən kəsik vərəq açıldıqda hər dörddəbir hissənin öz mərkəzinə düşəcək və tam $4$ ədəd dairəvi dəlik formalaşdıracaq.
> - Yuxarı-sağ künc isə ilkin böyük kvadratın təbii kənar künclərinə təsadüf edir (vərəqin daxili birləşmə qatına yox). Burada edilən dörddəbir dairə kəsikləri açıldıqda birləşərək tam dairə yaratmır, böyük kvadratın $4$ xarici küncündə kəsik olaraq qalır.
> Beləliklə, vərəqin daxilində bütöv görünən tam dairəvi dəliklərin sayı yalnız mərkəzi kəsiklərdən yaranan $4$ ədəd dəlikdir. Doğru cavab: E.

## İnformatika (magistr) — 5 sual

### 1. Kompüter qrafikası və multimedia — Rastr təsvirin informasiya həcmi [orta]

Ölçüsü $512 \times 256$ piksel olan və CMYK modelində kodlaşdırılmış rastr təsvirin informasiya həcmi, ölçüsü $1024 \times 128$ piksel olan və RGB modelində kodlaşdırılmış rastr təsvirin informasiya həcmindən neçə kilobayt (KB) çoxdur?

- **A**) $128$
- B) $256$
- C) $384$
- D) $64$
- E) $512$

> Rastr təsvirin həcmi piksel sayı ilə bir pikselin rəng dərinliyinin hasilinə bərabərdir:
> $$V = X \cdot Y \cdot i$$
> CMYK modelində hər piksel $32$ bit ($4$ bayt) yer tutur:
> $$V_1 = 512 \times 256 \times 4\,\text{bayt} = 2^9 \cdot 2^8 \cdot 2^2\,\text{bayt} = 2^{19}\,\text{bayt}$$
> $$V_1 = \dfrac{2^{19}}{2^{10}}\,\text{KB} = 2^9\,\text{KB} = 512\,\text{KB}$$
> RGB modelində hər piksel $24$ bit ($3$ bayt) yer tutur:
> $$V_2 = 1024 \times 128 \times 3\,\text{bayt} = 2^{10} \cdot 2^7 \cdot 3\,\text{bayt} = 3 \cdot 2^{17}\,\text{bayt}$$
> $$V_2 = \dfrac{3 \cdot 2^{17}}{2^{10}}\,\text{KB} = 3 \cdot 2^7\,\text{KB} = 3 \cdot 128\,\text{KB} = 384\,\text{KB}$$
> Həcmlərin fərqi:
> $$512 - 384 = 128\,\text{KB}$$
> Doğru cavab: A.

### 2. Say sistemləri və onlarda hesab əməlləri — Məchul əsaslı say sistemləri [cetin]

$21_x \times 13_x = 303_x$ bərabərliyinin ödənildiyi say sistemində $87_{10}$ ədədinin yazılışını müəyyən edin.

- **A**) $153$
- B) $162$
- C) $213$
- D) $135$
- E) $144$

> Ədədləri $x$ əsasına görə açıq şəkildə yazaq:
> $$21_x = 2x + 1$$
> $$13_x = x + 3$$
> $$303_x = 3x^2 + 0 \cdot x + 3 = 3x^2 + 3$$
> Bərabərliyi quraq:
> $$(2x + 1)(x + 3) = 3x^2 + 3$$
> $$2x^2 + 7x + 3 = 3x^2 + 3$$
> $$x^2 - 7x = 0 \implies x(x - 7) = 0$$
> Say sisteminin əsası $x > 3$ şərtini ödəyən natural ədəd olduğundan $x = 7$ tapılır.
> İndi $87_{10}$ ədədini $7$-lik say sisteminə çevirək:
> $$87 : 7 = 12\quad (\text{qalıq } 3)$$
> $$12 : 7 = 1\quad (\text{qalıq } 5)$$
> $$1 : 7 = 0\quad (\text{qalıq } 1)$$
> Qalıqları sondan əvvələ yazsaq: $153_7$.
> Doğru cavab: A.

### 3. İnformasiya, ölçü vahidləri və informasiyanın miqdarı — Mətn informasiyasının kodlaşdırılması [orta]

Buraxılış zolağının sürəti $256\,\text{Kbit/san}$ olan rabitə kanalı vasitəsilə fayl $16$ saniyə ərzində ötürülmüşdür. Bu fayl hər səhifəsində $32$ sətir və hər sətrində $64$ simvol olan mətndən ibarətdir. Mətn UNICODE standartında (hər simvol $16$ bit) kodlaşdırılmışsa, sənədin neçə səhifədən ibarət olduğunu tapın.

- **A**) $128$
- B) $64$
- C) $256$
- D) $512$
- E) $32$

> Kanal vasitəsilə ötürülən ümumi informasiya miqdarı sürətlə zamanın hasilinə bərabərdir:
> $$Q = v \cdot t$$
> $$Q = 256\,\text{Kbit/san} \times 16\,\text{san} = 2^8 \cdot 2^{10} \cdot 2^4\,\text{bit} = 2^{22}\,\text{bit}$$
> UNICODE standartında $1$ simvol $16$ bit ($2^4$ bit) olduğundan, mətndəki ümumi simvolların sayı:
> $$N = \dfrac{2^{22}}{2^4} = 2^{18}\,\text{simvol}$$
> Bir səhifədəki simvolların sayı:
> $$K = 32 \times 64 = 2^5 \cdot 2^6 = 2^{11}\,\text{simvol}$$
> Sənəddəki səhifələrin sayı:
> $$S = \dfrac{N}{K} = \dfrac{2^{18}}{2^{11}} = 2^7 = 128$$
> Doğru cavab: A.

### 4. Verilənlər bazası və VBİS (MS Access) — Məntiqi sorğular [asan]

Verilmiş cədvəl fraqmentinə əsasən `(Sinif = 10 AND Riyaziyyat > 80) OR (İnformatika > 85)` sorğu şərtini ödəyən neçə yazı seçiləcək?

| Şagird | Sinif | Riyaziyyat | İnformatika |
| :--- | :--- | :--- | :--- |
| Murad | 10 | 85 | 90 |
| Aysel | 11 | 75 | 95 |
| Nigar | 10 | 92 | 80 |
| Elmir | 11 | 88 | 70 |
| Leyla | 10 | 68 | 85 |
| Rauf | 11 | 94 | 88 |

- A) $2$
- B) $3$
- C) $5$
- D) $1$
- **E**) $4$

> Məntiqi `OR` əməlinə görə mötərizələrdən ən azı birinin doğru olması kifayətdir. Hər yazını ardıcıl yoxlayaq:
> 1. Murad: `10 = 10 AND 85 > 80` doğrudur (seçilir).
> 2. Aysel: birinci şərt yalandır, lakin `95 > 85` doğrudur (seçilir).
> 3. Nigar: `10 = 10 AND 92 > 80` doğrudur (seçilir).
> 4. Elmir: birinci şərt yalandır (`11 = 10` yalan), `70 > 85` də yalandır (seçilmir).
> 5. Leyla: `68 > 80` yalandır, `85 > 85` də yalandır, çünki bərabərdir (seçilmir).
> 6. Rauf: birinci şərt yalandır, lakin `88 > 85` doğrudur (seçilir).
> Şərti ödəyən $4$ yazı seçilir (Murad, Aysel, Nigar, Rauf). Doğru cavab: E.

### 5. MS Excel — Ünvanlaşma növləri və IF funksiyası [cetin]

Elektron cədvəl fraqmenti verilmişdir:

| | A | B | C |
| :---: | :---: | :---: | :---: |
| **1** | 5 | 10 | 15 |
| **2** | 8 | 12 | 4 |
| **3** | 3 | 6 | 9 |
| **4** | 7 | 14 | 2 |

D1 xanasında `=IF(A1>5; B$2+A1; $B1-C2)` düsturu yazılmışdır. Bu düstur D1 xanasından D3 xanasına köçürüldükdən sonra D3 xanasında hesablanmış qiyməti tapın.

- A) $15$
- B) $2$
- C) $17$
- **D**) $4$
- E) $6$

> Düstur D1 xanasından D3 xanasına köçürüldükdə sütun dəyişmir, sətir nömrəsi isə $2$ vahid artır ($1 \to 3$):
> - `A1` nisbi ünvanı `A3` olur;
> - `B$2` qarışıq ünvanında sətir mütləq ($) olduğundan dəyişmir: `B$2`;
> - `A1` nisbi ünvanı `A3` olur;
> - `$B1` qarışıq ünvanında sətir nisbi olduğundan `$B3` olur;
> - `C2` nisbi ünvanı `C4` olur.
> Beləliklə, D3 xanasındakı düstur:
> `=IF(A3>5; B$2+A3; $B3-C4)`
> Cədvəldən tələb olunan qiymətlər: `A3 = 3`, `B2 = 12`, `B3 = 6`, `C4 = 2`.
> Şərtin yoxlanması:
> $$3 > 5\quad (\text{Yalandır / FALSE})$$
> Şərt ödənmədiyinə görə düstur FALSE budağını hesablayır:
> $$$B3 - C4 = 6 - 2 = 4$$
> Doğru cavab: D.

## Xarici dil (magistr) — 5 sual

### 1. Sentence completion and paragraph coherence [orta]

Read the passage and choose the sentence that best completes it.

Technological advancement has drastically reshaped the global workforce over the past few decades. While automation has eliminated many routine manual tasks, it has simultaneously created high demand for specialized analytical roles. ___. Therefore, educational institutions must update their curricula to prepare graduates for these evolving workplace demands.

- **A**) Consequently, individuals must acquire modern digital competencies to remain competitive in the job market.
- B) Despite this, technological progress has had virtually no measurable impact on modern employment structures.
- C) As a result, manual labor has entirely replaced technical professions across all major economic sectors.
- D) In contrast, companies have completely ceased recruiting personnel with advanced technical qualifications.
- E) Furthermore, traditional office environments have become entirely unnecessary for conducting business.

> Mətndə texnologiyanın iş mühitini dəyişdiyi, rutin işləri sıradan çıxararaq analitik bacarıqlara tələbatı artırdığı bildirilir. Növbəti cümlə bu tələbatın işçilər üçün nəticəsini ifadə etməli və son cümlədəki təhsil müəssisələrinin tədris proqramlarını yeniləməsi zərurətinə məntiqi körpü yaratmalıdır. «Fərdlərin əmək bazarında rəqabətədavamlı qalması üçün müasir rəqəmsal səriştələrə yiyələnməli olması» fikri abzasın məntiqi və tematik ardıcıllığını tam təmin edir. Şirkətlərin ixtisaslı kadr qəbulunu dayandırdığını, fiziki əməyin texniki peşələri əvəz etdiyini və ya texnologiyanın məşğulluğa təsir etmədiyini bildirən digər variantlar mətnin məzmununa ziddir. Doğru cavab: A.

### 2. Tense forms and sequence of tenses [orta]

Choose the correct tense forms to complete the sentence.

By the time the keynote speaker ___ at the conference hall, the organizers ___ all the technical equipment and the attendees had already taken their seats.

- **A**) arrived / had tested
- B) arrived / would test
- C) had arrived / tested
- D) arrives / have tested
- E) was arriving / test

> Zaman uzlaşması qaydasına əsasən, keçmişə aid zaman budaq cümlələrində «by the time» bağlayıcısından sonra Past Simple zaman forması işlənir. Baş cümlədə isə həmin vaxta qədər baş verib tamamlanmış hərəkətləri bildirmək üçün Past Perfect işlənməlidir. Cümlənin sonundakı «had already taken» feli də baş cümlədə hərəkətlərin həmcins olaraq Past Perfect formasında olduğunu göstərir. Deməli, birinci boşluqda «arrived», ikinci boşluqda isə «had tested» olmalıdır. Digər variantlar zamanların düzgün ardıcıllığını pozur. Doğru cavab: A.

### 3. Conditionals and wish-clauses; inversion [cetin]

Choose the correct option to complete the sentence.

___ the project manager ___ the potential risks at the beginning, we ___ such serious financial difficulties right now.

- A) Should / identify / would not have faced
- **B**) Had / identified / would not be facing
- C) Had / identified / were not facing
- D) Were / to identify / will not face
- E) If / had identified / had not faced

> Bu cümlə qarışıq şərt budaq cümləsidir (Mixed Conditional: Type 3 şərt + Type 2 nəticə) və budaq cümlədə inversiya tətbiq edilmişdir. Şərt keçmiş zamana aid olduğu üçün («at the beginning») Past Perfect tələb olunur və «if» bağlayıcısı atıldıqda köməkçi fel mübtədadan əvvələ keçir: «Had the project manager identified...». Nəticə isə indiki zamana aid olduğu üçün («right now») baş cümlədə «would not be facing» (Continuous Conditional) işlənməlidir. Keçmiş nəticə bildirən «had not faced» və ya köməkçi modalsız yazılmış «were not facing» formaları indiki zaman zərfi ilə uzlaşmır. Doğru cavab: B.

### 4. Nouns, articles and determiners in context [asan]

Choose the correct articles to complete the sentence.

___ Mount Everest is the highest mountain in ___ world, situated in ___ Himalayas.

- A) The / a / the
- B) - / a / -
- **C**) - / the / the
- D) - / - / the
- E) The / the / the

> Artiklların işlənmə qaydasına əsasən: 1) Tək dağ zirvələrinin adları (Mount Everest, Elbrus) artiklsız işlənir (-); 2) Vahidlik bildirən varlıqların adları qarşısında müəyyənlik artikli işlənir: «the world»; 3) Silsilə dağ adlarının qarşısında müəyyənlik artikli işlənir: «the Himalayas». Bu səbəbdən ardıcıllıq «- / the / the» şəklində olmalıdır. Doğru cavab: C.

### 5. Pronouns and quantifiers [cetin]

Choose the correct sentences with pronouns and quantifiers.

1. Only a few applicants were invited to the second stage of the interview.
2. Every of the students received a certificate at the end of the course.
3. Both of the proposed methods were rejected by the scientific board.
4. Neither of the answers is correct, so no points were awarded.
5. There is too many equipment in the newly renovated laboratory.

- A) 1, 2, 4
- B) 3, 4, 5
- C) 2, 3, 5
- D) 1, 2, 5
- **E**) 1, 3, 4

> Cümlələrin təhlili:
> 1. «Only a few» ifadəsi sayılan cəm isimlə («applicants») düzgün işlənib və xəbər cəmdədir («were»). Doğrudur.
> 2. «Every» təyini əvəzliyi birbaşa «of» sözönü ilə işlənə bilməz; bu halda «each of» və ya «every one of» işlənməlidir. Yanlışdır.
> 3. «Both of» cəm isimlə işlənir və xəbəri cəmdə tələb edir («were rejected»). Doğrudur.
> 4. «Neither of + cəm isim» quruluşunda rəsmi qrammatik qaydaya əsasən xəbər təkdə olur («is»). Doğrudur.
> 5. «Equipment» sayılmayan isim olduğundan «too many» ilə deyil, «too much» ilə işlənməlidir. Yanlışdır.
> Beləliklə, düzgün cümlələr 1, 3 və 4-dür. Doğru cavab: E.

## Riyaziyyat (1-ci qrup) — Loqarifm: xassələr, loqarifmik tənlik və bərabərsizliklər (çətin səviyyədə) — 5 sual

### 1. Loqarifmik bərabərsizliklər — kəsr-loqarifmik bərabərsizlik [cetin]

$\dfrac{\log_2(x^2 - 3x + 2) - 1}{\log_3(x + 5) - 2} \le 0$ bərabərsizliyinin tam həllərinin cəmini tapın.

- **A**) $-7$
- B) $-4$
- C) $0$
- D) $-3$
- E) $-10$

> Təyin oblastını müəyyən edək:
> $$\begin{cases} x^2 - 3x + 2 > 0 \\ x + 5 > 0 \\ \log_3(x + 5) \ne 2 \end{cases}$$
> Buradan $x \in (-\infty; 1) \cup (2; \infty)$, $x > -5$ və $x \ne 4$ alınır. Kəsişmə: $D = (-5; 1) \cup (2; 4) \cup (4; \infty)$.
> 
> Sürətin sıfırlarını tapaq:
> $$\log_2(x^2 - 3x + 2) = 1 \implies x^2 - 3x + 2 = 2 \implies x(x - 3) = 0$$
> $x = 0$ və $x = 3$.
> 
> Məxrəcin sıfırı:
> $$\log_3(x + 5) = 2 \implies x + 5 = 9 \implies x = 4$$
> 
> İntervallar üsulunu təyin oblastında tətbiq etsək, kəsrin mənfi və ya sıfır olduğu aralıqlar:
> $$x \in (-5; 0] \cup [3; 4)$$
> Bu aralıqlara daxil olan tam ədədlər: $-4, -3, -2, -1, 0, 3$.
> Tam həllərin cəmi:
> $$(-4) + (-3) + (-2) + (-1) + 0 + 3 = -7$$
> Ən çox edilən səhv təyin oblastında $x \in (1; 2)$ aralığının kənarlaşdırılmasını və məxrəcin sıfırı olan $x = 4$ nöqtəsinin ciddi çıxarılmasını nəzərdən qaçırmaqdır. Doğru cavab: A.

### 2. Loqarifmik ifadələrin çevrilməsi və xassələri [cetin]

İfadənin qiymətini hesablayın: $$\dfrac{3^{\log_3^2 5} + 5^{\log_3 5}}{5^{\log_3 15}} + \log_4 \log_3 \sqrt{81}$$

- A) $\dfrac{11}{10}$
- B) $\dfrac{3}{5}$
- **C**) $\dfrac{9}{10}$
- D) $1$
- E) $\dfrac{7}{10}$

> Əsas loqarifmik eynilikdən istifadə edək:
> $$a^{\log_a b} = b$$
> Birinci toplananın sürətindəki birinci həddi sadələşdirək:
> $$3^{\log_3^2 5} = \left(3^{\log_3 5}\right)^{\log_3 5} = 5^{\log_3 5}$$
> Onda sürət belə olar:
> $$5^{\log_3 5} + 5^{\log_3 5} = 2 \cdot 5^{\log_3 5}$$
> 
> Məxrəci çevirək:
> $$5^{\log_3 15} = 5^{\log_3 (3 \cdot 5)} = 5^{1 + \log_3 5} = 5^1 \cdot 5^{\log_3 5} = 5 \cdot 5^{\log_3 5}$$
> Birinci kəsrin qiyməti:
> $$\dfrac{2 \cdot 5^{\log_3 5}}{5 \cdot 5^{\log_3 5}} = \dfrac{2}{5}$$
> 
> İkinci toplananı hesablayaq:
> $$\sqrt{81} = 9 \implies \log_3 9 = 2 \implies \log_4 2 = \dfrac{1}{2}$$
> 
> Cəmi tapaq:
> $$\dfrac{2}{5} + \dfrac{1}{2} = \dfrac{4 + 5}{10} = \dfrac{9}{10}$$
> Doğru cavab: C.

### 3. Loqarifmik tənliklər — yeni dəyişən daxil etmə və əsasın dəyişdirilməsi [cetin]

$\log_2(x^2 - 1) = \log_{x^2 - 1} 16$ tənliyinin köklərinin hasilini tapın.

- A) $5$
- **B**) $\dfrac{25}{4}$
- C) $\dfrac{5}{2}$
- D) $-\dfrac{25}{4}$
- E) $\dfrac{25}{16}$

> Tənliyin təyin oblastı:
> $$x^2 - 1 > 0 \quad \text{və} \quad x^2 - 1 \ne 1 \implies x^2 > 1 \quad \text{və} \quad x^2 \ne 2$$
> 
> Əsası $2$-yə gətirək:
> $$\log_{x^2 - 1} 16 = \dfrac{\log_2 16}{\log_2(x^2 - 1)} = \dfrac{4}{\log_2(x^2 - 1)}$$
> 
> $\log_2(x^2 - 1) = t$ əvəzləməsi aparaq:
> $$t = \dfrac{4}{t} \implies t^2 = 4 \implies t_1 = 2, \quad t_2 = -2$$
> 
> Hər iki halı araşdıraq:
> 1) $\log_2(x^2 - 1) = 2 \implies x^2 - 1 = 4 \implies x^2 = 5 \implies x = \pm\sqrt{5}$
> 2) $\log_2(x^2 - 1) = -2 \implies x^2 - 1 = \dfrac{1}{4} \implies x^2 = \dfrac{5}{4} \implies x = \pm\dfrac{\sqrt{5}}{2}$
> 
> Bütün köklər təyin oblastını ödəyir. Köklərin hasili:
> $$(\sqrt{5}) \cdot (-\sqrt{5}) \cdot \left(\dfrac{\sqrt{5}}{2}\right) \cdot \left(-\dfrac{\sqrt{5}}{2}\right) = (-5) \cdot \left(-\dfrac{5}{4}\right) = \dfrac{25}{4}$$
> Ən çox edilən səhv mənfi kökləri unudaraq yalnız müsbət kökləri vurmaq və ya işarə xətası etməkdir. Doğru cavab: B.

### 4. Parametrli loqarifmik tənliklər [cetin]

$a$-nın hansı tam qiymətlərində $\log_2^2 x - 2a\log_2 x + a^2 - 4 = 0$ tənliyinin yalnız bir kökü $(1; 8)$ intervalına daxildir? Həmin tam qiymətlərin cəmini tapın.

- A) $10$
- B) $5$
- **C**) $6$
- D) $4$
- E) $8$

> $t = \log_2 x$ əvəzləməsi aparaq. Tənlik kvadrat tənliyə çevrilir:
> $$t^2 - 2at + a^2 - 4 = 0 \implies (t - a)^2 = 4$$
> Buradan köklər:
> $$t_1 = a - 2, \quad t_2 = a + 2$$
> 
> $x \in (1; 8)$ şərtindən $t = \log_2 x \in (0; 3)$ alınır. Nəzərə alaq ki, köklər arasındakı məsafə $t_2 - t_1 = 4$-dür, bu isə $(0; 3)$ intervalının uzunluğundan ($3$) böyükdür. Deməli, hər iki kök eyni zamanda bu intervala daxil ola bilməz.
> 
> Yalnız bir kökün $(0; 3)$ intervalında olması üçün iki hal mümkündür:
> 1) $t_1 \in (0; 3) \implies 0 < a - 2 < 3 \implies 2 < a < 5$. Bu halda $t_2 = a + 2 > 4$, yəni $t_2 \notin (0; 3)$. Tam qiymətlər: $a = 3, 4$.
> 2) $t_2 \in (0; 3) \implies 0 < a + 2 < 3 \implies -2 < a < 1$. Bu halda $t_1 = a - 2 < -1$, yəni $t_1 \notin (0; 3)$. Tam qiymətlər: $a = -1, 0$.
> 
> $a$-nın ala biləcəyi tam qiymətlərin cəmi:
> $$(-1) + 0 + 3 + 4 = 6$$
> Doğru cavab: C.

### 5. Dəyişən əsaslı loqarifmik bərabərsizliklər [cetin]

$\log_{x-1}(x^2 - 8x + 16) \le 0$ bərabərsizliyini həll edin.

- A) $(1; 2) \cup (3; 5)$
- B) $(-\infty; 2) \cup [3; 5]$
- **C**) $(1; 2) \cup [3; 4) \cup (4; 5]$
- D) $(1; 2) \cup [3; 5]$
- E) $[3; 4) \cup (4; 5]$

> Təyin oblastını müəyyən edək:
> $$\begin{cases} x - 1 > 0 \\ x - 1 \ne 1 \\ x^2 - 8x + 16 > 0 \end{cases} \implies \begin{cases} x > 1 \\ x \ne 2 \\ (x - 4)^2 > 0 \implies x \ne 4 \end{cases}$$
> Təyin oblastı: $x \in (1; 2) \cup (2; 4) \cup (4; \infty)$.
> 
> Bərabərsizliklərin rasionallaşdırma üsuluna əsasən, $\log_a b \le 0$ bərabərsizliyi təyin oblastında $(a - 1)(b - 1) \le 0$ bərabərsizliyinə ekvivalentdir:
> $$(x - 1 - 1)((x - 4)^2 - 1) \le 0$$
> $$(x - 2)(x - 4 - 1)(x - 4 + 1) \le 0$$
> $$(x - 2)(x - 5)(x - 3) \le 0$$
> 
> İntervallar üsuluna görə həll: $(-\infty; 2] \cup [3; 5]$.
> Bu çoxluğu təyin oblastı ilə kəsişdirək:
> $$x \in (1; 2) \cup [3; 4) \cup (4; 5]$$
> Ən çox edilən səhv $(x - 4)^2 > 0$ şərtindən $x \ne 4$ məhdudiyyətini nəzərə almayıb $4$ nöqtəsini həllə daxil etməkdir. Doğru cavab: C.

## Riyaziyyat (1-ci qrup) — Triqonometrik ifadələr, düsturlar və tənliklər (orta çətinlikdə) — 5 sual

### 1. Triqonometrik eyniliklər — Əsas eyniliklər və cəbr düsturları [orta]

$\sin\alpha - \cos\alpha = \dfrac{1}{2}$ olarsa, $\sin^3\alpha - \cos^3\alpha$ ifadəsinin qiymətini tapın.

- A) $\dfrac{9}{16}$
- B) $\dfrac{5}{8}$
- C) $\dfrac{13}{16}$
- **D**) $\dfrac{11}{16}$
- E) $\dfrac{7}{16}$

> Əvvəlcə verilmiş bərabərliyin hər iki tərəfini kvadrata yüksəldərək $\sin\alpha\cos\alpha$ hasilini tapaq: $$(\sin\alpha - \cos\alpha)^2 = \left(\dfrac{1}{2}\right)^2$$ $$\sin^2\alpha - 2\sin\alpha\cos\alpha + \cos^2\alpha = \dfrac{1}{4}$$ $\sin^2\alpha + \cos^2\alpha = 1$ eyniliyini nəzərə alsaq: $$1 - 2\sin\alpha\cos\alpha = \dfrac{1}{4} \implies 2\sin\alpha\cos\alpha = \dfrac{3}{4} \implies \sin\alpha\cos\alpha = \dfrac{3}{8}$$ İndi isə kublar fərqi düsturunu tətbiq edək: $$\sin^3\alpha - \cos^3\alpha = (\sin\alpha - \cos\alpha)(\sin^2\alpha + \sin\alpha\cos\alpha + \cos^2\alpha)$$ Məlum qiymətləri yerinə yazaq: $$\sin^3\alpha - \cos^3\alpha = \dfrac{1}{2} \cdot \left(1 + \dfrac{3}{8}\right) = \dfrac{1}{2} \cdot \dfrac{11}{8} = \dfrac{11}{16}$$ Doğru cavab: D. Ən çox edilən səhv kublar fərqi düsturunun natamam kvadratında işarəni səhv götürməkdir.

### 2. Triqonometrik düsturlar — Köməkçi bucaq və çevirmə düsturları [orta]

İfadənin qiymətini hesablayın: $\dfrac{\cos 20^\circ - \sqrt{3}\sin 20^\circ}{\sin 10^\circ}$.

- A) $\dfrac{1}{2}$
- B) $4$
- C) $1$
- **D**) $2$
- E) $\sqrt{3}$

> Surətdə köməkçi bucaq daxil etmə üsulundan istifadə edərək ifadəni $2$-yə vurub bölək: $$\cos 20^\circ - \sqrt{3}\sin 20^\circ = 2\left(\dfrac{1}{2}\cos 20^\circ - \dfrac{\sqrt{3}}{2}\sin 20^\circ\right)$$ $\cos 60^\circ = \dfrac{1}{2}$ və $\sin 60^\circ = \dfrac{\sqrt{3}}{2}$ olduğunu nəzərə alsaq: $$2(\cos 60^\circ\cos 20^\circ - \sin 60^\circ\sin 20^\circ) = 2\cos(60^\circ + 20^\circ) = 2\cos 80^\circ$$ Çevirmə düsturuna əsasən: $$\cos 80^\circ = \cos(90^\circ - 10^\circ) = \sin 10^\circ$$ Kəsrdə yerinə yazsaq: $$\dfrac{2\cos 80^\circ}{\sin 10^\circ} = \dfrac{2\sin 10^\circ}{\sin 10^\circ} = 2$$ Doğru cavab: D.

### 3. Triqonometrik tənliklər — İkiqat bucaq və vuruqlara ayırma [orta]

$\sin 2x = \sqrt{3}\cos x$ tənliyinin $[0; \pi]$ parçasına daxil olan köklərinin cəmini tapın.

- A) $\dfrac{4\pi}{3}$
- **B**) $\dfrac{3\pi}{2}$
- C) $\pi$
- D) $\dfrac{5\pi}{6}$
- E) $2\pi$

> İkiqat bucağın sinus düsturundan istifadə edək: $$\sin 2x = 2\sin x \cos x$$ Tənliyi bir tərəfə keçirib ortaq vuruğu mötərizə xaricinə çıxaraq: $$2\sin x \cos x - \sqrt{3}\cos x = 0$$ $$\cos x (2\sin x - \sqrt{3}) = 0$$ Hasilin sıfır olması üçün vuruqlardan ən azı biri sıfır olmalıdır: 1) $\cos x = 0 \implies [0; \pi]$ parçasında $x_1 = \dfrac{\pi}{2}$; 2) $2\sin x - \sqrt{3} = 0 \implies \sin x = \dfrac{\sqrt{3}}{2} \implies [0; \pi]$ parçasında $x_2 = \dfrac{\pi}{3}$ və $x_3 = \pi - \dfrac{\pi}{3} = \dfrac{2\pi}{3}$. Köklərin cəmi: $$x_1 + x_2 + x_3 = \dfrac{\pi}{2} + \dfrac{\pi}{3} + \dfrac{2\pi}{3} = \dfrac{\pi}{2} + \pi = \dfrac{3\pi}{2}$$ Doğru cavab: B. Ən çox edilən səhv hər iki tərəfi $\cos x$-ə bölərək $\cos x = 0$ kökünü itirməkdir.

### 4. Tərs triqonometrik funksiyalar — Toplama düsturlarının tətbiqi [orta]

İfadənin qiymətini hesablayın: $\cos\left(\arcsin\dfrac{3}{5} + \arccos\dfrac{5}{13}\right)$.

- A) $\dfrac{56}{65}$
- B) $-\dfrac{56}{65}$
- C) $-\dfrac{33}{65}$
- D) $\dfrac{16}{65}$
- **E**) $-\dfrac{16}{65}$

> $\alpha = \arcsin\dfrac{3}{5}$ və $\beta = \arccos\dfrac{5}{13}$ əvəzləmələri aparaq. Arqumentlər müsbət olduğundan $\alpha, \beta \in \left(0; \dfrac{\pi}{2}\right)$. Buradan: $$\sin\alpha = \dfrac{3}{5} \implies \cos\alpha = \sqrt{1 - \left(\dfrac{3}{5}\right)^2} = \dfrac{4}{5}$$ $$\cos\beta = \dfrac{5}{13} \implies \sin\beta = \sqrt{1 - \left(\dfrac{5}{13}\right)^2} = \dfrac{12}{13}$$ Kosinuslar cəmi düsturunu tətbiq edək: $$\cos(\alpha + \beta) = \cos\alpha\cos\beta - \sin\alpha\sin\beta$$ Qiymətləri yerinə yazaq: $$\cos(\alpha + \beta) = \dfrac{4}{5} \cdot \dfrac{5}{13} - \dfrac{3}{5} \cdot \dfrac{12}{13} = \dfrac{20}{65} - \dfrac{36}{65} = -\dfrac{16}{65}$$ Doğru cavab: E. Ən çox edilən səhv kosinuslar cəmi düsturunda mənfi işarəsini müsbətlə qarışdırmaqdır.

### 5. Triqonometrik funksiyalar — Qiymətlər çoxluğu və ən kiçik qiymət [orta]

$f(x) = 3\cos^2 x - 4\sin x + 1$ funksiyasının ən kiçik qiymətini tapın.

- A) $0$
- **B**) $-3$
- C) $-6$
- D) $5$
- E) $-4$

> Əsas triqonometrik eynilikdən istifadə edərək $\cos^2 x$-i sinusla əvəz edək: $$\cos^2 x = 1 - \sin^2 x$$ Funksiyanı sadələşdirək: $$f(x) = 3(1 - \sin^2 x) - 4\sin x + 1 = -3\sin^2 x - 4\sin x + 4$$ $\sin x = t$ əvəzləməsi aparaq. Sinusun qiymətlər çoxluğuna görə $t \in [-1; 1]$. Kvadrat üçhədli alırıq: $$g(t) = -3t^2 - 4t + 4, \quad t \in [-1; 1]$$ Parabolanın təpə nöqtəsinin absisi: $$t_0 = -\dfrac{b}{2a} = -\dfrac{-4}{2 \cdot (-3)} = -\dfrac{2}{3} \in [-1; 1]$$ $a = -3 < 0$ olduğundan parabola təpə nöqtəsində ən böyük qiymətini alır. Ən kiçik qiymət isə parçanın uc nöqtələrindən birində alınır: $$g(-1) = -3(-1)^2 - 4(-1) + 4 = -3 + 4 + 4 = 5$$ $$g(1) = -3(1)^2 - 4(1) + 4 = -3 - 4 + 4 = -3$$ Deməli, funksiyanın ən kiçik qiyməti $-3$-dür. Doğru cavab: B.

## Riyaziyyat (1-ci qrup) — Həndəsə: üçbucaq, trapesiya, çevrə, silindr və konus — sahə və həcm (orta çətinlikdə) — 5 sual

### 1. Üçbucağın sahəsi və daxilinə çəkilmiş çevrə [orta]

Tərəfləri $13$, $14$ və $15$ olan üçbucağın daxilinə çəkilmiş çevrənin radiusunu tapın.

- A) $3{,}5$
- **B**) $4$
- C) $4{,}5$
- D) $5$
- E) $3$

> Daxilə çəkilmiş çevrənin radiusu düsturu: $$r = \dfrac{S}{p}$$ Burada $p$ yarımperimetrdir: $$p = \dfrac{13 + 14 + 15}{2} = 21$$ Heron düsturuna əsasən üçbucağın sahəsi: $$S = \sqrt{p(p-a)(p-b)(p-c)} = \sqrt{21 \cdot (21-13) \cdot (21-14) \cdot (21-15)}$$ $$S = \sqrt{21 \cdot 8 \cdot 7 \cdot 6} = \sqrt{7056} = 84$$ Daxilə çəkilmiş çevrənin radiusunu tapaq: $$r = \dfrac{84}{21} = 4$$ Doğru cavab: B. Ən çox edilən səhv yarımperimetr əvəzinə tam perimetrə bölməkdir.

Fiqur (saytda SVG kimi çəkilir): `{type=triangle, sides=[AB=13, BC=14, CA=15], angles=[, , ], rightAngleAt=null}`

### 2. Trapesiyanın sahəsi [orta]

Oturacaqları $4$ və $16$ olan bərabəryanlı trapesiyanın daxilinə çevrə çəkilmişdir. Trapesiyanın sahəsini tapın.

- A) $96$
- B) $64$
- C) $160$
- D) $40$
- **E**) $80$

> Dördbucaqlının daxilinə çevrə çəkildikdə qarşı tərəflərin cəmi bərabər olur: $$a + b = 2c$$ Burada $a = 4$ və $b = 16$ oturacaqlar, $c$ isə yan tərəfdir. $$2c = 4 + 16 = 20 \implies c = 10$$ Bərabəryanlı trapesiyanın hündürlüyünün böyük oturacaqdan ayırdığı kiçik parça: $$x = \dfrac{b - a}{2} = \dfrac{16 - 4}{2} = 6$$ Pifaqor teoreminə görə hündürlük: $$h = \sqrt{c^2 - x^2} = \sqrt{10^2 - 6^2} = \sqrt{64} = 8$$ Trapesiyanın sahəsi: $$S = \dfrac{a + b}{2} \cdot h = \dfrac{4 + 16}{2} \cdot 8 = 10 \cdot 8 = 80$$ Doğru cavab: E. Ən çox edilən səhv yan tərəfi hündürlük kimi qəbul edərək $100$ tapmaqdır.

Fiqur (saytda SVG kimi çəkilir): `{type=trapezoid, a=4, b=16, height=?}`

### 3. Dairə və onun hissələrinin sahəsi [orta]

Çevrədə uzunluğu $6\sqrt{3}$ olan vətərin gərdiyi qövsün dərəcə ölçüsü $120^\circ$-dir. Bu vətərin ayırdığı kiçik seqmentin sahəsini tapın.

- A) $12\pi - 6\sqrt{3}$
- B) $12\pi - 18\sqrt{3}$
- **C**) $12\pi - 9\sqrt{3}$
- D) $6\pi - 9\sqrt{3}$
- E) $36\pi - 9\sqrt{3}$

> Vətərin uzunluğu ilə radius arasındakı əlaqə: $$a = 2R \sin\dfrac{\alpha}{2}$$ Burada $\alpha = 120^\circ$ olduğuna görə: $$6\sqrt{3} = 2R \sin 60^\circ = 2R \cdot \dfrac{\sqrt{3}}{2} = R\sqrt{3} \implies R = 6$$ Seqmentin sahəsi sektorun sahəsi ilə uyğun üçbucağın sahəsinin fərqinə bərabərdir: $$S_{\text{seqment}} = S_{\text{sektor}} - S_{\triangle}$$ Sektorun sahəsi: $$S_{\text{sektor}} = \dfrac{\pi R^2 \cdot 120^\circ}{360^\circ} = \dfrac{\pi \cdot 36}{3} = 12\pi$$ Mərkəzi üçbucağın sahəsi: $$S_{\triangle} = \dfrac{1}{2} R^2 \sin 120^\circ = \dfrac{1}{2} \cdot 36 \cdot \dfrac{\sqrt{3}}{2} = 9\sqrt{3}$$ Beləliklə, seqmentin sahəsi $12\pi - 9\sqrt{3}$ olar. Doğru cavab: C. Ən çox edilən səhv sektor sahəsini hesablayarkən bucağı tam çevrəyə nisbətdə düzgün nəzərə almamaqdır.

Fiqur (saytda SVG kimi çəkilir): `{type=circle, radius=6}`

### 4. Silindrin həcmi və kəsikləri [orta]

Silindrin ox kəsiyi sahəsi $36$ olan kvadratdır. Silindrin həcmini tapın.

- A) $72\pi$
- **B**) $54\pi$
- C) $108\pi$
- D) $27\pi$
- E) $36\pi$

> Silindrin ox kəsiyi kvadrat olduğundan onun tərəfi $a = \sqrt{36} = 6$ olar. Ox kəsiyinin tərəfləri silindrin hündürlüyünə və oturacağının diametrinə bərabərdir: $$H = 6$$ $$2R = 6 \implies R = 3$$ Silindrin həcm düsturu: $$V = \pi R^2 H$$ Kəmiyyətləri yerinə yazaq: $$V = \pi \cdot 3^2 \cdot 6 = \pi \cdot 9 \cdot 6 = 54\pi$$ Doğru cavab: B. Ən çox edilən səhv diametri radius kimi götürüb həcmi $216\pi$ və ya ox kəsiyinin sahəsi ilə qarışdıraraq $36\pi$ almaqdır.

Fiqur (saytda SVG kimi çəkilir): `{type=cylinder, radius=?, height=?}`

### 5. Konusun həcmi və ox kəsiyi [orta]

Konusun ox kəsiyi tərəfi $12$ olan bərabərtərəfli üçbucaqdır. Konusun həcmini tapın.

- A) $108\sqrt{3}\pi$
- B) $36\sqrt{3}\pi$
- **C**) $72\sqrt{3}\pi$
- D) $48\sqrt{3}\pi$
- E) $144\sqrt{3}\pi$

> Konusun ox kəsiyi bərabərtərəfli üçbucaq olduqda oturacağın diametri və doğuran bu üçbucağın tərəfinə bərabər olur: $$2R = 12 \implies R = 6$$ Doğuran $l = 12$-dir. Bərabərtərəfli üçbucağın hündürlüyü konusun hündürlüyünə bərabərdir: $$H = \dfrac{a\sqrt{3}}{2} = \dfrac{12\sqrt{3}}{2} = 6\sqrt{3}$$ Konusun həcm düsturu: $$V = \dfrac{1}{3}\pi R^2 H$$ Qiymətləri yerinə yazaq: $$V = \dfrac{1}{3}\pi \cdot 6^2 \cdot 6\sqrt{3} = \dfrac{1}{3}\pi \cdot 36 \cdot 6\sqrt{3} = 72\sqrt{3}\pi$$ Doğru cavab: C. Ən çox edilən səhv konusun həcm düsturundakı $\dfrac{1}{3}$ əmsalını unudaraq silindr kimi hesablamaq və $216\sqrt{3}\pi$ almaqdır.

Fiqur (saytda SVG kimi çəkilir): `{type=cone, radius=?, height=?}`

## AI Müəllim nümunəsi

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

## Problemlər

Yoxdur ✅