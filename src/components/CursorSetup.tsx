import { useEffect } from "react";

/**
 * Ensures the custom cursor is a browser-supported size by rendering it to a small canvas
 * and applying a data URL via CSS variables.
 */
export default function CursorSetup() {
  useEffect(() => {
    const img = new Image();
    img.src = "/cursors/bao-cursor.png";

    img.onload = () => {
      const size = 64; // keep <= 128px to satisfy browser cursor limits
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.clearRect(0, 0, size, size);
      ctx.drawImage(img, 0, 0, size, size);

      const dataUrl = canvas.toDataURL("image/png");
      // Hotspot kept at 16,16 for a "pointer-like" feel.
      document.documentElement.style.setProperty(
        "--app-cursor",
        `url('${dataUrl}') 16 16`
      );
    };

    // If it fails to load, CSS falls back to the static cursor.
  }, []);

  return null;
}
