// 类组件
import React from "react";
import { Checkbox, Col, Form, Icon, InputNumber, Radio, Row } from "antd";

import { trans } from "../../../../utils/i18n";

import styles from "./index.module.less";

/**
 *
 * @param object
 * @param list
 */
function isCludes(object, list) {
  let flag1 = false;
  if (list)
    for (const element of list) {
      if (object.questionId == element.questionId) {
        flag1 = true;
      }
    }
  return flag1;
}
class DownloadConfig extends React.Component {
  constructor(properties) {
    super(properties);
    this.state = {};
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

  emit = (parameters) => {
    this.props.onConfigChange && this.props.onConfigChange(parameters);
  };

  reportsModuleChange = (checkedValue) => {
    let cloneData = JSON.parse(JSON.stringify(this.props.configData));
    cloneData.hasWrongQuestionSet = checkedValue?.includes(
      "hasWrongQuestionSet",
    )
      ? true
      : false;
    cloneData.hasWrongQuestionOverview = checkedValue?.includes(
      "hasWrongQuestionOverview",
    )
      ? true
      : false;
    cloneData.hasOverallSituation = checkedValue?.includes(
      "hasOverallSituation",
    )
      ? true
      : false;

    cloneData.aiPoweredLearningAnalytics = checkedValue?.includes(
      "aiPoweredLearningAnalytics",
    )
      ? true
      : false;

    // if (checkedValue?.includes('teacherPoweredLearningAnalytics')) {
    //     cloneData.teacherPoweredLearningAnalytics = true
    // } else {
    //     cloneData.teacherPoweredLearningAnalytics = false
    // }
    this.emit(cloneData);
  };

  rateValuesChange = (checkedValue) => {
    let cloneData = JSON.parse(JSON.stringify(this.props.configData));
    cloneData.hasStudentScoreRate = checkedValue?.includes(
      "hasStudentScoreRate",
    )
      ? true
      : false;
    cloneData.groupStudentScoreRate = checkedValue?.includes(
      "groupStudentScoreRate",
    )
      ? true
      : false;
    this.emit(cloneData);
  };

  wrongQuestionChange = (checkedValue) => {
    let cloneData = JSON.parse(JSON.stringify(this.props.configData));
    cloneData.hasAnswer = checkedValue?.includes("hasAnswer") ? true : false;
    cloneData.hasInspectionDirection = checkedValue?.includes(
      "hasInspectionDirection",
    )
      ? true
      : false;
    cloneData.hasErrorAnalysis = checkedValue?.includes("hasErrorAnalysis")
      ? true
      : false;
    cloneData.hasPersonalizedPractice = checkedValue?.includes(
      "hasPersonalizedPractice",
    )
      ? true
      : false;
    cloneData.answer = checkedValue?.includes("answer") ? true : false;
    cloneData.answerAnalysis = checkedValue?.includes("answerAnalysis")
      ? true
      : false;

    this.emit(cloneData);
  };

  errorQuSetContentChange = (checkedValue) => {
    let cloneData = JSON.parse(JSON.stringify(this.props.configData));
    if (cloneData?.overallSituation)
      for (const item of cloneData?.overallSituation) {
        item.hasOpen = checkedValue?.includes(item.typeName) ? true : false;
      }
    this.emit(cloneData);
  };

  getParentState = (data) => {
    let flag = true;
    if (data?.questionList && data?.questionList.length) {
      for (let index = 0; index < data.questionList.length; index++) {
        const element = data.questionList[index];
        // 当前题目在已经选中的题目中不存在则父节点不能全选
        if (
          !isCludes(element, this.props?.configData?.wrongQuestionRangeList)
        ) {
          flag = false;
        }
      }
      return flag;
    }
  };

  getChildElementState = (object) => {
    let flag = false;
    if (this.props?.configData?.wrongQuestionRangeList)
      for (const item of this.props?.configData?.wrongQuestionRangeList) {
        if (item.questionId == object.questionId) {
          flag = true;
        }
      }
    return flag;
  };

  changeChildState = (e, item) => {
    // console.log(e.target.checked, 'e.target.checked');
    let cloneData = JSON.parse(JSON.stringify(this.props.configData));
    if (e.target.checked) {
      cloneData.wrongQuestionRangeList?.push({
        questionId: item.questionId,
        reAnswerArea:
          item.type == 1 || item.type == 2 || item.type == 3 || item.type == 4
            ? 0
            : 1,
      });
    } else {
      if (cloneData.wrongQuestionRangeList)
        for (const [
          index,
          element,
        ] of cloneData.wrongQuestionRangeList.entries()) {
          if (element.questionId === item.questionId) {
            cloneData.wrongQuestionRangeList.splice(index, 1);
          }
        }
    }
    this.emit(cloneData);
  };

  getQuestionIdByArea = (questionId) => {
    let cloneData = null;
    if (this.props?.configData) {
      cloneData = JSON.parse(JSON.stringify(this.props.configData));
    }
    let area = null;
    if (cloneData?.wrongQuestionRangeList)
      for (const item of cloneData?.wrongQuestionRangeList) {
        if (item.questionId == questionId) {
          area = item.reAnswerArea;
        }
      }
    return area;
  };

  changeParentState = (e, item) => {
    let cloneData = JSON.parse(JSON.stringify(this.props.configData));
    if (e.target.checked) {
      for (let index = 0; index < item.questionList.length; index++) {
        const element = item?.questionList[index];
        // 下载配置选中的错题范围中不存在该题目并且该题目在错题范围中存在
        if (
          !isCludes(element, this.props?.configData?.wrongQuestionRangeList) &&
          this.props?.subRangeList?.includes(element.questionId)
        ) {
          cloneData.wrongQuestionRangeList.push({
            questionId: element.questionId,
            reAnswerArea:
              element.type == 1 ||
              element.type == 2 ||
              element.type == 3 ||
              element.type == 4
                ? 0
                : 1,
          });
        }
      }
    } else {
      for (let index = 0; index < item.questionList.length; index++) {
        const element = item?.questionList[index];
        // TIDO:这里留个疑问， cloneData.wrongQuestionRangeList替换成this.props?.configData?.wrongQuestionRangeList为什么不行？
        for (const [
          index_,
          element_,
        ] of cloneData.wrongQuestionRangeList.entries()) {
          if (element.questionId == element_.questionId) {
            cloneData.wrongQuestionRangeList.splice(index_, 1);
          }
        }
      }
    }
    this.emit(cloneData);
  };

  areaChange = (number_, question) => {
    let cloneData = JSON.parse(JSON.stringify(this.props.configData));
    for (const [index, element] of cloneData.wrongQuestionRangeList.entries()) {
      if (element.questionId == question.questionId) {
        element.reAnswerArea = number_;
      }
    }
    this.emit(cloneData);
  };

  render() {
    const { configData } = this.props;
    let reportsModule = [];
    if (configData?.hasWrongQuestionSet) {
      reportsModule.push("hasWrongQuestionSet");
    }
    if (configData?.hasWrongQuestionOverview) {
      reportsModule.push("hasWrongQuestionOverview");
    }
    if (configData?.hasOverallSituation) {
      reportsModule.push("hasOverallSituation");
    }
    if (configData?.aiPoweredLearningAnalytics) {
      reportsModule.push("aiPoweredLearningAnalytics");
    }
    // if (configData?.teacherPoweredLearningAnalytics) {
    //     reportsModule.push('teacherPoweredLearningAnalytics')
    // }

    let wrongQuestionModule = [];
    if (configData?.hasAnswer) {
      wrongQuestionModule.push("hasAnswer");
    }
    if (configData?.hasInspectionDirection) {
      wrongQuestionModule.push("hasInspectionDirection");
    }
    if (configData?.hasErrorAnalysis) {
      wrongQuestionModule.push("hasErrorAnalysis");
    }
    if (configData?.hasPersonalizedPractice) {
      wrongQuestionModule.push("hasPersonalizedPractice");
    }
    if (configData?.answer) {
      wrongQuestionModule.push("answer");
    }
    if (configData?.answerAnalysis) {
      wrongQuestionModule.push("answerAnalysis");
    }

    let errorQuSetContent = [];
    let errorContentValues = [];
    configData?.overallSituation?.map((item) => {
      errorQuSetContent.push({
        label: item.typeName,
        value: item.typeName,
      });
      if (item.hasOpen) {
        errorContentValues.push(item.typeName);
      }
    });

    let scoreRateValues = [];
    if (configData?.hasStudentScoreRate) {
      scoreRateValues.push("hasStudentScoreRate");
    }
    if (configData?.groupStudentScoreRate) {
      scoreRateValues.push("groupStudentScoreRate");
    }

    return (
      <div className={styles.downloadConfig}>
        <Form labelCol={{ span: 5 }} wrapperCol={{ span: 19 }}>
          <Row>
            <Col span={12}>
              <Form.Item
                label={trans("downloadConfig.fileFormat", "文件格式")}
                wrapperCol={{ span: 16 }}
                labelCol={{ span: 8 }}
              >
                <Radio.Group onChange={() => {}} value={0}>
                  <Radio value={0}>DOCX</Radio>
                  <Radio value={1} disabled>
                    PDF
                  </Radio>
                </Radio.Group>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label={trans("downloadConfig.paperSize", "纸张大小")}
                wrapperCol={{ span: 18 }}
                labelCol={{ span: 6 }}
              >
                <Radio.Group value={0}>
                  <Radio value={0}>A4</Radio>
                </Radio.Group>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label={trans("downloadConfig.reportModules", "报告模块")}
            wrapperCol={{ span: 16 }}
            labelCol={{ span: 4 }}
          >
            <Checkbox.Group
              options={
                this.props.AIPoweredLearningAnalytics
                  ? [
                      {
                        label: trans(
                          "downloadConfig.wrongQuestionOverview",
                          "错题概览",
                        ),
                        value: "hasWrongQuestionOverview",
                      },
                      {
                        label: trans(
                          "downloadConfig.overallSituation",
                          "整体情况",
                        ),
                        value: "hasOverallSituation",
                      },
                      {
                        label: trans(
                          "downloadConfig.wrongQuestionSet",
                          "错题集",
                        ),
                        value: "hasWrongQuestionSet",
                      },
                      {
                        label: trans(
                          "downloadConfig.literacyLearningOverview",
                          "素养学情综览",
                        ),
                        value: "aiPoweredLearningAnalytics",
                      },
                      // { label: '老师评语', value: 'teacherPoweredLearningAnalytics' },
                    ]
                  : [
                      {
                        label: trans(
                          "downloadConfig.wrongQuestionOverview",
                          "错题概览",
                        ),
                        value: "hasWrongQuestionOverview",
                      },
                      {
                        label: trans(
                          "downloadConfig.overallSituation",
                          "整体情况",
                        ),
                        value: "hasOverallSituation",
                      },
                      {
                        label: trans(
                          "downloadConfig.wrongQuestionSet",
                          "错题集",
                        ),
                        value: "hasWrongQuestionSet",
                      },
                      // { label: '老师评语', value: 'teacherPoweredLearningAnalytics' },
                    ]
              }
              value={reportsModule}
              onChange={this.reportsModuleChange}
            />
          </Form.Item>

          {configData?.hasOverallSituation ? (
            <Form.Item
              label={trans(
                "downloadConfig.overallSituationContent",
                "整体情况内容",
              )}
              wrapperCol={{ span: 16 }}
              labelCol={{ span: 4 }}
            >
              <Checkbox.Group
                value={errorContentValues}
                options={errorQuSetContent}
                onChange={this.errorQuSetContentChange}
              />
            </Form.Item>
          ) : null}

          {configData?.hasOverallSituation ? (
            <Form.Item
              label={trans(
                "pupllAnalyse.overallSituationMetrics",
                "整体情况指标",
              )}
              wrapperCol={{ span: 16 }}
              labelCol={{ span: 4 }}
            >
              <Checkbox.Group
                value={scoreRateValues}
                options={[
                  {
                    label: trans(
                      "pupllAnalyse.studentPersonalScoreRate",
                      "学生个人得分率",
                    ),
                    value: "hasStudentScoreRate",
                  },
                  {
                    label: trans(
                      "pupllAnalyse.wholeGradeScoreRate",
                      "全年级得分率",
                    ),
                    value: "groupStudentScoreRate",
                  },
                ]}
                onChange={this.rateValuesChange}
              />
            </Form.Item>
          ) : null}

          {configData?.hasWrongQuestionSet ? (
            <Form.Item
              label={trans(
                "pupllAnalyse.wrongQuestionSetContent",
                "错题集内容",
              )}
              wrapperCol={{ span: 20 }}
              labelCol={{ span: 4 }}
            >
              <Checkbox.Group
                options={
                  this.props.similarPaperPermission
                    ? [
                        {
                          label: trans(
                            "pupllAnalyse.studentAnswerScreenshot",
                            "学生作答截图",
                          ),
                          value: "hasAnswer",
                        },
                        {
                          label: trans("singleInput.knowledgeTree", "知识点"),
                          value: "hasInspectionDirection",
                        },
                        {
                          label: trans("global.errorAnalysis", "错因分析"),
                          value: "hasErrorAnalysis",
                        },
                        {
                          label: trans(
                            "pupllAnalyse.personalizedPracticeQuestions",
                            "个性化练习题",
                          ),
                          value: "hasPersonalizedPractice",
                        },
                        {
                          label: trans("global.answer", "答案"),
                          value: "answer",
                        },
                        {
                          label: trans(
                            "singleInput.answerAnalysis",
                            "答案解析",
                          ),
                          value: "answerAnalysis",
                        },
                      ]
                    : [
                        {
                          label: trans(
                            "pupllAnalyse.studentAnswerScreenshot",
                            "学生作答截图",
                          ),
                          value: "hasAnswer",
                        },
                        {
                          label: trans("singleInput.knowledgeTree", "知识点"),
                          value: "hasInspectionDirection",
                        },
                        {
                          label: trans("global.errorAnalysis", "错因分析"),
                          value: "hasErrorAnalysis",
                        },
                        {
                          label: trans("global.answer", "答案"),
                          value: "answer",
                        },
                        {
                          label: trans(
                            "singleInput.answerAnalysis",
                            "答案解析",
                          ),
                          value: "answerAnalysis",
                        },
                      ]
                }
                value={wrongQuestionModule}
                onChange={this.wrongQuestionChange}
              />
            </Form.Item>
          ) : null}

          {configData?.hasWrongQuestionSet ? (
            <Form.Item
              label={trans("pupllAnalyse.wrongQuestionRange", "错题范围")}
              wrapperCol={{ span: 20 }}
              labelCol={{ span: 4 }}
            >
              <div className={styles.tag}>
                <Icon
                  type="exclamation-circle"
                  theme="filled"
                  style={{
                    color: "#fc8a1d",
                    fontSize: "18px",
                    margin: "5px 5px 0 0",
                  }}
                />
                <div>
                  1.
                  {trans(
                    "global.uncheckedQuestionsHiddenForAllStudents",
                    "不勾选的题目在所有学生的错题中统一不显示",
                  )}
                  。<br />
                  2.
                  {trans(
                    "global.answerAreaCanBeSetToZero",
                    "作答区域可设置为0行，对应的题目不再预留作答区域，可节省纸张",
                  )}
                  。
                </div>
              </div>
              <div className={styles.showErrorQuBox}>
                <div className={styles.tableHeader}>
                  <div>
                    {trans(
                      "pupllAnalyse.visibleWrongQuestions",
                      "已显示的错题",
                    )}
                  </div>
                  <div>
                    {trans(
                      "pupllAnalyse.reanswerAreaHeight",
                      "重新作答区域高度",
                    )}
                  </div>
                </div>
                {
                  // 当前学生下的错题范围为null时，前端会默认勾选全部错题范围，但是此时并未保存到后端，如果是null代表未保存
                  // this.props.studySituationByStudentIdList?.moduleModelList[2]?.modelValue?.needViewQuestionIdList != null ?
                  <div className={styles.modalContent}>
                    {this.props.modalList?.map((item, index) => (
                      <div className={styles.modalBox} key={index}>
                        <div className={styles.modalHeader}>
                          <Checkbox
                            onChange={(e) => this.changeParentState(e, item)}
                            checked={this.getParentState(item)}
                          >
                            <span
                              className={styles.hang}
                              style={{ fontWeight: "500" }}
                            >
                              {item?.moduleName}
                            </span>
                          </Checkbox>
                        </div>
                        {item?.questionList?.map((item1, index) => {
                          // 当前题目在错题范围中存在，则进行展示
                          if (
                            this.props?.subRangeList?.includes(item1.questionId)
                          ) {
                            return (
                              <div
                                key={item1.questionSerialNumber}
                                className={styles.questionItem}
                              >
                                <Checkbox
                                  onChange={(e) =>
                                    this.changeChildState(e, item1)
                                  }
                                  checked={this.getChildElementState(item1)}
                                >
                                  <span
                                    className={styles.hang}
                                    style={{ fontWeight: "500" }}
                                  >
                                    {item1.questionSerialNumber}
                                  </span>
                                </Checkbox>
                                <div>
                                  <InputNumber
                                    disabled={
                                      this.getQuestionIdByArea(
                                        item1.questionId,
                                      ) === null
                                    }
                                    value={this.getQuestionIdByArea(
                                      item1.questionId,
                                    )}
                                    onChange={(e) => {
                                      this.areaChange(e, item1);
                                    }}
                                  />
                                  <span className={styles.hang}>
                                    &nbsp;{trans("global.go", "行")}
                                  </span>
                                </div>
                              </div>
                            );
                          }
                        })}
                      </div>
                    ))}
                  </div>
                }
              </div>
            </Form.Item>
          ) : null}
        </Form>
      </div>
    );
  }
}

export default DownloadConfig;
