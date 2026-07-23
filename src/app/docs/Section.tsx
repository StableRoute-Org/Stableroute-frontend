"use client";

import React from "react";

// Context to track the current heading level
export const LevelContext = React.createContext<number>(2);

interface DocsSectionProps {
  heading: React.ReactNode;
  children: React.ReactNode;
}

export function DocsSection({ heading, children }: DocsSectionProps) {
  const level = React.useContext(LevelContext);
  const HeadingTag = `h${Math.min(level, 6)}` as keyof JSX.IntrinsicElements;

  return (
    <section>
      <HeadingTag className="font-mono text-sm font-medium">{heading}</HeadingTag>
      <div className="mt-1 text-sm text-neutral-700 dark:text-neutral-300">
        <LevelContext.Provider value={level + 1}>
          {children}
        </LevelContext.Provider>
      </div>
    </section>
  );
}
