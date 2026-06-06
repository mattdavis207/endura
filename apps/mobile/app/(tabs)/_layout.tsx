import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";

type TabIconName = React.ComponentProps<typeof Ionicons>["name"];

const tabIcons: Record<string, TabIconName> = {
  training: "home-outline",
  calendar: "calendar-outline",
  coach: "sparkles-outline",
  settings: "settings-outline",
};

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: "#2563eb",
        tabBarInactiveTintColor: "#64748b",
        tabBarStyle: {
          backgroundColor: "#ffffff",
          borderTopColor: "#dbeafe",
          height: 78,
          paddingBottom: 16,
          paddingTop: 10,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "700",
        },
        tabBarIcon: ({ color, size }) => (
          <Ionicons
            name={tabIcons[route.name] ?? "ellipse-outline"}
            color={color}
            size={size}
          />
        ),
      })}
    >
      <Tabs.Screen name="training" options={{ title: "HQ" }} />
      <Tabs.Screen name="calendar" options={{ title: "Calendar" }} />
      <Tabs.Screen name="coach" options={{ title: "Coach" }} />
      <Tabs.Screen name="settings" options={{ title: "Settings" }} />
    </Tabs>
  );
}
