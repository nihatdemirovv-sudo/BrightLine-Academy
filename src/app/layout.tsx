import type { Metadata, Viewport } from "next";
import { Inter, Plus_Jakarta_Sans, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const grotesk = Space_Grotesk({
  variable: "--font-grotesk",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "BrightLine Academy — Ağıllı Hazırlıq Platforması",
  description:
    "Azerbaycanlı şagirdler üçün süni intellekt dəstəkli TQDK və Magistr hazırlıq platforması. AI hoca, sonsuz sual generatoru və fərdi öyrənmə planı.",
  keywords: [
    "TQDK",
    "Magistr",
    "Azerbaycan",
    "AI hazırlıq",
    "qəbul imtahanı",
    "AI tutor",
    "sual generatoru",
  ],
  authors: [{ name: "BrightLine Academy" }],
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { url: "/icon-1024.png", sizes: "1024x1024", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
    shortcut: ["/icon.svg"],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "BrightLine",
  },
  openGraph: {
    title: "BrightLine Academy",
    description: "Ağıllı AI hazırlıq platforması",
    type: "website",
  },
  applicationName: "BrightLine Academy",
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FAFAF7" },
    { media: "(prefers-color-scheme: dark)", color: "#0A1128" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="az" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${jakarta.variable} ${grotesk.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
