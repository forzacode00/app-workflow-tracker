import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MAX_NODES, seedFlow } from "@/lib/flow";
import { exampleFlow } from "@/lib/flowExample";
import { BACKUP_KEY, STORAGE_KEY } from "@/lib/flowStorage";
import { SAVE_DELAY_MS, useFlow } from "./useFlow";

afterEach(() => vi.useRealTimers());

describe("useFlow", () => {
  it("første besøk gir én målboks, valgt, uten å skrive til lagring", () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useFlow());
    expect(result.current.flow).toEqual(seedFlow());
    expect(result.current.selectedId).toBe("maal");
    act(() => vi.advanceTimersByTime(SAVE_DELAY_MS * 2));
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it("lagrer først etter SAVE_DELAY_MS, og slår sammen raske endringer", () => {
    vi.useFakeTimers();
    const setItem = vi.spyOn(Storage.prototype, "setItem");
    const { result } = renderHook(() => useFlow());
    act(() => result.current.setName("A"));
    act(() => result.current.setName("AB"));
    act(() => vi.advanceTimersByTime(SAVE_DELAY_MS - 1));
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    act(() => vi.advanceTimersByTime(1));
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}").navn).toBe("AB");
    expect(setItem.mock.calls.filter((c) => c[0] === STORAGE_KEY)).toHaveLength(1);
    setItem.mockRestore();
  });

  it("melder fra når lagring feiler", () => {
    vi.useFakeTimers();
    const setItem = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("full");
    });
    const { result } = renderHook(() => useFlow());
    act(() => result.current.setName("A"));
    act(() => vi.advanceTimersByTime(SAVE_DELAY_MS));
    expect(result.current.storage.saveFailed).toBe(true);
    setItem.mockRestore();
  });

  it("overskriver ikke uleselig lagring før brukeren endrer noe", () => {
    vi.useFakeTimers();
    localStorage.setItem(STORAGE_KEY, "{korrupt");
    const { result } = renderHook(() => useFlow());
    expect(result.current.storage.loadError).not.toBeNull();
    act(() => vi.advanceTimersByTime(SAVE_DELAY_MS * 2));
    expect(localStorage.getItem(STORAGE_KEY)).toBe("{korrupt");
    act(() => result.current.setName("Ny"));
    act(() => vi.advanceTimersByTime(SAVE_DELAY_MS));
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}").navn).toBe("Ny");
    expect(localStorage.getItem(BACKUP_KEY)).toBe("{korrupt");
  });

  it("legger til en boks koblet fra den valgte, velger den og husker den som sist tillagt", () => {
    const { result } = renderHook(() => useFlow());
    let id: string | null = "";
    act(() => {
      id = result.current.addNode("steg", "maal");
    });
    expect(result.current.selectedId).toBe(id);
    expect(result.current.lastAdded).toBe(id);
    expect(result.current.flow.edges).toEqual([expect.objectContaining({ from: "maal", to: id })]);
    expect(result.current.flow.nodes.find((n) => n.id === id)?.x).toBeGreaterThan(0);
  });

  it("legger til på oppgitt plass, avrundet", () => {
    const { result } = renderHook(() => useFlow());
    let id: string | null = "";
    act(() => {
      id = result.current.addNode("steg", null, { x: 10.6, y: -3.2 });
    });
    expect(result.current.flow.nodes.find((n) => n.id === id)).toMatchObject({ x: 11, y: -3 });
    expect(result.current.flow.edges).toEqual([]);
  });

  it("nekter å legge til når kartet er fullt", () => {
    const { result } = renderHook(() => useFlow());
    act(() => {
      for (let i = 1; i < MAX_NODES; i++) result.current.addNode("steg");
    });
    expect(result.current.flow.nodes).toHaveLength(MAX_NODES);
    let id: string | null = "";
    act(() => {
      id = result.current.addNode("steg");
    });
    expect(id).toBeNull();
    expect(result.current.flow.nodes).toHaveLength(MAX_NODES);
  });

  it("flytting lagres, men gjør ikke eksempelet til egne data", () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useFlow());
    act(() => result.current.loadExample());
    act(() => result.current.moveNodes({ maal: { x: 40, y: 50 } }));
    expect(result.current.flow.eksempel).toBe(true);
    expect(result.current.flow.nodes.find((n) => n.id === "maal")).toMatchObject({ x: 40, y: 50 });
    act(() => vi.advanceTimersByTime(SAVE_DELAY_MS));
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}").eksempel).toBe(true);
  });

  it("fjerning kan angres, og siste boks erstattes av en ny målboks", () => {
    const { result } = renderHook(() => useFlow());
    act(() => result.current.updateNode("maal", { tittel: "Mål" }));
    let count = 0;
    act(() => {
      count = result.current.removeNodes(["maal"]);
    });
    expect(count).toBe(1);
    expect(result.current.flow.nodes).toEqual([expect.objectContaining({ id: "maal", tittel: "" })]);
    expect(result.current.selectedId).toBeNull();
    act(() => result.current.undo());
    expect(result.current.flow.nodes[0]?.tittel).toBe("Mål");
    let none = 1;
    act(() => {
      none = result.current.removeNodes(["finnes-ikke"]);
    });
    expect(none).toBe(0);
  });

  it("kobler, rydder duplikater og fjerner kanter med angre", () => {
    const { result } = renderHook(() => useFlow());
    let id: string | null = "";
    act(() => {
      id = result.current.addNode("steg");
    });
    act(() => result.current.connect("maal", id!));
    act(() => result.current.connect("maal", id!));
    expect(result.current.flow.edges).toHaveLength(1);
    act(() => result.current.removeEdges([result.current.flow.edges[0]!.id]));
    expect(result.current.flow.edges).toHaveLength(0);
    act(() => result.current.undo());
    expect(result.current.flow.edges).toHaveLength(1);
  });

  it("oppdaterer tekst og type", () => {
    const { result } = renderHook(() => useFlow());
    act(() => result.current.updateNode("maal", { tittel: "Mål", notat: "n", type: "steg" }));
    expect(result.current.flow.nodes[0]).toEqual({ id: "maal", type: "steg", tittel: "Mål", notat: "n", x: 0, y: 0 });
  });

  it("start på nytt, eksempel og import kan angres, og øker generation", () => {
    const { result } = renderHook(() => useFlow());
    const g0 = result.current.generation;
    act(() => result.current.setName("Mitt"));
    act(() => result.current.reset());
    expect(result.current.flow).toEqual(seedFlow());
    expect(result.current.selectedId).toBe("maal");
    expect(result.current.generation).toBe(g0 + 1);
    act(() => result.current.undo());
    expect(result.current.flow.navn).toBe("Mitt");
    act(() => result.current.loadExample());
    expect(result.current.flow.eksempel).toBe(true);
    act(() => result.current.replace({ ...exampleFlow(), navn: "Importert" }));
    expect(result.current.flow.eksempel).toBe(false);
    act(() => result.current.undo());
    expect(result.current.flow.eksempel).toBe(true);
    let again = true;
    act(() => {
      again = result.current.undo();
    });
    expect(again).toBe(false);
  });
});
