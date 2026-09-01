// 类组件
import React from "react";
import { message } from "antd";
import { connect } from "dva";

import { trans } from "../../utils/i18n";
import RevisedModal from "../Revised/index";

class RevisedAdd extends React.Component {
  constructor(properties) {
    super(properties);
    const { testId } = properties.match.params;
    this.state = {};
    this.testId = testId;
  }

  // 初始化会执行 相当于componentWillMount
  // 更新会执行 相当于componentWillUpdate
  static getDerivedStateFromProps(nextProperties, nextState) {
    return {
      // 规定要返回数据，和state进行合并更新, state中有同名，否则新增到state中
      // xxx: nextProps.xxx,
    };
  }

  componentDidMount() {}
  reloadSource = () => {
    message.success(trans("global.operateSuccess", "操作成功"));
    setTimeout(() => {
      window.close();
    }, 1000);
  };
  //订正数据modal
  openRevisedDataModal = (examId, visible) => {
    window.close();
  };
  render() {
    return (
      <div className="content">
        <RevisedModal
          testId={this.testId}
          openRevisedDataModal={this.openRevisedDataModal}
          dispatch={this.props.dispatch}
          reloadSource={this.reloadSource}
          source="question"
        />
      </div>
    );
  }
}

export default connect(({ home, studyPictures, inputQuestion, global }) => ({
  analysisDetail: home.viewData,
  tabKey: home.tabKey,
  scoreData: home.scoreData,
  stuData: home.stuData,
  questionData: home.questionData,
  classListData: home.classListData,
  questionAnalysisData: home.questionAnalysisData,
  groupScoreList: home.groupScoreList,
  stuInfoList: home.stuInfoList,
  questionScore: home.questionScore,
  partScore: home.partScore,
  scoreRateTable: home.scoreRateTable,
  scoreSection: home.scoreSection,
  stuScore: home.stuScore,
  dataAnalysis: home.dataSource,
  viewData: home.viewData,
  tableClass: home.tableClass,
  stuGradeList: home.stuGradeList,
  knowLedgeAnalysis: home.knowLedgeAnalysis,
  allGradeList: inputQuestion.allGradeList,
  individuationTest: home.individuationTest,
  questionItem: home.questionItem,
  currentUser: global.currentUser,
  reportPresentationList: home.reportPresentationList,
  identityJudgement: home.identityJudgement,
  reviewUploadedFile: home.reviewUploadedFile,
  editReport: home.editReport,
  viewOrDownPaper: home.viewOrDownPaper,
  userByNameList: home.userByNameList,
  correction: home.correction,
  filterStudentList: home.filterStudentList,
  filterStudentListPermissions: home.filterStudentListPermissions,
  calPercentOrFraction: home.calPercentOrFraction,
  specialList: home.specialList,
  groupChanging: home.groupChanging,
}))(RevisedAdd);
