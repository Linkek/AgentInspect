import { listen } from "@tauri-apps/api/event";
import { useEffect, useState } from "react";
import type { ScanProgress } from "../types/scan";

export function useScanProgress(listening: boolean) {
  const [progress, setProgress] = useState<ScanProgress | null>(null);

  useEffect(() => {
    if (!listening) {
      setProgress(null);
      return;
    }
    let unlisten: (() => void) | undefined;
    void listen<ScanProgress>("scan-progress", (event) => {
      setProgress(event.payload);
    }).then((fn) => {
      unlisten = fn;
    });
    return () => {
      unlisten?.();
    };
  }, [listening]);

  return progress;
}

export function progressPercent(p: ScanProgress | null): number {
  if (!p) return 0;
  if (p.phase === "walking" && p.total === 0) {
    return Math.min(40, 5 + (p.current % 2000) / 50);
  }
  if (p.total === 0) return p.phase === "analyzing" ? 95 : 50;
  const base = p.phase === "reading" ? 40 : p.phase === "analyzing" ? 90 : 10;
  const span = p.phase === "reading" ? 50 : 10;
  return Math.min(99, base + (p.current / p.total) * span);
}