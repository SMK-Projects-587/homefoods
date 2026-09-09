import Link from "next/link";
import type { Metadata } from "next";
import { cdnImageUrl } from "@/lib/supabase";

export const metadata: Metadata = {
  title: "Our story",
  description:
    "Thirty years of Brahmin home-style Andhra cooking from Vizianagaram — same recipes, same hands, since 1992.",
  alternates: { canonical: "/about" },
  openGraph: {
    title: "Our story — Andhra HomeFoods",
    description:
      "Thirty years of Brahmin home-style Andhra cooking from Vizianagaram — same recipes, same hands, since 1992.",
    url: "/about",
  },
};

function Stat({
  bg,
  num,
  label,
}: {
  bg: string;
  num: string;
  label: string;
}) {
  return (
    <div className={`rounded-lg p-[18px] ${bg}`}>
      <p className="font-heading text-[30px] leading-none">{num}</p>
      <p className="mt-2 text-[12.5px] font-bold">{label}</p>
    </div>
  );
}

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-[720px] px-4 py-8 sm:px-[22px] sm:py-10">
      <p className="label text-accent-700">Our story</p>
      <h1 className="mt-2 font-heading font-bold text-[34px] leading-tight">
        Thirty years of filling tummies with happiness.
      </h1>
      <p className="telugu mt-2 text-[15px] text-accent-700">
        మూడు దశాబ్దాల అమ్మ చేతి రుచి
      </p>

      <div
        className="mt-6 overflow-hidden rounded-lg bg-accent-100"
        style={{ aspectRatio: "2 / 1" }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={cdnImageUrl("about-us.webp", { width: 1200 })}
          alt="The Andhra HomeFoods kitchen, where every batch is still made by hand"
          loading="lazy"
          className="washed size-full object-cover"
        />
      </div>

      <div className="mt-6 space-y-4 text-[15px] text-neutral-700">
        <p>
          It started in <strong className="text-ink">1992</strong>, in a small
          kitchen in Vizianagaram, with a mortar, a few jars, and recipes passed
          down through generations of a Brahmin household.
        </p>
        <p>
          Thirty years on, nothing about how we cook has changed. Everything is
          still <strong className="text-ink">made by hand in small batches</strong>{" "}
          — the same pindi vantalu, podis and pickles, stone-ground and
          sun-cured the way amma always did. Always{" "}
          <strong className="text-ink">100% pure veg</strong>, always{" "}
          <strong className="text-ink">no preservatives</strong>.
        </p>
        <p>
          What has changed is how far it travels. What once fed a neighbourhood
          now <strong className="text-ink">ships all over India</strong> — packed
          fresh the day you order.
        </p>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-3">
        <Stat bg="bg-accent-100 text-accent-800" num="30+" label="years of taste" />
        <Stat bg="bg-sage-100 text-sage-800" num="100%" label="pure veg" />
        <Stat bg="bg-sage-100 text-sage-800" num="0" label="preservatives" />
        <Stat bg="bg-accent-100 text-accent-800" num="All India" label="delivery" />
      </div>

      <div className="mt-8 rounded-lg bg-neutral-100 p-6">
        <h2 className="font-heading text-[22px]">Come say hello</h2>
        <p className="mt-2 text-[14.5px] text-neutral-700">
          Vizianagaram, Andhra Pradesh. Orders and questions are welcome on
          WhatsApp — that&rsquo;s where we confirm delivery and payment for every
          order.
        </p>
        <Link
          href="/products"
          className="mt-4 inline-block rounded-full bg-accent px-6 py-3 text-[14px] font-bold text-bg transition-colors hover:bg-accent-600"
        >
          Shop the kitchen
        </Link>
      </div>
    </div>
  );
}
