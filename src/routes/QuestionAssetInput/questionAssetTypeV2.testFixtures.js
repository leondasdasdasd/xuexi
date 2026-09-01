const createCommonExtras = (_unusedReason = "default") => {
  void _unusedReason;
  return [
    {
      enName: "Solving process",
      name: "解题过程",
      type: "solvingProcess",
    },
    {
      enName: "Scoring rule",
      name: "评分规则",
      type: "scoringRule",
    },
  ];
};

const createStemElement = (_unusedReason = "default") => (
  void _unusedReason,
  {
    config: {},
    enName: "Stem",
    name: "题干",
    type: "richText",
  }
);

export const QUESTION_ASSET_TYPE_V2_FIXTURES = [
  {
    description: "适用于由多个子题组成的复合题",
    elements: [],
    enabled: true,
    enName: "Composite question",
    extras: [],
    globalConfig: { hasAnswer: true },
    businessQuestionTypeId: 1,
    isBuiltin: true,
    isSubjective: false,
    name: "服务端组合题",
    isComposite: true,
    typeKey: "composite",
    version: "1",
  },
  {
    description: "适用于组合题内承载材料题干和父题解析",
    elements: [createStemElement()],
    enabled: true,
    enName: "Material stem",
    extras: [createCommonExtras()[0]],
    globalConfig: { hasAnswer: false },
    businessQuestionTypeId: 2,
    isBuiltin: true,
    isSubjective: false,
    name: "服务端材料题干",
    isComposite: false,
    typeKey: "material_stem",
    version: "1",
  },
  {
    description: "适用于只有一个正确答案的选择题",
    elements: [
      createStemElement(),
      {
        config: {
          optionLabelStyle: "upperAlpha",
          renderer: "standard",
          selectionType: "single",
        },
        enName: "Options",
        name: "选项",
        type: "choice",
      },
    ],
    enabled: true,
    enName: "Single choice",
    extras: createCommonExtras(),
    globalConfig: { hasAnswer: true },
    businessQuestionTypeId: 3,
    isBuiltin: true,
    isSubjective: false,
    name: "服务端单选",
    isComposite: false,
    typeKey: "single_choice",
    version: "1",
  },
  {
    description: "适用于在题干文本内直接挖空作答",
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
    enabled: true,
    enName: "Inline fill",
    extras: createCommonExtras(),
    globalConfig: { hasAnswer: true },
    businessQuestionTypeId: 6,
    isBuiltin: true,
    isSubjective: false,
    name: "服务端行内填空",
    isComposite: false,
    typeKey: "inline_fill",
    version: "1",
  },
];
