import JSZip from "jszip";

const MAX_TREE_LEVEL = 7;
const KNOWLEDGE_TREE_SHEET_NAME = "知识点树";
const KNOWLEDGE_TREE_HEADERS = [
  "一级",
  "二级",
  "三级",
  "四级",
  "五级",
  "六级",
  "七级",
].map((levelName) => `${levelName}知识点`);

const VERSION_OPTIONS = [
  { id: 2, name: "人教版" },
  { id: 4, name: "青岛版（六三制）" },
  { id: 7, name: "部编版" },
  { id: 1, name: "浙教版" },
];

const stageNameMap = {
  幼儿园段: "幼儿园",
  幼儿段: "幼儿园",
  小学段: "小学",
  初中段: "初中",
  高中段: "高中",
};

/**
 * 判断知识点定义是否包含历史 HTML 标签。
 * @param {unknown} value 原始定义内容
 * @returns {boolean} 是否包含 HTML 标签
 */
const hasHtmlTag = (value = "") => /<\/?[a-z][^>]*>/i.test(String(value || ""));

/**
 * 将知识点定义归一化为页面可编辑的纯文本。
 * @param {unknown} value 原始定义内容
 * @returns {string} 去除历史 HTML 后的定义文本
 */
const normalizeDefinitionText = (value = "") => {
  const content = String(value || "");
  if (!hasHtmlTag(content)) return content.trim();
  return content
    .split(/<[^>]*>/)
    .join(" ")
    .split(/\s+/)
    .join(" ")
    .trim();
};

/**
 * 从后端历史兼容字段中读取知识点定义。
 * @param {object} item 后端知识点节点
 * @returns {string} 规范化后的定义文本
 */
const resolveKnowledgeDefinitionText = (item = {}) =>
  normalizeDefinitionText(
    item.definitionText ||
      item.definition ||
      item.knowledgeDefinition ||
      item.describe ||
      item.description ||
      item.knowledgeDescribe ||
      item.knowledgeDescription ||
      "",
  );

/**
 *
 * @param name
 */
function normalizeStageName(name = "") {
  if (!name) return "";
  return stageNameMap[name] || String(name).replace(/段$/, "");
}

/**
 *
 * @param value
 */
function normalizeNodeName(value = "") {
  return String(value || "")
    .replace(
      /^(单元|章节|课时|一级|二级|三级|四级|五级|六级|七级)\s*[|｜]\s*/,
      "",
    )
    .trim();
}

/**
 * 将后端教材册响应转换为页面内部使用的册别模型。
 * @param books 后端教材册列表
 * @param scope 当前学段、学科和版本上下文
 */
function adaptBackendTextbookBooks(books = [], scope = {}) {
  return (books || []).map((item) => {
    const volumeType = item.volumeType || item.volumeName || "";
    const displayName =
      item.displayName ||
      item.aliasName ||
      `${item.gradeName || ""}${volumeType}`;
    const id = [
      scope.stage || "stage",
      scope.subjectId || "subject",
      scope.versionId || "version",
      item.gradeId || "grade",
      volumeType || "volume",
    ].join("_");
    return {
      id,
      stage: scope.stage,
      stageName: normalizeStageName(scope.stageName),
      subjectId: scope.subjectId,
      subjectName: scope.subjectName,
      versionId: scope.versionId,
      versionName: scope.versionName,
      gradeId: item.gradeId,
      gradeName: item.gradeName,
      volumeName: volumeType,
      volumeType,
      bookName: displayName,
      sortNo: item.sortNo,
      configured: item.configured,
      catalog: [],
    };
  });
}

/**
 * 将后端章节树转换为页面树节点，并把关系明细拆成知识点 ID。
 * @param nodes 后端章节树
 * @param level 当前树层级
 */
function adaptBackendChapterTree(nodes = [], level = 1) {
  return (nodes || []).map((item) => {
    const knowledgeRelations = item.knowledges || [];
    const name = normalizeNodeName(item.name || item.text || item.title);
    const nextItem = {
      ...item,
      key: item.id,
      name,
      title: name,
      text: name,
      level: item.level || level,
      volumeType: item.volumeType,
      knowledgeIds: knowledgeRelations.map((relation) => relation.knowledgeId),
      knowledgeIdList: knowledgeRelations.map(
        (relation) => relation.knowledgeId,
      ),
    };
    nextItem.children = adaptBackendChapterTree(item.children || [], level + 1);
    return nextItem;
  });
}

/**
 * 将后端知识点树转换为页面树节点，补齐页面展示字段。
 * @param nodes 后端知识点树
 * @param level 当前树层级
 */
function adaptBackendKnowledgeTree(nodes = [], level = 1) {
  return (nodes || []).map((item) => {
    const name = normalizeNodeName(
      item.knowledgeName || item.text || item.name || item.title,
    );
    const nextItem = {
      ...item,
      key: item.id,
      name,
      text: name,
      title: name,
      knowledgeName: name,
      definitionText: resolveKnowledgeDefinitionText(item),
      level: item.level || level,
      _treeLevel: item.level || level,
    };
    nextItem.children = adaptBackendKnowledgeTree(
      item.children || [],
      level + 1,
    );
    return nextItem;
  });
}

/**
 * 构建章节关联知识点保存请求项。
 * @param knowledgeIds 已选知识点 ID
 */
function buildChapterKnowledgeRequestItems(knowledgeIds = []) {
  return (knowledgeIds || []).map((knowledgeId, index) => ({
    knowledgeId,
    sortNo: (index + 1) * 10,
  }));
}

/**
 *
 * @param id
 * @param name
 * @param children
 * @param knowledgeIds
 */
function node(id, name, children = [], knowledgeIds = []) {
  return {
    id,
    key: id,
    name,
    title: name,
    text: name,
    knowledgeIds,
    children,
  };
}

/**
 *
 * @param prefix
 * @param volume
 */
function mathCatalog(prefix, volume) {
  if (volume === "下册") {
    return [
      node(`${prefix}_u5`, "第五章 相交线与平行线", [
        node(`${prefix}_u5_s1`, "相交线"),
        node(`${prefix}_u5_s2`, "平行线及其判定"),
        node(`${prefix}_u5_s3`, "平行线的性质"),
      ]),
      node(`${prefix}_u6`, "第六章 实数", [
        node(`${prefix}_u6_s1`, "平方根"),
        node(`${prefix}_u6_s2`, "立方根"),
        node(`${prefix}_u6_s3`, "实数"),
      ]),
      node(`${prefix}_u8`, "第八章 二元一次方程组", [
        node(`${prefix}_u8_s1`, "二元一次方程组"),
        node(`${prefix}_u8_s2`, "消元解方程组"),
      ]),
    ];
  }
  return [
    node(`${prefix}_u1`, "第一章 有理数", [
      node(`${prefix}_u1_s1`, "正数和负数", [
        node(`${prefix}_u1_s1_l1`, "正负数的意义"),
        node(`${prefix}_u1_s1_l2`, "用正负数表示相反意义的量"),
      ]),
      node(`${prefix}_u1_s2`, "有理数"),
      node(`${prefix}_u1_s3`, "有理数的加减法"),
      node(`${prefix}_u1_s4`, "有理数的乘除法"),
      node(`${prefix}_u1_s5`, "有理数的乘方"),
    ]),
    node(`${prefix}_u2`, "第二章 整式的加减", [
      node(`${prefix}_u2_s1`, "整式"),
      node(`${prefix}_u2_s2`, "整式的加减"),
    ]),
    node(`${prefix}_u3`, "第三章 一元一次方程", [
      node(`${prefix}_u3_s1`, "从算式到方程"),
      node(`${prefix}_u3_s2`, "解一元一次方程", [
        node(`${prefix}_u3_s2_l1`, "移项与合并同类项", [
          node(`${prefix}_u3_s2_l1_p1`, "移项法则", [
            node(`${prefix}_u3_s2_l1_p1_a1`, "等式性质依据", [
              node(`${prefix}_u3_s2_l1_p1_a1_d1`, "符号变化检查"),
            ]),
          ]),
        ]),
      ]),
      node(`${prefix}_u3_s3`, "实际问题与一元一次方程"),
    ]),
  ];
}

/**
 *
 * @param prefix
 * @param volume
 */
function qingdaoMathCatalog(prefix, volume) {
  if (volume === "下册") {
    return [
      node(`${prefix}_u5`, "第五章 代数式与函数初步", [
        node(`${prefix}_u5_s1`, "变量之间的关系"),
        node(`${prefix}_u5_s2`, "函数的初步认识"),
      ]),
      node(`${prefix}_u6`, "第六章 数据的收集与整理", [
        node(`${prefix}_u6_s1`, "数据收集"),
        node(`${prefix}_u6_s2`, "统计图的选择"),
      ]),
      node(`${prefix}_u7`, "第七章 相交线与平行线", [
        node(`${prefix}_u7_s1`, "相交线"),
        node(`${prefix}_u7_s2`, "平行线的判定与性质"),
      ]),
    ];
  }
  return [
    node(`${prefix}_u1`, "第一章 基本的几何图形", [
      node(`${prefix}_u1_s1`, "生活中的立体图形"),
      node(`${prefix}_u1_s2`, "点、线、面、体"),
    ]),
    node(`${prefix}_u2`, "第二章 有理数", [
      node(`${prefix}_u2_s1`, "有理数的意义"),
      node(`${prefix}_u2_s2`, "有理数的运算"),
    ]),
    node(`${prefix}_u3`, "第三章 代数式", [
      node(`${prefix}_u3_s1`, "字母表示数"),
      node(`${prefix}_u3_s2`, "代数式求值"),
    ]),
    node(`${prefix}_u4`, "第四章 一元一次方程", [
      node(`${prefix}_u4_s1`, "方程的意义"),
      node(`${prefix}_u4_s2`, "方程的解法"),
    ]),
  ];
}

/**
 *
 * @param prefix
 * @param volume
 */
function chineseCatalog(prefix, volume) {
  if (volume === "下册") {
    return [
      node(`${prefix}_u1`, "识字（一）", [
        node(`${prefix}_u1_l1`, "春夏秋冬"),
        node(`${prefix}_u1_l2`, "姓氏歌"),
        node(`${prefix}_u1_l3`, "小青蛙"),
        node(`${prefix}_u1_l4`, "猜字谜"),
      ]),
      node(`${prefix}_u2`, "课文（一）", [
        node(`${prefix}_u2_l1`, "吃水不忘挖井人"),
        node(`${prefix}_u2_l2`, "我多想去看看"),
        node(`${prefix}_u2_l3`, "一个接一个"),
      ]),
    ];
  }
  return [
    node(`${prefix}_u1`, "我上学了", [
      node(`${prefix}_u1_l1`, "我是中国人"),
      node(`${prefix}_u1_l2`, "我是小学生"),
      node(`${prefix}_u1_l3`, "我爱学语文"),
    ]),
    node(`${prefix}_u2`, "识字（一）", [
      node(`${prefix}_u2_l1`, "天地人"),
      node(`${prefix}_u2_l2`, "金木水火土"),
      node(`${prefix}_u2_l3`, "口耳目"),
      node(`${prefix}_u2_l4`, "日月水火"),
      node(`${prefix}_u2_l5`, "对韵歌"),
    ]),
    node(`${prefix}_u3`, "汉语拼音", [
      node(`${prefix}_u3_l1`, "a o e"),
      node(`${prefix}_u3_l2`, "i u ü y w"),
      node(`${prefix}_u3_l3`, "b p m f"),
    ]),
  ];
}

/**
 *
 * @param prefix
 * @param volume
 * @param versionId
 */
function kindergartenLanguageCatalog(prefix, volume, versionId) {
  if (Number(versionId) === 4) {
    return volume === "下册"
      ? [
          node(`${prefix}_u1`, "主题一 春天的声音", [
            node(`${prefix}_u1_l1`, "听雨点唱歌"),
            node(`${prefix}_u1_l2`, "春天里的问答"),
          ]),
          node(`${prefix}_u2`, "主题二 童话表达", [
            node(`${prefix}_u2_l1`, "小动物开会"),
            node(`${prefix}_u2_l2`, "故事接龙"),
          ]),
        ]
      : [
          node(`${prefix}_u1`, "主题一 我会介绍自己", [
            node(`${prefix}_u1_l1`, "我的名字"),
            node(`${prefix}_u1_l2`, "我的好朋友"),
          ]),
          node(`${prefix}_u2`, "主题二 听说游戏", [
            node(`${prefix}_u2_l1`, "听指令做动作"),
            node(`${prefix}_u2_l2`, "一句话讲清楚"),
          ]),
        ];
  }
  return volume === "下册"
    ? [
        node(`${prefix}_u1`, "第一单元 生活讲述", [
          node(`${prefix}_u1_l1`, "春游见闻"),
          node(`${prefix}_u1_l2`, "我的发现"),
        ]),
        node(`${prefix}_u2`, "第二单元 绘本阅读", [
          node(`${prefix}_u2_l1`, "看图猜故事"),
          node(`${prefix}_u2_l2`, "角色对话"),
        ]),
      ]
    : [
        node(`${prefix}_u1`, "第一单元 语言基础", [
          node(`${prefix}_u1_l1`, "基础概念入门"),
          node(`${prefix}_u1_l2`, "核心方法"),
        ]),
        node(`${prefix}_u2`, "第二单元 综合应用", [
          node(`${prefix}_u2_l1`, "情境任务"),
          node(`${prefix}_u2_l2`, "单元练习"),
        ]),
      ];
}

/**
 *
 * @param prefix
 * @param subjectName
 * @param volume
 * @param versionId
 */
function genericCatalog(prefix, subjectName, volume, versionId) {
  const versionPrefix = Number(versionId) === 4 ? "青岛版项目" : "基础";
  const volumeSuffix = volume === "下册" ? "拓展" : "入门";
  return [
    node(
      `${prefix}_u1`,
      `第一单元 ${versionPrefix}${subjectName || "学科"}${volumeSuffix}`,
      [
        node(`${prefix}_u1_l1`, `${volumeSuffix}概念`),
        node(
          `${prefix}_u1_l2`,
          Number(versionId) === 4 ? "探究方法" : "核心方法",
        ),
      ],
    ),
    node(
      `${prefix}_u2`,
      Number(versionId) === 4 ? "第二单元 项目实践" : "第二单元 综合应用",
      [
        node(
          `${prefix}_u2_l1`,
          Number(versionId) === 4 ? "项目任务" : "情境任务",
        ),
        node(`${prefix}_u2_l2`, volume === "下册" ? "综合练习" : "单元练习"),
      ],
    ),
  ];
}

/**
 *
 * @param stageName
 * @param gradeList
 */
function inferGradeVolumes(stageName, gradeList = []) {
  const normalizedStage = normalizeStageName(stageName);
  const fallbackGrade =
    normalizedStage === "初中"
      ? "七年级"
      : normalizedStage === "高中"
        ? "高一"
        : "一年级";
  const firstGrade = gradeList[0] || {};
  const rawName =
    firstGrade.title || firstGrade.name || firstGrade.cnName || fallbackGrade;
  const gradeName =
    String(rawName)
      .replace(/[上下]册$/, "")
      .replace(/\(上\)|\(下\)/, "") || fallbackGrade;
  const gradeKey = firstGrade.key || firstGrade.gradeId || "";
  return [
    {
      gradeName,
      volumeName: "上册",
      bookName: `${gradeName}上册`,
      gradeId: gradeKey || `${gradeName}&&上册`,
    },
    {
      gradeName,
      volumeName: "下册",
      bookName: `${gradeName}下册`,
      gradeId: gradeKey
        ? String(gradeKey).replace("上册", "下册")
        : `${gradeName}&&下册`,
    },
  ];
}

/**
 *
 * @param root0
 * @param root0.versionId
 * @param root0.subjectName
 * @param root0.volumeName
 * @param root0.id
 */
function catalogFor({ versionId, subjectName, volumeName, id }) {
  const prefix = id;
  if (String(subjectName || "").includes("语言"))
    return kindergartenLanguageCatalog(prefix, volumeName, versionId);
  if (String(subjectName || "").includes("语文"))
    return chineseCatalog(prefix, volumeName);
  if (String(subjectName || "").includes("数学")) {
    if (Number(versionId) === 4) return qingdaoMathCatalog(prefix, volumeName);
    return mathCatalog(prefix, volumeName);
  }
  return genericCatalog(prefix, subjectName, volumeName, versionId);
}

/**
 *
 * @param root0
 * @param root0.stage
 * @param root0.stageName
 * @param root0.subjectId
 * @param root0.subjectName
 * @param root0.gradeList
 */
function buildMockTextbookBooks({
  stage,
  stageName,
  subjectId,
  subjectName,
  gradeList = [],
} = {}) {
  const versions = VERSION_OPTIONS.slice(
    0,
    String(subjectName || "").includes("语文") ? 3 : 2,
  );
  const books = [];
  for (const volume of inferGradeVolumes(stageName, gradeList)) {
    for (const version of versions) {
      const id = `mock_${stage || "stage"}_${subjectId || "subject"}_${version.id}_${volume.bookName}`;
      books.push({
        id,
        stage,
        stageName: normalizeStageName(stageName),
        subjectId,
        subjectName,
        versionId: version.id,
        versionName: version.name,
        gradeName: volume.gradeName,
        gradeId: volume.gradeId,
        volumeName: volume.volumeName,
        bookName: volume.bookName,
        catalog: catalogFor({
          versionId: version.id,
          subjectName,
          volumeName: volume.volumeName,
          id,
        }),
      });
    }
  }
  return books;
}

/**
 *
 * @param nodes
 */
function cloneTree(nodes = []) {
  return nodes.map((item) => ({
    ...item,
    children: cloneTree(item.children || []),
  }));
}

/**
 *
 * @param item
 */
function getNodeVersion(item = {}) {
  return (
    item.teachingMaterialVersion ||
    item.sourceType ||
    item.versionId ||
    item.version
  );
}

/**
 *
 * @param nodes
 * @param versionId
 */
function filterKnowledgeTreeByVersion(nodes = [], versionId) {
  if (!versionId) return cloneTree(nodes);
  return (nodes || []).reduce((result, item) => {
    const children = filterKnowledgeTreeByVersion(
      item.children || [],
      versionId,
    );
    const itemVersion = getNodeVersion(item);
    if (
      !itemVersion ||
      Number(itemVersion) === Number(versionId) ||
      children.length > 0
    ) {
      result.push({
        ...item,
        teachingMaterialVersion: itemVersion || versionId,
        children,
      });
    }
    return result;
  }, []);
}

/**
 *
 * @param nodes
 * @param versionId
 * @param parentId
 */
function mockKnowledgeTreeForVersion(nodes = [], versionId, parentId = "") {
  return (nodes || []).map((item) => {
    const originalId = item.id || item.key;
    const nextId = `v${versionId}_${originalId}`;
    const nextItem = {
      ...item,
      id: nextId,
      key: nextId,
      parentId,
      teachingMaterialVersion: versionId,
    };
    nextItem.children = mockKnowledgeTreeForVersion(
      item.children || [],
      versionId,
      nextId,
    );
    return nextItem;
  });
}

/**
 *
 * @param nodes
 * @param versionId
 */
function knowledgeTreeForVersion(nodes = [], versionId) {
  const filtered = filterKnowledgeTreeByVersion(nodes, versionId);
  if (filtered.length > 0 || !versionId) return filtered;
  return mockKnowledgeTreeForVersion(nodes, versionId);
}

/**
 *
 * @param nodes
 * @param path
 * @param level
 * @param parentId
 */
function flattenTree(nodes = [], path = [], level = 1, parentId = "") {
  return (nodes || []).reduce((result, item) => {
    const name = normalizeNodeName(item.name || item.text || item.title);
    const itemId = item.id || item.key;
    const next = {
      ...item,
      name,
      text: name,
      title: name,
      parentId: item.parentId || parentId,
      level,
      path: [...path, name],
    };
    return result.concat(
      next,
      flattenTree(item.children || [], next.path, level + 1, itemId),
    );
  }, []);
}

/**
 * 收集所有有子节点的知识点 ID，用于初始化展开状态。
 * @param {Array} nodes 知识点树节点
 * @returns {Array} 可展开节点 ID 列表
 */
function collectExpandableNodeIds(nodes = []) {
  const result = [];
  for (const item of nodes || []) {
    const itemId = item.id || item.key;
    if (itemId && item.children && item.children.length > 0) {
      result.push(itemId, ...collectExpandableNodeIds(item.children));
    }
  }
  return result;
}

/**
 *
 * @param value
 */
function sanitizeFileName(value = "") {
  return String(value || "")
    .replaceAll(/["*/:<>?\\|]/g, "_")
    .trim();
}

/**
 *
 * @param value
 */
function escapeCsvCell(value = "") {
  return `"${String(value == undefined ? "" : value).replaceAll('"', '""')}"`;
}

/**
 *
 * @param value
 */
function escapeXml(value = "") {
  return String(value == undefined ? "" : value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

/**
 *
 * @param value
 */
function decodeXml(value = "") {
  return String(value || "")
    .replaceAll("&apos;", "'")
    .replaceAll("&quot;", '"')
    .replaceAll("&gt;", ">")
    .replaceAll("&lt;", "<")
    .replaceAll("&amp;", "&");
}

/**
 *
 * @param index
 */
function columnName(index) {
  let value = index + 1;
  let name = "";
  while (value > 0) {
    const remainder = (value - 1) % 26;
    name = String.fromCharCode(65 + remainder) + name;
    value = Math.floor((value - 1) / 26);
  }
  return name;
}

/**
 *
 * @param cellReference
 */
function columnIndex(cellReference = "") {
  const letters = String(cellReference).replaceAll(/\d+/g, "").toUpperCase();
  return (
    letters
      .split("")
      .reduce((result, letter) => result * 26 + letter.charCodeAt(0) - 64, 0) -
    1
  );
}

/**
 *
 * @param nodes
 */
function flattenKnowledgeTreeForExport(nodes = []) {
  const walk = (items = [], parentPath = []) =>
    (items || []).reduce((result, item) => {
      const name = normalizeNodeName(
        item.knowledgeName || item.name || item.text || item.title,
      );
      const path = parentPath.concat(name).filter(Boolean);
      const row = {
        name,
        levels: path,
      };
      return result.concat(row, walk(item.children || [], path));
    }, []);
  return walk(nodes);
}

/**
 *
 * @param nodes
 */
function buildKnowledgeTreeCsv(nodes = []) {
  const headers = KNOWLEDGE_TREE_HEADERS;
  const rows = flattenKnowledgeTreeForExport(nodes);
  const lines = [
    headers.map(escapeCsvCell).join(","),
    ...rows.map((row) =>
      headers
        .map((_, index) => row.levels[index] || "")
        .map(escapeCsvCell)
        .join(","),
    ),
  ];
  return {
    rows,
    csv: `\uFEFF${lines.join("\n")}`,
  };
}

/**
 *
 * @param rows
 */
function buildKnowledgeTreeTableRows(rows = []) {
  return [KNOWLEDGE_TREE_HEADERS].concat(
    rows.map((row) =>
      Array.from(
        { length: MAX_TREE_LEVEL },
        (_, index) => row.levels[index] || "",
      ),
    ),
  );
}

/**
 *
 * @param tableRows
 */
function collectSharedStrings(tableRows = []) {
  const lookup = {};
  const values = [];
  for (const row of tableRows) {
    for (const cell of row) {
      if (!cell && cell !== 0) continue;
      const key = String(cell);
      if (lookup[key] || lookup[key] === 0) continue;
      lookup[key] = values.length;
      values.push(key);
    }
  }
  return { lookup, values };
}

/**
 *
 * @param sharedStrings
 */
function buildSharedStringsXml(sharedStrings = []) {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" count="${sharedStrings.length}" uniqueCount="${sharedStrings.length}">
  ${sharedStrings.map((value) => `<si><t>${escapeXml(value)}</t></si>`).join("")}
</sst>`;
}

/**
 *
 * @param tableRows
 * @param sharedStringLookup
 */
function buildKnowledgeTreeSheetXml(tableRows = [], sharedStringLookup = {}) {
  const sheetRows = tableRows
    .map((row, rowIndex) => {
      const cells = row
        .map((cell, cellIndex) => {
          if (!cell && cell !== 0) return "";
          return `<c r="${columnName(cellIndex)}${rowIndex + 1}" t="s"><v>${sharedStringLookup[String(cell)]}</v></c>`;
        })
        .join("");
      return `<row r="${rowIndex + 1}">${cells}</row>`;
    })
    .join("");
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <dimension ref="A1:G${tableRows.length || 1}"/>
  <sheetViews><sheetView workbookViewId="0"/></sheetViews>
  <sheetFormatPr defaultRowHeight="18"/>
  <cols>${KNOWLEDGE_TREE_HEADERS.map((_, index) => `<col min="${index + 1}" max="${index + 1}" width="18" customWidth="1"/>`).join("")}</cols>
  <sheetData>${sheetRows}</sheetData>
</worksheet>`;
}

/**
 *
 * @param zip
 * @param rows
 */
function addKnowledgeTreeWorkbookFiles(zip, rows = []) {
  const tableRows = buildKnowledgeTreeTableRows(rows);
  const sharedStrings = collectSharedStrings(tableRows);
  zip.file(
    "[Content_Types].xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>
  <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
  <Override PartName="/xl/sharedStrings.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sharedStrings+xml"/>
</Types>`,
  );
  zip.folder("_rels").file(
    ".rels",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>
</Relationships>`,
  );
  zip.folder("docProps").file(
    "app.xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">
  <Application>question-test</Application>
  <DocSecurity>0</DocSecurity>
  <ScaleCrop>false</ScaleCrop>
  <HeadingPairs><vt:vector size="2" baseType="variant"><vt:variant><vt:lpstr>Worksheets</vt:lpstr></vt:variant><vt:variant><vt:i4>1</vt:i4></vt:variant></vt:vector></HeadingPairs>
  <TitlesOfParts><vt:vector size="1" baseType="lpstr"><vt:lpstr>${escapeXml(KNOWLEDGE_TREE_SHEET_NAME)}</vt:lpstr></vt:vector></TitlesOfParts>
</Properties>`,
  );
  zip.folder("docProps").file(
    "core.xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:dcmitype="http://purl.org/dc/dcmitype/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <dc:creator>question-test</dc:creator>
  <cp:lastModifiedBy>question-test</cp:lastModifiedBy>
  <dcterms:created xsi:type="dcterms:W3CDTF">2026-06-03T00:00:00Z</dcterms:created>
  <dcterms:modified xsi:type="dcterms:W3CDTF">2026-06-03T00:00:00Z</dcterms:modified>
</cp:coreProperties>`,
  );
  zip.folder("xl").file(
    "workbook.xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <fileVersion appName="xl"/>
  <workbookPr defaultThemeVersion="124226"/>
  <bookViews><workbookView xWindow="0" yWindow="0" windowWidth="14805" windowHeight="8010"/></bookViews>
  <sheets><sheet name="${escapeXml(KNOWLEDGE_TREE_SHEET_NAME)}" sheetId="1" r:id="rId1"/></sheets>
  <calcPr calcId="0"/>
</workbook>`,
  );
  zip
    .folder("xl")
    .folder("_rels")
    .file(
      "workbook.xml.rels",
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/sharedStrings" Target="sharedStrings.xml"/>
</Relationships>`,
    );
  zip.folder("xl").file(
    "styles.xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="1"><font><sz val="11"/><name val="Arial"/></font></fonts>
  <fills count="1"><fill><patternFill patternType="none"/></fill></fills>
  <borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>
  <cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
  <cellXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/></cellXfs>
</styleSheet>`,
  );
  zip
    .folder("xl")
    .file("sharedStrings.xml", buildSharedStringsXml(sharedStrings.values));
  zip
    .folder("xl")
    .folder("worksheets")
    .file(
      "sheet1.xml",
      buildKnowledgeTreeSheetXml(tableRows, sharedStrings.lookup),
    );
}

/**
 *
 * @param nodes
 * @param type
 */
async function buildKnowledgeTreeWorkbook(nodes = [], type = "blob") {
  const rows = flattenKnowledgeTreeForExport(nodes);
  const zip = new JSZip();
  addKnowledgeTreeWorkbookFiles(zip, rows);
  return {
    rows,
    workbook: await zip.generateAsync({
      type,
      mimeType:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }),
  };
}

/**
 *
 * @param root0
 * @param root0.stageName
 * @param root0.subjectName
 * @param root0.versionName
 */
function buildKnowledgeTreeFileName({ stageName, subjectName, versionName }) {
  return (
    [
      sanitizeFileName(stageName),
      sanitizeFileName(subjectName),
      sanitizeFileName(versionName),
      "知识树",
    ]
      .filter(Boolean)
      .join("_") + ".xlsx"
  );
}

/**
 *
 * @param xml
 */
function parseSharedStringsXml(xml = "") {
  const sharedStrings = [];
  const sharedStringRegExp = /<si\b[\S\s]*?<\/si>/g;
  let sharedStringMatch = sharedStringRegExp.exec(String(xml || ""));
  while (sharedStringMatch) {
    const textList = [];
    const textRegExp = /<t(?:\s[^>]*)?>([\S\s]*?)<\/t>/g;
    let textMatch = textRegExp.exec(sharedStringMatch[0]);
    while (textMatch) {
      textList.push(decodeXml(textMatch[1]));
      textMatch = textRegExp.exec(sharedStringMatch[0]);
    }
    sharedStrings.push(textList.join(""));
    sharedStringMatch = sharedStringRegExp.exec(String(xml || ""));
  }
  return sharedStrings;
}

/**
 *
 * @param sheetXml
 * @param sharedStrings
 */
function parseSheetXmlRows(sheetXml = "", sharedStrings = []) {
  const rows = [];
  const rowRegExp = /<row\b[^>]*>([\S\s]*?)<\/row>/g;
  let rowMatch = rowRegExp.exec(String(sheetXml || ""));
  while (rowMatch) {
    const cells = [];
    const cellRegExp = /<c\b([^>]*)>([\S\s]*?)<\/c>/g;
    let cellMatch = cellRegExp.exec(rowMatch[1]);
    while (cellMatch) {
      const attributes = cellMatch[1];
      const body = cellMatch[2];
      const referenceMatch = attributes.match(/\br="([^"]+)"/);
      const typeMatch = attributes.match(/\bt="([^"]+)"/);
      const index = columnIndex(referenceMatch ? referenceMatch[1] : "");
      const valueMatch = body.match(/<v(?:\s[^>]*)?>([\S\s]*?)<\/v>/);
      const inlineMatch = body.match(/<t(?:\s[^>]*)?>([\S\s]*?)<\/t>/);
      let value = "";
      if (typeMatch && typeMatch[1] === "s") {
        value = sharedStrings[Number(valueMatch ? valueMatch[1] : -1)] || "";
      } else if (inlineMatch) {
        value = decodeXml(inlineMatch[1]);
      } else if (valueMatch) {
        value = decodeXml(valueMatch[1]);
      }
      if (index >= 0) cells[index] = value;
      cellMatch = cellRegExp.exec(rowMatch[1]);
    }
    rows.push(
      Array.from({ length: MAX_TREE_LEVEL }, (_, index) =>
        normalizeNodeName(cells[index] || ""),
      ),
    );
    rowMatch = rowRegExp.exec(String(sheetXml || ""));
  }
  return rows;
}

/**
 *
 * @param fileBuffer
 */
async function parseKnowledgeTreeWorkbook(fileBuffer) {
  const zip = await JSZip.loadAsync(fileBuffer);
  const sharedStringsFile = zip.file("xl/sharedStrings.xml");
  const sharedStrings = sharedStringsFile
    ? parseSharedStringsXml(await sharedStringsFile.async("string"))
    : [];
  const sheetFile = zip.file("xl/worksheets/sheet1.xml");
  if (!sheetFile) return [];
  const sheetRows = parseSheetXmlRows(
    await sheetFile.async("string"),
    sharedStrings,
  );
  return sheetRows
    .slice(1)
    .map((row) => row.slice(0, MAX_TREE_LEVEL).map(normalizeNodeName))
    .filter((row) => row.some(Boolean));
}

/**
 *
 * @param rows
 * @param versionId
 */
function buildKnowledgeTreeFromRows(rows = [], versionId = "") {
  const rootNodes = [];
  const pathMap = {};
  let seed = 0;
  for (const row of rows) {
    const path = row
      .slice(0, MAX_TREE_LEVEL)
      .map(normalizeNodeName)
      .filter(Boolean);
    let siblings = rootNodes;
    let parentId = "";
    for (const [levelIndex, name] of path.entries()) {
      const pathKey = path.slice(0, levelIndex + 1).join(" / ");
      if (!pathMap[pathKey]) {
        seed += 1;
        const nextNode = {
          id: `import_${versionId || "v"}_${seed}`,
          key: `import_${versionId || "v"}_${seed}`,
          parentId,
          name,
          text: name,
          title: name,
          knowledgeName: name,
          level: levelIndex + 1,
          _treeLevel: levelIndex + 1,
          teachingMaterialVersion: versionId,
          children: [],
        };
        pathMap[pathKey] = nextNode;
        siblings.push(nextNode);
      }
      parentId = pathMap[pathKey].id;
      siblings = pathMap[pathKey].children;
    }
  }
  return rootNodes;
}

/**
 *
 * @param currentNodes
 * @param incomingNodes
 */
function mergeKnowledgeTrees(currentNodes = [], incomingNodes = []) {
  const mergeLevel = (currentLevel = [], incomingLevel = []) => {
    const nextLevel = currentLevel.map((item) => ({
      ...item,
      children: mergeLevel(item.children || [], []),
    }));
    for (const incomingItem of incomingLevel) {
      const incomingName = normalizeNodeName(
        incomingItem.name || incomingItem.knowledgeName || incomingItem.text,
      );
      const matchedIndex = nextLevel.findIndex(
        (item) =>
          normalizeNodeName(item.name || item.knowledgeName || item.text) ===
          incomingName,
      );
      if (matchedIndex > -1) {
        nextLevel[matchedIndex] = {
          ...nextLevel[matchedIndex],
          children: mergeLevel(
            nextLevel[matchedIndex].children || [],
            incomingItem.children || [],
          ),
        };
        continue;
      }
      nextLevel.push(cloneTree([incomingItem])[0]);
    }
    return nextLevel;
  };
  return mergeLevel(currentNodes, incomingNodes);
}

/**
 *
 * @param nodes
 * @param id
 * @param level
 * @param path
 * @param parentId
 */
function findTreeNode(nodes = [], id, level = 1, path = [], parentId = "") {
  for (const item of nodes) {
    const itemId = item.id || item.key;
    const name = normalizeNodeName(item.name || item.text || item.title);
    const nextPath = path.concat(name);
    if (String(itemId) === String(id))
      return { node: item, level, path: nextPath, parentId };
    const child = findTreeNode(
      item.children || [],
      id,
      level + 1,
      nextPath,
      itemId,
    );
    if (child) return child;
  }
  return null;
}

/**
 *
 * @param nodes
 * @param targetId
 * @param mapper
 */
function mapTreeNodes(nodes = [], targetId, mapper) {
  return nodes.map((item) => {
    const itemId = item.id || item.key;
    if (String(itemId) === String(targetId)) return mapper(item);
    return {
      ...item,
      children: mapTreeNodes(item.children || [], targetId, mapper),
    };
  });
}

/**
 *
 * @param nodes
 * @param parentId
 * @param child
 */
function appendTreeNode(nodes = [], parentId, child) {
  if (!parentId) return nodes.concat(child);
  return mapTreeNodes(nodes, parentId, (item) => ({
    ...item,
    children: (item.children || []).concat(child),
  }));
}

/**
 *
 * @param nodes
 * @param targetId
 * @param child
 */
function insertSiblingNode(nodes = [], targetId, child) {
  if (!targetId) return nodes.concat(child);
  const insertRecursive = (items, parentId = "") => {
    let changed = false;
    const nextItems = [];
    for (const item of items || []) {
      const itemId = item.id || item.key;
      nextItems.push(item);
      if (String(itemId) === String(targetId)) {
        changed = true;
        nextItems.push({ ...child, parentId });
        continue;
      }
      const childResult = insertRecursive(item.children || [], itemId);
      if (childResult.changed) {
        changed = true;
        nextItems[nextItems.length - 1] = {
          ...item,
          children: childResult.nodes,
        };
      }
    }
    return { nodes: changed ? nextItems : items, changed };
  };
  return insertRecursive(nodes).nodes;
}

/**
 *
 * @param nodes
 * @param targetId
 * @param direction
 */
function moveSiblingNode(nodes = [], targetId, direction) {
  const moveRecursive = (items) => {
    const targetIndex = (items || []).findIndex(
      (item) => String(item.id || item.key) === String(targetId),
    );
    if (targetIndex > -1) {
      const nextIndex = direction === "up" ? targetIndex - 1 : targetIndex + 1;
      if (nextIndex < 0 || nextIndex >= items.length)
        return { nodes: items, changed: false };
      const nextItems = [...items];
      const current = nextItems[targetIndex];
      nextItems[targetIndex] = nextItems[nextIndex];
      nextItems[nextIndex] = current;
      return { nodes: nextItems, changed: true };
    }
    let changed = false;
    const nextItems = (items || []).map((item) => {
      const childResult = moveRecursive(item.children || []);
      if (!childResult.changed) return item;
      changed = true;
      return { ...item, children: childResult.nodes };
    });
    return { nodes: changed ? nextItems : items, changed };
  };
  return moveRecursive(nodes).nodes;
}

/**
 *
 * @param nodes
 * @param targetId
 */
function removeTreeNode(nodes = [], targetId) {
  return nodes
    .filter((item) => String(item.id || item.key) !== String(targetId))
    .map((item) => ({
      ...item,
      children: removeTreeNode(item.children || [], targetId),
    }));
}

/**
 *
 * @param lookup
 * @param childId
 * @param ancestorId
 */
function isDescendantOf(lookup, childId, ancestorId) {
  let current = lookup[String(childId)];
  while (current && current.parentId) {
    if (String(current.parentId) === String(ancestorId)) return true;
    current = lookup[String(current.parentId)];
  }
  return false;
}

/**
 *
 * @param nodes
 */
function knowledgeLookup(nodes = []) {
  const flat = flattenTree(nodes);
  return flat.reduce((map, item) => {
    map[String(item.id || item.key)] = item;
    return map;
  }, {});
}

/**
 *
 * @param ids
 * @param tree
 */
function deepestKnowledgeIds(ids = [], tree = []) {
  const lookup = Array.isArray(tree) ? knowledgeLookup(tree) : tree;
  const uniqueIds = [];
  for (const id of ids || []) {
    const normalizedId = String(id);
    if (lookup[normalizedId] && !uniqueIds.includes(normalizedId)) {
      uniqueIds.push(normalizedId);
    }
  }
  const deepestIds = [];
  for (const id of uniqueIds) {
    let hasSelectedDescendant = false;
    for (const candidateId of uniqueIds) {
      if (candidateId === id) continue;
      if (isDescendantOf(lookup, candidateId, id)) {
        hasSelectedDescendant = true;
        break;
      }
    }
    if (!hasSelectedDescendant) deepestIds.push(id);
  }
  return deepestIds;
}

/**
 *
 * @param lookup
 * @param id
 */
function knowledgePathLabel(lookup, id) {
  const item = lookup[String(id)];
  if (!item) return id;
  return item.path ? item.path.join(" / ") : item.name || item.text || id;
}

/**
 *
 * @param level
 * @param maxLevel
 */
function canAddChild(level, maxLevel = MAX_TREE_LEVEL) {
  return Number(level || 1) < maxLevel;
}

/**
 * 将外层宿主传入的页签参数转换成基础设置内部内容索引。
 * @param value 外层 URL 或 hash 中的页签参数
 * @returns 基础设置内部 activeTab 值
 */
function resolveBasicSettingActiveTab(value = "") {
  const normalizedValue = String(value || "")
    .trim()
    .toLowerCase();
  if (
    normalizedValue === "knowledge" ||
    normalizedValue === "知识点管理" ||
    normalizedValue === "1"
  ) {
    return 1;
  }
  if (
    normalizedValue === "页面功能设置" ||
    normalizedValue === "page" ||
    normalizedValue === "setting" ||
    normalizedValue === "pagesetting" ||
    normalizedValue === "page-setting" ||
    normalizedValue === "3"
  ) {
    return 3;
  }
  return 0;
}

export {
  adaptBackendChapterTree,
  adaptBackendKnowledgeTree,
  adaptBackendTextbookBooks,
  appendTreeNode,
  buildChapterKnowledgeRequestItems,
  buildKnowledgeTreeCsv,
  buildKnowledgeTreeFileName,
  buildKnowledgeTreeFromRows,
  buildKnowledgeTreeWorkbook,
  buildMockTextbookBooks,
  canAddChild,
  cloneTree,
  collectExpandableNodeIds,
  deepestKnowledgeIds,
  filterKnowledgeTreeByVersion,
  findTreeNode,
  flattenKnowledgeTreeForExport,
  flattenTree,
  insertSiblingNode,
  knowledgeLookup,
  knowledgePathLabel,
  knowledgeTreeForVersion,
  mapTreeNodes,
  MAX_TREE_LEVEL,
  mergeKnowledgeTrees,
  moveSiblingNode,
  normalizeNodeName,
  normalizeStageName,
  parseKnowledgeTreeWorkbook,
  removeTreeNode,
  resolveBasicSettingActiveTab,
  VERSION_OPTIONS,
};
