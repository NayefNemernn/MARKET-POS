import { useEffect, useRef } from "react";
import toast from "react-hot-toast";

/**
 * Invisible component that listens for hardware barcode scanner input.
 * Scanners fire keydown events rapidly then emit Enter.
 * If the scan target matches a product it calls onScan(product).
 */
export default function BarcodeScanner({ barcodeMap, onScan }) {
  const bufferRef   = useRef("");
  const lastTimeRef = useRef(0);

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignore when user is typing in an input/textarea
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;

      const now = Date.now();

      // Reset buffer if gap > 100 ms (human keystroke, not scanner burst)
      if (now - lastTimeRef.current > 100) bufferRef.current = "";
      lastTimeRef.current = now;

      if (e.key === "Enter") {
        const code = bufferRef.current.trim();
        bufferRef.current = "";
        if (!code) return;

        const product = barcodeMap[code];
        if (product) {
          onScan(product);
        } else {
          toast.error(`Barcode not found: ${code}`);
        }
        return;
      }

      // Accumulate alphanumeric characters
      if (/^[0-9a-zA-Z\-_]$/.test(e.key)) {
        bufferRef.current += e.key;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [barcodeMap, onScan]);

  return null; // no visual output
}