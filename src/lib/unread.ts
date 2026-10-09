// BrightLine Academy — oxunmamış sayğaclar (nav badge-ləri: "3", "99+")
// Server hər bölmə üçün "son baxışdan sonra gələn" sayı qaytarır; burada bir neçə saniyədən
// bir yenilənir. Bölmə/söhbət açılanda markSeen(key) çağırılır və sayğac dərhal sıfırlanır.
import * as React from "react";
import { create } from "zustand";
import { api, type UnreadCounts, type UnreadSection } from "./api";
import { useStore } from "./store";

const POLL_MS = 8000;

interface UnreadState {
  counts: UnreadCounts | null;
  sessionId: string | null;
  setCounts: (c: UnreadCounts | null) => void;
  setSessionId: (s: string | null) => void;
}

export const useUnreadStore = create<UnreadState>()((set) => ({
  counts: null,
  sessionId: null,
  setCounts: (c) => set({ counts: c }),
  setSessionId: (s) => set({ sessionId: s }),
}));

export function formatBadge(n: number): string {
  return n > 99 ? "99+" : String(n);
}

export async function refreshUnread() {
  const { sessionId, setCounts } = useUnreadStore.getState();
  if (!sessionId) return;
  try {
    setCounts(await api.getUnreadCounts(sessionId));
  } catch {
    // şəbəkə xətası — növbəti dövrədə yenidən cəhd olunacaq
  }
}

function zeroItem(section: UnreadSection, id: string): UnreadSection {
  if (!section.items[id]) return section;
  const items = { ...section.items };
  const removed = items[id];
  delete items[id];
  return { total: Math.max(0, section.total - removed), items };
}

// Serverə yazmazdan ƏVVƏL lokal sayğacı sıfırla — badge gecikmədən itsin.
function applyLocalSeen(c: UnreadCounts, key: string): UnreadCounts {
  const sep = key.indexOf(":");
  const prefix = sep >= 0 ? key.slice(0, sep) : key;
  const id = sep >= 0 ? key.slice(sep + 1) : "";
  const next: UnreadCounts = { ...c };
  if (prefix === "group" && id) next.groups = zeroItem(c.groups, id);
  else if (prefix === "support" && id) next.support = zeroItem(c.support, id);
  else if (prefix === "dm" && id) next.messages = zeroItem(c.messages, id);
  else if (prefix === "t" && id === "students") next.students = 0;
  else if (prefix === "mt" && c.myTeacher && (id === "tasks" || id === "materials" || id === "exams")) {
    const mt = { ...c.myTeacher, [id]: 0 };
    mt.total = mt.requests + mt.tasks + mt.materials + mt.exams;
    next.myTeacher = mt;
  }
  return next;
}

export async function markSeen(key: string) {
  const { sessionId, counts, setCounts } = useUnreadStore.getState();
  if (!sessionId) return;
  if (counts) setCounts(applyLocalSeen(counts, key));
  try {
    await api.markSeen(sessionId, key);
    // işarələmədən əvvəl başlamış dövri sorğu köhnə rəqəmi geri yazmış ola bilər — sinxronla
    await refreshUnread();
  } catch {
    // uğursuz olsa növbəti yeniləmə düzgün rəqəmi qaytaracaq
  }
}

/** Tətbiq qabığında (AppShell / TeacherShell) bir dəfə çağırılır — sayğacları dövri yeniləyir
 * və brauzer tab başlığına ümumi sayı yazır: "(5) BrightLine Academy". */
export function useUnreadPolling(sessionId: string | null) {
  const counts = useUnreadStore((s) => s.counts);

  React.useEffect(() => {
    useUnreadStore.getState().setSessionId(sessionId);
    if (!sessionId) {
      useUnreadStore.getState().setCounts(null);
      return;
    }
    refreshUnread();
    const timer = window.setInterval(refreshUnread, POLL_MS);
    const onFocus = () => refreshUnread();
    window.addEventListener("focus", onFocus);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", onFocus);
    };
  }, [sessionId]);

  const baseTitleRef = React.useRef<string | null>(null);
  React.useEffect(() => {
    if (typeof document === "undefined") return;
    if (baseTitleRef.current === null) baseTitleRef.current = document.title.replace(/^\(\d+\+?\)\s*/, "");
    const total = totalUnread(counts);
    document.title = total > 0 ? `(${formatBadge(total)}) ${baseTitleRef.current}` : baseTitleRef.current;
  }, [counts]);

  React.useEffect(() => {
    return () => {
      if (baseTitleRef.current !== null) document.title = baseTitleRef.current;
    };
  }, []);
}

export function totalUnread(c: UnreadCounts | null): number {
  if (!c) return 0;
  return (
    c.groups.total +
    c.support.total +
    c.messages.total +
    (c.arena ?? 0) +
    (c.myTeacher?.total ?? 0) +
    (c.exams ?? 0) +
    (c.students ?? 0)
  );
}

/** Görünən (aktiv) bölmə/söhbət açıq olduğu müddətdə onu "oxunmuş" işarələ. `trigger` dəyişəndə
 * (məs. yeni mesaj gələndə) yenidən işarələnir ki, açıq söhbətdə badge yığılmasın. */
export function useMarkSeen(key: string | null, active: boolean, trigger?: unknown) {
  // Brauzer tabı arxa fondadırsa istifadəçi əslində baxmır — oxunmuş sayma, geri qayıdanda işarələ.
  const [pageVisible, setPageVisible] = React.useState(
    () => typeof document === "undefined" || !document.hidden
  );
  React.useEffect(() => {
    const onChange = () => setPageVisible(!document.hidden);
    document.addEventListener("visibilitychange", onChange);
    return () => document.removeEventListener("visibilitychange", onChange);
  }, []);

  React.useEffect(() => {
    if (!key || !active || !pageVisible) return;
    markSeen(key);
  }, [key, active, pageVisible, trigger]);
}

/** Bölmə hazırda ekrandadırmı? Tələbə qabığı (AppShell) ziyarət edilmiş görüşləri gizli saxlayır
 * (unmount etmir), ona görə appView ilə yoxlanılır; müəllim qabığı isə görüşü unmount edir —
 * orada komponent göstərilirsə, deməli aktivdir. */
export function useViewActive(view: string): boolean {
  const appView = useStore((s) => s.appView);
  const rol = useStore((s) => s.student?.rol);
  return rol === "muellim" ? true : appView === view;
}
