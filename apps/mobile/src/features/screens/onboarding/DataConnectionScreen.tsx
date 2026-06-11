import { FontAwesome5 } from "@expo/vector-icons";
import { useState } from "react";

import { Box } from "@/components/ui/box";
import { Button, ButtonText } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { startStravaAuthorization } from "@/lib/strava_client/strava";

import type { OnboardingScreenProps } from "./screenTypes";
import { OnboardingShell } from "./ui";

export function DataConnectionScreen({
  onBack,
  onNext,
  progress,
}: OnboardingScreenProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState<string>();

  const connectStrava = async () => {
    setIsConnecting(true);
    setConnectionError(undefined);

    // start authorization 
    try {
      await startStravaAuthorization("auto");
    } catch (error){
      setConnectionError(
        "Endura could not open Strava. Confirm FastAPI is running and try again.",
      );
      console.error("Strava connection failed:", error);
      setIsConnecting(false);
    }
  };

  return (
    <OnboardingShell
      continueLabel="Skip for Now"
      eyebrow="Training data"
      onBack={onBack}
      onContinue={onNext}
      progress={progress}
      subtitle="Connecting Strava lets Endura learn from completed workouts immediately."
      title="Bring your training history"
    >
      <Box className="items-center rounded-lg border border-slate-700 bg-slate-900 p-6">
        <Box className="h-16 w-16 items-center justify-center rounded-full bg-[#FC4C02]">
          <FontAwesome5 name="strava" size={34} color="#ffffff" />
        </Box>
        <Text className="mt-5 text-xl font-bold text-white">Strava</Text>
        <Text className="mt-2 text-center text-sm leading-5 text-slate-400">
          Import activities, heart rate, power, pace, cadence, and distance when
          available.
        </Text>
        <Button
          className={`mt-6 h-12 w-full rounded-md ${
            isConnecting ? "bg-blue-400" : "bg-blue-500"
          }`}
          disabled={isConnecting}
          onPress={connectStrava}
        >
          <ButtonText className="text-sm font-bold text-white">
            {isConnecting ? "Opening Strava..." : "Connect Strava"}
          </ButtonText>
        </Button>
      </Box>

      <VStack className="gap-3 rounded-md border border-slate-800 p-4">
        <Text className="text-sm font-bold text-slate-300">Coming later</Text>
        <Text className="text-sm text-slate-500">
          Garmin connection and manual FIT file upload.
        </Text>
      </VStack>

      {connectionError ? (
        <Text className="text-sm font-semibold text-red-400">
          {connectionError}
        </Text>
      ) : null}
    </OnboardingShell>
  );
}
