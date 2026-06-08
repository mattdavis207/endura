import { Ionicons } from "@expo/vector-icons";
import { useState, type PropsWithChildren, type ReactNode } from "react";
import React from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  type TextInputProps,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Box } from "@/components/ui/box";
import { Button, ButtonText } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { HStack } from "@/components/ui/hstack";
import { Input, InputField } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";

type OnboardingShellProps = PropsWithChildren<{
  canContinue?: boolean;
  continueLabel?: string;
  eyebrow?: string;
  footerNote?: ReactNode;
  onBack?: () => void;
  onContinue: () => void;
  onSkip?: () => void;
  progress: number;
  subtitle?: string;
  title: string;
}>;

export function OnboardingShell({
  canContinue = true,
  children,
  continueLabel = "Continue",
  eyebrow,
  footerNote,
  onBack,
  onContinue,
  onSkip,
  progress,
  subtitle,
  title,
}: OnboardingShellProps) {
  return (
    <SafeAreaView className="flex-1 bg-slate-950">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
        <VStack className="flex-1">
          <HStack className="h-14 items-center justify-between px-5">
            {onBack ? (
              <Pressable
                accessibilityLabel="Go back"
                className="h-10 w-10 items-center justify-center rounded-full bg-slate-900"
                onPress={onBack}
              >
                <Ionicons name="arrow-back" size={20} color="#ffffff" />
              </Pressable>
            ) : (
              <Box className="h-10 w-10" />
            )}
            <Box className="h-1.5 w-32 overflow-hidden rounded-full bg-slate-800">
              <Box
                className="h-full rounded-full bg-blue-500"
                style={{ width: `${Math.max(5, progress * 100)}%` }}
              />
            </Box>
            {onSkip ? (
              <Pressable className="h-10 justify-center" onPress={onSkip}>
                <Text className="text-sm font-semibold text-slate-300">
                  Skip
                </Text>
              </Pressable>
            ) : (
              <Box className="h-10 w-10" />
            )}
          </HStack>

          <ScrollView
            className="flex-1"
            contentContainerClassName="gap-8 px-6 pb-8 pt-6"
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <VStack className="gap-3">
              {eyebrow ? (
                <Text className="text-sm font-bold uppercase text-blue-300">
                  {eyebrow}
                </Text>
              ) : null}
              <Heading size="3xl" className="font-bold text-white">
                {title}
              </Heading>
              {subtitle ? (
                <Text className="text-base leading-6 text-slate-400">
                  {subtitle}
                </Text>
              ) : null}
            </VStack>
            {children}
          </ScrollView>

          <VStack className="gap-3 border-t border-slate-800 px-6 pb-3 pt-4">
            <Button
              accessibilityLabel={continueLabel}
              className={`h-14 rounded-md px-5 ${
                canContinue ? "bg-blue-500" : "bg-slate-800"
              }`}
              disabled={!canContinue}
              onPress={onContinue}
            >
              <ButtonText
                className={`text-base font-bold ${
                  canContinue ? "text-white" : "text-slate-500"
                }`}
              >
                {continueLabel}
              </ButtonText>
            </Button>
            {footerNote}
          </VStack>
        </VStack>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

type FieldProps = TextInputProps & {
  label: string;
  optional?: boolean;
  showCharacterCount?: boolean;
};

export function Field({
  label,
  optional,
  showCharacterCount = false,
  ...props
}: FieldProps) {
  const characterCount =
    typeof props.value === "string" ? props.value.length : 0;

  return (
    <VStack className="gap-2">
      <HStack className="items-center justify-between">
        <Text className="text-sm font-bold text-slate-200">{label}</Text>
        {showCharacterCount && props.maxLength ? (
          <Text className="text-xs font-medium text-slate-500">
            {characterCount}/{props.maxLength}
          </Text>
        ) : optional ? (
          <Text className="text-xs font-medium text-slate-500">Optional</Text>
        ) : null}
      </HStack>
      <Input className="h-14 rounded-md border border-slate-700 bg-slate-900 px-4">
        <InputField
          {...props}
          className="text-base font-semibold text-white"
          placeholderTextColor="#64748b"
        />
      </Input>
    </VStack>
  );
}

export type ChoiceOption<T extends string> = {
  label: string;
  value: T;
};

export function ChoiceList<T extends string>({
  onChange,
  options,
  value,
}: {
  onChange: (value: T) => void;
  options: ChoiceOption<T>[];
  value: T | "";
}) {
  return (
    <VStack className="gap-2">
      {options.map((option) => {
        const selected = value === option.value;

        return (
          <Pressable
            accessibilityRole="radio"
            accessibilityState={{ checked: selected }}
            className={`min-h-14 flex-row items-center justify-between rounded-md border px-4 ${
              selected
                ? "border-blue-400 bg-blue-500"
                : "border-slate-700 bg-slate-900"
            }`}
            key={option.value}
            onPress={() => onChange(option.value)}
          >
            <Text
              className={`text-base font-semibold ${
                selected ? "text-white" : "text-slate-200"
              }`}
            >
              {option.label}
            </Text>
            <Ionicons
              color={selected ? "#ffffff" : "#64748b"}
              name={selected ? "checkmark-circle" : "ellipse-outline"}
              size={21}
            />
          </Pressable>
        );
      })}
    </VStack>
  );
}

export function SegmentedControl<T extends string>({
  onChange,
  options,
  value,
}: {
  onChange: (value: T) => void;
  options: ChoiceOption<T>[];
  value: T;
}) {
  return (
    <HStack className="rounded-md bg-slate-900 p-1">
      {options.map((option) => {
        const selected = option.value === value;

        return (
          <Pressable
            className={`h-11 flex-1 items-center justify-center rounded ${
              selected ? "bg-blue-500" : "bg-transparent"
            }`}
            key={option.value}
            onPress={() => onChange(option.value)}
          >
            <Text
              className={`text-sm font-bold ${
                selected ? "text-white" : "text-slate-400"
              }`}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </HStack>
  );
}

export function MultiChoiceList<T extends string>({
  label,
  onChange,
  options,
  values,
}: {
  label: string;
  onChange: (value: T) => void;
  options: ChoiceOption<T>[];
  values: T[];
}) {
  return (
    <VStack className="gap-3">
      <Text className="text-sm font-bold text-slate-200">{label}</Text>
      {options.map((option) => {
        const selected = values.includes(option.value);

        return (
          <Pressable
            accessibilityRole="checkbox"
            accessibilityState={{ checked: selected }}
            className={`min-h-14 flex-row items-center justify-between rounded-md border px-4 ${
              selected
                ? "border-blue-400 bg-blue-500"
                : "border-slate-700 bg-slate-900"
            }`}
            key={option.value}
            onPress={() => onChange(option.value)}
          >
            <Text
              className={`text-base font-semibold ${
                selected ? "text-white" : "text-slate-200"
              }`}
            >
              {option.label}
            </Text>
            <Ionicons
              color={selected ? "#ffffff" : "#64748b"}
              name={selected ? "checkbox" : "square-outline"}
              size={21}
            />
          </Pressable>
        );
      })}
    </VStack>
  );
}

export function DropdownField<T extends string>({
  label,
  onChange,
  options,
  value,
}: {
  label: string;
  onChange: (value: T) => void;
  options: ChoiceOption<T>[];
  value: T;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedLabel =
    options.find((option) => option.value === value)?.label || value;

  return (
    <>
      <VStack className="gap-2">
        <Text className="text-sm font-bold text-slate-200">{label}</Text>
        <Pressable
          accessibilityRole="button"
          className="h-14 flex-row items-center justify-between rounded-md border border-slate-700 bg-slate-900 px-4"
          onPress={() => setIsOpen(true)}
        >
          <Text className="flex-1 text-base font-semibold text-white">
            {selectedLabel}
          </Text>
          <Ionicons name="chevron-down" size={20} color="#94a3b8" />
        </Pressable>
      </VStack>

      <Modal
        animationType="slide"
        onRequestClose={() => setIsOpen(false)}
        presentationStyle="pageSheet"
        visible={isOpen}
      >
        <SafeAreaView className="flex-1 bg-slate-950">
          <VStack className="flex-1">
            <HStack className="h-16 items-center justify-between border-b border-slate-800 px-5">
              <Text className="text-lg font-bold text-white">{label}</Text>
              <Pressable
                accessibilityLabel="Close options"
                className="h-10 w-10 items-center justify-center rounded-full bg-slate-900"
                onPress={() => setIsOpen(false)}
              >
                <Ionicons name="close" size={22} color="#ffffff" />
              </Pressable>
            </HStack>
            <ScrollView
              contentContainerClassName="gap-2 p-5"
              showsVerticalScrollIndicator={false}
            >
              {options.map((option) => {
                const selected = option.value === value;

                return (
                  <Pressable
                    className={`min-h-14 flex-row items-center justify-between rounded-md border px-4 ${
                      selected
                        ? "border-blue-400 bg-blue-500"
                        : "border-slate-700 bg-slate-900"
                    }`}
                    key={option.value}
                    onPress={() => {
                      onChange(option.value);
                      setIsOpen(false);
                    }}
                  >
                    <Text
                      className={`flex-1 text-base font-semibold ${
                        selected ? "text-white" : "text-slate-200"
                      }`}
                    >
                      {option.label}
                    </Text>
                    {selected ? (
                      <Ionicons name="checkmark" size={20} color="#ffffff" />
                    ) : null}
                  </Pressable>
                );
              })}
            </ScrollView>
          </VStack>
        </SafeAreaView>
      </Modal>
    </>
  );
}
