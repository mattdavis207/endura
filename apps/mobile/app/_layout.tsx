import "../global.css";

import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React from "react";

import { GluestackUIProvider } from "../src/components/ui/gluestack-ui-provider";

export default function RootLayout() {
  return (
    <GluestackUIProvider mode="light">
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="strava-connected" />
      </Stack>
      <StatusBar style="auto" />
    </GluestackUIProvider>
  );
}
