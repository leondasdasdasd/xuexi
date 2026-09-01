const twoDigits = (value: number) => String(value).padStart(2, "0");

export const mapExamTimeToDisplayText = (
  value: number | string | null | undefined,
) => (value === undefined || value === null ? "" : String(value));

export const mapExamTimestampToDateDisplayText = (timestamp: number) => {
  const date = new Date(timestamp);
  return `${date.getFullYear()}-${twoDigits(date.getMonth() + 1)}-${twoDigits(
    date.getDate(),
  )}`;
};
