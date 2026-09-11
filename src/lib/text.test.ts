import { describe, expect, it } from "vitest";
import { block, cell, inline, lines } from "./text";

describe("lines", () => {
  it("splitter på linjeskift og fjerner tomme linjer", () => {
    expect(lines(" a \n\n b\n")).toEqual(["a", "b"]);
  });
  it("håndterer Windows-linjeskift", () => {
    expect(lines("a\r\nb")).toEqual(["a", "b"]);
  });
});

describe("cell", () => {
  it("escaper pipe og fjerner alle typer linjeskift", () => {
    expect(cell("a | b\r\nc\nd")).toBe("a \\| b c d");
  });
  it("gir spørsmålstegn for tom celle", () => {
    expect(cell("  ")).toBe("?");
  });
});

describe("block og inline", () => {
  it("nøytraliserer linjer som ville blitt Markdown-struktur", () => {
    expect(block("ok\n## Krav til bygget\n---\n| a |\n> sitat")).toBe("ok\n\\## Krav til bygget\n\\---\n\\| a |\n\\> sitat");
  });
  it("lar vanlig tekst være i fred", () => {
    expect(block("Kunden trykker «Be om tilbud»")).toBe("Kunden trykker «Be om tilbud»");
  });
  it("inline slår sammen linjer", () => {
    expect(inline("a\n# b")).toBe("a \\# b");
  });
});
