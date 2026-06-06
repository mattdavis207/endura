import type { ComponentProps } from "react";
import { Pressable, TextInput, View } from "react-native";

type InputProps = ComponentProps<typeof View> & {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "underlined" | "outline" | "rounded";
};

type InputFieldProps = ComponentProps<typeof TextInput> & {
  className?: string;
};

type InputSlotProps = ComponentProps<typeof Pressable> & {
  className?: string;
};

type InputIconProps = ComponentProps<typeof View> & {
  className?: string;
};

function Input({ className = "", ...props }: InputProps) {
  return <View className={`flex-row items-center ${className}`} {...props} />;
}

function InputField({ className = "", ...props }: InputFieldProps) {
  return <TextInput className={`flex-1 ${className}`} {...props} />;
}

function InputSlot({ className = "", ...props }: InputSlotProps) {
  return <Pressable className={className} {...props} />;
}

function InputIcon({ className = "", ...props }: InputIconProps) {
  return <View className={className} {...props} />;
}

export { Input, InputField, InputIcon, InputSlot };
