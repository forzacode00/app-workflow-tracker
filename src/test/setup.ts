import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

/* React Flow måler lerretet med ResizeObserver og DOMMatrixReadOnly, som jsdom mangler. */
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
if (typeof window !== "undefined") {
  window.ResizeObserver = window.ResizeObserver ?? (ResizeObserverStub as unknown as typeof ResizeObserver);
  if (!("DOMMatrixReadOnly" in window)) {
    class DOMMatrixReadOnlyStub {
      m22 = 1;
      constructor(_transform?: string) {}
    }
    Object.defineProperty(window, "DOMMatrixReadOnly", { value: DOMMatrixReadOnlyStub, writable: true });
  }
  Object.defineProperties(HTMLElement.prototype, {
    offsetHeight: { get: () => 600, configurable: true },
    offsetWidth: { get: () => 800, configurable: true },
  });
  const svgProto = SVGElement.prototype as unknown as { getBBox?: unknown };
  if (!svgProto.getBBox) {
    Object.defineProperty(SVGElement.prototype, "getBBox", { value: () => ({ x: 0, y: 0, width: 0, height: 0 }), configurable: true });
  }
  vi.stubGlobal("scrollTo", () => {});
}

afterEach(() => {
  cleanup();
  localStorage.clear();
});
