import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import App from "./App";

describe("App", () => {
  it("viser eksempelet med tydelig merking og briefen ved første besøk", () => {
    render(<App />);
    expect(screen.getByText("Dette er et eksempel.")).toBeInTheDocument();
    expect(screen.getByText("Eksempel, ikke dine data")).toBeInTheDocument();
    expect(screen.getByLabelText("Brief til Claude, kan rulles")).toHaveTextContent("# Brief: Tilbudsforespørsel");
  });

  it("«Start egen flyt» tømmer skjemaet og setter fokus på navnet", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("button", { name: "Start egen flyt" }));
    expect(screen.queryByText("Dette er et eksempel.")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Navn på flyten")).toHaveFocus();
    expect(screen.getByLabelText("Brief til Claude, kan rulles")).toHaveTextContent("# Brief: (uten navn)");
  });

  it("«Start på nytt» kan angres fra meldingen", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.clear(screen.getByLabelText("Navn på flyten"));
    await user.type(screen.getByLabelText("Navn på flyten"), "Min");
    await user.click(screen.getByRole("button", { name: "Start på nytt" }));
    expect(screen.getByLabelText("Navn på flyten")).toHaveValue("");
    await user.click(screen.getByRole("button", { name: "Angre" }));
    expect(screen.getByLabelText("Navn på flyten")).toHaveValue("Min");
  });

  it("melder fra når kopiering ikke er mulig", async () => {
    const user = userEvent.setup();
    vi.spyOn(navigator.clipboard, "writeText").mockRejectedValueOnce(new Error("nei"));
    render(<App />);
    await user.click(screen.getAllByRole("button", { name: "Kopier brief" })[0]!);
    expect(await screen.findByText("Kunne ikke kopiere automatisk. Bruk fanen «Rå tekst».")).toBeInTheDocument();
  });

  it("viser feil ved ugyldig import, og importerer gyldig JSON", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("button", { name: "Lagret data (JSON)" }));
    const box = screen.getByLabelText("Flyten som JSON. Lim inn en annen flyt her for å importere den.");
    expect(screen.getByRole("button", { name: "Importer flyten" })).toBeDisabled();
    await user.clear(box);
    await user.type(box, "{{ikke json");
    await user.click(screen.getByRole("button", { name: "Importer flyten" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Dette er ikke gyldig JSON.");
    await user.clear(box);
    await user.paste(JSON.stringify({ navn: "Fra kollega" }));
    await user.click(screen.getByRole("button", { name: "Importer flyten" }));
    expect(screen.getByLabelText("Navn på flyten")).toHaveValue("Fra kollega");
    expect(screen.queryByText("Eksempel, ikke dine data")).not.toBeInTheDocument();
  });
});
