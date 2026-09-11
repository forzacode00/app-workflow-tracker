import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";
import { exampleWorkflow } from "./lib/v1/example";
import { markWelcomeSeen, WELCOME_KEY } from "./lib/workspaceStorage";

const brief = () => screen.getByLabelText("Bestilling til Claude, kan rulles");

describe("App", () => {
  beforeEach(() => markWelcomeSeen());

  it("aller første besøk: velkomsten sier hva appen er til, og «Tegn selv» går til lerretet", async () => {
    localStorage.removeItem(WELCOME_KEY);
    const user = userEvent.setup();
    render(<App />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Beskriv noe som er tungvint på jobben.");
    expect(screen.getByText("Du limer bestillingen inn i Claude")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Tegn selv på lerretet" }));
    expect(screen.getByLabelText("Tittel")).toHaveFocus();
    expect(localStorage.getItem(WELCOME_KEY)).toBe("1");
  });

  it("velkomsten vises ikke når noe er lagret fra før, selv om flagget mangler", () => {
    localStorage.removeItem(WELCOME_KEY);
    localStorage.setItem(
      "flytdesigner:v3",
      JSON.stringify({ versjon: 3, aktiv: "m1", moduler: [{ id: "m1", navn: "", x: 0, y: 0, eksempel: false, edges: [], nodes: [{ id: "maal", type: "maal", tittel: "Noe", notat: "", x: 0, y: 0 }] }] }),
    );
    render(<App />);
    expect(screen.queryByRole("button", { name: "Start med spørsmålene" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Vis bestilling/ })).toBeInTheDocument();
  });

  it("intervjuet: ett spørsmål om gangen, og svarene blir bokser på lerretet med bestilling", async () => {
    localStorage.removeItem(WELCOME_KEY);
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("button", { name: "Start med spørsmålene" }));
    expect(screen.getByText("Spørsmål 1 av 11")).toBeInTheDocument();
    const neste = () => screen.getByRole("button", { name: /^(Neste|Hopp over|Vis tegningen)$/ });
    expect(neste()).toBeDisabled();
    await user.type(screen.getByLabelText("Svar"), "Svare kunder innen 24 timer{Enter}");
    expect(screen.getByText("Spørsmål 2 av 11 · valgfritt")).toBeInTheDocument();
    expect(neste()).toHaveTextContent("Hopp over");
    await user.click(neste());
    /* Personer: liste. Enter legger til, Neste går videre. */
    await user.type(screen.getByLabelText("Skriv ett om gangen"), "Kunde{Enter}");
    await user.type(screen.getByLabelText("Legg til ett til"), "Selger{Enter}");
    expect(within(screen.getByRole("list", { name: "Det du har lagt til" })).getAllByRole("listitem")).toHaveLength(2);
    await user.click(neste());
    await user.type(screen.getByLabelText("Svar"), "Kunden sender skjema{Enter}");
    /* Steg med «Hvem gjør det?». Tekst i feltet uten «Legg til» tas med av Neste. */
    await user.type(screen.getByLabelText("Skriv ett om gangen"), "Appen lagrer forespørselen{Enter}");
    await user.selectOptions(screen.getByLabelText("Hvem gjør det?"), "1");
    await user.type(screen.getByLabelText("Legg til ett til"), "Selger svarer kunden");
    await user.click(neste());
    expect(screen.getByText("Spørsmål 6 av 11 · valgfritt")).toBeInTheDocument();
    await user.click(neste());
    await user.click(neste());
    await user.type(screen.getByLabelText("Skriv ett om gangen"), "Bekreftelse på e-post{Enter}");
    await user.click(neste());
    await user.click(neste());
    await user.click(neste());
    expect(screen.getByText("Spørsmål 11 av 11 · valgfritt")).toBeInTheDocument();
    await user.type(screen.getByLabelText("Svar"), "Tilbud");
    await user.click(screen.getByRole("button", { name: "Vis tegningen" }));
    expect(screen.getByText("Tegningen er klar. Neste steg: trykk «Kopier bestillingen» og lim inn i Claude.")).toBeInTheDocument();
    expect(screen.getByText(/Trykk «Kopier bestillingen» og lim inn i Claude. Vil du endre noe/)).toBeInTheDocument();
    expect(screen.queryByText("Neste:")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Navn på modulen")).toHaveValue("Tilbud");
    await user.click(screen.getByRole("button", { name: /^Vis bestilling/ }));
    expect(brief()).toHaveTextContent("# Brief: Tilbud");
    expect(brief()).toHaveTextContent("**Svare kunder innen 24 timer**");
    expect(brief()).toHaveTextContent("2. **Selger svarer kunden** - Utføres av: Selger - Gir: Bekreftelse på e-post");
    expect(brief()).toHaveTextContent("1. **Appen lagrer forespørselen**");
  });

  it("«Avbryt» i intervjuet går tilbake uten å lage noe", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("button", { name: "Svar på spørsmål i stedet" }));
    expect(screen.getByText("Spørsmål 1 av 11")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Avbryt" }));
    expect(screen.getByLabelText("Tittel")).toBeInTheDocument();
    expect(screen.queryByLabelText("Modul")).not.toBeInTheDocument();
  });

  it("første besøk etter velkomsten: én målboks, panelet åpent med fokus i tittelen, og et hint", () => {
    render(<App />);
    expect(screen.getByLabelText("Rediger mål")).toBeInTheDocument();
    expect(screen.getByLabelText("Tittel")).toHaveFocus();
    expect(screen.getByText(/Skriv hva du vil oppnå/)).toBeInTheDocument();
    expect(screen.queryByText("Eksempel, ikke dine data")).not.toBeInTheDocument();
  });

  it("«Vis eksempel» → CRM laster fem moduler", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("button", { name: "Vis eksempel" }));
    await user.click(screen.getByRole("menuitem", { name: /CRM/ }));
    expect(screen.getByLabelText("Navn på modulen")).toHaveValue("Kontakter");
    expect(within(screen.getByLabelText("Modul")).getAllByRole("option")).toHaveLength(5);
  });

  it("«Vis eksempel» laster to moduler; «Start egen modul» legger til en tredje ved siden av; «Fjern eksempelet» tømmer alt", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("button", { name: "Vis eksempel" }));
    await user.click(screen.getByRole("menuitem", { name: /Tilbudsforespørsel/ }));
    expect(screen.getByText("Eksempel, ikke dine data")).toBeInTheDocument();
    expect(screen.getByLabelText("Navn på modulen")).toHaveValue("Tilbudsforespørsel");
    await user.click(screen.getByRole("button", { name: "Start egen modul" }));
    expect(screen.getByText("Spørsmål 1 av 11")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Tegn selv i stedet" }));
    expect(within(screen.getByLabelText("Modul")).getAllByRole("option")).toHaveLength(3);
    expect(screen.getByLabelText("Tittel")).toHaveFocus();
    await user.click(screen.getByRole("button", { name: "Oversikt" }));
    /* Med en egen modul ved siden av er det ikke lenger bare et eksempel. */
    expect(screen.queryByRole("button", { name: "Fjern eksempelet" })).not.toBeInTheDocument();
  });

  it("«Fjern eksempelet» i oversikten tømmer alt når alle modulene er eksempel", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("button", { name: "Vis eksempel" }));
    await user.click(screen.getByRole("menuitem", { name: /CRM/ }));
    await user.click(screen.getByRole("button", { name: "Oversikt" }));
    await user.click(screen.getByRole("button", { name: "Fjern eksempelet" }));
    expect(screen.queryByLabelText("Modul")).not.toBeInTheDocument();
    expect(screen.getByText("Eksempelet er fjernet. Skriv hva du vil oppnå.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Angre" }));
    expect(within(screen.getByLabelText("Modul")).getAllByRole("option")).toHaveLength(5);
  });

  it("dytter til neste spørsmål i tankemodellen, og «?» åpner «Slik tenker du»", async () => {
    const user = userEvent.setup();
    render(<App />);
    expect(screen.queryByText("Neste:")).not.toBeInTheDocument();
    await user.type(screen.getByLabelText("Tittel"), "Færre e-poster");
    expect(screen.getByText("Hva setter det i gang?")).toBeInTheDocument();
    const nudge = screen.getByText("Neste:").closest("div") as HTMLElement;
    await user.click(within(nudge).getByRole("button", { name: "+ Start" }));
    expect(screen.getByLabelText("Rediger start")).toBeInTheDocument();
    /* En tom boks teller ikke som svart, så dyttet står til tittelen er skrevet. */
    expect(nudge).toHaveTextContent("Hva setter det i gang?");
    await user.type(screen.getByLabelText("Tittel"), "Kunden sender skjema");
    expect(screen.getByText("Neste:").closest("div")).toHaveTextContent("Hvem bruker det?");
    await user.click(screen.getByRole("button", { name: "Slik tenker du" }));
    expect(screen.getByRole("dialog", { name: "Slik tenker du" })).toHaveTextContent("Hva vil du oppnå, og hvordan ser du at det virker?");
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog", { name: "Slik tenker du" })).not.toBeInTheDocument();
  });

  it("Enter i tittelen legger til neste boks, og briefen følger med", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.type(screen.getByLabelText("Tittel"), "Færre e-poster{Enter}");
    expect(screen.getByLabelText("Rediger start")).toBeInTheDocument();
    await user.type(screen.getByLabelText("Tittel"), "Kunde sender skjema{Enter}");
    expect(screen.getByLabelText("Rediger steg")).toBeInTheDocument();
    await user.type(screen.getByLabelText("Tittel"), "Ta imot");
    await user.click(screen.getByRole("button", { name: /^Vis bestilling/ }));
    expect(brief()).toHaveTextContent("# Brief: Færre e-poster");
    expect(brief()).toHaveTextContent("1. **Ta imot**");
    expect(screen.getByText("Åpne spørsmål Claude vil stille:")).toBeInTheDocument();
  });

  it("Backspace i tittelfeltet fjerner ikke boksen, men «Fjern boksen» gjør det, med angre", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.type(screen.getByLabelText("Tittel"), "Mål{Backspace}");
    expect(screen.getByLabelText("Tittel")).toHaveValue("Må");
    await user.click(screen.getByRole("button", { name: "Fjern boksen" }));
    expect(screen.queryByLabelText("Rediger mål")).not.toBeInTheDocument();
    expect(screen.getByText("Fjernet.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Angre" }));
    expect(screen.getByText("Må")).toBeInTheDocument();
  });

  it("«Endre type» bytter panelet, og Esc lukker det", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByText("Endre type"));
    await user.selectOptions(screen.getByLabelText("Type"), "regel");
    expect(screen.getByLabelText("Rediger regel")).toBeInTheDocument();
    await user.keyboard("{Escape}");
    expect(screen.queryByLabelText("Rediger regel")).not.toBeInTheDocument();
  });

  it("en start-boks kan peke på en annen modul, og det blir et grensesnitt i briefen og i oversikten", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.type(screen.getByLabelText("Tittel"), "Modul A{Enter}");
    await user.type(screen.getByLabelText("Tittel"), "Får data fra B");
    // Med én modul tilbyr panelet å lage en ny, som boksen straks peker på, uten å forlate boksen.
    await user.click(screen.getByRole("button", { name: "+ Lag ny modul" }));
    expect(screen.getByText("Ny modul laget, og boksen peker på den. Bytt modul øverst når du vil fylle den.")).toBeInTheDocument();
    expect(screen.getByLabelText("Tittel")).toHaveValue("Får data fra B");
    expect(screen.getByLabelText("Mottar fra en annen modul?")).not.toHaveValue("");
    expect(screen.getByText("← fra (uten navn)")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /^Vis bestilling/ }));
    expect(brief()).toHaveTextContent("**Mottar fra «(uten navn)»**");
    await user.click(screen.getByRole("tab", { name: "Hele nettstedet" }));
    expect(screen.getByLabelText("Oversikt over nettstedet, kan rulles")).toHaveTextContent("**(uten navn) → Modul A**");
    await user.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Lukk" }));
    await user.click(screen.getByRole("button", { name: "Oversikt" }));
    expect(screen.getAllByText("Åpne")).toHaveLength(2);
  });

  it("modulvelgeren bytter modul", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.type(screen.getByLabelText("Tittel"), "Første");
    await user.click(screen.getByRole("button", { name: "Oversikt" }));
    await user.click(screen.getByRole("button", { name: "+ Ny modul" }));
    /* «+ Ny modul» stiller spørsmålene; «Tegn selv i stedet» gir en tom modul. */
    await user.click(screen.getByRole("button", { name: "Tegn selv i stedet" }));
    await user.type(screen.getByLabelText("Tittel"), "Andre");
    await user.selectOptions(screen.getByLabelText("Modul"), "m1");
    expect(screen.getByLabelText("Modul")).toHaveValue("m1");
    expect(screen.queryByLabelText("Tittel")).not.toBeInTheDocument();
    expect(screen.getAllByText("Første").length).toBeGreaterThan(0);
    expect(screen.queryByText("Andre", { selector: ".react-flow__node *" })).not.toBeInTheDocument();
  });

  it("melder fra når kopiering ikke er mulig", async () => {
    const user = userEvent.setup();
    vi.spyOn(navigator.clipboard, "writeText").mockRejectedValueOnce(new Error("nei"));
    render(<App />);
    await user.click(screen.getByRole("button", { name: "Kopier bestillingen" }));
    expect(await screen.findByText("Kunne ikke kopiere automatisk. Åpne bestillingen og marker teksten.")).toBeInTheDocument();
  });

  it("import: feil ved ugyldig JSON, gammelt skjema blir ny modul, og kan angres", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.type(screen.getByLabelText("Tittel"), "Min");
    await user.click(screen.getByRole("button", { name: /^Vis bestilling/ }));
    const dialog = screen.getByRole("dialog");
    await user.click(within(dialog).getByRole("tab", { name: "Del som JSON" }));
    const box = within(dialog).getByLabelText("Nettstedet som JSON. Lim inn noe fra en kollega her for å importere det.");
    expect(within(dialog).getByRole("button", { name: "Importer" })).toBeDisabled();
    await user.clear(box);
    await user.paste("{nei");
    await user.click(within(dialog).getByRole("button", { name: "Importer" }));
    expect(within(dialog).getByRole("alert")).toHaveTextContent("Dette er ikke gyldig JSON.");
    await user.clear(box);
    await user.paste(JSON.stringify(exampleWorkflow()));
    await user.click(within(dialog).getByRole("button", { name: "Importer" }));
    expect(screen.getByText("Lagt til og åpnet som ny modul.")).toBeInTheDocument();
    expect(screen.getByLabelText("Navn på modulen")).toHaveValue("Tilbudsforespørsel");
    expect(screen.getByLabelText("Modul")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Angre" }));
    expect(screen.queryByLabelText("Modul")).not.toBeInTheDocument();
  });
});
