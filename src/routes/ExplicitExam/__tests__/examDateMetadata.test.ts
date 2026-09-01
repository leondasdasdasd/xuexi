/** @jest-environment node */

import {
  mapExamTimestampToDateDisplayText,
  mapExamTimeToDisplayText,
} from "../examDateMetadata";

describe("explicit exam date metadata", () => {
  it.each([
    ["2026-06-24 10:01:53", "2026-06-24 10:01:53"],
    ["", ""],
    [null, ""],
    [1_786_377_600_000, "1786377600000"],
  ])("maps %p to display text", (value, displayText) => {
    expect(mapExamTimeToDisplayText(value)).toBe(displayText);
  });

  it("formats a trusted timestamp with the current local calendar date", () => {
    const timestamp = new Date(2026, 7, 11, 9, 30).getTime();

    expect(mapExamTimestampToDateDisplayText(timestamp)).toBe("2026-08-11");
  });
});
