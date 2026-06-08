declare module "react-native-wheel-pick" {
  import type { ComponentType } from "react";
  import type {
    ColorValue,
    StyleProp,
    TextStyle,
    ViewStyle,
  } from "react-native";

  type PickerData =
    | string
    | number
    | {
        label: string;
        value: string | number;
      };

  type PickerProps = {
    isCyclic?: boolean;
    isShowSelectBackground?: boolean;
    isShowSelectLine?: boolean;
    itemStyle?: StyleProp<TextStyle>;
    onValueChange: (value: string) => void;
    pickerData: PickerData[];
    selectedValue: string | number;
    selectionColor?: ColorValue;
    selectBackgroundColor?: string;
    selectLineColor?: string;
    selectLineSize?: number;
    selectTextColor?: string;
    style?: StyleProp<ViewStyle>;
    textColor?: string;
    textSize?: number;
    themeVariant?: "light" | "dark";
  };

  export const Picker: ComponentType<PickerProps>;
}
