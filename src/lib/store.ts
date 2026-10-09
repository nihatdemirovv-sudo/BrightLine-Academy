// BrightLine Academy — Frontend state & types
import { create } from "zustand";
import { persist } from "zustand/middleware";

// === TIPLƏR ===
export interface SubjectProgress {
  fenn: string;
  seviyye: number;
  yildiz: number;
  dogruCavab: number;
  hallSualSayi: number;
}

export interface Student {
  id: string;
  sessionId: string;
  ad: string;
  qrup: string;
  hedefUniversite: string;
  onboarded: boolean;
  diagnosticDone: boolean;
  streak: number;
  progress?: SubjectProgress[];
  rol?: string | null;
  muellimStatus?: string | null;
}

export type GeometryFigureSpec =
  | { type: "triangle"; sides?: [string, string, string]; angles?: [string, string, string]; rightAngleAt?: 0 | 1 | 2 | null }
  | { type: "rectangle"; width?: string; height?: string; square?: boolean }
  | { type: "trapezoid"; a?: string; b?: string; height?: string }
  | { type: "circle"; radius?: string | null; diameter?: string | null }
  | { type: "angle"; value?: string; kind?: "iti" | "düz" | "kor" | "düzxətli" }
  | { type: "cylinder"; radius?: string; height?: string }
  | { type: "cone"; radius?: string; height?: string }
  | { type: "sphere"; radius?: string }
  | { type: "cuboid"; width?: string; height?: string; depth?: string }
  | { type: "pyramid"; base?: string; height?: string };

export interface GeneratedQuestion {
  sual: string;
  variantlar: { A: string; B: string; C: string; D: string; E: string };
  dogruCavab: "A" | "B" | "C" | "D" | "E";
  izah: string;
  movzu: string;
  cetinlik: "asan" | "orta" | "cetin";
  fenn?: string;
  figura?: GeometryFigureSpec | null;
}

export interface DailyTask {
  fenn: string;
  movzu: string;
  sualSayi: number;
  movzuQisa: string;
  onem: "yuksek" | "orta" | "asagi";
  tamamlandi?: boolean;
}

export interface Weakness {
  fenn: string;
  sebəb: string;
  tovsie: string;
  övvelik: "yuksek" | "orta" | "asagi";
}

export interface ChatMessage {
  id?: string;
  role: "user" | "assistant";
  content: string;
  hasImage?: boolean;
  createdAt?: string;
}

export type View = "landing" | "auth" | "app";
export type AppView =
  | "dashboard"
  | "tutor"
  | "generator"
  | "exam"
  | "pastExam"
  | "examQuestions"
  | "score"
  | "universityMatch"
  | "review"
  | "lessons"
  | "materials"
  | "courses"
  | "cvBuilder"
  | "support"
  | "groups"
  | "arena"
  | "settings"
  | "subjectDetail"
  | "myTeacher"
  | "messages";

// Müəllim panelinin öz daxili görüşləri (AppShell-in AppView-undan ayrı, TeacherShell idarə edir)
export type TeacherView = "panel" | "students" | "student-search" | "materials" | "exams" | "messages" | "groups" | "support" | "settings";

interface AppState {
  sessionId: string | null;
  student: Student | null;
  view: View;
  appView: AppView;
  // generator üçün prefill (zəif tərəflərdən və zəif mövzulardan gələndə)
  generatorPrefillFenn: string | null;
  generatorPrefillMovzu: string | null;
  // mini-dərs üçün prefill (zəif mövzudan "Dərs Yarat" düyməsindən gələndə)
  lessonPrefill: { fenn: string; movzu: string } | null;
  // Mövzu Detay səhifəsi üçün seçilmiş fənn
  subjectDetailFenn: string | null;
  // Şəxsi mesajlar — açılanda birbaşa bu həmsöhbətin söhbəti seçilsin ("Mesaj yaz" düyməsindən)
  dmPartnerId: string | null;
  // actions
  setStudent: (s: Student | null) => void;
  setView: (v: View) => void;
  setAppView: (v: AppView) => void;
  setGeneratorPrefill: (fenn: string | null) => void;
  setGeneratorPrefillMovzu: (movzu: string | null) => void;
  setLessonPrefill: (p: { fenn: string; movzu: string } | null) => void;
  setSubjectDetailFenn: (fenn: string | null) => void;
  setDmPartnerId: (id: string | null) => void;
  logout: () => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      sessionId: null,
      student: null,
      view: "landing",
      appView: "dashboard",
      generatorPrefillFenn: null,
      generatorPrefillMovzu: null,
      lessonPrefill: null,
      subjectDetailFenn: null,
      dmPartnerId: null,
      setStudent: (s) =>
        set({
          student: s,
          sessionId: s?.sessionId ?? null,
        }),
      setView: (v) => set({ view: v }),
      setAppView: (v) => set({ appView: v }),
      setGeneratorPrefill: (fenn) => set({ generatorPrefillFenn: fenn }),
      setGeneratorPrefillMovzu: (movzu) => set({ generatorPrefillMovzu: movzu }),
      setLessonPrefill: (p) => set({ lessonPrefill: p }),
      setSubjectDetailFenn: (fenn) => set({ subjectDetailFenn: fenn }),
      setDmPartnerId: (id) => set({ dmPartnerId: id }),
      logout: () =>
        set({
          sessionId: null,
          student: null,
          view: "auth",
          appView: "dashboard",
          generatorPrefillFenn: null,
          generatorPrefillMovzu: null,
          lessonPrefill: null,
          subjectDetailFenn: null,
          dmPartnerId: null,
        }),
    }),
    {
      name: "ai-tqdk-store",
      // yalnız sessionId saxlayırıq
      partialize: (state) => ({ sessionId: state.sessionId }),
    }
  )
);
