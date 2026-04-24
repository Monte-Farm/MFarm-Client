/** Darken a hex color for dark mode backgrounds (preserves hue, reduces lightness). */
export const darkenHex = (hex: string): string => {
    const h = hex.replace("#", "");
    const r = parseInt(h.substring(0, 2), 16);
    const g = parseInt(h.substring(2, 4), 16);
    const b = parseInt(h.substring(4, 6), 16);
    const d = (c: number) => Math.max(20, Math.round(c * 0.22 + 15));
    return `#${d(r).toString(16).padStart(2, "0")}${d(g).toString(16).padStart(2, "0")}${d(b).toString(16).padStart(2, "0")}`;
};
