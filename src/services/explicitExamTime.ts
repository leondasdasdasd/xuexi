export type ExplicitExamTimeParseResult =
  | { kind: "empty" }
  | { kind: "invalid" }
  | { kind: "valid"; timestamp: number };

type DateTimeParts = {
  day: number;
  hour: number;
  millisecond: number;
  minute: number;
  month: number;
  second: number;
  year: number;
};

const GMT8_OFFSET_MILLISECONDS = 8 * 60 * 60 * 1000;
const MAX_TIMESTAMP_MILLISECONDS = 8_640_000_000_000_000;

const isDigits = (value: string) =>
  value.length > 0 &&
  [...value].every((character) => character >= "0" && character <= "9");

const parseFixedDigits = (value: string | undefined, length: number) =>
  typeof value === "string" && value.length === length && isDigits(value)
    ? Number(value)
    : null;

const isValidTimestamp = (value: number) =>
  Number.isSafeInteger(value) && Math.abs(value) <= MAX_TIMESTAMP_MILLISECONDS;

const parseIntegerTimestamp = (value: string) => {
  const unsignedValue =
    value[0] === "+" || value[0] === "-" ? value.slice(1) : value;
  if (!isDigits(unsignedValue)) return null;
  const timestamp = Number(value);
  return isValidTimestamp(timestamp) ? timestamp : null;
};

const parseCalendarDateFields = (value: string | undefined) => {
  if (value === undefined) return null;
  const fields = value.split("-");
  if (fields.length !== 3) return null;
  const [yearText, monthText, dayText] = fields;
  const year = parseFixedDigits(yearText, 4);
  const month = parseFixedDigits(monthText, 2);
  const day = parseFixedDigits(dayText, 2);
  if ([year, month, day].includes(null)) return null;
  return { day: day as number, month: month as number, year: year as number };
};

const parseCalendarDate = (value: string | undefined) => {
  const parts = parseCalendarDateFields(value);
  if (!parts) return null;
  const { day, month, year } = parts;
  if (year < 1000) return null;
  if (month < 1 || month > 12) return null;
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return day >= 1 && day <= daysInMonth ? parts : null;
};

const parseClockFields = (value: string) => {
  const fields = value.split(":");
  if (fields.length !== 3) return null;
  const [hourText, minuteText, secondText] = fields;
  const hour = parseFixedDigits(hourText, 2);
  const minute = parseFixedDigits(minuteText, 2);
  const second = parseFixedDigits(secondText, 2);
  if ([hour, minute, second].includes(null)) return null;
  return {
    hour: hour as number,
    minute: minute as number,
    second: second as number,
  };
};

const parseFraction = (value: string) => {
  if (value.length === 0) return 0;
  return value.length <= 3 && isDigits(value)
    ? Number(value.padEnd(3, "0"))
    : null;
};

const isClockWithinRange = (clock: ReturnType<typeof parseClockFields>) =>
  clock !== null &&
  clock.hour <= 23 &&
  clock.minute <= 59 &&
  clock.second <= 59;

const parseClockTime = (value: string | undefined) => {
  if (value === undefined) return null;
  const fields = value.split(".");
  if (fields.length > 2) return null;
  const clock = parseClockFields(fields[0]);
  const millisecond = parseFraction(fields[1] || "");
  if (!isClockWithinRange(clock) || millisecond === null) return null;
  if (!clock) return null;
  const { hour, minute, second } = clock;
  return {
    hour,
    millisecond,
    minute,
    second,
  };
};

const parseDateTimeParts = (
  value: string,
  separator: " " | "T",
): DateTimeParts | null => {
  const [dateText, timeText, extra] = value.split(separator);
  if (extra !== undefined) return null;
  const date = parseCalendarDate(dateText);
  const time = parseClockTime(timeText);
  return date && time ? { ...date, ...time } : null;
};

const toUtcTimestamp = (parts: DateTimeParts) =>
  Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second,
    parts.millisecond,
  );

const parseLegacyGmt8Timestamp = (value: string) => {
  const parts = parseDateTimeParts(value, " ");
  return parts ? toUtcTimestamp(parts) - GMT8_OFFSET_MILLISECONDS : null;
};

const isTimeZoneOffsetWithinRange = (hour: number, minute: number) => {
  if (hour > 14 || minute > 59) return false;
  return hour < 14 || minute === 0;
};

const applyTimeZoneOffsetSign = (sign: string, offset: number) => {
  if (sign === "+") return offset;
  if (sign === "-") return -offset;
  return null;
};

const parseTimeZoneOffset = (value: string) => {
  if (value === "Z") return 0;
  if (value.length !== 6) return null;
  if (value[3] !== ":") return null;
  const hour = parseFixedDigits(value.slice(1, 3), 2);
  const minute = parseFixedDigits(value.slice(4, 6), 2);
  if ([hour, minute].includes(null)) return null;
  const offsetHour = hour as number;
  const offsetMinute = minute as number;
  if (!isTimeZoneOffsetWithinRange(offsetHour, offsetMinute)) return null;
  const offset = (offsetHour * 60 + offsetMinute) * 60 * 1000;
  return applyTimeZoneOffsetSign(value[0], offset);
};

const parseIsoTimestamp = (value: string) => {
  const zoneText = value.endsWith("Z") ? "Z" : value.slice(-6);
  const offset = parseTimeZoneOffset(zoneText);
  if (offset === null) return null;
  const dateTimeText = value.slice(0, -zoneText.length);
  const parts = parseDateTimeParts(dateTimeText, "T");
  return parts ? toUtcTimestamp(parts) - offset : null;
};

const parseStringTimestamp = (value: string) => {
  const integerTimestamp = parseIntegerTimestamp(value);
  if (integerTimestamp !== null) return integerTimestamp;
  return parseLegacyGmt8Timestamp(value) ?? parseIsoTimestamp(value);
};

// 后端 Date 当前按 GMT+8 旧格式输出；这里显式解析，避免 WebKit 与 V8 的宽松规则不同。
export const parseExplicitExamTime = (
  value: unknown,
): ExplicitExamTimeParseResult => {
  if (value === undefined || value === null) return { kind: "empty" };
  if (typeof value === "number")
    return isValidTimestamp(value)
      ? { kind: "valid", timestamp: value }
      : { kind: "invalid" };
  if (typeof value !== "string" || value.length === 0)
    return { kind: "invalid" };
  const timestamp = parseStringTimestamp(value);
  return timestamp === null
    ? { kind: "invalid" }
    : { kind: "valid", timestamp };
};
