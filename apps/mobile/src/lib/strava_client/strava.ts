import * as Linking from "expo-linking";
import { Platform } from "react-native";
import * as WebBrowser from "expo-web-browser";

import { apiGet } from "@/lib/api/client";

type ApprovalPrompt = "auto" | "force";

type StravaAuthorizationResponse = {
  app_authorization_url: string;
  authorization_url: string;
};

const STRAVA_RETURN_URL = "endura://strava-connected";

export async function startStravaAuthorization(
  approvalPrompt: ApprovalPrompt = "auto",
) {
  const query = new URLSearchParams({
    approval_prompt: approvalPrompt,
  });
  const authorization = await apiGet<StravaAuthorizationResponse>(
    `/integrations/strava/authorize?${query.toString()}`,
  );

  if (Platform.OS === "ios") {
    const canOpenStrava = await Linking.canOpenURL(
      authorization.app_authorization_url,
    );

    if (canOpenStrava) {
      await Linking.openURL(authorization.app_authorization_url);
      return;
    }
  }

  if (Platform.OS === "android") {
    await Linking.openURL(authorization.authorization_url);
    return;
  }

  await WebBrowser.openAuthSessionAsync(
    authorization.authorization_url,
    STRAVA_RETURN_URL,
  );
}
