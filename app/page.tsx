import { heading, placeholderMain } from "@/lib/variants";

export default function Home() {
  return (
    <main className={placeholderMain()}>
      <h1 className={heading({ level: "display" })}>Fantasy Squad Battle</h1>
      <p className={heading()}>Roast cards for your mini-league. Coming soon.</p>
    </main>
  );
}
