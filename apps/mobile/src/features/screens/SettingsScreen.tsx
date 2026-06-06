import { Ionicons } from "@expo/vector-icons";

import { Box } from "@/components/ui/box";
import { Card } from "@/components/ui/card";
import { HStack } from "@/components/ui/hstack";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";

import { PlanStrip, ScreenShell } from "./ui";

const settingsRows = [
  "Race goal",
  "Training targets",
  "Strava connection",
  "Workout preferences",
  "Notifications",
  "Units and zones",
  "AI coach settings",
  "Account",
];

export function SettingsScreen() {
  return (
    <ScreenShell
      title="Settings"
      subtitle="Race goals, training preferences, and connected services."
    >
      <Card className="rounded-lg border border-slate-200 bg-slate-50 p-4">
        <HStack className="gap-4">
          <Box className="flex-1">
            <Text className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">
              Workouts per week totals
            </Text>
            <VStack className="gap-3">
              <Box className="h-5 w-full rounded-full bg-slate-900" />
              <Box className="h-5 w-11/12 rounded-full bg-slate-800" />
              <Box className="h-5 w-3/4 rounded-full bg-slate-700" />
            </VStack>
          </Box>
          <Box className="h-28 w-28 items-center justify-center rounded-md bg-slate-900">
            <Box className="h-20 w-20 rounded-full bg-slate-200" />
          </Box>
        </HStack>
      </Card>

      <Card className="rounded-lg border border-slate-200 bg-slate-50 p-4">
        <Text className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">
          Profile
        </Text>
        <HStack className="items-center gap-3">
          <Box className="h-12 w-12 items-center justify-center rounded-full bg-blue-500">
            <Ionicons name="person" color="#ffffff" size={22} />
          </Box>
          <VStack>
            <Text className="text-lg font-bold text-slate-950">Matthew</Text>
            <Text className="text-sm font-medium text-slate-500">
              Ironman build phase
            </Text>
          </VStack>
        </HStack>
      </Card>

      <VStack className="gap-2">
        {settingsRows.map((row) => (
          <PlanStrip key={row} label={row} />
        ))}
      </VStack>
    </ScreenShell>
  );
}
