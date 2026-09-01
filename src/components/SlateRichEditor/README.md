# SlateRichEditor 富文本开发接入手册

`SlateRichEditor` 是基于 Slate 的题目富文本编辑组件，主要用于题干、选项、解析等业务字段的编辑。组件内部维护 Slate 编辑器实例，对外通过 Slate value 读写内容，并提供 HTML 与 Slate value 的转换工具。

## 组件定位

- `SlateRichEditor`：编辑态组件，负责输入、工具栏、粘贴、图片、公式、表格和快捷键处理。
- `SlateRichPreview`：预览态组件，接收 Slate value 或 HTML 并渲染富文本内容。
- `htmlToSlate` / `slateToHtml`：在业务 HTML 与编辑器 Slate value 之间转换。
- `deserializeHtml` / `serializeSlateValue`：底层转换函数，通常优先使用 `htmlToSlate` 和 `slateToHtml`。

## 推荐接入方式

业务侧如果存储的是 HTML，进入编辑器前先转换为 Slate value；编辑器变更后再转换回 HTML 存储。

```js
import React, { useMemo } from "react";
import SlateRichEditor, {
  htmlToSlate,
  slateToHtml,
} from "../../components/SlateRichEditor";

function RichTextField({ fieldId, onChange, placeholder, uploadImage, value }) {
  const slateValue = useMemo(
    () => htmlToSlate(normalizeRichTextHtml(value)),
    [value],
  );

  return (
    <SlateRichEditor
      key={fieldId}
      onChange={(nextValue) => {
        onChange(normalizeRichTextHtml(slateToHtml(nextValue)));
      }}
      placeholder={placeholder}
      toolbar={false}
      uploadImage={uploadImage}
      value={slateValue}
    />
  );
}
```

`SlateRichEditor` 当前只在初始化时读取 `value`。如果业务字段切换后需要重新载入内容，请像示例一样传入稳定且会随字段变化的 `key`，让 React 重新挂载编辑器。

## Props

| Prop           | 类型                                  | 默认值 | 说明                                                                             |
| -------------- | ------------------------------------- | ------ | -------------------------------------------------------------------------------- |
| `value`        | `Array`                               | 空段落 | Slate value。空值会被归一化为一个空段落。                                        |
| `onChange`     | `(nextValue) => void`                 | -      | 内容变更回调。仅在非 `set_selection` 操作时触发，光标移动不会触发。              |
| `placeholder`  | `string`                              | -      | 编辑器空内容占位文案。                                                           |
| `toolbar`      | `boolean`                             | `true` | 是否渲染内置工具栏。设置为 `false` 时只渲染编辑区。                              |
| `toolbarProps` | `object`                              | -      | 透传给 `Toolbar.Root`，用于接入共享工具栏或自定义工具栏上下文。                  |
| `uploadImage`  | `(file) => string \| Promise<string>` | -      | 图片上传函数，返回图片 URL。工具栏上传、粘贴图片、粘贴外部 HTML 图片都会复用它。 |
| `autoFocus`    | `boolean`                             | -      | 挂载后自动聚焦编辑器，并触发 `onActive`。                                        |
| `onActive`     | `(controller) => void`                | -      | 编辑器被聚焦、点击、选择、粘贴、复制、快捷键操作时触发。                         |

`onActive` 接收的 `controller` 结构：

```js
{
  editor, // Slate editor 实例
  focus, // 聚焦当前编辑器，并确保存在可用选区
  uploadImage, // 当前传入的图片上传函数
}
```

## 图片上传契约

`uploadImage(file)` 必须返回图片 URL 或解析为图片 URL 的 Promise。

```js
async function uploadImage(file) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await requestUploadImage(formData);
  return response.url;
}
```

图片入口包括：

- 点击工具栏图片按钮选择本地图片。
- 从剪贴板直接粘贴图片文件。
- 粘贴包含 `data:image/*`、`blob:` 或 `http(s)` 图片地址的外部 HTML。

如果没有提供 `uploadImage`，工具栏图片按钮不会打开文件选择；粘贴图片会提示上传失败；外部 HTML 中需要上传转换的图片会被跳过。

## 内置能力

- 文本样式：加粗、斜体、下划线、删除线、字号、颜色。
- 段落结构：无序列表、有序列表、左对齐、居中、右对齐。
- 表格：插入 3 x 3 表格，在当前单元格上方/下方插入行，删除当前行，在左侧/右侧插入列，删除当前列。
- 媒体与公式：插入图片，插入或编辑数学公式。
- 编辑体验：撤销、重做、复制/剪切选中图片、粘贴外部 HTML、粘贴剪贴板图片。
- 快捷键：`Ctrl/Command + B` 加粗，`Ctrl/Command + I` 斜体，`Ctrl/Command + U` 下划线，`Ctrl/Command + Z` 撤销，`Ctrl/Command + Shift + Z` 或 `Ctrl/Command + Y` 重做。

表格能力只覆盖当前实现中的基础行列操作。组件不承诺支持合并单元格、拆分单元格、嵌套表格、跨单元格批量编辑等复杂表格能力。

## 工具栏定制

默认 `toolbar={true}` 时，组件会渲染完整内置工具栏：

```js
<Toolbar.Root {...toolbarProps}>
  <Toolbar.Undo />
  <Toolbar.Redo />
  <Toolbar.Bold />
  <Toolbar.Italic />
  <Toolbar.Underline />
  <Toolbar.Strike />
  <Toolbar.FontSize />
  <Toolbar.Color />
  <Toolbar.UnorderedList />
  <Toolbar.OrderedList />
  <Toolbar.AlignLeft />
  <Toolbar.AlignCenter />
  <Toolbar.AlignRight />
  <Toolbar.Table />
  <Toolbar.Image uploadImage={uploadImage} />
  <Toolbar.Formula />
</Toolbar.Root>
```

业务如果需要共享工具栏或只开放部分能力，可以设置 `toolbar={false}`，再在业务层使用导出的 `Toolbar` 组件组合自己的按钮。表格行列按钮也已导出：

```js
import { Toolbar } from "../../components/SlateRichEditor";

<Toolbar.Root editor={activeController.editor}>
  <Toolbar.Bold />
  <Toolbar.Color />
  <Toolbar.Image uploadImage={activeController.uploadImage} />
  <Toolbar.InsertRowBefore />
  <Toolbar.DeleteColumn />
</Toolbar.Root>;
```

共享工具栏依赖当前活跃编辑器实例，通常需要通过 `onActive` 保存最近一次激活的 `controller`。

### 接入组件未内置的工具

如果业务需要增加组件没有内置的工具按钮，例如清除格式、插入业务占位符、插入指定模板、打开自定义图片选择器，可以在业务层维护当前活跃编辑器，并直接调用 Slate 命令。

推荐做法：

1. 编辑器通过 `onActive` 把当前 `controller` 存到业务状态。
2. 自定义工具按钮执行前先调用 `controller.focus()`，确保命令作用在当前编辑器和当前选区。
3. 使用 Slate 的 `Editor`、`Transforms` 等 API 修改内容。
4. 不要直接修改 `value` 数组；所有内容变更都通过 Slate 命令完成，让编辑器正常触发 `onChange`。

示例：增加“清除格式”和“插入填空占位符”两个业务工具。

```js
import React, { useState } from "react";
import { Button } from "antd";
import { Editor, Transforms } from "slate";
import SlateRichEditor, { Toolbar } from "../../components/SlateRichEditor";

function QuestionRichEditor({ uploadImage, value, onChange }) {
  const [activeController, setActiveController] = useState(null);
  const activeEditor = activeController && activeController.editor;

  const runCustomCommand = (command) => {
    if (!activeController || !activeEditor) {
      return;
    }

    activeController.focus();
    command(activeEditor);
  };

  const clearTextMarks = () => {
    runCustomCommand((editor) => {
      ["bold", "italic", "underline", "strike", "fontSize", "color"].forEach(
        (mark) => {
          Editor.removeMark(editor, mark);
        },
      );
    });
  };

  const insertBlankPlaceholder = () => {
    runCustomCommand((editor) => {
      Transforms.insertText(editor, "____");
    });
  };

  return (
    <>
      <Toolbar.Root editor={activeEditor}>
        <Toolbar.Bold />
        <Toolbar.Color />
        <Toolbar.Image uploadImage={uploadImage} />
        <Button size="small" disabled={!activeEditor} onClick={clearTextMarks}>
          清除格式
        </Button>
        <Button
          size="small"
          disabled={!activeEditor}
          onClick={insertBlankPlaceholder}
        >
          插入填空
        </Button>
      </Toolbar.Root>
      <SlateRichEditor
        onActive={setActiveController}
        onChange={onChange}
        toolbar={false}
        uploadImage={uploadImage}
        value={value}
      />
    </>
  );
}
```

内置图片和公式按钮也支持业务接管弹窗：

```js
<Toolbar.Image
  uploadImage={uploadImage}
  onOpenImageUpload={({ insertImage, selectedImageEntry }) => {
    openBusinessImageDialog({
      selectedImageEntry,
      onSelect: (imageUrl) => insertImage(imageUrl),
    });
  }}
/>

<Toolbar.Formula
  onOpenFormula={({ openFormulaEditor }) => {
    openFormulaEditor();
  }}
/>
```

这类自定义工具属于业务层扩展，优先放在业务组件里维护。只有多个场景稳定复用时，再考虑沉淀为 `SlateRichEditor` 内部的通用 `Toolbar.*` 按钮。

## 预览

预览 Slate value：

```js
import { SlateRichPreview } from "../../components/SlateRichEditor";

<SlateRichPreview value={slateValue} placeholder="暂无内容" />;
```

预览 HTML：

```js
<SlateRichPreview html={html} placeholder="暂无内容" />
```

`SlateRichPreview` 内部使用 `dangerouslySetInnerHTML` 渲染 HTML。传入 `html` 时必须使用可信内容或业务已清洗过的内容，不要直接渲染未经处理的外部输入。

## HTML 与 Slate value 转换

常用导出：

```js
import {
  htmlToSlate,
  isSlateValueEmpty,
  normalizeSlateValue,
  slateToHtml,
} from "../../components/SlateRichEditor";
```

- `htmlToSlate(html)`：把 HTML 转为编辑器可用的 Slate value。
- `slateToHtml(value)`：把 Slate value 序列化为 HTML。
- `normalizeSlateValue(value)`：把非法或空 Slate value 归一化为合法结构。
- `isSlateValueEmpty(value)`：判断 Slate value 是否没有有效内容。图片和公式会被视为有效内容。

转换器会保留当前组件支持的段落、列表、对齐、文本样式、图片、公式和基础表格结构。复杂 HTML 会被收敛成编辑器支持的结构；不支持的标签不会按原结构完整保留。

## 注意事项

- 此文档待完善

- 不要直接修改 `onChange` 返回的 Slate value。需要保存或复用时，按业务需要复制后再处理。
- 多字段编辑场景要用字段 ID 控制 `key`，避免旧编辑器实例继续持有上一个字段的初始内容。
- `onChange` 不响应光标移动；需要同步当前活跃编辑器时使用 `onActive`。
- 图片、公式都是 Slate void inline 节点，复制/剪切选中图片时组件会写入 Slate fragment、HTML 和纯文本三种剪贴板数据。
- 公式图片地址由组件按渲染服务地址生成，已有带 `mathUrl` 的公式图片在插入时会优先识别为公式节点。
