// The rank row while a league's squads are rated (1–3 s the first time): a dot
// and a line where the rank will be, read out as what's happening.
import { rankSkeleton, visuallyHidden } from "@/lib/variants";

export function RankPlaceholder({ label }: { label: string }) {
  return (
    <>
      <span className={visuallyHidden()}>{label}</span>
      <span aria-hidden="true" className={rankSkeleton({ shape: "dot" })} />
      <span aria-hidden="true" className={rankSkeleton({ shape: "line" })} />
    </>
  );
}
