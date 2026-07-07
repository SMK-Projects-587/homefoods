// The green-dot-in-a-square vegetarian mark every Indian shopper scans for.
export default function VegMark({ className = "" }: { className?: string }) {
  return (
    <span
      aria-label="100% vegetarian"
      title="100% vegetarian"
      className={`inline-grid size-4 shrink-0 place-items-center rounded-[3px] border-[1.5px] border-leaf bg-paper ${className}`}
    >
      <span className="size-1.5 rounded-full bg-leaf" />
    </span>
  );
}
