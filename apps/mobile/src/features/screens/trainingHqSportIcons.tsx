import {
  FontAwesome5,
  FontAwesome6,
  MaterialCommunityIcons,
  MaterialIcons,
} from "@expo/vector-icons";
import type { ComponentProps } from "react";

type FontAwesome5IconName = NonNullable<
  ComponentProps<typeof FontAwesome5>["name"]
>;
type FontAwesome6IconName = NonNullable<
  ComponentProps<typeof FontAwesome6>["name"]
>;
type MaterialCommunityIconName = NonNullable<
  ComponentProps<typeof MaterialCommunityIcons>["name"]
>;
type MaterialIconName = NonNullable<
  ComponentProps<typeof MaterialIcons>["name"]
>;

type SportIconDescriptor =
  | { family: "FontAwesome5"; name: FontAwesome5IconName }
  | { family: "FontAwesome6"; name: FontAwesome6IconName }
  | { family: "MaterialCommunityIcons"; name: MaterialCommunityIconName }
  | { family: "MaterialIcons"; name: MaterialIconName };

type SportIconProps = {
  sportType: string | null;
  size?: number;
  color?: string;
};

function normalizeSportType(sportType: string | null): string {
  return (sportType ?? "").toLowerCase().replace(/[\s_-]/g, "");
}

export function getSportIcon(sportType: string | null): SportIconDescriptor {
  const sport = normalizeSportType(sportType);

  if (sport.includes("swim")) {
    return { family: "FontAwesome6", name: "person-swimming" };
  }

  if (
    sport.includes("ride") ||
    sport.includes("bike") ||
    sport.includes("cycling") ||
    sport.includes("velomobile") ||
    sport.includes("handcycle")
  ) {
    return { family: "MaterialCommunityIcons", name: "bike" };
  }

  if (sport.includes("run")) {
    return { family: "FontAwesome6", name: "person-running" };
  }

  if (sport.includes("walk")) {
    return { family: "FontAwesome6", name: "person-walking" };
  }

  if (sport.includes("hike")) {
    return { family: "FontAwesome6", name: "person-hiking" };
  }

  if (
    sport.includes("strength") ||
    sport.includes("weight") ||
    sport.includes("crossfit") ||
    sport.includes("hiit") ||
    sport.includes("workout")
  ) {
    return { family: "FontAwesome6", name: "dumbbell" };
  }

  if (sport.includes("elliptical")) {
    return { family: "MaterialCommunityIcons", name: "run-fast" };
  }

  if (sport.includes("stair")) {
    return { family: "FontAwesome6", name: "stairs" };
  }

  if (sport.includes("yoga") || sport.includes("pilates")) {
    return { family: "MaterialCommunityIcons", name: "yoga" };
  }

  if (sport.includes("badminton")) {
    return { family: "MaterialCommunityIcons", name: "badminton" };
  }

  if (sport.includes("cricket")) {
    return { family: "MaterialIcons", name: "sports-cricket" };
  }

  if (sport.includes("pickleball") || sport.includes("racquetball")) {
    return { family: "MaterialCommunityIcons", name: "racquetball" };
  }

  if (sport.includes("soccer") || sport.includes("futbol")) {
    return { family: "FontAwesome5", name: "futbol" };
  }

  if (sport.includes("football")) {
    return { family: "FontAwesome6", name: "football" };
  }

  if (sport.includes("basketball")) {
    return { family: "FontAwesome6", name: "basketball" };
  }

  if (sport.includes("baseball")) {
    return { family: "FontAwesome6", name: "baseball" };
  }

  if (sport.includes("volleyball")) {
    return { family: "FontAwesome6", name: "volleyball" };
  }

  if (sport.includes("tabletennis") || sport.includes("pingpong")) {
    return { family: "FontAwesome6", name: "table-tennis-paddle-ball" };
  }

  if (sport.includes("tennis")) {
    return { family: "MaterialIcons", name: "sports-tennis" };
  }

  if (sport.includes("golf")) {
    return { family: "FontAwesome5", name: "golf-ball" };
  }

  if (sport.includes("climb")) {
    return { family: "MaterialIcons", name: "terrain" };
  }

  if (sport.includes("rowing") || sport.includes("row")) {
    return { family: "MaterialIcons", name: "rowing" };
  }

  if (sport.includes("kayak") || sport.includes("canoe")) {
    return { family: "MaterialIcons", name: "kayaking" };
  }

  if (
    sport.includes("surf") ||
    sport.includes("paddle") ||
    sport.includes("kitesurf") ||
    sport.includes("windsurf")
  ) {
    return { family: "MaterialIcons", name: "surfing" };
  }

  if (sport.includes("sail")) {
    return { family: "MaterialIcons", name: "sailing" };
  }

  if (sport.includes("ski")) {
    return { family: "FontAwesome6", name: "person-skiing" };
  }

  if (sport.includes("snowboard")) {
    return { family: "FontAwesome6", name: "person-snowboarding" };
  }

  if (sport.includes("skate")) {
    return { family: "FontAwesome6", name: "person-skating" };
  }

  if (sport.includes("snowshoe")) {
    return { family: "FontAwesome5", name: "snowflake" };
  }

  if (sport.includes("wheelchair")) {
    return { family: "FontAwesome5", name: "wheelchair" };
  }

  if (sport.includes("motor")) {
    return { family: "MaterialIcons", name: "sports-motorsports" };
  }

  return { family: "MaterialCommunityIcons", name: "run" };
}

export function SportIcon({
  sportType,
  size = 24,
  color = "#93c5fd",
}: SportIconProps) {
  const icon = getSportIcon(sportType);

  if (icon.family === "FontAwesome5") {
    return <FontAwesome5 name={icon.name} size={size} color={color} />;
  }

  if (icon.family === "FontAwesome6") {
    return <FontAwesome6 name={icon.name} size={size} color={color} />;
  }

  if (icon.family === "MaterialIcons") {
    return <MaterialIcons name={icon.name} size={size} color={color} />;
  }

  return <MaterialCommunityIcons name={icon.name} size={size} color={color} />;
}
