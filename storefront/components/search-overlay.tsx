"use client";

import { useEffect } from "react";
import SearchBar from "./search-bar";
import { useSearch } from "@/lib/search";

export default function SearchOverlay() {
  const { isOpen, close } = useSearch();

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [isOpen, close]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[60] animate-fade"
      role="dialog"
      aria-modal="true"
      aria-label="Search products"
    >
      <div
        className="absolute inset-0 bg-gradient-to-b from-ink/80 via-ink/70 to-accent-900/70 backdrop-blur-sm"
        onClick={close}
        aria-hidden
      />
      <div className="absolute inset-x-0 top-0 flex justify-center px-4 pt-[10vh] sm:pt-[14vh]">
        <div className="w-full max-w-xl animate-rise rounded-[24px] bg-bg p-4 shadow-lg sm:p-6">
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="font-heading text-[20px] sm:text-[22px]">
              Search the kitchen
            </p>
            <button
              type="button"
              onClick={close}
              aria-label="Close search"
              className="grid size-9 shrink-0 cursor-pointer place-items-center rounded-full bg-neutral-200 text-neutral-700 transition-colors hover:bg-accent-100 hover:text-accent-700"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" className="size-4">
                <path d="M6 6l12 12M18 6 6 18" />
              </svg>
            </button>
          </div>
          <SearchBar autoFocus onNavigate={close} />
        </div>
      </div>
    </div>
  );
}
