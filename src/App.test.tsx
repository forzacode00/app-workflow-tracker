import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import App from "./App";

describe("App", () => {
  it("viser eksempelkartet med merking ved første besøk", () => {
    render(<App />);
    expect(screen.getByText("Eksempel, ikke dine data")).toBeInTheDocument();
    expect(screen.getByLabelText("Navn på flyten")).toHaveValue("Tilbudsforespørsel");
    expect(screen.getAllByText("Kunde").length).toBeGreaterThan(0);
  });

  it("«Start egen flyt» gir ett mål-boks, valgt, med panelet åpent", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("button", { name: "Start egen flyt" }));
    expect(screen.queryByText("Eksempel, ikke dine data")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Rediger mål")).toBeInTheDocument();
    expect(screen.getByLabelText("Tittel")).toHaveFocus();
  });

  it("panelet lar kartet vokse fra den valgte boksen", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("button", { name: "Start egen flyt" }));
    await user.type(screen.getByLabelText("Tittel"), "Færre e-poster");
    await user.click(screen.getByRole("button", { name: "+ Steg" }));
    expect(screen.getByLabelText("Rediger steg")).toBeInTheDocument();
    await user.type(screen.getByLabelText("Tittel"), "Ta imot");
    await user.click(screen.getByRole("button", { name: /^Vis brief/ }));
    expect(screen.getByLabelText("Brief til Claude, kan rulles")).toHaveTextContent("# Brief: Færre e-poster");
    expect(screen.getByLabelText("Brief til Claude, kan rulles")).toHaveTextContent("1. **Ta imot**");
  });

  it("melder fra når kopiering ikke er mulig", async () => {
    const user = userEvent.setup();
    vi.spyOn(navigator.clipboard, "writeText").mockRejectedValueOnce(new Error("nei"));
    render(<App />);
    await user.click(screen.getByRole("button", { name: "Kopier brief" }));
    expect(await screen.findByText("Kunne ikke kopiere automatisk. Åpne briefen og marker teksten.")).toBeInTheDocument();
  });

  it("viser feil ved ugyldig import og importerer gyldig JSON", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("button", { name: /^Vis brief/ }));
    await user.click(screen.getByRole("button", { name: "Del som JSON" }));
    const box = screen.getByLabelText("Flyten som JSON. Lim inn en annen flyt her for å importere den.");
    expect(screen.getByRole("button", { name: "Importer flyten" })).toBeDisabled();
    await user.clear(box);
    await user.paste("{nei");
    await user.click(screen.getByRole("button", { name: "Importer flyten" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Dette er ikke gyldig JSON.");
    await user.clear(box);
    await user.paste(JSON.stringify({ versjon: 2, navn: "Fra kollega", nodes: [], edges: [] }));
    await user.click(screen.getByRole("button", { name: "Importer flyten" }));
    expect(screen.getByLabelText("Navn på flyten")).toHaveValue("Fra kollega");
  });
});
