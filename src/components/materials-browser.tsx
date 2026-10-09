"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Play,
  Loader2,
  X,
  MonitorPlay,
  FileText,
  Eye,
  Download,
  FolderOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { api, type MaterialVideo, type LibraryMaterialMeta } from "@/lib/api";
import { openDataUriInNewTab, downloadDataUri } from "@/components/file-attachment-link";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

function formatDuration(sec: number): string {
  if (!sec) return "";
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function formatBytes(bytes?: number | null): string {
  if (!bytes || bytes <= 0) return "";
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

type Tab = "video" | "pdf";

export function MaterialsBrowser() {
  const [tab, setTab] = React.useState<Tab>("video");

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Dərs Materialları</p>
        <h1 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">Dərs Materialları</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Video dərsləri axtarın və ya paylaşılmış PDF materiallarını oxuyun
        </p>
      </motion.div>

      {/* Tab toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => setTab("video")}
          className={cn(
            "flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
            tab === "video" ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:bg-muted"
          )}
        >
          <MonitorPlay className="size-4" /> Video dərslər
        </button>
        <button
          onClick={() => setTab("pdf")}
          className={cn(
            "flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
            tab === "pdf" ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:bg-muted"
          )}
        >
          <FileText className="size-4" /> PDF materiallar
        </button>
      </div>

      {tab === "video" ? <VideoTab /> : <PdfMaterialsTab />}
    </div>
  );
}

/* ==================== VİDEO DƏRSLƏR (yt-dlp axtarış — dəyişməyib) ==================== */

function VideoTab() {
  const { toast } = useToast();
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<MaterialVideo[] | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [hasSearched, setHasSearched] = React.useState(false);
  const [activeVideo, setActiveVideo] = React.useState<MaterialVideo | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  async function handleSearch(e?: React.FormEvent) {
    e?.preventDefault();
    const q = query.trim();
    if (!q) return;

    setLoading(true);
    setHasSearched(true);
    try {
      const data = await api.searchMaterials(q);
      setResults(data.results || []);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Axtarış xətası",
        description: err instanceof Error ? err.message : "Server xətası",
      });
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Search bar */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Baxmaq istədiyiniz dərs mövzusunu qeyd edin"
            className="h-11 pl-9"
          />
        </div>
        <Button type="submit" disabled={!query.trim() || loading} className="h-11 gap-1.5 px-5 active:scale-95">
          {loading ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
          Axtar
        </Button>
      </form>

      {loading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <div className="aspect-video w-full animate-pulse bg-muted" />
              <CardContent className="space-y-2 p-4">
                <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
                <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!loading && hasSearched && results && results.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center gap-4 py-12 text-center">
            <div className="flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <MonitorPlay className="size-7" />
            </div>
            <div>
              <p className="font-heading text-base font-semibold">Nəticə tapılmadı</p>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                Fərqli açar sözlərlə yenidən axtarın. Məsələn, &quot;Riyaziyyat tənliklər&quot;
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {!loading && !hasSearched && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center gap-4 py-16 text-center">
            <div className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
              <MonitorPlay className="size-7" />
            </div>
            <div>
              <p className="font-heading text-base font-semibold">Video dərsləri axtarın</p>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                Baxmaq istədiyiniz dərs mövzusunu yuxarıdakı axtarış sahəsinə yazın
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {!loading && results && results.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {results.map((video, i) => (
              <motion.div
                key={video.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ delay: Math.min(i * 0.04, 0.3) }}
              >
                <VideoCard video={video} onPlay={() => setActiveVideo(video)} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <VideoPlayerDialog video={activeVideo} onClose={() => setActiveVideo(null)} />
    </div>
  );
}

/* === Video Card === */
function VideoCard({ video, onPlay }: { video: MaterialVideo; onPlay: () => void }) {
  return (
    <Card
      onClick={onPlay}
      className="group relative cursor-pointer overflow-hidden border-border transition-all hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="relative aspect-video w-full overflow-hidden bg-muted">
        {video.thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={video.thumbnail}
            alt={video.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <MonitorPlay className="size-10 text-muted-foreground/40" />
          </div>
        )}
        {video.duration > 0 && (
          <span className="absolute bottom-2 right-2 rounded bg-black/80 px-1.5 py-0.5 text-[11px] font-medium text-white">
            {formatDuration(video.duration)}
          </span>
        )}
        <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/20">
          <div className="flex size-12 scale-90 items-center justify-center rounded-full bg-primary/90 text-primary-foreground opacity-0 shadow-lg transition-all group-hover:scale-100 group-hover:opacity-100">
            <Play className="size-5 fill-current" />
          </div>
        </div>
      </div>
      <CardContent className="flex gap-3 p-4">
        <div className="min-w-0 flex-1">
          <h3 className="line-clamp-2 text-sm font-semibold leading-tight">{video.title}</h3>
          <p className="mt-1 truncate text-xs text-muted-foreground">{video.channel}</p>
        </div>
      </CardContent>
    </Card>
  );
}

/* === Video Player Dialog (YouTube iframe) === */
function VideoPlayerDialog({ video, onClose }: { video: MaterialVideo | null; onClose: () => void }) {
  return (
    <Dialog open={!!video} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl gap-0 overflow-hidden p-0 sm:max-w-4xl">
        {video && (
          <>
            <div className="relative aspect-video w-full bg-black">
              <iframe
                src={`https://www.youtube.com/embed/${video.id}?autoplay=1&modestbranding=1&rel=0&iv_load_policy=3&color=white`}
                title={video.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="absolute inset-0 h-full w-full"
              />
            </div>
            <div className="flex items-center justify-between gap-3 border-t border-border p-4">
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-sm font-semibold">{video.title}</h3>
                <p className="truncate text-xs text-muted-foreground">{video.channel}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose} className="size-8 shrink-0">
                <X className="size-4" />
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

/* ==================== PDF MATERİALLAR (admin əlavə edir, tələbə read-only) ==================== */

function PdfMaterialsTab() {
  const { toast } = useToast();
  const [items, setItems] = React.useState<LibraryMaterialMeta[] | null>(null);
  const [fennFilter, setFennFilter] = React.useState<string>("hamısı");

  React.useEffect(() => {
    api
      .getLibraryMaterials()
      .then(setItems)
      .catch(() => {
        setItems([]);
        toast({ variant: "destructive", title: "Materiallar yüklənə bilmədi" });
      });
  }, [toast]);

  const fennler = React.useMemo(() => {
    const set = new Set<string>();
    (items || []).forEach((m) => m.fenn && set.add(m.fenn));
    return Array.from(set).sort();
  }, [items]);

  const shown = (items || []).filter((m) => fennFilter === "hamısı" || m.fenn === fennFilter);

  if (items === null) {
    return (
      <div className="flex min-h-[30vh] items-center justify-center">
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center gap-4 py-16 text-center">
          <div className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
            <FolderOpen className="size-7" />
          </div>
          <div>
            <p className="font-heading text-base font-semibold">Hələ material yoxdur</p>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              PDF materiallar bura administrator tərəfindən əlavə olunur. Tezliklə yoxlayın.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {fennler.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {["hamısı", ...fennler].map((f) => (
            <button
              key={f}
              onClick={() => setFennFilter(f)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                fennFilter === f
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card hover:bg-muted"
              )}
            >
              {f === "hamısı" ? "Hamısı" : f}
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((m) => (
          <PdfMaterialCard key={m.id} m={m} />
        ))}
      </div>
    </div>
  );
}

function PdfMaterialCard({ m }: { m: LibraryMaterialMeta }) {
  const { toast } = useToast();
  const [busy, setBusy] = React.useState<null | "open" | "download">(null);
  const cacheRef = React.useRef<string | null>(null);

  async function fetchData(): Promise<string | null> {
    if (cacheRef.current) return cacheRef.current;
    try {
      const full = await api.getLibraryMaterial(m.id);
      cacheRef.current = full.data;
      return full.data;
    } catch (e) {
      toast({ variant: "destructive", title: "Fayl açıla bilmədi", description: (e as Error).message });
      return null;
    }
  }

  async function handleOpen() {
    setBusy("open");
    const data = await fetchData();
    setBusy(null);
    if (data) openDataUriInNewTab(data);
  }

  async function handleDownload() {
    setBusy("download");
    const data = await fetchData();
    setBusy(null);
    if (data) downloadDataUri(data, m.ad.toLowerCase().endsWith(".pdf") ? m.ad : `${m.ad}.pdf`);
  }

  return (
    <Card className="flex h-full flex-col transition-all hover:-translate-y-0.5 hover:shadow-md">
      <CardContent className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
            <FileText className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="line-clamp-2 text-sm font-semibold leading-tight">{m.ad}</h3>
            <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
              {m.fenn && (
                <Badge variant="outline" className="rounded-full text-[10px]">
                  {m.fenn}
                </Badge>
              )}
              <span>PDF</span>
              {formatBytes(m.olcu) && <span>· {formatBytes(m.olcu)}</span>}
            </div>
          </div>
        </div>

        {m.tesvir && <p className="line-clamp-3 text-xs text-muted-foreground">{m.tesvir}</p>}

        <div className="mt-auto flex gap-2 pt-1">
          <Button variant="secondary" size="sm" className="flex-1 gap-1.5" disabled={!!busy} onClick={handleOpen}>
            {busy === "open" ? <Loader2 className="size-3.5 animate-spin" /> : <Eye className="size-3.5" />}
            Oxu
          </Button>
          <Button variant="outline" size="sm" className="flex-1 gap-1.5" disabled={!!busy} onClick={handleDownload}>
            {busy === "download" ? <Loader2 className="size-3.5 animate-spin" /> : <Download className="size-3.5" />}
            Yüklə
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
