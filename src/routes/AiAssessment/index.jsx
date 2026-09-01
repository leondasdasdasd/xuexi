//Ai智能评语
import React, { createRef, PureComponent } from "react";
import { Icon, Input, message, Select } from "antd";
import { connect } from "dva";
import moment from "moment";
import { CopyToClipboard } from "react-copy-to-clipboard";
import ReactMarkdown from "react-markdown";

import aiAssessmentImg from "../../assets/aiAssessment.svg";
import { trans } from "../../utils/i18n";
import SelectionPanel from "./SelectionPanel";

import icon from "../../icon.module.less";
import styles from "./index.module.less";
const { Option } = Select;
const { TextArea } = Input;

let languageStyle = ["默认", "亲和", "风趣", "严谨"];
let languageType = ["中英文双语", "中文", "英文"];
let wordCount = [300, 500, 800, 1000];
let dataSourceAnalysis = [
  { code: "lastTermComment", text: "上学期老师评语" },
  { code: "processEvaluationData", text: "过程性评价数据" },
];

@connect(({ global }) => ({
  currentUser: global.currentUser,
}))

/*参数来源于url search: studentId、semesterId、courseId、planId、groupId、dataSourceCodeList(数据源)*/
class AiAssessment extends PureComponent {
  constructor(properties) {
    super(properties);
    let dataSourceCodeList = new URLSearchParams(window.location.search).get(
        "dataSourceCodeList",
      ),
      studentId = new URLSearchParams(window.location.search).get("studentId"),
      entry_key = new URLSearchParams(window.location.search).get("entry_key");
    this.state = {
      groupId: undefined,
      studentId: studentId ? Number(studentId) : undefined,
      languageStyleState: ["默认"],
      languageTypeState: ["中文"],
      wordCountState: [300],
      dataSourceAnalysisState: dataSourceCodeList ? [dataSourceCodeList] : [],
      otherDescription: undefined,
      //会话参数
      answerList: [
        {
          inputs: {},
          query: "您好，有什么问题都可以问我",
          response_mode: "",
          conversation_id: "notShowTranslate",
          float: "start",
        },
      ],
      balance: 0, //余额
      question: {}, //存储问题
      topicId: "", //会话id
      responseText: "", // 存储逐字显示的文本
      isTyping: false, // 控制打字机光标
      isLoading: false, // 控制加载状态
      endParsedData: {},
      isGenerating: false, //是否正在生成
      studentListLoading: false,
      entry_key: entry_key,
    };

    this.cursorInterval = null; // 用于控制光标闪烁的定时器
    this.messagesEndRef = createRef(); // 创建 ref
  }

  componentDidMount() {
    this.getModelList();
    if (
      this.state.entry_key == 10 ||
      this.state.entry_key == 11 ||
      this.state.entry_key == 14
    ) {
      this.getClassListFun();
    }
  }

  componentWillUnmount() {
    clearInterval(this.cursorInterval); // 组件卸载时清除定时器
  }

  getParamsByEntryKey = ({ studentId, groupId } = {}) => {
    let key = this.state.entry_key;
    let urlParameters = new URLSearchParams(window.location.search);
    if (key == 10) {
      return {
        url: "exam/getStudentPerformanceReportAIParams",
        payload: {
          examId: urlParameters.get("examId"),
          studentId: studentId || this.state.studentId,
        },
      };
    } else if (key == 11) {
      return {
        url: "exam/getStudentSummaryScoresAIParams",
        payload: {
          summaryReportId: urlParameters.get("reportId"),
          studentId: studentId || this.state.studentId,
        },
      };
    } else if (key == 14) {
      return {
        url: "exam/getStudentPerformanceReportAIParams",
        payload: {
          examId: urlParameters.get("examId"),
          groupId: groupId || this.state.groupId,
        },
      };
    } else if (key == 15) {
      return {
        url: "exam/getStudentPerformanceReportAIParams",
        payload: {
          examId: urlParameters.get("examId"),
        },
      };
    }
  };

  //查询数据: 学生id，会话id,historyQuery:是否是要基于已有生成操作
  getProcessEvaluationData({ url, payload }, historyQuery) {
    if (this.state.isGenerating) {
      return message.info(
        trans("aiAssessment.generatingPleaseWait", "正在生成中，请等待一下哟~"),
      );
    }

    this.setState({
      isGenerating: true,
    });

    this.props.dispatch({
      type: url,
      payload: payload,
      onSuccess: (res) => {
        if (res.content) {
          const { inputs, modelCodeId, modelCode } = res.content;

          const { currentUser } = this.props;

          let payload = {
            //组装AI参数
            data: {
              inputs: inputs,
              modelCode: modelCode,
              query: historyQuery ? historyQuery : this.joinParamsSting(inputs),
              response_mode: "streaming",
              user: currentUser && currentUser.userId ? currentUser.userId : "",
              ...(this.state.isChangeModel
                ? {}
                : {
                    conversation_id: this.state?.endParsedData?.conversation_id
                      ? `${this.state?.endParsedData?.conversation_id}`
                      : "",
                  }),
            },
            formType: { id: modelCodeId, modelCode: modelCode },
          };

          this.setState(
            {
              question: payload,
            },
            () => {
              if (this.state.topicId) {
                const { question } = this.state;
                this.setState(
                  {
                    answerList: [...this.state.answerList, question.data],
                  },
                  () => {
                    this.fetchData(question.data);
                  },
                );
              } else {
                //没有topicId，创建topicId
                this.getCreateTopicId().then((res) => {
                  this.setState(
                    {
                      answerList: [...this.state.answerList, payload.data],
                    },
                    () => {
                      this.fetchData(payload.data);
                    },
                  );
                });
              }
            },
          );
        }
      },
      onError: () => {
        this.setState({
          isGenerating: false,
        });
      },
    });
  }

  joinParamsSting = (inputs) => {
    const { languageStyleState, languageTypeState, wordCountState } =
      this.state;

    let langeuageStyleText = languageStyleState[0]
        ? `语言风格：【${languageStyleState[0]}】`
        : "语言风格：【默认】",
      languageTypeText = languageTypeState[0]
        ? `语言类型：【${languageTypeState[0]}】`
        : "语言类型：【中文】",
      wordCountText = wordCountState[0]
        ? `字数：${wordCountState[0]}字`
        : "字数：300字";

    let role = null;
    if (this.state.entry_key == 10 || this.state.entry_key == 11) {
      role = `学生：${inputs.studentName}`;
    } else if (this.state.entry_key == 14) {
      role = `班级：${inputs.groupName}`;
    } else if (this.state.entry_key == 15) {
      role = `年级：${inputs.gradeName}`;
    }
    return `${role}，其他要求：${this.state.otherDescription || "无"}，请帮我生成一份${langeuageStyleText}${languageTypeText}${wordCountText}的评语。`;
  };

  getCreateTopicId = () => {
    return new Promise((resolve, reject) => {
      this.props.dispatch({
        type: "aiAssessment/createOrEditAITopic",
        payload: {
          name: "学情诊断",
          type: 0,
        },
        onSuccess: (res) => {
          this.setState(
            {
              topicId: res,
            },
            () => {
              resolve();
            },
          );
        },
      });
    });
  };

  fetchData = (formData) => {
    const { currentUser } = this.props;
    const { question, topicId } = this.state;

    this.setState({
      responseText: "",
      isLoading: true,
      isTyping: false,
    });

    if (formData && formData.inputs) {
      formData.inputs.htmlContent = "";
    } else {
      formData.inputs = {
        htmlContent: "",
      };
    }

    const myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");
    this.startCursorBlinking();

    fetch("/api/conversation", {
      method: "POST",
      headers: myHeaders,
      body: JSON.stringify({
        userId: currentUser?.userId ? currentUser.userId : "",
        modelCodeId: question?.formType?.id ? question.formType.id : "",
        modelCode: formData.modelCode,
        data: {
          ...formData,
          user: currentUser?.userId ? currentUser.userId : "",
        },
        model: this.state.modelCodeId, //模型--will do
        topicId: topicId,
      }),
      redirect: "follow",
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder("utf-8");
        let buffer = "";

        const readStream = () => {
          reader.read().then(({ done, value }) => {
            if (done) return;
            buffer += decoder.decode(value, { stream: true });
            let boundary = buffer.indexOf("\n\n");
            while (boundary !== -1) {
              const chunk = buffer.slice(0, boundary).trim();
              buffer = buffer.slice(boundary + 2);
              if (chunk) {
                this.appendTextWithTypingEffect(chunk);
              }
              boundary = buffer.indexOf("\n\n");
            }
            readStream();
          });
        };

        readStream();
      })
      .finally(() => {
        this.setState({
          isLoading: false,
          isTyping: false,
          isChangeModel: false,
        });
      })
      .catch((error) => {
        this.setState({
          isLoading: false,
          isTyping: false,
          isGenerating: false,
          responseText:
            typeof error == "string" ? error : "服务器繁忙，请稍后再试",
        });
      });
  };

  scrollToBottom = () => {
    if (this.messagesEndRef.current) {
      this.messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  appendTextWithTypingEffect = (chunk) => {
    try {
      const jsonString = chunk.trim().replace(/^data:/, "");
      const parsedData = JSON.parse(jsonString);

      let tokens =
        parsedData && parsedData.usage && parsedData.usage.total_tokens;

      if (parsedData && parsedData.choices && parsedData.choices.length > 0) {
        let delta = parsedData.choices[0].delta;
        if (parsedData.choices[0].finish_reason != "stop") {
          let text = delta.content || delta.reasoning_content;
          // 逐字显示文本
          this.setState({ isTyping: true });
          this.setState(
            (previousState) => ({
              responseText: text
                ? previousState.responseText + text
                : previousState.responseText,
            }),
            this.scrollToBottom(),
          );
        } else if (parsedData.choices[0].finish_reason == "stop") {
          this.getBalance();
          window._TokenInfo = null;
          // 文本显示完毕
          this.setState({ isTyping: false });
          clearInterval(this.cursorInterval); // 停止光标闪烁
          const { currentUser, dispatch } = this.props;
          const { question, modelCodeId } = this.state;
          const { answerList, responseText, topicId } = this.state;
          let array = {
            conversion: [
              {
                content:
                  answerList && answerList.length > 0 && answerList.length > 0
                    ? answerList.at(-1).query
                    : "",
                requestId: parsedData.task_id,
                requestUserId:
                  currentUser && currentUser.userId ? currentUser.userId : "",
                role: "user",
                sessionId: parsedData.conversation_id,
                time: moment().valueOf(),
                model: modelCodeId,
                tokens:
                  parsedData &&
                  parsedData.metadata &&
                  parsedData.metadata.usage &&
                  parsedData.metadata.usage.total_tokens
                    ? parsedData.metadata.usage.total_tokens
                    : "",
              },
              {
                content: responseText,
                requestId: parsedData.task_id,
                requestUserId:
                  currentUser && currentUser.userId ? currentUser.userId : "",
                role: "assistant",
                sessionId: parsedData.conversation_id,
                time: moment().valueOf(),
                model: modelCodeId,
                tokens:
                  parsedData &&
                  parsedData.metadata &&
                  parsedData.metadata.usage &&
                  parsedData.metadata.usage.total_tokens
                    ? parsedData.metadata.usage.total_tokens
                    : "",
              },
            ],
            modelCode:
              question && question.formType && question.formType.modelCode
                ? question.formType.modelCode
                : "",
            topicId: topicId,
          };
          dispatch({
            type: "aiAssessment/saveAIConversionForTopic",
            payload: array,
          }).then(() => {
            this.setState(
              {
                endParsedData: parsedData,
                answerList: [
                  ...this.state.answerList,
                  {
                    inputs: {},
                    query: responseText,
                    response_mode:
                      question && question.data && question.data.response_mode
                        ? question.data.response_mode
                        : "streaming",
                    conversation_id: parsedData.conversation_id,
                    user:
                      currentUser && currentUser.userId
                        ? currentUser.userId
                        : "",
                    float: "start",
                  },
                ],
                responseText: "",
                isGenerating: false,
              },
              () => {
                console.log(this.state.answerList, "answerList");
              },
            );
          });
        }
      }
    } catch (error) {
      console.log(error, "error>>>>");
      this.setState({
        isLoading: false,
        isGenerating: false,
      });
    }
  };

  startCursorBlinking = () => {
    this.cursorInterval = setInterval(() => {
      this.setState((previousState) => ({
        showCursor: !previousState.showCursor,
      }));
    }, 500); // 每 500ms 切换光标状态
  };

  getClassListByParams = ({ url, payload }) => {};

  //获取班级列表
  getClassListFun = () => {
    const urlParameters = new URLSearchParams(window.location.search);
    const entryKey = this.state.entry_key;
    const reportId = urlParameters.get("reportId");
    const examId = urlParameters.get("examId");
    const studentId = urlParameters.get("studentId");

    const handleClassListSuccess = (res) => {
      if (!res.content || res.content.length === 0) return;

      const groupId =
        urlParameters.get("groupId") || res.content[0].groupId || undefined;

      this.setState({
        groupId,
        classListData: res.content,
      });

      const commonParameters = { groupId, studentId };

      if (entryKey == 11) {
        this.getStudentList({
          url: "exam/getStudentInfo",
          payload: { reportId, groupId },
        });
      }

      if (entryKey == 10) {
        this.getStudentList({
          url: "home/getTrendStu",
          payload: { examId, groupId },
        });
      }
    };

    // 按不同入口调用接口
    if (entryKey == 11) {
      this.props.dispatch({
        type: "exam/paperGroupNames",
        payload: { reportId },
        onSuccess: handleClassListSuccess,
      });
    } else if (entryKey == 10 || entryKey == 14) {
      this.props.dispatch({
        type: "home/getClassList",
        payload: { examId, visible: false },
        callback: handleClassListSuccess,
      });
    }
  };

  //获取余额
  getBalance = () => {
    this.props.dispatch({
      type: "aiAssessment/getBalance",
      onSuccess: (res) => {
        this.setState({
          balance: res,
        });
      },
    });
  };

  //获取学生列表
  getStudentList = ({ url, payload }) => {
    this.setState({
      studentListLoading: true,
    });
    this.props.dispatch({
      type: url,
      payload: {
        ...payload,
        searchStudentKeyWord: "",
      },
      onSuccess: (res) => {
        this.setState({
          studentListLoading: false,
        });
        if (res.content && res.content.length > 0) {
          this.setState({
            studentList: res.content,
          });
        }
      },
    });
  };

  //选择设定
  changeSetting = (value, type) => {
    let state = Object.assign([], this.state[type]);
    const index = state.indexOf(value);
    if (index > -1) {
      state.splice(index, 1);
    } else {
      // if (type == "dataSourceAnalysisState") { //数据源多选
      //     state.push(value);
      // }
      state = [value];
    }
    this.setState({
      [type]: state,
    });
  };

  //输入其他需求
  fillOtherDescription = (e) => {
    this.setState({
      otherDescription: e.target.value,
    });
  };

  //切换学生
  changeStudent = (studentId) => {
    this.setState({
      studentId: studentId,
    });
  };

  //重新生成
  generateAgain = () => {
    let parsms = this.getParamsByEntryKey();
    this.getProcessEvaluationData(parsms);
  };

  //切换班级
  changeGroup = (e) => {
    let groupId = this.state.entry_key == 14 ? e : e.key;

    this.setState({
      groupId: groupId,
      studentId: undefined,
    });

    if (this.state.entry_key == 10) {
      let urlParameters = new URLSearchParams(window.location.search);

      this.getStudentList({
        url: "home/getTrendStu",
        payload: {
          groupId: groupId,
          examId: urlParameters.get("examId"),
        },
      });
    } else if (this.state.entry_key == 11) {
      this.getStudentList({
        url: "exam/getStudentInfo",
        payload: {
          reportId: urlParams.get("reportId"),
          groupId: groupId,
        },
      });
    }
  };

  //复制成功
  copySuccess = (item) => {
    item && item.query
      ? message.success(trans("global.copySuccess", "复制成功"))
      : message.info(
          trans("aiAssessment.noContentToCopy", "暂无内容可以复制哦~"),
        );
  };

  //翻译当前内容
  translateCurrentContent = (item) => {
    let currentQuery = item.query + " 请完成中英文互翻译，只返回一种语言";
    let parsms = this.getParamsByEntryKey();
    this.getProcessEvaluationData(parsms, currentQuery);
  };

  useReport = () => {
    let urlParameters = new URLSearchParams(window.location.search);

    if (this.state.isGenerating || this.state.useLoading) {
      return message.info(
        trans("aiAssessment.generatingPleaseWait", "正在生成中，请等待一下哟~"),
      );
    }

    const lastIndex = this.state.answerList.length - 1;
    this.setState({
      useLoading: true,
    });

    let url = "";
    if (this.state.entry_key == 11) {
      url = "exam/summaryUpdateAiAnalyse";
    } else if (
      this.state.entry_key == 10 ||
      this.state.entry_key == 14 ||
      this.state.entry_key == 15
    ) {
      url = "exam/updateStudySituation";
    }

    this.props
      .dispatch({
        type: url,
        payload: {
          examId: urlParameters.get("examId"),
          groupId: this.state.groupId,
          studentUserId: this.state.studentId,
          studySituation: this.state.answerList[lastIndex].query,
        },
      })
      .then(() => {
        this.setState({
          useLoading: false,
        });
      });
  };

  //渲染对话内容
  renderDialogue() {
    const { answerList, responseText, isTyping, isLoading } = this.state;
    return (
      <div className={styles.dialogue}>
        {answerList.map((item, index) => {
          return (
            <div
              key={index}
              className={
                item && item.float == "start"
                  ? `${styles.dialogueCard} ${styles.answerCard}`
                  : `${styles.dialogueCard} ${styles.questionCard}`
              }
            >
              <div
                className={styles.cardContent}
                style={
                  item && item.float == "start" && item.conversation_id
                    ? { paddingBottom: 40 }
                    : {}
                }
              >
                <ReactMarkdown>{item ? item.query : ""}</ReactMarkdown>
                {item && item.float == "start" && item.conversation_id ? (
                  <div className={styles.conversationTools}>
                    <div className={styles.rightTool}>
                      <span onClick={() => this.translateCurrentContent(item)}>
                        <i className={icon.iconfont}>&#xe914;</i>
                        <em>{trans("global.translate", "翻译")}</em>
                      </span>
                      <CopyToClipboard
                        text={item.query}
                        onCopy={() => this.copySuccess(item)}
                      >
                        <span>
                          <i className={icon.iconfont}>&#xe879;</i>
                          <em>{trans("global.copy", "复制")}</em>
                        </span>
                      </CopyToClipboard>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          );
        })}
        {responseText ? (
          <div className={`${styles.dialogueCard} ${styles.answerCard}`}>
            <div className={styles.cardContent}>
              <ReactMarkdown>{responseText}</ReactMarkdown>
              {isTyping && <Icon type="loading" />}
            </div>
          </div>
        ) : null}
        {isLoading ? (
          <div className={`${styles.dialogueCard} ${styles.answerCard}`}>
            <div className={styles.cardContent}>
              {trans("global.loading", "加载中...")}
            </div>
          </div>
        ) : null}
        <div ref={this.messagesEndRef}></div>
      </div>
    );
  }

  getModelList = () => {
    const { dispatch } = this.props;
    dispatch({
      type: "aiAssessment/getModelList",
      payload: {
        modelCode:
          this.state.entry_key == 15
            ? "GradePerformanceReport"
            : "GroupPerformanceReport",
      },
      onSuccess: (res) => {
        let array = res.find((item) => item.isDefault);
        this.setState({
          modelList: res || [],
          modelCodeId: array && array.modelCode ? array.modelCode : "",
        });
      },
    });
  };

  handleChange = (value) => {
    if (value === this.state.modelCodeId) {
      return;
    } else {
      this.setState({
        modelCodeId: value,
        isChangeModel: true,
      });
    }
  };

  render() {
    const {
      languageStyleState,
      languageTypeState,
      wordCountState,
      modelList,
      modelCodeId,
    } = this.state;
    return (
      <div className={styles.aiAssessment}>
        <div className={styles.aiMain}>
          <div className={styles.aiAgent}>
            <img src={aiAssessmentImg} />
            <span>
              {
                {
                  15: "年级学情诊断",
                  14: "班级学情诊断",
                  11: "学生学情诊断",
                  10: "学生全科诊断",
                }[this.state.entry_key]
              }
            </span>
            <Select
              dropdownClassName={styles.modeDropdownContent}
              value={modelCodeId}
              className={styles.modeSelect}
              onChange={this.handleChange}
              dropdownMatchSelectWidth={false}
            >
              {modelList &&
                modelList.length > 0 &&
                modelList.map((item, index) => (
                  <Option value={item.modelCode} key={item.modelCode}>
                    {item.modelName}
                  </Option>
                ))}
            </Select>
          </div>
          <div className={styles.aiContent}>
            <SelectionPanel
              entryKey={this.state.entry_key}
              studentListLoading={this.state.studentListLoading}
              classListData={this.state.classListData}
              studentList={this.state.studentList}
              studentId={this.state.studentId}
              groupId={this.state.groupId}
              changeGroup={this.changeGroup}
              changeStudent={this.changeStudent}
            />
            {this.renderDialogue()}
          </div>
        </div>
        <div className={styles.aiShortCuts}>
          <div className={styles.shortCutsList}>
            <div className={styles.shortCutsModule}>
              <span className={styles.moduleTitle}>
                {trans("aiAssessment.languageStyle", "语言风格")}
              </span>
              <div className={styles.tagArea}>
                {languageStyle.map((l, index) => (
                  <span
                    className={
                      languageStyleState.includes(l) ? styles.selected : {}
                    }
                    key={index}
                    onClick={() => this.changeSetting(l, "languageStyleState")}
                  >
                    {l}
                  </span>
                ))}
              </div>
            </div>

            <div className={styles.shortCutsModule}>
              <span className={styles.moduleTitle}>
                {trans("aiAssessment.languageType", "语言类型")}
              </span>
              <div className={styles.tagArea}>
                {languageType.map((l, index) => (
                  <span
                    className={
                      languageTypeState.includes(l) ? styles.selected : {}
                    }
                    key={index}
                    onClick={() => this.changeSetting(l, "languageTypeState")}
                  >
                    {l}
                  </span>
                ))}
              </div>
            </div>

            <div className={styles.shortCutsModule}>
              <span className={styles.moduleTitle}>
                {trans("aiAssessment.wordCountRequirement", "字数要求")}
              </span>
              <div className={styles.tagArea}>
                {wordCount.map((l, index) => (
                  <span
                    className={
                      wordCountState.includes(l) ? styles.selected : {}
                    }
                    key={index}
                    onClick={() => this.changeSetting(l, "wordCountState")}
                  >
                    {l}
                  </span>
                ))}
              </div>
            </div>

            <div className={styles.otherDescription}>
              <TextArea
                placeholder={trans(
                  "aiAssessment.otherRequirements",
                  "其他要求说明",
                )}
                className={styles.textAreaStyle}
                onChange={this.fillOtherDescription}
                value={this.state.otherDescription}
              />
            </div>

            <div className={styles.generateAgain}>
              {this.state.isGenerating == true ? (
                <span>{trans("aiAssessment.generating", "生成中...")}</span>
              ) : (
                <span onClick={this.generateAgain}>
                  {trans("global.generateReport", "生成报告")}
                </span>
              )}
            </div>
            <div className={styles.generateAgain} onClick={this.useReport}>
              {this.state.useLoading == true ? (
                <span>{trans("aiAssessment.applying", "使用中...")}</span>
              ) : (
                <span>{trans("aiAssessment.useThisReport", "使用此报告")}</span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default AiAssessment;
