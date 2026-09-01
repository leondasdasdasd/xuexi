import React from "react";
import { message, Popconfirm } from "antd";
import PropTypes from "prop-types";

import { downloadExamPaperPdf } from "../../routes/PaperEditor/paperPdf";
import { openExamPape } from "../../services/global";
import {
  queryLatestExamPaperOcrTask,
  submitExamPaperOcrTask,
} from "../../services/paper";
import { trans } from "../../utils/i18n";
import { hasPaperUploadFile } from "../../utils/paperPreview";
import FileUploadModal from "../FileUploadModal";

import styles from "./index.module.less";

const READY_AI_RECOGNITION = "ready";
const PROCESSING_AI_RECOGNITION = "processing";
const RETRY_AI_RECOGNITION = "retry";
const CONFIRM_AI_RECOGNITION = "confirm";
const SUBMITTED_AI_RECOGNITION = "submitted";
const LOADING_AI_RECOGNITION = "loading";
const AI_RECOGNITION_UNAVAILABLE = "unavailable_no_source_file";
const AI_RECOGNITION_SUBMIT_ACTION = "submit";
const AI_RECOGNITION_OPEN_QUESTION_TASK_ACTION = "openQuestionTask";
const AI_RECOGNITION_NONE_ACTION = "none";
const AI_RECOGNITION_PROCESSING_CODE = 1;
const AI_RECOGNITION_RETRY_CODE = 2;
const AI_RECOGNITION_CONFIRM_CODE = 3;
const AI_RECOGNITION_SUBMITTED_CODE = 4;
const DOWNLOAD_SOURCE_FILE = 1;
const DOWNLOAD_STRUCTURED_PDF = 2;

// const parallelPaperLabelMap = {
//   1: "基础卷",
//   2: "巩固卷",
//   3: "提升卷",
// };

const paperActionItemPropertyType = PropTypes.shape({
  aiRecognition: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  canStart: PropTypes.bool,
  examNum: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  paperFileId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  paperFileName: PropTypes.string,
  paperId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  paperIsNotEmpty: PropTypes.bool,
  paperUploadFileId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  subjectId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
});

const noop = (value) => {
  void value;
};

export const getDisabledActionIconStyle = (iconStyle, disabled) => {
  if (iconStyle) {
    return iconStyle;
  }

  return disabled ? { color: "#bfbfbf" } : undefined;
};

export const getAiRecognitionStatus = ({
  hasUploadFile,
  aiRecognition,
  ocrLoading,
}) => {
  if (!hasUploadFile) {
    return AI_RECOGNITION_UNAVAILABLE;
  }

  if (ocrLoading) {
    return LOADING_AI_RECOGNITION;
  }

  switch (Number(aiRecognition)) {
    case AI_RECOGNITION_PROCESSING_CODE: {
      return PROCESSING_AI_RECOGNITION;
    }
    case AI_RECOGNITION_RETRY_CODE: {
      return RETRY_AI_RECOGNITION;
    }
    case AI_RECOGNITION_CONFIRM_CODE: {
      return CONFIRM_AI_RECOGNITION;
    }
    case AI_RECOGNITION_SUBMITTED_CODE: {
      return SUBMITTED_AI_RECOGNITION;
    }
    default: {
      return READY_AI_RECOGNITION;
    }
  }
};

export const getAiRecognitionActionDefinition = (status) => {
  switch (status) {
    case AI_RECOGNITION_UNAVAILABLE: {
      return {
        icon: "&#xe749;",
        labelKey: "global.aiRecognitionUnavailable",
        defaultLabel: "未传原卷",
        titleKey: "global.aiRecognitionUnavailableTips",
        defaultTitle: "上传原卷后可开始识别",
        disabled: true,
        actionKey: AI_RECOGNITION_NONE_ACTION,
      };
    }
    case PROCESSING_AI_RECOGNITION:
    case LOADING_AI_RECOGNITION: {
      return {
        icon: "&#xe6fd;",
        labelKey: "global.aiRecognitionProcessing",
        defaultLabel: "识别中",
        disabled: true,
        actionKey: AI_RECOGNITION_NONE_ACTION,
      };
    }
    case RETRY_AI_RECOGNITION: {
      return {
        icon: "&#xe762;",
        labelKey: "global.aiRecognitionRetry",
        defaultLabel: "重新识别",
        disabled: false,
        actionKey: AI_RECOGNITION_SUBMIT_ACTION,
      };
    }
    case CONFIRM_AI_RECOGNITION: {
      return {
        icon: "&#xe7a1;",
        labelKey: "global.aiRecognitionConfirm",
        defaultLabel: "确认题目",
        disabled: false,
        actionKey: AI_RECOGNITION_OPEN_QUESTION_TASK_ACTION,
      };
    }
    case SUBMITTED_AI_RECOGNITION: {
      return {
        icon: "&#xea15;",
        labelKey: "global.aiRecognitionSubmitted",
        defaultLabel: "已提交",
        disabled: true,
        actionKey: AI_RECOGNITION_NONE_ACTION,
      };
    }
    default: {
      return {
        icon: "&#xe83b;",
        labelKey: "global.aiRecognitionStart",
        defaultLabel: "开始识别",
        disabled: false,
        actionKey: AI_RECOGNITION_SUBMIT_ACTION,
      };
    }
  }
};

export const downloadPaperByType = (id, type) => {
  if (!id) {
    return;
  }

  if (type === DOWNLOAD_SOURCE_FILE) {
    window.open(`${window.location.origin}/api/new_download_file?id=${id}`);
    return;
  }

  if (type === DOWNLOAD_STRUCTURED_PDF) {
    void downloadExamPaperPdf({ paperId: id });
  }
};

export const openEditPage = (subjectId, paperId) => {
  window.open(
    `${window.location.origin}/exam#/detail/false/true/${subjectId}/${paperId}`,
  );
};

export const getAiRecognitionActionHandler = ({
  actionKey,
  handleOpenQuestionTask,
  handleSubmitOcrTask,
}) => {
  switch (actionKey) {
    case AI_RECOGNITION_OPEN_QUESTION_TASK_ACTION: {
      return handleOpenQuestionTask;
    }
    case AI_RECOGNITION_SUBMIT_ACTION: {
      return handleSubmitOcrTask;
    }
    default: {
      return noop;
    }
  }
};

export const getAiRecognitionActionTitle = (actionDefinition) => {
  if (!actionDefinition.titleKey) {
    return;
  }

  return trans(actionDefinition.titleKey, actionDefinition.defaultTitle);
};

export const getSourcePaperActionStyles = (paperFileId) => ({
  iconStyle: { color: paperFileId ? "#0445FC" : "#bfbfbf" },
  textStyle: paperFileId ? undefined : { color: "#bfbfbf" },
});

const ActionButton = ({
  dataType,
  disabled,
  icon,
  iconStyle,
  label,
  onClick,
  textStyle,
  title,
}) => (
  <button
    className={[
      styles["action-item"],
      disabled ? styles["action-item-disabled"] : "",
    ].join(" ")}
    data-type={dataType}
    disabled={disabled}
    onClick={onClick}
    title={title}
    type="button"
  >
    <i
      aria-hidden="true"
      className={`${styles.iconfont} ${styles["action-icon"]}`}
      dangerouslySetInnerHTML={{ __html: icon }}
      style={getDisabledActionIconStyle(iconStyle, disabled)}
    />
    <span className={styles["action-text"]} style={textStyle}>
      {label}
    </span>
  </button>
);

ActionButton.propTypes = {
  dataType: PropTypes.string,
  disabled: PropTypes.bool,
  icon: PropTypes.string.isRequired,
  iconStyle: PropTypes.object,
  label: PropTypes.string.isRequired,
  onClick: PropTypes.func,
  textStyle: PropTypes.object,
  title: PropTypes.string,
};

ActionButton.defaultProps = {
  disabled: false,
  onClick: noop,
};

const PaperActions = ({
  item,
  canShowSchoolRestrictedAction,
  // similarPaperPermission,
  onInitiateTest,
  onPreview,
  onEdit,
  onOpenDownloadHistory,
  onRefresh,
  onDelete,
  onShowDeleteConfirm,
  onCancelDeletion,
  deleteId,
  deleteLoading,
}) => {
  const examPaperId = item.id || item.paperId;
  const hasUploadFile = hasPaperUploadFile(item);
  const [ocrLoading, setOcrLoading] = React.useState(false);
  const sourcePaperActionStyles = getSourcePaperActionStyles(item.paperFileId);

  const handleEnable = async (event) => {
    void event;
    const response = await openExamPape({ examPaperId: item.id });

    if (!response.status) {
      message.error(response.message);
      return;
    }

    message.success(trans("global.operateSuccess", "操作成功"));
    onRefresh();
  };

  const handleSubmitOcrTask = async (event) => {
    void event;
    if (!examPaperId || ocrLoading || !hasUploadFile) {
      return;
    }

    setOcrLoading(true);
    try {
      const response = await submitExamPaperOcrTask({ examPaperId });

      if (!response?.status) {
        message.error(response?.message);
        return;
      }

      message.success(trans("global.aiRecognitionStarted", "已开始识别"));
      onRefresh();
    } finally {
      setOcrLoading(false);
    }
  };

  const handleOpenQuestionTask = async (event) => {
    void event;
    if (!examPaperId || ocrLoading || !hasUploadFile) {
      return;
    }

    setOcrLoading(true);
    try {
      const response = await queryLatestExamPaperOcrTask({ examPaperId });
      const taskId = response?.content?.taskId;

      if (!response?.status || !taskId) {
        message.error(
          response?.message ||
            trans("global.aiRecognitionTaskMissing", "未找到可用识别任务"),
        );
        return;
      }

      window.open(
        `${window.location.origin}/exam#/testPaperManagement/question_task?taskId=${taskId}`,
      );
    } finally {
      setOcrLoading(false);
    }
  };

  const handleInitiateTest = (event) => {
    void event;
    onInitiateTest(item);
  };

  const handlePreview = (event) => {
    void event;
    onPreview(event);
  };

  const handleEdit = (event) => {
    void event;
    if (onEdit) {
      onEdit(event);
      return;
    }

    openEditPage(item.subjectId, item.id);
  };

  const handleAnalyzeOriginalPaper = (event) => {
    void event;
    if (!item.paperIsNotEmpty) {
      return;
    }

    downloadPaperByType(item.id, DOWNLOAD_STRUCTURED_PDF);
  };

  const handleOpenDownloadHistory = (event) => {
    void event;
    if (!item.examNum) {
      return;
    }

    onOpenDownloadHistory(event);
  };

  const handleDeleteConfirm = (event) => {
    void event;
    onDelete(item.id);
  };

  const handleShowDeleteConfirm = (event) => {
    void event;
    onShowDeleteConfirm(item.id);
  };
  const aiRecognitionActionDefinition = getAiRecognitionActionDefinition(
    getAiRecognitionStatus({
      hasUploadFile,
      aiRecognition: item.aiRecognition,
      ocrLoading,
    }),
  );
  const aiRecognitionActionHandler = getAiRecognitionActionHandler({
    actionKey: aiRecognitionActionDefinition.actionKey,
    handleOpenQuestionTask,
    handleSubmitOcrTask,
  });
  const aiRecognitionTitle = getAiRecognitionActionTitle(
    aiRecognitionActionDefinition,
  );
  const aiRecognitionAction = canShowSchoolRestrictedAction ? (
    <ActionButton
      disabled={aiRecognitionActionDefinition.disabled}
      icon={aiRecognitionActionDefinition.icon}
      label={trans(
        aiRecognitionActionDefinition.labelKey,
        aiRecognitionActionDefinition.defaultLabel,
      )}
      onClick={aiRecognitionActionHandler}
      title={aiRecognitionTitle}
    />
  ) : undefined;
  const enableAction = item.canStart ? (
    <ActionButton
      icon="&#xe83b;"
      label={trans("global.enable", "开启")}
      onClick={handleEnable}
    />
  ) : undefined;

  return (
    <div className={styles.actions}>
      {aiRecognitionAction}

      {/* {canShowParallelPaper ? (
        <Popover
          trigger="click"
          content={
            <div className={styles.parallelPaperPopover}>
              <div className={styles.parallelPaperTips}>
                1、生成的平行卷如果需要更换题目，请点击预览编辑，修改对应的题目，测验完成后系统会根据学生的学情生成对应错题的分层练习题。
              </div>
              {renderParallelPaperRow(1, parallelLoadingMap[1])}
              {renderParallelPaperRow(2, parallelLoadingMap[2])}
              {renderParallelPaperRow(3, parallelLoadingMap[3])}
            </div>
          }
        >
          {renderAction({
            icon: "&#xe81c;",
            label: trans("global.parallelPaperGeneration", "平行卷生成"),
          })}
        </Popover>
      ) : null} */}

      {enableAction}

      <ActionButton
        icon="&#xe85c;"
        label={trans("global.initiateTest", "发起测验")}
        onClick={handleInitiateTest}
      />

      <ActionButton
        dataType="试卷分析"
        icon="&#xe85d;"
        label={trans("global.preview", "预览")}
        onClick={handlePreview}
      />

      <FileUploadModal
        customButton={
          <ActionButton
            disabled={!item.paperFileId}
            icon="&#xe7c6;"
            iconStyle={sourcePaperActionStyles.iconStyle}
            label={trans("global.OriginalQuestionnaire", "原始问卷")}
            textStyle={sourcePaperActionStyles.textStyle}
          />
        }
        defaultFile={{
          id: item.paperFileId,
          name: item.paperFileName,
        }}
        onOk={onRefresh}
        paperId={item.paperId}
      />

      <ActionButton
        disabled={!item.paperIsNotEmpty}
        icon="&#xe7c6;"
        label={trans("global.analyzeOriginalPaper", "解析原卷")}
        onClick={handleAnalyzeOriginalPaper}
      />

      <ActionButton
        dataType="答题卡"
        disabled={!item.examNum}
        icon="&#xe7c6;"
        label={trans("detail.answerSheet", "答题卡")}
        onClick={handleOpenDownloadHistory}
      />

      <ActionButton
        dataType="编辑试卷"
        icon="&#xe7a1;"
        label={trans("global.edit", "编辑")}
        onClick={handleEdit}
      />

      {/* <Popconfirm
        placement="bottomRight"
        title={trans("global.confirmCopyExamPaper", "你确定要复制此试卷吗？")}
        onConfirm={handleCopyPaper}
        onCancel={() => {}}
        okText={trans("global.ok", "确认")}
        cancelText={trans("global.cancel", "取消")}
      >
        {renderAction({
          icon: "\ue7e7",
          label: trans("global.copyExamPaper", "复制"),
          dataType: "复制",
        })}
      </Popconfirm> */}

      <Popconfirm
        cancelText={trans("global.cancel", "取消")}
        onCancel={onCancelDeletion}
        onConfirm={handleDeleteConfirm}
        okButtonProps={{
          loading: deleteLoading,
        }}
        okText={trans("global.ok", "确认")}
        placement="bottomRight"
        title={trans(
          "global.areYouSureToDeleteTheCurrentTestPaper",
          "确定删除当前试卷?",
        )}
        visible={deleteId == item.id}
      >
        <ActionButton
          dataType="删除试卷"
          icon="&#xe7a8;"
          label={trans("global.delete", "删除")}
          onClick={handleShowDeleteConfirm}
        />
      </Popconfirm>
    </div>
  );
};

PaperActions.propTypes = {
  canShowSchoolRestrictedAction: PropTypes.bool,
  deleteId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  deleteLoading: PropTypes.bool,
  item: paperActionItemPropertyType.isRequired,
  onCancelDeletion: PropTypes.func,
  onDelete: PropTypes.func,
  onEdit: PropTypes.func,
  onInitiateTest: PropTypes.func,
  onOpenDownloadHistory: PropTypes.func,
  onPreview: PropTypes.func,
  onRefresh: PropTypes.func,
  onShowDeleteConfirm: PropTypes.func,
};

PaperActions.defaultProps = {
  canShowSchoolRestrictedAction: false,
  deleteId: undefined,
  deleteLoading: false,
  onCancelDeletion: noop,
  onDelete: noop,
  onEdit: undefined,
  onInitiateTest: noop,
  onOpenDownloadHistory: noop,
  onPreview: noop,
  onRefresh: noop,
  onShowDeleteConfirm: noop,
};

export default PaperActions;
