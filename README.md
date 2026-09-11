# Flytdesigner

Beskriv en arbeidsflyt steg for steg, og få en brief Claude kan bygge en MVP fra.

Kjører på <https://forzacode00.github.io/app-workflow-tracker/> (GitHub Pages, deployes automatisk ved push til `main`).

Laget for team uten utviklere eller designere: skjemaet stiller spørsmålene en utvikler ellers
ville stilt (hva utløser flyten, hva kommer inn, hva må lagres, hva er reglene, hva kommer ut,
hva henger den sammen med). Svarene blir til en Markdown-brief som limes rett inn i Claude.

## Kom i gang

```bash
npm install
npm run dev
```

Appen kjører på <http://localhost:8080>. Trykk «Last eksempel» for å se en ferdig utfylt flyt.

## Slik brukes den

1. Trykk «Start egen flyt» og fyll ut de sju delene. Fremdriftslinjen øverst viser hva som mangler.
2. Se briefen oppdatere seg til høyre.
3. Trykk «Kopier brief», lim inn i Claude og skriv «Bygg en MVP av denne flyten». Briefen avslutter med «Åpne spørsmål» som Claude bør avklare først.
4. Del flyten med en kollega via fanen «Lagret data (JSON)».

Alt lagres bare i nettleseren din. Ingen backend ennå.

## Utvikling

| Kommando | Hva |
|---|---|
| `npm run dev` | Utviklingsserver på port 8080 |
| `npm test` | Enhetstester (vitest) |
| `npm run typecheck` | TypeScript |
| `npm run lint` | oxlint |
| `npm run build` | Produksjonsbygg til `dist/` |

Konsept og veikart: [docs/konsept.md](docs/konsept.md). Kodeinstrukser: [CLAUDE.md](CLAUDE.md).
