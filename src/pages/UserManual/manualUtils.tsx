import React from "react";

/**
 * Renders a string with **bold** markdown syntax as <strong> elements.
 * Used throughout the manual to highlight UI element names, page names, etc.
 */
export function renderBold(text: string): React.ReactNode {
  const parts = text.split(/\*\*(.+?)\*\*/g);
  if (parts.length === 1) return text;
  return parts.map((part, i) =>
    i % 2 === 1 ? <strong key={i}>{part}</strong> : part
  );
}
