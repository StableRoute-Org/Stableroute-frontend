"use client";

import { useEffect, useState } from "react";

const UNITS: { ms: number; label: string }[] = [
  { ms: 86_400_000, label: "d" },
  { ms: 3_600_000, label: "h" },
  { ms: 60_000, label: "m" },
  { ms: 1_000, label: "s" },
];

function format(deltaMs: number): string {
  if (deltaMs < 0) return "just now";
  for (const u of UNITS) {
    if (deltaMs >= u.ms) return `${Math.floor(deltaMs / u.ms)}${u.label} ago`;
  }
  return "just now";
}

export function TimeAgo({ ts }: { ts: number }) {
  const [, force] = useState(0);
  useEffect(() => {
    const t = setInterval(() => force((n) => n + 1), 30_000);
    return () => clearInterval(t);
  }, []);
  const iso = new Date(ts).toISOString();
  return (
    <time dateTime={iso} title={iso}>
      {format(Date.now() - ts)}
    </time>
  );
}
