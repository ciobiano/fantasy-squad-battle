import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { clsx } from "clsx";
import { rootBody, rootHtml } from "@/lib/variants";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "latin-ext"],
});

export const metadata: Metadata = {
  title: "Fantasy Squad Battle",
  description: "Weekly roast cards for your fantasy football mini-league.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={clsx(inter.variable, rootHtml())}>
      <body className={rootBody()}>{children}</body>
    </html>
  );
}
