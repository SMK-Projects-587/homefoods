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
  const btn = `grid cursor-pointer place-items-center border border-ink/30 transition-colors hover:bg-ink hover:text-paper ${
    small ? "size-7 text-sm" : "size-10"
  }`;
  return (
    <div className="inline-flex items-center gap-2">
      <button
        type="button"
        aria-label="Decrease quantity"
        className={btn}
        onClick={() => onChange(qty - 1)}
      >
        −
      </button>
      <span className={`text-center font-bold ${small ? "w-6 text-sm" : "w-8"}`}>
        {qty}
      </span>
      <button
        type="button"
        aria-label="Increase quantity"
        className={btn}
        onClick={() => onChange(qty + 1)}
      >
        +
      </button>
    </div>
  );
}
