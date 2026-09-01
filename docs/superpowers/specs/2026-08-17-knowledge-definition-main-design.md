# 知识点定义完整迁移设计

## 背景

`feature/20260623-知识点定义` 在旧 `master` 上实现了知识点定义维护，但 2026-08-12 的线上制品来自 `main`，未包含该功能。旧分支不能直接合并到当前 `main`：当前基线已经迁移到 Vite、ESM、JSX、CSS Modules 和中英文国际化，直接合并存在源码与 mock 冲突，并会引入失效测试路径。

## 目标

从最新 `origin/main` 重新实现旧分支的完整用户能力：

- 查询知识点树时读取定义文本，并兼容历史字段名和历史 HTML 内容。
- 已有知识点支持行内维护定义；空定义可保存并清空后端旧值。
- 新增知识点时可同时填写定义。
- 定义支持 `$...$` 行内公式和 `$$...$$` 块级公式的 KaTeX 预览。
- 列表中显示单行摘要，悬停或聚焦时显示完整定义。
- 非末级知识点支持展开和收起，加载后默认展开全部有子节点的节点。
- 中文和英文界面均提供完整文案，并验证英文布局。
- Vite mock 环境能够覆盖知识点定义的查询、新增、修改和清空。

## 非目标

- 不合并旧 `master` 历史，不恢复 roadhog 构建配置。
- 不修改 Teaching Task 后端接口或数据库。
- 不新增第三方依赖；复用 `main` 已有的 `katex@0.16.45`。
- 不重构 `BasicSetting` 大组件，不改变章节管理、知识点导入和页面功能设置的既有行为。

## 数据边界

后端权威写字段为 `describe`。页面内部统一使用 `definitionText`，读取时按以下顺序兼容：`definitionText`、`definition`、`knowledgeDefinition`、`describe`、`description`、`knowledgeDescribe`、`knowledgeDescription`。保存时只把规范化后的纯文本写入 `describe`，不向后端新增未声明契约。

历史 HTML 定义只提取纯文本，避免把旧富文本直接注入页面。普通文本先进行 HTML 转义，再只把 `$...$` 与 `$$...$$` 片段交给 KaTeX；KaTeX 使用 `throwOnError: false`，无效公式按可见错误样式保留，不阻断编辑。

## 页面交互

- 知识点列表由“知识点名称 / 操作”扩展为“知识点名称 / 知识点定义 / 操作”。
- 定义列默认展示摘要；点击进入 textarea 行内编辑，失焦、Escape 或 Ctrl/Cmd+Enter 退出编辑。
- 编辑只更新页面草稿，继续复用当前行“保存”按钮提交，避免建立第二条保存链路。
- 新增弹窗增加定义 textarea 和实时预览；确认新增时名称与定义一次提交。
- 有子节点的知识点显示展开按钮；无子节点显示稳定占位，避免布局跳动。
- 定义为空时显示双语空状态；完整内容通过 hover/focus 浮层查看。

## 文件边界

- `src/routes/BasicSetting/index.helpers.js`：定义字段兼容、纯文本归一化、可展开节点收集。
- `src/routes/BasicSetting/index.jsx`：KaTeX 安全渲染、定义编辑状态、保存参数和树展开交互。
- `src/routes/BasicSetting/index.module.less`：三列表格、定义编辑/预览/浮层和响应式样式。
- `src/routes/BasicSetting/index.helpers.test.js`：数据映射、页面契约和交互源码回归测试。
- `src/i18n/zh-CN.js`、`src/i18n/en.js`：全部新增可见文案。
- `src/i18n/knowledgeDefinitionI18n.test.js`：中英文词条完整性测试。
- `mock/basicSettingTextbookKnowledge.mjs`、`mock/index.mjs`：Vite ESM mock 数据和注册。

## 错误与边界

- `null`、空字符串和缺失定义统一显示为空，保存空字符串以支持清空。
- 定义中的 HTML 标签不会作为 HTML 渲染；脚本、事件属性等内容只能以文本出现。
- 无效 LaTeX 不抛出页面异常。
- 切换学段、学科或版本时重置展开和编辑状态，避免旧树状态污染新范围。
- 长文本、长英文和公式在桌面、窄桌面、平板、手机宽度下不得遮挡操作列或产生页面级横向溢出。

## 验证

- 先运行定向测试验证 RED，再分批实现并验证 GREEN。
- 使用 Node v16.20.2 运行 BasicSetting 与 i18n 测试。
- 运行触达文件 ESLint、TypeScript 检查、生产构建、重复代码扫描和 `git diff --check`。
- 启动本地 Vite，使用浏览器检查中文/英文、桌面/移动端、公式预览、编辑、清空和展开收起。
