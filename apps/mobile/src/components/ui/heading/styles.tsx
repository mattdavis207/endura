import { tva } from "@gluestack-ui/utils/nativewind-utils";
import { isWeb } from "@gluestack-ui/utils/nativewind-utils";
const baseStyle = isWeb
  ? "font-sans tracking-sm bg-transparent border-0 box-border display-inline list-none margin-0 padding-0 position-relative text-start no-underline whitespace-pre-wrap word-wrap-break-word"
  : "";

export const headingStyle = tva({
  base: `text-typography-900 font-bold font-heading tracking-sm my-0 ${baseStyle}`,
  variants: {
    isTruncated: {
      true: "truncate",
    },
    bold: {
      true: "font-bold",
    },
    underline: {
      true: "underline",
    },
    strikeThrough: {
      true: "line-through",
    },
    sub: {
      true: "text-xs",
    },
    italic: {
      true: "italic",
    },
    highlight: {
      true: "bg-yellow-500",
    },
    size: {
      "5xl": "text-6xl leading-[72px]",
      "4xl": "text-5xl leading-[58px]",
      "3xl": "text-4xl leading-[44px]",
      "2xl": "text-3xl leading-[38px]",
      xl: "text-2xl leading-8",
      lg: "text-xl leading-7",
      md: "text-lg leading-[26px]",
      sm: "text-base leading-6",
      xs: "text-sm leading-5",
    },
  },
});
