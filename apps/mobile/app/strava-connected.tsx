import { useLocalSearchParams } from "expo-router";
import { useState } from "react";

import { CancellationStatusScreen } from "../src/features/screens/CancellationStatusScreen";
import { MissingPermissionsScreen } from "../src/features/screens/MissingPermissions";
import { startStravaAuthorization } from "../src/lib/strava_client/strava";

export default function StravaConnectionStatusRoute() {
  const { status } = useLocalSearchParams<{ status?: string }>();
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryError, setRetryError] = useState<string>();

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

  if (status === "missing_permissions") {
    return (
      <MissingPermissionsScreen
        isRetrying={isRetrying}
        retryError={retryError}
        onRetry={() => retryAuthorization("force")}
      />
    );
  }

  return (
    <CancellationStatusScreen
      isRetrying={isRetrying}
      retryError={retryError}
      onRetry={() => retryAuthorization("auto")}
    />
  );
}
