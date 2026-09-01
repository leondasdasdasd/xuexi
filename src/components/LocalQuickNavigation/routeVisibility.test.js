/** @jest-environment node */

import { isAdaptiveLearningPath } from "./routeVisibility";

describe("local quick navigation route visibility", () => {
  test("identifies adaptive learning routes where the overlay stays hidden", () => {
    expect(isAdaptiveLearningPath("/adaptive-learning")).toBe(true);
    expect(
      isAdaptiveLearningPath("/adaptive-learning/teacher/textbook-lessons"),
    ).toBe(true);
    expect(isAdaptiveLearningPath("/examAnalysis")).toBe(false);
  });
});
