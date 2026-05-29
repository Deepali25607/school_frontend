import { createPortal } from "react-dom";

// Renders children into document.body so overlays escape any ancestor that
// establishes a containing block for fixed-position elements (our `.card` /
// `.glass-card` use backdrop-filter, which does exactly that). Without this a
// `position: fixed` modal nested inside a card is sized/positioned relative to
// the card instead of the viewport.
export default function Portal({ children }) {
  if (typeof document === "undefined") return null;
  return createPortal(children, document.body);
}
