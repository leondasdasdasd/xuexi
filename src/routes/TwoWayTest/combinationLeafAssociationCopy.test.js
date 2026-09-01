/** @jest-environment node */

import { getCombinationLeafRangeDescription } from "./combinationLeafAssociationCopy.js";

describe("combinationLeafAssociationCopy", () => {
  it("describes leaf association without the legacy group marker", () => {
    const description = getCombinationLeafRangeDescription({
      endNumber: 4,
      startNumber: 2,
    });

    expect(description).toContain("marked as a leaf question");
    expect(description).not.toContain("标记为叶子题");
    expect(description).not.toContain("标“组”");
  });
});
