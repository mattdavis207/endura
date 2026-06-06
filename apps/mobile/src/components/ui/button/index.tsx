import type { ComponentProps } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";

type ButtonProps = ComponentProps<typeof Pressable> & {
  action?: "primary" | "secondary" | "positive" | "negative" | "default";
  className?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  variant?: "link" | "outline" | "solid";
};

type ButtonTextProps = ComponentProps<typeof Text> & {
  className?: string;
};

type ButtonGroupProps = ComponentProps<typeof View> & {
  className?: string;
};

type ButtonSpinnerProps = ComponentProps<typeof ActivityIndicator>;

function Button({ className = "", ...props }: ButtonProps) {
  return (
    <Pressable
      className={`flex-row items-center justify-center ${className}`}
      {...props}
    />
  );
}

function ButtonText({ className = "", ...props }: ButtonTextProps) {
  return <Text className={className} {...props} />;
}

function ButtonGroup({ className = "", ...props }: ButtonGroupProps) {
  return <View className={className} {...props} />;
}

function ButtonSpinner(props: ButtonSpinnerProps) {
  return <ActivityIndicator {...props} />;
}

const ButtonIcon = View;

export { Button, ButtonGroup, ButtonIcon, ButtonSpinner, ButtonText };
