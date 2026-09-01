import React from "react";
import PropTypes from "prop-types";

import { Toolbar } from "../SlateRichEditor";
import { css } from "./questionEntryStyles";

const SharedRichTextToolbar = ({ activeEditorController, uploadImage }) => {
  const activeEditor = activeEditorController && activeEditorController.editor;
  const activeUploadImage =
    activeEditorController && activeEditorController.uploadImage
      ? activeEditorController.uploadImage
      : uploadImage;

  return (
    <Toolbar.Root className={css.sharedToolbar} editor={activeEditor}>
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
      <Toolbar.Table />
      <Toolbar.Image uploadImage={activeUploadImage} />
    </Toolbar.Root>
  );
};

SharedRichTextToolbar.propTypes = {
  activeEditorController: PropTypes.shape({
    editor: PropTypes.object,
    toolbarStateKey: PropTypes.string,
    uploadImage: PropTypes.func,
  }),
  uploadImage: PropTypes.func,
};

export default SharedRichTextToolbar;
