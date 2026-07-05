export default function SearchBox({
  defaultValue,
  className,
}: {
  defaultValue?: string;
  className?: string;
}) {
  return (
    <form action="/products" className={className}>
      <input
        type="search"
        name="q"
        defaultValue={defaultValue}
        placeholder="Search avakaya, podi…"
        className="w-full rounded-full border border-ink/30 bg-paper px-4 py-2 text-sm outline-none transition-colors placeholder:text-soft/70 focus:border-chilli"
      />
    </form>
  );
}
