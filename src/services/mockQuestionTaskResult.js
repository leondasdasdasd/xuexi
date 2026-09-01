const PAGE_WIDTH = 900;
const PAGE_HEIGHT = 1260;
const QUESTION_TOP = 180;
const QUESTION_HEIGHT = 170;
const QUESTION_GAP = 38;
const QUESTION_LEFT = 84;
const QUESTION_RIGHT = 816;

const escapeSvgText = (value) =>
  String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");

const createSvgDataUrl = (pageNumber, pageQuestions) => {
  const questionNodes = pageQuestions
    .map((question, index) => {
      const top = QUESTION_TOP + index * (QUESTION_HEIGHT + QUESTION_GAP);
      const title = `${question.questionSort}. ${question.previewTitle}`;
      return `
      <rect x="${QUESTION_LEFT}" y="${top}" width="${QUESTION_RIGHT - QUESTION_LEFT}" height="${QUESTION_HEIGHT}" rx="8" fill="#ffffff" stroke="#cbd5e1" />
      <text x="${QUESTION_LEFT + 24}" y="${top + 42}" font-size="21" font-family="Arial, sans-serif" fill="#0f172a">${escapeSvgText(title)}</text>
      <text x="${QUESTION_LEFT + 24}" y="${top + 80}" font-size="16" font-family="Arial, sans-serif" fill="#334155">${escapeSvgText(question.previewLine1)}</text>
      <text x="${QUESTION_LEFT + 24}" y="${top + 112}" font-size="16" font-family="Arial, sans-serif" fill="#334155">${escapeSvgText(question.previewLine2)}</text>
    `;
    })
    .join("");

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${PAGE_WIDTH}" height="${PAGE_HEIGHT}" viewBox="0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}">
      <rect width="${PAGE_WIDTH}" height="${PAGE_HEIGHT}" fill="#ffffff" />
      <text x="450" y="104" text-anchor="middle" font-size="26" font-family="Arial, sans-serif" font-weight="700" fill="#0f172a">2026年山东济南历下区初三中考一模数学试卷</text>
      <text x="84" y="148" font-size="17" font-family="Arial, sans-serif" fill="#64748b">学生用卷 mock，第 ${pageNumber} 页。用于演示分页预览、题目框线、编辑与 AI 补充解析。</text>
      ${questionNodes}
    </svg>
  `;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
};

const createAnswerFileDataUrl = () => {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="900" height="1260" viewBox="0 0 900 1260">
      <rect width="900" height="1260" fill="#ffffff" />
      <text x="450" y="110" text-anchor="middle" font-size="28" font-family="Arial, sans-serif" font-weight="700" fill="#0f172a">答案文件 Mock</text>
      <text x="84" y="170" font-size="18" font-family="Arial, sans-serif" fill="#334155">真实环境中这里会打开上传的答案文件预览。</text>
      <text x="84" y="220" font-size="18" font-family="Arial, sans-serif" fill="#334155">当前学生用卷未包含标准答案，本文件仅用于演示“查看答案文件”入口。</text>
      <text x="84" y="290" font-size="16" font-family="Arial, sans-serif" fill="#64748b">建议后续答案文件接入：优先展示原始答案文件，其次展示 AI/Word 解码后的结构化答案。</text>
    </svg>
  `;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
};

const createAnswerTextPages = () => [
  {
    pageNumber: 1,
    title: "2026年山东济南历下区初三中考一模数学试卷 参考答案与解析",
    sections: [
      {
        title: "一、选择题",
        description:
          "每题 4 分，共 40 分。以下为用户上传答案卷经解析后的结构化文本。",
        items: [
          {
            number: 1,
            answer: "D",
            analysis: "无理数不能写成两个整数之比，结合选项逐一排除有理数。",
          },
          {
            number: 2,
            answer: "B",
            analysis: "俯视图从上向下观察，保留水平投影的方块位置。",
          },
          {
            number: 3,
            answer: "C",
            analysis: "科学记数法写作 a x 10^n，其中 1 <= a < 10。",
          },
          {
            number: 4,
            answer: "A",
            analysis:
              "同时满足轴对称和中心对称的图形需要分别验证对称轴和对称中心。",
          },
          {
            number: 5,
            answer: "D",
            analysis: "根据幂运算、合并同类项及平方差公式判断。",
          },
          {
            number: 6,
            answer: "A",
            analysis: "结合数轴上 a、b 与 0 的位置判断绝对值和符号。",
          },
          {
            number: 7,
            answer: "C",
            analysis: "利用网格点坐标计算长度、斜率或面积后判断。",
          },
          {
            number: 8,
            answer: "B",
            analysis: "两人各有 3 种选择，共 9 种等可能结果，同一轮共有 3 种。",
          },
          {
            number: 9,
            answer: "A",
            analysis:
              "角平分线与垂直平分线交点满足到角两边和线段端点的距离关系。",
          },
          {
            number: 10,
            answer: "C",
            analysis: "由重叠面积函数图象分段变化判断平移距离和面积关系。",
          },
        ],
      },
      {
        title: "二、填空题",
        description: "每题 4 分，共 20 分。填空题答案按空位顺序输出。",
        items: [
          {
            number: 11,
            answer: "(x+2)(x-2)",
            analysis: "先观察是否符合平方差公式，再分解因式。",
          },
          {
            number: 12,
            answer: "1/4",
            analysis: "概率等于阴影方砖面积与总面积之比。",
          },
          {
            number: 13,
            answer: "60°",
            analysis: "正六边形内角为 120°，结合平行四边形平行关系求角。",
          },
          {
            number: 14,
            answer: "6",
            analysis: "由函数图象交点对应时间得到两人相遇时刻。",
          },
          {
            number: 15,
            answer: "2√2",
            analysis: "根据折叠前后对应线段相等，再用勾股定理求解。",
          },
        ],
      },
    ],
  },
  {
    pageNumber: 2,
    title: "解答题与组合题解析",
    sections: [
      {
        title: "三、解答题",
        description: "解答题保留主要步骤，方便老师核对解析完整性。",
        items: [
          {
            number: 16,
            answer: "见解析",
            analysis: "先进行乘方、开方或绝对值化简，再合并同类项。",
          },
          {
            number: 17,
            answer: "整数解为 -1，0，1",
            analysis: "分别解两个不等式，取公共解集，再列出整数解。",
          },
          {
            number: 18,
            answer: "证明成立",
            analysis: "利用菱形对角线互相垂直平分及全等三角形证明目标结论。",
          },
          {
            number: 19,
            answer: "距离与三角函数值见步骤",
            analysis: "作辅助线构造直角三角形，先求距离，再求三角函数。",
          },
          {
            number: 20,
            answer: "切线证明成立，线段长度见步骤",
            analysis: "连接半径，证明半径垂直目标直线，再通过相似或勾股求长。",
          },
        ],
      },
      {
        title: "四、组合题",
        description: "组合题保留公共题干下的子题答案。",
        items: [
          {
            number: "25-1",
            answer: "B",
            analysis: "根据宽为 x、围栏总长 40，表示长并列出面积表达式。",
          },
          {
            number: "25-2",
            answer: "192",
            analysis: "将 x = 8 代入面积表达式计算。",
          },
          {
            number: "25-3",
            answer: "错误",
            analysis: "需要在面积固定的前提下讨论周长，不能脱离条件直接判断。",
          },
          {
            number: "25-4",
            answer: "见解析",
            analysis: "面积固定时长宽越接近，周长越小，因此越节省围栏。",
          },
        ],
      },
    ],
  },
];

const toPosList = (index) => {
  const top = QUESTION_TOP + index * (QUESTION_HEIGHT + QUESTION_GAP);
  const bottom = top + QUESTION_HEIGHT;
  return [
    [
      { x: QUESTION_LEFT, y: top },
      { x: QUESTION_RIGHT, y: top },
      { x: QUESTION_RIGHT, y: bottom },
      { x: QUESTION_LEFT, y: bottom },
    ],
  ];
};

const createChoiceOptions = () => [
  { answers: "A. 选项 A", key: "A" },
  { answers: "B. 选项 B", key: "B" },
  { answers: "C. 选项 C", key: "C" },
  { answers: "D. 选项 D", key: "D" },
];

const getDefaultQuestionScore = (question) => {
  if (
    question &&
    question.questionScore !== undefined &&
    question.questionScore !== null
  ) {
    return question.questionScore;
  }

  if (Number(question && question.type) === 6) {
    const subQuestionScores = (
      Array.isArray(question && question.sonQuestionList)
        ? question.sonQuestionList
        : []
    ).map((subQuestion) => Number(getDefaultQuestionScore(subQuestion)) || 0);
    const totalScore = subQuestionScores.reduce(
      (total, score) => total + score,
      0,
    );

    return totalScore || "";
  }

  if (Number(question && question.type) === 5) {
    return 8;
  }

  return 4;
};

const rawQuestions = [
  {
    analysis:
      "无理数不能写成两个整数之比，结合选项逐一排除有理数，最后确定正确答案。",
    answer: "D",
    content: "下列关于细胞呼吸的叙述，正确的是（ ）．",
    optionList: [
      { answers: "有氧呼吸只在线粒体中进行", key: "A" },
      { answers: "无氧呼吸不产生 ATP", key: "B" },
      { answers: "细胞呼吸的产物都是 CO2 和 H2O", key: "C" },
      { answers: "细胞呼吸是细胞内的放能反应", key: "D" },
    ],
    previewLine1: "下列关于细胞呼吸的叙述，正确的是（ ）．",
    previewLine2: "A. 有氧呼吸只在线粒体中进行  B. 无氧呼吸不产生 ATP",
    previewTitle: "选择题",
    type: 1,
  },
  {
    content: "如图是由几个大小相同的小立方块搭成的几何体，它的俯视图是（ ）．",
    previewLine1: "如图是由几个大小相同的小立方块搭成的几何体，",
    previewLine2: "它的俯视图是（ ）．",
    previewTitle: "选择题",
    type: 1,
  },
  {
    content:
      "“十四五”期间，济南市打造了市一体化大数据平台，建成全市通用共享“数据湖”，累计汇聚数据约若干条，有效支撑了多种应用场景。数据可用科学记数法表示为（ ）．",
    previewLine1: "济南市一体化大数据平台累计汇聚大量数据，",
    previewLine2: "数据可用科学记数法表示为（ ）．",
    previewTitle: "选择题",
    type: 1,
  },
  {
    content: "下列图形中，既是轴对称图形又是中心对称图形的是（ ）．",
    previewLine1: "下列图形中，既是轴对称图形",
    previewLine2: "又是中心对称图形的是（ ）．",
    previewTitle: "选择题",
    type: 1,
  },
  {
    content: "下列运算正确的是（ ）．",
    previewLine1: "下列运算正确的是（ ）．",
    previewLine2: "A. 选项 A   B. 选项 B   C. 选项 C   D. 选项 D",
    previewTitle: "选择题",
    type: 1,
  },
  {
    content:
      "实数 a，b 在数轴上的对应点的位置如图所示，下列结论中正确的是（ ）．",
    previewLine1: "实数 a，b 在数轴上的对应点的位置如图所示，",
    previewLine2: "下列结论中正确的是（ ）．",
    previewTitle: "选择题",
    type: 1,
  },
  {
    content:
      "如图，在由边长为 1 个单位长度的小正方形组成的网格中，点 A，B，C，D，E 都在网格的格点上，则下列结论中不正确的是（ ）．",
    previewLine1: "网格中多个点都在格点上，",
    previewLine2: "判断下列结论中不正确的一项。",
    previewTitle: "选择题",
    type: 1,
  },
  {
    content:
      "央视春晚推出智能互动红包活动，观众可以参与三轮抢红包活动。如果小明和小红都只参与了其中一轮，那么小明和小红参与的是同一轮的概率是（ ）．",
    previewLine1: "三轮抢红包活动中，两人都只参与一轮，",
    previewLine2: "求两人参与同一轮的概率。",
    previewTitle: "选择题",
    type: 1,
  },
  {
    content:
      "如图，在三角形中按步骤作角平分线和垂直平分线。根据以上作图，若给定边长条件，求点到直线的距离。",
    previewLine1: "根据尺规作图条件与已知边长，",
    previewLine2: "求点到直线的距离。",
    previewTitle: "选择题",
    type: 1,
  },
  {
    content:
      "如图，在三角形中，为边上的中线，将三角形沿射线方向平移，结合重叠面积与平移距离的函数图象，判断给出的结论中正确的个数。",
    previewLine1: "三角形平移与重叠面积函数图象问题，",
    previewLine2: "判断多个结论的正确个数。",
    previewTitle: "选择题",
    type: 1,
  },
  {
    content: "因式分解：__________．",
    previewLine1: "因式分解：__________．",
    previewLine2: "请填写结果。",
    previewTitle: "填空题",
    type: 3,
  },
  {
    content:
      "小球在如图所示的地板上自由滚动，并随机停留在某块方砖上，求它最终停留在阴影区域的概率。",
    previewLine1: "小球随机停留在方砖上，",
    previewLine2: "求停留在阴影区域的概率。",
    previewTitle: "填空题",
    type: 3,
  },
  {
    content:
      "如图，平行四边形的顶点在正六边形的边上，结合已知角度条件，求指定角的度数。",
    previewLine1: "平行四边形与正六边形组合图形，",
    previewLine2: "求指定角的度数。",
    previewTitle: "填空题",
    type: 3,
  },
  {
    content:
      "小云和小涛分别从相距一定距离的 A，B 两地同时出发，相向而行。根据两人距 A 地的距离与时间的函数图象，求两人相遇的时间。",
    previewLine1: "根据两人运动的函数图象，",
    previewLine2: "求两人相遇时间。",
    previewTitle: "填空题",
    type: 3,
  },
  {
    content:
      "如图，正方形纸片经过两次折叠，结合中点、折痕和交点关系，求指定线段长度。",
    previewLine1: "正方形纸片折叠问题，",
    previewLine2: "根据折叠关系求线段长度。",
    previewTitle: "填空题",
    type: 3,
  },
  {
    content: "计算给定代数式或实数运算。",
    previewLine1: "计算题。",
    previewLine2: "按运算顺序化简求值。",
    previewTitle: "解答题",
    type: 5,
  },
  {
    content: "解不等式组，并写出它的所有整数解。",
    previewLine1: "解不等式组，",
    previewLine2: "并写出所有整数解。",
    previewTitle: "解答题",
    type: 5,
  },
  {
    content:
      "已知：如图，在菱形 ABCD 中，E，F 是对角线上的两点，连接相关线段。求证指定线段或角相等。",
    previewLine1: "菱形中对角线上的点与连线关系，",
    previewLine2: "完成几何证明。",
    previewTitle: "证明题",
    type: 5,
  },
  {
    content:
      "如图，在四边形中，已知若干边长和角度，连接对角线。求平行线之间的距离，并求指定三角函数值。",
    previewLine1: "四边形中的距离与三角函数问题，",
    previewLine2: "包含两个小问。",
    previewTitle: "解答题",
    type: 5,
  },
  {
    content:
      "如图，AB 为圆的直径，点 C 为圆上一点，结合中点、弦交点和延长线条件，证明直线为圆的切线，并求线段长度。",
    previewLine1: "圆中切线证明与线段计算，",
    previewLine2: "包含证明和计算两个小问。",
    previewTitle: "解答题",
    type: 5,
  },
  {
    content:
      "为了解青年人才在济发展需求，学校组织学生进行问卷调查，并根据条形统计图和扇形统计图回答问题。",
    previewLine1: "统计图表综合题，",
    previewLine2: "涉及总人数、圆心角、补图和估计。",
    previewTitle: "统计题",
    type: 5,
  },
  {
    content:
      "某运动场馆采购 A，B 两种型号的计数跳绳。根据单价关系和购买数量关系，求两种型号单价，并求最少采购费用方案。",
    previewLine1: "分式方程与一次函数最优化问题，",
    previewLine2: "求单价和最少采购费用。",
    previewTitle: "应用题",
    type: 5,
  },
  {
    content:
      "一次函数图象与反比例函数图象交于点，并与坐标轴相交。求参数值，并研究反比例函数上一点满足条件时的长度或参数。",
    previewLine1: "一次函数与反比例函数综合题，",
    previewLine2: "包含参数求解、长度计算和面积条件。",
    previewTitle: "函数综合题",
    type: 5,
  },
  {
    content:
      "二次函数图象经过两点，与坐标轴交于点，顶点为 D。求函数表达式和顶点坐标，并研究平移后新函数的图象与面积条件。",
    previewLine1: "二次函数图象与平移综合题，",
    previewLine2: "求表达式、顶点、面积和新函数。",
    previewTitle: "函数综合题",
    type: 5,
  },
  {
    content:
      "在矩形中连接对角线，并将三角形绕点旋转。根据点在线段或延长线上的位置，求线段长度及最大值。",
    previewLine1: "矩形、旋转与最值综合题，",
    previewLine2: "包含填空、长度计算和最大值。",
    previewTitle: "几何综合题",
    type: 5,
  },
  {
    content:
      "某学校计划在劳动实践基地旁建设一个矩形节水展示区，展示区一侧靠墙，另外三侧使用围栏。已知围栏总长为 40 米，请结合函数与图形知识完成下面各题。",
    previewLine1: "组合题：共享同一背景材料，",
    previewLine2: "包含选择、填空、判断、问答四类子题。",
    previewTitle: "组合题",
    sonQuestionList: [
      {
        answer: "B",
        content: "若展示区宽为 x 米，则展示区面积 S 关于 x 的表达式是（ ）．",
        type: 1,
      },
      {
        content: "当展示区宽为 8 米时，展示区的面积为 ________ 平方米。",
        gapAnswers: ["192"],
        type: 3,
      },
      {
        answer: "false",
        content:
          "“矩形面积固定时，长和宽越接近，所需围栏越少”这一说法是 ________．",
        type: 4,
      },
      {
        answer:
          "面积固定时，长和宽越接近，矩形周长越小；当长和宽相等时周长最小，因此设计成接近正方形更节省围栏。",
        content:
          "请结合本题背景，说明为什么展示区的长和宽越接近，围栏使用越节省。",
        type: 5,
      },
    ],
    type: 6,
  },
];

const buildQuestionDraft = (question, index, pageQuestionIndex = null) => ({
  analysis: question.analysis || "",
  answer: question.answer || "",
  content: question.content,
  gapFillingAnswer:
    question.type === 3
      ? {
          answers: Array.isArray(question.gapAnswers)
            ? question.gapAnswers
            : [],
          isOrder: false,
        }
      : null,
  optionList:
    question.type === 1 || question.type === 2
      ? Array.isArray(question.optionList) && question.optionList.length > 0
        ? question.optionList
        : createChoiceOptions()
      : [],
  posList: pageQuestionIndex === null ? [] : toPosList(pageQuestionIndex),
  questionLevel:
    question.questionLevel || (index >= 20 ? 3 : index >= 15 ? 2 : 1),
  questionScore: getDefaultQuestionScore(question),
  questionSort: index + 1,
  sonQuestionList: (Array.isArray(question.sonQuestionList)
    ? question.sonQuestionList
    : []
  ).map((subQuestion, subQuestionIndex) =>
    buildQuestionDraft(subQuestion, subQuestionIndex),
  ),
  type: question.type,
});

export const getMockQuestionTaskResult = () => {
  const pageSize = 5;
  const pages = [];

  for (
    let pageIndex = 0;
    pageIndex < Math.ceil(rawQuestions.length / pageSize);
    pageIndex += 1
  ) {
    const start = pageIndex * pageSize;
    const pageQuestions = rawQuestions
      .slice(start, start + pageSize)
      .map((question, index) => ({
        ...question,
        questionSort: start + index + 1,
      }));

    pages.push({
      imageUrl: createSvgDataUrl(pageIndex + 1, pageQuestions),
      pageIndex: pageIndex + 1,
      questions: pageQuestions.map((question, index) =>
        buildQuestionDraft(question, start + index, index),
      ),
    });
  }

  return {
    answerPages: [
      {
        imageUrl: createAnswerFileDataUrl(),
        itemStatus: 3,
        pageIndex: 1,
      },
    ],
    answerFileUrl: createAnswerFileDataUrl(),
    answerSheetMarkdown:
      "## 参考答案与解析\n\n1. D：无理数不能写成两个整数之比。\n2. B：俯视图保留水平投影。\n3. C：科学记数法写作 `a x 10^n`。",
    answerTextPages: createAnswerTextPages(),
    examPaperId: 20_260_417,
    gradeId: 9,
    pages,
    status: 3,
    subjectId: 2,
    taskId: "mock",
  };
};
