import React from "react";

import { isSlateValueEmpty, slateToHtml } from "./slateToHtml";

import styles from "./index.module.less";

const getClassName = (...classNames) => classNames.filter(Boolean).join(" ");

/**
 *
 * @param properties
 */
function SlateRichPreview(properties) {
  const {
    className,
    contentClassName,
    html,
    placeholder,
    placeholderClassName,
    value,
    ...restProperties
  } = properties;
  const hasSlateValue = Array.isArray(value);
  const isEmpty = hasSlateValue
    ? isSlateValueEmpty(value)
    : !String(html || "").trim();
  const previewHtml = isEmpty
    ? ""
    : hasSlateValue
      ? slateToHtml(value)
      : String(html || "");

  return (
    <div
      {...restProperties}
      className={getClassName(styles.previewShell, className)}
    >
      {previewHtml ? (
        <div
          className={getClassName(styles.richContent, contentClassName)}
          dangerouslySetInnerHTML={{ __html: previewHtml }}
        />
      ) : (
        <div
          className={getClassName(
            styles.richContent,
            styles.previewPlaceholder,
            placeholderClassName,
          )}
        >
          {placeholder}
        </div>
      )}
    </div>
  );
}

export default SlateRichPreview;
