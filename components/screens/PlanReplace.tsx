// Pick a replacement: every player in the outgoing player's position, ranked by
// what he adds to the team over the rest of the window (lib/planner/engine
// replacementsFor).
import { useMemo } from "react";
import { replacementsFor } from "@/lib/planner/engine";
import { sellPrice } from "@/lib/screens/plan-board";
import { money, signedDecimal } from "@/lib/ui/format";
import type { BoardModel } from "./PlanBoard";
import { PlayerPicker } from "./PlayerPicker";

export function PlanReplace({ model, out, onBack, onPick }: { model: BoardModel; out: number; onBack: () => void; onPick: (id: number) => void }) {
  const { copy: c, lang, week, ctx, data, players } = model;
  const outgoing = players.get(out)!;
  const rows = useMemo(
    () => replacementsFor({ squad: week.squad, bank: week.bank }, out, ctx, week.gw).map((r) => ({ id: r.id, value: r.gain, price: r.price, blocked: r.blocked })),
    [week, out, ctx],
  );
  const budget = week.bank + sellPrice(week, out, ctx);
  return (
    <PlayerPicker
      model={model}
      gw={week.gw}
      position={outgoing.position}
      title={c.replaceTitle(outgoing.name)}
      sub={c.replaceSub(c.positions[outgoing.position], money(budget, lang))}
      back={c.title}
      rows={rows}
      value={{
        sort: c.sorts.gain,
        column: c.columnGain(c.window(week.gw, data.gws[data.gws.length - 1])),
        show: (gain) => signedDecimal(gain, lang),
        tone: (gain) => (gain > 0 ? "up" : "quiet"),
      }}
      onBack={onBack}
      onPick={onPick}
    />
  );
}
