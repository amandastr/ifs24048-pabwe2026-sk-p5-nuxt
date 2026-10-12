import "@testing-library/jest-dom";

if (typeof document !== "undefined") {
  if (!document.elementFromPoint) {
    document.elementFromPoint = () => null;
  }
  if (!Range.prototype.getClientRects) {
    Range.prototype.getClientRects = () => [] as unknown as DOMRectList;
  }
}

if (typeof (globalThis as any).DELCOM_BASEURL === "undefined") {
  (globalThis as any).DELCOM_BASEURL = "https://open-api.delcom.org/api/v1";
}

if (typeof window !== "undefined" && !window.matchMedia) {
  (window as any).matchMedia = (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  });
}
