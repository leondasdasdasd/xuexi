import React from "react";
import { Editable } from "slate-react";

import { renderElement, renderLeaf } from "./renderElement";

import styles from "./index.module.less";

/**
 * @param {object} properties - Slate editable properties.
 * @returns {React.ReactElement} Rich-text editable element.
 */
function SlateRichEditable(properties) {
  const {
    onCopy,
    onCut,
    onFocus,
    onKeyDown,
    onMouseDown,
    onPaste,
    onSelect,
    placeholder,
    scrollSelectionIntoView,
  } = properties;

  return (
    <Editable
      className={styles.editable}
      placeholder={placeholder}
      renderElement={renderElement}
      renderLeaf={renderLeaf}
      onCopy={onCopy}
      onCut={onCut}
      onFocus={onFocus}
      onKeyDown={onKeyDown}
      onMouseDown={onMouseDown}
      onPaste={onPaste}
      onSelect={onSelect}
      scrollSelectionIntoView={scrollSelectionIntoView}
      spellCheck={false}
    />
  );
}

export default SlateRichEditable;
