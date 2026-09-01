import React from "react";
import { QuestionContentEditor } from "@yungu-fed/question-editor";
import PropTypes from "prop-types";

import styles from "../index.module.less";

const getEditorLocale = (_unusedReason = "default") =>
  (void _unusedReason,
  typeof window !== "undefined" &&
    String(window.globalLange || navigator.language || "").startsWith("en"))
    ? "en-US"
    : "zh-CN";

const QuestionAssetContentPanel = ({
  draft,
  onChange,
  questionTypeTemplates,
  uploadImage,
}) => (
  <section className={styles.editorPanel}>
    <QuestionContentEditor
      locale={getEditorLocale()}
      onChange={onChange}
      questionTypeTemplates={questionTypeTemplates}
      uploadImage={uploadImage}
      value={draft}
    />
  </section>
);

QuestionAssetContentPanel.propTypes = {
  draft: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired,
  questionTypeTemplates: PropTypes.arrayOf(PropTypes.object).isRequired,
  uploadImage: PropTypes.func,
};

export default QuestionAssetContentPanel;
