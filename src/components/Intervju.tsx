import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { LONG, SHORT } from "@/lib/flow";
import { besvart, erListe, SPORSMAL, tilModul, tomtSvar, type ListeId, type Punkt, type Svar, type TekstId } from "@/lib/intervju";
import { newModuleId, type Module } from "@/lib/workspace";

type Props = {
  onDone: (m: Module) => void;
  onCancel: () => void;
  /** «Tegn selv»: hopp over spørsmålene og gå rett til lerretet. */
  onDrawInstead: () => void;
};

const kortNavn = (p: Punkt) => p.tekst.split(":")[0]!.trim().slice(0, 40);

/** Spørsmålene i tankemodellen, ett om gangen. Svarene blir en modul når man er ferdig. */
export function Intervju({ onDone, onCancel, onDrawInstead }: Props) {
  const [i, setI] = useState(0);
  const [svar, setSvar] = useState<Svar>(tomtSvar);
  const [utkast, setUtkast] = useState("");
  const [utkastValg, setUtkastValg] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const q = SPORSMAL[i]!;
  const siste = i === SPORSMAL.length - 1;
  const liste = erListe(q.id);

  /* Fokus i feltet for hvert nytt spørsmål. Feltet tømmes i `ga`, der byttet skjer. */
  useEffect(() => {
    inputRef.current?.focus();
  }, [i]);

  const ga = (til: number) => {
    setUtkast("");
    setUtkastValg("");
    setI(til);
  };

  /** Svarene med det som står i feltet lagt til, om noe. Brukes både av «Legg til» og «Neste». */
  const medUtkast = (s: Svar): Svar => {
    const tekst = utkast.trim();
    if (!liste || !tekst) return s;
    const punkt: Punkt = { tekst: tekst.slice(0, LONG), valg: utkastValg === "" ? null : Number(utkastValg) };
    return { ...s, [q.id]: [...s[q.id as ListeId], punkt] };
  };

  const leggTil = () => {
    const s = medUtkast(svar);
    if (s === svar) return;
    setSvar(s);
    setUtkast("");
    inputRef.current?.focus();
  };

  const fjern = (idx: number) => setSvar((s) => ({ ...s, [q.id]: s[q.id as ListeId].filter((_, k) => k !== idx) }));

  const settTekst = (value: string) => setSvar((s) => ({ ...s, [q.id]: value }));

  const kanGaVidere = liste ? besvart(svar, q.id) || utkast.trim().length > 0 || q.valgfritt : besvart(svar, q.id) || q.valgfritt;

  const neste = () => {
    const s = medUtkast(svar);
    if (s !== svar) setSvar(s);
    if (siste) {
      onDone(tilModul(s, newModuleId(), { x: 0, y: 0 }));
      return;
    }
    ga(i + 1);
  };

  const valgOptions = () => {
    if (!q.velg) return [];
    const kilde = q.velg.fra === "personer" ? svar.personer : svar.steg;
    return [
      { value: "", label: q.velg.ingen },
      ...(q.velg.auto ? [{ value: "-1", label: q.velg.auto }] : []),
      ...kilde.map((p, k) => ({ value: String(k), label: `${q.velg!.fra === "steg" ? `${k + 1}. ` : ""}${kortNavn(p)}` })),
    ];
  };

  const punkter = liste ? svar[q.id as ListeId] : [];
  const feltId = `intervju-${q.id}`;

  return (
    <main className="flex min-h-dvh flex-col items-center overflow-y-auto bg-background px-4 py-6 sm:px-8 sm:py-10" aria-labelledby="intervju-tittel">
      <div className="flex w-full max-w-[560px] flex-col gap-5">
        <div className="flex items-center justify-between gap-3">
          <p className="m-0 text-xs font-semibold tracking-[0.08em] text-primary uppercase">Flytdesigner</p>
          <div className="flex gap-1">
            <Button size="sm" variant="ghost" onClick={onDrawInstead}>
              Tegn selv i stedet
            </Button>
            <Button size="sm" variant="ghost" onClick={onCancel}>
              Avbryt
            </Button>
          </div>
        </div>
        <div className="flex flex-col gap-1.5" aria-live="polite">
          <p className="m-0 text-sm text-secondary-foreground tabular-nums">
            Spørsmål {i + 1} av {SPORSMAL.length}
            {q.valgfritt && " · valgfritt"}
          </p>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-subtle" aria-hidden="true">
            <div className="h-full rounded-full bg-primary transition-[width]" style={{ width: `${((i + 1) / SPORSMAL.length) * 100}%` }} />
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <h1 id="intervju-tittel" className="m-0 text-[24px] leading-tight font-bold tracking-[-0.01em] text-balance">
            {q.tittel}
          </h1>
          <p className="m-0 text-[14px] text-secondary-foreground">{q.hjelp}</p>
        </div>

        {liste ? (
          <div className="flex flex-col gap-3">
            <form
              className="flex flex-col gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                leggTil();
              }}
            >
              <Field id={feltId} label={punkter.length ? "Legg til ett til" : "Skriv ett om gangen"} hint={`Eksempel: ${q.eksempel}`}>
                <Input id={feltId} ref={inputRef} value={utkast} onChange={(e) => setUtkast(e.target.value)} maxLength={LONG} autoComplete="off" />
              </Field>
              {q.velg && (
                <Field id={`${feltId}-valg`} label={q.velg.label}>
                  <Select id={`${feltId}-valg`} options={valgOptions()} value={utkastValg} onValueChange={setUtkastValg} />
                </Field>
              )}
              <div>
                <Button type="submit" size="sm" disabled={!utkast.trim()}>
                  Legg til
                </Button>
              </div>
            </form>
            {punkter.length > 0 && (
              <ul className="m-0 flex list-none flex-col gap-1.5 p-0" aria-label="Det du har lagt til">
                {punkter.map((p, k) => (
                  <li key={`${k}-${p.tekst}`} className="flex items-center justify-between gap-3 rounded-md border border-border bg-card px-3 py-2">
                    <span className="min-w-0 text-[14px]">
                      {q.velg?.fra === "steg" && <span className="mr-1.5 font-semibold text-primary tabular-nums">{k + 1}.</span>}
                      {p.tekst}
                      {q.velg && p.valg !== null && (
                        <span className="ml-1.5 text-xs text-muted-foreground">
                          ({p.valg === -1
                            ? (q.velg.auto ?? "").toLowerCase()
                            : `${q.velg.label.replace("?", "").toLowerCase()}: ${kortNavn((q.velg.fra === "personer" ? svar.personer : svar.steg)[p.valg] ?? { tekst: "", valg: null })}`})
                        </span>
                      )}
                    </span>
                    <Button size="sm" variant="ghost" onClick={() => fjern(k)} aria-label={`Fjern «${p.tekst.slice(0, 40)}»`}>
                      Fjern
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : q.id === "virker" ? (
          <Field id={feltId} label="Svar" hint={`Eksempel: ${q.eksempel}`}>
            <Textarea id={feltId} autoFocus rows={3} value={svar[q.id as TekstId]} onChange={(e) => settTekst(e.target.value)} maxLength={LONG} />
          </Field>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (kanGaVidere) neste();
            }}
          >
            <Field id={feltId} label="Svar" hint={`Eksempel: ${q.eksempel}`}>
              <Input id={feltId} ref={inputRef} value={svar[q.id as TekstId]} onChange={(e) => settTekst(e.target.value)} maxLength={SHORT} autoComplete="off" />
            </Field>
          </form>
        )}

        <div className="flex flex-wrap items-center gap-2 border-t border-border pt-4">
          <Button onClick={() => ga(Math.max(0, i - 1))} disabled={i === 0}>
            Tilbake
          </Button>
          <Button variant="primary" onClick={neste} disabled={!kanGaVidere}>
            {siste ? "Vis tegningen" : q.valgfritt && !besvart(svar, q.id) && !utkast.trim() ? "Hopp over" : "Neste"}
          </Button>
          <span className="text-xs text-muted-foreground">
            {!kanGaVidere ? (liste ? "Legg til minst ett." : "Skriv et svar for å gå videre.") : siste ? "Du kan endre alt på tegningen etterpå." : liste ? "Enter legger til." : q.id === "virker" ? "" : "Enter går videre."}
          </span>
        </div>
      </div>
    </main>
  );
}
