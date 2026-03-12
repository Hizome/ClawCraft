"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { RaceCursor } from "./race-cursor";

export type RaceKey = "hum" | "orc" | "nel" | "und";

const RACE_LABELS: Record<RaceKey, string> = {
  hum: "Human",
  orc: "Orc",
  nel: "Night Elf",
  und: "Undead"
};

function RaceButton({
  assetBase,
  children,
  className = "",
  disabled = false
}: {
  assetBase: string;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}) {
  return (
    <button
      className={["war3-race-button", className].join(" ")}
      disabled={disabled}
      style={
        {
          "--war3-btn-default": `url('${assetBase}/btn_default.png')`,
          "--war3-btn-hover": `url('${assetBase}/btn_hover_bg.png')`,
          "--war3-btn-pressed": `url('${assetBase}/btn_pressed.png')`,
          "--war3-btn-disabled": `url('${assetBase}/btn_disabled.png')`
        } as React.CSSProperties
      }
      type="button"
    >
      <span className="war3-race-button__caption">{children}</span>
    </button>
  );
}

export function RaceHud({ race }: { race: RaceKey }) {
  const [timeProgress, setTimeProgress] = useState(0.2);
  const [headerHeight, setHeaderHeight] = useState(94);
  const headerRef = useRef<HTMLElement | null>(null);
  const assetBase = `/war3/${race}`;

  useEffect(() => {
    const timer = window.setInterval(() => {
      setTimeProgress((prev) => (prev + 1 / 720) % 1);
    }, 1000 / 60);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!headerRef.current) return;

    const updateHeight = () => {
      if (!headerRef.current) return;
      setHeaderHeight(headerRef.current.getBoundingClientRect().height || 94);
    };

    updateHeight();
    const observer = new ResizeObserver(updateHeight);
    observer.observe(headerRef.current);

    return () => observer.disconnect();
  }, []);

  const timeDots = useMemo(() => Math.trunc(timeProgress * 8) + 1, [timeProgress]);
  const isDay = timeProgress < 0.5;
  const timeDiscSize = headerHeight * 0.6;
  const timeDotSize = headerHeight * 0.15;
  const timeDotRadius = headerHeight * 0.4;
  const hudWidth = "min(100vw, 1600px)";

  return (
    <div className="absolute inset-0 z-30 bg-black" data-war3-cursor-scope>
      <RaceCursor assetBase={assetBase} />

      <header
        ref={headerRef}
        className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2"
        style={{
          width: hudWidth,
          height: "calc(min(100vw, 1600px) * 94 / 1600)"
        }}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className="relative rounded-full bg-cover"
            style={{
              width: `${timeDiscSize}px`,
              height: `${timeDiscSize}px`,
              backgroundImage: "url('/war3/any/hud_time_indicator.png')",
              backgroundPositionX: `${timeProgress * 200}%`,
              backgroundPositionY: "center",
              backgroundRepeat: "repeat-x"
            }}
          >
            {Array.from({ length: timeDots }).map((_, index) => (
              <div
                className={`absolute left-1/2 top-1/2 rounded-full ${isDay ? "bg-yellow-300" : "bg-cyan-300"}`}
                key={index}
                style={{
                  width: `${timeDotSize}px`,
                  height: `${timeDotSize}px`,
                  transform: `translate(-50%, -50%) rotate(${index * 45 - 90}deg) translate(${timeDotRadius}px) rotate(${index * -45 + 90}deg)`
                }}
              />
            ))}
          </div>
        </div>

        <img alt="" className="absolute inset-0 h-full w-full" src={`${assetBase}/hud_header.png`} />

        <div className="absolute inset-x-0 top-0 flex h-[50%]">
          <div className="pointer-events-auto flex h-full w-1/2 px-[0.5%] pb-[0.5%] pr-[7.5%] pt-[0.3%]">
            <RaceButton assetBase={assetBase} className="h-full w-[24%]">
              Quests
            </RaceButton>
            <RaceButton assetBase={assetBase} className="ml-[1.2%] h-full w-[24%]">
              Menu
            </RaceButton>
            <RaceButton assetBase={assetBase} className="ml-[1.2%] h-full w-[24%]" disabled>
              Allies
            </RaceButton>
            <RaceButton assetBase={assetBase} className="ml-[1.2%] h-full w-[24%]">
              Log
            </RaceButton>
          </div>

          <div className="flex h-full w-1/2 justify-between px-[0.3%] pb-[0.5%] pl-[7.5%] pt-[0.3%]">
            <div className="flex h-full w-[23%] items-center justify-center">
              <img alt="" className="h-full w-auto" src="/war3/any/resource_icons/gold.png" />
            </div>
            <div className="flex h-full w-[23%] items-center justify-center">
              <img alt="" className="h-full w-auto" src="/war3/any/resource_icons/lumber.png" />
            </div>
            <div className="flex h-full w-[23%] items-center justify-center">
              <img alt="" className="h-full w-auto" src="/war3/any/resource_icons/supply.png" />
            </div>
            <div className="flex h-full w-[23%] items-center justify-center text-[#00f000]">
              <span>{RACE_LABELS[race]}</span>
            </div>
          </div>
        </div>
      </header>

      <footer
        className="pointer-events-none absolute bottom-0 left-1/2 -translate-x-1/2"
        style={{
          width: hudWidth,
          height: "calc(min(100vw, 1600px) * 327 / 1600)",
          background: "linear-gradient(#0000 25%, black 25%)"
        }}
      >
        <img alt="" className="absolute inset-0 h-full w-full" src={`${assetBase}/hud_footer.png`} />

        <div className="absolute left-[59%] top-0 h-full">
          <img alt="" className="h-full w-auto" src={`${assetBase}/hud_inv_mock.png`} />
        </div>
      </footer>
    </div>
  );
}
