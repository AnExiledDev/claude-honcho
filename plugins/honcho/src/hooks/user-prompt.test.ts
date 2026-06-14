import { test, expect } from "bun:test";
import { extractTopics } from "./user-prompt";

// The old extractor relied on a hardcoded web-dev vocabulary and missed
// domain terms, issue refs, and identifiers. These tests pin the new
// domain-agnostic behavior.

test("captures issue/PR references", () => {
  const t = extractTopics("can you review #270 and the fix from PR #111?");
  expect(t).toContain("#270");
  expect(t).toContain("#111");
});

test("captures structured identifiers and file paths", () => {
  const t = extractTopics(
    "fix query_documents in src/crud/document.py and the conduit-bridge relay",
  );
  expect(t).toContain("query_documents");
  expect(t).toContain("conduit-bridge");
  expect(t.some((x) => x.includes("document.py"))).toBe(true);
});

test("captures acronyms and capitalized project names", () => {
  const t = extractTopics(
    "the MCP tool talks to Foundry through the Conduit relay using RRF ranking",
  );
  expect(t).toContain("MCP");
  expect(t).toContain("RRF");
  expect(t).toContain("Foundry");
  expect(t).toContain("Conduit");
});

test("captures lowercase domain words even when structural signal exists", () => {
  // Old code returned early on structural hits, dropping the content-word pass.
  const t = extractTopics("update the reliquary catalog after #5 lands");
  expect(t).toContain("#5");
  expect(t).toContain("reliquary");
  expect(t).toContain("catalog");
});

test("is not limited to a fixed tech vocabulary (non-web domain)", () => {
  // None of these are in any hardcoded list; they must still surface.
  const t = extractTopics("the gilded-gauntlet import and the dnd5e exporter");
  expect(t).toContain("gilded-gauntlet");
  // dnd5e is lowercase with an embedded digit; ensure the domain word lands.
  expect(t).toContain("exporter");
});

test("drops sentence-initial stopwords from the proper-noun pass", () => {
  const t = extractTopics("Please look at the honcho deriver");
  expect(t).not.toContain("Please");
  expect(t).toContain("deriver");
});

test("respects the topic cap", () => {
  const big = Array.from({ length: 60 }, (_, i) => `term_${i}_x`).join(" ");
  expect(extractTopics(big).length).toBeLessThanOrEqual(18);
});

test("returns empty for an empty prompt", () => {
  expect(extractTopics("")).toEqual([]);
});
