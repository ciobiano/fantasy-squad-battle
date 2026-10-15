import { describe, expect, it } from "vitest";
import { copyFor, languageChoice, resolveLang, START_ERRORS } from ".";

const form = (fields: Record<string, string>) => {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.set(key, value);
  return data;
};

describe("resolveLang", () => {
  it("keeps a saved choice", () => {
    expect(resolveLang("en", "fr-FR,fr;q=0.9")).toBe("en");
  });
  it("gives French phones French and everyone else Pidgin", () => {
    expect(resolveLang(undefined, "fr-CM,fr;q=0.9,en;q=0.8")).toBe("fr");
    expect(resolveLang(undefined, "fr")).toBe("fr");
    expect(resolveLang(undefined, "en-NG,en;q=0.9")).toBe("pcm");
    expect(resolveLang(undefined, null)).toBe("pcm");
  });
  it("ignores a cookie that isn't a language we speak", () => {
    expect(resolveLang("de", "en-GB")).toBe("pcm");
    expect(resolveLang(undefined, "frisian")).toBe("pcm");
  });
});

describe("languageChoice", () => {
  it("reads the language and a path on this site", () => {
    expect(languageChoice(form({ lang: "fr", back: "/league/314/table" }))).toEqual({ lang: "fr", back: "/league/314/table" });
    expect(languageChoice(form({ lang: "en", back: "/?start=1" })).back).toBe("/?start=1");
  });
  it("refuses a language we don't speak", () => {
    expect(languageChoice(form({ lang: "de", back: "/" })).lang).toBeNull();
  });
  it("never sends anyone off the site", () => {
    for (const back of ["//evil.example", "/\\evil.example", "https://evil.example", ""]) {
      expect(languageChoice(form({ lang: "en", back })).back).toBe("/");
    }
    expect(languageChoice(form({ lang: "en" })).back).toBe("/");
  });
});

describe("catalogues", () => {
  it("translates award titles, keeping Pidgin's Captain Wahala", () => {
    expect(copyFor("pcm").awards.captain).toBe("Captain Wahala");
    expect(copyFor("en").awards.captain).toBe("Captain Disaster");
    expect(copyFor("fr").awards.spoon).toBe("Cuillère de bois");
  });
  it("says Market movement in the reader's language", () => {
    expect(copyFor("en").league.moved.up(3)).toBe("Up 3 in the league");
    expect(copyFor("fr").league.moved.down(2)).toBe("Descend de 2 au classement");
  });
  it("has a message for every Start error", () => {
    expect(START_ERRORS).toContain("team-not-found");
    for (const lang of ["pcm", "en", "fr"] as const) {
      for (const error of START_ERRORS) expect(copyFor(lang).start.errors[error]).toBeTruthy();
    }
  });
});
