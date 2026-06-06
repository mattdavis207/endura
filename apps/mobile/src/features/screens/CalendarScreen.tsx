import { Box } from "@/components/ui/box";
import { Card } from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";

import { PlanStrip, ScreenShell, WeekGrid, WorkoutCard } from "./ui";

const weeklyBlocks = ["Swim form", "Bike tempo", "Run aerobic", "Recovery"];
const monthlyBlocks = ["Base volume", "Bike focus", "Race simulation"];

export function CalendarScreen() {
  return (
    <ScreenShell
      title="Calendar"
      subtitle="Daily workout card plus weekly and monthly training blocks."
    >
      <Card className="rounded-lg border border-slate-200 bg-slate-50 p-4">
        <Text className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">
          Expanded 7 day view
        </Text>
        <WeekGrid />
      </Card>

      <WorkoutCard sport="Today" detail="45 min steady swim + drill set" />

      <Box className="items-center">
        <Text className="text-5xl font-light text-slate-400">+</Text>
      </Box>

      <Card className="rounded-lg border border-slate-200 bg-slate-50 p-4">
        <Text className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">
          Weekly structure
        </Text>
        <VStack className="gap-2">
          {weeklyBlocks.map((block) => (
            <PlanStrip key={block} label={block} />
          ))}
        </VStack>
      </Card>

      <Card className="rounded-lg border border-slate-200 bg-slate-50 p-4">
        <Text className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">
          Monthly focus
        </Text>
        <VStack className="gap-3">
          {monthlyBlocks.map((block, index) => (
            <Card
              key={block}
              variant="outline"
              className="min-h-28 justify-center rounded-md border-0 bg-slate-900 p-4"
            >
              <Text className="text-lg font-semibold text-white">{block}</Text>
              {index === monthlyBlocks.length - 1 ? (
                <Text className="mt-4 text-right text-xs font-bold text-blue-300">
                  Race Day
                </Text>
              ) : null}
            </Card>
          ))}
        </VStack>
      </Card>
    </ScreenShell>
  );
}
