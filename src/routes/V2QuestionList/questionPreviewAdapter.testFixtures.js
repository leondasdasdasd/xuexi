const TABLE_CHOICE_COLUMN_COUNT = 3;
const NULL_VALUE = JSON.parse("null");

const richContent = (html, text = "") => ({
  html,
  json: [],
  text,
});

const createExtraType = (type, name, enName) => ({
  enName,
  name,
  type,
});

const createStemTypeElement = (_unusedReason = "default") => (
  void _unusedReason,
  {
    config: {},
    enName: "Stem",
    name: "题干",
    type: "richText",
  }
);

const createChoiceTypeElement = (renderer = "standard") => ({
  config: {
    optionLabelStyle: "upperAlpha",
    renderer,
    selectionType: "single",
  },
  enName: renderer === "table" ? "Table choices" : "Choices",
  name: renderer === "table" ? "表格选项" : "选项",
  type: "choice",
});

const createQuestionType = ({
  description,
  elements,
  enName,
  extras,
  hasAnswer = true,
  businessQuestionTypeId,
  isBuiltin,
  isSubjective = false,
  name,
  isComposite,
  typeKey,
}) => ({
  description,
  elements,
  enabled: true,
  enName,
  extras: extras ?? [
    createExtraType("solvingProcess", "解题过程", "Solving process"),
    createExtraType("scoringRule", "评分规则", "Scoring rule"),
  ],
  globalConfig: { hasAnswer },
  businessQuestionTypeId,
  isBuiltin,
  isSubjective,
  name,
  isComposite,
  typeKey,
  version: "1",
});

export const NEW_MY_QUESTION_TYPE_RESPONSES = [
  createQuestionType({
    description: "只有一个正确答案的选择题",
    elements: [createStemTypeElement(), createChoiceTypeElement()],
    enName: "Single choice",
    businessQuestionTypeId: 3,
    isBuiltin: true,
    isComposite: false,
    name: "单选题",
    typeKey: "singleChoice",
  }),
  createQuestionType({
    description: "表格形式的选择题",
    elements: [createStemTypeElement(), createChoiceTypeElement("table")],
    enName: "Table choice",
    businessQuestionTypeId: 4,
    isBuiltin: true,
    isComposite: false,
    name: "表格选择题",
    typeKey: "tableChoice",
  }),
  createQuestionType({
    description: "题干外填写答案的填空题",
    elements: [
      createStemTypeElement(),
      {
        config: {},
        enName: "Fill",
        name: "填空",
        type: "fill",
      },
    ],
    enName: "Fill in the blank",
    businessQuestionTypeId: 5,
    isBuiltin: true,
    isComposite: false,
    name: "填空题",
    typeKey: "fill",
  }),
  createQuestionType({
    description: "题干文本内直接挖空作答",
    elements: [
      {
        config: {
          allowCandidateReuse: false,
          candidateMode: "none",
        },
        enName: "Inline fill",
        name: "行内填空",
        type: "inlineFill",
      },
    ],
    enName: "Inline fill",
    businessQuestionTypeId: 6,
    isBuiltin: true,
    isComposite: false,
    name: "行内填空题",
    typeKey: "inlineFill",
  }),
  createQuestionType({
    description: "判断正误的二元题",
    elements: [
      createStemTypeElement(),
      {
        config: {
          judgeAnswerMode: "correctWrong",
        },
        enName: "Judgement",
        name: "判断",
        type: "judgement",
      },
    ],
    enName: "Judgement",
    businessQuestionTypeId: 7,
    isBuiltin: true,
    isComposite: false,
    name: "判断题",
    typeKey: "judgement",
  }),
  createQuestionType({
    description: "由多个子题组成的复合题",
    elements: [],
    enName: "Composite question",
    businessQuestionTypeId: 8,
    isBuiltin: true,
    name: "组合题",
    extras: [],
    isComposite: true,
    typeKey: "composite",
  }),
  createQuestionType({
    description: "组合题内承载材料题干和父题解析",
    elements: [createStemTypeElement()],
    enName: "Material stem",
    extras: [createExtraType("solvingProcess", "解题过程", "Solving process")],
    hasAnswer: false,
    businessQuestionTypeId: 9,
    isBuiltin: true,
    isComposite: false,
    name: "材料题干",
    typeKey: "material_stem",
  }),
];

const choiceElement = (options, answerOptionId, columnCount = 1) => ({
  answers: {
    optionIds: [answerOptionId],
  },
  columns: Array.from({ length: columnCount }, (_unusedItem, index) => ({
    content: richContent(index === 0 ? "" : `表头 ${index + 1}`),
    id: `choice-column-${index + 1}`,
  })),
  id: "choice",
  options: options.map((option, index) => ({
    cells: (columnCount === 1 ? [option] : option.split("|")).map((cell) =>
      richContent(cell),
    ),
    id: `choice-option-${index + 1}`,
  })),
  type: "choice",
});

const stemElement = (html, text = "") => ({
  content: richContent(html, text),
  type: "richText",
});

const fillElement = (answerText) => ({
  answers: [
    {
      answerPools: [richContent(answerText, answerText)],
      blankIds: ["blank_0"],
    },
  ],
  blanks: ["blank_0"],
  type: "fill",
});

const inlineFillElement = (html, answerText) => ({
  answers: [
    {
      answerPools: [richContent(answerText, answerText)],
      blankIds: ["blank_0"],
    },
  ],
  blanks: ["blank_0"],
  content: richContent(html),
  type: "inlineFill",
});

const judgementElement = (answer) => ({
  answers: [answer],
  type: "judgement",
});

const analysisExtra = (content) => ({
  content: richContent(content),
  type: "solvingProcess",
});

const createQuestionNode = ({
  children = [],
  elements,
  extras = [],
  id,
  businessQuestionTypeId,
}) => ({
  children,
  elements,
  extras,
  id,
  businessQuestionTypeId,
  version: "1",
});

const createAggregate = ({ inQuestionBasket = false, question, resource }) => ({
  createTime: "2026-07-06T17:02:33.000+08:00",
  createUserId: 1,
  id: question.id,
  modifyTime: "2026-07-06T17:02:33.000+08:00",
  extras: question.extras,
  inQuestionBasket,
  question,
  resource: {
    chapterIds: [],
    contentImage: "",
    enrollmentQuestion: false,
    gradeId: 25,
    indicatorIds: [],
    knowledgeIds: [],
    level: 1,
    mathNodeIds: [],
    outSourceId: NULL_VALUE,
    outSourceType: "",
    questionTimeLimit: NULL_VALUE,
    sourcePaperId: NULL_VALUE,
    stem: "",
    subjectId: 1,
    yearPeriodId: NULL_VALUE,
    ...resource,
  },
});

export const NEW_MY_QUESTION_AGGREGATES = [
  createAggregate({
    question: createQuestionNode({
      elements: [
        stemElement("输入题目内容"),
        choiceElement(
          ["A.选项描述", "B.选项描述", "C.选项描述", "D.选项描述"],
          "choice-option-3",
        ),
      ],
      extras: [analysisExtra("非必填,建议填写,便于学生答题后直接自查学习")],
      id: 341,
      businessQuestionTypeId: 3,
    }),
    resource: {
      stem: "输入题目内容",
    },
  }),
  createAggregate({
    question: createQuestionNode({
      elements: [
        stemElement("一个长方形长 12 厘米、宽 8 厘米，它的面积是多少？"),
        choiceElement(
          [
            "A|12 × 8|96 平方厘米",
            "B|12 + 8|20 厘米",
            "C|(12 + 8) × 2|40 厘米",
          ],
          "choice-option-1",
          TABLE_CHOICE_COLUMN_COUNT,
        ),
      ],
      id: 342,
      businessQuestionTypeId: 4,
    }),
    resource: {
      stem: "一个长方形长 12 厘米、宽 8 厘米，它的面积是多少？",
    },
  }),
  createAggregate({
    question: createQuestionNode({
      elements: [
        stemElement("计算 6 × (15 - 8)，并写出结果。"),
        fillElement("42"),
      ],
      extras: [analysisExtra("先计算括号内的减法，再完成乘法计算。")],
      id: 343,
      businessQuestionTypeId: 5,
    }),
    resource: {
      stem: "计算 6 × (15 - 8)，并写出结果。",
    },
  }),
  createAggregate({
    question: createQuestionNode({
      elements: [
        inlineFillElement("比较 3.2 米和 305 厘米，____。", "3.2 米更长"),
      ],
      id: 344,
      businessQuestionTypeId: 6,
    }),
    resource: {
      stem: "比较 3.2 米和 305 厘米，哪个更长？",
    },
  }),
  createAggregate({
    question: createQuestionNode({
      elements: [stemElement("1 米等于 100 厘米。"), judgementElement(true)],
      id: 345,
      businessQuestionTypeId: 7,
    }),
    resource: {
      stem: "1 米等于 100 厘米。",
    },
  }),
  createAggregate({
    question: createQuestionNode({
      children: [
        createQuestionNode({
          children: [
            createQuestionNode({
              elements: [
                stemElement("两个长方形周长之和比原来增加多少？"),
                choiceElement(
                  ["6 厘米", "12 厘米", "16 厘米", "24 厘米"],
                  "choice-option-2",
                ),
              ],
              id: 3462,
              businessQuestionTypeId: 3,
            }),
          ],
          elements: [
            stemElement("把一个边长 6 厘米的正方形剪成两个相同的长方形。"),
          ],
          extras: [analysisExtra("先确认剪开后新增了两条边，再比较周长变化。")],
          id: 3461,
          businessQuestionTypeId: 9,
        }),
      ],
      elements: [],
      extras: [],
      id: 346,
      businessQuestionTypeId: 8,
    }),
    resource: {
      stem: "把一个边长 6 厘米的正方形剪成两个相同的长方形。",
    },
  }),
];

export const createNewMyQuestionMockPage = (_unusedReason = "default") => (
  void _unusedReason,
  {
    data: NEW_MY_QUESTION_AGGREGATES,
    total: NEW_MY_QUESTION_AGGREGATES.length,
  }
);

export const queryNewMyBusinessQuestionTypesByIds = (ids) => {
  const idSet = new Set(ids.map(Number));

  return NEW_MY_QUESTION_TYPE_RESPONSES.filter((type) =>
    idSet.has(type.businessQuestionTypeId),
  );
};
