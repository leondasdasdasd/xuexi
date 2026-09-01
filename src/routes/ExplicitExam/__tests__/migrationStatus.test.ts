/** @jest-environment node */

import { mapExplicitExamLoadError } from "../migrationStatus";

describe("ExplicitExam migration status", () => {
  it("maps the backend LEGACY rejection to a user-facing migration status", () => {
    const error = mapExplicitExamLoadError(
      new Error(
        "读取V2试卷失败：contractVersion=LEGACY，requiredContractVersion=V2",
      ),
    );
    expect(error.message).toContain("LEGACY");
  });
});
