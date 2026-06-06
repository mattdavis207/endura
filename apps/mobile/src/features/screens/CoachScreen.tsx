import { Box } from "@/components/ui/box";
import { Card } from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";

import { CoachInput, ScreenShell } from "./ui";

const coachMessages = [
  { side: "right", text: "Should I keep tomorrow's bike intensity?" },
  { side: "left", text: "Last week's fatigue is trending high." },
  { side: "right", text: "Move threshold work to Thursday." },
  { side: "left", text: "Keep the long run easy and cap HR." },
  { side: "right", text: "Build next week around swim volume." },
];

export function CoachScreen() {
  return (
    <ScreenShell
      title="AI Coach"
      subtitle="Conversation-first training adjustments."
    >
      <Card className="min-h-[560px] justify-between rounded-lg border border-slate-200 bg-slate-50 p-4">
        <VStack className="gap-5">
          {coachMessages.map((message, index) => (
            <Box
              key={`${message.text}-${index}`}
              className={`max-w-[78%] rounded-lg px-4 py-3 ${
                message.side === "right"
                  ? "self-end bg-blue-500"
                  : "self-start bg-slate-900"
              }`}
            >
              <Text className="text-base font-semibold text-white">
                {message.text}
              </Text>
            </Box>
          ))}
        </VStack>

        <CoachInput placeholder="Message AI coach" />
      </Card>
    </ScreenShell>
  );
}
