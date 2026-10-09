"use client";

import * as React from "react";

interface CountUpProps {
  value: number;
  duration?: number;
  className?: string;
  suffix?: string;
  prefix?: string;
  /** Vergüllə min/onda ayır (1,234) */
  separator?: boolean;
}

// Ease-out curve: 1 - (1 - t)^3
function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

export function CountUp({
  value,
  duration = 1200,
  className,
  suffix = "",
  prefix = "",
  separator = false,
}: CountUpProps) {
  const [display, setDisplay] = React.useState(0);
  const ref = React.useRef<HTMLSpanElement>(null);
  const startedRef = React.useRef(false);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const startAnimation = () => {
      if (startedRef.current) return;
      startedRef.current = true;
      const start = performance.now();
      const animate = (now: number) => {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        const eased = easeOutCubic(progress);
        setDisplay(Math.round(eased * value));
        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          setDisplay(value);
        }
      };
      requestAnimationFrame(animate);
    };

    // Görünəndə başlat (IntersectionObserver), dəstəklənmirsə dərhal
    if (typeof IntersectionObserver === "undefined") {
      startAnimation();
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            startAnimation();
            observer.disconnect();
          }
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [value, duration]);

  const formatted = separator
    ? display.toLocaleString("tr-TR")
    : String(display);

  return (
    <span ref={ref} className={className}>
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
}
