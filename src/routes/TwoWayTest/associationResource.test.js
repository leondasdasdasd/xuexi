/** @jest-environment node */

import {
  buildAssociationModalSearchContext,
  buildAssociationResourcePatch,
  buildAssociationRecommendationTarget,
  buildQuestionAssociationIdentityPatch,
} from "./associationResource.js";

describe("buildAssociationModalSearchContext", () => {
  it("restores the current paper grade whenever association opens", () => {
    expect(
      buildAssociationModalSearchContext({ gradeId: 8, isAssociation: true }),
    ).toEqual({ searchGradeId: 8 });
    expect(
      buildAssociationModalSearchContext({ gradeId: 12, isAssociation: true }),
    ).toEqual({ searchGradeId: 12 });
  });

  it("leaves similarity search state unchanged", () => {
    expect(
      buildAssociationModalSearchContext({ gradeId: 8, isAssociation: false }),
    ).toEqual({});
  });
});

describe("association resource", () => {
  it("ignores empty v2 resource arrays", () => {
    expect(
      buildAssociationResourcePatch(
        {},
        { chapterIds: [], indicatorIds: [], knowledgeIds: [] },
      ),
    ).toEqual({});
  });

  it("copies resource ids when v2 candidates do not include legacy names", () => {
    expect(
      buildAssociationResourcePatch(
        {},
        { chapterIds: [2], indicatorIds: [3], knowledgeIds: [1, 4] },
      ),
    ).toEqual({
      chapterId: [2],
      indicatorIds: [3],
      knowledgeIds: [1, 4],
    });
  });

  it("keeps resources already configured on the paper slot", () => {
    expect(
      buildAssociationResourcePatch(
        { chapterId: [12], indicatorIds: [13], knowledgeIds: [11] },
        { chapterIds: [2], indicatorIds: [3], knowledgeIds: [1] },
      ),
    ).toEqual({});
  });
});

describe("buildQuestionAssociationIdentityPatch", () => {
  it("updates association identity without replacing the planned question type", () => {
    const slot = {
      businessQuestionTypeId: 101,
      questionTypeName: "单选题",
      type: 1,
    };

    expect({
      ...slot,
      ...buildQuestionAssociationIdentityPatch(9002, { type: "leaf" }),
    }).toEqual({
      associationStrategy: { type: "leaf" },
      businessQuestionTypeId: 101,
      questionId: 9002,
      questionTypeName: "单选题",
      type: 1,
    });
  });
});

describe("buildAssociationRecommendationTarget", () => {
  it("uses the planned slot type instead of the associated source type", () => {
    expect(
      buildAssociationRecommendationTarget("0-0", {
        associationSourceSnapshot: { businessQuestionTypeId: 202 },
        businessQuestionTypeId: 101,
        chapterId: [2],
        knowledgeIds: [1],
      }),
    ).toEqual({
      businessQuestionTypeId: 101,
      chapterIds: [2],
      key: "0-0",
      knowledgeIds: [1],
    });
  });
});
