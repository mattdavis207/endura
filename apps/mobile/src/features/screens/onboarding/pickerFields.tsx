import { Picker } from "react-native-wheel-pick";
import { useState } from "react";
import { Modal, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { Box } from "@/components/ui/box";
import { Button, ButtonText } from "@/components/ui/button";
import { HStack } from "@/components/ui/hstack";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";

const PICKER_HEIGHT = 216;

type PickerOption = {
  label: string;
  value: string;
};

type PickerColumnProps = {
  onChange: (value: string) => void;
  options: PickerOption[];
  value: string;
};

type PickerFrameProps = {
  children: React.ReactNode;
  displayValue: string;
  label: string;
  optional?: boolean;
};

const pad2 = (value: number | string) => String(value).padStart(2, "0");

export function numberOptions(
  start: number,
  end: number,
  step = 1,
  decimals = 0,
): PickerOption[] {
  const count = Math.floor((end - start) / step);

  return Array.from({ length: count + 1 }, (_, index) => {
    const number = start + index * step;
    const value = number.toFixed(decimals);

    return { label: value, value };
  });
}

export function PickerColumn({ onChange, options, value }: PickerColumnProps) {
  return (
    <Box className="flex-1 overflow-hidden" style={{ height: PICKER_HEIGHT }}>
      <Picker
        isCyclic={false}
        isShowSelectBackground
        isShowSelectLine
        itemStyle={{
          color: "#ffffff",
          fontSize: 16,
          fontWeight: "500",
        }}
        onValueChange={onChange}
        pickerData={options}
        selectedValue={value}
        selectBackgroundColor="#334155"
        selectLineColor="#475569"
        selectLineSize={1}
        selectTextColor="#ffffff"
        selectionColor="#475569"
        style={{
          backgroundColor: "#0f172a",
          flex: 1,
          height: PICKER_HEIGHT,
          width: "100%",
        }}
        textColor="#ffffff"
        textSize={16}
        themeVariant="dark"
      />
    </Box>
  );
}

function PickerFrame({
  children,
  displayValue,
  label,
  optional,
}: PickerFrameProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <VStack className="gap-2">
        <HStack className="items-center justify-between">
          <Text className="text-base font-bold text-slate-100">{label}</Text>
          {optional ? (
            <Text className="text-xs font-medium text-slate-500">Optional</Text>
          ) : null}
        </HStack>
        <Pressable
          accessibilityRole="button"
          className="h-14 flex-row items-center justify-between rounded-md border border-slate-700 bg-slate-900 px-4"
          onPress={() => setIsOpen(true)}
        >
          <Text className="text-sm font-semibold text-white">
            {displayValue}
          </Text>
          <Ionicons name="chevron-down" size={20} color="#94a3b8" />
        </Pressable>
      </VStack>

      <Modal
        animationType="slide"
        onRequestClose={() => setIsOpen(false)}
        transparent
        visible={isOpen}
      >
        <Box className="flex-1 justify-end bg-black/60">
          <Pressable className="flex-1" onPress={() => setIsOpen(false)} />
          <SafeAreaView className="rounded-t-2xl border border-slate-800 bg-slate-950">
            <VStack className="gap-4 px-5 pb-4 pt-6">
              <HStack className="items-center justify-between">
                <Text className="text-lg font-bold text-white">{label}</Text>
                <Button
                  className="h-10 rounded-md bg-blue-500 px-5"
                  onPress={() => setIsOpen(false)}
                >
                  <ButtonText className="text-sm font-bold text-white">
                    Done
                  </ButtonText>
                </Button>
              </HStack>
              <HStack
                className="overflow-hidden rounded-md border border-slate-700 bg-slate-900"
                style={{ height: PICKER_HEIGHT }}
              >
                {children}
              </HStack>
            </VStack>
          </SafeAreaView>
        </Box>
      </Modal>
    </>
  );
}

function selectedLabel(options: PickerOption[], value: string) {
  return options.find((option) => option.value === value)?.label ?? value;
}

export function WheelPickerField({
  label,
  onChange,
  optional,
  options,
  value,
}: PickerColumnProps & {
  label: string;
  optional?: boolean;
}) {
  return (
    <PickerFrame
      displayValue={selectedLabel(options, value)}
      label={label}
      optional={optional}
    >
      <PickerColumn onChange={onChange} options={options} value={value} />
    </PickerFrame>
  );
}

export function ValueUnitPickerField<U extends string>({
  label,
  onUnitChange,
  onValueChange,
  optional,
  unit,
  unitOptions,
  value,
  valueOptions,
}: {
  label: string;
  onUnitChange: (unit: U) => void;
  onValueChange: (value: string) => void;
  optional?: boolean;
  unit: U;
  unitOptions: { label: string; value: U }[];
  value: string;
  valueOptions: PickerOption[];
}) {
  return (
    <PickerFrame
      displayValue={`${selectedLabel(valueOptions, value)} ${selectedLabel(
        unitOptions,
        unit,
      )}`}
      label={label}
      optional={optional}
    >
      <PickerColumn
        onChange={onValueChange}
        options={valueOptions}
        value={value}
      />
      <PickerColumn
        onChange={(nextUnit) => onUnitChange(nextUnit as U)}
        options={unitOptions}
        value={unit}
      />
    </PickerFrame>
  );
}

export function DecimalPickerField({
  label,
  max,
  onChange,
  unit,
  value,
}: {
  label: string;
  max: number;
  onChange: (value: string) => void;
  unit: string;
  value: string;
}) {
  const numericValue = Number(value) || 0.1;
  const whole = String(Math.min(Math.floor(numericValue), max));
  const decimal = String(Math.round((numericValue % 1) * 10) % 10);
  const update = (nextWhole: string, nextDecimal: string) => {
    const nextValue = Number(nextWhole) + Number(nextDecimal) / 10;
    onChange(Math.max(0.1, nextValue).toFixed(1));
  };

  return (
    <PickerFrame
      displayValue={`${numericValue.toFixed(1)} ${unit}`}
      label={label}
    >
      <PickerColumn
        onChange={(nextWhole) => update(nextWhole, decimal)}
        options={numberOptions(0, max)}
        value={whole}
      />
      <PickerColumn
        onChange={(nextDecimal) => update(whole, nextDecimal)}
        options={numberOptions(0, 9).map((option) => ({
          label: `.${option.label}`,
          value: option.value,
        }))}
        value={decimal}
      />
      <Box
        className="flex-1 items-center justify-center bg-slate-900"
        style={{ height: PICKER_HEIGHT }}
      >
        <Text className="text-base font-semibold text-white">{unit}</Text>
      </Box>
    </PickerFrame>
  );
}

function parseClockTime(value: string) {
  const [storedHour = "07", storedMinute = "00"] = value.split(":");
  const hour24 = Number(storedHour);
  const meridiem = hour24 >= 12 ? "PM" : "AM";
  const hour12 = hour24 % 12 || 12;

  return {
    hour: String(hour12),
    meridiem,
    minute: pad2(storedMinute),
  };
}

function formatClockTime(hour: string, minute: string, meridiem: string) {
  let hour24 = Number(hour) % 12;

  if (meridiem === "PM") {
    hour24 += 12;
  }

  return `${pad2(hour24)}:${pad2(minute)}`;
}

export function ClockTimePickerField({
  label,
  onChange,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  value: string;
}) {
  const selected = parseClockTime(value);
  const update = (changes: Partial<typeof selected>) => {
    const next = { ...selected, ...changes };
    onChange(formatClockTime(next.hour, next.minute, next.meridiem));
  };

  return (
    <PickerFrame
      displayValue={`${selected.hour}:${selected.minute} ${selected.meridiem}`}
      label={label}
    >
      <PickerColumn
        onChange={(hour) => update({ hour })}
        options={numberOptions(1, 12)}
        value={selected.hour}
      />
      <PickerColumn
        onChange={(minute) => update({ minute })}
        options={numberOptions(0, 59).map((option) => ({
          label: pad2(option.value),
          value: pad2(option.value),
        }))}
        value={selected.minute}
      />
      <PickerColumn
        onChange={(meridiem) => update({ meridiem })}
        options={[
          { label: "AM", value: "AM" },
          { label: "PM", value: "PM" },
        ]}
        value={selected.meridiem}
      />
    </PickerFrame>
  );
}

function parseDuration(value: string, fallback: string) {
  const [hours = "0", minutes = "00", seconds = "00"] = (
    value || fallback
  ).split(":");

  return {
    hours: String(Number(hours)),
    minutes: pad2(minutes),
    seconds: pad2(seconds),
  };
}

export function DurationPickerField({
  fallback = "01:00:00",
  label,
  maxHours,
  onChange,
  optional,
  value,
}: {
  fallback?: string;
  label: string;
  maxHours: number;
  onChange: (value: string) => void;
  optional?: boolean;
  value: string;
}) {
  const selected = parseDuration(value, fallback);
  const update = (changes: Partial<typeof selected>) => {
    const next = { ...selected, ...changes };
    const isZeroDuration =
      Number(next.hours) === 0 &&
      Number(next.minutes) === 0 &&
      Number(next.seconds) === 0;

    onChange(
      isZeroDuration
        ? "00:01:00"
        : `${pad2(next.hours)}:${pad2(next.minutes)}:${pad2(next.seconds)}`,
    );
  };

  return (
    <PickerFrame
      displayValue={`${pad2(selected.hours)}:${selected.minutes}:${selected.seconds}`}
      label={label}
      optional={optional}
    >
      <PickerColumn
        onChange={(hours) => update({ hours })}
        options={numberOptions(0, maxHours).map((option) => ({
          ...option,
          label: `${option.label} hr`,
        }))}
        value={selected.hours}
      />
      <PickerColumn
        onChange={(minutes) => update({ minutes })}
        options={numberOptions(0, 59).map((option) => ({
          label: `${pad2(option.value)} min`,
          value: pad2(option.value),
        }))}
        value={selected.minutes}
      />
      <PickerColumn
        onChange={(seconds) => update({ seconds })}
        options={numberOptions(0, 59).map((option) => ({
          label: `${pad2(option.value)} sec`,
          value: pad2(option.value),
        }))}
        value={selected.seconds}
      />
    </PickerFrame>
  );
}

type PaceUnit = "km" | "mi" | "100m" | "100yd";

const paceBounds: Record<PaceUnit, { max: number; min: number }> = {
  km: { min: 2, max: 20 },
  mi: { min: 4, max: 32 },
  "100m": { min: 0, max: 5 },
  "100yd": { min: 0, max: 5 },
};

const minimumSecondsAtFloor: Record<PaceUnit, number> = {
  km: 30,
  mi: 0,
  "100m": 40,
  "100yd": 40,
};

function parsePace(value: string, fallback: string, units: PaceUnit[]) {
  const match = (value || fallback).match(
    /^(\d{1,2}):(\d{2}) \/(km|mi|100m|100yd)$/,
  );
  const fallbackMatch = fallback.match(
    /^(\d{1,2}):(\d{2}) \/(km|mi|100m|100yd)$/,
  );

  return {
    minutes: String(Number(match?.[1] ?? fallbackMatch?.[1] ?? 5)),
    seconds: pad2(match?.[2] ?? fallbackMatch?.[2] ?? "00"),
    unit: (match?.[3] ?? fallbackMatch?.[3] ?? units[0]) as PaceUnit,
  };
}

export function PacePickerField({
  fallback,
  label,
  onChange,
  optional,
  units,
  value,
}: {
  fallback: string;
  label: string;
  onChange: (value: string) => void;
  optional?: boolean;
  units: PaceUnit[];
  value: string;
}) {
  const selected = parsePace(value, fallback, units);
  const bounds = paceBounds[selected.unit];
  const selectedMinutes = Math.min(
    Math.max(Number(selected.minutes), bounds.min),
    bounds.max,
  );
  const normalized = { ...selected, minutes: String(selectedMinutes) };
  const update = (changes: Partial<typeof normalized>) => {
    const next = { ...normalized, ...changes };
    const nextBounds = paceBounds[next.unit];
    const minutes = Math.min(
      Math.max(Number(next.minutes), nextBounds.min),
      nextBounds.max,
    );
    const seconds =
      minutes === nextBounds.min
        ? Math.max(Number(next.seconds), minimumSecondsAtFloor[next.unit])
        : Number(next.seconds);

    onChange(`${pad2(minutes)}:${pad2(seconds)} /${next.unit}`);
  };

  return (
    <PickerFrame
      displayValue={`${pad2(normalized.minutes)}:${normalized.seconds} /${normalized.unit}`}
      label={label}
      optional={optional}
    >
      <PickerColumn
        onChange={(minutes) => update({ minutes })}
        options={numberOptions(bounds.min, bounds.max).map((option) => ({
          label: `${option.label} min`,
          value: option.value,
        }))}
        value={normalized.minutes}
      />
      <PickerColumn
        onChange={(seconds) => update({ seconds })}
        options={numberOptions(0, 59).map((option) => ({
          label: `${pad2(option.value)} sec`,
          value: pad2(option.value),
        }))}
        value={normalized.seconds}
      />
      <PickerColumn
        onChange={(unit) => update({ unit: unit as PaceUnit })}
        options={units.map((unit) => ({ label: `/${unit}`, value: unit }))}
        value={normalized.unit}
      />
    </PickerFrame>
  );
}
