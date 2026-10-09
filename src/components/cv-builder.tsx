"use client";

import * as React from "react";
import {
  FileText,
  Plus,
  Trash2,
  Loader2,
  Sparkles,
  Save,
  Printer,
  GraduationCap,
  Briefcase,
  FolderKanban,
  Wrench,
  User,
  Mail,
  Phone,
  MapPin,
  Linkedin,
  Github,
  Globe,
  Languages,
  BadgeCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { api } from "@/lib/api";
import type { ResumeData, ResumeEducation, ResumeExperience, ResumeProject } from "@/lib/api";
import { useStore } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";

const EMPTY_RESUME: ResumeData = {
  adSoyad: "",
  email: "",
  telefon: "",
  unvan: "",
  linkedin: "",
  github: "",
  portfolio: "",
  hedef: "",
  xulase: "",
  tehsil: [],
  tecrube: [],
  layiheler: [],
  bacariqlar: [],
  diller: [],
  sertifikatlar: [],
};

function newId() {
  return typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random());
}

function AiImproveButton({
  loading,
  onClick,
}: {
  loading: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={onClick}
      disabled={loading}
      className="h-7 gap-1 text-[11px]"
    >
      {loading ? <Loader2 className="size-3 animate-spin" /> : <Sparkles className="size-3 text-amber-500" />}
      AI ilə Təkmilləşdir
    </Button>
  );
}

function TagInput({
  label,
  values,
  onChange,
  placeholder,
}: {
  label: string;
  values: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
}) {
  const [text, setText] = React.useState("");

  function add() {
    const v = text.trim();
    if (!v) return;
    if (!values.includes(v)) onChange([...values, v]);
    setText("");
  }

  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <div className="flex gap-2">
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          placeholder={placeholder}
        />
        <Button type="button" variant="outline" size="sm" onClick={add} className="shrink-0">
          <Plus className="size-4" />
        </Button>
      </div>
      {values.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {values.map((v, i) => (
            <Badge key={`${v}-${i}`} variant="secondary" className="gap-1 pr-1 text-xs">
              {v}
              <button
                type="button"
                onClick={() => onChange(values.filter((_, idx) => idx !== i))}
                className="ml-0.5 rounded-full hover:bg-destructive/20"
              >
                <Trash2 className="size-2.5" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

export function CvBuilder() {
  const sessionId = useStore((s) => s.sessionId) || "";
  const { toast } = useToast();

  const [resume, setResume] = React.useState<ResumeData>(EMPTY_RESUME);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [improving, setImproving] = React.useState<string | null>(null);
  const [tab, setTab] = React.useState("redakte");

  React.useEffect(() => {
    if (!sessionId) return;
    (async () => {
      try {
        const r = await api.getResume(sessionId);
        setResume({ ...EMPTY_RESUME, ...r });
      } catch {
        // silent — boş CV ilə davam et
      } finally {
        setLoading(false);
      }
    })();
  }, [sessionId]);

  function set<K extends keyof ResumeData>(key: K, value: ResumeData[K]) {
    setResume((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      await api.saveResume(sessionId, resume);
      toast({ title: "CV saxlanıldı ✓" });
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Saxlanmadı",
        description: e instanceof Error ? e.message : "Xəta baş verdi",
      });
    } finally {
      setSaving(false);
    }
  }

  async function improve(fieldKey: string, metn: string, kontext: string, onResult: (v: string) => void) {
    if (!metn.trim()) {
      toast({ variant: "destructive", title: "Əvvəlcə bir şey yaz" });
      return;
    }
    setImproving(fieldKey);
    try {
      const r = await api.improveResumeText({ sessionId, metn, kontext });
      onResult(r.netice);
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Təkmilləşdirilmədi",
        description: e instanceof Error ? e.message : "Xəta baş verdi",
      });
    } finally {
      setImproving(null);
    }
  }

  function handlePrint() {
    window.print();
  }

  // --- Təhsil ---
  function addEducation() {
    const item: ResumeEducation = { id: newId(), mekteb: "", derece: "", saha: "", başlanğıc: "", bitmə: "", qeyd: "" };
    set("tehsil", [...resume.tehsil, item]);
  }
  function updateEducation(id: string, patch: Partial<ResumeEducation>) {
    set("tehsil", resume.tehsil.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  }
  function removeEducation(id: string) {
    set("tehsil", resume.tehsil.filter((e) => e.id !== id));
  }

  // --- Təcrübə ---
  function addExperience() {
    const item: ResumeExperience = { id: newId(), şirket: "", vəzifə: "", başlanğıc: "", bitmə: "", təsvir: "" };
    set("tecrube", [...resume.tecrube, item]);
  }
  function updateExperience(id: string, patch: Partial<ResumeExperience>) {
    set("tecrube", resume.tecrube.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  }
  function removeExperience(id: string) {
    set("tecrube", resume.tecrube.filter((e) => e.id !== id));
  }

  // --- Layihələr ---
  function addProject() {
    const item: ResumeProject = { id: newId(), ad: "", təsvir: "", link: "", tarix: "" };
    set("layiheler", [...resume.layiheler, item]);
  }
  function updateProject(id: string, patch: Partial<ResumeProject>) {
    set("layiheler", resume.layiheler.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  }
  function removeProject(id: string) {
    set("layiheler", resume.layiheler.filter((p) => p.id !== id));
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-sm text-muted-foreground">
        <Loader2 className="mr-2 size-4 animate-spin" />
        Yüklənir...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #cv-print-area, #cv-print-area * { visibility: visible; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          #cv-print-area { position: absolute; top: 0; left: 0; width: 100%; padding: 0; }
        }
      `}</style>

      <div className="flex flex-wrap items-end justify-between gap-3 print:hidden">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">CV Yaratma</p>
          <h1 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">CV Yaratma</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Məlumatlarını daxil et, AI köməyi ilə peşəkar CV hazırla
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handlePrint} className="gap-1.5">
            <Printer className="size-4" />
            PDF Yüklə
          </Button>
          <Button size="sm" onClick={handleSave} disabled={saving} className="gap-1.5">
            {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            Saxla
          </Button>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="print:hidden">
        <TabsList>
          <TabsTrigger value="redakte" className="gap-1.5">
            <FileText className="size-3.5" />
            Redaktə
          </TabsTrigger>
          <TabsTrigger value="onizleme" className="gap-1.5">
            <FileText className="size-3.5" />
            Önizləmə
          </TabsTrigger>
        </TabsList>

        <TabsContent value="redakte" className="mt-4">
          <Accordion type="multiple" defaultValue={["sexsi", "xulase"]} className="space-y-3">
            {/* Şəxsi Məlumat */}
            <AccordionItem value="sexsi" className="rounded-xl border px-4">
              <AccordionTrigger className="gap-2 py-3 text-sm font-semibold">
                <User className="size-4 text-primary" />
                Şəxsi Məlumat
              </AccordionTrigger>
              <AccordionContent className="space-y-3 pb-4">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label>Ad Soyad</Label>
                    <Input value={resume.adSoyad} onChange={(e) => set("adSoyad", e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Hədəf (vəzifə/proqram)</Label>
                    <Input
                      value={resume.hedef || ""}
                      onChange={(e) => set("hedef", e.target.value)}
                      placeholder="məs. İnformasiya Texnologiyaları Tələbəsi"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Email</Label>
                    <Input value={resume.email} onChange={(e) => set("email", e.target.value)} type="email" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Telefon</Label>
                    <Input value={resume.telefon} onChange={(e) => set("telefon", e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Ünvan</Label>
                    <Input value={resume.unvan || ""} onChange={(e) => set("unvan", e.target.value)} placeholder="Bakı, Azərbaycan" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>LinkedIn</Label>
                    <Input value={resume.linkedin || ""} onChange={(e) => set("linkedin", e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>GitHub</Label>
                    <Input value={resume.github || ""} onChange={(e) => set("github", e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Portfolio / Sayt</Label>
                    <Input value={resume.portfolio || ""} onChange={(e) => set("portfolio", e.target.value)} />
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Xülasə */}
            <AccordionItem value="xulase" className="rounded-xl border px-4">
              <AccordionTrigger className="gap-2 py-3 text-sm font-semibold">
                <Sparkles className="size-4 text-amber-500" />
                Qısa Xülasə
              </AccordionTrigger>
              <AccordionContent className="space-y-2 pb-4">
                <Textarea
                  value={resume.xulase}
                  onChange={(e) => set("xulase", e.target.value)}
                  rows={4}
                  placeholder="Özün haqqında 2-3 cümləlik qısa təqdimat — kimsən, nəyə can atırsan, güclü tərəflərin..."
                />
                <AiImproveButton
                  loading={improving === "xulase"}
                  onClick={() =>
                    improve("xulase", resume.xulase, "CV-nin qısa xülasə/profil bölməsi", (v) => set("xulase", v))
                  }
                />
              </AccordionContent>
            </AccordionItem>

            {/* Təhsil */}
            <AccordionItem value="tehsil" className="rounded-xl border px-4">
              <AccordionTrigger className="gap-2 py-3 text-sm font-semibold">
                <GraduationCap className="size-4 text-primary" />
                Təhsil ({resume.tehsil.length})
              </AccordionTrigger>
              <AccordionContent className="space-y-3 pb-4">
                {resume.tehsil.map((edu) => (
                  <div key={edu.id} className="space-y-2 rounded-lg border border-border p-3">
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      <Input
                        value={edu.mekteb}
                        onChange={(e) => updateEducation(edu.id, { mekteb: e.target.value })}
                        placeholder="Məktəb / Universitet"
                      />
                      <Input
                        value={edu.derece}
                        onChange={(e) => updateEducation(edu.id, { derece: e.target.value })}
                        placeholder="Dərəcə (məs. Orta təhsil, Bakalavr)"
                      />
                      <Input
                        value={edu.saha || ""}
                        onChange={(e) => updateEducation(edu.id, { saha: e.target.value })}
                        placeholder="Sahə (məcburi deyil)"
                      />
                      <div className="flex gap-2">
                        <Input
                          value={edu.başlanğıc}
                          onChange={(e) => updateEducation(edu.id, { başlanğıc: e.target.value })}
                          placeholder="Başlanğıc (2023)"
                        />
                        <Input
                          value={edu.bitmə}
                          onChange={(e) => updateEducation(edu.id, { bitmə: e.target.value })}
                          placeholder="Bitmə (2027 / davam edir)"
                        />
                      </div>
                    </div>
                    <Textarea
                      value={edu.qeyd || ""}
                      onChange={(e) => updateEducation(edu.id, { qeyd: e.target.value })}
                      rows={2}
                      placeholder="Qeyd (nailiyyət, GPA və s. — məcburi deyil)"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeEducation(edu.id)}
                      className="h-7 gap-1 text-[11px] text-destructive hover:text-destructive"
                    >
                      <Trash2 className="size-3" />
                      Sil
                    </Button>
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={addEducation} className="gap-1.5">
                  <Plus className="size-4" />
                  Təhsil Əlavə Et
                </Button>
              </AccordionContent>
            </AccordionItem>

            {/* Təcrübə */}
            <AccordionItem value="tecrube" className="rounded-xl border px-4">
              <AccordionTrigger className="gap-2 py-3 text-sm font-semibold">
                <Briefcase className="size-4 text-primary" />
                İş / Staj Təcrübəsi ({resume.tecrube.length})
              </AccordionTrigger>
              <AccordionContent className="space-y-3 pb-4">
                {resume.tecrube.map((exp) => (
                  <div key={exp.id} className="space-y-2 rounded-lg border border-border p-3">
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      <Input
                        value={exp.şirket}
                        onChange={(e) => updateExperience(exp.id, { şirket: e.target.value })}
                        placeholder="Şirkət / Təşkilat"
                      />
                      <Input
                        value={exp.vəzifə}
                        onChange={(e) => updateExperience(exp.id, { vəzifə: e.target.value })}
                        placeholder="Vəzifə"
                      />
                      <div className="flex gap-2 sm:col-span-2">
                        <Input
                          value={exp.başlanğıc}
                          onChange={(e) => updateExperience(exp.id, { başlanğıc: e.target.value })}
                          placeholder="Başlanğıc"
                        />
                        <Input
                          value={exp.bitmə}
                          onChange={(e) => updateExperience(exp.id, { bitmə: e.target.value })}
                          placeholder="Bitmə / davam edir"
                        />
                      </div>
                    </div>
                    <Textarea
                      value={exp.təsvir}
                      onChange={(e) => updateExperience(exp.id, { təsvir: e.target.value })}
                      rows={3}
                      placeholder="Nə etdin, hansı nailiyyətlər qazandın..."
                    />
                    <div className="flex items-center gap-2">
                      <AiImproveButton
                        loading={improving === exp.id}
                        onClick={() =>
                          improve(exp.id, exp.təsvir, `İş təcrübəsi — ${exp.vəzifə} @ ${exp.şirket}`, (v) =>
                            updateExperience(exp.id, { təsvir: v })
                          )
                        }
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeExperience(exp.id)}
                        className="h-7 gap-1 text-[11px] text-destructive hover:text-destructive"
                      >
                        <Trash2 className="size-3" />
                        Sil
                      </Button>
                    </div>
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={addExperience} className="gap-1.5">
                  <Plus className="size-4" />
                  Təcrübə Əlavə Et
                </Button>
              </AccordionContent>
            </AccordionItem>

            {/* Layihələr */}
            <AccordionItem value="layiheler" className="rounded-xl border px-4">
              <AccordionTrigger className="gap-2 py-3 text-sm font-semibold">
                <FolderKanban className="size-4 text-primary" />
                Layihələr ({resume.layiheler.length})
              </AccordionTrigger>
              <AccordionContent className="space-y-3 pb-4">
                {resume.layiheler.map((proj) => (
                  <div key={proj.id} className="space-y-2 rounded-lg border border-border p-3">
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      <Input
                        value={proj.ad}
                        onChange={(e) => updateProject(proj.id, { ad: e.target.value })}
                        placeholder="Layihənin adı"
                      />
                      <Input
                        value={proj.link || ""}
                        onChange={(e) => updateProject(proj.id, { link: e.target.value })}
                        placeholder="Link (məcburi deyil)"
                      />
                    </div>
                    <Textarea
                      value={proj.təsvir}
                      onChange={(e) => updateProject(proj.id, { təsvir: e.target.value })}
                      rows={2}
                      placeholder="Layihə haqqında qısa təsvir"
                    />
                    <div className="flex items-center gap-2">
                      <AiImproveButton
                        loading={improving === proj.id}
                        onClick={() =>
                          improve(proj.id, proj.təsvir, `Layihə — ${proj.ad}`, (v) => updateProject(proj.id, { təsvir: v }))
                        }
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeProject(proj.id)}
                        className="h-7 gap-1 text-[11px] text-destructive hover:text-destructive"
                      >
                        <Trash2 className="size-3" />
                        Sil
                      </Button>
                    </div>
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={addProject} className="gap-1.5">
                  <Plus className="size-4" />
                  Layihə Əlavə Et
                </Button>
              </AccordionContent>
            </AccordionItem>

            {/* Bacarıqlar */}
            <AccordionItem value="bacariqlar" className="rounded-xl border px-4">
              <AccordionTrigger className="gap-2 py-3 text-sm font-semibold">
                <Wrench className="size-4 text-primary" />
                Bacarıqlar
              </AccordionTrigger>
              <AccordionContent className="space-y-4 pb-4">
                <TagInput
                  label="Bacarıqlar"
                  values={resume.bacariqlar}
                  onChange={(v) => set("bacariqlar", v)}
                  placeholder="məs. Python, Excel, Komanda işi..."
                />
                <TagInput
                  label="Dillər"
                  values={resume.diller}
                  onChange={(v) => set("diller", v)}
                  placeholder="məs. Azərbaycan (ana dili), İngilis (B2)..."
                />
                <TagInput
                  label="Sertifikatlar"
                  values={resume.sertifikatlar}
                  onChange={(v) => set("sertifikatlar", v)}
                  placeholder="məs. IELTS 7.0..."
                />
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </TabsContent>

        <TabsContent value="onizleme" className="mt-4">
          <ResumePreview resume={resume} />
        </TabsContent>
      </Tabs>

      {/* Çap üçün həmişə mövcud olan gizli önizləmə (ekranda görünməz, yalnız print-də) */}
      <div className="hidden print:block">
        <ResumePreview resume={resume} />
      </div>
    </div>
  );
}

function SectionHeading({ icon: Icon, children }: { icon: React.ElementType; children: React.ReactNode }) {
  return (
    <h3 className="mb-2 flex items-center gap-1.5 border-b-2 border-primary/25 pb-1 text-[11px] font-bold uppercase tracking-wider text-primary">
      <Icon className="size-3.5" />
      {children}
    </h3>
  );
}

function ContactItem({ icon: Icon, value }: { icon: React.ElementType; value?: string }) {
  if (!value) return null;
  return (
    <span className="inline-flex items-center gap-1">
      <Icon className="size-3 text-primary" />
      {value}
    </span>
  );
}

function ResumePreview({ resume }: { resume: ResumeData }) {
  return (
    <Card
      id="cv-print-area"
      className="mx-auto max-w-3xl overflow-hidden print:border-0 print:shadow-none"
    >
      <div className="h-2 w-full bg-primary print:[print-color-adjust:exact] print:[-webkit-print-color-adjust:exact]" />
      <CardContent className="space-y-5 p-6 sm:p-8 print:p-6">
        {/* Başlıq */}
        <div className="space-y-2 border-b border-border pb-4 text-center">
          <h2 className="font-heading text-3xl font-bold tracking-tight">{resume.adSoyad || "Ad Soyad"}</h2>
          {resume.hedef && (
            <p className="text-sm font-medium uppercase tracking-wide text-primary">{resume.hedef}</p>
          )}
          <p className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <ContactItem icon={Mail} value={resume.email} />
            <ContactItem icon={Phone} value={resume.telefon} />
            <ContactItem icon={MapPin} value={resume.unvan} />
            <ContactItem icon={Linkedin} value={resume.linkedin} />
            <ContactItem icon={Github} value={resume.github} />
            <ContactItem icon={Globe} value={resume.portfolio} />
          </p>
        </div>

        {resume.xulase && (
          <section>
            <SectionHeading icon={User}>Xülasə</SectionHeading>
            <p className="text-sm leading-relaxed">{resume.xulase}</p>
          </section>
        )}

        {resume.tehsil.length > 0 && (
          <section>
            <SectionHeading icon={GraduationCap}>Təhsil</SectionHeading>
            <div className="space-y-3">
              {resume.tehsil.map((e) => (
                <div key={e.id} className="border-l-2 border-primary/20 pl-3">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-2">
                    <p className="text-sm font-semibold">
                      {e.derece}
                      {e.saha ? ` — ${e.saha}` : ""}
                    </p>
                    <p className="text-xs font-medium text-muted-foreground">
                      {e.başlanğıc}
                      {e.bitmə ? ` – ${e.bitmə}` : ""}
                    </p>
                  </div>
                  <p className="text-sm text-muted-foreground">{e.mekteb}</p>
                  {e.qeyd && <p className="mt-0.5 text-xs text-muted-foreground">{e.qeyd}</p>}
                </div>
              ))}
            </div>
          </section>
        )}

        {resume.tecrube.length > 0 && (
          <section>
            <SectionHeading icon={Briefcase}>İş / Staj Təcrübəsi</SectionHeading>
            <div className="space-y-3">
              {resume.tecrube.map((e) => (
                <div key={e.id} className="border-l-2 border-primary/20 pl-3">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-2">
                    <p className="text-sm font-semibold">
                      {e.vəzifə} — {e.şirket}
                    </p>
                    <p className="text-xs font-medium text-muted-foreground">
                      {e.başlanğıc}
                      {e.bitmə ? ` – ${e.bitmə}` : ""}
                    </p>
                  </div>
                  {e.təsvir && <p className="mt-0.5 whitespace-pre-line text-sm">{e.təsvir}</p>}
                </div>
              ))}
            </div>
          </section>
        )}

        {resume.layiheler.length > 0 && (
          <section>
            <SectionHeading icon={FolderKanban}>Layihələr</SectionHeading>
            <div className="space-y-2">
              {resume.layiheler.map((p) => (
                <div key={p.id} className="border-l-2 border-primary/20 pl-3">
                  <p className="text-sm font-semibold">
                    {p.ad}
                    {p.link && <span className="ml-1.5 font-normal text-muted-foreground">({p.link})</span>}
                  </p>
                  {p.təsvir && <p className="text-sm">{p.təsvir}</p>}
                </div>
              ))}
            </div>
          </section>
        )}

        {resume.bacariqlar.length > 0 && (
          <section>
            <SectionHeading icon={Wrench}>Bacarıqlar</SectionHeading>
            <div className="flex flex-wrap gap-1.5">
              {resume.bacariqlar.map((b, i) => (
                <span
                  key={i}
                  className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary print:[print-color-adjust:exact] print:[-webkit-print-color-adjust:exact]"
                >
                  {b}
                </span>
              ))}
            </div>
          </section>
        )}

        {resume.diller.length > 0 && (
          <section>
            <SectionHeading icon={Languages}>Dillər</SectionHeading>
            <div className="flex flex-wrap gap-1.5">
              {resume.diller.map((d, i) => (
                <span
                  key={i}
                  className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary print:[print-color-adjust:exact] print:[-webkit-print-color-adjust:exact]"
                >
                  {d}
                </span>
              ))}
            </div>
          </section>
        )}

        {resume.sertifikatlar.length > 0 && (
          <section>
            <SectionHeading icon={BadgeCheck}>Sertifikatlar</SectionHeading>
            <div className="flex flex-wrap gap-1.5">
              {resume.sertifikatlar.map((s, i) => (
                <span
                  key={i}
                  className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary print:[print-color-adjust:exact] print:[-webkit-print-color-adjust:exact]"
                >
                  {s}
                </span>
              ))}
            </div>
          </section>
        )}
      </CardContent>
    </Card>
  );
}
