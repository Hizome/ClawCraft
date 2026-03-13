"use client";

import { ChangeEvent, useEffect, useRef, useState } from "react";
import { getRaceLayout, type RaceKey } from "../../lib/gameclaw/race-layouts";

type ModelViewerGlobal = {
  viewer: {
    ModelViewer: new (canvas: HTMLCanvasElement, options?: Record<string, unknown>) => any;
    handlers: {
      mdx: unknown;
      blp: unknown;
      dds: unknown;
      tga: unknown;
    };
  };
};

declare global {
  interface Window {
    ModelViewer?: ModelViewerGlobal;
  }
}

function loadModelViewerScript(): Promise<ModelViewerGlobal> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Model viewer can only load in the browser."));
  }

  if (window.ModelViewer) {
    return Promise.resolve(window.ModelViewer);
  }

  return new Promise<ModelViewerGlobal>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-mdx-viewer="true"]');

    if (existing) {
      existing.addEventListener(
        "load",
        () => {
          if (window.ModelViewer) {
            resolve(window.ModelViewer);
            return;
          }
          reject(new Error("mdx-m3-viewer did not expose a browser global."));
        },
        { once: true }
      );
      existing.addEventListener("error", () => reject(new Error("Failed to load mdx-m3-viewer.")), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = "/vendor/mdx-m3-viewer/viewer.min.js";
    script.async = true;
    script.dataset.mdxViewer = "true";
    script.onload = () => {
      if (window.ModelViewer) {
        resolve(window.ModelViewer);
        return;
      }
      reject(new Error("mdx-m3-viewer did not expose a browser global."));
    };
    script.onerror = () => reject(new Error("Failed to load mdx-m3-viewer."));
    document.head.appendChild(script);
  });
}

type ModelControls = {
  x: number;
  y: number;
  z: number;
  rotX: number;
  rotY: number;
  rotZ: number;
  scale: number;
  alpha: number;
  red: number;
  green: number;
  blue: number;
  sequence: number;
  loopMode: number;
  teamColor: number;
  timeScale: number;
  cameraX: number;
  cameraY: number;
  cameraZ: number;
  cameraRotX: number;
  cameraRotY: number;
  cameraRotZ: number;
  fov: number;
};

const INITIAL_CONTROLS: ModelControls = {
  x: 0,
  y: -140,
  z: 0,
  rotX: 0,
  rotY: 0,
  rotZ: 0,
  scale: 2.1,
  alpha: 1,
  red: 1,
  green: 1,
  blue: 1,
  sequence: 0,
  loopMode: 2,
  teamColor: 0,
  timeScale: 1,
  cameraX: 0,
  cameraY: 0,
  cameraZ: 900,
  cameraRotX: 0,
  cameraRotY: 0,
  cameraRotZ: 0,
  fov: 45
};

function degreesToQuaternion(xDeg: number, yDeg: number, zDeg: number): [number, number, number, number] {
  const x = (xDeg * Math.PI) / 180;
  const y = (yDeg * Math.PI) / 180;
  const z = (zDeg * Math.PI) / 180;

  const cx = Math.cos(x / 2);
  const sx = Math.sin(x / 2);
  const cy = Math.cos(y / 2);
  const sy = Math.sin(y / 2);
  const cz = Math.cos(z / 2);
  const sz = Math.sin(z / 2);

  return [
    sx * cy * cz - cx * sy * sz,
    cx * sy * cz + sx * cy * sz,
    cx * cy * sz - sx * sy * cz,
    cx * cy * cz + sx * sy * sz
  ];
}

function ControlRow({
  label,
  min,
  max,
  step,
  value,
  onChange
}: {
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (nextValue: number) => void;
}) {
  const safeValue = Number.isFinite(value) ? value : min;

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextValue = Number(event.target.value);
    if (!Number.isFinite(nextValue)) {
      return;
    }
    onChange(nextValue);
  };

  return (
    <label className="grid grid-cols-[56px_1fr_58px] items-center gap-2 text-[11px] text-[#d8c796]">
      <span>{label}</span>
      <input max={max} min={min} onChange={handleChange} step={step} type="range" value={safeValue} />
      <input
        className="border border-[#7a6134] bg-black/45 px-1 py-0.5 text-right text-[11px] text-white outline-none"
        max={max}
        min={min}
        onChange={handleChange}
        step={step}
        type="number"
        value={safeValue}
      />
    </label>
  );
}

function SectionTitle({ children }: { children: string }) {
  return <div className="pt-2 text-[10px] uppercase tracking-[0.18em] text-[#aebed7]">{children}</div>;
}

export function MdxStage({ race }: { race: RaceKey }) {
  const raceLayout = getRaceLayout(race);
  const activeBuilding = raceLayout.buildings[0] ?? null;
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [controls, setControls] = useState<ModelControls>(() => ({
    ...INITIAL_CONTROLS,
    ...(activeBuilding?.transform ?? {})
  }));

  useEffect(() => {
    setControls({
      ...INITIAL_CONTROLS,
      ...(activeBuilding?.transform ?? {})
    });
  }, [activeBuilding]);

  const controlsRef = useRef<ModelControls>(controls);

  useEffect(() => {
    controlsRef.current = controls;
  }, [controls]);

  useEffect(() => {
    let disposed = false;
    let viewer: any = null;
    let frameId = 0;

    async function boot() {
      if (!canvasRef.current || !activeBuilding) {
        return;
      }

      try {
        const ModelViewer = await loadModelViewerScript();
        if (disposed) {
          return;
        }

        const resizeCanvas = () => {
          if (!canvasRef.current) {
            return null;
          }

          const bounds = canvasRef.current.getBoundingClientRect();
          const dpr = window.devicePixelRatio || 1;
          canvasRef.current.width = Math.max(1, Math.round(bounds.width * dpr));
          canvasRef.current.height = Math.max(1, Math.round(bounds.height * dpr));

          return {
            width: canvasRef.current.width,
            height: canvasRef.current.height
          };
        };

        viewer = new ModelViewer.viewer.ModelViewer(canvasRef.current, {
          alpha: true,
          antialias: true
        });

        viewer.startFrame = () => {
          const gl = viewer.gl;
          gl.depthMask(true);
          gl.clearColor(0, 0, 0, 0);
          gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        };

        viewer.on?.("error", (_target: unknown, error: unknown) => {
          const message =
            error instanceof Error
              ? error.message
              : typeof error === "string" && error.length > 0
                ? error
                : "Model asset load failed.";
          setLoadError(message);
        });

        viewer.addHandler(ModelViewer.viewer.handlers.mdx);
        viewer.addHandler(ModelViewer.viewer.handlers.blp);
        viewer.addHandler(ModelViewer.viewer.handlers.tga);
        viewer.addHandler(ModelViewer.viewer.handlers.dds);

        const scene = viewer.addScene();
        scene.alpha = true;
        const size = resizeCanvas();
        scene.viewport = [0, 0, size?.width ?? 1, size?.height ?? 1];

        const model = await viewer.load(activeBuilding.modelPath, (path: string) => {
          const normalizedPath = path.replace(/\\/g, "/");
          const resolvedPath = normalizedPath.startsWith("/")
            ? normalizedPath
            : `${activeBuilding.assetDirectory}/${normalizedPath}`;

          return encodeURI(resolvedPath);
        });

        if (!model || disposed) {
          return;
        }

        const instance = model.addInstance();
        instance.setScene(scene);

        const resize = () => {
          if (!canvasRef.current || !viewer) {
            return;
          }

          const nextSize = resizeCanvas();
          scene.viewport = [0, 0, nextSize?.width ?? 1, nextSize?.height ?? 1];
        };

        resize();
        window.addEventListener("resize", resize);

        const step = () => {
          if (disposed || !viewer) {
            return;
          }

          const currentCanvas = canvasRef.current;
          if (!currentCanvas) {
            return;
          }

          const nextControls = controlsRef.current;
          scene.camera.perspective(
            (nextControls.fov * Math.PI) / 180,
            currentCanvas.width / Math.max(1, currentCanvas.height),
            8,
            5000
          );
          scene.camera.setLocation([nextControls.cameraX, nextControls.cameraY, nextControls.cameraZ]);
          scene.camera.setRotation(
            degreesToQuaternion(nextControls.cameraRotX, nextControls.cameraRotY, nextControls.cameraRotZ)
          );

          instance.setLocation([nextControls.x, nextControls.y, nextControls.z]);
          instance.setRotation(degreesToQuaternion(nextControls.rotX, nextControls.rotY, nextControls.rotZ));
          instance.setUniformScale(nextControls.scale);
          instance.setSequence(nextControls.sequence);
          instance.setSequenceLoopMode(nextControls.loopMode);
          instance.setTeamColor(nextControls.teamColor);
          instance.setVertexColor([nextControls.red, nextControls.green, nextControls.blue, nextControls.alpha]);
          instance.timeScale = nextControls.timeScale;

          viewer.updateAndRender();
          frameId = window.requestAnimationFrame(step);
        };

        step();

        return () => {
          window.removeEventListener("resize", resize);
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        setLoadError(message);
      }
    }

    let cleanup: (() => void) | undefined;

    void boot().then((teardown) => {
      cleanup = teardown;
    });

    return () => {
      disposed = true;
      cleanup?.();
      if (frameId) {
        window.cancelAnimationFrame(frameId);
      }
      if (viewer?.clear) {
        viewer.clear();
      }
    };
  }, [activeBuilding]);

  return (
    <div className="absolute inset-0 z-10 overflow-hidden">
      <canvas ref={canvasRef} className="h-full w-full" />
      <div className="pointer-events-auto absolute left-4 top-4 z-20 max-h-[calc(100vh-32px)] w-[340px] overflow-y-auto border border-[#8f6d34] bg-black/72 p-3 shadow-[0_10px_30px_rgba(0,0,0,0.45)] backdrop-blur-sm">
        <div className="mb-2 text-xs uppercase tracking-[0.2em] text-[#f0d59a]">
          {activeBuilding?.label ?? "No Building"} Debug
        </div>
        <div className="space-y-2">
          <SectionTitle>Transform</SectionTitle>
          <ControlRow
            label="X"
            max={600}
            min={-600}
            onChange={(x) => setControls((prev) => ({ ...prev, x }))}
            step={1}
            value={controls.x}
          />
          <ControlRow
            label="Y"
            max={400}
            min={-400}
            onChange={(y) => setControls((prev) => ({ ...prev, y }))}
            step={1}
            value={controls.y}
          />
          <ControlRow
            label="Z"
            max={600}
            min={-600}
            onChange={(z) => setControls((prev) => ({ ...prev, z }))}
            step={1}
            value={controls.z}
          />
          <ControlRow
            label="Rot X"
            max={180}
            min={-180}
            onChange={(rotX) => setControls((prev) => ({ ...prev, rotX }))}
            step={1}
            value={controls.rotX}
          />
          <ControlRow
            label="Rot Y"
            max={180}
            min={-180}
            onChange={(rotY) => setControls((prev) => ({ ...prev, rotY }))}
            step={1}
            value={controls.rotY}
          />
          <ControlRow
            label="Rot Z"
            max={180}
            min={-180}
            onChange={(rotZ) => setControls((prev) => ({ ...prev, rotZ }))}
            step={1}
            value={controls.rotZ}
          />
          <ControlRow
            label="Scale"
            max={8}
            min={0.1}
            onChange={(scale) => setControls((prev) => ({ ...prev, scale }))}
            step={0.1}
            value={controls.scale}
          />
          <SectionTitle>Material</SectionTitle>
          <ControlRow
            label="Alpha"
            max={1}
            min={0}
            onChange={(alpha) => setControls((prev) => ({ ...prev, alpha }))}
            step={0.01}
            value={controls.alpha}
          />
          <ControlRow
            label="Red"
            max={2}
            min={0}
            onChange={(red) => setControls((prev) => ({ ...prev, red }))}
            step={0.01}
            value={controls.red}
          />
          <ControlRow
            label="Green"
            max={2}
            min={0}
            onChange={(green) => setControls((prev) => ({ ...prev, green }))}
            step={0.01}
            value={controls.green}
          />
          <ControlRow
            label="Blue"
            max={2}
            min={0}
            onChange={(blue) => setControls((prev) => ({ ...prev, blue }))}
            step={0.01}
            value={controls.blue}
          />
          <SectionTitle>Animation</SectionTitle>
          <ControlRow
            label="Seq"
            max={20}
            min={-1}
            onChange={(sequence) => setControls((prev) => ({ ...prev, sequence }))}
            step={1}
            value={controls.sequence}
          />
          <ControlRow
            label="Loop"
            max={2}
            min={0}
            onChange={(loopMode) => setControls((prev) => ({ ...prev, loopMode }))}
            step={1}
            value={controls.loopMode}
          />
          <ControlRow
            label="Time"
            max={4}
            min={0}
            onChange={(timeScale) => setControls((prev) => ({ ...prev, timeScale }))}
            step={0.05}
            value={controls.timeScale}
          />
          <ControlRow
            label="Team"
            max={24}
            min={0}
            onChange={(teamColor) => setControls((prev) => ({ ...prev, teamColor }))}
            step={1}
            value={controls.teamColor}
          />
          <SectionTitle>Camera</SectionTitle>
          <ControlRow
            label="Cam X"
            max={1200}
            min={-1200}
            onChange={(cameraX) => setControls((prev) => ({ ...prev, cameraX }))}
            step={1}
            value={controls.cameraX}
          />
          <ControlRow
            label="Cam Y"
            max={1200}
            min={-1200}
            onChange={(cameraY) => setControls((prev) => ({ ...prev, cameraY }))}
            step={1}
            value={controls.cameraY}
          />
          <ControlRow
            label="Cam Z"
            max={3000}
            min={50}
            onChange={(cameraZ) => setControls((prev) => ({ ...prev, cameraZ }))}
            step={1}
            value={controls.cameraZ}
          />
          <ControlRow
            label="Cam RX"
            max={180}
            min={-180}
            onChange={(cameraRotX) => setControls((prev) => ({ ...prev, cameraRotX }))}
            step={1}
            value={controls.cameraRotX}
          />
          <ControlRow
            label="Cam RY"
            max={180}
            min={-180}
            onChange={(cameraRotY) => setControls((prev) => ({ ...prev, cameraRotY }))}
            step={1}
            value={controls.cameraRotY}
          />
          <ControlRow
            label="Cam RZ"
            max={180}
            min={-180}
            onChange={(cameraRotZ) => setControls((prev) => ({ ...prev, cameraRotZ }))}
            step={1}
            value={controls.cameraRotZ}
          />
          <ControlRow
            label="FOV"
            max={120}
            min={10}
            onChange={(fov) => setControls((prev) => ({ ...prev, fov }))}
            step={1}
            value={controls.fov}
          />
        </div>
      </div>
      {!activeBuilding ? (
        <div className="absolute left-4 top-4 max-w-md bg-black/80 px-3 py-2 text-xs text-amber-200">
          No building layout configured for `{race}`.
        </div>
      ) : null}
      {loadError ? (
        <div className="absolute left-4 top-4 max-w-md bg-black/80 px-3 py-2 text-xs text-red-300">{loadError}</div>
      ) : null}
    </div>
  );
}
