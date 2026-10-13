import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { clsx } from "clsx";
import { THEME_SCRIPT } from "@/lib/remembered";
import { SITE_URL } from "@/lib/site";
import { rootBody, rootHtml } from "@/lib/variants";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "latin-ext"],
});

export const metadata: Metadata = {
  metadataBase: SITE_URL,
  title: "Fantasy Squad Battle",
  description: "Weekly roast cards for your fantasy football mini-league.",
};

// The browser bar matches the top of the Mist sky.
export const viewport: Viewport = { themeColor: "#143A53" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // data-theme is set before paint by THEME_SCRIPT when someone picked Light or Dark.
    <html lang="en" className={clsx(inter.variable, rootHtml())} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className={rootBody()}>{children}</body>
    </html>
  );
}
