import type { Metadata } from "next";
import { Suspense } from "react";
import { NotFound } from "@/components/screens/NotFound";
import { Sky } from "@/components/ui/Sky";
import { requestLang } from "@/lib/request";
import { page } from "@/lib/variants";

// Every 404: unmatched URLs, league paths the proxy refuses, and notFound().
export const metadata: Metadata = { title: "404 · Fantasy Squad Battle" };

async function NotFoundForRequest() {
  return <NotFound lang={await requestLang()} />;
}

export default function NotFoundPage() {
  return (
    <main className={page({ tabs: false })}>
      <Sky height="picker" />
      <Suspense>
        <NotFoundForRequest />
      </Suspense>
    </main>
  );
}
