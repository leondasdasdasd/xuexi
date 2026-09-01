// 类组件
import React from "react";

import { trans } from "../../utils/i18n";
import PreviewImg from "../PreviewImg/index";

import styles from "./index.module.less";

const questionLevel = {
  1: trans("global.easy", "简单"),
  2: trans("global.general", "普通"),
  3: trans("global.difficult", "困难"),
};

class QuestionAnalysis extends React.Component {
  constructor(properties) {
    super(properties);
    this.state = {
      imgVisible: false,
      url: "",
    };
  }

  componentDidUpdate() {
    var imgList = document.querySelectorAll(".questionAnalysis img");
    for (const element of imgList) {
      let source = element.src;
      if (source.includes("&style=")) {
        source = source.split("&style=")[0];
      }
      element.addEventListener("click", this.showImg.bind(this, source));
    }
  }

  componentDidMount() {
    var imgList = document.querySelectorAll(".questionAnalysis img");
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
  render() {
    const { question, style = { fontSize: "14px", lineHeight: "22px" } } =
      this.props;
    return (
      <div
        className={`${styles.questionAnalysis} questionAnalysis`}
        style={style}
      >
        {this.state.imgVisible ? (
          <PreviewImg
            imgUrl={this.state.url}
            modalVisible={this.state.imgVisible}
            changeModalVisible={this.cancelImg}
          />
        ) : null}

        <div className={styles.projectStyle}>
          <span className={styles.labelStyle}>
            【{trans("global.questionType", "题型")}】
          </span>
          <span className={styles.projectDetail}>
            {
              {
                1: trans("global.radio", "单选题"),
                2: trans("global.check", "多选题"),
                3: trans("global.pack", "填空题"),
                4: trans("global.judge", "判断题"),
                5: trans("global.ask", "问答题"),
                6: trans("global.combination", "组合题"),
              }[question.type]
            }
          </span>
        </div>

        {question.type == 6 ? (
          <div className={styles.projectStyle}>
            <span className={styles.labelStyle}>
              【{trans("global.childDifficult", "子题难度")}】
            </span>
            <span className={styles.projectDetail}>
              <div className={styles.itemChildAnswer}>
                {question.sonQuestionList && question.sonQuestionList.length > 0
                  ? question.sonQuestionList.map((it, ind) => (
                      <span>
                        <span className={styles.chapterSort}>({ind + 1}).</span>
                        <span>{questionLevel[it.questionLevel]}</span>
                      </span>
                    ))
                  : null}
              </div>
            </span>
          </div>
        ) : (
          <div className={styles.projectStyle}>
            <span className={styles.labelStyle}>
              【{trans("analysis.hardValue", "难度")}】
            </span>
            {question.questionLevelName ? (
              <span className={styles.projectDetail}>
                {" "}
                {question.questionLevelName}
              </span>
            ) : null}
          </div>
        )}

        <div className={styles.projectStyle}>
          <span className={styles.labelStyle}>
            【{trans("global.rightAnswer", "正确答案")}】
          </span>
          <span className={styles.projectDetail}>
            {question.type == 3 ? (
              <>
                {question.gapFillingAnswer?.answers.map((iit) => (
                  <div
                    className={styles.itemContent}
                    key={iit}
                    dangerouslySetInnerHTML={{
                      __html: iit,
                    }}
                  ></div>
                ))}
              </>
            ) : question.type == 4 ? (
              <div className={styles.itemContent}>
                {question.answer == "true"
                  ? trans("global.right", "对")
                  : trans("global.wrong", "错")}
              </div>
            ) : question.type == 6 ? (
              <div className={styles.itemChildAnswer}>
                {question.sonQuestionList && question.sonQuestionList.length > 0
                  ? question.sonQuestionList.map((index, inde) => (
                      <div className={styles.childAnsContent}>
                        <span className={styles.chapterSort}>
                          ({inde + 1}).
                        </span>
                        {index.type == 3 ? (
                          <>
                            {index.gapFillingAnswer?.answers.map((ii, ind) => (
                              <div className={styles.answerFLex}>
                                <div
                                  className={styles.itemContent}
                                  key={ii}
                                  dangerouslySetInnerHTML={{ __html: ii }}
                                ></div>
                                {ind <
                                index.gapFillingAnswer.answers.length - 1 ? (
                                  <div>、</div>
                                ) : null}
                              </div>
                            ))}
                          </>
                        ) : index.type == 4 ? (
                          <div className={styles.itemContent}>
                            {index.answer == "true"
                              ? trans("global.right", "对")
                              : trans("global.wrong", "错")}
                          </div>
                        ) : (
                          <div
                            className={styles.itemContent}
                            dangerouslySetInnerHTML={{
                              __html: index.answer,
                            }}
                          ></div>
                        )}
                      </div>
                    ))
                  : null}
              </div>
            ) : (
              <div
                className={styles.itemContent}
                dangerouslySetInnerHTML={{ __html: question.answer }}
              ></div>
            )}
          </span>
        </div>

        <div className={styles.projectStyle}>
          <span className={styles.labelStyle}>
            【{trans("global.chapter", "章节")}】
          </span>
          <span className={styles.projectDetail}>
            {question.type == 6 ? (
              <div className={styles.itemContent}>
                {question.chapterValues && question.chapterValues.length > 0 ? (
                  <span className={styles.chapterSort}>
                    {trans("global.entireQuestion", "整题")}
                  </span>
                ) : null}
                {question.chapterValues && question.chapterValues.length > 0
                  ? question.chapterValues.map((index, inde) => (
                      <span>
                        <span className={styles.chapterItem}>{index}</span>
                      </span>
                    ))
                  : null}
                {question.sonQuestionList && question.sonQuestionList.length > 0
                  ? question.sonQuestionList.map((index, inde) => (
                      <span>
                        {index.chapterValues &&
                        index.chapterValues.length > 0 ? (
                          <span className={styles.chapterSort}>
                            ({inde + 1}).
                          </span>
                        ) : null}
                        {index.chapterValues && index.chapterValues.length > 0
                          ? index.chapterValues.map((ii) => (
                              <span className={styles.chapterItem}>{ii}</span>
                            ))
                          : null}
                      </span>
                    ))
                  : null}
              </div>
            ) : (
              <div className={styles.itemContent}>
                {question.chapterValues && question.chapterValues.length > 0
                  ? question.chapterValues.map((index, inde) => (
                      <span className={styles.chapterItem}>{index}</span>
                    ))
                  : null}
              </div>
            )}
          </span>
        </div>

        <div className={styles.projectStyle}>
          <span className={styles.labelStyle}>
            【{trans("singleInput.knowledgeTree", "知识点")}】
          </span>
          <span className={styles.projectDetail}>
            {question.type === 6 ? (
              <div className={styles.itemContent}>
                {question.knowledgeValues &&
                question.knowledgeValues.length > 0 ? (
                  <span className={styles.chapterSort}>
                    {trans("global.entireQuestion", "整题")}
                  </span>
                ) : null}
                {question.knowledgeValues && question.knowledgeValues.length > 0
                  ? question.knowledgeValues.map((index, inde) => (
                      <span>
                        <span className={styles.chapterItem}>{index}</span>
                      </span>
                    ))
                  : null}
                {question.sonQuestionList && question.sonQuestionList.length > 0
                  ? question.sonQuestionList.map((index, inde) => (
                      <span>
                        {index.knowledgeValues && index.knowledgeValues ? (
                          <span className={styles.chapterSort}>
                            ({inde + 1}).
                          </span>
                        ) : null}
                        {index.knowledgeValues &&
                        index.knowledgeValues.length > 0
                          ? index.knowledgeValues.map((ii) => (
                              <span className={styles.chapterItem}>{ii}</span>
                            ))
                          : null}
                      </span>
                    ))
                  : null}
              </div>
            ) : (
              <div className={styles.itemContent}>
                {question.knowledgeValues && question.knowledgeValues.length > 0
                  ? question.knowledgeValues.map((index, inde) => (
                      <span className={styles.chapterItem}>{index}</span>
                    ))
                  : null}
              </div>
            )}
          </span>
        </div>

        <div className={styles.projectStyle}>
          <span className={styles.labelStyle}>
            【{trans("singleInput.label", "素养")}】
          </span>
          <span className={styles.projectDetail}>
            <div className={styles.itemContent}>
              {question.type == 6 ? (
                <div className={styles.itemContent}>
                  {question.indicatorValues &&
                  question.indicatorValues.length > 0 ? (
                    <span className={styles.chapterSort}>
                      {trans("global.entireQuestion", "整题")}
                    </span>
                  ) : null}
                  {question.indicatorValues &&
                  question.indicatorValues.length > 0
                    ? question.indicatorValues.map((index, inde) => (
                        <span>
                          <span className={styles.chapterItem}>{index}</span>
                        </span>
                      ))
                    : null}
                  {question.sonQuestionList &&
                  question.sonQuestionList.length > 0
                    ? question.sonQuestionList.map((index, inde) => (
                        <span>
                          {index.indicatorValues &&
                          index.indicatorValues.length > 0 ? (
                            <span className={styles.chapterSort}>
                              ({inde + 1}).
                            </span>
                          ) : null}
                          {index.indicatorValues &&
                          index.indicatorValues.length > 0
                            ? index.indicatorValues.map((ii) => (
                                <span className={styles.chapterItem}>{ii}</span>
                              ))
                            : null}
                        </span>
                      ))
                    : null}
                </div>
              ) : (
                <div className={styles.itemContent}>
                  {question.indicatorValues &&
                  question.indicatorValues.length > 0
                    ? question.indicatorValues.map((index, inde) => (
                        <span className={styles.chapterItem}>{index}</span>
                      ))
                    : null}
                </div>
              )}
            </div>
          </span>
        </div>

        <div className={styles.projectStyle}>
          <span className={styles.labelStyle} style={{ verticalAlign: "top" }}>
            【{trans("global.analysis", "解析")}】
          </span>
          <div>
            <span
              className={styles.projectDetail}
              dangerouslySetInnerHTML={{
                __html:
                  question.analysis ||
                  `<span>${trans("global.noAnalysis", "暂无解析")}</span>`,
              }}
            ></span>
            {question.type === 6
              ? question.sonQuestionList && question.sonQuestionList.length > 0
                ? question.sonQuestionList.map((index, inde) => {
                    return index.analysis ? (
                      <div className={styles.analysisChild}>
                        <span className={styles.analysisItemTitle}>
                          ({inde + 1}).
                        </span>
                        <span
                          dangerouslySetInnerHTML={{ __html: index.analysis }}
                        ></span>
                      </div>
                    ) : null;
                  })
                : null
              : null}
          </div>
        </div>
      </div>
    );
  }
}

export default QuestionAnalysis;
