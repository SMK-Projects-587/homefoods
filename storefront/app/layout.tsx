import type { Metadata } from "next";
import { Caprasimo, Figtree, Noto_Sans_Telugu } from "next/font/google";
import "./globals.css";
import { getCategories } from "@/lib/catalog";
import { CartProvider } from "@/lib/cart";
import { SearchProvider } from "@/lib/search";
import Header from "@/components/header";
import Footer from "@/components/footer";
import BottomNav from "@/components/bottom-nav";
import CartSidebar from "@/components/cart-sidebar";
import SearchOverlay from "@/components/search-overlay";
import JsonLd from "@/components/json-ld";
import { SITE_URL, SITE_NAME, SITE_TAGLINE, SITE_DESCRIPTION, absoluteUrl } from "@/lib/site";

// Display face — the design system's headings are all Caprasimo 400.
const caprasimo = Caprasimo({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-caprasimo",
});

const figtree = Figtree({
  subsets: ["latin"],
  variable: "--font-figtree",
});

// For the Telugu names (అమ్మ చేతి రుచి) — system fallbacks are unreliable.
const notoTelugu = Noto_Sans_Telugu({
  subsets: ["telugu"],
  weight: ["400", "600", "700"],
  variable: "--font-noto-telugu",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — ${SITE_TAGLINE}`,
    template: `%s — ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: [
    "Andhra pickles",
    "avakaya",
    "gongura",
    "karam podi",
    "kandi podi",
    "murukulu",
    "Andhra sweets",
    "podi",
    "Vizianagaram",
    "homemade Andhra food",
    "pindi vantalu",
  ],
  authors: [{ name: SITE_NAME }],
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: `${SITE_NAME} — ${SITE_TAGLINE}`,
    description: SITE_DESCRIPTION,
    locale: "en_IN",
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — ${SITE_TAGLINE}`,
    description: SITE_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
};

// Site-wide structured data: who we are, and how search engines can wire up a
// sitelinks search box straight into our product search.
const orgJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: SITE_NAME,
  url: SITE_URL,
  logo: absoluteUrl("/opengraph-image"),
  description: SITE_DESCRIPTION,
  foundingDate: "1992",
  address: {
    "@type": "PostalAddress",
    addressLocality: "Vizianagaram",
    addressRegion: "Andhra Pradesh",
    addressCountry: "IN",
  },
  areaServed: "IN",
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: SITE_NAME,
  url: SITE_URL,
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: `${SITE_URL}/products?q={search_term_string}`,
    },
    "query-input": "required name=search_term_string",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const categories = await getCategories();
  return (
    <html
      lang="en"
      className={`${caprasimo.variable} ${figtree.variable} ${notoTelugu.variable}`}
    >
      <body className="font-body antialiased">
        <JsonLd data={orgJsonLd} />
        <JsonLd data={websiteJsonLd} />
        <CartProvider>
          <SearchProvider>
            <Header />
            {/* pb clears the fixed mobile tab bar (hidden ≥ lg) */}
            <main className="min-h-[70vh] pb-24 lg:pb-0">{children}</main>
            <Footer categories={categories} />
            <BottomNav />
            <CartSidebar />
            <SearchOverlay />
          </SearchProvider>
        </CartProvider>
      </body>
    </html>
  );
}
