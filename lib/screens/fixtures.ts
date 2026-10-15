// The Fixtures tab (/fixtures): every team's difficulty over the next gameweeks.
import { guard, ready, type Screen } from "./screen";
import type { Query } from "./start";
import { liveTools, type TickerRow, type ToolsSource } from "./tools";

export type TickerSort = "easy" | "az";

export interface FixturesView {
  readonly sort: TickerSort;
  /** The gameweeks shown as columns. */
  readonly gameweeks: readonly number[];
  readonly rows: readonly TickerRow[];
}

const byName = (a: TickerRow, b: TickerRow) => a.team.short.localeCompare(b.team.short);

/** ?sort=az sorts by name; anything else puts the easiest run first, ties by name. */
export async function loadFixtures(query: Query, source: ToolsSource = liveTools): Promise<Screen<FixturesView>> {
  const sort: TickerSort = query.sort === "az" ? "az" : "easy";
  return guard("fixtures", "/fixtures", async () => {
    const rows = [...(await source.ticker())].sort(sort === "az" ? byName : (a, b) => a.runScore - b.runScore || byName(a, b));
    return ready({ sort, gameweeks: rows[0]?.weeks.map((w) => w.gw) ?? [], rows });
  });
}
