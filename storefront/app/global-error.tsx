"use client";

import { useEffect } from "react";
import "./globals.css";

// Only fires when the root layout itself throws (e.g. getCategories()
// failing) — everything else is caught by app/error.tsx instead. Next
// requires this file to render its own <html>/<body> since there's no
// layout left above it to provide them.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <div className="mx-auto max-w-[720px] px-4 py-24 text-center">
          <p className="label text-accent-700">Something spilled</p>
          <h1 className="mt-3 font-heading text-[36px]">
            The kitchen&rsquo;s down for a moment.
          </h1>
          <p className="mt-3 text-neutral-600">
            Give it another try in a bit.
          </p>
          <button
            type="button"
            onClick={reset}
            className="mt-8 inline-block cursor-pointer rounded-full bg-accent px-7 py-3.5 text-[15px] font-bold text-bg transition-colors hover:bg-accent-600"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
