"use client";

import { useEffect, useState } from "react";

type CursorState = "default" | "default-active" | "pointer" | "pointer-active";

export function RaceCursor({
  assetBase,
  scopeSelector = "[data-war3-cursor-scope]"
}: {
  assetBase: string;
  scopeSelector?: string;
}) {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [state, setState] = useState<CursorState>("default-active");

  useEffect(() => {
    const scope = document.querySelector<HTMLElement>(scopeSelector);
    if (!scope) return;

    const getInteractiveState = (target: EventTarget | null): CursorState => {
      if (!(target instanceof HTMLElement)) return "default-active";
      return target.closest("button,input,textarea,select,a,label,[role='button']") ? "pointer" : "default-active";
    };

    const handleMove = (event: MouseEvent) => {
      setPosition({ x: event.clientX, y: event.clientY });
      setState(getInteractiveState(event.target));
    };

    const handleDown = (event: MouseEvent) => {
      setState(getInteractiveState(event.target) === "pointer" ? "pointer-active" : "default-active");
    };

    const handleUp = (event: MouseEvent) => {
      setState(getInteractiveState(event.target));
    };

    const handleLeave = () => {
      setState("default-active");
    };

    scope.classList.add("war3-cursored");
    scope.addEventListener("mousemove", handleMove);
    scope.addEventListener("mousedown", handleDown);
    scope.addEventListener("mouseup", handleUp);
    scope.addEventListener("mouseleave", handleLeave);

    return () => {
      scope.classList.remove("war3-cursored");
      scope.removeEventListener("mousemove", handleMove);
      scope.removeEventListener("mousedown", handleDown);
      scope.removeEventListener("mouseup", handleUp);
      scope.removeEventListener("mouseleave", handleLeave);
    };
  }, [scopeSelector]);

  return (
    <div
      className="pointer-events-none fixed left-0 top-0 z-[120] h-8 w-8"
      style={{ transform: `translate(${position.x}px, ${position.y}px)` }}
    >
      <div
        className={`war3-race-cursor war3-race-cursor--${state}`}
        style={{ backgroundImage: `url('${assetBase}/cursor.png')` }}
      />
    </div>
  );
}
