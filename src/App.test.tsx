import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import App from "./App";
import { exampleWorkflow } from "./lib/v1/example";

const brief = () => screen.getByLabelText("Brief til Claude, kan rulles");

describe("App", () => {
  it("første besøk: én målboks, panelet åpent med fokus i tittelen, og et hint", () => {
    render(<App />);
    expect(screen.getByLabelText("Rediger mål")).toBeInTheDocument();
    expect(screen.getByLabelText("Tittel")).toHaveFocus();
    expect(screen.getByText(/Skriv hva du vil oppnå/)).toBeInTheDocument();
    expect(screen.queryByText("Eksempel, ikke dine data")).not.toBeInTheDocument();
  });

  it("«Vis eksempel» laster to moduler, og kan angres", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("button", { name: "Vis eksempel" }));
    expect(screen.getByText("Eksempel, ikke dine data")).toBeInTheDocument();
    expect(screen.getByLabelText("Navn på modulen")).toHaveValue("Tilbudsforespørsel");
    expect(screen.getByLabelText("Modul")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Angre" }));
    expect(screen.queryByText("Eksempel, ikke dine data")).not.toBeInTheDocument();
  });

  it("Enter i tittelen legger til neste boks, og briefen følger med", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.type(screen.getByLabelText("Tittel"), "Færre e-poster{Enter}");
    expect(screen.getByLabelText("Rediger start")).toBeInTheDocument();
    await user.type(screen.getByLabelText("Tittel"), "Kunde sender skjema{Enter}");
    expect(screen.getByLabelText("Rediger steg")).toBeInTheDocument();
    await user.type(screen.getByLabelText("Tittel"), "Ta imot");
    await user.click(screen.getByRole("button", { name: /^Vis brief/ }));
    expect(brief()).toHaveTextContent("# Brief: Færre e-poster");
    expect(brief()).toHaveTextContent("1. **Ta imot**");
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

  it("en start-boks kan peke på en annen modul, og det blir et grensesnitt i briefen og oversikten", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.type(screen.getByLabelText("Tittel"), "Modul A");
    await user.click(screen.getByRole("button", { name: "Oversikt" }));
    await user.click(screen.getByRole("button", { name: "+ Ny modul" }));
    await user.type(screen.getByLabelText("Tittel"), "Modul B{Enter}");
    await user.type(screen.getByLabelText("Tittel"), "Får data fra A");
    await user.selectOptions(screen.getByLabelText("Peker på en annen modul?"), "m1");
    await user.click(screen.getByRole("button", { name: /^Vis brief/ }));
    expect(brief()).toHaveTextContent("**Denne modulen mottar fra «Modul A»** via start-boksen «Får data fra A»");
    await user.click(screen.getByRole("button", { name: "Hele nettstedet" }));
    expect(screen.getByLabelText("Oversikt over nettstedet, kan rulles")).toHaveTextContent("**Modul B ← Modul A**: Får data fra A");
  });

  it("melder fra når kopiering ikke er mulig", async () => {
    const user = userEvent.setup();
    vi.spyOn(navigator.clipboard, "writeText").mockRejectedValueOnce(new Error("nei"));
    render(<App />);
    await user.click(screen.getByRole("button", { name: "Kopier brief" }));
    expect(await screen.findByText("Kunne ikke kopiere automatisk. Åpne briefen og marker teksten.")).toBeInTheDocument();
  });

  it("import: feil ved ugyldig JSON, gammelt skjema blir ny modul, og kan angres", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.type(screen.getByLabelText("Tittel"), "Min");
    await user.click(screen.getByRole("button", { name: /^Vis brief/ }));
    const dialog = screen.getByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: "Del som JSON" }));
    const box = within(dialog).getByLabelText("Arbeidsområdet som JSON. Lim inn noe fra en kollega her for å importere det.");
    expect(within(dialog).getByRole("button", { name: "Importer" })).toBeDisabled();
    await user.clear(box);
    await user.paste("{nei");
    await user.click(within(dialog).getByRole("button", { name: "Importer" }));
    expect(within(dialog).getByRole("alert")).toHaveTextContent("Dette er ikke gyldig JSON.");
    await user.clear(box);
    await user.paste(JSON.stringify(exampleWorkflow()));
    await user.click(within(dialog).getByRole("button", { name: "Importer" }));
    expect(screen.getByText("Lagt til som ny modul.")).toBeInTheDocument();
    expect(screen.getByLabelText("Navn på modulen")).toHaveValue("Tilbudsforespørsel");
    expect(screen.getByLabelText("Modul")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Angre" }));
    expect(screen.queryByLabelText("Modul")).not.toBeInTheDocument();
  });
});
