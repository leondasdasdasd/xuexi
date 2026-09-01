/** @jest-environment node */

import { parseExplicitExamTime } from "./explicitExamTime";

describe("explicit exam transport time", () => {
  const productionTimestamp = Date.UTC(2026, 5, 24, 2, 1, 53);

  it.each([
    [productionTimestamp, productionTimestamp],
    [String(productionTimestamp), productionTimestamp],
    [-1, -1],
    ["-1", -1],
    ["+1", 1],
    ["2026-06-24 10:01:53", productionTimestamp],
    ["2026-06-24T10:01:53+08:00", productionTimestamp],
    ["2026-06-24T02:01:53Z", productionTimestamp],
    ["2026-06-23T21:01:53-05:00", productionTimestamp],
    ["2024-02-29 10:01:53.12", Date.UTC(2024, 1, 29, 2, 1, 53, 120)],
  ])("maps %p to a stable timestamp", (value, timestamp) => {
    expect(parseExplicitExamTime(value)).toEqual({
      kind: "valid",
      timestamp,
    });
  });

  it.each([undefined, null])("maps %p to empty", (value) => {
    expect(parseExplicitExamTime(value)).toEqual({ kind: "empty" });
  });

  it.each([
    "",
    " ",
    "2026-02-29 10:01:53",
    "2026-06-24 24:01:53",
    "2026-06-24T10:01:53",
    "2026-06-24T10:01:53+14:01",
    1.5,
    Number.MAX_SAFE_INTEGER,
    String(Number.MAX_SAFE_INTEGER),
    Number.NaN,
    Number.POSITIVE_INFINITY,
    {},
  ])("rejects an unsupported transport value: %p", (value) => {
    expect(parseExplicitExamTime(value)).toEqual({ kind: "invalid" });
  });
});
