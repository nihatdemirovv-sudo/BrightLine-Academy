"use client";

import * as React from "react";
import { Loader2, Plus, FileText, Image as ImageIcon, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { api } from "@/lib/api";
import type { TeacherMaterialItem } from "@/lib/api";
import { useStore } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";
import { compressImageFile, readFileAsDataURL, MAX_PDF_BYTES, PDF_TOO_BIG_MSG } from "@/lib/media";
import { FileAttachmentLink } from "@/components/file-attachment-link";

export function TeacherMaterials() {
  const { sessionId } = useStore();
  const { toast } = useToast();
  const [materials, setMaterials] = React.useState<TeacherMaterialItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [open, setOpen] = React.useState(false);
  const [ad, setAd] = React.useState("");
  const [file, setFile] = React.useState<{ base64: string; tip: string } | null>(null);
  const [saving, setSaving] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const load = React.useCallback(async () => {
    if (!sessionId) return;
    setLoading(true);
    try {
      setMaterials(await api.getTeacherMaterials(sessionId));
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  React.useEffect(() => {
    load();
  }, [load]);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (e.target) e.target.value = "";
    if (!f) return;
    const isImage = f.type.startsWith("image/");
    const isPdf = f.type === "application/pdf";
    if (!isImage && !isPdf) {
      toast({ variant: "destructive", title: "Dəstəklənməyən fayl", description: "Yalnız şəkil və ya PDF." });
      return;
    }
    if (isPdf && f.size > MAX_PDF_BYTES) {
      toast({ variant: "destructive", title: "Fayl yüklənmədi", description: PDF_TOO_BIG_MSG });
      return;
    }
    try {
      const base64 = isImage ? await compressImageFile(f) : await readFileAsDataURL(f);
      setFile({ base64, tip: isImage ? "image" : "pdf" });
      if (!ad) setAd(f.name.replace(/\.[^.]+$/, ""));
    } catch {
      toast({ variant: "destructive", title: "Fayl emal edilə bilmədi" });
    }
  }

  async function handleUpload() {
    if (!sessionId || !file) return;
    setSaving(true);
    try {
      const m = await api.uploadTeacherMaterial({ sessionId, ad: ad || "Material", tip: file.tip, data: file.base64 });
      setMaterials((prev) => [m, ...prev]);
      setOpen(false);
      setAd("");
      setFile(null);
    } catch (err) {
      toast({ variant: "destructive", title: "Xəta", description: err instanceof Error ? err.message : undefined });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!sessionId || !window.confirm("Bu materialı silmək istədiyinizə əminsiniz?")) return;
    try {
      await api.deleteTeacherMaterial(sessionId, id);
      setMaterials((prev) => prev.filter((m) => m.id !== id));
    } catch (err) {
      toast({ variant: "destructive", title: "Xəta", description: err instanceof Error ? err.message : undefined });
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-heading text-xl font-bold">Materiallar</h1>
          <p className="mt-1 text-sm text-muted-foreground">Bütün tələbələriniz bunları read-only görür.</p>
        </div>
        <Button onClick={() => setOpen(true)} className="shrink-0 gap-1.5">
          <Plus className="size-4" />
          Yüklə
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Material yüklə</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Materialın adı" value={ad} onChange={(e) => setAd(e.target.value)} />
            <input ref={inputRef} type="file" accept="image/*,application/pdf" className="hidden" onChange={handleFileChange} />
            {file ? (
              <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 p-2 text-sm">
                {file.tip === "image" ? <ImageIcon className="size-4" /> : <FileText className="size-4" />}
                Fayl seçildi
                <button className="ml-auto text-muted-foreground hover:text-foreground" onClick={() => setFile(null)}>×</button>
              </div>
            ) : (
              <Button variant="outline" className="w-full" onClick={() => inputRef.current?.click()}>
                Fayl seç (şəkil / PDF)
              </Button>
            )}
          </div>
          <DialogFooter>
            <Button onClick={handleUpload} disabled={!file || saving} className="gap-1.5">
              {saving && <Loader2 className="size-4 animate-spin" />}
              Yüklə
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      ) : materials.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          Hələ material yükləməmisiniz.
        </p>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2">
          {materials.map((m) => (
            <div key={m.id} className="flex items-center justify-between gap-2 rounded-xl border border-border bg-card p-3.5">
              <FileAttachmentLink data={m.data} ad={m.ad} tip={m.tip} className="min-w-0 flex-1 border-transparent bg-transparent p-0" />
              <button onClick={() => handleDelete(m.id)} className="shrink-0 text-muted-foreground hover:text-destructive">
                <Trash2 className="size-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
