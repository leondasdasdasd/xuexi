import get from "lodash/get";

import {
  cloneQuestionForInsert,
  createQuestionForInsert,
} from "./questionTaskInsertModel";

const createUuidFactory = (event) => {
  void event;
  const state = {
    index: 0,
  };

  return (event) => {
    void event;
    state.index += 1;
    return `generated-uuid-${state.index}`;
  };
};

const QUESTION_TYPE_LABELS = [
  { label: "单选题", value: 1 },
  { label: "填空题", value: 3 },
  { label: "问答题", value: 5 },
  { label: "组合题", value: 6 },
];

const QUESTION_LEVEL_LABELS = [
  { label: "普通", value: 2 },
  { label: "困难", value: 3 },
];

const getMappedLabel = (mappings, value) =>
  (mappings.find((item) => item.value === Number(value)) || {}).label;

const getQuestionTypeLabel = (type) =>
  getMappedLabel(QUESTION_TYPE_LABELS, type) || `类型${type}`;

const getQuestionLevelLabel = (level) =>
  getMappedLabel(QUESTION_LEVEL_LABELS, level) || String(level);

const cloneArrayField = (source, field) =>
  Array.isArray(get(source, [field])) ? [...get(source, [field])] : [];

const isOptionBasedQuestion = ({ type }) => [1, 2, 7, 8].includes(Number(type));

describe("QuestionTask insert model", () => {
  it("clones a question for duplication without carrying AI or positioning state", () => {
    const result = cloneQuestionForInsert({
      createUuid: createUuidFactory(),
      getQuestionTypeLabel,
      question: {
        aiQualityCheck: { status: "low" },
        analysisTaskStatus: "SUCCEEDED",
        content: "<p>题干</p>",
        draftId: "old-draft",
        optionList: [{ answers: "A", key: "A" }],
        polygon: [{ x: 1, y: 1 }],
        posList: [[{ x: 1, y: 2 }]],
        questionId: 99,
        qualityCheckTaskStatus: "SUCCEEDED",
        sectionNumber: 2,
        sectionTitle: "填空题",
        sonQuestionList: [
          {
            optionList: [{ answers: "子题选项", key: "A" }],
            polygon: [{ x: 3, y: 4 }],
            posList: [[{ x: 4, y: 5 }]],
            questionId: 100,
            uuid: "sub-old",
          },
        ],
        type: 5,
        uuid: "old-uuid",
      },
    });

    expect(result).toMatchObject({
      aiQualityCheck: undefined,
      analysisTaskStatus: undefined,
      content: "<p>题干</p>",
      draftId: "",
      polygon: undefined,
      posList: [],
      questionId: undefined,
      qualityCheckTaskStatus: undefined,
      sectionNumber: 2,
      sectionTitle: "填空题",
      type: 5,
      typeLabel: "问答题",
      uuid: "generated-uuid-2",
    });
    expect(result.sonQuestionList[0]).toMatchObject({
      polygon: undefined,
      posList: [],
      questionId: undefined,
      uuid: "generated-uuid-1",
    });
  });

  it("creates a new inserted question from anchor metadata and canonical defaults", () => {
    const result = createQuestionForInsert({
      cloneArrayField,
      createUuid: createUuidFactory(),
      getQuestionLevelLabel,
      getQuestionTypeLabel,
      isOptionBasedQuestion,
      question: {
        chapterIds: [1],
        chapterLabels: ["函数"],
        chapterSelections: [1],
        pageIndex: 3,
        questionLevel: 3,
        sectionNumber: "4",
        sectionTitle: "单选题",
        sourceQuestionSort: 8,
        type: 1,
      },
    });

    expect(result).toMatchObject({
      analysis: "",
      answer: "",
      chapterIds: [1],
      chapterLabels: ["函数"],
      chapterSelections: [1],
      pageIndex: 3,
      questionLevel: 3,
      questionLevelName: "困难",
      questionScore: "",
      sectionNumber: 4,
      sectionTitle: "单选题",
      sourceQuestionSort: 8,
      type: 1,
      typeLabel: "单选题",
      uuid: "generated-uuid-1",
    });
    expect(result.optionList.map((option) => option.key)).toEqual([
      "A",
      "B",
      "C",
      "D",
    ]);
  });

  it("creates blank questions with blank-specific answer defaults", () => {
    const result = createQuestionForInsert({
      cloneArrayField,
      createUuid: createUuidFactory(),
      getQuestionLevelLabel,
      getQuestionTypeLabel,
      isOptionBasedQuestion,
      question: {
        type: 3,
      },
    });

    expect(result.answer).toBeUndefined();
    expect(result.gapFillingAnswer).toEqual({
      answers: [""],
      isOrder: false,
    });
    expect(result.optionList).toEqual([]);
    expect(result.typeLabel).toBe("填空题");
  });
});
