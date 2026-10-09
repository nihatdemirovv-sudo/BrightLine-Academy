// BrightLine Academy — PDF export utility (client-side, jsPDF)
// Bütün funksiyalar 'use client' komponentlərindən çağrılır.
// Branded header/footer və 3 növ PDF: exam result, parent report, score simulation.
import { jsPDF } from "jspdf";

// === Rəng paleti (design sistemə uyğun) ===
const NAVY = "#1E3A8A"; // primary
const EMERALD = "#10B981"; // accent
const CREAM = "#FAFAF7"; // arxa fon
const RED = "#EF4444"; // destructive
const AMBER = "#F59E0B"; // warning
const TEXT_DARK = "#0A1128"; // dark navy
const MUTED = "#6B7280"; // muted gray
const BORDER = "#E5E7EB"; // border

// === Azərbaycan mətnlərini ASCII-yə normalizə et (helvetica font dəstəkləmək üçün) ===
// jsPDF built-in helvetica fontu əlavə xüsusi simvolları düzgün render etmir,
// buna görə də ə, ğ, ı, İ, ş, ç, ö, ü kimi Azərbaycan hərflərini ASCII ekvivalentləri ilə əvəz edirik.
export function normalizeAzText(text: string | null | undefined): string {
  if (!text) return "";
  return String(text)
    .replace(/ə/g, "e")
    .replace(/Ə/g, "E")
    .replace(/ğ/g, "g")
    .replace(/Ğ/g, "G")
    .replace(/ı/g, "i")
    .replace(/İ/g, "I")
    .replace(/ş/g, "s")
    .replace(/Ş/g, "S")
    .replace(/ç/g, "c")
    .replace(/Ç/g, "C")
    .replace(/ö/g, "o")
    .replace(/Ö/g, "O")
    .replace(/ü/g, "u")
    .replace(/Ü/g, "U");
}

// === Tarix formatı (Azərbaycan) — `15 Avqust 2025, Şənbə` ===
const AZ_AYLAR = [
  "Yanvar", "Fevral", "Mart", "Aprel", "May", "İyun",
  "İyul", "Avqust", "Sentyabr", "Oktyabr", "Noyabr", "Dekabr",
];
const AZ_GUNLER = [
  "Bazar", "Bazar ertəsi", "Çərşənbə axşamı", "Çərşənbə",
  "Cümə axşamı", "Cümə", "Şənbə",
];

function formatAzDate(date: Date = new Date()): string {
  return `${date.getDate()} ${AZ_AYLAR[date.getMonth()]} ${date.getFullYear()}`;
}

function formatAzDateShort(date: Date = new Date()): string {
  const AYLAR_QISA = ["Yan", "Fev", "Mar", "Apr", "May", "İyn", "İyl", "Avq", "Sen", "Okt", "Noy", "Dek"];
  return `${date.getDate()} ${AYLAR_QISA[date.getMonth()]}`;
}

function formatAzTime(date: Date = new Date()): string {
  const h = String(date.getHours()).padStart(2, "0");
  const m = String(date.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}

// === Markdown-ı sadə mətnə çevir (strukturu qoruyaraq) ===
function stripMarkdown(md: string): string {
  if (!md) return "";
  return md
    // Kod bloklarını təmizlə
    .replace(/```[\s\S]*?```/g, (m) => m.replace(/```\w*\n?/g, "").replace(/```/g, ""))
    // Başlıqları sadələşdir (#, ##, ### → böyük hərflə boşluq)
    .replace(/^#{1,6}\s+/gm, "")
    // Bold/italic markerlərini sil
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/__([^_]+)__/g, "$1")
    .replace(/_([^_]+)_/g, "$1")
    // Strikethrough
    .replace(/~~([^~]+)~~/g, "$1")
    // Linkləri [text](url) → text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    // Şəkilləri ![alt](url) → [şəkil: alt]
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, "[sekil: $1]")
    // Inline kod
    .replace(/`([^`]+)`/g, "$1")
    // Blockquote markerlərini sil
    .replace(/^>\s+/gm, "")
    // List markerlərini təmizlə (-, *, +, 1.)
    .replace(/^[\s]*[-*+]\s+/gm, "• ")
    .replace(/^[\s]*\d+\.\s+/gm, "")
    // Horizontal rule
    .replace(/^---+$/gm, "")
    // Cədvəl markerlərini təmizlə
    .replace(/^\|.*\|$/gm, (line) => line.replace(/\|/g, "  ").trim())
    .trim();
}

// === Tiplər ===
export interface PdfStudent {
  ad: string;
  qrup?: string;
  hedefUniversite?: string;
}

export interface PdfExamAttempt {
  sualSayi: number;
  dogruCavab: number;
  sehvCavab: number;
  bosCavab: number;
  bal: number;
  müddetSan: number;
  createdAt?: string;
}

export interface PdfParentReport {
  metin: string;
  baslamaTarixi: string;
  bitmeTarixi: string;
}

export interface PdfParentStats {
  toplamSual: number;
  dogruCavab: number;
  aktivGünSayı: number;
  streak: number;
}

export interface PdfScoreSimulation {
  bal: number;
  maksimalBal: number;
  qebulEhtimali: number;
  analiz?: string;
}

export interface PdfFennBal {
  fenn: string;
  bal: number;
  maksimal: number;
  dəqiqlik: number;
}

export interface PdfExamInput {
  student: PdfStudent;
  attempt: PdfExamAttempt;
  fennNetice: Record<string, { dogru: number; sehv: number; bos: number }>;
  kecidBali: number;
  aiAnaliz?: string;
}

export interface PdfParentInput {
  student: PdfStudent;
  report: PdfParentReport;
  stats: PdfParentStats;
}

export interface PdfScoreInput {
  student: PdfStudent;
  simulation: PdfScoreSimulation;
  fennBallari: PdfFennBal[];
}

// === Branded Header ===
function drawHeader(doc: jsPDF, student: PdfStudent) {
  const pageW = doc.internal.pageSize.getWidth();
  // Top navy bar
  doc.setFillColor(NAVY);
  doc.rect(0, 0, pageW, 22, "F");
  // Logo text — "BrightLine Academy"
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor("#FFFFFF");
  doc.text(normalizeAzText("BrightLine Academy"), 14, 14);
  // Date
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  const tarix = normalizeAzText(formatAzDate(new Date()));
  doc.text(tarix, pageW - 14, 14, { align: "right" });

  // Subtitle: student + qrup + hedef universite
  let y = 32;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(TEXT_DARK);
  doc.text(normalizeAzText(student.ad || "Sagird"), 14, y);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(MUTED);
  const subParts: string[] = [];
  if (student.qrup) subParts.push(normalizeAzText(`Qrup: ${student.qrup}`));
  if (student.hedefUniversite) subParts.push(normalizeAzText(`Hedef: ${student.hedefUniversite}`));
  if (subParts.length > 0) {
    doc.text(subParts.join("  ·  "), 14, y + 5);
  }

  // Separator xətt
  doc.setDrawColor(BORDER);
  doc.setLineWidth(0.5);
  doc.line(14, y + 10, pageW - 14, y + 10);

  return y + 18; // növbəti məzmun y-pos
}

// === Branded Footer ===
function drawFooter(doc: jsPDF) {
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const pageCount = doc.getNumberOfPages();

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    // Footer xətt
    doc.setDrawColor(BORDER);
    doc.setLineWidth(0.3);
    doc.line(14, pageH - 16, pageW - 14, pageH - 16);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(MUTED);

    const footerText = normalizeAzText("BrightLine Academy terefinden yaradildi");
    doc.text(footerText, 14, pageH - 9);

    const timestamp = normalizeAzText(
      `${formatAzDate(new Date())} ${formatAzTime(new Date())}`
    );
    doc.text(timestamp, pageW / 2, pageH - 9, { align: "center" });

    doc.text(normalizeAzText(`Sehife ${i} / ${pageCount}`), pageW - 14, pageH - 9, {
      align: "right",
    });
  }
}

// === Yardımçı: mətn sətirə böler (width limit) ===
function wrapText(doc: jsPDF, text: string, maxWidth: number): string[] {
  if (!text) return [];
  // normalizeAzText-dən sonra split
  const normalized = normalizeAzText(text);
  return doc.splitTextToSize(normalized, maxWidth) as string[];
}

// === Yardımçı: cədvəl başlığı ===
function drawTableHeader(
  doc: jsPDF,
  y: number,
  cols: { x: number; w: number; label: string; align?: "left" | "center" | "right" }[]
): number {
  const rowH = 8;
  // Header fon
  doc.setFillColor(NAVY);
  doc.rect(14, y, doc.internal.pageSize.getWidth() - 28, rowH, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor("#FFFFFF");

  for (const c of cols) {
    const align = c.align || "left";
    const x = align === "center" ? c.x + c.w / 2 : align === "right" ? c.x + c.w - 2 : c.x + 2;
    doc.text(normalizeAzText(c.label), x, y + 5.5, { align });
  }
  return y + rowH;
}

// === Yardımçı: cədvəl sətri ===
function drawTableRow(
  doc: jsPDF,
  y: number,
  cols: { x: number; w: number; value: string; align?: "left" | "center" | "right" }[],
  rowIndex: number
): number {
  const rowH = 7;
  // Zebra stripe
  if (rowIndex % 2 === 0) {
    doc.setFillColor(CREAM);
    doc.rect(14, y, doc.internal.pageSize.getWidth() - 28, rowH, "F");
  }
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(TEXT_DARK);

  for (const c of cols) {
    const align = c.align || "left";
    const x = align === "center" ? c.x + c.w / 2 : align === "right" ? c.x + c.w - 2 : c.x + 2;
    doc.text(normalizeAzText(c.value), x, y + 5, { align });
  }
  return y + rowH;
}

// === Yardımçı: səhifə yer yoxdursa yeni səhifə ===
function ensureSpace(doc: jsPDF, y: number, needed: number): number {
  const pageH = doc.internal.pageSize.getHeight();
  if (y + needed > pageH - 22) {
    doc.addPage();
    return 24;
  }
  return y;
}

// === Funksiya 1: exportExamResultPDF ===
export function exportExamResultPDF(data: PdfExamInput): void {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  let y = drawHeader(doc, data.student);

  // Başlıq
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(TEXT_DARK);
  doc.text(normalizeAzText("Imtahan Neticesi"), 14, y);
  y += 10;

  // Tarix (createdAt)
  if (data.attempt.createdAt) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(MUTED);
    try {
      const d = new Date(data.attempt.createdAt);
      doc.text(normalizeAzText(`Tarix: ${formatAzDate(d)} ${formatAzTime(d)}`), 14, y);
    } catch {
      // ignore
    }
    y += 8;
  } else {
    y += 4;
  }

  // Big bal score (centered)
  const passed = data.attempt.bal >= data.kecidBali;
  y = ensureSpace(doc, y, 30);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(40);
  doc.setTextColor(passed ? EMERALD : RED);
  const balText = String(data.attempt.bal);
  doc.text(balText, pageW / 2, y + 10, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(MUTED);
  doc.text(normalizeAzText(`Toplam bal · Maksimal mümkün: ${data.attempt.sualSayi * 10} bal`), pageW / 2, y + 16, {
    align: "center",
  });
  y += 22;

  // Pass/fail badge
  y = ensureSpace(doc, y, 12);
  const badgeW = 70;
  const badgeH = 9;
  const badgeX = (pageW - badgeW) / 2;
  doc.setFillColor(passed ? EMERALD : RED);
  doc.roundedRect(badgeX, y, badgeW, badgeH, 2, 2, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor("#FFFFFF");
  const badgeText = passed ? "KECDIN" : "TEKRAR LAZIMDIR";
  doc.text(badgeText, pageW / 2, y + 6.2, { align: "center" });

  // Keçid balı alt yazı
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(MUTED);
  const diff = data.attempt.bal - data.kecidBali;
  const diffText = `${diff >= 0 ? "+" : ""}${diff} bal · Kecid bali: ${data.kecidBali}`;
  doc.text(normalizeAzText(diffText), pageW / 2, y + 14, { align: "center" });
  y += 20;

  // Stats table
  y = ensureSpace(doc, y, 20);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(TEXT_DARK);
  doc.text(normalizeAzText("Umumi Statistika"), 14, y);
  y += 4;

  const accuracy =
    data.attempt.sualSayi > 0
      ? Math.round((data.attempt.dogruCavab / data.attempt.sualSayi) * 100)
      : 0;
  const müddetDəq = Math.floor((data.attempt.müddetSan || 0) / 60);
  const müddetSan = (data.attempt.müddetSan || 0) % 60;
  const müddetText = `${müddetDəq} dəq ${müddetSan} san`;

  const statsCols = [
    { label: "Sual sayi", value: String(data.attempt.sualSayi) },
    { label: "Dogru", value: String(data.attempt.dogruCavab) },
    { label: "Sehv", value: String(data.attempt.sehvCavab) },
    { label: "Bos", value: String(data.attempt.bosCavab) },
    { label: "Dəqiqlik", value: `${accuracy}%` },
    { label: "Muddet", value: normalizeAzText(müddetText) },
  ];
  const statColW = (pageW - 28) / statsCols.length;
  y = drawTableHeader(
    doc,
    y,
    statsCols.map((s, i) => ({
      x: 14 + i * statColW,
      w: statColW,
      label: normalizeAzText(s.label),
      align: "center",
    }))
  );
  y = drawTableRow(
    doc,
    y,
    statsCols.map((s, i) => ({
      x: 14 + i * statColW,
      w: statColW,
      value: s.value,
      align: "center",
    })),
    0
  );
  y += 8;

  // Fenn bölgüsü table
  const fennEntries = Object.entries(data.fennNetice || {});
  if (fennEntries.length > 0) {
    y = ensureSpace(doc, y, 20 + fennEntries.length * 8);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(TEXT_DARK);
    doc.text(normalizeAzText("Fenn Bolgusu"), 14, y);
    y += 4;

    const colFenn = (pageW - 28) * 0.4;
    const colDogru = (pageW - 28) * 0.15;
    const colSehv = (pageW - 28) * 0.15;
    const colBos = (pageW - 28) * 0.15;
    const colBal = (pageW - 28) * 0.15;
    y = drawTableHeader(doc, y, [
      { x: 14, w: colFenn, label: "Fenn", align: "left" },
      { x: 14 + colFenn, w: colDogru, label: "Dogru", align: "center" },
      { x: 14 + colFenn + colDogru, w: colSehv, label: "Sehv", align: "center" },
      { x: 14 + colFenn + colDogru + colSehv, w: colBos, label: "Bos", align: "center" },
      { x: 14 + colFenn + colDogru + colSehv + colBos, w: colBal, label: "Bal", align: "center" },
    ]);
    fennEntries.forEach(([fenn, n], i) => {
      const total = n.dogru + n.sehv + n.bos;
      const fennBal = Math.max(0, Math.round(n.dogru * 10 - n.sehv * 2.5));
      y = drawTableRow(
        doc,
        y,
        [
          { x: 14, w: colFenn, value: fenn, align: "left" },
          { x: 14 + colFenn, w: colDogru, value: String(n.dogru), align: "center" },
          { x: 14 + colFenn + colDogru, w: colSehv, value: String(n.sehv), align: "center" },
          { x: 14 + colFenn + colDogru + colSehv, w: colBos, value: String(n.bos), align: "center" },
          {
            x: 14 + colFenn + colDogru + colSehv + colBos,
            w: colBal,
            value: String(fennBal),
            align: "center",
          },
        ],
        i
      );
      // Add line for total fenn sual
      doc.setFont("helvetica", "italic");
      doc.setFontSize(7);
      doc.setTextColor(MUTED);
      doc.text(
        normalizeAzText(`${total} sual`),
        14 + colFenn + colDogru + colSehv + colBos + colBal - 2,
        y - 1.5,
        { align: "right" }
      );
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(TEXT_DARK);
    });
    y += 6;
  }

  // AI Analiz (varsa)
  if (data.aiAnaliz && data.aiAnaliz.trim().length > 0) {
    const plainText = stripMarkdown(data.aiAnaliz);
    if (plainText) {
      const lines = wrapText(doc, plainText, pageW - 28);
      y = ensureSpace(doc, y, 16 + lines.length * 5);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(TEXT_DARK);
      doc.text(normalizeAzText("AI Analizi"), 14, y);
      y += 6;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(TEXT_DARK);
      for (const line of lines) {
        y = ensureSpace(doc, y, 6);
        doc.text(line, 14, y);
        y += 5;
      }
    }
  }

  drawFooter(doc);
  doc.save(normalizeAzText(`imtahan-neticesi-${data.student.ad || "sagird"}-${Date.now()}.pdf`));
}

// === Funksiya 2: exportParentReportPDF ===
export function exportParentReportPDF(data: PdfParentInput): void {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  let y = drawHeader(doc, data.student);

  // Başlıq
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(TEXT_DARK);
  doc.text(normalizeAzText("Heftelik Valideyn Raportu"), 14, y);
  y += 7;

  // Date range
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(MUTED);
  let dateRange = "";
  try {
    const start = new Date(data.report.baslamaTarixi);
    const end = new Date(data.report.bitmeTarixi);
    dateRange = `${formatAzDateShort(start)} - ${formatAzDateShort(end)}`;
  } catch {
    dateRange = `${data.report.baslamaTarixi} - ${data.report.bitmeTarixi}`;
  }
  doc.text(normalizeAzText(`Dovr: ${dateRange}`), 14, y);
  y += 8;

  // Stats summary cards (4 dənə)
  const stats = data.stats;
  const accuracy =
    stats.toplamSual > 0 ? Math.round((stats.dogruCavab / stats.toplamSual) * 100) : 0;

  const cardW = (pageW - 28 - 6) / 4; // 4 kart, 2mm boşluq
  const cardH = 18;
  const statsArr = [
    { label: "Sual sayi", value: String(stats.toplamSual), color: NAVY },
    { label: "Dəqiqlik", value: `${accuracy}%`, color: EMERALD },
    { label: "Aktiv gun", value: String(stats.aktivGünSayı), color: NAVY },
    { label: "Streak", value: `${stats.streak} gun`, color: EMERALD },
  ];
  y = ensureSpace(doc, y, cardH + 4);
  statsArr.forEach((s, i) => {
    const x = 14 + i * (cardW + 2);
    // Kart fonu
    doc.setFillColor(CREAM);
    doc.roundedRect(x, y, cardW, cardH, 2, 2, "F");
    // Sol rəngli zolaq
    doc.setFillColor(s.color);
    doc.roundedRect(x, y, 1.5, cardH, 0.5, 0.5, "F");
    // Dəyər
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(s.color);
    doc.text(s.value, x + 4, y + 8);
    // Label
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(MUTED);
    doc.text(normalizeAzText(s.label), x + 4, y + 13);
  });
  y += cardH + 6;

  // Separator
  doc.setDrawColor(BORDER);
  doc.setLineWidth(0.4);
  doc.line(14, y, pageW - 14, y);
  y += 6;

  // Report text — markdown-ı strip edib plain text kimi yaz
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(TEXT_DARK);
  doc.text(normalizeAzText("AI Raportu"), 14, y);
  y += 6;

  const plainText = stripMarkdown(data.report.metin || "");
  if (plainText) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(TEXT_DARK);
    const lines = wrapText(doc, plainText, pageW - 28);
    for (const line of lines) {
      y = ensureSpace(doc, y, 6);
      doc.text(line, 14, y);
      y += 5;
    }
  } else {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(9);
    doc.setTextColor(MUTED);
    doc.text(normalizeAzText("Raport metni bosdur."), 14, y);
  }

  drawFooter(doc);
  doc.save(normalizeAzText(`valideyn-raportu-${data.student.ad || "sagird"}-${Date.now()}.pdf`));
}

// === Funksiya 3: exportScoreSimulationPDF ===
export function exportScoreSimulationPDF(data: PdfScoreInput): void {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  let y = drawHeader(doc, data.student);

  // Başlıq
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(TEXT_DARK);
  doc.text(normalizeAzText("Bal Simulyasiyasi"), 14, y);
  y += 10;

  // Big bal score (centered)
  const sim = data.simulation;
  const passThreshold = 300; // tipik TQDK keçid balı
  const passed = sim.bal >= passThreshold;
  y = ensureSpace(doc, y, 30);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(36);
  doc.setTextColor(passed ? EMERALD : AMBER);
  doc.text(String(sim.bal), pageW / 2 - 8, y + 10, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(MUTED);
  doc.text(
    normalizeAzText(`/ ${sim.maksimalBal} bal`),
    pageW / 2 + 18,
    y + 10,
    { align: "center" }
  );

  // Dəqiqlik
  const accuracy =
    sim.maksimalBal > 0 ? Math.round((sim.bal / sim.maksimalBal) * 100) : 0;
  doc.setFontSize(9);
  doc.text(
    normalizeAzText(`Dəqiqlik: ${accuracy}%`),
    pageW / 2,
    y + 16,
    { align: "center" }
  );
  y += 22;

  // Qebul ehtimalı — bar visualization
  y = ensureSpace(doc, y, 20);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(TEXT_DARK);
  doc.text(normalizeAzText("Qebul Ehtimali"), 14, y);
  y += 5;

  const qebul = Math.max(0, Math.min(100, sim.qebulEhtimali || 0));
  const barW = pageW - 28;
  const barH = 8;
  // Bar arxa fon
  doc.setFillColor(CREAM);
  doc.roundedRect(14, y, barW, barH, 1.5, 1.5, "F");
  // Bar dolu hissə — rəng ehtimala görə
  const qebulColor = qebul >= 60 ? EMERALD : qebul >= 40 ? AMBER : RED;
  doc.setFillColor(qebulColor);
  if (qebul > 0) {
    doc.roundedRect(14, y, (barW * qebul) / 100, barH, 1.5, 1.5, "F");
  }
  // Yüzdə göstərici
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor("#FFFFFF");
  if (qebul > 10) {
    doc.text(`${qebul}%`, 14 + (barW * qebul) / 100 - 4, y + 5.5, { align: "right" });
  } else {
    doc.setTextColor(qebulColor);
    doc.text(`${qebul}%`, 14 + 4, y + 5.5);
  }
  y += barH + 8;

  // Fenn ballari table
  if (data.fennBallari.length > 0) {
    y = ensureSpace(doc, y, 20 + data.fennBallari.length * 8);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(TEXT_DARK);
    doc.text(normalizeAzText("Fenn Ballari"), 14, y);
    y += 4;

    const colFenn = (pageW - 28) * 0.4;
    const colBal = (pageW - 28) * 0.2;
    const colMax = (pageW - 28) * 0.2;
    const colDəq = (pageW - 28) * 0.2;
    y = drawTableHeader(doc, y, [
      { x: 14, w: colFenn, label: "Fenn", align: "left" },
      { x: 14 + colFenn, w: colBal, label: "Bal", align: "center" },
      { x: 14 + colFenn + colBal, w: colMax, label: "Maksimal", align: "center" },
      { x: 14 + colFenn + colBal + colMax, w: colDəq, label: "Dəqiqlik", align: "center" },
    ]);
    data.fennBallari.forEach((fb, i) => {
      y = drawTableRow(
        doc,
        y,
        [
          { x: 14, w: colFenn, value: fb.fenn, align: "left" },
          { x: 14 + colFenn, w: colBal, value: String(fb.bal), align: "center" },
          {
            x: 14 + colFenn + colBal,
            w: colMax,
            value: String(fb.maksimal),
            align: "center",
          },
          {
            x: 14 + colFenn + colBal + colMax,
            w: colDəq,
            value: `${fb.dəqiqlik}%`,
            align: "center",
          },
        ],
        i
      );
    });
    y += 6;
  }

  // AI Analiz (varsa)
  if (sim.analiz && sim.analiz.trim().length > 0) {
    const plainText = stripMarkdown(sim.analiz);
    if (plainText) {
      const lines = wrapText(doc, plainText, pageW - 28);
      y = ensureSpace(doc, y, 16 + lines.length * 5);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(TEXT_DARK);
      doc.text(normalizeAzText("AI Analizi"), 14, y);
      y += 6;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(TEXT_DARK);
      for (const line of lines) {
        y = ensureSpace(doc, y, 6);
        doc.text(line, 14, y);
        y += 5;
      }
    }
  }

  drawFooter(doc);
  doc.save(normalizeAzText(`bal-simulyasiyasi-${data.student.ad || "sagird"}-${Date.now()}.pdf`));
}
