import React from "react";
import PropTypes from "prop-types";

import { trans } from "../../utils/i18n";
import ComnModal from "../ComnModal";

import styles from "./index.module.less";

//  功能可用性不高，暂时隐藏
const isShowDotMatrixPen = false;

const getActionButtonVariantClass = (variant) => {
  if (variant === "machine") {
    return styles.machineActionButton;
  }

  if (variant === "secondary") {
    return styles.secondaryActionButton;
  }

  return styles.primaryActionButton;
};

const ActionCard = ({ actions, children, className = "", style, title }) => (
  <span className={`${styles.actionCard} ${className}`} style={style}>
    <span className={styles.lanTit}>{title}</span>
    {children ? (
      <span className={styles.actionCardBody}>{children}</span>
    ) : undefined}
    <span className={styles.actionCardFooter}>{actions}</span>
  </span>
);

ActionCard.propTypes = {
  actions: PropTypes.node.isRequired,
  children: PropTypes.node,
  className: PropTypes.string,
  style: PropTypes.object,
  title: PropTypes.node.isRequired,
};

const ActionButton = ({
  active = false,
  children,
  className = "",
  disabled = false,
  onClick,
  variant = "primary",
}) => (
  <button
    className={`${styles.actionButton} ${getActionButtonVariantClass(variant)} ${
      active ? styles.machineTestActive : ""
    } ${className}`}
    disabled={disabled}
    type="button"
    onClick={onClick}
  >
    {children}
  </button>
);

ActionButton.propTypes = {
  active: PropTypes.bool,
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  disabled: PropTypes.bool,
  onClick: PropTypes.func.isRequired,
  variant: PropTypes.oneOf(["machine", "primary", "secondary"]),
};

const ModalTest = ({ modalTestProps }) => {
  const {
    options,
    clickLaunchOnline,
    clickMachine,
    clickTestPaperOnline,
    clickDownloadTestPaper,
    isSegmentation,
    clickDotMatrixPen,
    onlineTestDisabled,
    onlineTestDisabledReason,
  } = modalTestProps;
  const onlineTestAction = (
    <ActionButton disabled={onlineTestDisabled} onClick={clickLaunchOnline}>
      {trans("global.launchOnlineQuiz", "发起线上测验")}
    </ActionButton>
  );
  return (
    <ComnModal
      options={{
        ...options,
        wrapClassName: styles.modalTest,
        width: "824px",
      }}
      innerContent={
        <div className={styles.operateButton}>
          <ActionCard
            className={styles.onlineBOx}
            title={trans("global.onlineQuiz", "线上测验")}
            actions={
              onlineTestDisabled ? (
                <span
                  className={styles["disabled-action-tooltip"]}
                  title={onlineTestDisabledReason}
                >
                  {onlineTestAction}
                </span>
              ) : (
                onlineTestAction
              )
            }
          >
            <span className={styles.onlineTip}>
              {trans(
                "global.launchOnlineQuizTest",
                "以任务的形式发送给学生，学生在线完成答题，系统实时生成分析数据",
              )}
            </span>
          </ActionCard>

          {isShowDotMatrixPen ? (
            <ActionCard
              className={styles.onlineBOx}
              style={{ marginLeft: "20px" }}
              title={trans("examAnalysis.dotMatrixPenQuiz", "点阵笔互动测验")}
              actions={
                <ActionButton onClick={clickDotMatrixPen}>
                  {trans(
                    "modalTest.launchDotMatrixPenQuiz",
                    "发起点阵笔互动测验",
                  )}
                </ActionButton>
              }
            >
              <span className={styles.onlineTip}>
                {trans(
                  "examAnalysis.dotMatrixPenQuizDescriptionLine1",
                  "学生使用专属的点阵笔在通用答题卡上答题，目",
                )}
                <br />
                {trans(
                  "examAnalysis.dotMatrixPenQuizDescriptionLine2",
                  "前只支持15题以内的选择题，实时生成分析数据",
                )}
              </span>
            </ActionCard>
          ) : undefined}

          <ActionCard
            className={styles.machineBox}
            title={trans("global.machineReadingTest", "机阅测验")}
            actions={
              <ActionButton
                active={isSegmentation}
                variant="machine"
                onClick={clickMachine}
              >
                {trans("global.initiateMachine", "发起机阅测验")}
              </ActionButton>
            }
          >
            <span className={styles.print}>
              {trans(
                "global.initiateMachineTest",
                "需打印成纸质试卷，阅卷完成后，将考卷放入指定的阅卷机器完成数据分析",
              )}
            </span>
          </ActionCard>

          <ActionCard
            className={styles.testBtn}
            title={trans("global.otherOptions", "其他选项")}
            actions={
              <>
                <ActionButton
                  variant="secondary"
                  onClick={clickTestPaperOnline}
                >
                  {trans("global.testPaperOnline", "在线查看试卷")}
                </ActionButton>
                <ActionButton
                  variant="secondary"
                  // href={this.props.uploadPaper.wordUrl}
                  // href="https://www.baidu.com"
                  // target="_blank"
                  onClick={clickDownloadTestPaper}
                >
                  {trans("global.downloadTestPaper", "下载打印试卷")}
                </ActionButton>
              </>
            }
          />
        </div>
      }
    />
  );
};

ModalTest.propTypes = {
  modalTestProps: PropTypes.shape({
    clickDotMatrixPen: PropTypes.func,
    clickDownloadTestPaper: PropTypes.func.isRequired,
    clickLaunchOnline: PropTypes.func.isRequired,
    clickMachine: PropTypes.func.isRequired,
    clickTestPaperOnline: PropTypes.func.isRequired,
    isSegmentation: PropTypes.bool,
    onlineTestDisabled: PropTypes.bool,
    onlineTestDisabledReason: PropTypes.string,
    options: PropTypes.object.isRequired,
  }).isRequired,
};

export default ModalTest;
