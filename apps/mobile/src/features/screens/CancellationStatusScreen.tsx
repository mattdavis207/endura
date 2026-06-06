import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

import { Box } from "@/components/ui/box";
import { Button, ButtonText } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";

type CancellationStatusScreenProps = {
  isRetrying?: boolean;
  onReturn?: () => void;
  onRetry?: () => Promise<void> | void;
  retryError?: string;
};

export function CancellationStatusScreen({
  isRetrying = false,
  onReturn,
  onRetry,
  retryError,
}: CancellationStatusScreenProps) {
  const router = useRouter();

  const returnToSettings = () => {
    router.replace("/settings");
  };

  return (
    <Box className="flex-1 bg-slate-950 px-6 pb-10 pt-20">
      <VStack className="flex-1 justify-between">
        <VStack className="gap-8">
          <Box className="h-16 w-16 items-center justify-center rounded-full bg-slate-800">
            <Ionicons
              name="close-outline"
              size={34}
              color="#cbd5e1"
              onPress={returnToSettings}
            />
          </Box>

          <VStack className="gap-3">
            <Text className="text-sm font-bold uppercase text-slate-400">
              Strava connection
            </Text>
            <Heading size="3xl" className="font-bold text-white">
              Connection cancelled
            </Heading>
            <Text className="text-base leading-6 text-slate-300">
              Your Strava account was not connected. Nothing was changed, and
              you can continue using Endura without workout syncing.
            </Text>
          </VStack>

          <VStack className="gap-2 border-l-2 border-slate-700 pl-4">
            <Text className="text-sm font-bold text-white">
              You can connect later
            </Text>
            <Text className="text-sm leading-5 text-slate-400">
              Return to Settings whenever you are ready to enable automatic
              workout imports.
            </Text>
          </VStack>
          {retryError ? (
            <Text className="text-sm font-semibold text-red-400">
              {retryError}
            </Text>
          ) : null}
        </VStack>

        <VStack className="gap-3">
          <Button
            accessibilityLabel="Try connecting Strava again"
            action="primary"
            className={`h-14 rounded-md px-5 ${
              isRetrying ? "bg-blue-400" : "bg-blue-500"
            }`}
            disabled={isRetrying}
            onPress={onRetry ?? returnToSettings}
          >
            <ButtonText className="text-base font-bold text-white">
              {isRetrying ? "Opening Strava..." : "Try Again"}
            </ButtonText>
          </Button>
          <Button
            accessibilityLabel="Return to settings"
            className="h-12 rounded-md border border-slate-700 px-5"
            onPress={onReturn ?? returnToSettings}
            variant="outline"
          >
            <ButtonText className="text-sm font-semibold text-slate-300">
              Return to Settings
            </ButtonText>
          </Button>
        </VStack>
      </VStack>
    </Box>
  );
}
