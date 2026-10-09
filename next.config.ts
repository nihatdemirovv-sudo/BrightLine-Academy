import type { NextConfig } from "next";

// Backend Spring Boot-dur (bax: /backend). İki iş rejimi var:
//
// 1) Dev / ayrı deployment (default): Next.js öz serverini işlədir, /api/*
//    sorğuları rewrites() ilə ayrıca işləyən Spring backend-ə (SPRING_BACKEND_URL)
//    proxy edilir. `bun run dev` və ya `bun run build && bun run start`.
//
// 2) Statik export (Spring "resources/static"-ə yerləşdirmək üçün): heç bir Node
//    server olmadan, Spring Boot həm statik frontend-i, həm də /api/*-ı eyni
//    origin-dən verir — rewrites lazım deyil, çünki nisbi fetch("/api/...")
//    birbaşa Spring-ə düşür. `NEXT_STATIC_EXPORT=1 bun run build` ilə aktivləşir
//    (nəticə: `out/` qovluğu → backend/src/main/resources/static-ə kopyalanır).
const STATIC_EXPORT = process.env.NEXT_STATIC_EXPORT === "1";
const SPRING_BACKEND_URL = process.env.SPRING_BACKEND_URL || "http://localhost:8080";

const nextConfig: NextConfig = {
  output: STATIC_EXPORT ? "export" : "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  images: {
    unoptimized: true,
  },
  ...(!STATIC_EXPORT && {
    async rewrites() {
      return [
        {
          source: "/api/:path*",
          destination: `${SPRING_BACKEND_URL}/api/:path*`,
        },
      ];
    },
  }),
};

export default nextConfig;
