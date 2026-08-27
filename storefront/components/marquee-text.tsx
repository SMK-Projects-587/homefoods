"use client";

import { useEffect, useRef, useState } from "react";

// Product names that don't fit their card used to wrap onto a second line,
// pushing the price row down and making cards in the same row uneven
// heights. This keeps names to one line and, only when the text actually
// overflows, scrolls it so the full name is still readable.
export default function MarqueeText({
  text,
  className = "",
}: {
  text: string;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const [overflow, setOverflow] = useState(false);

  useEffect(() => {
    const measure = () => {
      const container = containerRef.current;
      const span = textRef.current;
      if (!container || !span) return;
      setOverflow(span.scrollWidth - container.clientWidth > 2);
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [text]);

  return (
    <div ref={containerRef} className={`overflow-hidden ${className}`}>
      <div
        className={`flex w-max ${overflow ? "animate-marquee" : ""}`}
        style={overflow ? { animationDuration: `${Math.max(4, text.length * 0.22)}s` } : undefined}
      >
        <span ref={textRef} className={`whitespace-nowrap ${overflow ? "pr-10" : ""}`}>
          {text}
        </span>
        {overflow && (
          <span aria-hidden className="whitespace-nowrap pr-10">
            {text}
          </span>
        )}
      </div>
    </div>
  );
}
