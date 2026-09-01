/**
 * 构造与基础设置接口一致的成功响应。
 * @param {unknown} content 响应内容
 * @returns {object} 标准成功响应
 */
const success = (content) => ({
  ifLogin: true,
  status: true,
  message: "成功",
  code: 0,
  content,
  ifAdmin: true,
});

const stageSubjects = [
  {
    stageId: 3,
    stageName: "初中段",
    subjectList: [{ subjectId: 2, subjectName: "数学" }],
  },
];

const teachingMaterial = { id: 2, name: "人教版" };

const textbookBooks = [
  {
    id: "book-7a",
    gradeId: 7,
    gradeName: "七年级",
    volumeType: "上册",
    displayName: "七年级上册",
    sortNo: 10,
    configured: true,
  },
];

let nextKnowledgeId = 2000;
let knowledgeTree = [
  {
    id: 1001,
    parentId: undefined,
    knowledgeName: "数与代数",
    definitionText: "研究数、式、方程与函数的基础知识结构。",
    describe: "研究数、式、方程与函数的基础知识结构。",
    level: 1,
    sortNo: 10,
    children: [
      {
        id: 1002,
        parentId: 1001,
        knowledgeName: "有理数",
        definitionText:
          "理解正负数、数轴、相反数、绝对值及有理数运算，例如 $|a|$。",
        describe: "理解正负数、数轴、相反数、绝对值及有理数运算，例如 $|a|$。",
        level: 2,
        sortNo: 10,
        children: [],
      },
    ],
  },
];

let chapterTree = [
  {
    id: 3001,
    parentId: undefined,
    name: "第一章 有理数",
    level: 1,
    sortNo: 10,
    knowledges: [{ id: 1002, name: "有理数" }],
    children: [],
  },
];

/**
 * 把请求 ID 统一成数字或原始字符串，便于 mock 树匹配。
 * @param {unknown} value 请求 ID
 * @returns {number|string|undefined} 规范化 ID
 */
const normalizeId = (value) => {
  if (!value && value !== 0) return;
  const numberValue = Number(value);
  return Number.isNaN(numberValue) ? value : numberValue;
};

/**
 * 在树中递归查找指定节点。
 * @param {Array} nodes 树节点
 * @param {unknown} id 目标 ID
 * @returns {object|undefined} 匹配节点
 */
const findNode = (nodes, id) => {
  for (const node of nodes || []) {
    if (String(node.id) === String(id)) return node;
    const child = findNode(node.children || [], id);
    if (child) return child;
  }
};

/**
 * 向树根或指定父节点追加节点。
 * @param {Array} nodes 树节点
 * @param {object} node 新节点
 * @returns {void}
 */
const addNode = (nodes, node) => {
  const parent = node.parentId && findNode(nodes, node.parentId);
  if (parent) parent.children = [...(parent.children || []), node];
  else nodes.push(node);
};

/**
 * 保存知识点名称和定义，空字符串必须覆盖旧定义。
 * @param {object} body 保存请求体
 * @returns {number|string} 保存后的知识点 ID
 */
const saveKnowledge = (body = {}) => {
  const id = body.id || nextKnowledgeId++;
  const parentId = normalizeId(body.parentId);
  const definitionText = body.definitionText ?? body.describe ?? "";
  const existing = findNode(knowledgeTree, id);
  if (existing) {
    existing.knowledgeName = body.text || existing.knowledgeName;
    existing.definitionText = definitionText;
    existing.describe = definitionText;
    return id;
  }
  const parent = parentId && findNode(knowledgeTree, parentId);
  addNode(knowledgeTree, {
    id,
    parentId,
    knowledgeName: body.text || "新知识点",
    definitionText,
    describe: definitionText,
    level: parent ? Number(parent.level || 1) + 1 : 1,
    sortNo: 100,
    children: [],
  });
  return id;
};

/**
 * 从知识点树中递归删除指定节点。
 * @param {Array} nodes 树节点
 * @param {unknown} id 目标 ID
 * @returns {Array} 删除后的树
 */
const removeKnowledge = (nodes, id) =>
  (nodes || [])
    .filter((node) => String(node.id) !== String(id))
    .map((node) => ({
      ...node,
      children: removeKnowledge(node.children || [], id),
    }));

/**
 * 保存教材章节 mock 节点。
 * @param {object} body 保存请求体
 * @returns {number|string} 保存后的章节 ID
 */
const saveChapter = (body = {}) => {
  const id = body.id || 4000;
  const parentId = normalizeId(body.parentId);
  const existing = findNode(chapterTree, id);
  if (existing) {
    existing.name = body.name || existing.name;
    return id;
  }
  const parent = parentId && findNode(chapterTree, parentId);
  addNode(chapterTree, {
    id,
    parentId,
    name: body.name || "新教材节点",
    level: parent ? Number(parent.level || 1) + 1 : 1,
    sortNo: 100,
    knowledges: [],
    children: [],
  });
  return id;
};

export default {
  "GET /api/knowledge/getStageAndSubjectList": success(stageSubjects),
  "GET /api/knowledge/getTeachingMaterial": success(teachingMaterial),
  "GET /api/basic-setting/textbook-knowledge/textbook-books":
    success(textbookBooks),
  "GET /api/basic-setting/textbook-knowledge/chapters": (request, response) =>
    response.send(success(chapterTree)),
  "POST /api/basic-setting/textbook-knowledge/chapters/save": (
    request,
    response,
  ) => response.send(success(saveChapter(request.body))),
  "GET /api/basic-setting/textbook-knowledge/chapters/delete": success(),
  "POST /api/basic-setting/textbook-knowledge/chapters/sort": success(),
  "GET /api/basic-setting/textbook-knowledge/knowledges": (request, response) =>
    response.send(success(knowledgeTree)),
  "POST /api/basic-setting/textbook-knowledge/knowledges/save": (
    request,
    response,
  ) => response.send(success(saveKnowledge(request.body))),
  "GET /api/basic-setting/textbook-knowledge/knowledges/delete": (
    request,
    response,
  ) => {
    knowledgeTree = removeKnowledge(
      knowledgeTree,
      request.query && request.query.id,
    );
    response.send(success());
  },
  "POST /api/basic-setting/textbook-knowledge/knowledges/sort": success(),
  "POST /api/basic-setting/textbook-knowledge/chapter-knowledge/save":
    success(),
  "GET /api/config/get": success({}),
};
