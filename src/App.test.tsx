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

  it("«Vis eksempel» laster eksempelet med merking, og kan angres", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("button", { name: "Vis eksempel" }));
    expect(screen.getByText("Eksempel, ikke dine data")).toBeInTheDocument();
    expect(screen.getByLabelText("Navn på flyten")).toHaveValue("Tilbudsforespørsel");
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

  it("«Endre type» bytter panelet", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByText("Endre type"));
    await user.selectOptions(screen.getByLabelText("Type"), "regel");
    expect(screen.getByLabelText("Rediger regel")).toBeInTheDocument();
  });

  it("melder fra når kopiering ikke er mulig", async () => {
    const user = userEvent.setup();
    vi.spyOn(navigator.clipboard, "writeText").mockRejectedValueOnce(new Error("nei"));
    render(<App />);
    await user.click(screen.getByRole("button", { name: "Kopier brief" }));
    expect(await screen.findByText("Kunne ikke kopiere automatisk. Åpne briefen og marker teksten.")).toBeInTheDocument();
  });

  it("import: viser feil ved ugyldig JSON, løfter gammelt skjema, og kan angres", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("button", { name: /^Vis brief/ }));
    const dialog = screen.getByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: "Del som JSON" }));
    const box = within(dialog).getByLabelText("Flyten som JSON. Lim inn en annen flyt her for å importere den.");
    expect(within(dialog).getByRole("button", { name: "Importer flyten" })).toBeDisabled();
    await user.clear(box);
    await user.paste("{nei");
    await user.click(within(dialog).getByRole("button", { name: "Importer flyten" }));
    expect(within(dialog).getByRole("alert")).toHaveTextContent("Dette er ikke gyldig JSON.");
    await user.clear(box);
    await user.paste(JSON.stringify(exampleWorkflow()));
    await user.click(within(dialog).getByRole("button", { name: "Importer flyten" }));
    expect(screen.getByLabelText("Navn på flyten")).toHaveValue("Tilbudsforespørsel");
    expect(screen.getAllByText("Ta imot forespørsel").length).toBeGreaterThan(0);
    await user.click(screen.getByRole("button", { name: "Angre" }));
    expect(screen.getByLabelText("Navn på flyten")).toHaveValue("");
  });
});
