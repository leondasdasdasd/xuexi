// 类组件
import React from "react";
import { Checkbox, Spin } from "antd";

import ChartSwitch from "../../../../components/ChartSwitch";
import AnalysisQuestionPreview from "../../../../routes/DataAnalysis/components/AnalysisQuestionPreview";
import { trans } from "../../../../utils/i18n";
import PreviewImg from "../../../PreviewImg";
import QuestionShow from "../../../QuestionShow";
import TableHeader from "../TableHeader";

import styles from "./index.module.less";

class WrongQuestionSet extends React.Component {
  constructor(properties) {
    super(properties);
    this.state = {
      url: "",
      imgVisible: false,
    };
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

  componentDidUpdate() {
    const imgList = document.querySelectorAll("img");

    for (const element of imgList) {
      let source = element.src;

      if (source.includes("&style=")) {
        source = source.split("&style=")[0];
      }

      element.addEventListener("click", this.showImg.bind(this, source));
    }
  }

  showImg = (source) => {
    this.setState({
      imgVisible: true,
      url: source,
    });
  };

  cancelImg = () => {
    this.setState({
      url: null,
      imgVisible: false,
    });
  };

  errorAnalysisChange = (values, m) => {
    this.props.onErrorAnalysis && this.props.onErrorAnalysis(values, m);
  };
  render() {
    const {
      studySituationByStudentIdList,
      titName,
      edit = true,
      spinning,
    } = this.props;
    const { moduleModelList } = studySituationByStudentIdList;

    let moduleSwitch = false;
    let result = {};
    if (moduleModelList?.length) {
      result = moduleModelList.find((item) => {
        return item.modelCode === "WRONG_TOPIC_COLLECTION";
      });
      moduleSwitch = result?.modelShow;
    }

    return (
      <div className={styles.wrongQuestionSet}>
        {this.state.imgVisible ? (
          <PreviewImg
            imgUrl={this.state.url}
            modalVisible={this.state.imgVisible}
            changeModalVisible={this.cancelImg}
          />
        ) : null}
        <Spin spinning={spinning}>
          <TableHeader
            titleName={titName}
            slot={
              edit ? (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    width: "100%",
                  }}
                >
                  <div
                    style={{
                      marginLeft: "auto",
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    <div
                      onClick={this.props.openSubRange}
                      className={`${styles.setSubRangeBtn}`}
                    >
                      <i
                        className={`${styles.iconfont}`}
                        style={{ cursor: "pointer", color: "#0445FC" }}
                      >
                        {" "}
                        &#xe8aa;
                      </i>{" "}
                      {trans("global.setWrongQuestionRange", "设置错题范围")}
                    </div>
                    <ChartSwitch
                      checked={Boolean(moduleSwitch)}
                      onChange={this.props.onChange}
                    />
                  </div>
                </div>
              ) : null
            }
          />
          <div>
            {moduleSwitch
              ? result?.modelValue?.objectModelList[0]?.objectContentList?.map(
                  (item, m) => (
                    <div
                      key={m}
                      className={styles.rowBox}
                      id={`question${item.questionId}`}
                    >
                      {this.props.analysisQuestionCatalog?.findQuestion(
                        item.questionId,
                      ) ? (
                        <AnalysisQuestionPreview
                          catalog={this.props.analysisQuestionCatalog}
                          mode="question"
                          questionId={item.questionId}
                        />
                      ) : null}
                      {edit === false &&
                      !this.props.configData.hasAnswer ? null : (
                        <div className={styles.projectStyle}>
                          <span className={styles.labelStyle}>
                            【{trans("global.studentAnswers", "学生答案")}】
                          </span>
                          <span className={styles.projectDetail}>
                            {item.type == 6 &&
                            item.sonQuestionList &&
                            item.sonQuestionList.length > 0 ? (
                              item.sonQuestionList.map((ii, inde) =>
                                ii.studentAnswerUrl ||
                                (ii.answerJson &&
                                  this.props.analysisQuestionCatalog?.findQuestion(
                                    ii.questionId,
                                  )) ? (
                                  <div
                                    key={ii.questionId || inde}
                                    className={styles.questName}
                                    style={{ display: "flex" }}
                                  >
                                    <span style={{ marginRight: "5px" }}>
                                      {ii.questionSerialNumber}
                                    </span>
                                    {/* 选择题最大作答图片信息的最大宽度为60px 其它是555px */}
                                    {ii.studentAnswerUrl ? (
                                      <img
                                        src={ii.studentAnswerUrl}
                                        style={{ marginTop: "5px" }}
                                        className="img"
                                      />
                                    ) : (
                                      <AnalysisQuestionPreview
                                        answerJson={ii.answerJson}
                                        catalog={
                                          this.props.analysisQuestionCatalog
                                        }
                                        mode="response"
                                        questionId={ii.questionId}
                                      />
                                    )}
                                  </div>
                                ) : null,
                              )
                            ) : item.studentAnswerUrl ? (
                              <img
                                src={item.studentAnswerUrl}
                                style={{ marginTop: "5px" }}
                                className="img"
                              />
                            ) : item.answerJson &&
                              this.props.analysisQuestionCatalog?.findQuestion(
                                item.questionId,
                              ) ? (
                              <AnalysisQuestionPreview
                                answerJson={item.answerJson}
                                catalog={this.props.analysisQuestionCatalog}
                                mode="response"
                                questionId={item.questionId}
                              />
                            ) : null}
                          </span>
                        </div>
                      )}

                      {edit === false &&
                      !this.props.configData.hasInspectionDirection ? null : (
                        <div className={styles.projectStyle}>
                          <span className={styles.labelStyle}>
                            【{trans("singleInput.knowledgeTree", "知识点")}】
                          </span>
                          <span className={styles.projectDetail}>
                            {item.type === 6 ? (
                              <div className={styles.itemContent}>
                                {item.knowledgeValues &&
                                item.knowledgeValues.length > 0 ? (
                                  <span className={styles.chapterSort}>
                                    {trans("global.entireQuestion", "整题")}
                                  </span>
                                ) : null}
                                {item.knowledgeValues &&
                                item.knowledgeValues.length > 0
                                  ? item.knowledgeValues.map((index, l) => (
                                      <span key={l}>
                                        <span className={styles.chapterItem}>
                                          {index}
                                        </span>
                                      </span>
                                    ))
                                  : null}
                                {item.sonQuestionList &&
                                item.sonQuestionList.length > 0
                                  ? item.sonQuestionList.map((index, f) => (
                                      <span key={f}>
                                        {index.knowledgeValues &&
                                        index.knowledgeValues ? (
                                          <span className={styles.chapterSort}>
                                            {index.questionSerialNumber}
                                          </span>
                                        ) : null}
                                        {index.knowledgeValues &&
                                        index.knowledgeValues.length > 0
                                          ? index.knowledgeValues.map((ii) => (
                                              <span
                                                className={styles.chapterItem}
                                              >
                                                {ii}
                                              </span>
                                            ))
                                          : null}
                                      </span>
                                    ))
                                  : null}
                              </div>
                            ) : (
                              <div className={styles.itemContent}>
                                {item.knowledgeValues &&
                                item.knowledgeValues.length > 0
                                  ? item.knowledgeValues.map((index, k) => (
                                      <span
                                        className={styles.chapterItem}
                                        key={k}
                                      >
                                        {index}
                                      </span>
                                    ))
                                  : null}
                              </div>
                            )}
                          </span>
                        </div>
                      )}

                      {edit === false &&
                      !this.props.configData.hasErrorAnalysis ? null : (
                        <div className={styles.projectStyle}>
                          <div className={styles.labelStyle}>
                            【{trans("global.errorAnalysis", "错因分析")}】
                          </div>
                          <div className={styles.projectDetail}>
                            <Checkbox.Group
                              options={[
                                {
                                  label: trans(
                                    "global.carelessMistake",
                                    "粗心大意",
                                  ),
                                  value: "粗心大意",
                                },
                                {
                                  label: trans(
                                    "global.conceptWeakness",
                                    "概念模糊",
                                  ),
                                  value: "概念模糊",
                                },
                                {
                                  label: trans(
                                    "global.misreadQuestions",
                                    "审题错误",
                                  ),
                                  value: "审题错误",
                                },
                                {
                                  label: trans(
                                    "global.wrongApproach",
                                    "思路错误",
                                  ),
                                  value: "思路错误",
                                },
                                {
                                  label: trans("global.other", "其它"),
                                  value: "其它",
                                },
                              ]}
                              value={item.errorAnalysis}
                              onChange={(values) => {
                                this.errorAnalysisChange(values, m);
                              }}
                            />
                          </div>
                        </div>
                      )}

                      {/* 非编辑状态作答区域为0不展示作答区域项 */}
                      {edit === false && item.answerFormat != 0 ? (
                        <div className={styles.projectStyle}>
                          <div className={styles.labelStyle}>
                            【{trans("global.retry", "重新作答")}】
                          </div>
                          <div
                            className={styles.projectDetail}
                            style={{ height: `${item.answerFormat * 20}px` }}
                          ></div>
                        </div>
                      ) : null}

                      {/* 默认情况展示一行重新作答区域 */}
                      {edit === false ? (
                        ""
                      ) : (
                        <div className={styles.projectStyle}>
                          <div className={styles.labelStyle}>
                            【{trans("global.retry", "重新作答")}】
                          </div>
                        </div>
                      )}

                      {edit === false &&
                      !this.props.configData.hasPersonalizedPractice ? null : (
                        <div className={styles.projectStyle}>
                          <div className={styles.labelStyle}>
                            【
                            {trans("global.personalizedPractice", "个性化练习")}
                            】
                          </div>
                          <div
                            className={styles.projectDetail}
                            style={{ width: "100%", paddingLeft: "10px" }}
                          >
                            {/* 个性化推荐题属于独立题库资源，不参与考试冻结题 catalog 关联。 */}
                            {item?.personalityQuestionList?.length
                              ? item.personalityQuestionList.map((qu, g) => (
                                  <div key={g}>
                                    <QuestionShow question={qu} />
                                  </div>
                                ))
                              : null}
                          </div>
                        </div>
                      )}
                    </div>
                  ),
                )
              : null}
          </div>
        </Spin>
      </div>
    );
  }
}

export default WrongQuestionSet;
