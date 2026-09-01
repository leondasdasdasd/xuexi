import React from "react";
import { Popconfirm, Popover, Table } from "antd";

import { trans } from "../../../utils/i18n";

const getInnerContent = (tableData) => {
  const columns = [
    {
      title: trans("global.QuizList", "测验列表"),
      dataIndex: "quizName",
      key: "quizName",
      render: (text) => <span>{text}</span>,
    },
    {
      title: trans("global.creationTime", "创建时间"),
      dataIndex: "createdAt",
      key: "createdAt",
    },
    {
      title: trans("global.testType", "测验类型"),
      dataIndex: "quizTypeName",
      key: "quizTypeName",
    },
    {
      title: trans("global.numberOfRespondents", "作答人数"),
      dataIndex: "respondentCount",
      key: "respondentCount",
    },
    {
      title: trans("global.scoringRate", "得分率"),
      dataIndex: "averageScoreRate",
      key: "averageScoreRate",
    },
  ];
  const options = {
    pagination: false,
  };
  return <Table columns={columns} {...options} dataSource={tableData} />;
};

const difficulty = [
  { key: 1, name: trans("global.easy", "简单") },
  { key: 2, name: trans("global.general", "普通") },
  { key: 3, name: trans("global.difficult", "困难") },
];

/**
 *
 * @param root0
 * @param root0.styles
 * @param root0.item
 * @param root0.index
 * @param root0.answerDetailsVisible
 * @param root0.onCancelAdd
 * @param root0.onShowTransLate
 * @param root0.onEditQuestion
 * @param root0.onDeleteQuestion
 * @param root0.onToggleAnswerDetails
 */
function QuestionBottomActions({
  styles,
  item,
  index,
  answerDetailsVisible,
  onCancelAdd,
  onShowTransLate,
  onEditQuestion,
  onDeleteQuestion,
  onToggleAnswerDetails,
}) {
  const statistics = item.statistics || {};
  const statisticRows = statistics.examRows || [];

  return (
    <div className={styles.viewBottom}>
      <div style={{ display: "flex", alignItems: "center" }} key={item.id}>
        <div className={styles.text} style={{ marginRight: "10px" }}>
          <i className={styles.iconfont}>&#xe798;</i>
          {item.gradeName}
        </div>
        <span className={styles.text} style={{ marginRight: "10px" }}>
          {item.questionTypeDisplayName}
        </span>
        <div className={styles.text} style={{ marginRight: "10px" }}>
          {difficulty.find((it) => it.key == item.level)?.name}
        </div>
        <div className={styles.text} style={{ marginRight: "10px" }}>
          {trans("global.addPerson")}：{item.createUserName}
        </div>
        {statistics.examTotal == undefined ? null : (
          <Popover content={getInnerContent(statisticRows)}>
            <div className={styles.text} style={{ marginRight: "10px" }}>
              <span>{trans("global.testPaper", "组卷")}</span>&nbsp;
              <span style={{ color: "#0445FC" }}>{statistics.examTotal}</span>
            </div>
          </Popover>
        )}
        {statistics.studentTotal == undefined ? null : (
          <Popover content={getInnerContent(statisticRows)}>
            <div className={styles.text} style={{ marginRight: "10px" }}>
              <span>{trans("global.reply", "作答人数")} &nbsp;</span>
              <span style={{ color: "#0445FC" }}>
                {statistics.studentTotal}
              </span>
            </div>
          </Popover>
        )}
        {statistics.showAverageScoreRate &&
        statistics.averageScoreRate != undefined ? (
          <Popover content={getInnerContent(statisticRows)}>
            <div className={styles.text} style={{ marginRight: "10px" }}>
              <span>
                {trans("global.averageScoreRate", "平均得分率")} &nbsp;
              </span>
              <span style={{ color: "#0445FC" }}>
                {statistics.averageScoreRate}
              </span>
            </div>
          </Popover>
        ) : null}
      </div>
      <div className={styles.bottomBtn}>
        {item.isInQuestionBasket ? (
          <div className={styles.isAddedContent}>
            <div
              className={`${styles.viewResolution}`}
              onClick={() => onCancelAdd(item.id, index)}
            >
              {trans("global.cancelAddBasket1", "取消加入试题栏目")}
            </div>
          </div>
        ) : (
          <div
            className={`${styles.viewResolution} ${styles.primary}`}
            onClick={() => onShowTransLate(item, index)}
          >
            {trans("global.addBasket", "加入试题篮")}
          </div>
        )}
        {item.canEdit ? (
          <div
            className={`${styles.viewResolution}`}
            onClick={() => onEditQuestion(item.id)}
          >
            <i className={styles.iconfont}>&#xe6aa;</i>
            {trans("global.edit", "编辑")}
          </div>
        ) : null}
        {item.canEdit ? (
          <Popconfirm
            overlayClassName={styles.deletePopover}
            getPopupContainer={() => document.querySelector("#questionMapList")}
            title={trans(
              "global.questionContent",
              "你确定要删除这道题吗？删除后，该题所有内容将不可恢复。",
            )}
            onConfirm={() => onDeleteQuestion(item.id, index)}
            okText={trans("global.sure", "确定")}
            cancelText={trans("global.cancle", "取消")}
            placement="bottom"
          >
            <div className={`${styles.viewResolution}`}>
              <i className={styles.iconfont}>&#xe739;</i>
              {trans("global.delete", "删除")}
            </div>
          </Popconfirm>
        ) : null}
        <div
          className={`${styles.viewResolution} ${answerDetailsVisible ? styles.active : ""}`}
          onClick={onToggleAnswerDetails}
        >
          <i className={styles.iconfont}>&#xe631;</i>
          {trans("v2QuestionList.viewAnalysis", "查看解析")}
        </div>
      </div>
    </div>
  );
}

export default QuestionBottomActions;
