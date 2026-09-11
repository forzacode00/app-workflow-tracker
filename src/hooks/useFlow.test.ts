import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { seedFlow } from "@/lib/flow";
import { BACKUP_KEY, STORAGE_KEY } from "@/lib/flowStorage";
import { useFlow } from "./useFlow";

const flush = () => act(() => vi.advanceTimersByTime(500));

describe("useFlow", () => {
  it("laster eksempelet når ingenting er lagret, uten å skrive til lagring", () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useFlow());
    expect(result.current.flow.eksempel).toBe(true);
    flush();
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    vi.useRealTimers();
  });

  it("overskriver ikke uleselig lagring før brukeren endrer noe", () => {
    vi.useFakeTimers();
    localStorage.setItem(STORAGE_KEY, "{korrupt");
    const { result } = renderHook(() => useFlow());
    expect(result.current.storage.loadError).not.toBeNull();
    flush();
    expect(localStorage.getItem(STORAGE_KEY)).toBe("{korrupt");
    act(() => result.current.setName("Ny"));
    flush();
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}").navn).toBe("Ny");
    expect(localStorage.getItem(BACKUP_KEY)).toBe("{korrupt");
    vi.useRealTimers();
  });

  it("legger til en boks koblet fra den valgte og velger den nye", () => {
    const { result } = renderHook(() => useFlow());
    act(() => result.current.reset());
    expect(result.current.selectedId).toBe("maal");
    let id = "";
    act(() => {
      id = result.current.addNode("steg", "maal");
    });
    expect(result.current.selectedId).toBe(id);
    expect(result.current.flow.edges).toEqual([expect.objectContaining({ from: "maal", to: id })]);
    expect(result.current.flow.nodes.find((n) => n.id === id)?.x).toBeGreaterThan(0);
    expect(result.current.flow.eksempel).toBe(false);
  });

  it("stabler nye bokser fra samme kilde under hverandre", () => {
    const { result } = renderHook(() => useFlow());
    act(() => result.current.reset());
    act(() => result.current.addNode("steg", "maal"));
    act(() => result.current.addNode("data", "maal"));
    const [a, b] = result.current.flow.nodes.filter((n) => n.id !== "maal");
    expect(a?.x).toBe(b?.x);
    expect(b?.y).toBeGreaterThan(a?.y ?? 0);
  });

  it("fjerner boks med kantene dens, og nullstiller valget", () => {
    const { result } = renderHook(() => useFlow());
    act(() => result.current.reset());
    let id = "";
    act(() => {
      id = result.current.addNode("steg", "maal");
    });
    act(() => result.current.removeNodes([id]));
    expect(result.current.flow.nodes.map((n) => n.id)).toEqual(["maal"]);
    expect(result.current.flow.edges).toEqual([]);
    expect(result.current.selectedId).toBeNull();
  });

  it("kobler, rydder duplikater og fjerner kanter", () => {
    const { result } = renderHook(() => useFlow());
    act(() => result.current.reset());
    let id = "";
    act(() => {
      id = result.current.addNode("steg");
    });
    act(() => result.current.connect("maal", id));
    act(() => result.current.connect("maal", id));
    expect(result.current.flow.edges).toHaveLength(1);
    act(() => result.current.removeEdges([result.current.flow.edges[0]!.id]));
    expect(result.current.flow.edges).toHaveLength(0);
  });

  it("flytter bokser og oppdaterer tekst og type", () => {
    const { result } = renderHook(() => useFlow());
    act(() => result.current.reset());
    act(() => result.current.moveNodes({ maal: { x: 40, y: 50 } }));
    act(() => result.current.updateNode("maal", { tittel: "Mål", notat: "n", type: "steg" }));
    expect(result.current.flow.nodes[0]).toEqual({ id: "maal", type: "steg", tittel: "Mål", notat: "n", x: 40, y: 50 });
  });

  it("start på nytt og eksempel kan angres", () => {
    const { result } = renderHook(() => useFlow());
    act(() => result.current.setName("Mitt"));
    act(() => result.current.reset());
    expect(result.current.flow).toEqual(seedFlow());
    act(() => result.current.undo());
    expect(result.current.flow.navn).toBe("Mitt");
    act(() => result.current.loadExample());
    expect(result.current.flow.eksempel).toBe(true);
    act(() => result.current.undo());
    expect(result.current.flow.navn).toBe("Mitt");
    let again = true;
    act(() => {
      again = result.current.undo();
    });
    expect(again).toBe(false);
  });
});
