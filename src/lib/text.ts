/** Tekstverktøy for briefen. Brukerinput skal aldri kunne lage Markdown-struktur. */

export const lines = (text: string): string[] =>
  text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

/** Linjer som starter med `#`, `---`, `|` eller `>` får en skråstrek foran, så de forblir tekst. */
export const block = (value: string): string =>
  value
    .trim()
    .split(/\r?\n/)
    .map((l) => (/^\s*(#|---|\||>)/.test(l) ? `\\${l.trimStart()}` : l))
    .join("\n");

/** Én linje til bruk inne i setninger og punktlister. */
export const inline = (value: string): string => block(value).replace(/\n+/g, " ");

/** Markdown-cellene skal ikke bryte tabellen. */
export const cell = (value: string): string =>
  value
    .replace(/\|/g, "\\|")
    .replace(/\r?\n/g, " ")
    .trim() || "?";
