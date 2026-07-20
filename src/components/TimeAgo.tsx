"use client";

import { useEffect, useState } from "react";
import { formatTimestamp } from "@/lib/format";

const UNITS: { ms: number; label: string }[] = [
  { ms: 86_400_000, label: "d" },
  { ms: 3_600_000, label: "h" },
  { ms: 60_000, label: "m" },
  { ms: 1_000, label: "s" },
];

function formatRelative(deltaMs: number): string {
  if (deltaMs < 0) return "just now";
  for (const unit of UNITS) {
    if (deltaMs >= unit.ms) return `${Math.floor(deltaMs / unit.ms)}${unit.label} ago`;
  }
  return "just now";
}

export function TimeAgo({ ts }: { ts: number }) {
  const [showAbsolute, setShowAbsolute] = useState(false);
  const [, force] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => force((value) => value + 1), 30_000);
    return () => clearInterval(timer);
  }, []);

  const iso = new Date(ts).toISOString();
  const absolute = formatTimestamp(ts);
  const relative = formatRelative(Date.now() - ts);

  return (
    <time
      dateTime={iso}
      title={showAbsolute ? relative : absolute}
      onClick={() => setShowAbsolute((current) => !current)}
      className="cursor-pointer underline decoration-dotted underline-offset-2"
    >
      {showAbsolute ? absolute : relative}
    </time>
  );
}
