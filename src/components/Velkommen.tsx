import { Button } from "@/components/ui/Button";

type Props = {
  onStart: () => void;
  onExample: () => void;
  onCanvas: () => void;
};

/* Rekkefølgen er reell: dette er de tre tingene som skjer, i den rekkefølgen. */
const TRINN = [
  ["Du svarer på noen spørsmål", "Hva er tungvint, hvem gjør det, hva skjer først, hva skal komme ut. Vanlig norsk, ingen fagord. Tar fem minutter."],
  ["Appen tegner det som et kart", "Hvert svar blir en boks med piler mellom. Du kan flytte og endre etterpå, eller la det stå."],
  ["Du limer bestillingen inn i Claude", "Claude bygger første versjon og spør om det som mangler. Ingen utviklere trengs."],
] as const;

/** Første skjerm. Sier hva appen er til for, før den ber om noe som helst. */
export function Velkommen({ onStart, onExample, onCanvas }: Props) {
  return (
    <main className="flex min-h-dvh flex-col items-center overflow-y-auto bg-background px-4 py-8 sm:justify-center sm:px-8">
      <div className="flex w-full max-w-[560px] flex-col gap-6">
        <div className="flex flex-col gap-2">
          <p className="m-0 text-xs font-semibold tracking-[0.08em] text-primary uppercase">Flytdesigner</p>
          <h1 className="m-0 text-[28px] leading-tight font-bold tracking-[-0.01em] text-balance sm:text-[32px]">
            Beskriv noe som er tungvint på jobben. Få en bestilling Claude kan bygge en app fra.
          </h1>
          <p className="m-0 text-[15px] text-secondary-foreground">Du trenger ikke kunne noe om apper. Du trenger bare å vite hvordan jobben gjøres i dag.</p>
        </div>
        <ol className="m-0 flex list-none flex-col gap-4 p-0">
          {TRINN.map(([tittel, tekst], i) => (
            <li key={tittel} className="flex gap-4">
              <span
                aria-hidden="true"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-soft text-sm font-bold text-primary tabular-nums"
              >
                {i + 1}
              </span>
              <div className="flex flex-col gap-0.5 pt-1">
                <span className="font-semibold">{tittel}</span>
                <span className="text-[13.5px] text-secondary-foreground">{tekst}</span>
              </div>
            </li>
          ))}
        </ol>
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <Button variant="primary" onClick={onStart} autoFocus>
            Start med spørsmålene
          </Button>
          <Button onClick={onExample}>Se et ferdig eksempel</Button>
          <Button variant="ghost" onClick={onCanvas}>
            Tegn selv på lerretet
          </Button>
        </div>
        <p className="m-0 text-xs text-muted-foreground">Alt lagres bare i denne nettleseren. Ingenting sendes noe sted før du selv limer det inn i Claude.</p>
      </div>
    </main>
  );
}
