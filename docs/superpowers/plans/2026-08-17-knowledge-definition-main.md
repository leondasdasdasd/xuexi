# 知识点定义完整迁移 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在最新 `main` 上完整恢复知识点定义维护、KaTeX 预览、树展开和双语交互。

**Architecture:** 页面内部统一使用 `definitionText`，helper 负责把后端兼容字段转换成稳定页面形状，保存边界只提交既有 `describe` 字段。实现复用当前 `BasicSetting` 页面、CSS Modules、i18n 和 Vite mock，不引入旧构建配置或第二条保存链路。

**Tech Stack:** React、DVA、Ant Design、KaTeX、CSS Modules、Vite、Jest、Node.js 16。

---

### Task 1：定义数据形状与树展开 helper

**Files:**

- Modify: `src/routes/BasicSetting/index.helpers.test.js`
- Modify: `src/routes/BasicSetting/index.helpers.js`

- [ ] **Step 1: 写失败测试**

```js
test("知识点定义应归一化并收集可展开节点", () => {
  const tree = adaptBackendKnowledgeTree([
    {
      id: "root",
      knowledgeName: "函数",
      describe: "<p>函数定义 $y=f(x)$</p>",
      children: [
        { id: "leaf", knowledgeName: "一次函数", description: "叶子" },
      ],
    },
  ]);
  assert.strictEqual(tree[0].definitionText, "函数定义 $y=f(x)$");
  assert.strictEqual(tree[0].children[0].definitionText, "叶子");
  assert.deepStrictEqual(collectExpandableNodeIds(tree), ["root"]);
});
```

- [ ] **Step 2: 运行测试确认 RED**

Run: `npm test -- src/routes/BasicSetting/index.helpers.test.js --runInBand`

Expected: FAIL，提示 `collectExpandableNodeIds` 不存在或 `definitionText` 未映射。

- [ ] **Step 3: 实现最小 helper**

```js
const normalizeDefinitionText = (value = "") => {
  const content = String(value || "");
  if (!/<\/?[a-z][\s\S]*>/i.test(content)) return content.trim();
  return content
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
};

function collectExpandableNodeIds(nodes = []) {
  return nodes.reduce((ids, node) => {
    const id = node.id || node.key;
    if (id && node.children && node.children.length > 0)
      ids.push(id, ...collectExpandableNodeIds(node.children));
    return ids;
  }, []);
}
```

在 `adaptBackendKnowledgeTree` 中生成规范化 `definitionText`，并导出 `collectExpandableNodeIds`。

- [ ] **Step 4: 运行测试确认 GREEN**

Run: `npm test -- src/routes/BasicSetting/index.helpers.test.js --runInBand`

Expected: PASS。

- [ ] **Step 5: 提交**

```bash
git add src/routes/BasicSetting/index.helpers.js src/routes/BasicSetting/index.helpers.test.js
git commit -m "feat: 补充知识点定义数据映射"
```

### Task 2：页面定义编辑、公式预览与树展开

**Files:**

- Modify: `src/routes/BasicSetting/index.helpers.test.js`
- Modify: `src/routes/BasicSetting/index.jsx`

- [ ] **Step 1: 写页面契约失败测试**

```js
test("知识点页面应支持完整定义维护", () => {
  const source = fs.readFileSync(path.join(__dirname, "index.jsx"), "utf8");
  [
    "knowledgeCreateDefinition",
    "expandedKnowledgeNodeIds",
    "editingKnowledgeDefinitionNodeId",
    "renderKnowledgeDefinitionHtml",
    "knowledgeDefinitionTextarea",
    "toggleKnowledgeNodeExpanded",
  ].forEach((token) => assert(source.includes(token), `缺少 ${token}`));
});
```

- [ ] **Step 2: 运行测试确认 RED**

Run: `npm test -- src/routes/BasicSetting/index.helpers.test.js --runInBand`

Expected: FAIL，提示页面缺少定义编辑状态或渲染入口。

- [ ] **Step 3: 实现 KaTeX 安全渲染和状态**

```js
const escapeHtml = (value = "") =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const renderKnowledgeDefinitionHtml = (value = "") => {
  const text = String(value || "");
  const parts = [];
  const pattern = /\$\$([\s\S]+?)\$\$|\$([^$\n]+?)\$/g;
  let lastIndex = 0;
  let match;
  while ((match = pattern.exec(text))) {
    parts.push(escapeHtml(text.slice(lastIndex, match.index)));
    const displayMode = match[1] !== undefined;
    parts.push(
      katex.renderToString(displayMode ? match[1] : match[2], {
        displayMode,
        throwOnError: false,
        strict: false,
      }),
    );
    lastIndex = pattern.lastIndex;
  }
  parts.push(escapeHtml(text.slice(lastIndex)));
  return parts.join("").replace(/\n/g, "<br />");
};
```

增加创建定义、展开节点和行内编辑状态；加载知识树后默认展开有子节点的节点；切换范围时清理状态。

- [ ] **Step 4: 复用现有保存链路**

`buildKnowledgeSavePayload` 从节点取得规范化定义并写入 `describe`；新增弹窗确认时同时提交定义；行内定义编辑只更新 `knowledgeDraftData`，仍由当前行“保存”按钮提交。

- [ ] **Step 5: 实现列表和新增弹窗交互**

新增定义列、摘要、完整浮层、textarea、展开按钮和创建实时预览；所有可见文案先通过 `trans("basicSetting.*", "中文")` 调用。

- [ ] **Step 6: 运行测试确认 GREEN**

Run: `npm test -- src/routes/BasicSetting/index.helpers.test.js --runInBand`

Expected: PASS。

- [ ] **Step 7: 提交**

```bash
git add src/routes/BasicSetting/index.jsx src/routes/BasicSetting/index.helpers.test.js
git commit -m "feat: 恢复知识点定义维护交互"
```

### Task 3：CSS Modules 与响应式布局

**Files:**

- Modify: `src/routes/BasicSetting/index.module.less`
- Modify: `src/routes/BasicSetting/index.helpers.test.js`

- [ ] **Step 1: 增加样式契约失败断言**

断言样式文件包含 `knowledgeDefinitionCell`、`knowledgeDefinitionPreviewButton`、`knowledgeDefinitionHoverCard`、`knowledgeDefinitionTextarea`、`knowledgeDefinitionEditorGrid` 和移动端覆盖。

- [ ] **Step 2: 运行测试确认 RED**

Run: `npm test -- src/routes/BasicSetting/index.helpers.test.js --runInBand`

Expected: FAIL，提示定义样式缺失。

- [ ] **Step 3: 实现三列和定义样式**

桌面使用 `minmax(220px, 0.9fr) minmax(240px, 1fr) auto`；浮层限制宽度并允许长文本换行；移动端改为单列堆叠，保证操作按钮可见且页面无横向溢出。

- [ ] **Step 4: 运行测试确认 GREEN**

Run: `npm test -- src/routes/BasicSetting/index.helpers.test.js --runInBand`

Expected: PASS。

- [ ] **Step 5: 提交**

```bash
git add src/routes/BasicSetting/index.module.less src/routes/BasicSetting/index.helpers.test.js
git commit -m "style: 完善知识点定义响应式展示"
```

### Task 4：中英文文案

**Files:**

- Create: `src/i18n/knowledgeDefinitionI18n.test.js`
- Modify: `src/i18n/zh-CN.js`
- Modify: `src/i18n/en.js`

- [ ] **Step 1: 写词条完整性失败测试**

```js
const requiredKeys = [
  "basicSetting.knowledgeDefinition",
  "basicSetting.enterKnowledgeDefinition",
  "basicSetting.noKnowledgeDefinition",
  "basicSetting.expandKnowledge",
  "basicSetting.collapseKnowledge",
];
```

读取中英文词典，断言每个 key 均存在且值非空。

- [ ] **Step 2: 运行测试确认 RED**

Run: `npm test -- src/i18n/knowledgeDefinitionI18n.test.js --runInBand`

Expected: FAIL，提示新增词条缺失。

- [ ] **Step 3: 补齐中英文词条**

中文使用“知识点定义”“请输入知识点定义，行内公式使用 $...$，块级公式使用 $$...$$”；英文使用自然表达 “Knowledge point definition” 和对应公式提示。同步补齐空状态、展开、收起、点击维护和预览标签。

- [ ] **Step 4: 运行测试确认 GREEN**

Run: `npm test -- src/i18n/knowledgeDefinitionI18n.test.js src/routes/BasicSetting/index.helpers.test.js --runInBand`

Expected: PASS。

- [ ] **Step 5: 提交**

```bash
git add src/i18n/knowledgeDefinitionI18n.test.js src/i18n/zh-CN.js src/i18n/en.js
git commit -m "feat: 补齐知识点定义双语文案"
```

### Task 5：Vite ESM mock

**Files:**

- Create: `mock/basicSettingTextbookKnowledge.mjs`
- Modify: `mock/index.mjs`

- [ ] **Step 1: 运行模块导入确认 RED**

Run: `node -e "import('./mock/basicSettingTextbookKnowledge.mjs')"`

Expected: FAIL，提示模块不存在。

- [ ] **Step 2: 创建定义 mock**

使用 ESM `export default` 提供知识点树，并实现查询、保存、删除、排序和章节保存 mock。保存处理必须使用空值合并而不是 `||`，保证空字符串可以清空定义：

```js
const definitionText = body.definitionText ?? body.describe ?? "";
existing.definitionText = definitionText;
existing.describe = definitionText;
```

- [ ] **Step 3: 注册 mock**

在 `mock/index.mjs` 保留现有 `.mjs` import，仅新增 `basicSettingTextbookKnowledge` import 和展开项。

- [ ] **Step 4: 验证模块导入 GREEN**

Run: `node -e "import('./mock/basicSettingTextbookKnowledge.mjs').then(m => { if (!m.default) process.exit(1) })"`

Expected: exit 0。

- [ ] **Step 5: 提交**

```bash
git add mock/basicSettingTextbookKnowledge.mjs mock/index.mjs
git commit -m "test: 增加知识点定义 Vite mock"
```

### Task 6：完整验证与交付记录

**Files:**

- Modify: `tasks/todo.md`

- [ ] **Step 1: 运行定向测试**

Run: `npm test -- src/routes/BasicSetting/index.helpers.test.js src/i18n/knowledgeDefinitionI18n.test.js --runInBand`

Expected: 全部 PASS。

- [ ] **Step 2: 运行静态检查**

Run: `npm run typecheck`

Run: `npx eslint src/routes/BasicSetting/index.jsx src/routes/BasicSetting/index.helpers.js src/routes/BasicSetting/index.helpers.test.js src/i18n/knowledgeDefinitionI18n.test.js mock/basicSettingTextbookKnowledge.mjs mock/index.mjs`

Run: `npm run duplication:scan`

Run: `git diff --check origin/main...HEAD`

Expected: 新增代码无错误；历史阻塞必须单独记录。

- [ ] **Step 3: 运行生产构建**

Run: `npm run build`

Expected: Vite production build exit 0。

- [ ] **Step 4: 浏览器验收**

启动 Vite 后验证 `/basicSetting` 的中文和英文、桌面和手机视口、定义新增/修改/清空、行内/块级公式、悬停完整展示和树展开收起；检查控制台和页面级横向溢出。

- [ ] **Step 5: 更新任务审查记录并提交**

在 `tasks/todo.md` 写明 RED/GREEN、测试、构建、浏览器结果、边界情况和残余风险，然后提交。
