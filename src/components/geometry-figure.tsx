"use client";

import * as React from "react";
import type { GeometryFigureSpec } from "@/lib/store";

// AI şəkil çəkə bilmədiyi üçün (vizion/generasiya modeli yoxdur) həndəsi fiqurları
// strukturlaşdırılmış məlumatdan (bax GeneratedQuestion.figura backend-də) SVG ilə
// illüstrativ şəkildə çəkirik — dəqiq miqyasda DEYİL, sadəcə fiqurun formasını göstərir,
// dəqiq ölçülər/bucaqlar HƏMİŞƏ sualın mətnində sözlə də verilir (əsas mənbə mətndir).
const STROKE = "#1E3A8A";
const LABEL = "currentColor";
const FILL = "#1E3A8A14";

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex justify-center py-2">
      <svg
        width="180"
        height="180"
        viewBox="0 0 200 200"
        className="text-foreground"
        role="img"
        aria-label="Fiqur"
      >
        {children}
      </svg>
    </div>
  );
}

function TriangleFigure({ figura }: { figura: Extract<GeometryFigureSpec, { type: "triangle" }> }) {
  const hasRight = figura.rightAngleAt !== null && figura.rightAngleAt !== undefined;
  // Bucaq indeksi (0/1/2) düz bucaqdadırsa L-şəkilli, əks halda ümumi üçbucaq.
  const pointsByRight: Record<number, [number, number][]> = {
    0: [[40, 160], [40, 40], [170, 160]],
    1: [[40, 40], [170, 40], [40, 160]],
    2: [[40, 40], [170, 160], [170, 40]],
  };
  const points: [number, number][] = hasRight
    ? pointsByRight[figura.rightAngleAt as number]
    : [[100, 30], [30, 170], [170, 170]];

  const [p0, p1, p2] = points;
  const mid = (a: [number, number], b: [number, number]): [number, number] => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const outward = (m: [number, number], center: [number, number], dist = 14): [number, number] => {
    const dx = m[0] - center[0];
    const dy = m[1] - center[1];
    const len = Math.hypot(dx, dy) || 1;
    return [m[0] + (dx / len) * dist, m[1] + (dy / len) * dist];
  };
  const centroid: [number, number] = [(p0[0] + p1[0] + p2[0]) / 3, (p0[1] + p1[1] + p2[1]) / 3];

  const edges: [[number, number], [number, number]][] = [[p0, p1], [p1, p2], [p2, p0]];
  const sides = figura.sides || [];
  const angles = figura.angles || [];

  return (
    <Wrapper>
      <polygon points={points.map((p) => p.join(",")).join(" ")} fill={FILL} stroke={STROKE} strokeWidth="2" strokeLinejoin="round" />
      {edges.map(([a, b], i) => {
        const label = sides[i];
        if (!label) return null;
        const [lx, ly] = outward(mid(a, b), centroid);
        return (
          <text key={i} x={lx} y={ly} fontSize="11" textAnchor="middle" dominantBaseline="middle" fill={LABEL}>
            {label}
          </text>
        );
      })}
      {points.map((p, i) => {
        if (hasRight && i === figura.rightAngleAt) {
          // Düz bucaq üçün kiçik kvadrat işarə
          const other1 = points[(i + 1) % 3];
          const other2 = points[(i + 2) % 3];
          const d1x = (other1[0] - p[0]) / Math.hypot(other1[0] - p[0], other1[1] - p[1]) * 12;
          const d1y = (other1[1] - p[1]) / Math.hypot(other1[0] - p[0], other1[1] - p[1]) * 12;
          const d2x = (other2[0] - p[0]) / Math.hypot(other2[0] - p[0], other2[1] - p[1]) * 12;
          const d2y = (other2[1] - p[1]) / Math.hypot(other2[0] - p[0], other2[1] - p[1]) * 12;
          return (
            <polyline
              key={i}
              points={`${p[0] + d1x},${p[1] + d1y} ${p[0] + d1x + d2x},${p[1] + d1y + d2y} ${p[0] + d2x},${p[1] + d2y}`}
              fill="none"
              stroke={STROKE}
              strokeWidth="1.5"
            />
          );
        }
        const label = angles[i];
        if (!label) return null;
        const [lx, ly] = outward(p, centroid, -18);
        return (
          <text key={i} x={lx} y={ly} fontSize="10" textAnchor="middle" dominantBaseline="middle" fill={LABEL}>
            {label}
          </text>
        );
      })}
    </Wrapper>
  );
}

function RectangleFigure({ figura }: { figura: Extract<GeometryFigureSpec, { type: "rectangle" }> }) {
  const w = figura.square ? 130 : 150;
  const h = figura.square ? 130 : 90;
  const x = (200 - w) / 2;
  const y = (200 - h) / 2;
  return (
    <Wrapper>
      <rect x={x} y={y} width={w} height={h} fill={FILL} stroke={STROKE} strokeWidth="2" />
      {figura.width && (
        <text x={x + w / 2} y={y - 8} fontSize="11" textAnchor="middle" fill={LABEL}>
          {figura.width}
        </text>
      )}
      {figura.height && !figura.square && (
        <text x={x - 10} y={y + h / 2} fontSize="11" textAnchor="end" dominantBaseline="middle" fill={LABEL}>
          {figura.height}
        </text>
      )}
    </Wrapper>
  );
}

function CircleFigure({ figura }: { figura: Extract<GeometryFigureSpec, { type: "circle" }> }) {
  const cx = 100;
  const cy = 100;
  const r = 70;
  return (
    <Wrapper>
      <circle cx={cx} cy={cy} r={r} fill={FILL} stroke={STROKE} strokeWidth="2" />
      <circle cx={cx} cy={cy} r="2.5" fill={STROKE} />
      {figura.radius && !figura.diameter && (
        <>
          <line x1={cx} y1={cy} x2={cx + r} y2={cy} stroke={STROKE} strokeWidth="1.5" />
          <text x={cx + r / 2} y={cy - 8} fontSize="11" textAnchor="middle" fill={LABEL}>
            {figura.radius}
          </text>
        </>
      )}
      {figura.diameter && (
        <>
          <line x1={cx - r} y1={cy} x2={cx + r} y2={cy} stroke={STROKE} strokeWidth="1.5" />
          <text x={cx} y={cy - 8} fontSize="11" textAnchor="middle" fill={LABEL}>
            {figura.diameter}
          </text>
        </>
      )}
    </Wrapper>
  );
}

function TrapezoidFigure({ figura }: { figura: Extract<GeometryFigureSpec, { type: "trapezoid" }> }) {
  const bl: [number, number] = [30, 160];
  const br: [number, number] = [170, 160];
  const tl: [number, number] = [65, 60];
  const tr: [number, number] = [135, 60];
  return (
    <Wrapper>
      <polygon
        points={[bl, br, tr, tl].map((p) => p.join(",")).join(" ")}
        fill={FILL}
        stroke={STROKE}
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <line x1={tl[0]} y1={tl[1]} x2={tl[0]} y2={bl[1]} stroke={STROKE} strokeWidth="1" strokeDasharray="3,3" />
      {figura.b && (
        <text x={(tl[0] + tr[0]) / 2} y={tl[1] - 10} fontSize="11" textAnchor="middle" fill={LABEL}>
          {figura.b}
        </text>
      )}
      {figura.a && (
        <text x={(bl[0] + br[0]) / 2} y={bl[1] + 16} fontSize="11" textAnchor="middle" fill={LABEL}>
          {figura.a}
        </text>
      )}
      {figura.height && (
        <text x={tl[0] - 8} y={(tl[1] + bl[1]) / 2} fontSize="11" textAnchor="end" dominantBaseline="middle" fill={LABEL}>
          {figura.height}
        </text>
      )}
    </Wrapper>
  );
}

const ANGLE_SPREAD: Record<string, number> = {
  iti: 50,
  düz: 90,
  kor: 130,
  düzxətli: 180,
};

function AngleFigure({ figura }: { figura: Extract<GeometryFigureSpec, { type: "angle" }> }) {
  const vertex: [number, number] = [50, 160];
  const spreadDeg = ANGLE_SPREAD[figura.kind || "iti"] ?? 50;
  const baseAngle = 0; // birinci şüa üfüqi
  const rad = (deg: number) => (deg * Math.PI) / 180;
  const rayLen = 130;
  const ray1: [number, number] = [vertex[0] + rayLen, vertex[1]];
  const ray2: [number, number] = [
    vertex[0] + rayLen * Math.cos(rad(baseAngle + spreadDeg)),
    vertex[1] - rayLen * Math.sin(rad(baseAngle + spreadDeg)),
  ];
  const arcR = 30;
  const arcStart: [number, number] = [vertex[0] + arcR, vertex[1]];
  const arcEnd: [number, number] = [
    vertex[0] + arcR * Math.cos(rad(baseAngle + spreadDeg)),
    vertex[1] - arcR * Math.sin(rad(baseAngle + spreadDeg)),
  ];
  const largeArc = spreadDeg > 180 ? 1 : 0;

  if (figura.kind === "düz") {
    return (
      <Wrapper>
        <line x1={vertex[0]} y1={vertex[1]} x2={ray1[0]} y2={ray1[1]} stroke={STROKE} strokeWidth="2" />
        <line x1={vertex[0]} y1={vertex[1]} x2={ray2[0]} y2={ray2[1]} stroke={STROKE} strokeWidth="2" />
        <polyline
          points={`${vertex[0] + 14},${vertex[1]} ${vertex[0] + 14},${vertex[1] - 14} ${vertex[0]},${vertex[1] - 14}`}
          fill="none"
          stroke={STROKE}
          strokeWidth="1.5"
        />
        {figura.value && (
          <text x={vertex[0] + 22} y={vertex[1] - 22} fontSize="11" fill={LABEL}>
            {figura.value}
          </text>
        )}
      </Wrapper>
    );
  }

  return (
    <Wrapper>
      <line x1={vertex[0]} y1={vertex[1]} x2={ray1[0]} y2={ray1[1]} stroke={STROKE} strokeWidth="2" />
      <line x1={vertex[0]} y1={vertex[1]} x2={ray2[0]} y2={ray2[1]} stroke={STROKE} strokeWidth="2" />
      <path
        d={`M ${arcStart[0]} ${arcStart[1]} A ${arcR} ${arcR} 0 ${largeArc} 0 ${arcEnd[0]} ${arcEnd[1]}`}
        fill="none"
        stroke={STROKE}
        strokeWidth="1.5"
      />
      {figura.value && (
        <text
          x={vertex[0] + (arcR + 16) * Math.cos(rad(baseAngle + spreadDeg / 2))}
          y={vertex[1] - (arcR + 16) * Math.sin(rad(baseAngle + spreadDeg / 2))}
          fontSize="11"
          textAnchor="middle"
          fill={LABEL}
        >
          {figura.value}
        </text>
      )}
    </Wrapper>
  );
}

function CylinderFigure({ figura }: { figura: Extract<GeometryFigureSpec, { type: "cylinder" }> }) {
  return (
    <Wrapper>
      <ellipse cx="100" cy="60" rx="50" ry="18" fill={FILL} stroke={STROKE} strokeWidth="2" />
      <line x1="50" y1="60" x2="50" y2="160" stroke={STROKE} strokeWidth="2" />
      <line x1="150" y1="60" x2="150" y2="160" stroke={STROKE} strokeWidth="2" />
      <path d="M 50 160 A 50 18 0 0 0 150 160" fill="none" stroke={STROKE} strokeWidth="2" />
      {figura.radius && (
        <>
          <line x1="100" y1="60" x2="150" y2="60" stroke={STROKE} strokeWidth="1.5" />
          <text x="125" y="52" fontSize="11" textAnchor="middle" fill={LABEL}>{figura.radius}</text>
        </>
      )}
      {figura.height && (
        <text x="35" y="112" fontSize="11" textAnchor="end" dominantBaseline="middle" fill={LABEL}>{figura.height}</text>
      )}
    </Wrapper>
  );
}

function ConeFigure({ figura }: { figura: Extract<GeometryFigureSpec, { type: "cone" }> }) {
  return (
    <Wrapper>
      <line x1="100" y1="30" x2="50" y2="160" stroke={STROKE} strokeWidth="2" />
      <line x1="100" y1="30" x2="150" y2="160" stroke={STROKE} strokeWidth="2" />
      <ellipse cx="100" cy="160" rx="50" ry="18" fill={FILL} stroke={STROKE} strokeWidth="2" />
      <line x1="100" y1="30" x2="100" y2="160" stroke={STROKE} strokeWidth="1" strokeDasharray="3,3" />
      {figura.height && (
        <text x="106" y="100" fontSize="11" fill={LABEL}>{figura.height}</text>
      )}
      {figura.radius && (
        <>
          <line x1="100" y1="160" x2="150" y2="160" stroke={STROKE} strokeWidth="1.5" />
          <text x="125" y="177" fontSize="11" textAnchor="middle" fill={LABEL}>{figura.radius}</text>
        </>
      )}
    </Wrapper>
  );
}

function SphereFigure({ figura }: { figura: Extract<GeometryFigureSpec, { type: "sphere" }> }) {
  return (
    <Wrapper>
      <circle cx="100" cy="100" r="60" fill={FILL} stroke={STROKE} strokeWidth="2" />
      <ellipse cx="100" cy="100" rx="60" ry="20" fill="none" stroke={STROKE} strokeWidth="1" strokeDasharray="3,3" />
      {figura.radius && (
        <>
          <line x1="100" y1="100" x2="160" y2="100" stroke={STROKE} strokeWidth="1.5" />
          <text x="130" y="92" fontSize="11" textAnchor="middle" fill={LABEL}>{figura.radius}</text>
        </>
      )}
    </Wrapper>
  );
}

function CuboidFigure({ figura }: { figura: Extract<GeometryFigureSpec, { type: "cuboid" }> }) {
  // Front üz + 30/-30 offset ilə arxa üz (izometrik illüziya)
  const fbl: [number, number] = [40, 160];
  const fbr: [number, number] = [120, 160];
  const ftr: [number, number] = [120, 80];
  const ftl: [number, number] = [40, 80];
  const bbr: [number, number] = [150, 130];
  const btr: [number, number] = [150, 50];
  const btl: [number, number] = [70, 50];
  const poly = (pts: [number, number][]) => pts.map((p) => p.join(",")).join(" ");
  return (
    <Wrapper>
      <polygon points={poly([ftl, ftr, btr, btl])} fill={FILL} stroke={STROKE} strokeWidth="1.5" />
      <polygon points={poly([ftr, fbr, bbr, btr])} fill={FILL} stroke={STROKE} strokeWidth="1.5" />
      <polygon points={poly([fbl, fbr, ftr, ftl])} fill={FILL} stroke={STROKE} strokeWidth="2" />
      {figura.width && (
        <text x="80" y="176" fontSize="11" textAnchor="middle" fill={LABEL}>{figura.width}</text>
      )}
      {figura.height && (
        <text x="30" y="122" fontSize="11" textAnchor="end" dominantBaseline="middle" fill={LABEL}>{figura.height}</text>
      )}
      {figura.depth && (
        <text x="140" y="98" fontSize="11" textAnchor="start" fill={LABEL}>{figura.depth}</text>
      )}
    </Wrapper>
  );
}

function PyramidFigure({ figura }: { figura: Extract<GeometryFigureSpec, { type: "pyramid" }> }) {
  const apex: [number, number] = [100, 30];
  const base: [number, number][] = [[30, 150], [100, 175], [170, 150], [100, 125]];
  return (
    <Wrapper>
      <polygon points={base.map((p) => p.join(",")).join(" ")} fill={FILL} stroke={STROKE} strokeWidth="1.5" />
      {base.map((p, i) => (
        <line key={i} x1={apex[0]} y1={apex[1]} x2={p[0]} y2={p[1]} stroke={STROKE} strokeWidth="2" />
      ))}
      <line x1={apex[0]} y1={apex[1]} x2="100" y2="150" stroke={STROKE} strokeWidth="1" strokeDasharray="3,3" />
      {figura.height && (
        <text x="106" y="95" fontSize="11" fill={LABEL}>{figura.height}</text>
      )}
      {figura.base && (
        <text x="65" y="168" fontSize="11" textAnchor="middle" fill={LABEL}>{figura.base}</text>
      )}
    </Wrapper>
  );
}

export function GeometryFigure({ figura }: { figura?: GeometryFigureSpec | null }) {
  if (!figura) return null;
  switch (figura.type) {
    case "triangle":
      return <TriangleFigure figura={figura} />;
    case "rectangle":
      return <RectangleFigure figura={figura} />;
    case "trapezoid":
      return <TrapezoidFigure figura={figura} />;
    case "circle":
      return <CircleFigure figura={figura} />;
    case "angle":
      return <AngleFigure figura={figura} />;
    case "cylinder":
      return <CylinderFigure figura={figura} />;
    case "cone":
      return <ConeFigure figura={figura} />;
    case "sphere":
      return <SphereFigure figura={figura} />;
    case "cuboid":
      return <CuboidFigure figura={figura} />;
    case "pyramid":
      return <PyramidFigure figura={figura} />;
    default:
      return null;
  }
}
