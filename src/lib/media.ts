// Şəkil sıxılması + fayl ölçü hədləri — serverin (az RAM: -Xmx320m) böyük base64
// yükləmələrdən çökməməsi üçün. Şəkillər brauzerdə YÜKLƏNMƏZDƏN ƏVVƏL kiçildilir
// (məs. 100 MB foto → ~0.3-0.8 MB JPEG), PDF-lər isə sərt ölçü limitinə tabedir.

export const MAX_PDF_BYTES = 250 * 1024 * 1024; // 250 MB (istifadəçi tələbi — daha güclü serverə keçid planlaşdırılır)
export const PDF_TOO_BIG_MSG =
  "PDF yaddaşı çox böyük olduğu üçün yüklənə bilmədi (maksimum 250 MB).";

// Sıxılmadan əvvəl brauzerin dekod edə biləcəyi maksimum mənbə ölçüsü (çox böyük
// faylı canvas-a çəkmək tab-ı dondura bilər).
const MAX_SOURCE_IMAGE_BYTES = 60 * 1024 * 1024;

interface CompressOpts {
  maxDim?: number; // ən uzun kənarın maksimum piksel ölçüsü
  quality?: number; // başlanğıc JPEG keyfiyyəti (0-1)
  targetBytes?: number; // bu ölçüdən aşağı düşənə qədər keyfiyyət azaldılır
}

export function readFileAsDataURL(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Fayl oxunmadı"));
    reader.readAsDataURL(file);
  });
}

function blobToDataURL(blob: Blob): Promise<string> {
  return readFileAsDataURL(blob);
}

async function loadBitmap(file: File): Promise<{ width: number; height: number; draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void; close: () => void }> {
  // Modern yol — createImageBitmap (EXIF orientasiyasını da nəzərə alır)
  if (typeof createImageBitmap === "function") {
    try {
      const bmp = await createImageBitmap(file, { imageOrientation: "from-image" as ImageBitmapOptions["imageOrientation"] });
      return {
        width: bmp.width,
        height: bmp.height,
        draw: (ctx, w, h) => ctx.drawImage(bmp, 0, 0, w, h),
        close: () => bmp.close(),
      };
    } catch {
      /* köhnə brauzer / dəstəklənməyən format — <img> ilə fallback */
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("Şəkil yüklənmədi"));
      el.src = url;
    });
    return {
      width: img.naturalWidth,
      height: img.naturalHeight,
      draw: (ctx, w, h) => ctx.drawImage(img, 0, 0, w, h),
      close: () => URL.revokeObjectURL(url),
    };
  } catch (e) {
    URL.revokeObjectURL(url);
    throw e;
  }
}

/**
 * Şəkil faylını kiçildilmiş JPEG data-URI-yə çevirir. Şəkil deyilsə xəta atır.
 * Onsuz da kiçik olan (< ~500 KB) şəkillər toxunulmadan qaytarılır.
 */
export async function compressImageFile(file: File, opts: CompressOpts = {}): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Yalnız şəkil faylı sıxıla bilər");
  }
  if (file.size > MAX_SOURCE_IMAGE_BYTES) {
    throw new Error("Şəkil həddindən böyükdür");
  }
  // GIF (animasiyalı ola bilər) və SVG üçün sıxma tətbiq etmirik — olduğu kimi ötürülür.
  if (file.type === "image/gif" || file.type === "image/svg+xml" || file.size <= 500 * 1024) {
    return readFileAsDataURL(file);
  }

  const maxDim = opts.maxDim ?? 1800;
  const targetBytes = opts.targetBytes ?? 1_000_000;
  let quality = opts.quality ?? 0.82;

  const src = await loadBitmap(file);
  try {
    let scale = Math.min(1, maxDim / Math.max(src.width, src.height));
    let out = await render(src, scale, quality);

    // Hələ də hədəfdən böyükdürsə: əvvəl keyfiyyəti, sonra ölçünü azalt.
    let guard = 0;
    while (out.size > targetBytes && guard < 6) {
      guard++;
      if (quality > 0.45) {
        quality -= 0.12;
      } else {
        scale *= 0.8;
      }
      out = await render(src, scale, Math.max(quality, 0.4));
    }
    return await blobToDataURL(out);
  } finally {
    src.close();
  }
}

async function render(
  src: { width: number; height: number; draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void },
  scale: number,
  quality: number
): Promise<Blob> {
  const w = Math.max(1, Math.round(src.width * scale));
  const h = Math.max(1, Math.round(src.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas dəstəklənmir");
  // Şəffaf PNG-lər üçün ağ fon (JPEG şəffaflığı dəstəkləmir)
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, w, h);
  src.draw(ctx, w, h);
  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Şəkil emal edilə bilmədi"))),
      "image/jpeg",
      quality
    );
  });
}
