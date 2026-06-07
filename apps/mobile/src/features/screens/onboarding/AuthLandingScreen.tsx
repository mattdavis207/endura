import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import { Box } from "@/components/ui/box";
import { Button, ButtonText } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";

export function AuthLandingScreen() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-slate-950">
      <VStack className="flex-1 justify-between px-6 pb-6 pt-12">
        <VStack className="flex-1 items-center justify-center gap-8">
          <Box className="h-20 w-20 items-center justify-center rounded-full border border-blue-400 bg-slate-900">
            <Ionicons name="pulse" size={36} color="#60a5fa" />
          </Box>
          <VStack className="items-center gap-3">
            <Text className="text-sm font-bold uppercase text-blue-300">
              Endura
            </Text>
            <Heading size="4xl" className="text-center font-bold text-white">
              Build your race command center
            </Heading>
            <Text className="max-w-80 text-center text-base leading-6 text-slate-400">
              Plan the week, learn from every workout, and arrive ready for race
              day.
            </Text>
          </VStack>
        </VStack>

        <VStack className="gap-3">
          <Button
            className="h-14 rounded-md bg-blue-500"
            onPress={() => router.push("./login")}
          >
            <ButtonText className="text-base font-bold text-white">
              Login
            </ButtonText>
          </Button>
          <Button
            className="h-14 rounded-md border border-slate-600 bg-white"
            onPress={() => router.push("./create-account")}
            variant="outline"
          >
            <ButtonText className="text-base font-bold text-slate-950">
              Create Account
            </ButtonText>
          </Button>
        </VStack>
      </VStack>
    </SafeAreaView>
  );
}
