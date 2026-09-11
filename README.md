# Flytdesigner

Tegn en arbeidsflyt som et kart, og få en brief Claude kan bygge en MVP fra.

Kjører på <https://forzacode00.github.io/app-workflow-tracker/> (GitHub Pages, deployes automatisk ved push til `main`).

Laget for team uten utviklere eller designere. Du starter med én boks (målet), og lar kartet vokse:
hvem som bruker flyten, hva som starter den, stegene, reglene, dataene som lagres, resultatene og
systemene den snakker med. Hver boks har bare en tittel og et notat. Briefen skrives fra kartet.

## Kom i gang

```bash
npm install
npm run dev
```

Appen kjører på <http://localhost:8080>. Første gang vises et eksempel. Trykk «Start egen flyt».

## Slik brukes den

1. Skriv målet i den første boksen. Trykk «+» på boksen, eller velg en type i paletten nederst.
2. Dra bokser dit du vil, trekk piler mellom dem fra sirkelen på høyre side.
3. Klikk «Vis brief» for å se hva Claude får. Tallet viser åpne spørsmål briefen vil stille.
4. «Kopier brief», lim inn i Claude og skriv «Bygg en MVP av denne flyten».
5. Del kartet med en kollega via «Vis brief» → «Del som JSON».

Alt lagres bare i nettleseren din. Ingen backend ennå.

## Utvikling

| Kommando | Hva |
|---|---|
| `npm run dev` | Utviklingsserver på port 8080 |
| `npm test` | Enhetstester og rendertester (vitest) |
| `npm run typecheck` | TypeScript |
| `npm run lint` | oxlint |
| `npm run build` | Produksjonsbygg til `dist/` |

Konsept og veikart: [docs/konsept.md](docs/konsept.md). Kodeinstrukser: [CLAUDE.md](CLAUDE.md).
