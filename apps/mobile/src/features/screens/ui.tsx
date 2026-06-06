import { Ionicons } from "@expo/vector-icons";
import { PropsWithChildren } from "react";
import { ScrollView } from "react-native";

import { Box } from "@/components/ui/box";
import { Button, ButtonText } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Heading } from "@/components/ui/heading";
import { HStack } from "@/components/ui/hstack";
import { Input, InputField } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";

type IconName = React.ComponentProps<typeof Ionicons>["name"];

export function ScreenShell({
  title,
  subtitle,
  children,
}: PropsWithChildren<{ title: string; subtitle?: string }>) {
  return (
    <Box className="flex-1 bg-slate-950">
      <Box className="border-b border-slate-800 px-5 pb-4 pt-16">
        <Heading size="3xl" className="font-bold text-white">
          {title}
        </Heading>
        {subtitle ? (
          <Text className="mt-1 text-sm font-medium text-slate-400">
            {subtitle}
          </Text>
        ) : null}
      </Box>
      <ScrollView
        className="flex-1"
        contentContainerClassName="gap-4 px-4 py-4"
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    </Box>
  );
}

export function IconTile({ icon, label }: { icon: IconName; label: string }) {
  return (
    <Card
      variant="outline"
      className="min-h-28 flex-1 justify-between rounded-md border-0 bg-slate-900 p-4"
    >
      <Ionicons name={icon} size={26} color="#60a5fa" />
      <Text className="text-lg font-semibold text-white">{label}</Text>
    </Card>
  );
}

export function WorkoutCard({
  title = "Daily Workout",
  sport = "Bike",
  detail = "60 min endurance",
}: {
  title?: string;
  sport?: string;
  detail?: string;
}) {
  return (
    <Card
      variant="outline"
      className="min-h-44 justify-between rounded-md border-0 bg-slate-900 p-4"
    >
      <VStack>
        <Text className="text-sm font-semibold uppercase tracking-wide text-blue-300">
          {sport}
        </Text>
        <Heading size="2xl" className="mt-2 font-bold text-white">
          {title}
        </Heading>
      </VStack>
      <Text className="text-base text-slate-300">{detail}</Text>
    </Card>
  );
}

export function PlanStrip({ label }: { label: string }) {
  return (
    <Button
      action="secondary"
      variant="solid"
      size="sm"
      className="h-10 justify-between rounded-md bg-slate-900 px-4"
    >
      <ButtonText className="text-sm font-semibold text-white">
        {label}
      </ButtonText>
      <Ionicons name="chevron-forward" size={16} color="#ffffff" />
    </Button>
  );
}

export function CoachInput({ placeholder }: { placeholder: string }) {
  return (
    <Input className="h-14 rounded-md border-0 bg-slate-900 px-1">
      <InputField
        placeholder={placeholder}
        placeholderTextColor="#cbd5e1"
        className="text-base font-semibold text-white"
      />
    </Input>
  );
}

export function WeekGrid() {
  const days = ["M", "T", "W", "Th", "F", "S", "S"];

  return (
    <VStack className="gap-1">
      <HStack className="gap-1">
        {days.map((day, index) => (
          <Box
            key={`${day}-${index}`}
            className={`h-9 flex-1 items-center justify-center rounded-sm ${
              index === 0 ? "bg-blue-500" : "bg-slate-900"
            }`}
          >
            <Text className="text-sm font-bold text-white">{day}</Text>
          </Box>
        ))}
      </HStack>
      <HStack className="gap-1">
        {days.map((day, index) => (
          <Box
            key={`workout-${day}-${index}`}
            className={`h-10 flex-1 rounded-sm ${
              index === 0 ? "bg-blue-400" : "bg-slate-800"
            }`}
          />
        ))}
      </HStack>
    </VStack>
  );
}
