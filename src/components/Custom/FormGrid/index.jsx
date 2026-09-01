import React, { createContext, useContext } from "react";

import styles from "./index.module.less";

// 创建 Context 用于传递 layout 信息
const FormGridContext = createContext({ layout: "horizontal" });

/**
 * FormGrid：栅格容器，基于 CSS Grid
 * columns: 一行多少列（默认 24，模拟 antd 栅格）
 * gap: 行列间距
 * layout: 布局方式，horizontal（水平布局，默认）或 vertical（垂直布局）
 * @param root0
 * @param root0.rowGap
 * @param root0.columnGap
 * @param root0.layout
 * @param root0.children
 * @param root0.className
 */
export const FormGrid = ({
  rowGap = 0,
  columnGap = 0,
  layout = "horizontal",
  children,
  className,
}) => {
  return (
    <FormGridContext.Provider value={{ layout }}>
      <div
        className={`${layout === "vertical" ? styles.verticalLayout : ""} ${className}`}
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(24, 1fr)",
          columnGap: columnGap,
          rowGap: rowGap,
          alignItems: layout === "vertical" ? "start" : "center",
        }}
      >
        {children}
      </div>
    </FormGridContext.Provider>
  );
};
/**
 * FormItem：表单项
 * required: 是否必填
 * label: 标签
 * labelSpan: label 占用列数
 * contentSpan: 内容占用列数
 * span: 整体占用的列数（用于 vertical 布局时控制整体宽度）
 * @param root0
 * @param root0.required
 * @param root0.label
 * @param root0.labelSpan
 * @param root0.contentSpan
 * @param root0.span
 * @param root0.children
 * @param root0.style
 */
export const GridFormItem = ({
  required = false,
  label,
  labelSpan = 6,
  contentSpan = 18,
  span,
  children,
  style = {},
}) => {
  const { layout } = useContext(FormGridContext);
  const isVertical = layout === "vertical";

  // 如果指定了 span，使用 span；否则使用 labelSpan + contentSpan
  const totalSpan = span || labelSpan + contentSpan;

  if (isVertical) {
    // 垂直布局：label 和 content 上下排列
    return (
      <div
        className={styles.verticalFormItem}
        style={{
          gridColumn: `span ${totalSpan}`,
          ...style,
        }}
      >
        <div className={styles.label}>
          {label}
          {required ? <span className={styles.requiredIcon}>*</span> : null}
        </div>
        <div className={styles.formItemContent}>{children}</div>
      </div>
    );
  }

  // 水平布局：原有的左右布局
  return (
    <>
      <div
        className={styles.label + (required ? ` ${styles.required}` : "")}
        style={{
          gridColumn: `span ${labelSpan}`,
          ...style,
        }}
      >
        {label}
      </div>

      <div
        className={styles.formItemContent}
        style={{ gridColumn: `span ${contentSpan}` }}
      >
        {children}
      </div>
    </>
  );
};
