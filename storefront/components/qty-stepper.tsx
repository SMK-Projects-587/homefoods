"use client";

export default function QtyStepper({
  qty,
  onChange,
  small,
}: {
  qty: number;
  onChange: (qty: number) => void;
  small?: boolean;
}) {
  const size = small ? "size-[30px]" : "size-9";
  const btn = `grid ${size} cursor-pointer place-items-center rounded-full text-neutral-700 transition-colors hover:bg-accent-100 hover:text-accent-700`;
  return (
    <div className="inline-flex items-center gap-0.5 rounded-full bg-neutral-200 p-0.5">
      <button
        type="button"
        aria-label="Decrease quantity"
        className={btn}
        onClick={() => onChange(qty - 1)}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" className="size-3.5">
          <path d="M5 12h14" />
        </svg>
      </button>
      <span className={`text-center font-bold ${small ? "w-6 text-[13px]" : "w-8 text-sm"}`}>
        {qty}
      </span>
      <button
        type="button"
        aria-label="Increase quantity"
        className={btn}
        onClick={() => onChange(qty + 1)}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" className="size-3.5">
          <path d="M12 5v14M5 12h14" />
        </svg>
      </button>
    </div>
  );
}
