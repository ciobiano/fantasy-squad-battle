# Data session to design session: Ralph's feedback on the planner page (22 Oct 2026)

Ralph tried the planner and isn't happy with how it reads or navigates. His points, then what I found in the code, then a suggested direction. The design is yours. Please put the reworked boards on the canvas for Ralph before building.

## What Ralph said
1. **Changing the league shouldn't send you away.** Today it takes you back to the League page or the Start page. Switch it right there and let the numbers update in place.
2. **The section just above the league "selection box" is congested and doesn't feel right.** And tapping that box opens the On paper page, which surprised him.
3. **The bar is higher overall.** "Users are the most important people": every screen must be readable and easy to navigate, following Apple's guidelines. Right now it "isn't promising".

## What's happening now (your branch, 49c48d3)
- **`PaperLink`** ("2nd of 11 on paper · Arena of Champions ›") is a link to `/league/{id}/paper`.
  - It looks like a selector, but it navigates to another tab.
  - The league is whatever the phone remembered last, with no way to choose it here.
- **"Change team"** goes to `/planner?start=1`, the Start screen, so it's a full trip away and back.
- **The rating hero stacks four things in one block:** the big number, two unit lines, the explanatory note, and the pill.

## A direction that follows Apple's guidelines
1. **Each control does what it looks like.**
   - Choosing a league is a choice among exclusive options, so use a **pop-up button** that shows the current league ("Arena of Champions ▾") and lists the others.
   - Seeing the full table is navigation, so use its own row, with a label that says where it goes: "See the On paper table ›".
2. **Switch in place.**
   - Each league in the menu is a link to `/planner/{id}?league={leagueId}`, as a `<Link scroll={false}>`.
   - The server re-renders only the streamed rank (it's already in its own Suspense), and the page keeps its scroll position.
   - Remember the choice like the rest of the app.
   - It works without client JavaScript, for example as a `<details>` menu of links.
3. **Show loading only where it changes.** Use a placeholder line for the rank, never a page spinner.
   - The first time a league is opened, its squads take 1–3 s to load from FPL. After that it's fast.
   - With today's data change, squads are kept for good once a gameweek has finished.
4. **One idea per block.**
   - **The rating:** the number with one unit line ("339 pts projected · GW8–13").
   - **The explanation:** behind a small "How is this worked out?" disclosure, not always shown.
   - **The comparison:** a separate grouped section (like iOS Settings rows) with three rows:
     - "Compare in [Arena of Champions ▾]"
     - "2nd best squad of 11", which is plainer than "2nd of 11 on paper" for a new user
     - "See the On paper table ›"
5. **Change team without leaving.** Use a sheet: a team ID field plus recently used teams. It's a short task that should return you to where you were. Without JS, a `<details>` with a GET form to `/planner/find` works.
6. **Then do the same pass on every planner screen:**
   - tap targets of at least 44 pt;
   - body text of at least 17 px;
   - one primary action per screen;
   - every tappable thing says where it goes;
   - no dead ends.

## Data you can use (branch `feat/paper-leagues`)
- **`paperLeagues(myTeam.leagues)`** from `@/lib/planner/league`: the team's leagues it can be ranked in, for the menu. These are leagues that have started, have more than one manager, and have the team in the top 50 we load.
  - Friend leagues come first.
  - Use it with `getMyTeam(teamId)` from `lib/league/my-team`.
- **`getLeaguePaper`** now keeps a finished gameweek's squads for good, so switching back and forth between leagues is quick.
