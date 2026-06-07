import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator } from "react-native";

import { CancellationStatusScreen } from "../src/features/screens/CancellationStatusScreen";
import { MissingPermissionsScreen } from "../src/features/screens/MissingPermissions";
import { startStravaAuthorization } from "../src/lib/strava_client/strava";
import { useOnboardingStore } from "../src/state/onboarding";

export default function StravaConnectionStatusRoute() {
  const router = useRouter();
  const { status } = useLocalSearchParams<{ status?: string }>();
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryError, setRetryError] = useState<string>();
  const onboardingStep = useOnboardingStore((state) => state.step);
  const setOnboardingStep = useOnboardingStore((state) => state.setStep);
  const updateDraft = useOnboardingStore((state) => state.updateDraft);
  const isOnboarding = onboardingStep === "dataConnection";

  useEffect(() => {
    if (status !== "success") {
      return;
    }

    if (isOnboarding) {
      updateDraft({ stravaConnected: true });
      setOnboardingStep("success");
      router.replace("./onboarding");
      return;
    }

    router.replace("/training");
  }, [isOnboarding, router, setOnboardingStep, status, updateDraft]);

  const retryAuthorization = async (approvalPrompt: "auto" | "force") => {
    setIsRetrying(true);
    setRetryError(undefined);

    try {
      await startStravaAuthorization(approvalPrompt);
    } catch {
      setRetryError(
        "Endura could not open Strava. Check that the API is running and try again.",
      );
    } finally {
      setIsRetrying(false);
    }
  };

  const returnFromStatus = () => {
    if (isOnboarding) {
      setOnboardingStep("dataConnection");
      router.replace("./onboarding");
      return;
    }

    router.replace("/settings");
  };

  if (status === "success") {
    return <ActivityIndicator className="flex-1 bg-slate-950" />;
  }

  if (status === "missing_permissions") {
    return (
      <MissingPermissionsScreen
        isRetrying={isRetrying}
        onCancel={returnFromStatus}
        retryError={retryError}
        onRetry={() => retryAuthorization("force")}
      />
    );
  }

  return (
    <CancellationStatusScreen
      isRetrying={isRetrying}
      onReturn={returnFromStatus}
      retryError={retryError}
      onRetry={() => retryAuthorization("auto")}
    />
  );
}
