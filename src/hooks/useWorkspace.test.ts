import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MAX_NODES } from "@/lib/flow";
import { seedWorkspace } from "@/lib/workspace";
import { exampleWorkspace } from "@/lib/workspaceExample";
import { BACKUP_KEY, STORAGE_KEY } from "@/lib/workspaceStorage";
import { SAVE_DELAY_MS, useWorkspace } from "./useWorkspace";

afterEach(() => vi.useRealTimers());

describe("useWorkspace", () => {
  it("første besøk gir én modul med én målboks, valgt, uten å skrive til lagring", () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useWorkspace());
    expect(result.current.ws).toEqual(seedWorkspace());
    expect(result.current.selectedId).toBe("maal");
    act(() => vi.advanceTimersByTime(SAVE_DELAY_MS * 2));
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it("lagrer først etter SAVE_DELAY_MS, slår sammen raske endringer, og melder fra ved feil", () => {
    vi.useFakeTimers();
    const setItem = vi.spyOn(Storage.prototype, "setItem");
    const { result } = renderHook(() => useWorkspace());
    act(() => result.current.setName("A"));
    act(() => result.current.setName("AB"));
    act(() => vi.advanceTimersByTime(SAVE_DELAY_MS - 1));
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    act(() => vi.advanceTimersByTime(1));
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}").moduler[0].navn).toBe("AB");
    expect(setItem.mock.calls.filter((c) => c[0] === STORAGE_KEY)).toHaveLength(1);
    setItem.mockImplementation(() => {
      throw new Error("full");
    });
    act(() => result.current.setName("ABC"));
    act(() => vi.advanceTimersByTime(SAVE_DELAY_MS));
    expect(result.current.storage.saveFailed).toBe(true);
    setItem.mockRestore();
  });

  it("overskriver ikke uleselig lagring før brukeren endrer noe", () => {
    vi.useFakeTimers();
    localStorage.setItem(STORAGE_KEY, "{korrupt");
    const { result } = renderHook(() => useWorkspace());
    expect(result.current.storage.loadError).not.toBeNull();
    act(() => vi.advanceTimersByTime(SAVE_DELAY_MS * 2));
    expect(localStorage.getItem(STORAGE_KEY)).toBe("{korrupt");
    act(() => result.current.setName("Ny"));
    act(() => vi.advanceTimersByTime(SAVE_DELAY_MS));
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}").moduler[0].navn).toBe("Ny");
    expect(localStorage.getItem(BACKUP_KEY)).toBe("{korrupt");
  });

  it("legger til en boks koblet fra den valgte, velger den, og nekter når modulen er full", () => {
    const { result } = renderHook(() => useWorkspace());
    let id: string | null = "";
    act(() => {
      id = result.current.addNode("steg", "maal");
    });
    expect(result.current.selectedId).toBe(id);
    expect(result.current.lastAdded).toBe(id);
    expect(result.current.flow.edges).toEqual([expect.objectContaining({ from: "maal", to: id })]);
    act(() => {
      for (let i = 2; i < MAX_NODES; i++) result.current.addNode("steg");
    });
    expect(result.current.flow.nodes).toHaveLength(MAX_NODES);
    act(() => {
      id = result.current.addNode("steg");
    });
    expect(id).toBeNull();
    expect(result.current.flow.nodes).toHaveLength(MAX_NODES);
  });

  it("fra en regel festes det nye på steget regelen henger på; fra en person ikke", () => {
    const { result } = renderHook(() => useWorkspace());
    let steg = "";
    let regel = "";
    let neste = "";
    act(() => {
      steg = result.current.addNode("steg", "maal")!;
    });
    act(() => {
      regel = result.current.addNode("regel", steg)!;
    });
    act(() => {
      neste = result.current.addNode("steg", regel)!;
    });
    expect(result.current.flow.edges.some((e) => e.from === steg && e.to === neste)).toBe(true);
    expect(result.current.flow.edges.some((e) => e.from === regel && e.to === neste)).toBe(false);
    let q = "";
    act(() => {
      q = result.current.addNode("sporsmal", regel)!;
    });
    expect(result.current.flow.edges.some((e) => e.from === regel && e.to === q)).toBe(true);
    let person = "";
    let fraPerson = "";
    act(() => {
      person = result.current.addNode("person", "maal")!;
    });
    act(() => {
      fraPerson = result.current.addNode("steg", person)!;
    });
    expect(result.current.flow.edges.some((e) => e.from === person && e.to === fraPerson)).toBe(true);
  });

  it("fjerning syr kjeden sammen, kan angres med riktig tilstand, og siste boks erstattes av ny målboks", () => {
    const { result } = renderHook(() => useWorkspace());
    let a = "";
    let b = "";
    let c = "";
    act(() => {
      a = result.current.addNode("steg", "maal")!;
    });
    act(() => {
      b = result.current.addNode("steg", a)!;
    });
    act(() => {
      c = result.current.addNode("steg", b)!;
    });
    act(() => result.current.updateNode(b, { tittel: "Midten" }));
    const before = result.current.ws;
    act(() => result.current.removeNodes([b]));
    expect(result.current.flow.edges.some((e) => e.from === a && e.to === c)).toBe(true);
    expect(result.current.flow.nodes.map((n) => n.id)).not.toContain(b);
    act(() => result.current.undo());
    expect(result.current.ws).toEqual(before);
    act(() => result.current.removeNodes(["maal", a, b, c]));
    expect(result.current.flow.nodes).toEqual([expect.objectContaining({ id: "maal", tittel: "" })]);
    let none = 1;
    act(() => {
      none = result.current.removeNodes(["finnes-ikke"]);
    });
    expect(none).toBe(0);
  });

  it("angre etter boks + pil fjernet i samme hendelse gir hele tilstanden tilbake", () => {
    const { result } = renderHook(() => useWorkspace());
    let a = "";
    act(() => {
      a = result.current.addNode("steg", "maal")!;
    });
    const before = result.current.ws;
    act(() => {
      result.current.removeNodes([a]);
      result.current.removeEdges([result.current.flow.edges[0]!.id]);
    });
    expect(result.current.flow.nodes).toHaveLength(1);
    act(() => result.current.undo());
    expect(result.current.ws).toEqual(before);
  });

  it("flytting lagres uten å gjøre eksempelet til egne data", () => {
    const { result } = renderHook(() => useWorkspace());
    act(() => result.current.loadExample());
    act(() => result.current.moveNodes({ maal: { x: 40, y: 50 } }));
    expect(result.current.module.eksempel).toBe(true);
    expect(result.current.module.nodes.find((n) => n.id === "maal")).toMatchObject({ x: 40, y: 50 });
  });

  it("ref settes bare på bokser som kan peke, og ryddes ved typebytte", () => {
    const { result } = renderHook(() => useWorkspace());
    act(() => result.current.loadExample());
    act(() => result.current.updateNode("s1", { ref: "eks-oppfolging" }));
    expect(result.current.module.nodes.find((n) => n.id === "s1")?.ref).toBeUndefined();
    act(() => result.current.updateNode("sys1", { ref: "eks-oppfolging" }));
    expect(result.current.module.nodes.find((n) => n.id === "sys1")?.ref).toBe("eks-oppfolging");
    act(() => result.current.updateNode("sys1", { type: "steg" }));
    expect(result.current.module.nodes.find((n) => n.id === "sys1")?.ref).toBeUndefined();
  });

  it("moduler: ny, bytt, flytt, fjern aktiv og angre", () => {
    const { result } = renderHook(() => useWorkspace());
    act(() => result.current.setName("Første"));
    let id: string | null = "";
    act(() => {
      id = result.current.addModule("Andre");
    });
    expect(result.current.ws.moduler).toHaveLength(2);
    expect(result.current.ws.aktiv).toBe(id);
    let stay: string | null = "";
    act(() => {
      stay = result.current.addModule("Tredje", { stay: true });
    });
    expect(result.current.ws.moduler).toHaveLength(3);
    expect(result.current.ws.aktiv).toBe(id);
    act(() => result.current.removeModule(stay!));
    expect(result.current.module.x).toBe(560);
    act(() => result.current.switchModule("m1"));
    expect(result.current.module.navn).toBe("Første");
    act(() => result.current.moveModules({ m1: { x: 5, y: 6 } }));
    expect(result.current.ws.moduler[0]).toMatchObject({ x: 5, y: 6 });
    act(() => result.current.removeModule("m1"));
    expect(result.current.ws.moduler).toHaveLength(1);
    expect(result.current.ws.aktiv).toBe(id);
    act(() => result.current.undo());
    expect(result.current.ws.moduler).toHaveLength(2);
    expect(result.current.ws.aktiv).toBe("m1");
    act(() => result.current.removeModule("m1"));
    act(() => result.current.removeModule(id!));
    expect(result.current.ws).toEqual(seedWorkspace());
  });

  it("import av én modul legges til med ny id ved kollisjon; import av nettsted erstatter; begge kan angres", () => {
    const { result } = renderHook(() => useWorkspace());
    act(() => result.current.setName("Min"));
    const m = { ...exampleWorkspace().moduler[1]!, id: "m1" };
    act(() => {
      result.current.insertModule(m);
    });
    expect(result.current.ws.moduler).toHaveLength(2);
    expect(result.current.ws.moduler[1]?.id).not.toBe("m1");
    expect(result.current.ws.aktiv).toBe(result.current.ws.moduler[1]?.id);
    expect(result.current.module.eksempel).toBe(false);
    act(() => result.current.undo());
    expect(result.current.ws.moduler).toHaveLength(1);
    act(() => result.current.replace(exampleWorkspace()));
    expect(result.current.ws.moduler).toHaveLength(2);
    act(() => result.current.undo());
    expect(result.current.module.navn).toBe("Min");
  });

  it("tøm av en allerede tom modul rører ikke angre-kopien", () => {
    const { result } = renderHook(() => useWorkspace());
    act(() => result.current.updateNode("maal", { tittel: "Mål" }));
    act(() => result.current.removeNodes(["maal"]));
    act(() => result.current.reset());
    act(() => result.current.undo());
    expect(result.current.flow.nodes[0]?.tittel).toBe("Mål");
  });

  it("eksemplene kan velges ved id", () => {
    const { result } = renderHook(() => useWorkspace());
    act(() => result.current.loadExample("crm"));
    expect(result.current.ws.moduler).toHaveLength(5);
    act(() => result.current.loadExample("tilbud"));
    expect(result.current.ws.moduler).toHaveLength(2);
  });

  it("tøm modulen beholder plassen; er alt eksempel, tømmes hele nettstedet", () => {
    const { result } = renderHook(() => useWorkspace());
    act(() => result.current.setName("Min"));
    act(() => result.current.moveModules({ m1: { x: 9, y: 9 } }));
    act(() => result.current.reset());
    expect(result.current.module).toMatchObject({ navn: "", x: 9, y: 9 });
    expect(result.current.selectedId).toBe("maal");
    act(() => result.current.undo());
    expect(result.current.module.navn).toBe("Min");
    act(() => result.current.loadExample());
    act(() => result.current.reset());
    expect(result.current.ws).toEqual(seedWorkspace());
  });
});
