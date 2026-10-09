"use client";

import * as React from "react";
import { Landmark, Sparkles, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { api } from "@/lib/api";
import type { UniversityMatchResult, UniversityMatch as UniversityMatchItem } from "@/lib/api";
import { useStore } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const QRUP_OPTIONS = [
  { value: "1", label: "1-ci Qrup" },
  { value: "2", label: "2-ci Qrup" },
  { value: "3", label: "3-cü Qrup" },
  { value: "4", label: "4-cü Qrup" },
];

type Rejim = "abituriyent" | "magistr";

// I qrup (Rİ/RK) və III qrup (DT/TC) DİM-in rəsmi altqruplarıdır — II və IV qrupda seçim yoxdur.
const ALT_QRUP_OPTIONS: Record<string, { value: string; label: string }[]> = {
  "1": [
    { value: "ri", label: "İnformatika (İKT — Rİ)" },
    { value: "rk", label: "Kimya (Mühəndislik — RK)" },
  ],
  "3": [
    { value: "dt", label: "Dil-Tarix (Hüquq, Filologiya, Jurnalistika və s. — DT)" },
    { value: "tc", label: "Tarix-Coğrafiya (Beynəlxalq münasibətlər, Regionşünaslıq — TC)" },
  ],
};

function MatchRow({ m }: { m: UniversityMatchItem }) {
  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-xl border p-3",
        m.kecir ? "border-accent/30 bg-accent/5" : "border-border"
      )}
    >
      {m.kecir ? (
        <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-accent" />
      ) : (
        <XCircle className="mt-0.5 size-4 shrink-0 text-destructive/60" />
      )}
      {/* Universitet/ixtisas adları uzun ola bilər — kəsilib (truncate) itməsin deyə
          sətir sərbəst bükülür (break-words), lazım gələrsə bir neçə sətrə düşür. */}
      <div className="min-w-0 flex-1">
        <p className="break-words text-sm font-semibold leading-snug">{m.universitet}</p>
        <p className="break-words text-xs leading-snug text-muted-foreground">
          {m.ixtisas}
          {m.tehsilNovu && <span className="ml-1.5 text-[10px] text-muted-foreground/70">· {m.tehsilNovu}</span>}
        </p>
      </div>
      <div className="shrink-0 text-right">
        <p className="font-stat text-sm font-bold tabular-nums">{m.minBal}</p>
        <p
          className={cn(
            "text-[11px] font-medium tabular-nums",
            m.kecir ? "text-accent" : "text-destructive"
          )}
        >
          {m.kecir ? `+${m.ferq}` : m.ferq}
        </p>
      </div>
    </div>
  );
}

export function UniversityMatch() {
  const sessionId = useStore((s) => s.sessionId) || "";
  const student = useStore((s) => s.student);
  const { toast } = useToast();

  const [rejim, setRejim] = React.useState<Rejim>(student?.qrup === "magistr" ? "magistr" : "abituriyent");
  const [bal, setBal] = React.useState("");
  const [qrup, setQrup] = React.useState("1");
  const [altQrup, setAltQrup] = React.useState("ri");
  const [istek, setIstek] = React.useState("");

  const altQrupOptions = rejim === "magistr" ? undefined : ALT_QRUP_OPTIONS[qrup];
  const effectiveQrup = rejim === "magistr" ? "magistr" : qrup;

  function handleQrupChange(v: string) {
    setQrup(v);
    setAltQrup(ALT_QRUP_OPTIONS[v]?.[0]?.value ?? "");
  }

  const [data, setData] = React.useState<UniversityMatchResult | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [loaded, setLoaded] = React.useState(false);

  function changeRejim(r: Rejim) {
    if (r === rejim) return;
    setRejim(r);
    setData(null);
    setLoaded(false);
  }

  const load = React.useCallback(async () => {
    if (!sessionId) return;
    const balNum = parseFloat(bal.replace(",", "."));
    if (!balNum || balNum <= 0) {
      toast({ variant: "destructive", title: "Balını daxil et" });
      return;
    }
    setLoading(true);
    try {
      const r = await api.getUniversityMatch({
        sessionId,
        bal: balNum,
        qrup: effectiveQrup,
        altQrup: altQrupOptions ? altQrup : undefined,
        istek,
      });
      setData(r);
      setLoaded(true);
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Tapılmadı",
        description: e instanceof Error ? e.message : "Xəta baş verdi",
      });
    } finally {
      setLoading(false);
    }
  }, [sessionId, bal, effectiveQrup, altQrup, altQrupOptions, istek, toast]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Universitet Kodlaşdırması
          </p>
          <h1 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">
            Universitet Kodlaşdırması
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {rejim === "magistr"
              ? "Magistratura bal nəticənə uyğun proqram ehtimalları"
              : "Balına, qrupuna və istiqamətinə uyğun universitet + ixtisas ehtimalları"}
          </p>
        </div>
      </div>

      <div>
        <Label className="mb-2 block">Rejim</Label>
        <div className="grid grid-cols-2 gap-2 sm:w-80">
          <button
            onClick={() => changeRejim("abituriyent")}
            className={cn(
              "rounded-lg border px-3 py-2.5 text-center text-sm font-medium transition-all",
              rejim === "abituriyent"
                ? "border-primary bg-primary text-primary-foreground ring-2 ring-primary/20 shadow-sm"
                : "border-border hover:border-primary/40 hover:bg-muted/40"
            )}
          >
            Abituriyent
          </button>
          <button
            onClick={() => changeRejim("magistr")}
            className={cn(
              "rounded-lg border px-3 py-2.5 text-center text-sm font-medium transition-all",
              rejim === "magistr"
                ? "border-primary bg-primary text-primary-foreground ring-2 ring-primary/20 shadow-sm"
                : "border-border hover:border-primary/40 hover:bg-muted/40"
            )}
          >
            Magistr
          </button>
        </div>
      </div>

      <Card>
        <CardContent className="space-y-4 pt-5">
          <div className={cn("grid grid-cols-1 gap-3", rejim === "abituriyent" && "sm:grid-cols-3")}>
            <div className="space-y-1.5">
              <Label>Balın</Label>
              <Input
                inputMode="decimal"
                placeholder={rejim === "magistr" ? "məs. 65.0" : "məs. 488.2"}
                value={bal}
                onChange={(e) => setBal(e.target.value)}
              />
            </div>
            {rejim === "abituriyent" && (
              <div className="space-y-1.5">
                <Label>Qrupun</Label>
                <Select value={qrup} onValueChange={handleQrupChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {QRUP_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {rejim === "abituriyent" && altQrupOptions && (
              <div className="space-y-1.5">
                <Label>İstiqamətin</Label>
                <Select value={altQrup} onValueChange={setAltQrup}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {altQrupOptions.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <div className="space-y-1.5">
            <Label>Əlavə istəklərin (məcburi deyil)</Label>
            <Textarea
              placeholder='məs. "yalnız Bakı daxilindəki universitetləri göstər" və ya "yalnız BDU və UNEC-i göstər"'
              value={istek}
              onChange={(e) => setIstek(e.target.value)}
              rows={2}
              className="resize-none"
            />
          </div>
          <Button onClick={load} disabled={loading} className="w-full gap-1.5 sm:w-auto">
            {loading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Sparkles className="size-4" />
            )}
            Universitetləri Tap
          </Button>
        </CardContent>
      </Card>

      {!loaded ? null : data?.mesaj && data.proqramlar.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-3 py-10 text-center">
            <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Landmark className="size-6" />
            </div>
            <p className="text-sm text-muted-foreground">{data.mesaj}</p>
          </CardContent>
        </Card>
      ) : data ? (
        <>
          {data.mesaj && (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-2.5 text-sm text-amber-700 dark:text-amber-400">
              {data.mesaj}
            </div>
          )}

          {data.serh && (
            <Card>
              <CardHeader>
                <p className="flex items-center gap-1.5 text-sm font-semibold">
                  <Sparkles className="size-4 text-amber-500" />
                  AI Tövsiyəsi
                </p>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed text-muted-foreground">{data.serh}</p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <p className="text-sm font-semibold">
                Uyğun Kodlaşdırma Yerləri ({data.proqramlar.length})
              </p>
            </CardHeader>
            <CardContent className="space-y-2">
              {data.proqramlar.map((m, i) => (
                <MatchRow key={`${m.universitet}-${m.ixtisas}-${i}`} m={m} />
              ))}
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  );
}
