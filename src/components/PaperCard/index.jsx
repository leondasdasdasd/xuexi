import React from "react";
import { Icon } from "antd";
import PropTypes from "prop-types";

import { trans } from "../../utils/i18n";
import { hasPaperUploadFile } from "../../utils/paperPreview";
import HoverTooltip from "../HoverTooltip";
import PaperActions from "../PaperActions";

import styles from "./index.module.less";

const EXAM_TYPE_1 = 1;
const EXAM_TYPE_2 = 2;
const EXAM_TYPE_3 = 3;
const EXAM_TYPE_4 = 4;
const EXAM_TYPE_5 = 5;
const EXAM_TYPE_6 = 6;
const EXAM_TYPE_7 = 7;
const EXAM_TYPE_9 = 9;
const EXAM_TYPE_10 = 10;
const EXAM_TYPE_11 = 11;
const ENTER_KEY = "Enter";
const SPACE_KEY = " ";
const EXAM_TYPE_COLOR_CLASS_PAIRS = [
  [EXAM_TYPE_1, styles.green],
  [EXAM_TYPE_2, styles.blue],
  [EXAM_TYPE_3, styles.blue],
  [EXAM_TYPE_4, styles.orange],
  [EXAM_TYPE_5, styles.orange],
  [EXAM_TYPE_6, styles.orange],
  [EXAM_TYPE_7, styles.red],
  [EXAM_TYPE_9, styles.red],
  [EXAM_TYPE_10, styles.blue],
  [EXAM_TYPE_11, styles.grey],
];

const noop = (value) => {
  void value;
};

const CARD_BOTTOM_PADDING_IPAD = "30px";

const getExamTypeColorClass = (examTypeCode) =>
  (EXAM_TYPE_COLOR_CLASS_PAIRS.find(
    ([typeCode]) => typeCode === examTypeCode,
  ) || [undefined, undefined])[1];

const PaperCard = ({
  item,
  isIpad,
  canShowSchoolRestrictedAction,
  similarPaperPermission,
  onPreviewDetail,
  onPreviewPdf,
  onEditConfig,
  onInitiateTest,
  onOpenDownloadHistory,
  onRefresh,
  onResetToFirstPageAndRefresh,
  onDelete,
  onShowDeleteConfirm,
  onCancelDeletion,
  deleteId,
  deleteLoading,
}) => {
  const examTypeColorClass = getExamTypeColorClass(item.examTypeCode);
  const canPreviewPdf = hasPaperUploadFile(item);
  const handlePreviewDetail = (event) => {
    void event;
    onPreviewDetail(item);
  };
  const handlePreviewPdf = (event) => {
    if (!canPreviewPdf) {
      return;
    }
    void event;
    onPreviewPdf(item);
  };
  const handleEdit = (event) => {
    void event;
    onEditConfig(item.id);
  };
  const handleOpenDownloadHistory = (event) => {
    void event;
    onOpenDownloadHistory(item.id, item);
  };
  const handlePreviewPdfKeyDown = (event) => {
    if (event.key === ENTER_KEY || event.key === SPACE_KEY) {
      handlePreviewPdf(event);
    }
  };
  const previewCardAccessibilityProperties = canPreviewPdf
    ? {
        onClick: handlePreviewPdf,
        onKeyDown: handlePreviewPdfKeyDown,
        role: "button",
        tabIndex: 0,
      }
    : {};

  return (
    <div
      className={styles.card}
      style={isIpad ? { paddingBottom: CARD_BOTTOM_PADDING_IPAD } : undefined}
    >
      <div
        className={[
          styles["message-box"],
          canPreviewPdf ? styles.previewable : styles["preview-disabled"],
        ].join(" ")}
        {...previewCardAccessibilityProperties}
      >
        <div className={styles["title-row"]}>
          <span
            className={[styles["exam-type-box"], examTypeColorClass]
              .filter(Boolean)
              .join(" ")}
          >
            {item.examTypeName}
          </span>

          <div className={styles.header}>
            <HoverTooltip text={item.title} maxWidth="100%" />
          </div>

          {item.secretStatus ? (
            <i className={`${styles.iconfont} ${styles["secret-status"]}`}>
              &#xe86f;
            </i>
          ) : undefined}
        </div>

        <div className={styles["meta-row"]}>
          <span className={styles.time}>
            <i className={styles.iconfont}>&#xe61f;</i>
            {item.createDate}
          </span>
          <span className={styles.time}>
            <i className={styles.iconfont}>&#xe708;</i>
            {item.subjectName}
          </span>
          <span className={styles.time}>
            <i className={styles.iconfont}>&#xe745;</i>
            {item.gradeName}
          </span>
          <span className={styles.time}>
            <Icon type="user" />
            {item.createUserName}
          </span>
          {item.examNum ? (
            <span className={styles.time}>
              <i className={styles.iconfont}>&#xe7fe;</i>
              {item.examNum}
            </span>
          ) : undefined}
        </div>
      </div>

      <div
        className={[
          styles["question-score"],
          canPreviewPdf ? styles.previewable : styles["preview-disabled"],
        ].join(" ")}
        {...previewCardAccessibilityProperties}
      >
        <div>
          {item.totalScore}&nbsp;
          {trans("global.point", "分")}
        </div>
        <div>
          {item.largeQuestionNumbers}&nbsp;
          {trans("evaluation.majorTopic", "大题")}
        </div>
        <div>
          {item.smallQuestionNumbers}&nbsp;
          {trans("evaluation.smallQuestion", "小题")}
        </div>
      </div>

      <PaperActions
        item={item}
        canShowSchoolRestrictedAction={canShowSchoolRestrictedAction}
        similarPaperPermission={similarPaperPermission}
        onInitiateTest={onInitiateTest}
        onPreview={handlePreviewDetail}
        onEdit={handleEdit}
        onOpenDownloadHistory={handleOpenDownloadHistory}
        onRefresh={onRefresh}
        onResetToFirstPageAndRefresh={onResetToFirstPageAndRefresh}
        onDelete={onDelete}
        onShowDeleteConfirm={onShowDeleteConfirm}
        onCancelDeletion={onCancelDeletion}
        deleteId={deleteId}
        deleteLoading={deleteLoading}
      />
    </div>
  );
};

export default PaperCard;

const paperItemPropertyType = PropTypes.shape({
  createDate: PropTypes.string,
  createUserName: PropTypes.string,
  examNum: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  examTypeCode: PropTypes.number,
  examTypeName: PropTypes.string,
  gradeName: PropTypes.string,
  id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  largeQuestionNumbers: PropTypes.number,
  secretStatus: PropTypes.bool,
  smallQuestionNumbers: PropTypes.number,
  subjectId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  subjectName: PropTypes.string,
  title: PropTypes.string,
  totalScore: PropTypes.number,
});

PaperCard.propTypes = {
  canShowSchoolRestrictedAction: PropTypes.bool,
  deleteId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  deleteLoading: PropTypes.bool,
  isIpad: PropTypes.bool,
  item: paperItemPropertyType.isRequired,
  onCancelDeletion: PropTypes.func,
  onDelete: PropTypes.func,
  onEditConfig: PropTypes.func,
  onInitiateTest: PropTypes.func,
  onOpenDownloadHistory: PropTypes.func,
  onPreviewDetail: PropTypes.func,
  onPreviewPdf: PropTypes.func,
  onRefresh: PropTypes.func,
  onResetToFirstPageAndRefresh: PropTypes.func,
  onShowDeleteConfirm: PropTypes.func,
  similarPaperPermission: PropTypes.bool,
};

PaperCard.defaultProps = {
  canShowSchoolRestrictedAction: false,
  deleteId: undefined,
  deleteLoading: false,
  isIpad: false,
  onCancelDeletion: noop,
  onDelete: noop,
  onEditConfig: noop,
  onInitiateTest: noop,
  onOpenDownloadHistory: noop,
  onPreviewDetail: noop,
  onPreviewPdf: noop,
  onRefresh: noop,
  onResetToFirstPageAndRefresh: noop,
  onShowDeleteConfirm: noop,
  similarPaperPermission: false,
};
