import {
  buildQuestionSectionInsertPatches,
  buildQuestionSectionInsertPatchesAtStart,
  buildQuestionSectionUpdatePatches,
  getInheritedSectionPatch,
  getQuestionDisplayNumber,
  getQuestionSectionDisplayLabel,
  getQuestionSectionIdentityKey,
  getQuestionSourcePageImageAssets,
  hasQuestionAnalysis,
  hasQuestionAnswer,
  hasQuestionOptions,
  hasQuestionRichTextContent,
  normalizeTaskResult,
} from "./questionTaskViewModel";

const FORMULA_IMAGE_HTML =
  '<p><img class="f-marker slate-formula-image" src="https://example.com/formula.png?mathUrl=x%3D1" style="height:30px"/></p>';
const CURRENT_PAGE_IMAGE_URL = "https://example.com/page-1.png";
const NEXT_PAGE_IMAGE_URL = "https://example.com/page-2.png";

describe("QuestionTask rich content validation", () => {
  it("treats formula image HTML as valid answer and analysis content", () => {
    expect(
      hasQuestionAnswer({
        answer: FORMULA_IMAGE_HTML,
        type: 5,
      }),
    ).toBe(true);
    expect(
      hasQuestionAnalysis({
        analysis: FORMULA_IMAGE_HTML,
        type: 5,
      }),
    ).toBe(true);
  });

  it("keeps registered judge answer behavior compatible with default answer validation", () => {
    expect(
      hasQuestionAnswer({
        answer: true,
        type: 4,
      }),
    ).toBe(true);
    expect(
      hasQuestionAnswer({
        sonQuestionList: [
          {
            answer: false,
            type: 4,
          },
        ],
        type: 6,
      }),
    ).toBe(true);
  });

  it("treats image-only option rich text as filled", () => {
    expect(
      hasQuestionOptions({
        optionList: [
          {
            answers: FORMULA_IMAGE_HTML,
            key: "A",
          },
          {
            answers: "<p>文字选项</p>",
            key: "B",
          },
        ],
        type: 1,
      }),
    ).toBe(true);
  });

  it("keeps option answer text from OCR result without stripping option-like prefixes", () => {
    const taskResult = normalizeTaskResult({
      pages: [
        {
          pageIndex: 0,
          questionList: [
            {
              optionList: [
                { answers: "A BBBB", key: "A" },
                { answers: "<p>B. BBBB</p>", key: "B" },
              ],
              type: 1,
            },
          ],
        },
      ],
    });

    expect(taskResult.pages[0].questions[0].optionList).toEqual([
      {
        answers: "A BBBB",
        key: "A",
        knowledgeIds: [],
        knowledgeValues: [],
      },
      {
        answers: "<p>B. BBBB</p>",
        key: "B",
        knowledgeIds: [],
        knowledgeValues: [],
      },
    ]);
  });

  it("keeps empty rich text wrappers invalid", () => {
    expect(hasQuestionRichTextContent("<p><br /></p>")).toBe(false);
  });

  it("normalizes section fields onto top-level questions only", () => {
    const taskResult = normalizeTaskResult({
      pages: [
        {
          pageIndex: 0,
          questionList: [
            {
              questionSort: 1,
              sectionNumber: 1,
              sectionTitle: " 单项选择题 ",
              sonQuestionList: [
                {
                  sectionNumber: 9,
                  sectionTitle: "不应保留",
                  type: 5,
                },
              ],
              type: 6,
            },
          ],
        },
      ],
    });

    expect(taskResult.pages[0].questions[0]).toMatchObject({
      sectionNumber: 1,
      sectionTitle: "单项选择题",
    });
    expect(taskResult.pages[0].questions[0].sonQuestionList[0]).toMatchObject({
      sectionNumber: undefined,
      sectionTitle: "",
    });
  });

  it("derives section labels and reordered inheritance from visible questions", () => {
    const questions = [
      { draftId: "1", sectionNumber: 1, sectionTitle: "单项选择题" },
      { draftId: "2", sectionNumber: 2, sectionTitle: "填空题" },
      { draftId: "3", sectionTitle: "" },
    ];

    expect(getQuestionSectionDisplayLabel(questions[0])).toBe("一、单项选择题");
    expect(getQuestionSectionDisplayLabel(questions[1])).toBe("二、填空题");
    expect(
      getQuestionSectionDisplayLabel(
        {
          draftId: "4",
          sectionTitle: "",
          typeLabel: "问答题",
        },
        3,
      ),
    ).toBe("三、问答题");
    expect(getQuestionSectionDisplayLabel(questions[2])).toBe("未分组");
    expect(getInheritedSectionPatch(questions, "2")).toEqual({
      sectionNumber: undefined,
      sectionTitle: "",
    });
  });

  it("uses question type as display-only section identity when section metadata is missing", () => {
    const questions = [
      { draftId: "1", sectionTitle: "", typeLabel: "单选题" },
      { draftId: "2", sectionTitle: "", typeLabel: "单选题" },
      { draftId: "3", sectionTitle: "", typeLabel: "填空题" },
    ];

    expect(getQuestionSectionIdentityKey(questions[0])).toBe("type::单选题");
    expect(getQuestionSectionIdentityKey(questions[1])).toBe("type::单选题");
    expect(getQuestionSectionIdentityKey(questions[2])).toBe("type::填空题");
  });

  it("builds patches for inserting a section between question groups", () => {
    const questions = [
      {
        draftId: "1",
        sectionNumber: 1,
        sectionTitle: "单项选择题",
        typeLabel: "单选题",
      },
      {
        draftId: "2",
        sectionNumber: 1,
        sectionTitle: "单项选择题",
        typeLabel: "填空题",
      },
      {
        draftId: "3",
        sectionNumber: 1,
        sectionTitle: "单项选择题",
        typeLabel: "填空题",
      },
      {
        draftId: "4",
        sectionNumber: 3,
        sectionTitle: "解答题",
        typeLabel: "解答题",
      },
    ];

    expect(
      buildQuestionSectionInsertPatches(questions, "1", {
        sectionNumber: 9,
        sectionTitle: "新分段",
      }),
    ).toEqual([
      {
        draftId: "2",
        patch: {
          sectionNumber: 9,
          sectionTitle: "新分段",
        },
      },
      {
        draftId: "3",
        patch: {
          sectionNumber: 9,
          sectionTitle: "新分段",
        },
      },
    ]);
  });

  it("builds patches for inserting a section before the first question group", () => {
    const questions = [
      {
        draftId: "1",
        sectionNumber: 1,
        sectionTitle: "单项选择题",
        typeLabel: "单选题",
      },
      {
        draftId: "2",
        sectionNumber: 1,
        sectionTitle: "单项选择题",
        typeLabel: "单选题",
      },
      {
        draftId: "3",
        sectionNumber: 2,
        sectionTitle: "填空题",
        typeLabel: "填空题",
      },
    ];

    expect(
      buildQuestionSectionInsertPatchesAtStart(questions, {
        sectionNumber: 8,
        sectionTitle: "新开头",
      }),
    ).toEqual([
      {
        draftId: "1",
        patch: {
          sectionNumber: 8,
          sectionTitle: "新开头",
        },
      },
      {
        draftId: "2",
        patch: {
          sectionNumber: 8,
          sectionTitle: "新开头",
        },
      },
    ]);
  });

  it("builds patches for updating only the current contiguous section group", () => {
    const questions = [
      { draftId: "1", sectionNumber: 1, sectionTitle: "选择题" },
      { draftId: "2", sectionNumber: 1, sectionTitle: "选择题" },
      { draftId: "3", sectionNumber: 2, sectionTitle: "填空题" },
      { draftId: "4", sectionNumber: 1, sectionTitle: "选择题" },
    ];

    expect(
      buildQuestionSectionUpdatePatches(questions, "1", {
        sectionNumber: 9,
        sectionTitle: "新选择题",
      }),
    ).toEqual([
      {
        draftId: "1",
        patch: {
          sectionNumber: 9,
          sectionTitle: "新选择题",
        },
      },
      {
        draftId: "2",
        patch: {
          sectionNumber: 9,
          sectionTitle: "新选择题",
        },
      },
    ]);
  });

  it("keeps answerRaw groups when normalizing blank questions", () => {
    const taskResult = normalizeTaskResult({
      pages: [
        {
          pageIndex: 0,
          questionList: [
            {
              gapFillingAnswer: {
                answerRaw: [["<p>甲</p>", FORMULA_IMAGE_HTML]],
                answers: ["旧字符串"],
                isOrder: true,
              },
              type: 3,
            },
          ],
        },
      ],
    });

    expect(taskResult.pages[0].questions[0].gapFillingAnswer).toEqual({
      answerRaw: [["<p>甲</p>", FORMULA_IMAGE_HTML]],
      answers: ["旧字符串"],
      isOrder: true,
    });
  });

  it("prefers explicit display number, then display sort, then current index", () => {
    expect(
      getQuestionDisplayNumber({
        displayQuestionNumber: "12",
        displayQuestionSort: 4,
      }),
    ).toBe("12");
    expect(
      getQuestionDisplayNumber({
        displayQuestionSort: 4,
      }),
    ).toBe(5);
    expect(getQuestionDisplayNumber({}, 2)).toBe(3);
  });

  it("normalizes page recognized images and returns images from the current question page", () => {
    const taskResult = normalizeTaskResult({
      pages: [
        {
          pageIndex: 1,
          questionList: [
            {
              endPageIndex: 2,
              questionSort: 1,
              type: 5,
            },
          ],
          recognizedImages: [
            {
              height: 80,
              id: "page-1-image",
              imageUrl: CURRENT_PAGE_IMAGE_URL,
              title: "第一页图",
              width: 120,
            },
          ],
        },
        {
          imageList: [
            {
              url: NEXT_PAGE_IMAGE_URL,
            },
          ],
          pageIndex: 2,
          questionList: [],
        },
      ],
    });
    const question = taskResult.pages[0].questions[0];

    expect(getQuestionSourcePageImageAssets(question, taskResult)).toEqual([
      expect.objectContaining({
        height: 80,
        id: "page-1-image",
        imageUrl: CURRENT_PAGE_IMAGE_URL,
        pageIndex: 1,
        pageNumber: 1,
        title: "第一页图",
        width: 120,
      }),
    ]);
  });

  it("uses the parent question page when resolving sub-question source images", () => {
    const taskResult = normalizeTaskResult({
      pages: [
        {
          pageIndex: 1,
          questionList: [
            {
              questionSort: 1,
              sonQuestionList: [
                {
                  draftId: "sub-question-1",
                  questionSort: 1,
                  type: 1,
                },
              ],
              type: 4,
            },
          ],
          recognizedImages: [
            {
              imageUrl: "https://example.com/page-1.png",
            },
          ],
        },
        {
          pageIndex: 2,
          questionList: [],
          recognizedImages: [
            {
              imageUrl: NEXT_PAGE_IMAGE_URL,
            },
          ],
        },
      ],
    });
    const subQuestion = taskResult.pages[0].questions[0].sonQuestionList[0];

    expect(getQuestionSourcePageImageAssets(subQuestion, taskResult)).toEqual([
      expect.objectContaining({
        imageUrl: CURRENT_PAGE_IMAGE_URL,
        pageIndex: 1,
      }),
    ]);
  });

  it("normalizes OCR media list as source page images", () => {
    const taskResult = normalizeTaskResult({
      pages: [
        {
          mediaList: [
            {
              url: "http://task.local.yungu-inc.org:8060/api/preview_file?id=9836580",
            },
            {
              url: "http://task.local.yungu-inc.org:8060/api/preview_file?id=9836581",
            },
          ],
          pageIndex: 0,
          questionList: [
            {
              pageIndex: 0,
              questionSort: 1,
              type: 5,
            },
          ],
        },
      ],
      taskId: 156,
    });
    const question = taskResult.pages[0].questions[0];

    expect(getQuestionSourcePageImageAssets(question, taskResult)).toEqual([
      expect.objectContaining({
        id: "page-1-recognized-image-1",
        imageUrl:
          "http://task.local.yungu-inc.org:8060/api/preview_file?id=9836580",
        pageIndex: 0,
        pageNumber: 1,
        title: "第 1 页图片 1",
      }),
      expect.objectContaining({
        id: "page-1-recognized-image-2",
        imageUrl:
          "http://task.local.yungu-inc.org:8060/api/preview_file?id=9836581",
        pageIndex: 0,
        pageNumber: 1,
        title: "第 1 页图片 2",
      }),
    ]);
  });

  it("creates multiple mock source images for mock tasks without recognized images", () => {
    const taskResult = normalizeTaskResult({
      pages: [
        {
          imageUrl: "https://example.com/page-5.png",
          pageIndex: 5,
          pageNumber: 5,
          questionList: [
            {
              pageIndex: 5,
              questionSort: 1,
              type: 5,
            },
          ],
        },
      ],
      taskId: "mock",
    });
    const question = taskResult.pages[0].questions[0];

    expect(getQuestionSourcePageImageAssets(question, taskResult)).toEqual([
      expect.objectContaining({
        pageIndex: 5,
        title: "第 1 页识别图 1",
      }),
      expect.objectContaining({
        pageIndex: 5,
        title: "第 1 页识别图 2",
      }),
    ]);
  });
});
