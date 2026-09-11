import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { exampleWorkflow } from "@/lib/example";
import { BACKUP_KEY, STORAGE_KEY } from "@/lib/storage";
import { emptyWorkflow } from "@/lib/types";
import { useWorkflow } from "./useWorkflow";

describe("useWorkflow", () => {
  it("laster eksempelet når ingenting er lagret, uten å skrive til lagring", () => {
    const { result } = renderHook(() => useWorkflow());
    expect(result.current.workflow.eksempel).toBe(true);
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it("laster lagret flyt foran eksempelet", () => {
    const saved = { ...emptyWorkflow(), navn: "Min flyt" };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
    const { result } = renderHook(() => useWorkflow());
    expect(result.current.workflow.navn).toBe("Min flyt");
    expect(result.current.storage.loadError).toBeNull();
  });

  it("overskriver ikke uleselig lagret verdi før brukeren endrer noe", () => {
    localStorage.setItem(STORAGE_KEY, "{korrupt");
    const { result } = renderHook(() => useWorkflow());
    expect(result.current.storage.loadError).not.toBeNull();
    expect(localStorage.getItem(STORAGE_KEY)).toBe("{korrupt");
    expect(localStorage.getItem(BACKUP_KEY)).toBe("{korrupt");
    act(() => result.current.setText("navn", "Ny"));
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}").navn).toBe("Ny");
    expect(localStorage.getItem(BACKUP_KEY)).toBe("{korrupt");
  });

  it("nullstiller eksempel-flagget og lagrer ved redigering", () => {
    const { result } = renderHook(() => useWorkflow());
    act(() => result.current.setText("navn", "Egen"));
    expect(result.current.workflow.eksempel).toBe(false);
    expect(result.current.workflow.navn).toBe("Egen");
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}").navn).toBe("Egen");
    expect(result.current.storage.saveFailed).toBe(false);
  });

  it("legger til, oppdaterer og fjerner rader uten å røre naboene", () => {
    const { result } = renderHook(() => useWorkflow());
    act(() => result.current.reset());
    act(() => result.current.addItem("steg"));
    act(() => result.current.addItem("steg"));
    act(() => result.current.updateItem("steg", 1, { tittel: "Andre" }));
    expect(result.current.workflow.steg.map((s) => s.tittel)).toEqual(["", "Andre"]);
    act(() => result.current.removeItem("steg", 0));
    expect(result.current.workflow.steg.map((s) => s.tittel)).toEqual(["Andre"]);
  });

  it("import setter eksempel til false, og kan angres", () => {
    const { result } = renderHook(() => useWorkflow());
    act(() => result.current.replace({ ...exampleWorkflow(), navn: "Importert" }));
    expect(result.current.workflow.navn).toBe("Importert");
    expect(result.current.workflow.eksempel).toBe(false);
    let undone = false;
    act(() => {
      undone = result.current.undo();
    });
    expect(undone).toBe(true);
    expect(result.current.workflow.navn).toBe("Tilbudsforespørsel");
    expect(result.current.workflow.eksempel).toBe(true);
  });

  it("angre gir false når det ikke er noe å angre", () => {
    const { result } = renderHook(() => useWorkflow());
    let undone = true;
    act(() => {
      undone = result.current.undo();
    });
    expect(undone).toBe(false);
  });

  it("start på nytt gir tom flyt, og eksempelet kan hentes tilbake med angre", () => {
    const { result } = renderHook(() => useWorkflow());
    act(() => result.current.reset());
    expect(result.current.workflow).toEqual(emptyWorkflow());
    act(() => result.current.undo());
    expect(result.current.workflow.eksempel).toBe(true);
    act(() => result.current.loadExample());
    expect(result.current.workflow.eksempel).toBe(true);
  });
});
