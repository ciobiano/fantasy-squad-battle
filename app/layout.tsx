import type { Metadata } from "next";
import { Inter, Instrument_Serif } from "next/font/google";
import { clsx } from "clsx";
import { rootBody, rootHtml } from "@/lib/variants";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "latin-ext"],
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin", "latin-ext"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "Fantasy Squad Battle",
  description: "Weekly roast cards for your fantasy football mini-league.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={clsx(inter.variable, instrumentSerif.variable, rootHtml())}>
      <body className={rootBody()}>{children}</body>
    </html>
  );
}
