"use client";

import { useEffect, useRef } from "react";
import { War3Scene } from "../lib/gameclaw/war3-scene";

export function WorldViewport({ onReady }: { onReady: (scene: War3Scene) => void }) {
  const hostRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!hostRef.current) return;

    const scene = new War3Scene();
    scene.mount(hostRef.current);
    onReady(scene);

    return () => {
      scene.dispose();
    };
  }, [onReady]);

  return (
    <div
      ref={hostRef}
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden bg-[radial-gradient(circle_at_50%_0%,rgba(185,220,255,0.25),transparent_30%),linear-gradient(180deg,#86b7e4_0%,#29415f_30%,#102033_100%)]"
    />
  );
}
