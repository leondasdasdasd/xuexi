const assert = require("assert");
const fs = require("fs");
const path = require("path");

const {
  MAX_TREE_LEVEL,
  appendTreeNode,
  buildMockTextbookBooks,
  buildKnowledgeTreeCsv,
  buildKnowledgeTreeWorkbook,
  buildKnowledgeTreeFileName,
  buildKnowledgeTreeFromRows,
  buildChapterKnowledgeRequestItems,
  canAddChild,
  collectExpandableNodeIds,
  deepestKnowledgeIds,
  adaptBackendKnowledgeTree,
  flattenKnowledgeTreeForExport,
  findTreeNode,
  insertSiblingNode,
  knowledgeTreeForVersion,
  knowledgeLookup,
  mergeKnowledgeTrees,
  moveSiblingNode,
  normalizeStageName,
  parseKnowledgeTreeWorkbook,
  resolveBasicSettingActiveTab,
} = require("./index.helpers");

test("知识点定义应归一化并收集可展开节点", () => {
  const tree = adaptBackendKnowledgeTree([
    {
      id: "root",
      knowledgeName: "函数",
      describe: "<p>函数定义 $y=f(x)$</p>",
      children: [
        {
          id: "leaf",
          knowledgeName: "一次函数",
          description: "叶子定义",
          children: [],
        },
      ],
    },
    {
      id: "empty",
      knowledgeName: "空定义",
      definitionText: null,
      children: [],
    },
  ]);

  assert.strictEqual(tree[0].definitionText, "函数定义 $y=f(x)$");
  assert.strictEqual(tree[0].children[0].definitionText, "叶子定义");
  assert.strictEqual(tree[1].definitionText, "");
  assert.deepStrictEqual(collectExpandableNodeIds(tree), ["root"]);
});

test("知识点页面应支持完整定义维护", () => {
  const pageSource = fs.readFileSync(path.join(__dirname, "index.jsx"), "utf8");
  [
    "knowledgeCreateDefinition",
    "expandedKnowledgeNodeIds",
    "editingKnowledgeDefinitionNodeId",
    "renderKnowledgeDefinitionHtml",
    "knowledgeDefinitionTextarea",
    "toggleKnowledgeNodeExpanded",
    "definitionText",
  ].forEach((token) => {
    assert(pageSource.includes(token), `知识点定义页面缺少 ${token}`);
  });
  assert(
    pageSource.includes("describe: definitionText"),
    "知识点定义必须通过后端既有 describe 字段保存",
  );
});

test("点击知识点定义后应立即聚焦行内编辑框", () => {
  const pageSource = fs.readFileSync(path.join(__dirname, "index.jsx"), "utf8");
  assert(
    pageSource.includes("knowledgeDefinitionTextareaRef"),
    "知识点定义编辑框应提供稳定 ref",
  );
  assert(
    pageSource.includes("focusKnowledgeDefinitionTextarea"),
    "进入行内编辑状态后应主动聚焦文本域",
  );
});

test("知识点定义应提供响应式编辑和预览样式", () => {
  const styleSource = fs.readFileSync(
    path.join(__dirname, "index.module.less"),
    "utf8",
  );
  [
    ".knowledgeDefinitionCell",
    ".knowledgeDefinitionPreviewButton",
    ".knowledgeDefinitionHoverCard",
    ".knowledgeDefinitionTextarea",
    ".knowledgeDefinitionEditorGrid",
  ].forEach((selector) => {
    assert(styleSource.includes(selector), `知识点定义样式缺少 ${selector}`);
  });
  assert(
    /@media[\s\S]*\.knowledgeDefinitionEditorGrid[\s\S]*grid-template-columns:\s*1fr/.test(
      styleSource,
    ),
    "窄屏下知识点定义编辑器必须使用单列布局",
  );
});

test("基础设置页面应接入服务端教材知识点接口", () => {
  const pageSource = fs.readFileSync(path.join(__dirname, "index.jsx"), "utf8");
  const serviceSource = fs.readFileSync(
    path.join(__dirname, "../../services/basicSettingTextbookKnowledge.js"),
    "utf8",
  );
  assert(
    pageSource.includes("../../services/basicSettingTextbookKnowledge"),
    "页面必须引用基础设置教材知识点 service",
  );
  assert(
    serviceSource.includes("/api/knowledge/getTeachingMaterial"),
    "教材版本 service 必须调用 /api/knowledge/getTeachingMaterial",
  );
  assert(
    serviceSource.includes("/api/knowledge/getStageAndSubjectList"),
    "学段学科 service 必须调用 /api/knowledge/getStageAndSubjectList",
  );
  assert(
    !serviceSource.includes("/api/question/stageSubject/list"),
    "基础设置页不应继续调用旧题库学段学科接口",
  );
  assert(
    !pageSource.includes("queryBasicSettingTeachingMaterialAndGrade"),
    "页面不应继续使用旧的教材版本和年级接口",
  );
  assert(
    !pageSource.includes("const SUBJECT_SCOPE_LIST"),
    "页面不应继续使用本地固定学段学科 mock 数据",
  );
  assert(
    !pageSource.includes("VERSION_OPTIONS"),
    "页面不应继续使用本地固定教材版本列表",
  );
  assert(
    !pageSource.includes("buildMockTextbookBooks"),
    "页面不应继续本地生成 mock 教材册和目录",
  );
  assert(
    pageSource.includes("queryBasicSettingTeachingMaterial"),
    "教材版本必须从 /api/knowledge/getTeachingMaterial 对应 service 获取",
  );
  assert(
    /queryBasicSettingTeachingMaterial\(\{[\s\S]*stage: this\.state\.stage[\s\S]*subjectId: this\.state\.subjectId/.test(
      pageSource,
    ),
    "教材版本查询必须携带当前学段和学科",
  );
  assert(
    /queryBasicSettingTeachingMaterial\(\{[\s\S]*type: this\.state\.activeTab === 1 \? 2 : 1/.test(
      pageSource,
    ),
    "教材版本查询必须按章节和知识点入口传不同 type",
  );
  assert(
    /queryBasicSettingStageSubjects\(\{[\s\S]*type: this\.getStageSubjectType\(\)/.test(
      pageSource,
    ),
    "学段学科查询必须按章节和知识点入口传对应 type",
  );
  assert(
    /changeSubject[\s\S]*this\.loadTeachingMaterialAndBooks/.test(pageSource),
    "切换学科后必须重新加载教材版本和教材册",
  );
  assert(
    /changeTab[\s\S]*this\.loadTeachingMaterialAndBooks/.test(pageSource),
    "切换章节和知识点管理时必须重新按入口加载教材版本",
  );
  assert(
    pageSource.includes("saveTextbookChapter"),
    "章节保存必须调用服务端保存接口",
  );
  assert(
    pageSource.includes("saveBasicSettingKnowledge"),
    "知识点保存必须调用服务端保存接口",
  );
  assert(
    pageSource.includes("saveChapterKnowledgeRelations"),
    "章节关联知识点必须调用服务端保存接口",
  );
  assert(
    pageSource.includes('id="tabbar"'),
    "访问基础设置路由时必须保留页面内三个页签",
  );
  assert(
    !pageSource.includes("hasBasicSettingTabParam"),
    "页面内三个页签不应再被外层页签参数隐藏",
  );
});

test("基础设置筛选弹层应跟随触发区域定位", () => {
  const styleSource = fs.readFileSync(
    path.join(__dirname, "index.module.less"),
    "utf8",
  );
  const conditionContent = styleSource.match(
    /\.conditionContent\s*\{([\s\S]*?)\.conditionItem/,
  );
  assert(conditionContent, "应保留筛选弹层内容样式");
  assert(
    !/position:\s*fixed;/.test(conditionContent[1]),
    "筛选弹层内容不能使用 fixed 脱离触发区域",
  );
  assert(
    !/left:\s*296px;/.test(conditionContent[1]),
    "筛选弹层内容不能写死页面中部 left 值",
  );
});

test("章节绑定知识点不应包含主次概念", () => {
  const pageSource = fs.readFileSync(path.join(__dirname, "index.jsx"), "utf8");
  assert(
    !pageSource.includes("支持搜索、多级展开和主次标记"),
    "关联知识点弹窗不应展示主次说明",
  );
  assert(!pageSource.includes('"主"'), "关联知识点不应展示主知识点标记");
  assert(!pageSource.includes('"次"'), "关联知识点不应展示次知识点标记");
  assert(
    !pageSource.includes("togglePrimary"),
    "关联知识点不应保留主知识点切换逻辑",
  );
  assert.deepStrictEqual(
    buildChapterKnowledgeRequestItems(["k1", "k2"]),
    [
      { knowledgeId: "k1", sortNo: 10 },
      { knowledgeId: "k2", sortNo: 20 },
    ],
    "保存章节知识点关系时只应提交知识点 ID 和排序",
  );
});

test("知识点导入应保留增量更新和全量覆盖两种方式", () => {
  const pageSource = fs.readFileSync(path.join(__dirname, "index.jsx"), "utf8");
  const serviceSource = fs.readFileSync(
    path.join(__dirname, "../../services/basicSettingTextbookKnowledge.js"),
    "utf8",
  );
  assert(
    pageSource.includes('knowledgeImportMode: "incremental"'),
    "打开导入弹窗时默认应为增量更新",
  );
  assert(pageSource.includes("增量更新"), "导入弹窗应展示增量更新方式");
  assert(pageSource.includes("全量覆盖"), "导入弹窗应展示全量覆盖方式");
  assert(
    pageSource.includes('knowledgeImportMode === "replace"'),
    "导入弹窗应允许切换到全量覆盖",
  );
  assert(
    pageSource.includes("importMode: this.state.knowledgeImportMode"),
    "确认导入时应把当前导入方式传给 service",
  );
  assert(
    serviceSource.includes(
      'formData.append("importMode", parameters.importMode)',
    ),
    "知识点导入接口应透传导入方式",
  );
});

test("知识点编辑应支持定义文本 LaTeX 渲染和非末级展开状态", () => {
  const pageSource = fs.readFileSync(path.join(__dirname, "index.jsx"), "utf8");
  assert(
    pageSource.includes("expandedKnowledgeNodeIds"),
    "知识点树应维护展开状态",
  );
  assert(
    pageSource.includes("toggleKnowledgeNodeExpanded"),
    "非末级知识点应支持点击展开或收起",
  );
  assert(pageSource.includes("知识点定义"), "知识点维护字段应展示为知识点定义");
  assert(pageSource.includes("katex"), "知识点定义应使用 KaTeX 渲染公式");
  assert(
    pageSource.includes("definitionText"),
    "知识点定义应使用纯文本定义字段",
  );
  assert(
    pageSource.includes("editingKnowledgeDefinitionNodeId"),
    "知识点定义应在列表行内维护编辑状态",
  );
  assert(
    pageSource.includes("knowledgeDefinitionTextarea"),
    "知识点定义编辑应使用行内文本域",
  );
  assert(
    !pageSource.includes("编辑知识点定义"),
    "已有知识点定义不应再使用弹窗编辑",
  );
  const adapted = adaptBackendKnowledgeTree([
    {
      id: "root",
      knowledgeName: "函数",
      definitionText: "函数定义 $y=f(x)$",
      children: [{ id: "leaf", knowledgeName: "一次函数", describe: "叶子" }],
    },
  ]);
  assert.strictEqual(
    adapted[0].definitionText,
    "函数定义 $y=f(x)$",
    "后端 definitionText 字段应映射为页面定义文本",
  );
  assert.deepStrictEqual(
    collectExpandableNodeIds(adapted),
    ["root"],
    "只收集有子节点的知识点作为可展开节点",
  );
});

test("基础设置 helper 应正确处理 mock 数据、知识树和外层页签参数", async () => {
  assert.strictEqual(
    normalizeStageName("小学段"),
    "小学",
    "学段展示应去掉“段”",
  );
  assert.strictEqual(
    normalizeStageName("初中"),
    "初中",
    "已有标准学段不应被改写",
  );
  assert.strictEqual(resolveBasicSettingActiveTab(""), 0, "默认应打开教材管理");
  assert.strictEqual(
    resolveBasicSettingActiveTab("章节管理"),
    0,
    "外层旧章节页签应映射到教材管理内容",
  );
  assert.strictEqual(
    resolveBasicSettingActiveTab("knowledge"),
    1,
    "外层知识点页签英文参数应映射到知识点管理内容",
  );
  assert.strictEqual(
    resolveBasicSettingActiveTab("知识点管理"),
    1,
    "外层知识点页签中文参数应映射到知识点管理内容",
  );
  assert.strictEqual(
    resolveBasicSettingActiveTab("页面功能设置"),
    3,
    "外层页面功能设置页签应映射到页面功能设置内容",
  );
  assert.strictEqual(
    resolveBasicSettingActiveTab("page-setting"),
    3,
    "外层页面功能设置英文参数应映射到页面功能设置内容",
  );

  const books = buildMockTextbookBooks({
    stage: 3,
    stageName: "初中段",
    subjectId: 2,
    subjectName: "数学",
    gradeList: [{ key: "7&&上册", title: "七年级" }],
  });

  const renjiaoUp = books.find(
    (item) => item.versionName === "人教版" && item.volumeName === "上册",
  );
  const renjiaoDown = books.find(
    (item) => item.versionName === "人教版" && item.volumeName === "下册",
  );
  const qingdaoUp = books.find(
    (item) => item.versionName.includes("青岛版") && item.volumeName === "上册",
  );
  const qingdaoDown = books.find(
    (item) => item.versionName.includes("青岛版") && item.volumeName === "下册",
  );

  assert(
    renjiaoUp && renjiaoDown && qingdaoUp && qingdaoDown,
    "mock 教材应覆盖同一学科的多个版本和上下册",
  );
  assert.notDeepStrictEqual(
    renjiaoUp.catalog,
    renjiaoDown.catalog,
    "上下册不能共用同一棵目录树",
  );
  assert.notDeepStrictEqual(
    renjiaoUp.catalog,
    qingdaoUp.catalog,
    "不同版本不能共用同一棵目录树",
  );
  assert.notDeepStrictEqual(
    qingdaoUp.catalog,
    qingdaoDown.catalog,
    "青岛版上下册也不能共用同一棵目录树",
  );

  const languageBooks = buildMockTextbookBooks({
    stage: 1,
    stageName: "幼儿园",
    subjectId: 1,
    subjectName: "语言",
    gradeList: [{ key: "大班&&上册", title: "大班" }],
  });
  const languageRenjiaoUp = languageBooks.find(
    (item) => item.versionName === "人教版" && item.volumeName === "上册",
  );
  const languageRenjiaoDown = languageBooks.find(
    (item) => item.versionName === "人教版" && item.volumeName === "下册",
  );
  const languageQingdaoUp = languageBooks.find(
    (item) => item.versionName.includes("青岛版") && item.volumeName === "上册",
  );
  assert.notStrictEqual(
    languageRenjiaoUp.catalog[0].name,
    languageRenjiaoDown.catalog[0].name,
    "语言不同册别应有不同 mock 教材目录",
  );
  assert.notStrictEqual(
    languageRenjiaoUp.catalog[0].name,
    languageQingdaoUp.catalog[0].name,
    "语言不同版本应有不同 mock 教材目录",
  );

  const level6 = findTreeNode(
    renjiaoUp.catalog,
    `${renjiaoUp.id}_u3_s2_l1_p1_a1_d1`,
  );
  const withLevel7 = appendTreeNode(renjiaoUp.catalog, level6.node.id, {
    id: "temp_level_7",
    key: "temp_level_7",
    name: "第七层节点",
    children: [],
  });
  const level7 = findTreeNode(withLevel7, "temp_level_7");
  assert.strictEqual(level7.level, MAX_TREE_LEVEL, "第六层应能新增第七层");
  assert.strictEqual(
    canAddChild(level7.level),
    false,
    "第七层不能继续新增子节点",
  );

  const withSibling = insertSiblingNode(
    renjiaoUp.catalog,
    `${renjiaoUp.id}_u2`,
    {
      id: "temp_sibling",
      key: "temp_sibling",
      name: "同级新增节点",
      children: [],
    },
  );
  assert.strictEqual(
    withSibling[2].id,
    "temp_sibling",
    "新增应插入当前选中节点的同级下方",
  );
  assert.strictEqual(
    withSibling[2].parentId,
    "",
    "一级节点新增同级时 parentId 应为空",
  );

  const movedUp = moveSiblingNode(withSibling, "temp_sibling", "up");
  assert.strictEqual(movedUp[1].id, "temp_sibling", "同级节点应支持上移");
  const movedDown = moveSiblingNode(movedUp, "temp_sibling", "down");
  assert.strictEqual(movedDown[2].id, "temp_sibling", "同级节点应支持下移");

  const knowledgeTree = [
    {
      id: "root",
      name: "数与代数",
      children: [
        {
          id: "child",
          parentId: "root",
          name: "方程",
          children: [
            {
              id: "leaf",
              parentId: "child",
              name: "一元一次方程",
              children: [],
            },
          ],
        },
      ],
    },
  ];
  const lookup = knowledgeLookup(knowledgeTree);
  assert.deepStrictEqual(
    deepestKnowledgeIds(["root", "child", "leaf"], lookup),
    ["leaf"],
    "父子同时选择时只保留最深层知识点",
  );
  assert.strictEqual(
    lookup.leaf.parentId,
    "child",
    "扁平化知识点树时应补齐缺失的父节点关系",
  );
  assert.deepStrictEqual(
    deepestKnowledgeIds(["root", "leaf"], knowledgeTree),
    ["leaf"],
    "缺少 parentId 的原始树也应只保留最深层知识点",
  );

  const versionedTree = [
    {
      id: "math",
      name: "数的认识",
      teachingMaterialVersion: 4,
      children: [
        {
          id: "read",
          parentId: "math",
          name: "读数",
          teachingMaterialVersion: 4,
          children: [],
        },
      ],
    },
    {
      id: "geometry",
      name: "图形认识",
      teachingMaterialVersion: 2,
      children: [
        {
          id: "shape",
          parentId: "geometry",
          name: "平面图形",
          teachingMaterialVersion: 2,
          children: [],
        },
      ],
    },
  ];
  const qingdaoKnowledge = knowledgeTreeForVersion(versionedTree, 4);
  assert.strictEqual(qingdaoKnowledge.length, 1, "知识点树应按教材版本过滤");
  assert.strictEqual(
    qingdaoKnowledge[0].id,
    "math",
    "过滤后应保留命中版本的节点",
  );
  const generatedKnowledge = knowledgeTreeForVersion(versionedTree, 7);
  assert.strictEqual(
    generatedKnowledge.length,
    2,
    "缺少目标版本 mock 数据时应派生一份完整知识树",
  );
  assert.strictEqual(
    generatedKnowledge[0].id,
    "v7_math",
    "派生知识树 id 应带版本前缀，避免与其他版本混用",
  );
  assert.strictEqual(
    generatedKnowledge[0].children[0].parentId,
    "v7_math",
    "派生知识树应同步修正父节点 id",
  );

  const exportTree = [
    {
      id: "root",
      name: '表达"基础"',
      describe: "一级说明",
      teachingMaterialVersion: 4,
      children: [
        {
          id: "leaf",
          parentId: "root",
          knowledgeName: "儿歌,朗读",
          describe: "包含逗号",
          teachingMaterialVersion: 4,
          children: [],
        },
      ],
    },
  ];
  const exportRows = flattenKnowledgeTreeForExport(exportTree);
  assert.strictEqual(exportRows.length, 2, "下载知识树应导出当前树的全部节点");
  assert.deepStrictEqual(
    exportRows[1].levels,
    ['表达"基础"', "儿歌,朗读"],
    "导出应按列保留真实层级关系",
  );
  const exportCsv = buildKnowledgeTreeCsv(exportTree).csv;
  assert(
    exportCsv.includes(
      '"一级知识点","二级知识点","三级知识点","四级知识点","五级知识点","六级知识点","七级知识点"',
    ),
    "CSV 表头应按知识点层级展开",
  );
  assert(exportCsv.includes('"表达""基础"""'), "CSV 导出应正确转义英文引号");
  assert(
    exportCsv.includes('"儿歌,朗读"'),
    "CSV 导出应正确保留包含逗号的知识点名称",
  );
  assert.strictEqual(
    exportCsv.indexOf("知识点ID"),
    -1,
    "导出不应暴露知识点 ID",
  );
  assert.strictEqual(
    exportCsv.indexOf("教材版本"),
    -1,
    "导出不应暴露教材版本字段",
  );
  assert.strictEqual(
    buildKnowledgeTreeFileName({
      stageName: "幼儿园",
      subjectName: "语言",
      versionName: "青岛版/六三制",
    }),
    "幼儿园_语言_青岛版_六三制_知识树.xlsx",
    "知识树文件名应包含学段、学科、版本，并清理非法字符",
  );

  const { rows, workbook } = await buildKnowledgeTreeWorkbook(
    exportTree,
    "nodebuffer",
  );
  assert.strictEqual(rows.length, 2, "Excel 导出应复用同一份知识点树路径数据");
  const workbookRows = await parseKnowledgeTreeWorkbook(workbook);
  assert.deepStrictEqual(
    workbookRows.slice(0, 2),
    [
      ['表达"基础"', "", "", "", "", "", ""],
      ['表达"基础"', "儿歌,朗读", "", "", "", "", ""],
    ],
    "Excel 下载文件应能按多级知识点列重新解析",
  );

  const importedTree = buildKnowledgeTreeFromRows(
    [
      ["表达基础", "儿歌朗读", "停顿节奏"],
      ["表达基础", "看图说话", "人物描述"],
    ],
    4,
  );
  assert.strictEqual(importedTree.length, 1, "导入应按一级知识点合并为树");
  assert.strictEqual(
    importedTree[0].children.length,
    2,
    "导入应保留同级知识点顺序",
  );
  const mergedTree = mergeKnowledgeTrees(
    buildKnowledgeTreeFromRows([["表达基础", "儿歌朗读"]], 4),
    importedTree,
  );
  assert.strictEqual(
    mergedTree[0].children.length,
    2,
    "增量更新应追加缺失路径",
  );
  assert.strictEqual(
    mergedTree[0].children[0].children[0].name,
    "停顿节奏",
    "增量更新应补齐已有路径下的子节点",
  );
});
