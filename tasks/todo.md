# 当前任务：前端生成原卷 zip 与班级原卷 PDF

## 成功标准

- [x] 右上角“导出原卷”不再调用 `/api/exam/originalVolume/exportZip/create` 和 `/api/exam/originalVolume/exportZip/status`。
- [x] “导出原卷”复用学生得分当前筛选条件，通过现有 `/api/exam/resultListByGroup` 拉取全集学生列表并在浏览器生成 zip。
- [x] 前端 zip 文件名、根目录、班级目录、学生目录、图片文件名、非法字符清理、重复名处理、图片后缀白名单与服务端规则一致。
- [x] zip 导出遇到任意学生任意一张原卷图片读取失败时终止并提示具体学生和第几张图片。
- [x] 查看原卷弹层右上角新增“按班级导出 PDF”按钮，按钮靠近“退出”按钮。
- [x] 查看原卷弹层选择全部班级时 PDF 导出按钮置灰，悬浮提示切换到具体班级才可以导出。
- [x] PDF 导出不调用新增后端接口，基于当前班级学生列表的原卷图片按顺序拼成一个 PDF 并下载。
- [x] 若新增依赖，必须在修改前明确告知并等待确认；zip 阶段不新增依赖，PDF 阶段已在用户确认后新增 `jspdf`。
- [x] 中英文文案完整维护，不新增学校、班级、阈值、环境地址等业务硬编码。
- [x] 完成相关单元测试、局部 lint 或说明历史阻塞、`git diff --check` 和抽象泄露复查。

## 子任务 1：前端生成 zip 替换后端异步 zip

- [x] 补失败测试：前端 zip 工具复刻服务端命名、目录、清理、重复名和后缀规则。
- [x] 补失败测试：`StudentScore` 导出原卷调用现有学生得分接口并触发前端 zip 下载，不调用原异步任务接口。
- [x] 新增前端原卷 zip 工具，使用现有 `jszip` 生成 Blob 并触发浏览器下载。
- [x] 改造 `StudentScore` 的“导出原卷”流程，去除原创建任务和轮询逻辑。
- [x] 删除前端原异步 zip service 和对应测试，避免保留无用并行路径。
- [x] 运行 Node 16 相关测试、局部 lint 和 diff 检查。

## 子任务 2：查看原卷弹层班级 PDF 导出

- [x] 提前确认是否允许新增 `jspdf` 依赖。
- [x] 补失败测试：全部班级时 PDF 按钮禁用并提示切换到具体班级。
- [x] 补失败测试：具体班级时按当前班级学生列表顺序生成 PDF。
- [x] 实现 PDF 图片读取、页面排版、下载与失败提示。
- [x] 运行 Node 16 相关测试、局部 lint、diff 检查和本地浏览器编译验证；UI 点击验证受本地登录态阻塞，已记录残余风险。

## 审查

- 已确认 zip 阶段不新增依赖，项目已有 `jszip`。
- 已确认 PDF 阶段当前项目没有 PDF 生成库；`pdfjs-dist` 只能展示/解析 PDF，预计需要新增 `jspdf`，将在进入子任务 2 前再次确认。
- 已确认纯前端读取原卷图片依赖图片地址允许浏览器跨域读取，若 OSS 或图片服务未配置 CORS，前端 zip/PDF 会失败并展示可诊断错误。
- 已确认服务端当前 zip 规则来自 `OriginalVolumeExportZipUtil` 和 `ExamResultAnalyseServiceImpl#writeOriginalVolumeZip`。
- 子任务 1 RED：先新增 `src/components/StudentScore/originalVolumeZip.test.js` 和调整 `src/components/StudentScore/index.test.js`，首次运行失败于 `./originalVolumeZip` 模块不存在。
- 子任务 1 实现：新增 `src/components/StudentScore/originalVolumeZip.js`，前端复刻服务端路径清理、重复名、后缀白名单和缺图失败规则；`StudentScore` 改为调用既有 `queryStuScore` 拉取全集并在浏览器生成 zip。
- 子任务 1 清理：删除前端 `src/services/originalVolumeExport.js`、`src/services/originalVolumeExport.test.js` 和 mock 中原异步任务接口，避免继续保留前端并行路径。
- 子任务 1 路由数据：`DataAnalysis` 与 `ClassroomEvaluation` 向 `StudentScore` 透传 `examName`，用于保持 zip 文件名与服务端规则一致。
- 子任务 1 验证：`npm test -- src/components/StudentScore/originalVolumeZip.test.js src/components/StudentScore/index.test.js src/components/AreaHeaderComponent/index.test.js --runInBand` 通过，3 个测试套件、12 个用例通过；输出仍有既有 `history/createHashHistory` warning。
- 子任务 1 局部 lint：`npx eslint src/components/StudentScore/originalVolumeZip.js src/components/StudentScore/originalVolumeZip.test.js src/components/StudentScore/index.test.js` 通过；仅有 Node 运行时 `fs.Stats constructor` 弃用提示。
- 子任务 1 差异检查：`git diff --check` 通过。
- 子任务 1 全量 changed lint：`npm run lint:changed` 仍失败于历史问题，主要来自 `mock/exam.js`、`StudentScore/index.js`、`DataAnalysis/index.js` 等大文件既有 import、JSDoc、复杂度、prop-types、no-null、a11y 等问题；本次新增 zip 工具和相关测试已单独通过 eslint。
- 子任务 2 依赖确认：用户已确认允许新增 `jspdf`；初次安装 `jspdf@4.2.1` 后本地 roadhog 无法解析其传递依赖 `fast-png` 的新语法，已改为精确锁定 `jspdf@2.5.2`；`package.json` 只新增 `jspdf` 一项，`package-lock.json` 只新增 `jspdf` 及其传递/可选依赖锁定记录，未主动升级已有依赖。
- 子任务 2 RED：新增 `src/components/StudentScore/originalVolumePdf.test.js` 并扩展 `src/components/StudentScore/index.test.js`，首次运行失败于 `./originalVolumePdf` 模块不存在。
- 子任务 2 实现：新增 `src/components/StudentScore/originalVolumePdf.js`，用 `jspdf` 按学生列表顺序逐张图片写入 PDF；图片统一转为 JPEG 后等比居中写入 A4 页面。
- 子任务 2 弹层入口：查看原卷弹层标题栏在“退出”按钮左侧新增“按班级导出 PDF”；`groupId1` 为全部班级时按钮禁用并通过 Tooltip 提示“切换到具体班级后才可以导出”。
- 子任务 2 数据范围：PDF 导出点击时重新调用既有 `queryStuScore` 拉取当前具体班级全集，清空弹层搜索词，避免只导出搜索结果；不新增后端导出接口。
- 子任务 2 验证：`npm test -- src/components/StudentScore/originalVolumeZip.test.js src/components/StudentScore/originalVolumePdf.test.js src/components/StudentScore/index.test.js src/components/AreaHeaderComponent/index.test.js --runInBand` 通过，4 个测试套件、17 个用例通过；输出仍有既有 `history/createHashHistory` warning。
- 子任务 2 局部 lint：`npx eslint src/components/StudentScore/originalVolumeZip.js src/components/StudentScore/originalVolumeZip.test.js src/components/StudentScore/originalVolumePdf.js src/components/StudentScore/originalVolumePdf.test.js src/components/StudentScore/index.test.js src/components/AreaHeaderComponent/index.test.js` 通过。
- 子任务 2 差异检查：`git diff --check` 通过。
- 子任务 2 全量 changed lint：`npm run lint:changed` 仍失败于历史问题，主要来自 `mock/exam.js`、`StudentScore/index.js`、`DataAnalysis/index.js` 等大文件既有 import、JSDoc、复杂度、prop-types、no-null、a11y 等问题；本次新增 PDF/zip 工具和相关测试已单独通过 eslint。
- 子任务 2 浏览器验证：默认 `task.local.yungu-inc.org:8000` 因本机已有其它项目占用且域名解析失败无法启动；改用 `HOST=127.0.0.1 PORT=8001 PROXY=true ESLINT=none ./node_modules/.bin/roadhog dev` 后编译通过，仅有既有 less autoprefixer warning。Chrome 访问 `/dataAnalysis/1/1/4` 时被“您的登录已超时”弹层阻塞，无法在当前本地环境完成查看原卷弹层按钮点击验证；按钮禁用、Tooltip、导出参数和下载调用已由组件测试覆盖。
- 最终验证：使用 Node v16.20.2 运行 `npm test -- src/components/StudentScore/originalVolumeZip.test.js src/components/StudentScore/originalVolumePdf.test.js src/components/StudentScore/index.test.js src/components/AreaHeaderComponent/index.test.js --runInBand` 通过，4 个测试套件、17 个用例通过；局部 `npx eslint` 通过；`git diff --check` 通过；`npm ls jspdf --depth=0` 确认为 `jspdf@2.5.2`。
- 抽象泄露复查：受当前可用 subagent 工具限制，不能在用户未明确要求 subagent 的情况下派发独立 subagent；本次由主会话复查触达边界，新增 zip/PDF 工具只接收明确业务数据 `examName/groupName/studentList`，组件不需要理解 `jspdf` 或 `jszip` 内部细节，路由只透传测验名称，不暴露 PDF/zip 实现细节。残余风险是浏览器端读取 OSS 图片依赖 CORS。

# 当前任务：学生得分导出原卷 zip

## 成功标准

- [x] 学生得分页右上角导出入口变为下拉菜单，且不影响未传菜单项的旧 `AreaHeaderComponent` 用法。
- [x] “导出明细”继续打开原 Excel 导出地址 `/api/export/exam/resultListByGroup`。
- [x] “导出原卷”按当前筛选创建异步任务，并轮询状态直到成功或失败。
- [x] 生成中展示可关闭提示；关闭前二次确认，确认后停止本次轮询。
- [x] 成功后打开 OSS `downloadUrl`，失败后展示后端失败信息。
- [x] 组件卸载时清理轮询定时器。
- [x] 文案具备中英双语配置，不新增学校、班级、阈值或环境地址等业务硬编码。
- [x] 补充服务和组件相关回归测试，运行最小相关验证。

## 子任务

- [x] 先补失败测试，覆盖原卷 zip 服务接口和导出菜单兼容行为。
- [x] 扩展 `AreaHeaderComponent` 的可选导出菜单，并保持旧单按钮行为。
- [x] 新增原卷 zip 创建任务和状态查询服务方法。
- [x] 接入 `StudentScore` 导出菜单、创建任务、轮询、成功/失败和取消确认。
- [x] 新增中英双语文案。
- [x] 运行相关测试、语法检查和差异空白检查。

## 审查

- 已先新增 `src/services/originalVolumeExport.test.js`、`src/components/AreaHeaderComponent/index.test.js`、`src/components/StudentScore/index.test.js`，首次运行失败，失败原因为服务方法、命名导出和原卷导出参数方法尚不存在。
- 已在 `AreaHeaderComponent` 增加可选 `exportMenuItems`：传入菜单时用 antd 3 `Dropdown + Menu`，未传时保持原单按钮 `onClickExport` 行为。
- 已在 `StudentScore` 增加“导出明细 / 导出原卷”菜单；导出明细仍打开原 Excel URL；导出原卷复用当前 `examId/groupId/searchStudentKeyWord/isSort/filterFlag` 创建任务。
- 已接入原卷 zip 创建任务和 3 秒轮询：`PROCESSING` 继续轮询，`SUCCESS` 打开 `downloadUrl`，`FAIL` 展示后端 `message`。
- 已增加生成中 Modal 提示；用户关闭时通过 `Modal.confirm` 二次确认，确认后停止本次轮询；组件卸载时也会清理定时器。
- 已补导出流水号校验，避免用户关闭任务 A 后重新发起任务 B 时，任务 A 的延迟响应覆盖任务 B 的轮询和下载。
- 已将原卷 zip 接口从 `example.js` 拆到 `src/services/originalVolumeExport.js`，避免继续放大 `example.js` 的行数历史债。
- 已新增中英双语文案，未新增学校、班级、阈值、环境地址等业务硬编码。
- 已使用 Node v16.20.2 运行 `npm test -- src/services/originalVolumeExport.test.js src/components/AreaHeaderComponent/index.test.js src/components/StudentScore/index.test.js --runInBand`，3 个测试套件、10 个用例通过；输出仍有既有 `history/createHashHistory` 弃用 warning。
- 已运行 `npx eslint src/services/originalVolumeExport.js src/services/originalVolumeExport.test.js src/components/AreaHeaderComponent/index.test.js src/components/StudentScore/index.test.js`，通过。
- 已运行前端 `git diff --check`，通过。
- 已运行 `npm run lint:changed`，失败于触达旧组件/样式文件的大量历史 lint 债，例如 `AreaHeaderComponent` 类组件、`StudentScore` 既有 alias import/复杂度/prop-types、`index.less` 既有 class 命名规则；本次新增的 `example.js` 行数超限和新增 `.export-arrow` 命名问题已处理，未在本次任务中做大规模重构。

# 当前任务：校内外对比文本 AI 解析接入

# 当前任务：平均成绩 AI 解析提示词和 Schema 强约束

## 成功标准

- [x] 平均成绩 AI 解析使用强约束提示词，明确完整性原则、记录拆分和只返回 `scoreRows`。
- [x] 平均成绩 AI 解析的 JSON Schema 为 `scoreRows` 字段设置 `required`，并限制 `targetLineRows.maxItems = 0`。
- [x] 分数线 AI 解析使用强约束提示词，明确分数线宽表、数字表头、完整对象、4 位上线率和 warnings 兜底。
- [x] 分数线 AI 解析的 JSON Schema 限制 `scoreRows.maxItems = 0`，并为 `targetLineRows` 设置完整字段 `required`。
- [x] 平均成绩和分数线两个 AI 入口提交前都会将空格对齐表格规范化为 Tab 分隔文本。
- [x] 调试页“平均成绩样例”同步使用同一套提示词和 Schema。
- [x] 调试页“分数线样例”同步使用同一套提示词和 Schema。
- [x] 补充回归测试并运行 Node 16 验证。

## 子任务

- [x] 修改服务层测试，断言平均成绩请求使用强约束提示词和 Schema。
- [x] 修改服务层平均成绩提示词和 Schema 生成逻辑。
- [x] 修改服务层测试，断言分数线请求使用强约束提示词和 Schema。
- [x] 修改服务层分数线提示词和 Schema 生成逻辑。
- [x] 同步调试页平均成绩样例的提示词和 Schema。
- [x] 同步调试页分数线样例的提示词和 Schema。
- [x] 运行相关测试和静态检查。

## 审查

- 已先修改 `qualityBenchmark.test.js`，断言平均成绩 AI 请求包含“完整性原则”“记录拆分”，并校验 `scoreRows.items.required` 和 `targetLineRows.maxItems = 0`；修改实现前测试失败，失败原因为旧提示词不包含“完整性原则”。
- 已新增平均成绩专用 JSON Schema，`scoreRows` 中每条记录要求 `schoolName`、`subjectName`、`studentCount`、`avgScore`、`passRate`、`goodRate`、`excellentRate`，并要求顶层返回 `scoreRows`、`targetLineRows`、`warnings`。
- 已新增平均成绩专用提示词，使用用户提供的 Role、Task、Core Rules、Field Mapping 和 Output Format，并保留当前考试、年级和 Tab 分隔说明。
- 已新增分数线专用 JSON Schema，限制 `scoreRows.maxItems = 0`，并要求每条 `targetLineRows` 包含 `schoolName`、`studentCount`、`targetScore`、`onlineCount`、`onlineRate`。
- 已新增分数线专用提示词，明确数字表头是分数线、剔除“分”等单位、每个学校按每个分数线展开完整对象、onlineRate 按公式计算并保留 4 位小数、无异常时 warnings 返回空数组。
- 已确认 `normalizeQualityBenchmarkInputText` 在请求体构建前统一执行，平均成绩和分数线两个 AI 入口都会将空格对齐表格转换为 Tab 分隔文本。
- 已同步 `tasks/ai-text-analysis-debug.html`，点击“载入平均成绩样例”和“载入分数线样例”时会分别使用对应强约束提示词和 Schema。
- 已使用 Node v16.20.2 运行 `npm test -- src/services/qualityBenchmark.test.js --runInBand`，1 个测试套件、5 个用例通过。
- 已使用 Node v16.20.2 运行 `npm test -- src/services/qualityBenchmark.test.js src/routes/NewScoreSummary/components/QualityBenchmark/modalSave.test.js --runInBand`，2 个测试套件、10 个用例通过；输出仍有既有 Ant Table key 和 React unmounted warning。
- 已使用 Node v16.20.2 运行 `npx eslint src/services/qualityBenchmark.js src/services/qualityBenchmark.test.js`，仍失败于 `src/services/qualityBenchmark.js:271` 的历史兼容性问题 `Promise is not supported in op_mini all`，对应旧图片识别 `readFileAsDataUrl`，本次新增重复字符串问题已处理。
- 已运行 HTML 内联脚本语法检查，结果为 `script 1 syntax ok`。
- 已运行 `node --check tasks/ai-text-analysis-proxy.js`，通过。
- 已运行 `git diff --check -- src/services/qualityBenchmark.js src/services/qualityBenchmark.test.js tasks/ai-text-analysis-debug.html tasks/ai-text-analysis-proxy.js tasks/todo.md`，通过。

# 当前任务：AI 网关文本解析 H5 调试页

## 成功标准

- [x] 提供一个可本地打开的 H5 调试页，用于快速调整 `inputText`、提示词和 Schema。
- [x] 调试页支持生成注入脚本，能在 `ai.yungu.org` 同源页面中调用网关并携带登录态。
- [x] 内置平均成绩样例、总分上线样例和空格转 Tab 工具，方便对比 AI 解析效果。
- [x] 做静态语法和空白检查。

## 子任务

- [x] 新增 `tasks/ai-text-analysis-debug.html`。
- [x] 在调试页中实现请求体编辑、请求发送、响应展示和注入脚本生成。
- [x] 运行基本静态检查并记录结果。

## 审查

- 已新增 `tasks/ai-text-analysis-debug.html`，支持编辑 `inputText`、`analysisInstruction`、`analysisType`、`model`、`forceAnalysis` 和 `jsonSchema`。
- 已内置平均成绩样例、总分上线样例、空格对齐文本转 Tab、请求体复制、响应展示、`analysisJson` 和 `analysisText` 分栏查看。
- 已支持生成同源注入脚本：打开 `https://ai.yungu.org/exam` 后在控制台执行，可让调试页运行在 `ai.yungu.org` 域下并携带登录态请求网关。
- 已补充可选 `Authorization` 输入框和复制 curl 功能，便于处理 AI 网关返回 `Missing bearer or basic authentication in header` 的认证场景。
- 已新增 `tasks/ai-text-analysis-proxy.js` 本地代理，并在调试页增加请求模式、Cookie 输入框和代理地址输入框；代理模式下由本地 Node 服务转发 Cookie 到 AI 网关。
- 已将调试页“总分上线样例”调整为“分数线样例”，并同步使用分数线宽表专用提示词和 JSON Schema：`scoreRows.maxItems = 0`，`targetLineRows` 每条记录强制包含学校、考试人数、分数线、上线人数和上线率。
- 已用 Node 解析 HTML 内联脚本，结果为 `script 1 syntax ok`。
- 已运行 `node --check tasks/ai-text-analysis-proxy.js`，通过。
- 已运行 `git diff --check -- tasks/ai-text-analysis-debug.html tasks/ai-text-analysis-proxy.js tasks/todo.md`，通过。

# 当前任务：AI 解析固定调用 ai.yungu.org

## 成功标准

- [x] 校内外对比 AI 文本解析固定请求 `https://ai.yungu.org/center/api/file-services/textAnalysis`。
- [x] AI 解析请求不再依赖当前页面域名或相对路径。
- [x] 提交给 AI 的空格对齐表格会先规范化为 Tab 分隔文本，降低列错位和字段拼接风险。
- [x] 补充服务层回归测试并运行 Node 16 验证。

## 子任务

- [x] 修改服务层测试，断言 AI 解析固定调用 `ai.yungu.org`。
- [x] 修改 `analyzeQualityBenchmarkText` 请求地址常量。
- [x] 修改服务层测试，断言空格对齐宽表会在提交 AI 前转换为 Tab 分隔。
- [x] 增加 AI 入参文本规范化逻辑和对应提示词约束。
- [x] 运行相关测试、`git diff --check` 和必要的 lint 检查。

## 审查

- 已先修改 `qualityBenchmark.test.js` 断言固定请求 `https://ai.yungu.org/center/api/file-services/textAnalysis`，在 Node v16.20.2 下运行失败，失败原因为现有实现仍请求 `/center/api/file-services/textAnalysis`。
- 已将 `QUALITY_BENCHMARK_TEXT_ANALYSIS_URL` 固定为 `https://ai.yungu.org/center/api/file-services/textAnalysis`，只影响校内外对比 AI 文本解析请求。
- 已补 `qualityBenchmark.test.js` 回归测试，先运行失败，失败原因为请求体 `inputText` 仍保留空格对齐宽表，没有转换为 Tab 分隔。
- 已新增 AI 入参文本规范化：提交前按行 trim、去空行，并将列间空白转换为 Tab；提示词同步要求 AI 严格按 Tab 列解析。
- 已使用 Node v16.20.2 运行 `npm test -- src/services/qualityBenchmark.test.js src/routes/NewScoreSummary/components/QualityBenchmark/modalSave.test.js --runInBand`，2 个测试套件、9 个用例通过。
- 已运行 `git diff --check -- src/services/qualityBenchmark.js src/services/qualityBenchmark.test.js tasks/todo.md tasks/lessons.md`，通过。
- 已使用 Node v16.20.2 运行 `npm run lint:changed`，仍失败于 `src/services/qualityBenchmark.js:171` 的历史兼容性问题 `Promise is not supported in op_mini all`，对应旧图片识别 `readFileAsDataUrl`，未纳入本次无关修复。

# 当前任务：去除校内外对比光华学校硬编码

# 当前任务：移除平均分 2.5 倍需校验拦截

# 当前任务：移除良好率前端推算

## 成功标准

- [x] 外校平均成绩数据缺少良好率时，前端不再用 `(及格率 + 优秀率) / 2` 推算。
- [x] 缺少良好率时表格和保存 payload 保持良好率为空。
- [x] 补充回归测试并运行相关验证。

## 子任务

- [x] 补失败测试覆盖缺少良好率时 `goodRate` 为 `undefined`。
- [x] 修改 `normalizeScoreRow`，只读取输入中的良好率。
- [x] 运行相关测试和 `git diff --check`，记录结果。

## 审查

- 已补 `parser.test.js` 回归测试，先运行失败，失败原因为缺少良好率时 `goodRate` 被推算为 `52.485`。
- 已修改 `normalizeScoreRow`，良好率只使用输入数据中的 `row.goodRate`，没有值时保持 `undefined`。
- 已使用 `/home/yungu/.cache/node16/node-v16.20.2-linux-x64/bin` 下的 Node v16.20.2 运行相关测试，覆盖解析、弹窗保存、保存范围、服务层和成绩汇总集成链路，5 个测试套件、33 个用例通过。
- 已运行 `git diff --check`，通过。
- 已使用 Node v16.20.2 运行 `npm run lint:changed`，仍失败于 `QualityBenchmark/index.js` 的历史 lint 债，合计 `477 problems (182 errors, 295 warnings)`，未纳入本次无关修复。

## 成功标准

- [x] 多校对比平均分不再因本校/外校均分比例达到 2.5 倍而显示“需校验”。
- [x] 外校导入或接口返回的平均分数值应直接展示和导出。
- [x] 移除 `isMetricScaleSuspect` / `suspectMap` 相关覆盖逻辑。
- [x] 扫描并列出当前组件里其它类似写死业务逻辑风险点。
- [x] 运行相关测试和 `git diff --check`。

## 子任务

- [x] 补失败测试覆盖 610.5 平均分不被“需校验”替换。
- [x] 删除 2.5 倍比例判断和平均分覆盖渲染。
- [x] 扫描其它硬编码阈值或业务口径并记录。
- [x] 运行验证并记录结果。

## 审查

- 已补 `modalSave.test.js` 回归测试，先运行失败，失败原因为外校 `610.5` 平均分被原 2.5 倍比例逻辑覆盖，页面找不到 `610.50`。
- 已删除 `isMetricScaleSuspect` 函数，移除 `ratio >= 2.5` 写死比例。
- 已删除 `suspectMap` 构建、排名过滤、表格渲染和导出中的“需校验”覆盖逻辑；接口或导入返回的平均分直接参与展示、排名和导出。
- 已扫描类似写死业务逻辑，仍需后续关注：三率默认口径 `60/75/85`，比例输入 `<=1` 自动乘 100，参考行通过学校名包含“平均/全区”识别，外校平均/区平均/本校为前端内置名称，AI 文本解析模型 `qwen3-max` 和 `forceAnalysis=false` 写在前端服务层，目标线最小值固定为 `0`，导入 placeholder 中 `650/600/550` 为示例文案；缺少良好率用 `(及格率+优秀率)/2` 推算的问题已在后续任务移除。
- 已运行 `npm test -- src/services/qualityBenchmark.test.js src/routes/NewScoreSummary/components/QualityBenchmark/parser.test.js src/routes/NewScoreSummary/components/QualityBenchmark/saveScope.test.js src/routes/NewScoreSummary/components/QualityBenchmark/modalSave.test.js src/routes/NewScoreSummary/qualityBenchmarkIntegration.test.js --runInBand`，32 个测试通过；输出仍有既有 Ant Table key、history CJS 和 jsdom canvas warning。
- 已运行 `git diff --check -- src/routes/NewScoreSummary/components/QualityBenchmark/index.js src/routes/NewScoreSummary/components/QualityBenchmark/modalSave.test.js tasks/todo.md`，通过。

## 成功标准

- [x] 本校学校名兜底不再写死为“光华外国语学校”，统一显示“本校”。
- [x] 本校行不再额外展示“本校”标签，避免出现“本校 本校”或重复标记。
- [x] 导出学校名不再追加“（本校）”后缀。
- [x] 测试 fixture 不再固化光华学校名称。
- [x] 运行相关测试和 `git diff --check`。

## 子任务

- [x] 补失败测试覆盖无学校名时的兜底展示和本校标签去重。
- [x] 修改 `QualityBenchmark` 学校名兜底、行展示和导出名称。
- [x] 更新测试 fixture，移除光华学校硬编码。
- [x] 运行验证并记录结果。

## 审查

- 已补 `modalSave.test.js` 回归测试，先运行失败，失败原因为页面仍展示“光华外国语学校”。
- 已将本校学校名兜底改为 `LOCAL_SCHOOL_NAME`，不再写死“光华外国语学校”。
- 已移除本校行内 `<em>本校</em>` 标签，避免学校名为“本校”时重复展示。
- 已调整导出学校名逻辑，本校行不再追加“（本校）”后缀。
- 已将测试 fixture 学校名改为“本校”，不再固化光华学校名称。
- 已运行 `npm test -- src/routes/NewScoreSummary/components/QualityBenchmark/modalSave.test.js --runInBand`，4 个测试通过；输出仍有既有 Ant Table key 和 React unmounted warning。
- 已运行 `git diff --check -- src/routes/NewScoreSummary/components/QualityBenchmark/index.js src/routes/NewScoreSummary/components/QualityBenchmark/modalSave.test.js tasks/todo.md`，通过。
- 已运行 `npm run lint:changed`，仍失败于 `QualityBenchmark/index.js` 和 `qualityBenchmark.js` 的既有 lint 债，合计 `495 problems (186 errors, 309 warnings)`；本次新增测试不再有 Testing Library lint 报错。

## 成功标准

- [x] 导入弹窗同时提供“前端解析”和“AI解析”两个按钮，用户可自主选择。
- [x] “前端解析”继续使用现有 `parseQualityBenchmarkImport`，不改变原有本地解析行为。
- [x] “AI解析”只读取文本框内容并调用 `/center/api/file-services/textAnalysis`，不新增图片上传或图片识别入口。
- [x] AI 调用使用当前浏览器登录态，不在前端写入 API Key 或 Authorization。
- [x] AI 返回的 `analysisJson` 被转换为现有 `scoreRows` / `targetLineRows` 草稿结构，并复用下方表格确认与保存流程。
- [x] AI 失败、无结果或登录态异常时展示可理解错误，不生成示例假数据。
- [x] 补充前端测试，先验证失败，再实现通过。

## 子任务

- [x] 补失败测试：服务层请求体包含 `inputText`、`analysisInstruction`、`analysisType`、`jsonSchema` 和 `forceAnalysis`。
- [x] 补失败测试：导入弹窗展示“前端解析”和“AI解析”，AI 结果能写入草稿表格。
- [x] 实现文本 AI 分析服务方法，并解析 `analysisJson` / `analysisText`。
- [x] 接入导入弹窗 AI 按钮和加载态，保留现有前端解析按钮。
- [x] 运行相关测试和 `git diff --check`，记录结果。

## 审查

- 已新增 `src/services/qualityBenchmark.test.js`，先运行失败，失败原因为 `analyzeQualityBenchmarkText is not a function`。
- 已新增弹窗测试，先运行失败，失败原因为找不到“前端解析”按钮。
- 已实现 `analyzeQualityBenchmarkText`，调用 `/center/api/file-services/textAnalysis`，只提交文本框内容、结构化 JSON Schema、分析指令和登录态请求。
- 已在导入弹窗保留“前端解析”，新增“AI解析”；AI 结果进入现有草稿表格，仍需用户保存。
- 已按用户纠正确认本次不新增图片上传或图片识别入口；历史未渲染的图片识别函数未纳入本次清理。
- 已运行 `npm test -- src/services/qualityBenchmark.test.js src/routes/NewScoreSummary/components/QualityBenchmark/parser.test.js src/routes/NewScoreSummary/components/QualityBenchmark/saveScope.test.js src/routes/NewScoreSummary/components/QualityBenchmark/modalSave.test.js src/routes/NewScoreSummary/qualityBenchmarkIntegration.test.js --runInBand`，30 个测试通过；输出仍有既有 Ant Table key、Modal unmounted、history CJS 和 jsdom canvas warning。
- 已运行 `git diff --check`，通过。
- 已运行 `npx eslint src/services/qualityBenchmark.test.js src/services/qualityBenchmark.js src/routes/NewScoreSummary/components/QualityBenchmark/modalSave.test.js`，仍失败于既有 `src/services/qualityBenchmark.js:167` 的 `Promise is not supported in op_mini all`，对应原有图片识别 `readFileAsDataUrl`。
- 已运行 `npm run lint:changed`，仍失败于校内外对比组件历史 lint 债和上述 `readFileAsDataUrl` 兼容性问题，合计 `496 problems (187 errors, 309 warnings)`；本次新增测试文件未出现新的 lint 报错。

# 当前任务：修复成绩汇总分析页加密参数解析失败

## 成功标准

- [x] URL 中 `date` 加密串包含 `+` 时，不会被解析成空格。
- [x] 成绩汇总分析页打开后能正确还原 `id` 或 `gradeId/reportType/semesterId`。
- [x] 切换 tab 和系统报告创建后回写 URL 时继续保留可解密参数。
- [x] 相关回归测试先失败后通过，并运行 `git diff --check`。

## 子任务

- [x] 补失败测试覆盖 `+`、已编码和未编码 `date` 读取。
- [x] 修复 `analysisSummary.js` 的 hash 参数读取和 tab 切换 URL 写入。
- [x] 修复成绩汇总列表打开分析页时的 `date` 编码。
- [x] 运行相关测试并提交推送到远程分支。

## 审查

- 已补 `qualityBenchmarkIntegration.test.js`，覆盖未编码 `+`、已编码 `%2B/%2F/%3D` 和写入编码。
- 已修复 `analysisSummary.js`，不再使用 `URLSearchParams` 读取 AES 加密串，避免 `+` 被转成空格，同时保留 `=` padding。
- 已修复 tab 切换、系统报告创建后回写 URL、成绩汇总列表打开分析页的 `date` 编码。
- 已先运行新增测试并看到失败，再修复后运行通过。
- 已运行 `npm test -- src/routes/NewScoreSummary/components/QualityBenchmark/parser.test.js src/routes/NewScoreSummary/components/QualityBenchmark/saveScope.test.js src/routes/NewScoreSummary/components/QualityBenchmark/modalSave.test.js src/routes/NewScoreSummary/qualityBenchmarkIntegration.test.js --runInBand`，26 个测试通过；输出仍有既有 Ant Table key、React unmounted、history CJS 和 jsdom canvas warning。
- 已运行 `git diff --check`，通过。

# 当前任务：修复总分上线低分数线和粘贴残留列

## 成功标准

- [x] 总分上线宽表支持 `0`、`1` 这类低分数线。
- [x] 总分上线宽表只有一个目标线列时也能识别。
- [x] 粘贴总分上线数据同步到下方表格时替换当前草稿，不再残留旧目标线列。
- [x] 补充回归测试并运行相关前端测试。

## 审查

- 已将目标线识别阈值从 `>= 100` 调整为 `>= 0`。
- 已将总分上线粘贴同步从追加草稿改为替换草稿，避免旧的 `670` 等历史列残留。
- 已补 `parser.test.js` 覆盖低分数线和单目标线列。
- 已补 `modalSave.test.js` 覆盖粘贴目标线替换旧草稿后保存。
- 已运行 `npm test -- src/routes/NewScoreSummary/components/QualityBenchmark/parser.test.js src/routes/NewScoreSummary/components/QualityBenchmark/saveScope.test.js src/routes/NewScoreSummary/components/QualityBenchmark/modalSave.test.js src/routes/NewScoreSummary/qualityBenchmarkIntegration.test.js --runInBand`，23 个测试通过；输出仍有 Ant Table 既有 key warning。
- 已运行 `git diff --check`，通过。

# 当前任务：丰富校内外对比导入占位文案

## 成功标准

- [x] 多校对比粘贴输入框展示完整宽表样例，覆盖总分、语文、数学、英语。
- [x] 总分上线粘贴输入框明确提示分数线必须替换为本场考试实际口径。
- [x] 手动新增分数线输入框给出 `650` 这类具体示例。
- [x] 补充回归断言，避免占位文案再次退化。

## 审查

- 已更新 `QualityBenchmark` 导入输入框 placeholder。
- 已补 `qualityBenchmarkIntegration.test.js` 校验关键提示文案。

# 当前任务：校内外总分上线分数线用户输入修复

## 成功标准

- [x] 总分上线主页面不再混入前端固定默认分数线。
- [x] 已保存或导入目标线时，只展示数据中存在的分数线。
- [x] 编辑弹窗不再通过“新增行”固定生成 `700` 目标线。
- [x] 编辑弹窗支持用户先输入分数线并新增列，再新增学校行填写上线人数或上线率。
- [x] 完成前端局部测试和 `git diff --check`。

## 子任务

- [x] 补失败测试：无目标线不展示默认线，只展示用户录入线。
- [x] 移除 `DEFAULT_TARGET_LINES` 对真实展示和草稿的影响。
- [x] 拆分总分上线编辑弹窗的新增分数线和新增学校逻辑。
- [x] 更新经验教训，避免后续再写死不同考试的分数线。
- [x] 运行完整相关前端测试并提交。

## 审查

- 已补 `parser.test.js` 覆盖目标线为空时不展示默认线、只展示用户导入或保存的目标线。
- 已补 `qualityBenchmarkIntegration.test.js`，防止重新引入 `DEFAULT_TARGET_LINES` 或固定 `targetScore: 700`。
- 已运行 `npm test -- src/routes/NewScoreSummary/components/QualityBenchmark/parser.test.js src/routes/NewScoreSummary/components/QualityBenchmark/saveScope.test.js src/routes/NewScoreSummary/components/QualityBenchmark/modalSave.test.js src/routes/NewScoreSummary/qualityBenchmarkIntegration.test.js --runInBand`，19 个测试通过；输出仍有 Ant Table 既有 key warning。
- 已运行 `git diff --check`，通过。

# 当前任务：成绩汇总校内外对比真实页面回归

## 成功标准

- [x] 前端最近提交 `8eee876c`、`814505c4` 的页面入口、组件状态、保存范围和接口 payload 被核对。
- [x] Chrome 中验证成绩汇总分析页可进入“校内外对比”标签。
- [x] 验证前端保存范围：三率口径、平均成绩、总分上线三类保存请求互不覆盖。
- [x] 验证空行保存校验提示。
- [ ] 真实页面完整粘贴保存和刷新回显仍需人工或可写剪贴板环境复核。
- [x] 发现问题时记录复现步骤、请求参数、响应、截图或页面可观察结果。
- [x] 完成后运行允许范围内的最小相关前端测试，不默认运行全量打包。

## 审查记录

- 已读取 `tasks/lessons.md`，确认跨分支移植只关注校内外对比业务范围。
- 已确认相关前端提交：`8eee876c feat: 移植校内外对比功能`、`814505c4 fix: 修复校内外对比保存范围`。
- Chrome 真实页面复现：进入 `校内外对比 -> 多校对比 -> 编辑数据`，粘贴 `Codex测试学校-平均` 后草稿可生成，保存按钮可见且 enabled；点击保存按钮、坐标点击、DOM 节点点击、Enter 均无响应，取消按钮可正常关闭。
- 按用户建议刷新页面后，`系统异常` 不再出现；重新打开编辑弹窗，点击“新增行”后保存按钮可触发“请至少确认一条平均成绩数据”校验，说明刷新后按钮回调恢复。
- Chrome 控制通道当前无法粘贴或填充完整测试数据，报错为 `Browser Use virtual clipboard is not installed`；真实页面完整保存未继续写入 daily 数据。
- 已新增 `modalSave.test.js` 覆盖“粘贴平均成绩 -> 同步 -> 点击保存 -> 调用保存接口”的交互链路。
- 已运行 `npm test -- src/routes/NewScoreSummary/components/QualityBenchmark/modalSave.test.js src/routes/NewScoreSummary/components/QualityBenchmark/saveScope.test.js src/routes/NewScoreSummary/components/QualityBenchmark/parser.test.js src/routes/NewScoreSummary/qualityBenchmarkIntegration.test.js --runInBand`，13 个测试通过；测试输出 Ant Table 既有 key warning。

# 当前任务：移植成绩汇总校内外对比

- [x] 确认 `25b829c5` 中只移植校内外成绩对比相关代码，丢弃智学网导入说明和上传入口改动
- [x] 先补充失败测试，验证成绩汇总分析页应接入“校内外对比”标签和质量基准组件
- [x] 新增校内外对比组件和识图服务文件
- [x] 手工合并成绩汇总分析页和汇总列表跳转接入口
- [x] 运行局部测试、静态检查和改动范围检查
- [ ] 提交并推送到 `origin/daily/xjl-20260613-xiaoneiwai`

## 成功标准

- 成绩汇总分析页菜单展示“校内外对比”标签，切换该标签时加载本校汇总数据并渲染质量基准组件。
- 成绩汇总列表打开分析页逻辑支持指定标签，默认仍进入班级分析。
- 不移植 `25b829c5` 中的 mock 试卷详情、mock 考试详情和相关隐藏路由，避免把演示页带入当前分支。
- 不移植 `src/components/ScoreImportModal` 的智学网导入说明、上传入口、相关样式和测试。
- 不覆盖当前分支已有智学网导入接口逻辑。

## 审查

- 已按 TDD 补充 `src/routes/NewScoreSummary/qualityBenchmarkIntegration.test.js`，先运行失败，再移植代码后运行通过。
- 已从 `25b829c5` 移植核心校内外对比组件 `src/routes/NewScoreSummary/components/QualityBenchmark` 和识图服务 `src/services/qualityBenchmark.js`。
- 已手工接入 `src/routes/NewScoreSummary/analysisSummary.js`：新增“校内外对比”标签、切换时加载本校汇总数据并渲染 `QualityBenchmark`。
- 已手工接入 `src/routes/NewScoreSummary/index.js`：保留默认进入班级分析，并支持按指定标签打开分析页。
- 已明确丢弃 `src/components/ScoreImportModal` 的智学网导入说明、上传入口、样式和测试改动。
- 已丢弃 `MockExamDetail`、`MockPaperDetail`、`MockShared/qualityBenchmarkMock.js` 和对应隐藏路由，避免带入演示页。
- 已运行 `npm test -- src/routes/NewScoreSummary/qualityBenchmarkIntegration.test.js --runInBand`，4 个测试通过。
- 已运行 `npx stylelint src/routes/NewScoreSummary/components/QualityBenchmark/index.less && node scripts/check-max-lines.mjs --max 800 src/routes/NewScoreSummary/components/QualityBenchmark/index.less && git diff --check`，通过。
- 已运行 `npx eslint src/routes/NewScoreSummary/components/QualityBenchmark/index.js src/services/qualityBenchmark.js src/routes/NewScoreSummary/qualityBenchmarkIntegration.test.js`，失败；主要来自移植组件的复杂度、魔数、JSDoc、函数式规则，以及测试文件 `fs/path` 与旧 Jest 兼容性的规则冲突。
- 已运行 `npm run build`，失败；失败点为既有 `src/routes/QuestionTask` 缺少依赖 `@fontsource-variable/noto-serif-sc`，未定位到本次校内外对比改动。
- 当前环境没有可用 `nvm`，实际验证使用系统 Node `v26.3.0`，与 `.nvmrc` 的 Node `v16.20.2` 不一致。

---

# 历史任务

## 批量成绩导入接入智学网文件入口

- [x] 确认 `origin/codex/leon-score-import-flow-20260512` 中批量导入弹窗存在“智学网文件”按钮
- [x] 补充前端测试：标准导入旁展示智学网文件入口，并在智学网来源下确认导入走专用后端接口
- [x] 实现最小前端改动：上传按钮右侧增加智学网文件按钮，智学网文件仍先上传到 `/api/upload_file`
- [x] 补齐服务方法：新增确认智学网成绩导入接口调用
- [x] 运行局部测试与静态检查，记录结果

### 成功标准

- 批量导入成绩弹窗在创建模式下，标准“上传文件”按钮右侧展示“智学网文件”按钮。
- 点击“智学网文件”上传后，文件通过现有上传接口拿到 `fileId`，随后预览调用 `/api/exam/import/score/zhixue/preview`。
- 智学网来源确认导入时调用 `/api/exam/import/score/zhixue/confirm`，标准来源仍调用 `/api/exam/import/score/confirm`。
- 订正模式不展示智学网文件入口，避免覆盖更新流程误用。
- 只修改必要的前端文件，不引入本地智学网解析页面逻辑，不改 `src/routes/ZhixueScoreImport`。

### 审查

- 已新增组件测试覆盖：创建模式展示“智学网文件”入口、订正模式不展示该入口、智学网来源确认导入调用专用接口。
- 已运行 `source "$HOME/.nvm/nvm.sh" && nvm use && npm test -- src/components/ScoreImportModal/index.test.js --runInBand`，28 个测试全部通过。
- 已运行 `git diff --check -- src/components/ScoreImportModal/index.js src/components/ScoreImportModal/index.test.js src/services/global.js tasks/todo.md`，通过。
- 已运行 `npm run lint:changed`，仍失败；失败来自 `ScoreImportModal/index.js`、`services/global.js` 等历史全量 lint 债，本次执行后问题数从 433 降到 428，未为新增智学网确认服务函数引入新的 JSDoc lint 警告。
- 已安装前端依赖以运行局部测试；`npm ci --ignore-scripts` 完成时报告 223 个既有依赖漏洞，未执行 `npm audit fix`。
- 已启动本地 dev server 并打开 `http://task.local.yungu-inc.org:8000/#/examAnalysis`，页面可正常渲染并能打开“导入成绩”弹窗；当前 mock 数据缺少年级和考试类型，无法在浏览器里进入上传步骤，上传按钮展示由组件测试覆盖。

## 审查修复：智学网多学科前端拦截

- [x] 补充失败测试：智学网创建模式允许多个学科配置进入后端预览
- [x] 移除旧的前端单学科限制，保留基础配置完整性校验
- [x] 补齐智学网文件入口的 `.xls` 选择器声明，保持与校验逻辑一致
- [x] 运行相关单测与轻量静态检查

## 审查修复结果

- 已运行 `source "$HOME/.nvm/nvm.sh" && nvm use && npm test -- src/components/ScoreImportModal/index.test.js --runInBand`，28 个测试全部通过。
- 已运行 `source "$HOME/.nvm/nvm.sh" && nvm use && npm test -- src/components/ScoreImportModal/scoreImportUtils.test.js --runInBand`，21 个测试全部通过。
- 已运行 `git diff --check -- src/components/ScoreImportModal/index.js src/components/ScoreImportModal/index.test.js src/components/ScoreImportModal/scoreImportUtils.js src/components/ScoreImportModal/scoreImportUtils.test.js src/services/global.js tasks/todo.md`，通过。
- 已重新运行 `source "$HOME/.nvm/nvm.sh" && nvm use && npm run lint:changed`，仍因历史全量 lint 债失败：`627 problems (207 errors, 420 warnings)`；输出标记本次相关文件均为 `unchanged`，未把历史问题纳入修改范围。
- 已重新运行 `source "$HOME/.nvm/nvm.sh" && nvm use && npm run start`，本地服务在 `http://task.local.yungu-inc.org:8000/` 返回 `HTTP 200`；启动时仍有既有 less/autoprefixer warning。

---

# 当前任务：修复校内外对比保存审查问题

## 成功标准

- [x] 后端保存 `TARGET_LINE` 数据不会因 MyBatis `isEstimated/estimated` 属性不一致报错。
- [x] 三率口径按 `summaryReportId` 公共保存，但只覆盖三率口径，不覆盖平均成绩和总分上线校外数据。
- [x] 平均成绩和总分上线保存支持按数据类型局部覆盖。
- [x] 保存接口按同一报告或同一系统报告定位维度加资源锁，避免不同用户并发覆盖公共记录。
- [x] 新增查询和保存接口复用成绩汇总权限口径，不只校验学校和集团。
- [x] 前端保存三率口径时不再提交旧的校外数据。
- [x] 前端生产展示不再使用写死 mock 数据参与本校对比。
- [x] 完成前后端局部测试和 `git diff --check`。

## 子任务

- [x] 补后端失败测试：保存范围、Mapper 属性、三率不覆盖校外数据。
- [x] 修后端保存模型和 Mapper，支持 `saveScope` 局部覆盖。
- [x] 修后端权限校验和幂等锁 key。
- [x] 补前端失败测试：三率保存只提交三率口径。
- [x] 修前端保存范围和 mock 兜底显示。
- [x] 运行验证并记录审查结果。

## 审查

- 已补后端 `QualityBenchmarkServiceTest`，覆盖三率保存只删除/插入 `RATE_THRESHOLD`、保存前复用成绩汇总详情权限链路、`estimated` 字段组装。
- 已补后端 Controller/XML 契约测试，覆盖保存接口幂等锁使用租户和报告定位字段、Mapper XML 使用 `row.estimated`。
- 已补前端 `saveScope.test.js`，覆盖三率保存请求不携带旧校外表格数据、平均成绩保存只提交 `SCORE` 范围。
- 已运行 `./gradlew :task-exam:test --tests org.yungu.exam.service.impl.QualityBenchmarkServiceTest --tests org.yungu.exam.web.controller.ExamSummaryQualityBenchmarkControllerTest`，通过。
- 已运行 `./gradlew :task-exam:qualityCheck -PqualityClasses='QualityBenchmarkService,QualityBenchmarkRowAssembler,ExamSummaryQualityBenchmarkMapper,ExamSummaryQualityBenchmarkDO,QualityBenchmarkSaveRequest,ExamSummaryQualityBenchmarkControllerTest,QualityBenchmarkServiceTest'`，通过。
- 已运行 `npm test -- src/routes/NewScoreSummary/components/QualityBenchmark/parser.test.js src/routes/NewScoreSummary/components/QualityBenchmark/saveScope.test.js src/routes/NewScoreSummary/qualityBenchmarkIntegration.test.js --runInBand`，12 个测试通过。
- 已运行 `npx eslint src/routes/NewScoreSummary/components/QualityBenchmark/saveScope.test.js`，通过；输出一个 Node `fs.Stats` deprecation warning。
- 已运行前后端 `git diff --check`，通过。
- 前端完整 `QualityBenchmark/index.js` 仍存在移植组件历史 lint 债，未纳入本次批量重构范围。

---

# 当前任务：校内外对比导出和宽表解析修复

## 成功标准

- [x] 多校对比粘贴宽表即使表头被换成多行，也能识别总分、语文、数学、英语等后续学科。
- [x] 总分上线情况对比的“外校平均”考试人数显示为 `--`，不再展示平均人数小数。
- [x] 总分上线情况对比的“外校平均”上线人数按外校均值四舍五入，上线率保留均值百分比。
- [x] 多校对比导出和总分上线情况对比导出都生成真正 `.xlsx` 文件。
- [x] 不新增前端 npm 包，前端只提交二维表数据，后端负责生成 `.xlsx`。
- [x] 完成前后端局部测试、质量检查和 `git diff --check`。

## 子任务

- [x] 补前端失败测试：多行表头宽表、外校平均人数、导出调用后端。
- [x] 补后端失败测试：导出接口路径、xlsx 文件格式。
- [x] 实现后端校内外对比 xlsx 导出接口。
- [x] 前端导出改调用后端接口，移除伪 `.xls` 下载。
- [x] 修正总分上线外校平均人数和上线人数口径。
- [x] 运行验证并记录结果。

## 审查

- 已补前端 `parser.test.js`，覆盖多行表头宽表识别数学/英语，以及总分上线外校平均不展示考试人数小数、上线人数四舍五入。
- 已补前端 `qualityBenchmarkIntegration.test.js`，覆盖导出改为调用 `/api/exam/summary/qualityBenchmark/export`，不再使用 `application/vnd.ms-excel` 伪 Excel。
- 已补后端 `ExamSummaryQualityBenchmarkControllerTest`，覆盖导出接口路径和 POI 解析生成的 xlsx 工作簿。
- 已新增后端 `QualityBenchmarkExportRequest` 和 `QualityBenchmarkExportWorkbookBuilder`，由 `QualityBenchmarkService.export` 写出 `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`。
- 已运行 `npm test -- src/routes/NewScoreSummary/components/QualityBenchmark/parser.test.js src/routes/NewScoreSummary/components/QualityBenchmark/saveScope.test.js src/routes/NewScoreSummary/qualityBenchmarkIntegration.test.js --runInBand`，15 个测试通过；当前环境缺少 `.nvm/nvm.sh`，实际使用 Node `v26.3.0`。
- 已运行 `./gradlew :task-exam:test --tests org.yungu.exam.web.controller.ExamSummaryQualityBenchmarkControllerTest`，通过。
- 已运行 `./gradlew :task-exam:qualityCheck -PqualityClasses='QualityBenchmarkService,QualityBenchmarkExportWorkbookBuilder,QualityBenchmarkExportRequest,ExamSummaryQualityBenchmarkControllerTest'`，通过。
- 已运行前后端 `git diff --check`，通过。
- 已尝试包含 `ExamSummaryReportController` 的后端质量检查，失败于该历史 Controller 的既有 Checkstyle 问题：文件超过 500 行、星号 import、旧方法缩进和行长等 287 条；本次未批量格式化该历史大文件。
- 已运行 `npx eslint src/services/qualityBenchmark.js src/routes/NewScoreSummary/qualityBenchmarkIntegration.test.js`，失败于既有前端 lint 规则：测试文件 `fs/path` 的 `node:` 协议规则，以及服务文件原有 `FileReader` Promise 被 `compat/op_mini` 拦截；本次未改兼容性策略。

## 测验学情分析权限梳理

- [x] 阅读前端与后端项目规则、经验记录
- [x] 定位测验学情分析前端入口与调用接口
- [x] 定位 teaching-task 后端接口、权限判断与白名单来源
- [x] 输出权限说明文档
- [x] 复核文档中的接口路径、权限来源和残余风险

## 成功标准

- 文档列出测验学情分析页面涉及的主要前端入口和后端接口。
- 文档说明整页访问权限、年级/班级学情报告页签权限、学生学情报告接口权限，以及成绩汇总学情报告的区别。
- 文档标明权限来源是 ACL 权限点、角色/标签范围、Nacos 白名单，还是仅依赖登录态/入口控制。
- 不修改业务代码，不运行会产生大量构建产物的后端构建/打包命令。

## 审查

- 已输出文档：`/Users/xjl/IdeaProjects/teaching-task/doc/测验学情分析权限说明.md`。
- 已复核文档中关键接口：`/api/exam/checkUserAuthority`、`/api/exam/studySituation/permission`、`/api/exam/get/studySituationByStudentId`、`/api/exam/save/studySituationStructure`、`/api/exam/sendAallStudentStudySituationForParent`。
- 本次只做代码静态阅读和文档输出，未修改业务代码，未运行后端构建/打包命令。
- 后端仓库当前存在大量既有未提交改动，本次未触碰；新增文档为本次唯一后端仓库新增文件。

- [x] 查看最近提交涉及的学生答题时间限制逻辑
- [x] 为本地测试补充对应接口 mock 数据
- [x] 验证 mock 文件语法和改动范围
- [x] 修正实际生效的 roadhog mock 覆盖位置

## 成功标准

- `GET /api/paper/status` 可让学生测验页进入未作答详情分支。
- `GET /api/paper/student/exam/before/detail` 可通过不同 `examId` 返回“未开始”和“已截止”两种页面提示数据。
- `GET /api/paper/start/exam` 可模拟点击开始答题后被服务端时间限制拦截。
- `examId=900004` 可进入作答准备页，并在点击开始答题倒计时结束后触发 `GET /api/paper/start/exam` 的限制提示。
- 不修改最近提交涉及的业务代码，只补充本地 mock。

## 审查

- 初版只改 `mock/paper.js` 时，已运行 `source "$HOME/.nvm/nvm.sh" && nvm use && npm run lint:changed`，通过。
- 已运行 `git diff --check -- .roadhogrc.mock.js mock/paper.js tasks/todo.md`，通过。
- 本次只修改本地 mock 与任务记录，未改动业务页面代码。
- 用户确认后，已把实际生效的 mock 覆盖逻辑移到 `.roadhogrc.mock.js`，并移除 `mock/paper.js` 中重复的同名接口 mock。
- 已重启本地服务，并用 curl 验证 `/api/paper/student/exam/before/detail?examId=900001` 返回“测验答题还未开始”。
- 已验证 `/api/paper/student/exam/before/detail?examId=900002` 返回“测验答题已截止”，`/api/paper/start/exam?examId=900004` 返回“测验答题还未开始”。
- 重新运行 `npm run lint:changed` 时，`.roadhogrc.mock.js` 存在大量历史 lint 问题，且该脚本会自动改动大文件，因此未把 lint 作为本次通过项；本次已用 `git diff --check` 和实际接口请求验证。

---

# 当前任务：迁移学生成绩趋势标签累计修复到 main

## 成功标准

- [x] 从最新 `origin/main` 创建独立修复分支。
- [x] 切换学生时，旧成绩趋势图实例和测验名称标签被完整销毁，不再累计叠加。
- [x] 组件卸载时销毁成绩趋势图实例，避免残留图表节点和事件。
- [x] 先补充能够复现问题的失败测试，再迁移最小修复并证明测试通过。
- [x] 使用 `.nvmrc` 指定的 Node.js 版本完成相关测试、lint、构建和差异检查。
- [x] 完成代码审查与独立抽象泄露复查后提交并推送远程分支。

## 子任务

- [x] 从最新 `origin/main` 创建 `fix/20260710-student-score-trend-axis-main`。
- [x] 记录线上基线纠正经验和迁移验证计划。
- [x] 阅读成绩趋势组件、全部调用方和测试约定，确认根因与影响范围。
- [x] 补充失败测试并确认测试因图表实例未销毁而失败。
- [x] 精准迁移图表实例生命周期修复。
- [x] 运行相关测试、lint、构建、差异和页面行为验证。
- [x] 完成代码审查与独立抽象泄露复查。
- [x] 提交并推送远程分支。

## 审查

- 根因确认：学生切换后沿 `StudentHomepage -> AllStudentTrend -> home/getTrendAnalysisResultNew -> newTrendList -> renderChart` 重绘；旧实现使用模块级 `chart`，只执行 `clear()` 和手工删除 canvas，G2 的 HTML 横轴标签与事件仍会残留。
- RED：使用 Node v16.20.2 运行 `npm test -- src/components/AllStudentTrend/index.test.jsx --runInBand`，3 项测试按预期失败：旧实例未调用 `destroy()`、tooltip 未关闭 crosshairs、组件没有卸载清理方法。
- GREEN：图表实例改由组件字段持有，重绘前和卸载时统一 `destroy()` 并清空引用；显式设置 `crosshairs: false`。审查后增加首次 `render()` 抛错的半成品清理用例，最终 4 项测试全部通过。
- 测试文件单独运行 ESLint 通过；`git diff --check` 通过。`npm run lint:changed` 仍被 `AllStudentTrend/index.jsx` 的历史规则债阻断，但 ESLint 错误从 `origin/main` 的 553 降为 552，警告均为 20，没有新增 lint 问题。
- 使用 Node v16.20.2 运行 `npm run build`，TypeScript 检查和 Vite 生产构建通过，最新验证共转换 6659 个模块；输出为项目既有 mock 重复键、非 module 脚本、eval、CSS 和大 chunk 警告。
- daily 代理页面可加载 `#/studentHomepage`，但因缺少登录态弹出登录超时，无法切换学生；改用项目内置 mock 页面按“周艾 -> 李翼扬 -> 周艾”切换，三次均保持 `1 trendNode / 1 canvas / 1 g-labels / 8 个考试标签 / 19 个图表 div`，没有累计标签或新增运行时异常。
- 依赖准备使用锁文件执行；常规 `npm ci` 受 registry 超时及旧 `sqlite3` 预编译包 403/缺少 `make` 阻断，改用 `npm ci --ignore-scripts` 后单独重建测试所需 `canvas`，未修改依赖清单或锁文件。
- 代码审查未发现 Critical 问题；提出的绘制异常测试、crosshairs 注释准确性和无关 import 顺序已处理，复审确认没有剩余 Critical/Important 问题，可以提交。
- 抽象泄露复查在初次实现和审查修正后均返回 `pass`；G2、DOM 标签清理和生命周期细节仍封装在组件内部，没有改变 props、DVA 数据形状或调用方契约。
- 未新增学校、学生、考试参数、阈值或接口地址等生产业务写死；测试中的考试名称、分数和学科 ID 仅为 fixture。

# 当前任务：基于 main 完整恢复知识点定义

## 成功标准

- [x] 从最新 `origin/main` 新建独立功能分支，不合并旧 `master` 历史。
- [x] 完整恢复知识点定义新增、行内编辑、保存和清空能力。
- [x] 支持行内与块级 LaTeX 预览、摘要和悬停完整展示。
- [x] 支持知识点树展开/收起，首次加载默认展开有子节点的节点。
- [x] 兼容后端历史定义字段和 HTML 内容，保存继续使用既有 `describe` 契约。
- [x] 所有新增可见文案支持中文和英文，移动端和英文长文案不溢出。
- [x] Vite ESM mock、定向测试、静态检查、生产构建和浏览器验收通过。

## 子任务

- [x] 子任务 1：定义数据形状与树展开 helper（2 个文件）。
- [x] 子任务 2：页面定义编辑、公式预览与树展开（2 个文件）。
- [x] 子任务 3：CSS Modules 与响应式布局（2 个文件）。
- [x] 子任务 4：中英文文案（3 个文件）。
- [x] 子任务 5：Vite ESM mock（2 个文件）。
- [x] 子任务 6：完整验证与交付记录（1 个文件）。

## 审查

- 分支：`feature/20260817-knowledge-definition-main`，基线：`origin/main@3d27c62c`。
- 设计：`docs/superpowers/specs/2026-08-17-knowledge-definition-main-design.md`。
- 计划：`docs/superpowers/plans/2026-08-17-knowledge-definition-main.md`。
- 子任务 1 RED：新增定义归一化测试后失败于 `definitionText` 为 `undefined`，证明当前 `main` 未映射知识点定义。
- 子任务 1 GREEN：新增唯一的历史字段读取和纯文本归一化入口，并收集所有有子节点的 ID；BasicSetting 定向测试 `6/6` 通过，`git diff --check` 通过。
- 子任务 2 RED：页面契约测试失败于缺少 `knowledgeCreateDefinition`，证明当前 `main` 没有定义编辑状态。
- 子任务 2 GREEN：已有知识点支持摘要/悬停预览和行内编辑，新增弹窗支持定义与实时预览，非末级节点支持展开收起；保存只使用既有 `describe` 字段，BasicSetting 定向测试 `7/7` 通过。
- 子任务 3 RED：响应式样式测试失败于缺少 `.knowledgeDefinitionCell`，证明页面能力尚无布局支撑。
- 子任务 3 GREEN：知识点列表采用稳定三列，定义摘要、浮层和 textarea 均有 CSS Modules 样式，900px 以下切换单列；BasicSetting 定向测试 `8/8` 通过。
- 子任务 4 RED：词条完整性测试失败于 `basicSetting.knowledgeDefinition` 未定义。
- 子任务 4 GREEN：定义标题、输入提示、空状态、展开/收起、点击维护和预览标签均补齐中英文；2 个测试套件、9 个用例通过。
- 子任务 5 RED：Node 16 动态导入失败于 `mock/basicSettingTextbookKnowledge.mjs` 不存在。
- 子任务 5 GREEN：新增 Vite ESM 基础设置 mock 并注册到总路由；模块导入、路由存在性和空字符串清空定义验证均通过。
- 使用 Node v16.20.2 运行知识点定义与双语定向测试，2 个测试套件、9 个用例通过；`npm run typecheck` 通过。
- 新增 mock 与双语测试文件 ESLint 通过；`index.jsx` 为 77 errors / 7 warnings、`index.helpers.js` 为 35 errors / 289 warnings、`mock/index.mjs` 为 37364 errors / 1 warning，三者均与 `origin/main` 基线一致，本次未新增旧文件 lint 问题。
- Vite mock 共注册 13 条基础设置路由，已验证保存 `describe: ""` 后 `definitionText` 与 `describe` 均为空；`npm run duplication:scan` 正常退出，报告 210 处项目既有克隆。
- `npm run build` 生产构建通过，KaTeX JS/CSS/字体进入产物；构建仍输出主线既有的重复 mock key、非 module 旧脚本、CSS 语法和大 chunk 告警。
- 浏览器自动化验收通过：中文桌面端覆盖定义展示、KaTeX、悬停完整内容、默认展开、收起/展开、编辑保存后 reload 回显、清空后 reload；英文 390×844 页面文案生效且横向溢出为 0，页面运行异常为 0。
- 浏览器控制台仍有 13 条项目既有噪声，来自 history 旧导入、React key warning 和静态资源 404；未发现知识点定义或 KaTeX 新增控制台错误。
- `git diff --check` 通过；未新增学校、租户、权限、业务阈值、环境地址或接口默认参数等生产业务写死，mock 中的教材与知识点数据仅用于本地验收。
- 完整复制复审确认旧功能的真实提交为 `73ba77ed（2026-06-23 知识点定义维护）`，只涉及旧版 BasicSetting 页面、helper、样式和 roadhog mock 共 6 个文件；旧分支顶端 `f6ebe091` 是合并主线的 merge commit，不能作为功能差异依据。
- 已将旧提交的全部功能块逐项映射到当前 Vite/JSX/CSS Modules 主线：历史字段与 HTML 归一化、KaTeX、安全转义、新增时定义与实时预览、行内编辑、保存与清空、摘要与悬停、默认展开和展开收起均有对应实现。
- 复审发现当前实现删除旧版 `autoFocus` 后没有等价聚焦逻辑，点击定义摘要需要再次点击才能输入；已先增加失败测试，再通过稳定 textarea ref 和 `setState` 回调恢复自动聚焦，定向测试由 9 个增加为 10 个并通过。
- Teaching Task 后端权威请求 DTO 和响应 VO 只有 `describe` 字段，查询、新增、更新都读写 `describe`；因此当前前端只发送 `describe`，没有复制旧前端多发但后端忽略的 `definitionText`。已使用 JDK 8 运行 `BasicSettingTextbookKnowledgeServiceTest` 和 `BasicSettingTextbookKnowledgeControllerTest`，Gradle 构建通过。
- 最终浏览器自动化覆盖并通过：点击摘要立即聚焦、编辑保存后 reload 回显、空字符串清空后 reload、新增知识点同时保存定义、行内与块级 KaTeX、悬停完整预览、展开收起、英文 390×844 无横向溢出；中英文页面运行异常均为 0。
- 自动聚焦修复后重新运行生产构建通过；重复代码扫描仍为 210 处项目既有克隆，未因本次补齐产生新增克隆。
