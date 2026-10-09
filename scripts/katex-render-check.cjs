// AI-nin yazdığı bütün düsturları saytın istifadə etdiyi EYNİ KaTeX və EYNİ parametrlərlə
// (src/components/markdown.tsx) render edir və xəta verənləri sayır.
//
// İstifadə (repo kökündən, canlı AI testindən sonra):
//   node scripts/katex-render-check.cjs backend/build/reports/latex-snippets.json
const fs = require("fs");
const path = require("path");
const katex = require("katex");

const input = process.argv[2] || "backend/build/reports/latex-snippets.json";
const snippets = JSON.parse(fs.readFileSync(input, "utf8"));

// markdown.tsx-dəki KATEX_OPTIONS ilə eyni.
const options = {
  throwOnError: false,
  strict: "ignore",
  macros: {
    "\\tg": "\\operatorname{tg}",
    "\\ctg": "\\operatorname{ctg}",
    "\\arctg": "\\operatorname{arctg}",
    "\\arcctg": "\\operatorname{arcctg}",
  },
};
// markdown.tsx düstur içindəki escape olunmamış "%"-i "\%" edir.
const escapePercent = (s) => s.replace(/(^|[^\\])%/g, "$1\\%");

const errors = [];
const commands = {};
for (const s of snippets) {
  const html = katex.renderToString(escapePercent(s), options);
  if (html.includes("katex-error")) {
    const msg = /title="([^"]*)"/.exec(html);
    errors.push({ formula: s, error: msg ? msg[1] : "naməlum xəta" });
  }
  for (const m of s.matchAll(/\\([a-zA-Z]+)/g)) commands[m[1]] = (commands[m[1]] || 0) + 1;
}

const top = Object.entries(commands).sort((a, b) => b[1] - a[1]).slice(0, 25);
const lines = [
  "# KaTeX render yoxlaması",
  "",
  `Düstur sayı: **${snippets.length}**, xəta verən: **${errors.length}**, uğurlu: **${(
    (100 * (snippets.length - errors.length)) / Math.max(1, snippets.length)
  ).toFixed(1)}%**`,
  "",
  "## Ən çox işlənən LaTeX əmrləri",
  "",
  top.map(([c, n]) => `\`\\${c}\` — ${n}`).join(", "),
  "",
  "## Xəta verən düsturlar",
  "",
  errors.length ? errors.map((e) => `- \`${e.formula}\` — ${e.error}`).join("\n") : "Yoxdur ✅",
  "",
];
const out = path.join(path.dirname(input), "katex-check.md");
fs.writeFileSync(out, lines.join("\n"));
console.log(lines.slice(0, 3).join("\n"));
if (errors.length) {
  console.log(errors.slice(0, 10));
  process.exitCode = 1;
}
console.log("Hesabat: " + out);
