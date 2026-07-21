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
        className="absolute inset-0 bg-neutral-900/45"
        onClick={close}
        aria-hidden
      />
      <div className="absolute inset-x-0 top-0 px-4 pt-[14vh]">
        <div className="mx-auto w-full max-w-xl">
          <div className="mb-3 flex items-center justify-between">
            <p className="label text-neutral-100">Search the kitchen</p>
            <button
              type="button"
              onClick={close}
              className="label cursor-pointer rounded-full bg-neutral-100/90 px-3 py-1.5 text-ink transition-colors hover:bg-neutral-100"
            >
              Esc
            </button>
          </div>
          <SearchBar autoFocus onNavigate={close} />
        </div>
      </div>
    </div>
  );
}
