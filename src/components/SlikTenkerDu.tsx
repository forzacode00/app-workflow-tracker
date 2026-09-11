import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/Button";

type Props = { open: boolean; onClose: () => void };

/** Tankemodellen i fem setninger, og de vanligste feilene. Ikke en manual. */
const TANKEMODELL = [
  "Hva vil du oppnå, og hvordan ser du at det virker?",
  "Hvem bruker det?",
  "Hva setter det i gang, og hva skjer så, steg for steg?",
  "Hva må huskes underveis, og hva sitter noen igjen med?",
  "Hva henger det sammen med som dere allerede har?",
] as const;

const FEIL = [
  ["Steg som er en regel.", "Et steg skjer hver gang. En regel gjelder bare når noe er sant. Heng regelen på steget."],
  ["Start som er målet.", "Målet er hvorfor. Start er det som skjer først: en knapp, en e-post, klokka 08."],
  ["Resultat som er en handling.", "«Send e-post» er et steg. «Bekreftelse på e-post til kunden» er resultatet."],
  ["Alt i ett steg.", "«Salg behandler forespørselen» er fire steg. Ett steg er én ting, én person."],
  ["Ingen data.", "Alt som må huskes fra ett steg til et annet er data: en forespørsel, et tilbud, en kunde. Skriv feltene i notatet."],
  ["Pil betyr tre ting.", "Mellom steg: rekkefølge. Fra steg til regel, data og resultat: hører til. For system: retningen sier om dere sender eller henter."],
] as const;

export function SlikTenkerDu({ open, onClose }: Props) {
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-30 flex justify-end" role="dialog" aria-modal="true" aria-label="Slik tenker du">
      <button type="button" aria-label="Lukk hjelpen" className="flex-1 bg-foreground/40" onClick={onClose} />
      <div className="flex w-full max-w-[460px] flex-col gap-4 overflow-y-auto bg-card p-5 shadow-xl">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold">Slik tenker du</h2>
          <Button ref={closeRef} size="sm" onClick={onClose}>
            Lukk
          </Button>
        </div>
        <p className="m-0 text-[13.5px] text-secondary-foreground">En modul er svaret på fem spørsmål. Boksene er bare spørsmålene, satt på et lerret.</p>
        <ol className="m-0 flex list-none flex-col gap-2 p-0">
          {TANKEMODELL.map((s, i) => (
            <li key={s} className="flex gap-3 text-[15px]">
              <span className="w-5 shrink-0 font-semibold text-primary tabular-nums">{i + 1}</span>
              <span>{s}</span>
            </li>
          ))}
        </ol>
        <h3 className="mt-2 text-sm font-semibold tracking-[0.06em] text-secondary-foreground uppercase">Vanlige feil</h3>
        <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
          {FEIL.map(([tittel, tekst]) => (
            <li key={tittel} className="text-[13.5px]">
              <strong>{tittel}</strong> {tekst}
            </li>
          ))}
        </ul>
        <p className="m-0 text-xs text-muted-foreground">Trykk «Vis eksempel» for å se to ferdige nettsteder. Briefen viser nederst hva som mangler.</p>
      </div>
    </div>
  );
}
