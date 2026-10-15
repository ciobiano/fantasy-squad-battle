// What the Fixtures and Players tabs read: the data session's lib/tools, live
// from FPL's bootstrap and fixtures (cached, shared by every visitor), or fakes
// in tests. The shapes are theirs (lib/tools/types.ts).
import { getInjuryReport } from "@/lib/tools/injuries";
import { getTicker } from "@/lib/tools/ticker";
import type { InjuryReport, TickerRow } from "@/lib/tools/types";

export type { InjuryReport, InjuryRow, InjuryStatus, TickerRow } from "@/lib/tools/types";

/** Where the tools' data comes from: live FPL, or a fake in tests. Throws on an outage. */
export interface ToolsSource {
  readonly ticker: () => Promise<readonly TickerRow[]>;
  readonly injuries: () => Promise<InjuryReport>;
}

export const liveTools: ToolsSource = {
  ticker: () => getTicker(),
  injuries: () => getInjuryReport(Date.now()),
};
