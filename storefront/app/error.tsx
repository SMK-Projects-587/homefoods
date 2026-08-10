"use client";

import { useEffect } from "react";

export default function Error({
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
    <div className="mx-auto max-w-[720px] px-4 py-24 text-center">
      <p className="label text-accent-700">Something spilled</p>
      <h1 className="mt-3 font-heading text-[36px]">
        The kitchen hit a snag.
      </h1>
      <p className="mt-3 text-neutral-600">
        Give it another try — if it keeps happening, the page isn&rsquo;t
        going anywhere.
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-8 inline-block cursor-pointer rounded-full bg-accent px-7 py-3.5 text-[15px] font-bold text-bg transition-colors hover:bg-accent-600"
      >
        Try again
      </button>
    </div>
  );
}
