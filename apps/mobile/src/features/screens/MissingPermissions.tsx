import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

import { Box } from "@/components/ui/box";
import { Button, ButtonText } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { startStravaAuthorization } from "@/lib/strava_client/strava";


/* 
    Test Page
    xcrun simctl openurl booted \
"exp://127.0.0.1:8081/--/strava-connected?status=missing_permissions"
*/


type MissingPermissionsScreenProps = {
  isRetrying?: boolean;
  onCancel?: () => void;
  onRetry?: () => Promise<void> | void;
  retryError?: string;
};

export function MissingPermissionsScreen({
  isRetrying = false,
  onCancel,
  onRetry,
  retryError,
}: MissingPermissionsScreenProps) {
  const router = useRouter();

  const returnToSettings = () => {
    router.replace("/settings");
  };

  return (
    <Box className="flex-1 bg-slate-950 px-6 pb-10 pt-20">
      <VStack className="flex-1 justify-between">
        <VStack className="gap-8">
          <Box className="h-16 w-16 items-center justify-center rounded-full bg-blue-500">
            <Ionicons
              name="shield-checkmark-outline"
              size={30}
              color="#ffffff"
              onPress={returnToSettings}
            />
          </Box>

          <VStack className="gap-3">
            <Text className="text-sm font-bold uppercase text-blue-300">
              Strava connection
            </Text>
            <Heading size="3xl" className="font-bold text-white">
              Activity access is required
            </Heading>
            <Text className="text-base leading-6 text-slate-300">
              Endura needs permission to read your Strava activities so it can
              sync completed workouts and build training recommendations.
            </Text>
          </VStack>

          <VStack className="gap-4 border-l-2 border-blue-500 pl-4">
            <Text className="text-sm font-bold text-white">
              Endura requests:
            </Text>
            <Text className="text-sm leading-6 text-slate-300">
              Read your basic Strava profile and access your completed
              activities, including private activities.
            </Text>
          </VStack>

          <Text className="text-sm leading-5 text-slate-400">
            Endura cannot publish, edit, or delete your Strava activities with
            these permissions.
          </Text>
          {retryError ? (
            <Text className="text-sm font-semibold text-red-400">
              {retryError}
            </Text>
          ) : null}
        </VStack>

        <VStack className="gap-3">
          <Button
            accessibilityLabel="Connect Strava again"
            action="primary"
            className={`h-14 rounded-md px-5 ${
              isRetrying ? "bg-blue-400" : "bg-blue-500"
            }`}
            disabled={isRetrying}
            onPress={onRetry ?? (() => startStravaAuthorization("force"))}
          >
            <ButtonText className="text-base font-bold text-white">
              {isRetrying ? "Opening Strava..." : "Connect Strava Again"}
            </ButtonText>
          </Button>
          <Button
            accessibilityLabel="Return to settings"
            className="h-12 rounded-md border border-slate-700 px-5"
            onPress={onCancel ?? returnToSettings}
            variant="outline"
          >
            <ButtonText className="text-sm font-semibold text-slate-300">
              Not Now
            </ButtonText>
          </Button>
        </VStack>
      </VStack>
    </Box>
  );
}
