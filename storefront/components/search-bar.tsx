"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import CatalogImage from "./catalog-image";
import { searchProducts, type ProductCardData } from "@/lib/catalog";
import { formatINR } from "@/lib/format";

const POPULAR = ["avakaya", "karam podi", "gongura", "murukulu", "kaju katli"];

export default function SearchBar({
  defaultValue = "",
  autoFocus = false,
  onNavigate,
  className = "",
}: {
  defaultValue?: string;
  autoFocus?: boolean;
  onNavigate?: () => void;
  className?: string;
}) {
  const router = useRouter();
  const boxRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const requestRef = useRef(0);

  const [value, setValue] = useState(defaultValue);
  const [open, setOpen] = useState(autoFocus);
  const [active, setActive] = useState(-1);
  const [tick, setTick] = useState(0);
  const [fetched, setFetched] = useState<{
    term: string;
    results: ProductCardData[];
  }>({ term: "", results: [] });

  const term = value.trim();
  const live = term.length >= 2;
  // Stale-while-revalidate: keep showing the previous results while typing.
  const results = live ? fetched.results : [];
  const searching = live && fetched.term !== term;
  const placeholder = `Murukulu, avakaya, ${POPULAR[tick % POPULAR.length]}…`;

  // Rotate the placeholder while the field sits empty.
  useEffect(() => {
    if (value) return;
    const id = setInterval(() => setTick((t) => t + 1), 2600);
    return () => clearInterval(id);
  }, [value]);

  // Debounced live search against the search_products() RPC — same weighted
  // full-text + trigram search the results page uses, so typos still match.
  useEffect(() => {
    if (term.length < 2) return;
    const id = ++requestRef.current;
    const timer = setTimeout(() => {
      searchProducts(term, { limit: 6 })
        .then((found) => {
          if (requestRef.current !== id) return;
          setFetched({ term, results: found });
          setActive(-1);
        })
        .catch(() => {
          // network hiccup — the form still submits to /products?q=
        });
    }, 180);
    return () => clearTimeout(timer);
  }, [term]);

  // Close when tapping anywhere outside.
  useEffect(() => {
    const onPointerDown = (e: PointerEvent) => {
      if (!boxRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  const goTo = (href: string) => {
    setOpen(false);
    inputRef.current?.blur();
    onNavigate?.();
    router.push(href);
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (active >= 0 && results[active]) {
      goTo(`/products/${results[active].slug}`);
    } else if (term) {
      goTo(`/products?q=${encodeURIComponent(term)}`);
    }
  };

  return (
    <div ref={boxRef} className={`relative ${className}`}>
      <form action="/products" role="search" onSubmit={onSubmit} className="relative">
        <svg
          aria-hidden
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          className="pointer-events-none absolute left-4 top-1/2 size-4.5 -translate-y-1/2 text-neutral-500"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
        <input
          ref={inputRef}
          type="search"
          name="q"
          autoComplete="off"
          enterKeyHint="search"
          autoFocus={autoFocus}
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setActive((a) => Math.min(a + 1, results.length - 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setActive((a) => Math.max(a - 1, -1));
            } else if (e.key === "Escape") {
              setOpen(false);
            }
          }}
          placeholder={placeholder}
          aria-label="Search products"
          className="w-full rounded-full border border-neutral-300 bg-neutral-100 py-3.5 pl-11.5 pr-5 text-[15px] font-medium text-ink outline-none transition-colors placeholder:text-neutral-500 focus:border-accent"
        />
      </form>

      {open && (
        <div className="absolute inset-x-0 top-full z-50 mt-2 overflow-hidden rounded-lg border border-neutral-200 bg-neutral-100 shadow-lg">
          {!live ? (
            <div className="p-4">
              <p className="label text-neutral-500">Everyone&rsquo;s searching</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {POPULAR.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => goTo(`/products?q=${encodeURIComponent(p)}`)}
                    className="cursor-pointer rounded-full border border-neutral-300 px-3 py-1.5 text-xs font-bold capitalize transition-colors hover:border-accent hover:text-accent-700"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          ) : searching && results.length === 0 ? (
            <p className="p-4 text-sm text-neutral-600">Searching the shelves…</p>
          ) : results.length === 0 ? (
            <p className="p-4 text-sm text-neutral-600">
              Nothing for &ldquo;{term}&rdquo; yet — try &ldquo;podi&rdquo;,
              &ldquo;pickle&rdquo; or &ldquo;laddu&rdquo;.
            </p>
          ) : (
            <>
              <ul className="p-1.5">
                {results.map((p, i) => (
                  <li key={p.id}>
                    <Link
                      href={`/products/${p.slug}`}
                      onClick={() => {
                        setOpen(false);
                        onNavigate?.();
                      }}
                      onMouseEnter={() => setActive(i)}
                      className={`flex items-center gap-3 rounded-md px-2.5 py-2 transition-colors ${
                        i === active ? "bg-accent-100" : ""
                      }`}
                    >
                      <span className="block size-11 shrink-0 overflow-hidden rounded-[10px]">
                        <CatalogImage
                          path={p.imagePath}
                          alt=""
                          name={p.name}
                          className="washed size-full object-cover"
                        />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-bold">
                          {p.name}
                        </span>
                        {p.categorySlug && (
                          <span className="block text-xs capitalize text-neutral-600">
                            {p.categorySlug.replace(/-/g, " ")}
                          </span>
                        )}
                      </span>
                      {!p.inStock ? (
                        <span className="label text-accent-700">Sold out</span>
                      ) : (
                        p.price != null && (
                          <span className="text-sm font-bold">
                            {formatINR(p.price)}
                          </span>
                        )
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
              <Link
                href={`/products?q=${encodeURIComponent(term)}`}
                onClick={() => {
                  setOpen(false);
                  onNavigate?.();
                }}
                className="label block border-t border-neutral-200 bg-accent-100 px-4 py-3 text-accent-700 transition-colors hover:bg-accent-200"
              >
                See all results for &ldquo;{term}&rdquo; →
              </Link>
            </>
          )}
        </div>
      )}
    </div>
  );
}
