import { Text, View } from "react-native";

export default function HomeScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-white px-6">
      <Text className="text-center text-3xl font-bold text-slate-950">
        Endura
      </Text>
      <Text className="mt-3 text-center text-base text-slate-600">
        Ironman training headquarters
      </Text>
    </View>
  );
}
