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
import { useOnboardingStore } from "@/state/onboarding";

import { create_supabase_client } from "@/lib/supabase/client";

import { Field } from "./ui";

const supabase = create_supabase_client();

export function CreateAccountScreen() {
  const router = useRouter();
  const updateDraft = useOnboardingStore((state) => state.updateDraft);
  const setStep = useOnboardingStore((state) => state.setStep);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [signupError, setSignupError] = useState<string>();
  const [confirmationEmail, setConfirmationEmail] = useState<string>();
  const passwordsMatch = password.length >= 8 && password === confirmation;
  const canContinue = email.includes("@") && passwordsMatch && !isSubmitting;

  const continueToOnboarding = async () => {
    const normalizedEmail = email.trim();
    setIsSubmitting(true);
    setSignupError(undefined);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
      });

      if (error) {
        setSignupError(error.message);
        return;
      }

      if (!data.session) {
        setConfirmationEmail(normalizedEmail);
        return;
      }

      updateDraft({ email: normalizedEmail });
      setStep("welcome");
      router.replace("./onboarding");
    } catch {
      setSignupError("Unable to create your account. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (confirmationEmail) {
    return (
      <SafeAreaView className="flex-1 bg-slate-950">
        <VStack className="flex-1 justify-between px-6 pb-6 pt-4">
          <Pressable
            accessibilityLabel="Go back"
            className="h-10 w-10 items-center justify-center rounded-full bg-slate-900"
            onPress={() => setConfirmationEmail(undefined)}
          >
            <Ionicons name="arrow-back" size={20} color="#ffffff" />
          </Pressable>

          <VStack className="items-center gap-4">
            <VStack className="h-16 w-16 items-center justify-center rounded-full bg-blue-500">
              <Ionicons name="mail-outline" size={32} color="#ffffff" />
            </VStack>
            <Heading size="3xl" className="text-center font-bold text-white">
              Check your email
            </Heading>
            <Text className="text-center text-base leading-6 text-slate-400">
              We sent a confirmation link to{" "}
              <Text className="font-bold text-slate-200">
                {confirmationEmail}
              </Text>
              . Confirm your account, then return to Endura and log in.
            </Text>
          </VStack>

          <Button
            className="h-14 rounded-md bg-blue-500"
            onPress={() => router.replace("./login")}
          >
            <ButtonText className="text-base font-bold text-white">
              Go to Login
            </ButtonText>
          </Button>
        </VStack>
      </SafeAreaView>
    );
  }

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
          <VStack className="gap-8">
            <Pressable
              accessibilityLabel="Go back"
              className="h-10 w-10 items-center justify-center rounded-full bg-slate-900"
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={20} color="#ffffff" />
            </Pressable>

            <VStack className="gap-3">
              <Text className="text-sm font-bold uppercase text-blue-300">
                Create account
              </Text>
              <Heading size="4xl" className="font-bold text-white">
                Start with the basics
              </Heading>
              <Text className="text-base leading-6 text-slate-400">
                Your race and training profile comes next.
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
                placeholder="At least 8 characters"
                secureTextEntry
                value={password}
              />
              <Field
                label="Confirm password"
                onChangeText={setConfirmation}
                placeholder="Enter it again"
                secureTextEntry
                value={confirmation}
              />
            </VStack>

            {signupError ? (
              <Text className="text-sm font-semibold text-red-400">
                {signupError}
              </Text>
            ) : null}
          </VStack>

          <VStack className="gap-4 pt-10">
            <Button
              className={`h-14 rounded-md ${
                canContinue ? "bg-blue-500" : "bg-slate-800"
              }`}
              disabled={!canContinue}
              onPress={continueToOnboarding}
            >
              <ButtonText className="text-base font-bold text-white">
                {isSubmitting ? "Creating Account..." : "Create Account"}
              </ButtonText>
            </Button>
            <Pressable onPress={() => router.replace("./login")}>
              <Text className="text-center text-sm font-semibold text-slate-300">
                Already have an account?{" "}
                <Text className="font-bold text-blue-300">Login</Text>
              </Text>
            </Pressable>
          </VStack>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
