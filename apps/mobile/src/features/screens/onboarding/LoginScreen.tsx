import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button, ButtonText } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";

import { Field } from "./ui";

export function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <SafeAreaView className="flex-1 bg-slate-950">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
        <ScrollView
          contentContainerClassName="flex-grow justify-between px-6 pb-6 pt-4"
          keyboardShouldPersistTaps="handled"
        >
          <VStack className="gap-10">
            <Pressable
              accessibilityLabel="Go back"
              className="h-10 w-10 items-center justify-center rounded-full bg-slate-900"
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={20} color="#ffffff" />
            </Pressable>

            <VStack className="gap-3">
              <Text className="text-sm font-bold uppercase text-blue-300">
                Welcome back
              </Text>
              <Heading size="4xl" className="font-bold text-white">
                Ready for the next session?
              </Heading>
              <Text className="text-base leading-6 text-slate-400">
                Sign in to return to your Training HQ.
              </Text>
            </VStack>

            <VStack className="gap-5">
              <Field
                autoCapitalize="none"
                keyboardType="email-address"
                label="Email"
                onChangeText={setEmail}
                placeholder="you@example.com"
                value={email}
              />
              <Field
                label="Password"
                onChangeText={setPassword}
                placeholder="Enter your password"
                secureTextEntry
                value={password}
              />
            </VStack>
          </VStack>

          <VStack className="gap-4 pt-10">
            <Button
              className={`h-14 rounded-md ${
                email && password ? "bg-blue-500" : "bg-slate-800"
              }`}
              disabled={!email || !password}
              onPress={() => router.replace("/training")}
            >
              <ButtonText className="text-base font-bold text-white">
                Login
              </ButtonText>
            </Button>
            <Pressable onPress={() => router.replace("./create-account")}>
              <Text className="text-center text-sm font-semibold text-slate-300">
                New to Endura?{" "}
                <Text className="font-bold text-blue-300">Create account</Text>
              </Text>
            </Pressable>
          </VStack>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
