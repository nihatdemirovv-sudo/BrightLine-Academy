import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Azerbaycan dili üçün tarix formatlaması (locale dəstəyi olmasa da işləyir)
const AZ_AYLAR = [
  "Yanvar", "Fevral", "Mart", "Aprel", "May", "İyun",
  "İyul", "Avqust", "Sentyabr", "Oktyabr", "Noyabr", "Dekabr",
];

const AZ_AYLAR_QISA = [
  "Yan", "Fev", "Mar", "Apr", "May", "İyn",
  "İyl", "Avq", "Sen", "Okt", "Noy", "Dek",
];

const AZ_GÜNLƏR = [
  "Bazar", "Bazar ertəsi", "Çərşənbə axşamı", "Çərşənbə",
  "Cümə axşamı", "Cümə", "Şənbə",
];

const AZ_GÜNLƏR_QISA = [
  "Baz", "Baz e", "Çər a", "Çər", "Cüm a", "Cüm", "Şən",
];

// "15 Avqust, Şənbə" formatı
export function azDate(date: Date = new Date()): string {
  const d = new Date(date);
  return `${d.getDate()} ${AZ_AYLAR[d.getMonth()]}, ${AZ_GÜNLƏR[d.getDay()]}`;
}

// "15 Avq" qısa format
export function azDateShort(date: Date = new Date()): string {
  const d = new Date(date);
  return `${d.getDate()} ${AZ_AYLAR_QISA[d.getMonth()]}`;
}

// "2024-08-15" ISO format (DB üçün)
export function azDateISO(date: Date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

// "15 Avq - 21 Avq" aralıq formatı
export function azDateRange(start: Date, end: Date): string {
  return `${azDateShort(start)} - ${azDateShort(end)}`;
}

