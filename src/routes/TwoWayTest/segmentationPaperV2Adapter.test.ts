/** @jest-environment node */

import {
  mapV2QuestionAggregateToTwoWayDraft,
  mapV2QuestionAggregatesWithRegistryToTwoWayViews,
  mapV2SegmentationPaperToTwoWayView,
  mapTwoWayViewToV2SegmentationPaperRequest,
} from "./segmentationPaperV2Adapter";
import { buildCombinationQuestionAssociationPatch } from "./virtualAssociationGroups";

describe("mapV2QuestionAggregatesWithRegistryToTwoWayViews", () => {
  const aggregate = {
    id: 11652,
    question: {
      businessQuestionTypeId: 5,
      children: [],
      elements: [],
      id: 11652,
      version: "1.0",
    },
  };

  it("maps question views with the teaching-context registry", () => {
    expect(
      mapV2QuestionAggregatesWithRegistryToTwoWayViews(
        [aggregate],
        [{ businessQuestionTypeId: 5, legacyTypeId: 2 }],
      ),
    ).toEqual({
      missingBusinessQuestionTypeIds: [],
      views: [
        expect.objectContaining({
          id: 11652,
          type: 2,
          v2Aggregate: aggregate,
        }),
      ],
    });
  });

  it("reports question types missing from the teaching-context registry", () => {
    expect(
      mapV2QuestionAggregatesWithRegistryToTwoWayViews([aggregate], []),
    ).toEqual({
      missingBusinessQuestionTypeIds: [5],
      views: [],
    });
  });

  it("maps and validates business types for every candidate content node", () => {
    const nestedAggregate = {
      ...aggregate,
      question: {
        ...aggregate.question,
        children: [
          {
            businessQuestionTypeId: 6,
            children: [
              {
                businessQuestionTypeId: 1,
                children: [],
                elements: [],
                id: 11654,
                version: "1.0",
              },
            ],
            elements: [],
            id: 11653,
            version: "1.0",
          },
        ],
      },
    };
    const result = mapV2QuestionAggregatesWithRegistryToTwoWayViews(
      [nestedAggregate],
      [
        { businessQuestionTypeId: 5, legacyTypeId: 5 },
        { businessQuestionTypeId: 6, legacyTypeId: 6 },
        { businessQuestionTypeId: 1, legacyTypeId: 1 },
      ],
    );

    expect(result.missingBusinessQuestionTypeIds).toEqual([]);
    expect(result.views[0].children).toMatchObject([
      {
        businessQuestionTypeId: 6,
        children: [{ businessQuestionTypeId: 1, type: 1 }],
        type: 6,
      },
    ]);

    expect(
      mapV2QuestionAggregatesWithRegistryToTwoWayViews(
        [nestedAggregate],
        [{ businessQuestionTypeId: 5, legacyTypeId: 5 }],
      ),
    ).toEqual({
      missingBusinessQuestionTypeIds: [6, 1],
      views: [],
    });
  });

  it("keeps the planned root score when a v2 candidate has no source scores", () => {
    const combinationAggregate = {
      id: 11652,
      question: {
        businessQuestionTypeId: 6,
        children: [
          {
            businessQuestionTypeId: 1,
            children: [],
            elements: [],
            id: 11653,
            version: "1.0",
          },
        ],
        elements: [],
        id: 11652,
        version: "1.0",
      },
    };
    const result = mapV2QuestionAggregatesWithRegistryToTwoWayViews(
      [combinationAggregate],
      [
        { businessQuestionTypeId: 6, legacyTypeId: 6 },
        { businessQuestionTypeId: 1, legacyTypeId: 1 },
      ],
    );
    const patch = buildCombinationQuestionAssociationPatch(result.views[0]) as {
      sonQuestionList: Array<Record<string, unknown>>;
    };

    expect(patch).not.toHaveProperty("questionScore");
    expect(patch.sonQuestionList).toMatchObject([
      {
        businessQuestionTypeId: 1,
        questionId: 11653,
        sonQuestionList: [],
        type: 1,
      },
    ]);
  });
});

describe("segmentation paper v2 adapter", () => {
  it("maps a null questionData response to an empty content node for an unbound placement", () => {
    const view = mapV2SegmentationPaperToTwoWayView(
      {
        gradeId: 8,
        id: 11335,
        moduleList: [
          {
            moduleName: "单选题",
            moduleQuestionNumber: 1,
            questionList: [
              {
                businessQuestionTypeId: 1,
                children: [],
                questionData: null,
                questionScore: 1,
              },
            ],
          },
        ],
        type: 1,
        subjectId: 14,
        title: "细目表",
        totalScore: 1,
      },
      { 1: 1 },
    );

    expect(view.moduleModelList[0].questionList[0]).toMatchObject({
      businessQuestionTypeId: 1,
      questionData: {
        businessQuestionTypeId: 1,
        children: [],
        elements: [],
        version: "1",
      },
    });
  });

  it("maps the recursive v2 question shape without flattening children", () => {
    const draft = mapV2QuestionAggregateToTwoWayDraft({
      id: 10,
      question: {
        businessQuestionTypeId: 6,
        children: [
          {
            businessQuestionTypeId: 1,
            children: [],
            elements: [],
            id: 11,
            version: "1",
          },
        ],
        elements: [],
        id: 10,
        version: "1",
      },
      resource: { chapterIds: [2], knowledgeIds: [1], level: 3 },
    });

    expect(draft).toMatchObject({
      businessQuestionTypeId: 6,
      chapterIds: [2],
      children: [{ businessQuestionTypeId: 1, questionId: 11 }],
      knowledgeIds: [1],
      questionId: 10,
      questionLevelType: 3,
    });
  });

  it("keeps paper placement metadata when loading and saving", () => {
    const view = mapV2SegmentationPaperToTwoWayView(
      {
        moduleList: [
          {
            moduleName: "选择题",
            moduleQuestionNumber: 1,
            questionList: [
              {
                associationStrategy: {
                  nodePath: [9, 10],
                  type: "leaf",
                },
                businessQuestionTypeId: 101,
                chapterIds: [2],
                children: [],
                indicatorIds: [3],
                knowledgeIds: [1],
                questionData: {
                  businessQuestionTypeId: 6,
                  children: [
                    {
                      businessQuestionTypeId: 102,
                      children: [],
                      elements: [],
                      id: 11,
                      version: "1",
                    },
                  ],
                  elements: [],
                  id: 10,
                  version: "1",
                },
                questionId: 10,
                predictionDifficulty: 0,
                questionLevelType: 2,
                questionScore: 5,
                sourceType: 1,
              },
            ],
          },
        ],
        gradeId: 7,
        id: 20,
        type: 1,
        subjectId: 8,
        title: "细目表",
        totalScore: 5,
      },
      { 101: 1 },
    );

    const request = mapTwoWayViewToV2SegmentationPaperRequest({
      gradeId: view.gradeId,
      paperModuleModels: view.moduleModelList,
      subjectId: view.subjectId,
      title: view.title,
      totalScore: view.totalScore,
      type: view.type,
    });

    expect(view.type).toBe(1);

    expect(request.modules[0].questions[0]).toEqual({
      associationStrategy: {
        nodePath: [9, 10],
        type: "leaf",
      },
      businessQuestionTypeId: 101,
      chapterIds: [2],
      children: [],
      indicatorIds: [3],
      knowledgeIds: [1],
      questionId: 10,
      predictionDifficulty: 0,
      questionLevelType: 2,
      questionScore: 5,
      sourceType: 1,
    });
  });

  it("maps legacy UI behavior from the formal question type", () => {
    const view = mapV2SegmentationPaperToTwoWayView(
      {
        moduleList: [
          {
            moduleName: "混合题位",
            moduleQuestionNumber: 1,
            questionList: [
              {
                businessQuestionTypeId: 101,
                children: [],
                questionData: {
                  businessQuestionTypeId: 6,
                  children: [],
                  elements: [],
                  id: 10,
                  version: "1",
                },
                questionId: 10,
              },
            ],
          },
        ],
        gradeId: 7,
        id: 20,
        type: 1,
        subjectId: 8,
        title: "题型边界",
        totalScore: 1,
      },
      { 6: 5, 101: 1 },
    );

    expect(view.moduleModelList[0].questionList[0]).toEqual(
      expect.objectContaining({ businessQuestionTypeId: 101, type: 5 }),
    );
  });

  it("keeps the business question type on an unbound custom question slot", () => {
    const request = mapTwoWayViewToV2SegmentationPaperRequest({
      gradeId: 8,
      paperModuleModels: [
        {
          moduleName: "阅读题",
          questionList: [
            {
              businessQuestionTypeId: 201,
              chapterIds: [],
              children: [],
              indicatorIds: [],
              knowledgeIds: [],
              id: -1,
              predictionDifficulty: 1,
              questionData: {
                businessQuestionTypeId: 201,
                children: [],
                elements: [],
                version: "1",
              },
              questionScore: 1,
            },
          ],
        },
      ],
      subjectId: 14,
      title: "细目表",
      totalScore: 1,
      type: 1,
    });

    expect(request.modules[0].questions[0]).toEqual(
      expect.objectContaining({
        businessQuestionTypeId: 201,
        predictionDifficulty: 1,
        questionId: undefined,
      }),
    );
  });

  it("serializes independent attributes on a blank follower placement", () => {
    const request = mapTwoWayViewToV2SegmentationPaperRequest({
      gradeId: 8,
      paperModuleModels: [
        {
          moduleName: "填空题",
          questionList: [
            {
              associationStrategy: {
                blankId: "blank_1",
                blankOrder: 1,
                type: "blank",
              },
              businessQuestionTypeId: 3,
              chapterIds: [11],
              children: [],
              indicatorIds: [13],
              knowledgeIds: [12],
              predictionDifficulty: 0.4,
              questionData: {
                businessQuestionTypeId: 3,
                children: [],
                elements: [],
                version: "1",
              },
              questionId: 101,
              questionLevelType: 3,
              questionScore: 2,
              sourceType: 2,
            },
          ],
        },
      ],
      subjectId: 14,
      title: "细目表",
      totalScore: 2,
      type: 1,
    });

    expect(request.modules[0].questions[0]).toEqual(
      expect.objectContaining({
        associationStrategy: {
          blankId: "blank_1",
          blankOrder: 1,
          type: "blank",
        },
        chapterIds: [11],
        indicatorIds: [13],
        knowledgeIds: [12],
        predictionDifficulty: 0.4,
        questionLevelType: 3,
        questionScore: 2,
        sourceType: 2,
      }),
    );
  });

  it("serializes every level of a generated combination placement tree", () => {
    const leaf = {
      businessQuestionTypeId: 1,
      chapterIds: [],
      children: [],
      indicatorIds: [],
      knowledgeIds: [],
      questionData: {
        businessQuestionTypeId: 1,
        children: [],
        elements: [],
        version: "1",
      },
      questionId: 103,
      questionScore: 2,
      sonQuestionList: [],
    };
    const request = mapTwoWayViewToV2SegmentationPaperRequest({
      gradeId: 8,
      paperModuleModels: [
        {
          moduleName: "组合题",
          questionList: [
            {
              businessQuestionTypeId: 6,
              chapterIds: [],
              children: [],
              indicatorIds: [],
              knowledgeIds: [],
              questionData: {
                businessQuestionTypeId: 6,
                children: [],
                elements: [],
                version: "1",
              },
              questionId: 101,
              sonQuestionList: [
                {
                  businessQuestionTypeId: 6,
                  chapterIds: [],
                  children: [],
                  indicatorIds: [],
                  knowledgeIds: [],
                  questionData: {
                    businessQuestionTypeId: 6,
                    children: [],
                    elements: [],
                    version: "1",
                  },
                  questionId: 102,
                  sonQuestionList: [leaf],
                },
              ],
            },
          ],
        },
      ],
      subjectId: 14,
      title: "细目表",
      totalScore: 2,
      type: 1,
    });

    const serializedQuestion = request.modules[0].questions[0] as {
      children: Array<Record<string, unknown>>;
    };
    expect(serializedQuestion.children[0]).toMatchObject({
      businessQuestionTypeId: 6,
      children: [
        {
          businessQuestionTypeId: 1,
          children: [],
          questionId: 103,
        },
      ],
      questionId: 102,
    });
  });
});
