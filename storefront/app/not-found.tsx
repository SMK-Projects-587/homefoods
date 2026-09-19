import Link from "next/link";
import type { Metadata } from "next";

// Without this, a 404 inherits whatever metadata belongs to the route that
// failed to resolve — meaning Google could index a not-found page under the
// generic site title. Give it its own title and keep it out of the index.
export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <div className="mx-auto max-w-[720px] px-4 py-24 text-center">
      <p className="label text-accent-700">404</p>
      <h1 className="mt-3 font-heading text-[36px]">
        This jar isn&rsquo;t on the shelf.
      </h1>
      <p className="mt-3 text-neutral-600">
        It may have sold out, or the label was written wrong.
      </p>
      <Link
        href="/products"
        className="mt-8 inline-block rounded-full bg-accent px-7 py-3.5 text-[15px] font-bold text-bg transition-colors hover:bg-accent-600"
      >
        Back to the kitchen
      </Link>
    </div>
  );
}
