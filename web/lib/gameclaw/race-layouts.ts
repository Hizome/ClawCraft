import humLayout from "../../data/race-layouts/hum.json";
import nelLayout from "../../data/race-layouts/nel.json";
import orcLayout from "../../data/race-layouts/orc.json";
import undLayout from "../../data/race-layouts/und.json";

export type RaceKey = "hum" | "orc" | "nel" | "und";

export type BuildingTransform = {
  x: number;
  y: number;
  z: number;
  rotX: number;
  rotY: number;
  rotZ: number;
  scale: number;
};

export type BuildingLayout = {
  id: string;
  label: string;
  modelPath: string;
  assetDirectory: string;
  transform: BuildingTransform;
};

export type RaceLayout = {
  race: RaceKey;
  buildings: BuildingLayout[];
};

const raceLayouts: Record<RaceKey, RaceLayout> = {
  hum: humLayout as RaceLayout,
  orc: orcLayout as RaceLayout,
  nel: nelLayout as RaceLayout,
  und: undLayout as RaceLayout
};

export function getRaceLayout(race: RaceKey): RaceLayout {
  return raceLayouts[race];
}
