"use client";

import * as React from "react";
import { Eye, Download, FileText, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

// Chrome (və digər Chromium-əsaslı brauzerlər) `data:` URI-ni birbaşa yeni tabda
// (target="_blank") açmağı BLOKLAYIR — "about:blank#blocked" nəticəsi budur (təhlükəsizlik
// qaydası, phishing-in qarşısını almaq üçün). Həll: data URI-ni əvvəlcə Blob-a çevirib
// müvəqqəti bir `blob:` URL yaratmaq — bu tip URL-lər bloklanmır. `download` atributu ilə
// yükləmə isə data: URI-dən problemsiz işləyir, ona görə "Yüklə" düyməsi dəyişməyib.
export function openDataUriInNewTab(dataUri: string) {
  try {
    const commaIdx = dataUri.indexOf(",");
    const header = dataUri.slice(0, commaIdx);
    const base64 = dataUri.slice(commaIdx + 1);
    const mimeMatch = header.match(/data:(.*?);base64/);
    const mime = mimeMatch ? mimeMatch[1] : "application/octet-stream";

    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    const blob = new Blob([bytes], { type: mime });
    const url = URL.createObjectURL(blob);

    window.open(url, "_blank", "noopener,noreferrer");
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  } catch {
    // Base64 parse alınmasa, ən azı əvvəlki (bəzi hallarda işləyən) davranışa geri düş.
    window.open(dataUri, "_blank", "noopener,noreferrer");
  }
}

/** `data:` URI-ni fayl kimi yükləyir. `<a download>` çoxu halda işləsə də, bəzi böyük
 * PDF-lərdə/brauzerlərdə etibarsızdır — burada Blob URL-ə çevirib açıq şəkildə yükləyirik. */
export function downloadDataUri(dataUri: string, filename: string) {
  try {
    const commaIdx = dataUri.indexOf(",");
    const header = dataUri.slice(0, commaIdx);
    const base64 = dataUri.slice(commaIdx + 1);
    const mimeMatch = header.match(/data:(.*?);base64/);
    const mime = mimeMatch ? mimeMatch[1] : "application/octet-stream";
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    const blob = new Blob([bytes], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  } catch {
    const a = document.createElement("a");
    a.href = dataUri;
    a.download = filename;
    a.click();
  }
}

/** Fayl əlavəsi üçün "Oxu" (brauzerdə yeni tabda aç) / "Yüklə" (kompüterə saxla) düymələri —
 * bir `<a download>` linkinin əvəzinə, çünki əvvəlki tək-klik həmişə yükləməyə məcbur edirdi
 * (PDF-lər üçün istifadəçi əvvəlcə brauzerdə baxmaq istəyə bilər). */
export function FileAttachmentLink({
  data,
  ad,
  tip,
  className,
}: {
  data: string;
  ad: string;
  tip?: string;
  className?: string;
}) {
  const Icon = tip === "image" ? ImageIcon : FileText;
  return (
    <div className={cn("flex items-center gap-1 rounded-lg border border-border bg-muted/30 pl-2 pr-1 py-1 text-xs", className)}>
      <Icon className="size-3.5 shrink-0 text-muted-foreground" />
      <span className="max-w-[10rem] truncate">{ad}</span>
      <button
        type="button"
        onClick={() => openDataUriInNewTab(data)}
        title="Brauzerdə oxu"
        className="flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
      >
        <Eye className="size-3.5" />
      </button>
      <a
        href={data}
        download={ad}
        title="Yüklə"
        className="flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
      >
        <Download className="size-3.5" />
      </a>
    </div>
  );
}
