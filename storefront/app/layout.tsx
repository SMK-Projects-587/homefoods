import type { Metadata } from "next";
import { Fraunces, Karla, Noto_Serif_Telugu } from "next/font/google";
import "./globals.css";
import { getCategories } from "@/lib/catalog";
import { CartProvider } from "@/lib/cart";
import Header from "@/components/header";
import Footer from "@/components/footer";
import CartSidebar from "@/components/cart-sidebar";

const fraunces = Fraunces({
  subsets: ["latin"],
  style: ["normal", "italic"],
  axes: ["SOFT", "WONK", "opsz"],
  variable: "--font-fraunces",
});

const karla = Karla({
  subsets: ["latin"],
  variable: "--font-karla",
});

// For the Telugu accents (ఇంటి రుచి) — system fallbacks are unreliable.
const notoTelugu = Noto_Serif_Telugu({
  subsets: ["telugu"],
  weight: ["400", "600"],
  variable: "--font-noto-telugu",
});

export const metadata: Metadata = {
  title: {
    default: "HomeFoods — Andhra pickles, podis, snacks & sweets",
    template: "%s — HomeFoods",
  },
  description:
    "Small-batch Andhra pantry staples: avakaya, gongura, karam podi, murukulu and festive sweets, made at home.",
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
      className={`${fraunces.variable} ${karla.variable} ${notoTelugu.variable}`}
    >
      <body className="font-body antialiased">
        <CartProvider>
          <Header categories={categories} />
          <main className="min-h-[70vh]">{children}</main>
          <Footer categories={categories} />
          <CartSidebar />
        </CartProvider>
      </body>
    </html>
  );
}
