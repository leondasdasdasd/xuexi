import React from "react";
import PropTypes from "prop-types";

import { Toolbar } from "../../../../components/SlateRichEditor";

import styles from "./AnswerSheetPreview.module.less";

const AnswerRichTextToolbar = ({ activeEditorController }) => (
  <Toolbar.Root
    className={styles["answer-rich-text-toolbar"]}
    editor={activeEditorController && activeEditorController.editor}
  >
    <Toolbar.Undo />
    <Toolbar.Redo />
    <Toolbar.Bold />
    <Toolbar.Italic />
    <Toolbar.Underline />
    <Toolbar.Strike />
    <Toolbar.Formula />
    <Toolbar.FontSize />
    <Toolbar.Color />
    <Toolbar.UnorderedList />
    <Toolbar.OrderedList />
    <Toolbar.AlignLeft />
    <Toolbar.AlignCenter />
    <Toolbar.AlignRight />
  </Toolbar.Root>
);

AnswerRichTextToolbar.propTypes = {
  activeEditorController: PropTypes.shape({
    editor: PropTypes.object,
  }),
};

AnswerRichTextToolbar.defaultProps = {
  activeEditorController: null,
};

export default AnswerRichTextToolbar;
