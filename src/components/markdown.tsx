"use client";

import * as React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import { cn } from "@/lib/utils";

// Azərbaycan məktəb notasiyası (tg, ctg, arctg, arcctg) KaTeX-də standart əmr deyil — AI bəzən
// "\tg x" yazır və bu qırmızı xəta kimi görünür. Makro ilə düzgün funksiya adı kimi göstəririk.
// strict: "ignore" — düstur içindəki Azərbaycan hərfləri (məs. \text{sürət}) üçün xəbərdarlıqları susdurur.
const KATEX_OPTIONS = {
  throwOnError: false,
  strict: "ignore" as const,
  macros: {
    "\\tg": "\\operatorname{tg}",
    "\\ctg": "\\operatorname{ctg}",
    "\\arctg": "\\operatorname{arctg}",
    "\\arcctg": "\\operatorname{arcctg}",
  },
};

// Markdown renderer with LaTeX (KaTeX) + typography polish + color-coded steps.
// Bütün AI məzmunu (söhbət, mini-dərslər, sual generatoru, imtahanlar, valideyn raportu,
// bal analizi) bunu istifadə edir. Ümumi stil `src/app/globals.css`-də (.prose-tqdk) təyin olunub
// ki, bir səhifədə çoxlu Markdown instansı olanda <style> təkrarlanmasın.
// Mətni mövcud düsturlara ($$...$$, $...$) və koda (```...```, `...`) TOXUNMADAN yalnız aradakı adi
// mətn hissələrində dəyişir.
function outsideMath(text: string, fn: (s: string) => string): string {
  const re = /```[\s\S]*?```|`[^`\n]*`|\$\$[\s\S]+?\$\$|\$[^$\n]+?\$/g;
  let out = "";
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    out += fn(text.slice(last, m.index)) + m[0];
    last = m.index + m[0].length;
  }
  return out + fn(text.slice(last));
}

export function Markdown({
  content,
  className,
  inline = false,
}: {
  content: string;
  className?: string;
  inline?: boolean;
}) {
  let safe = content;
  // Əvvəllər yadda saxlanmış məzmunda AI-nin tək backslash-lı LaTeX-i JSON parse zamanı pozulub:
  // "\frac" → form-feed + "rac", "\beta" → backspace + "eta". Bu idarəetmə simvolları təbii mətndə
  // olmur — geri backslash-a çeviririk (yeni məzmunda backend bunu artıq parse-dan əvvəl düzəldir).
  safe = safe.replace(/\x0C/g, "\\f").replace(/\x08/g, "\\b");
  // AI-ya "$...$/$$...$$ YALNIZ" tapşırığı verilsə də (bax AiService.java), bəzən LaTeX-in
  // alternativ "\(...\)"/"\[...\]" sintaksisini işlədir — bunlar remark-math-a tanış deyil,
  // ona görə əvvəlcə bunları standart dollar delimiter-lərinə çeviririk (birmənalı, riskli deyil).
  safe = safe.replace(/\\\(([\s\S]+?)\\\)/g, (_, inner) => `$${inner.trim()}$`);
  safe = safe.replace(/\\\[([\s\S]+?)\\\]/g, (_, inner) => `$$${inner.trim()}$$`);
  // AI bəzən blok düsturu $$...$$ əvəzinə tək kvadrat mötərizə ilə ("[ ax^2+bx+c=0 ]", öz
  // sətrində tək başına) yazır — bunu $$...$$-ə çeviririk. `[mətn](url)` linkləri ilə qarışmasın
  // deyə YALNIZ bütün sətri tutan (əvvəlində/sonunda başqa mətn olmayan) mötərizələr uyğunlaşdırılır.
  // DİQQƏT: aşağıdakı mötərizə çevirmələri YALNIZ mövcud düsturlardan və koddan KƏNARDA işləyir —
  // əks halda "$$(2\vec{a} + \vec{b}) \cdot (\vec{a} - \vec{b})$$" kimi düsturun içindəki adi
  // mötərizələri də "$...$"-a salıb düsturu parçalayırdı (xam "\vec{a}" görünürdü).
  safe = outsideMath(safe, (s) => s.replace(/^[ \t]*\[\s*([^[\]\n]+?)\s*\][ \t]*$/gm, (_, inner) =>
    /\\[a-zA-Z]+|[\^_]/.test(inner) ? `$$${inner}$$` : _
  ));
  // Yuxarıdakı yalnız-tam-sətir qaydası cədvəl xanası kimi sətir-DAXİLİ yerləri tutmur — AI orada
  // da tez-tez düz mötərizə/kvadrat mötərizə ilə LaTeX yazır (məs. "(0^\circ)", "(\frac12)" cədvəl
  // xanalarında). Bunları da tutmaq üçün əlavə keçid: "[...]" (link "[mətn](url)" ilə qarışmasın
  // deyə ardınca "(" gəlməyəni) və "(...)" YALNIZ LaTeX-ə bənzəyəndə (backslash əmri var VƏ tərkib
  // sırf latın/riyazi simvollardan ibarətdir — Azərbaycan hərfi olan adi mötərizəli izahla
  // qarışmasın deyə) $...$-ə çevrilir.
  safe = outsideMath(safe, (s) => s.replace(/\[([^[\]\n]+)\](?!\()/g, (_, inner) =>
    /\\[a-zA-Z]+/.test(inner) ? `$${inner.trim()}$` : _
  ));
  // Mötərizə birbaşa "\left("/"\sin(" kimi LaTeX əmrindən sonra gələndə strukturun bir
  // hissəsidir (funksiya çağırışı/ölçülü delimiter) — belələrini toxunmadan saxlayırıq, əks
  // halda "\left(...\right)" kimi cütləri qırardıq.
  safe = outsideMath(safe, (s) => s.replace(/(?<!\\[a-zA-Z]{1,12})\(([^()\n]+)\)/g, (_, inner) =>
    /\\[a-zA-Z]+/.test(inner) && /^[\dA-Za-z\\^_{}/*+\-=.,\s]+$/.test(inner) ? `$${inner.trim()}$` : _
  ));
  // AI bəzən LaTeX-i heç bir $ delimiter olmadan yazır (məs. cavab variantlarında) — bu halda
  // remark-math onu riyaziyyat kimi tanımır və "\frac{6\sqrt{7}}{7}" xam mətn kimi görünür.
  // Bunu YALNIZ qısa, TƏK-sətirlik, markdown strukturu (başlıq/cədvəl/paraqraf) olmayan mətndə
  // tam əhatə edirik — uzun, çoxbölmülü cavabı tam $...$-ə salmaq onu (başlıqlar, cədvəllər daxil)
  // BÜTÖVLÜKDƏ "bir düstur" kimi qırır (KaTeX markdown-u parse edə bilmir, xam mətn görünür).
  const looksLikeWholeDocument =
    /\n\s*#{1,6}\s/.test(safe) || /\|.*\|/.test(safe) || /\n\s*\n/.test(safe) || safe.length > 200;
  if (!safe.includes("$") && /\\[a-zA-Z]+/.test(safe) && !looksLikeWholeDocument) {
    safe = `$${safe.trim()}$`;
  }
  // Cavab variantları kimi qısa "inline" məzmunda AI bəzən $$...$$ (block/display)
  // formatından istifadə edir — bu, KaTeX-i "böyük" düstur kimi render edir və eyni
  // siyahıdakı digər $...$ (inline) variantlarla qeyri-bərabər görünür. Normallaşdırırıq:
  // $$...$$ -> $...$, ki hamısı eyni kompakt tərzdə göstərilsin.
  // KaTeX-də düstur içindəki tək "%" şərh başlanğıcıdır və düsturun QALANINI silir ("$25%$" → boş) —
  // escape olunmamış "%"-i "\%" edirik.
  const escapePercent = (s: string) => s.replace(/(^|[^\\])%/g, "$1\\%");
  safe = safe.replace(/\$\$([\s\S]+?)\$\$|\$([^$\n]+?)\$/g, (_, block, inl) =>
    block !== undefined ? `$$${escapePercent(block)}$$` : `$${escapePercent(inl)}$`
  );
  const normalized = inline ? safe.replace(/\$\$([\s\S]+?)\$\$/g, (_, inner) => `$${inner.trim()}$`) : safe;

  return (
    <div
      className={cn(
        "prose-tqdk max-w-none text-sm leading-relaxed",
        inline && "prose-tqdk-inline",
        className
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[[rehypeKatex, KATEX_OPTIONS]]}
        components={{
          h1: ({ children }) => (
            <h1 className="font-heading text-xl font-bold first:mt-0">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="font-heading text-lg font-bold first:mt-0">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="font-heading text-base font-semibold first:mt-0">{children}</h3>
          ),
          p: ({ children }) => <p>{children}</p>,
          ul: ({ children }) => <ul>{children}</ul>,
          ol: ({ children }) => <ol>{children}</ol>,
          li: ({ children }) => <li>{children}</li>,
          strong: ({ children }) => <strong>{children}</strong>,
          em: ({ children }) => <em>{children}</em>,
          code: ({ children }) => <code>{children}</code>,
          pre: ({ children }) => <pre>{children}</pre>,
          blockquote: ({ children }) => <blockquote>{children}</blockquote>,
          a: ({ children, href }) => (
            <a href={href} target="_blank" rel="noreferrer">
              {children}
            </a>
          ),
          hr: () => <hr />,
          table: ({ children }) => (
            <div className="overflow-x-auto">
              <table>{children}</table>
            </div>
          ),
          th: ({ children }) => <th>{children}</th>,
          td: ({ children }) => <td>{children}</td>,
        }}
      >
        {normalized}
      </ReactMarkdown>
    </div>
  );
}
