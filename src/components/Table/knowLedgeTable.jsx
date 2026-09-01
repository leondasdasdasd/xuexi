import React, { PureComponent } from "react";
import { connect } from "dva";

import { trans } from "../../utils/i18n";
import AnalysisDimensionImportModal, {
  EDIT_MODE,
  IMPORT_MODE,
} from "../AnalysisDimensionImportModal";
import MyButton from "../MyButton";
import CustomAnalysisTable from "./customAnalysisTable";
import PersonalTable from "./PersonalTable";

import styles from "./index.module.less";
let accomplishmentArray = [];
class GlobalHeader extends PureComponent {
  constructor(properties) {
    super(properties);
    this.state = {
      pageNo: 1,
      elevatorIndex: 0,
    };
    this.newKnowLedgeAnalysisStu = [];
    this.newKnowLedgeAnalysisTer = [];
  }
  componentDidMount() {
    this.props.dispatch({
      type: "home/getDimensionAnalysis",
      payload: {
        paperId: this.props.paperId || 1,
      },
      onSuccess: () => {
        this.props.dimensionAnalysis.map((item) => {
          accomplishmentArray.push(false);
        });
      },
    });
    this.getPageOne();
    console.log("msg：", "componentDidMount");
  }
  componentWillUnmount() {
    console.log("msg：", "componentWillUnmount");
    this.props.dispatch({
      type: "home/clearDimensionAnalysis",
    });
  }
  Refresh = () => {
    setTimeout(() => {
      window.location.reload();
    }, 100);
  };
  setSelect = (index) => {
    this.setState({
      elevatorIndex: index,
    });
    const dom = document.getElementById(`custom${index}`);
    console.log("www", dom);
    dom?.scrollIntoView(true);
  };
  getPageOne = (fun) => {
    // fun();
  };

  accomplishmentChange = (index, filterFlag) => {
    accomplishmentArray[index] = filterFlag;
  };

  render() {
    console.log(accomplishmentArray, "ddd");
    const {
      currentUser,
      basketList,
      basketSubjectId,
      questionScore,
      tableClass,
      dimensionAnalysis,
    } = this.props;
    const { check } = this.state;
    console.log(dimensionAnalysis);
    let newDataSource = [];
    const url =
      check === 1
        ? `${window.location.origin}/api/exam/export/qualityIndicatorReportWithStudent?examId=${this.props.examId}&groupId=${this.state.groupId}&studentName=${this.state.stuName}`
        : `${window.location.origin}/api/exam/export/qualityIndicatorReportWithGroup?examId=${this.props.examId}`;
    return (
      <>
        {dimensionAnalysis.length > 0 ? (
          <div
            className={[styles.questionTable, styles.customTable].join(" ")}
            id="table3"
          >
            <div className={styles.customAnalysis}>
              <PersonalTable
                dispatch={this.props.dispatch}
                questionScore={this.props.partScore}
                examId={this.props.examId}
                tableClass={tableClass}
                paperId={this.props.paperId}
                dimensionAnalysis={dimensionAnalysis}
                accomplishmentArr={accomplishmentArray}
                filterStudentListPermissions={
                  this.props.filterStudentListPermissions
                }
              />

              {dimensionAnalysis?.map((item, index) => (
                <CustomAnalysisTable
                  accomplishmentChange={this.accomplishmentChange}
                  examId={this.props.examId}
                  newDimensionAnalysis={item}
                  ind={index}
                  dimensionAnalysisList={dimensionAnalysis}
                  id={`custom${index + 1}`}
                  newKnowLedgeAnalysis={item}
                  getPageOne={this.getPageOne}
                  filterStudentListPermissions={
                    this.props.filterStudentListPermissions
                  }
                />
              ))}
            </div>
            <div className={styles.rightContent}>
              <div className={styles.elevator}>
                <div className={styles.elevatorTitle}>
                  {trans("global.viewList", "看板目录")}
                </div>
                <div>
                  <div
                    className={[
                      styles.elevatorListItem,
                      this.state.elevatorIndex == 0 ? styles.select : "",
                    ].join(" ")}
                    onClick={this.setSelect.bind(this, 0)}
                  >
                    {trans("data.summaryAnalysis", "汇总分析")}
                  </div>

                  {dimensionAnalysis.map((item, index) => (
                    <div
                      className={[
                        styles.elevatorListItem,
                        index + 1 === this.state.elevatorIndex
                          ? styles.select
                          : "",
                      ].join(" ")}
                      onClick={this.setSelect.bind(this, index + 1)}
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </div>
              <AnalysisDimensionImportModal
                examId={this.props.examId}
                paperId={this.props.paperId}
                onSuccess={this.Refresh}
                renderTrigger={({ open }) => (
                  <MyButton
                    sizeclass="commonBtn"
                    typeclass="confirmBtn"
                    style={{ marginTop: "15px" }}
                    onClick={() => open(EDIT_MODE)}
                  >
                    {trans("global.modifyAnalysisDimension", "修改分析维度")}
                  </MyButton>
                )}
              />
            </div>
          </div>
        ) : (
          <div className={styles.suyang}>
            <p>
              {trans(
                "global.dimensionIntroduction",
                "你可定义自己想要分析的维度，比如素养能力、知识点或所属章节，上传后，系统会自动生成学生和班级维度的分析报表，使用时，请先下载模板表格，依次标注好每道小题的分析维度。",
              )}
            </p>
            <AnalysisDimensionImportModal
              examId={this.props.examId}
              paperId={this.props.paperId}
              onSuccess={this.Refresh}
              renderTrigger={({ open }) => (
                <MyButton
                  sizeclass="commonBtn"
                  typeclass="confirmBtn"
                  style={{ marginTop: "30px" }}
                  onClick={() => open(IMPORT_MODE)}
                >
                  {trans("global.importAnalysisDimension", "导入分析维度")}
                </MyButton>
              )}
            />
          </div>
        )}
      </>
    );
  }
}
export default connect(({ home }) => ({
  count: home.count,
  basketList: home.basketList,
  basketSubjectId: home.basketSubjectId,
  tableClass: home.tableClass,
  knowLedgeAnalysis: home.knowLedgeAnalysis,
  dimensionAnalysis: home.dimensionAnalysis,
}))(GlobalHeader);
