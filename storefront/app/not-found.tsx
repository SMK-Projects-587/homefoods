import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-24 text-center">
      <p className="label text-chilli">404</p>
      <h1 className="mt-3 font-display text-5xl italic">
        This jar isn&rsquo;t on the shelf.
      </h1>
      <p className="mt-4 text-soft">
        It may have sold out, or the label was written wrong.
      </p>
      <Link
        href="/products"
        className="label mt-8 inline-block bg-chilli px-8 py-4 text-paper transition-colors hover:bg-chilli-deep"
      >
        Back to the pantry
      </Link>
    </div>
  );
}
