import type { ReactNode } from "react";
import { useEffect } from "react";
import { View } from "react-native";
import type { ViewProps } from "react-native";
import { useColorScheme } from "nativewind";

import { config } from "./config";

export type ModeType = "light" | "dark" | "system";

export function GluestackUIProvider({
  mode = "light",
  ...props
}: {
  mode?: ModeType;
  children?: ReactNode;
  style?: ViewProps["style"];
}) {
  const { colorScheme, setColorScheme } = useColorScheme();

  useEffect(() => {
    setColorScheme(mode);
  }, [mode, setColorScheme]);

  return (
    <View
      style={[
        config[colorScheme!],
        { flex: 1, height: "100%", width: "100%" },
        props.style,
      ]}
    >
      {props.children}
    </View>
  );
}
