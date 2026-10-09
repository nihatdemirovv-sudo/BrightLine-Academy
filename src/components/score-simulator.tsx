"use client";
import { useCallback, useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import type {
  ScoreSimulatorPostResult,
  FennNetice,
  FennBal,
} from "@/lib/api";

interface BuraxilisInput {
  fenn: string;
  qapaliDogru: number;
  aciqKodDogru?: number;
  yaziliDogru: number;
}

interface BlokInput {
  fenn: string;
  qapaliDogru: number;
  qapaliYanlis: number;
  aciqKodDogru: number;
  yaziliSual1: number;
  yaziliSual2: number;
  yaziliSual3: number;
}

const BURAXILIS_DEFAULTS: BuraxilisInput[] = [
  { fenn: "Azərbaycan dili", qapaliDogru: 0, yaziliDogru: 0 },
  { fenn: "Riyaziyyat", qapaliDogru: 0, aciqKodDogru: 0, yaziliDogru: 0 },
  { fenn: "Xarici dil", qapaliDogru: 0, yaziliDogru: 0 },
];

function makeBlokDefaults(fennler: string[]): BlokInput[] {
  return fennler.map((fenn) => ({
    fenn,
    qapaliDogru: 0,
    qapaliYanlis: 0,
    aciqKodDogru: 0,
    yaziliSual1: 0,
    yaziliSual2: 0,
    yaziliSual3: 0,
  }));
}

const BURAXILIS_MAX: Record<string, { qapali: number; kod: number; yazili: number }> = {
  "Azərbaycan dili": { qapali: 20, kod: 0, yazili: 10 },
  Riyaziyyat: { qapali: 13, kod: 5, yazili: 7 },
  "Xarici dil": { qapali: 23, kod: 0, yazili: 7 },
};

const BLOK_MAX = { qapali: 22, kod: 5, yazili: 3 };

const BLOK_QRUP_FENLERI: Record<string, string[]> = {
  "1": ["Riyaziyyat", "Fizika", "Kimya"],
  "1-i": ["Riyaziyyat", "Fizika", "İnformatika"],
  "2": ["Riyaziyyat", "Coğrafiya", "Tarix"],
  "3-dt": ["Azərbaycan dili", "Tarix", "Ədəbiyyat"],
  "3-tc": ["Azərbaycan dili", "Tarix", "Coğrafiya"],
  "4": ["Biologiya", "Kimya", "Fizika"],
  // 5-ci qrup: tək mərhələli (yalnız Buraxılış), blok fənni yoxdur.
  "5": [],
};

const BLOK_EMSALLAR: Record<string, Record<string, number>> = {
  "1": { Riyaziyyat: 1.5, Fizika: 1.5, Kimya: 1.0 },
  "1-i": { Riyaziyyat: 1.5, Fizika: 1.5, İnformatika: 1.0 },
  "2": { Riyaziyyat: 1.5, Coğrafiya: 1.5, Tarix: 1.0 },
  "3-dt": { "Azərbaycan dili": 1.5, Tarix: 1.5, Ədəbiyyat: 1.0 },
  "3-tc": { "Azərbaycan dili": 1.5, Tarix: 1.5, Coğrafiya: 1.0 },
  "4": { Biologiya: 1.5, Kimya: 1.0, Fizika: 1.0 },
  "5": {},
};

const BLOK_QRUP_LABELS: Record<string, string> = {
  "1": "1-ci qrup (Riyaziyyat, Fizika, Kimya)",
  "1-i": "1-ci qrup (Riyaziyyat, Fizika, İnformatika)",
  "2": "2-ci qrup (Riyaziyyat, Coğrafiya, Tarix)",
  "3-dt": "3-cü qrup DT (Az dili, Tarix, Ədəbiyyat)",
  "3-tc": "3-cü qrup TC (Az dili, Tarix, Coğrafiya)",
  "4": "4-cü qrup (Biologiya, Kimya, Fizika)",
  "5": "5-ci qrup (yalnız Buraxılış, blok yoxdur)",
};

function buraxilisBalLive(inp: BuraxilisInput): number {
  const mx = BURAXILIS_MAX[inp.fenn];
  if (!mx) return 0;
  const dQ = inp.qapaliDogru || 0;
  const dK = inp.aciqKodDogru || 0;
  const dY = inp.yaziliDogru || 0;
  if (inp.fenn === "Riyaziyyat") {
    return Math.round(((dQ + dK + 2 * dY) / 32) * 100 * 10) / 10;
  }
  return Math.round(((dQ + 2 * dY) / (inp.fenn === "Xarici dil" ? 37 : 40)) * 100 * 10) / 10;
}

function blokBalLive(inp: BlokInput, emsal: number): number {
  const dQ = inp.qapaliDogru || 0;
  const yQ = inp.qapaliYanlis || 0;
  const dK = inp.aciqKodDogru || 0;
  const yMax = emsal >= 1.5 ? 3 : 2;
  const dY = ((inp.yaziliSual1 || 0) + (inp.yaziliSual2 || 0) + (inp.yaziliSual3 || 0)) / yMax;
  const nbq = Math.max(0, dQ - yQ / 4);
  const nba = dK + 2 * dY;
  const nb = ((nbq + nba) / 33) * 100;
  return Math.max(0, Math.round(nb * 10) / 10);
}

function Panel({
  title,
  badge,
  children,
}: {
  title: string;
  badge?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative rounded-2xl border border-white/[0.06] bg-[#0d0f14] p-5 sm:p-6 shadow-glass">
      <div className="flex items-center gap-3 mb-4">
        <div className="h-2 w-2 rounded-full bg-accent-glow shadow-[0_0_10px_var(--accent-glow)]" />
        <h3 className="text-sm font-semibold tracking-wide text-white/80 uppercase">
          {title}
        </h3>
        {badge && (
          <span className="ml-auto text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/[0.05] text-white/40 border border-white/[0.08]">
            {badge}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

function NumberInput({
  label,
  value,
  onChange,
  max,
  className,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  max?: number;
  className?: string;
}) {
  return (
    <label className={`flex flex-col gap-1.5 ${className ?? ""}`}>
      <span className="text-[11px] font-medium text-white/45 uppercase tracking-wider">
        {label}
      </span>
      <input
        type="number"
        inputMode="numeric"
        min={0}
        max={max}
        value={value || ""}
        onChange={(e) => {
          const v = parseInt(e.target.value, 10);
          if (!isNaN(v)) onChange(Math.min(max ?? 999, Math.max(0, v)));
          else onChange(0);
        }}
        className="h-10 w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 text-sm font-mono text-white outline-none transition placeholder:text-white/20 focus:border-accent/40 focus:bg-accent/[0.03]"
      />
    </label>
  );
}

// Yazılı suallar hər biri 3 balla qiymətləndirildiyi üçün toplanan kəsr
// dəyər 1/3-ün misli olur (…,333 / …,667). Ən yaxın 1/3-ə yuvarlaqlaşdırır.
function snapToThird(v: number): number {
  return Math.round(v * 3) / 3;
}

function formatThird(v: number): string {
  const thirds = Math.round(v * 3);
  const whole = Math.floor(thirds / 3);
  const rem = thirds % 3;
  if (rem === 0) return String(whole);
  if (rem === 1) return `${whole}.333`;
  return `${whole}.667`;
}

function FloatInput({
  label,
  value,
  onChange,
  max,
  className,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  max?: number;
  className?: string;
}) {
  const [text, setText] = useState(value ? formatThird(value) : "");

  useEffect(() => {
    setText(value ? formatThird(value) : "");
  }, [value]);

  return (
    <label className={`flex flex-col gap-1.5 ${className ?? ""}`}>
      <span className="text-[11px] font-medium text-white/45 uppercase tracking-wider">
        {label}
      </span>
      <input
        type="number"
        inputMode="decimal"
        step="0.01"
        min={0}
        max={max}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={(e) => {
          const v = parseFloat(e.target.value);
          if (isNaN(v)) {
            setText("");
            onChange(0);
            return;
          }
          const clamped = Math.min(max ?? 999, Math.max(0, v));
          const snapped = snapToThird(clamped);
          onChange(snapped);
          setText(snapped ? formatThird(snapped) : "");
        }}
        className="h-10 w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 text-sm font-mono text-white outline-none transition placeholder:text-white/20 focus:border-accent/40 focus:bg-accent/[0.03]"
      />
    </label>
  );
}

function BuraxilisCard({
  inp,
  onChange,
}: {
  inp: BuraxilisInput;
  onChange: (inp: BuraxilisInput) => void;
}) {
  const mx = BURAXILIS_MAX[inp.fenn];
  const bal = buraxilisBalLive(inp);
  const hasKod = (mx?.kod ?? 0) > 0;
  const totalMax = (mx?.qapali ?? 0) + (mx?.kod ?? 0) + (mx?.yazili ?? 0);
  const filled =
    (inp.qapaliDogru || 0) + (inp.aciqKodDogru || 0) + (inp.yaziliDogru || 0);

  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold text-white/80">{inp.fenn}</h4>
        <span
          className={`text-lg font-bold tabular-nums ${
            bal >= 70
              ? "text-emerald-400"
              : bal >= 40
                ? "text-amber-400"
                : "text-red-400"
          }`}
        >
          {bal}
          <span className="text-xs font-normal text-white/30 ml-1">/100</span>
        </span>
      </div>

      <div
        className={`grid gap-3 ${hasKod ? "grid-cols-3" : "grid-cols-2"}`}
      >
        <NumberInput
          label={`Qapalı (0-${mx?.qapali ?? 0})`}
          value={inp.qapaliDogru}
          max={mx?.qapali}
          onChange={(v) => onChange({ ...inp, qapaliDogru: v })}
        />
        {hasKod && (
          <NumberInput
            label={`Açıq kod (0-${mx?.kod})`}
            value={inp.aciqKodDogru ?? 0}
            max={mx?.kod}
            onChange={(v) => onChange({ ...inp, aciqKodDogru: v })}
          />
        )}
        <FloatInput
          label={`Yazılı (0-${mx?.yazili}, kəsr ola bilər)`}
          value={inp.yaziliDogru}
          max={mx?.yazili}
          onChange={(v) => onChange({ ...inp, yaziliDogru: v })}
        />
      </div>

      <div className="mt-2 flex items-center justify-between">
        <span className="text-[10px] text-white/30 font-mono">
          {filled}/{totalMax} sual doldurulub
        </span>
        <span className="text-[10px] text-white/30">
          {inp.fenn === "Riyaziyyat"
            ? "NB = (Q + K + 2Y) / 32 × 100"
            : `NB = (Q + 2Y) / ${inp.fenn === "Xarici dil" ? 37 : 40} × 100`}
        </span>
      </div>
    </div>
  );
}

function YaziliInput({
  label,
  value,
  max,
  onChange,
}: {
  label: string;
  value: number;
  max: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[11px] font-medium text-white/45 uppercase tracking-wider">
        {label}
      </span>
      <div className="flex items-center h-10 rounded-lg border border-white/[0.08] bg-white/[0.03] overflow-hidden transition focus-within:border-accent/40 focus-within:bg-accent/[0.03]">
        <input
          type="number"
          inputMode="numeric"
          min={0}
          max={max}
          value={value || ""}
          onChange={(e) => {
            const v = parseInt(e.target.value, 10);
            if (!isNaN(v)) onChange(Math.min(max, Math.max(0, v)));
            else onChange(0);
          }}
          className="flex-1 h-full bg-transparent px-3 text-sm font-mono text-white outline-none placeholder:text-white/20 text-center"
        />
        <span className="px-2 text-sm font-mono text-white/30 border-l border-white/[0.06]">
          /{max}
        </span>
      </div>
    </div>
  );
}

function BlokCard({
  inp,
  emsal,
  onChange,
}: {
  inp: BlokInput;
  emsal: number;
  onChange: (inp: BlokInput) => void;
}) {
  const bal = blokBalLive(inp, emsal);
  const emBal = Math.round(bal * emsal * 10) / 10;
  const totalQapali = (inp.qapaliDogru || 0) + (inp.qapaliYanlis || 0);
  const yMax = emsal >= 1.5 ? 3 : 2;
  const ySum = (inp.yaziliSual1 || 0) + (inp.yaziliSual2 || 0) + (inp.yaziliSual3 || 0);

  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
      <div className="flex items-center justify-between mb-1">
        <h4 className="text-sm font-semibold text-white/80">{inp.fenn}</h4>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-accent/10 text-accent/80 border border-accent/20">
            ×{emsal}
          </span>
          <span
            className={`text-lg font-bold tabular-nums ${
              emBal >= 75
                ? "text-emerald-400"
                : emBal >= 40
                  ? "text-amber-400"
                  : "text-red-400"
            }`}
          >
            {emBal}
            <span className="text-xs font-normal text-white/30 ml-1">
              /{Math.round(100 * emsal)}
            </span>
          </span>
        </div>
      </div>
      <p className="text-[10px] text-white/30 mb-3 font-mono">
        NB = (NBq + NBa) / 33 × 100 × {emsal}
      </p>

      <div className="grid grid-cols-2 gap-3">
        <NumberInput
          label={`Qapalı düz (0-${BLOK_MAX.qapali})`}
          value={inp.qapaliDogru}
          max={BLOK_MAX.qapali}
          onChange={(v) => onChange({ ...inp, qapaliDogru: v })}
        />
        <NumberInput
          label="Qapalı səhv"
          value={inp.qapaliYanlis}
          max={BLOK_MAX.qapali - (inp.qapaliDogru || 0)}
          onChange={(v) => onChange({ ...inp, qapaliYanlis: v })}
        />
        <NumberInput
          label={`Açıq kod (0-${BLOK_MAX.kod})`}
          value={inp.aciqKodDogru}
          max={BLOK_MAX.kod}
          onChange={(v) => onChange({ ...inp, aciqKodDogru: v })}
        />
      </div>

      <div className="mt-3">
        <span className="text-[11px] font-medium text-white/45 uppercase tracking-wider">
          Yazılı suallar
        </span>
        <div className="grid grid-cols-3 gap-2 mt-1.5">
          <YaziliInput
            label="Sual 1"
            value={inp.yaziliSual1}
            max={yMax}
            onChange={(v) => onChange({ ...inp, yaziliSual1: v })}
          />
          <YaziliInput
            label="Sual 2"
            value={inp.yaziliSual2}
            max={yMax}
            onChange={(v) => onChange({ ...inp, yaziliSual2: v })}
          />
          <YaziliInput
            label="Sual 3"
            value={inp.yaziliSual3}
            max={yMax}
            onChange={(v) => onChange({ ...inp, yaziliSual3: v })}
          />
        </div>
        <p className="text-[10px] text-white/25 mt-1 font-mono">
          Dyazılı = ({inp.yaziliSual1 || 0}+{inp.yaziliSual2 || 0}+{inp.yaziliSual3 || 0})/{yMax} = {(ySum / yMax).toFixed(2)}
        </p>
      </div>

      {totalQapali > BLOK_MAX.qapali && (
        <p className="text-[10px] text-red-400/80 mt-2">
          Qapalı düz + səhv &gt; {BLOK_MAX.qapali} (maksimum)
        </p>
      )}
    </div>
  );
}

export function ScoreSimulator() {
  const sessionId = useStore((s) => s.sessionId);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [buraxilis, setBuraxilis] = useState<BuraxilisInput[]>(BURAXILIS_DEFAULTS);
  const [blokQrup, setBlokQrup] = useState("1");
  const [blok, setBlok] = useState<BlokInput[]>(makeBlokDefaults(BLOK_QRUP_FENLERI["1"]));

  const [result, setResult] = useState<ScoreSimulatorPostResult | null>(null);
  const [history, setHistory] = useState<ScoreSimulatorPostResult[]>([]);
  const [view, setView] = useState<"input" | "result" | "history">("input");

  useEffect(() => {
    const defaultQrup = localStorage.getItem("qrup") || "1";
    setBlokQrup(defaultQrup);
    setBlok(makeBlokDefaults(BLOK_QRUP_FENLERI[defaultQrup]));
  }, []);

  const handleQrupChange = useCallback((q: string) => {
    setBlokQrup(q);
    setBlok(makeBlokDefaults(BLOK_QRUP_FENLERI[q]));
  }, []);

  const isQrup5 = blokQrup === "5";
  const buraxilisTotal = buraxilis.reduce((s, i) => s + buraxilisBalLive(i), 0);
  const blokTotal = blok.reduce(
    (s, i) => s + blokBalLive(i, BLOK_EMSALLAR[blokQrup]?.[i.fenn] ?? 1) * (BLOK_EMSALLAR[blokQrup]?.[i.fenn] ?? 1),
    0
  );
  const umumiBal = Math.round((buraxilisTotal + blokTotal) * 10) / 10;
  const maksimalBal = isQrup5 ? 300 : 700;

  const handleSubmit = useCallback(async () => {
    if (!sessionId) return;
    setLoading(true);
    setError("");
    try {
      const fennNetice: FennNetice[] = [
        ...buraxilis.map((b) => {
          const mx = BURAXILIS_MAX[b.fenn];
          const toplamSual = (mx?.qapali ?? 0) + (mx?.kod ?? 0) + (mx?.yazili ?? 0);
          return {
            fenn: b.fenn,
            dogru: (b.qapaliDogru || 0) + (b.aciqKodDogru || 0) + (b.yaziliDogru || 0),
            sehv: 0,
            bos: toplamSual - (b.qapaliDogru || 0) - (b.aciqKodDogru || 0) - (b.yaziliDogru || 0),
            toplamSual,
            merhele: "buraxilis" as const,
            emsal: 1,
            qapaliDogru: b.qapaliDogru,
            qapaliYanlis: 0,
            aciqKodDogru: b.aciqKodDogru ?? 0,
            yaziliDogru: b.yaziliDogru,
          };
        }),
        ...blok.map((b) => {
          const emsal = BLOK_EMSALLAR[blokQrup]?.[b.fenn] ?? 1;
          const yMax = emsal >= 1.5 ? 3 : 2;
          const yaziliDogru = ((b.yaziliSual1 || 0) + (b.yaziliSual2 || 0) + (b.yaziliSual3 || 0)) / yMax;
          return {
            fenn: b.fenn,
            dogru: (b.qapaliDogru || 0) + (b.aciqKodDogru || 0) + Math.round(yaziliDogru),
            sehv: b.qapaliYanlis || 0,
            bos: BLOK_MAX.qapali - (b.qapaliDogru || 0) - (b.qapaliYanlis || 0),
            toplamSual: 30,
            merhele: "blok" as const,
            emsal,
            qapaliDogru: b.qapaliDogru,
            qapaliYanlis: b.qapaliYanlis,
            aciqKodDogru: b.aciqKodDogru,
            yaziliDogru,
          };
        }),
      ];

      const res = await fetch("/api/score-simulator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, fennNetice }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error || "Xəta baş verdi");
      }
      const data: ScoreSimulatorPostResult = await res.json();
      setResult(data);
      setHistory((prev) => [data, ...prev]);
      setView("result");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Naməlum xəta");
    } finally {
      setLoading(false);
    }
  }, [sessionId, buraxilis, blok, blokQrup]);

  return (
    <div className="w-full max-w-5xl mx-auto space-y-4 rounded-3xl bg-[#0a0c10] p-4 sm:p-6">
      <button
        onClick={() => {
          useStore.setState({ view: "app" });
        }}
        className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 transition"
      >
        <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2}>
          <path d="M15 18l-6-6 6-6" />
        </svg>
        Geri
      </button>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white/90">Bal Hesablayıcı</h2>
          <p className="text-xs text-white/40 mt-1">
            DİM rəsmi formulaları ilə buraxılış və blok ballarınızı hesablayın
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold tabular-nums text-white/90">
            {umumiBal}
          </span>
          <span className="text-sm text-white/30 font-medium">/ {maksimalBal}</span>
        </div>
      </div>

      {error && (
        <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {view === "input" && (
        <div className="space-y-4">
          {/* QRUP SEÇİMİ */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 rounded-2xl border border-white/[0.06] bg-[#0d0f14] p-4 shadow-glass">
            <label className="text-[11px] font-medium text-white/45 uppercase tracking-wider">
              Qrup
            </label>
            <select
              value={blokQrup}
              onChange={(e) => handleQrupChange(e.target.value)}
              className="h-9 rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 text-sm text-white/80 outline-none transition focus:border-accent/40 w-80"
            >
              <optgroup label="1-ci qrup">
                <option value="1">Riyaziyyat + Fizika + Kimya</option>
                <option value="1-i">Riyaziyyat + Fizika + İnformatika</option>
              </optgroup>
              <optgroup label="2-ci qrup">
                <option value="2">Riyaziyyat + Coğrafiya + Tarix</option>
              </optgroup>
              <optgroup label="3-cü qrup">
                <option value="3-dt">DT: Az dili + Tarix + Ədəbiyyat</option>
                <option value="3-tc">TC: Az dili + Tarix + Coğrafiya</option>
              </optgroup>
              <optgroup label="4-cü qrup">
                <option value="4">Biologiya + Kimya + Fizika</option>
              </optgroup>
              <optgroup label="5-ci qrup">
                <option value="5">Yalnız Buraxılış (Blok yoxdur, 300 bal)</option>
              </optgroup>
            </select>
          </div>

          {/* BURAXILIŞ BÖLMƏSİ */}
          <Panel title="I Mərhələ — Buraxılış" badge="300 bal max">
            <p className="text-[11px] text-white/35 mb-4">
              Sabit fənlər: Azərbaycan dili, Riyaziyyat, Xarici dil. Hər fənn 100 baldır.
              Səhv cavablar düzgünə təsir etmir. Yazılı suallar 2x çəki ilə hesablanır.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {buraxilis.map((inp, idx) => (
                <BuraxilisCard
                  key={inp.fenn}
                  inp={inp}
                  onChange={(updated) => {
                    const next = [...buraxilis];
                    next[idx] = updated;
                    setBuraxilis(next);
                  }}
                />
              ))}
            </div>
            <div className="mt-3 flex items-center justify-between px-1">
              <span className="text-xs text-white/30">Buraxılış cəmi</span>
              <span className="text-sm font-bold tabular-nums text-accent">
                {Math.round(buraxilisTotal * 10) / 10}
                <span className="text-xs font-normal text-white/30 ml-1">/300</span>
              </span>
            </div>
          </Panel>

          {/* BLOK BÖLMƏSİ — 5-ci qrupda blok mərhələsi yoxdur */}
          {!isQrup5 && (
            <Panel title="II Mərhələ — Blok" badge="400 bal max">
              <p className="text-[11px] text-white/35 mb-4">
                Hər fənn: 22 qapalı + 5 açıq kod + 3 yazılı = 30 sual.
                Qapalıda hər 4 yanlış 1 düz silir. Yazılı suallar 2x çəki ilə hesablanır.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {blok.map((inp, idx) => (
                  <BlokCard
                    key={`${blokQrup}-${inp.fenn}`}
                    inp={inp}
                    emsal={BLOK_EMSALLAR[blokQrup]?.[inp.fenn] ?? 1}
                    onChange={(updated) => {
                      const next = [...blok];
                      next[idx] = updated;
                      setBlok(next);
                    }}
                  />
                ))}
              </div>
              <div className="mt-3 flex items-center justify-between px-1">
                <span className="text-xs text-white/30">Blok cəmi (əmsallı)</span>
                <span className="text-sm font-bold tabular-nums text-accent">
                  {Math.round(blokTotal * 10) / 10}
                  <span className="text-xs font-normal text-white/30 ml-1">/400</span>
                </span>
              </div>
            </Panel>
          )}
          {isQrup5 && (
            <div className="rounded-2xl border border-white/[0.06] bg-[#0d0f14] p-4 text-xs text-white/40 shadow-glass">
              5-ci qrupda II Mərhələ (Blok) yoxdur — yalnız Buraxılış imtahanı verilir, ümumi bal 300 üzərindəndir.
            </div>
          )}

          {/* HESABLA */}
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full h-12 rounded-xl bg-accent/90 text-white text-sm font-semibold shadow-lg shadow-accent/20 transition hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
          >
            {loading ? "Hesablanır..." : "Hesabla"}
          </button>
        </div>
      )}

      {view === "result" && result && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setView("input")}
              className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 transition"
            >
              <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M15 18l-6-6 6-6" />
              </svg>
              Geri
            </button>
            <button
              onClick={() => setView("history")}
              className="ml-auto flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 transition"
            >
              Tarix
              <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-white/90">Nəticə</h2>
              <p className="text-xs text-white/40 mt-1">
                {new Date().toLocaleDateString("az-Latn")}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-3xl font-bold tabular-nums text-white/90">
                {result.bal}
              </span>
              <span className="text-sm text-white/30 font-medium">/ {result.maksimalBal}</span>
            </div>
          </div>

          <div className={`grid grid-cols-1 gap-3 ${result.maksimalBal === 300 ? "sm:grid-cols-2" : "sm:grid-cols-3"}`}>
            <div className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-4">
              <p className="text-[11px] text-white/40 uppercase tracking-wider mb-1">
                Buraxılış
              </p>
              <p className="text-xl font-bold tabular-nums text-white/80">
                {result.buraxilisBal}
                <span className="text-xs font-normal text-white/30 ml-1">/300</span>
              </p>
            </div>
            {result.maksimalBal !== 300 && (
              <div className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-4">
                <p className="text-[11px] text-white/40 uppercase tracking-wider mb-1">
                  Blok
                </p>
                <p className="text-xl font-bold tabular-nums text-white/80">
                  {result.blokBal}
                  <span className="text-xs font-normal text-white/30 ml-1">/400</span>
                </p>
              </div>
            )}
            <div className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-4">
              <p className="text-[11px] text-white/40 uppercase tracking-wider mb-1">
                Qəbul ehtimalı
              </p>
              <p className="text-xl font-bold tabular-nums text-white/80">
                {result.qebulEhtimali}
                <span className="text-xs font-normal text-white/30 ml-1">%</span>
              </p>
            </div>
          </div>

          {result.fennBallari && result.fennBallari.length > 0 && (
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
              <p className="text-[11px] text-white/40 uppercase tracking-wider mb-3">
                Fənn üzrə nəticələr
              </p>
              <div className="space-y-3">
                {result.fennBallari.map((fb: FennBal & { sualTipi?: string }) => (
                  <div
                    key={`${fb.fenn}-${fb.merhele}`}
                    className="flex items-center gap-3"
                  >
                    <span className="text-xs text-white/60 w-28 shrink-0 truncate">
                      {fb.fenn}
                    </span>
                    <div className="relative flex-1 h-2 rounded-full bg-white/[0.06] overflow-hidden">
                      <div
                        className="absolute inset-y-0 left-0 rounded-full bg-accent/60 transition-all duration-500"
                        style={{
                          width: `${Math.min(100, fb.maksimal > 0 ? (fb.bal / fb.maksimal) * 100 : 0)}%`,
                        }}
                      />
                    </div>
                    <span className="text-xs font-mono tabular-nums text-white/60 w-16 text-right">
                      {fb.bal}/{fb.maksimal}
                    </span>
                    {fb.emsal !== 1 && (
                      <span className="text-[10px] font-mono px-1 py-0.5 rounded bg-accent/10 text-accent/70">
                        ×{fb.emsal}
                      </span>
                    )}
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                        fb.merhele === "buraxilis"
                          ? "bg-blue-500/10 text-blue-400/70"
                          : "bg-purple-500/10 text-purple-400/70"
                      }`}
                    >
                      {fb.merhele === "buraxilis" ? "buraxılış" : "blok"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {result.analiz && (
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
              <p className="text-[11px] text-white/40 uppercase tracking-wider mb-2">
                AI Təhlil
              </p>
              <p className="text-sm text-white/60 leading-relaxed whitespace-pre-wrap">
                {result.analiz}
              </p>
            </div>
          )}

          <button
            onClick={() => setView("input")}
            className="w-full h-12 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white/70 text-sm font-medium transition hover:bg-white/[0.06] active:scale-[0.98]"
          >
            Yenidən hesabla
          </button>
        </div>
      )}

      {view === "history" && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setView(result ? "result" : "input")}
              className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 transition"
            >
              <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M15 18l-6-6 6-6" />
              </svg>
              Geri
            </button>
          </div>

          <div>
            <h2 className="text-xl font-bold text-white/90">Tarixçə</h2>
            <p className="text-xs text-white/40 mt-1">
              Son simulyasiya nəticələri
            </p>
          </div>

          {history.length === 0 ? (
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-8 text-center">
              <p className="text-sm text-white/30">Hələ heç bir simulyasiya yoxdur</p>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((h) => (
                <div
                  key={h.id}
                  className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-white/40">
                      {new Date(h.createdAt).toLocaleDateString("az-Latn")}
                    </span>
                    <span className="text-lg font-bold tabular-nums text-white/80">
                      {h.bal}
                      <span className="text-xs font-normal text-white/30 ml-1">/{h.maksimalBal}</span>
                    </span>
                  </div>
                  <div className="flex gap-4 text-xs text-white/40">
                    <span>Buraxılış: {h.buraxilisBal}/300</span>
                    {h.maksimalBal !== 300 && <span>Blok: {h.blokBal}/400</span>}
                    <span>Qəbul: {h.qebulEhtimali}%</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
