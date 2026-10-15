// Loading skeletons (not spinners) shown while a screen's data streams in.
import { column, skeleton } from "@/lib/variants";

export function LeagueFallback() {
  return (
    <div aria-busy="true" className={column({ gap: "md" })}>
      <div className={skeleton({ shape: "row" })} />
      <div className={skeleton({ shape: "row" })} />
      <div className={skeleton({ shape: "block" })} />
    </div>
  );
}

export function ListFallback() {
  return (
    <div aria-busy="true" className={column({ gap: "sm" })}>
      <div className={skeleton({ shape: "row" })} />
      <div className={skeleton({ shape: "block" })} />
      <div className={skeleton({ shape: "block" })} />
    </div>
  );
}

export function PickerFallback() {
  return (
    <div aria-busy="true" className={column({ gap: "md" })}>
      <div className={skeleton({ shape: "row" })} />
      <div className={skeleton({ shape: "block" })} />
      <div className={skeleton({ shape: "row" })} />
    </div>
  );
}

export function StartFallback() {
  return (
    <div aria-busy="true" className={column({ gap: "md" })}>
      <div className={skeleton({ shape: "block" })} />
      <div className={skeleton({ shape: "row" })} />
    </div>
  );
}
