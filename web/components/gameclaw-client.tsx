"use client";

import { useEffect, useRef, useState } from "react";
import { DEFAULT_CONFIG } from "../lib/gameclaw/defaults";
import { GatewayClient } from "../lib/gameclaw/gateway-client";
import type { ChatEventPayload } from "../lib/gameclaw/types";
import { RaceHud, type RaceKey } from "./war3/race-hud";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";

type ScreenState = "landing" | "race-select" | "race-hud";

export function ClawCraftClient() {
  const gatewayRef = useRef<GatewayClient | null>(null);
  const activeRunIdRef = useRef<string | null>(null);

  const [screen, setScreen] = useState<ScreenState>("landing");
  const [selectedRace, setSelectedRace] = useState<RaceKey>("hum");

  useEffect(() => {
    const gateway = new GatewayClient({
      url: DEFAULT_CONFIG.gatewayUrl,
      token: DEFAULT_CONFIG.token,
      password: DEFAULT_CONFIG.password
    });

    gateway.onEvent((name, payload) => {
      handleGatewayEvent(name, payload);
    });

    gatewayRef.current = gateway;

    return () => {
      gatewayRef.current = null;
    };
  }, []);

  const extractAssistantText = (message: any): string | null => {
    if (!message || typeof message !== "object") return null;
    if (typeof message.text === "string") return message.text;
    if (Array.isArray(message.content)) {
      const part = message.content.find((item: any) => item?.type === "text" && typeof item.text === "string");
      if (part?.text) return part.text as string;
    }
    return null;
  };

  const handleGatewayEvent = (name: string, payload: unknown) => {
    if (name !== "chat") return;

    const chatPayload = payload as ChatEventPayload;
    const runId = typeof chatPayload.runId === "string" ? chatPayload.runId : null;
    const state = typeof chatPayload.state === "string" ? chatPayload.state : "";
    const text = extractAssistantText(chatPayload.message ?? null);
    if (!text) return;

    if (state === "delta") {
      if (runId && activeRunIdRef.current !== runId) {
        activeRunIdRef.current = runId;
      }
      return;
    }

    if (state === "final") {
      activeRunIdRef.current = null;
    }
  };

  const connectGateway = () => {
    gatewayRef.current?.setConnectionOptions({
      url: DEFAULT_CONFIG.gatewayUrl,
      token: DEFAULT_CONFIG.token,
      password: DEFAULT_CONFIG.password
    });
    gatewayRef.current?.connect();
  };

  return (
    <main className={`relative isolate min-h-screen overflow-hidden ${screen === "race-hud" ? "bg-black" : ""}`}>

      {screen !== "race-hud" ? (
        <div className="relative z-10 flex min-h-screen items-center justify-center px-4 pb-3 pt-8">
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute left-1/2 top-1/2 h-[800px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(255,171,1,0.35)_0%,rgba(255,171,1,0.18)_20%,rgba(82,214,252,0.16)_50%,transparent_75%)] blur-[100px]" />
          </div>

          {screen === "landing" ? (
            <Card className="relative z-10 h-[720px] w-full max-w-xl">
              <CardHeader>
                <span className="text-center text-xs uppercase tracking-[0.18em] text-[#89a6c8]">ClawCraft</span>
                <CardTitle className="text-center text-2xl font-bold md:text-4xl">ClawCraft Command Table</CardTitle>
                <CardDescription className="mt-4 text-center text-white/90">
                  Command your OpenClaw session from a Warcraft-inspired interface. Enter through the gateway, then choose your faction.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col items-center justify-center gap-6 pt-6 text-white">
                <div className="flex size-48 items-center justify-center rounded-full border border-[#c8a96b]/50 bg-[radial-gradient(circle,#27486d_0%,#162638_55%,#0c1520_100%)] shadow-[0_0_80px_rgba(95,153,220,0.18)] md:size-64">
                  <div className="fantasy text-center">
                    <div className="text-5xl font-bold text-[#f4d38b] md:text-7xl">GC</div>
                    <div className="mt-3 text-sm uppercase tracking-[0.35em] text-[#89a6c8]">Claw Nexus</div>
                  </div>
                </div>
                <p className="max-w-md text-center text-sm leading-7 text-white/80">
                  This entry card is intentionally tall because the original `warcraftcn-ui` card texture is designed for portrait showcase surfaces, not compact HUD panels.
                </p>
              </CardContent>
              <div className="flex flex-col items-center justify-center gap-4 px-4 pb-8">
                <Button variant="default" className="min-w-[220px] px-10 text-xl" onClick={() => setScreen("race-select")}>
                  Connect
                </Button>
              </div>
            </Card>
          ) : (
            <Card className="relative z-10 h-[720px] w-full max-w-xl">
              <CardHeader>
                <span className="text-center text-xs uppercase tracking-[0.18em] text-[#89a6c8]">Faction Selection</span>
                <CardTitle className="text-center text-2xl font-bold md:text-4xl">Choose Your Race</CardTitle>
                <CardDescription className="mt-4 text-center text-white/90">
                  Select a Warcraft race to enter the corresponding HUD scene.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-1 items-center justify-center pt-10">
                <div className="grid justify-items-center gap-4">
                  <Button
                    variant="default"
                    className="min-w-[240px] px-8 py-3 text-lg"
                    onClick={() => {
                      setSelectedRace("hum");
                      connectGateway();
                      setScreen("race-hud");
                    }}
                  >
                    Human
                  </Button>
                  <Button
                    variant="default"
                    className="min-w-[240px] px-8 py-3 text-lg"
                    onClick={() => {
                      setSelectedRace("orc");
                      connectGateway();
                      setScreen("race-hud");
                    }}
                  >
                    Orc
                  </Button>
                  <Button
                    variant="default"
                    className="min-w-[240px] px-8 py-3 text-lg"
                    onClick={() => {
                      setSelectedRace("nel");
                      connectGateway();
                      setScreen("race-hud");
                    }}
                  >
                    Night Elf
                  </Button>
                  <Button
                    variant="default"
                    className="min-w-[240px] px-8 py-3 text-lg"
                    onClick={() => {
                      setSelectedRace("und");
                      connectGateway();
                      setScreen("race-hud");
                    }}
                  >
                    Undead
                  </Button>
                  <Button variant="default" className="min-w-[240px] px-8 py-3 text-lg" onClick={() => setScreen("landing")}>
                    Return
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      ) : (
        <RaceHud race={selectedRace} />
      )}
    </main>
  );
}
