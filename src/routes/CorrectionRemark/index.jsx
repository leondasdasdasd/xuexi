//新闻
import React, { createRef, Fragment, PureComponent } from "react";
import { Checkbox, Icon, message, Progress, Radio, Select } from "antd";
import pathToRegexp, { compile, match } from "path-to-regexp";

import MyButton from "../../components/MyButton";
import PaperMarkTool from "../../components/PaperMarkTool";
import Toolbar from "../../components/Toolbar";
import {
  loadV2MarkingSheets,
  loadV2MarkingStudentResult,
  saveV2MarkingResults,
} from "../../services/v2OnlineMarking";
import { locale, trans } from "../../utils/i18n";
import CorrectionQuestionPlayer from "./CorrectionQuestionPlayer";
import { hasGradedAllQuestions, pickNextPendingStudent } from "./navigation";
import ScoreInputNumber from "./ScoreInputNumber";
import ScoreKeyboard from "./ScoreKeyboard";
import ScoreModeSwitcher from "./ScoreModeSwitcher";
import {
  createV2MarkingSubmission,
  mapV2StudentResultToCorrectionSource,
  summarizeV2MarkingProgress,
} from "./v2MarkingAdapter";

import styles from "./index.module.less";
const language = locale() == "en" ? false : true;
const { Option } = Select;
let startValue = "";
let followElement = null;
let pointerEL = null;
let remarkElement = null;
let isEnterBlur = false; //是否为回车失去光标
const V2_SCORE_STEP = 1;
class CorrectionRemark extends PureComponent {
  constructor(properties) {
    super(properties);
    this.url = this.props.history.location.pathname;
    /**
     * 批改备注
     * @param {number} examId 考试id
     *  @param {string} defaultQuestionBlockId 默认选中的题块id
     *  @param {number} defaultStudentId 默认选中的学生id
     */
    let hashParameters = pathToRegexp(
      "/correctionRemark/:examId/:defaultStudentId?/:defaultQuestionBlockId?",
    ).exec(this.url);

    this.examId = hashParameters[1];
    this.defaultStudentId = Number(hashParameters[2]) || undefined;
    this.defaultQuestionBlockId = hashParameters[3]
      ? hashParameters[3]
      : undefined;

    this.dynamicRefs = {};
    // 题目加载请求时序号：用于丢弃乱序/过期响应，避免人名与答案错位
    this.requestSeq = 0;
    // 同步防重入标记（不进入 state，避免 setState 异步导致的竞态）
    this.isSubmitting = false;
    this.isLoadingQuestion = false;
    this.state = {
      keyboardMode: 1,
      isAutoNext: true,
      isAutoSubmit: false,
      questionBlockId: this.defaultQuestionBlockId,
      studentId: this.defaultStudentId,
      questions: [],
      previewVisible: false,
      tagList: [],
      studentList: [],
      allImagesLoaded: true,
      currentTool: "",
      questionBlockList: [],
      markingSheets: [],
      questionTypeTemplates: [],
      checkNum: 0,
      allNum: 0,
    };
  }

  async componentDidMount() {
    const { defaultQuestionBlockId, defaultStudentId } = this;
    try {
      const students = await this.getStudentTableData(defaultQuestionBlockId);
      const selectedStudent =
        students.find((item) => item.studentId === defaultStudentId) ||
        students.find((item) => item.pending) ||
        students[0];
      if (!selectedStudent) {
        message.info(trans("explicitExam.noSubmission", "暂无可批改答卷"));
        return;
      }
      const source = await this.getQuestionImage(
        defaultQuestionBlockId,
        selectedStudent.studentId,
      );
      const blockId =
        source.blocks.find((item) => item.key === defaultQuestionBlockId)
          ?.key || source.blocks[0]?.key;
      this.setHash({
        defaultQuestionBlockId: blockId,
        defaultStudentId: selectedStudent.studentId,
      });
      await this.getStudentTableData(blockId);
    } catch (error) {
      message.error(error instanceof Error ? error.message : String(error));
    }
  }

  /**
   * 获取题块数据
   * @param {Function} callback 回调函数
   */
  getQuestionBlockList = (callback) => {
    const blocks = this.state.questionBlockList.map((block) => ({
      ...block,
      allDone: this.state.markingSheets.every((sheet) =>
        sheet.questionResults
          .filter((result) =>
            block.questionSettingIdList.includes(String(result.questionId)),
          )
          .every((result) => result.status !== 0),
      ),
    }));
    callback && callback(blocks, this.state.studentList);
    return Promise.resolve(blocks);
  };

  /**
   * 获取当前考试的学生列表
   * @param {Function} callback 回调函数
   */

  getStudentTableData = async (qusId) => {
    const sheets = await loadV2MarkingSheets(Number(this.examId));
    const questionIds = new Set(
      String(qusId || "")
        .split(",")
        .filter(Boolean)
        .map(Number),
    );
    const students = sheets.map((sheet, index) => ({
      index: index + 1,
      pending: sheet.questionResults.some(
        (result) =>
          result.status === 0 &&
          (questionIds.size === 0 || questionIds.has(result.questionId)),
      ),
      studentId: sheet.studentId,
      studentName:
        sheet.studentName || sheet.studentEnName || String(sheet.studentId),
    }));
    const { allNum, checkNum } = summarizeV2MarkingProgress(
      sheets,
      questionIds,
    );
    this.setState({
      allNum,
      checkNum,
      markingSheets: sheets,
      studentList: students,
    });
    return students;
  };

  /**
   * 设置hash
   * @param { object } params hash参数
   * @param parameters
   */
  setHash = (parameters = {}) => {
    const hash = window.location.hash || "";
    const path = hash.startsWith("#") ? hash.slice(1) : hash;

    // 模板路径（需要你自己传入或固定在这里）
    const pattern =
      "/correctionRemark/:examId/:defaultStudentId?/:defaultQuestionBlockId?";

    // match 会生成一个函数 matcher，用来检查 path 是否符合 pattern。
    const matcher = match(pattern, { decode: decodeURIComponent });

    const matched = matcher(path);

    if (!matched) {
      console.warn("当前 hash 不匹配预期的路由模式");
      return;
    }

    /**
     * currentParams 参数说明
     * {
     * examId: "1001",
     * defaultQuestionBlockId: "2002",
     * defaultStudentId: undefined
     * }
     */
    const currentParameters = matched.params;

    // 合并新参数
    const newParameters = { ...currentParameters, ...parameters };

    // 编译新路径
    const toPath = compile(pattern, { encode: encodeURIComponent });
    const newPath = toPath(newParameters);

    // 更新 hash
    history.replaceState(null, "", `#${newPath}`);
  };

  /**
   * 获取题目内容
   * @param { string } ids 题块id
   * @param { number } studentId 学生id
   */
  getQuestionImage = async (ids, studentId) => {
    this.clearAllCanvas();

    // 获取新的题目切图时，清空上次切图生成的画布
    for (const item of this.state.questions) {
      this.dynamicRefs[`paperMarkToolRef${item.questionId}`] = createRef();
    }

    this.dynamicRefs = {};

    // 为本次加载分配时序号，并标记加载中
    const seq = ++this.requestSeq;
    this.isLoadingQuestion = true;
    try {
      const result = await loadV2MarkingStudentResult(
        Number(this.examId),
        Number(studentId),
      );
      const source = mapV2StudentResultToCorrectionSource(result);
      if (seq !== this.requestSeq) return source;
      const selectedBlock =
        source.blocks.find((block) => block.key === ids) || source.blocks[0];
      const questionBlockList = source.blocks.map((block) => ({
        questionInfo: block.label,
        questionSettingIdList: block.key.split(","),
      }));
      this.setState(
        {
          questionBlockId: selectedBlock?.key,
          questionBlockList,
          questions: selectedBlock?.questions || [],
          questionTypeTemplates: source.questionTypeTemplates,
          studentId: source.studentId,
        },
        () => {
          for (const question of this.state.questions) {
            this.initQustionCanvas(question);
          }
          const questionId = this.state.questions[0]?.questionId;
          if (questionId)
            document.getElementById(`scoreInput_${questionId}`)?.focus();
        },
      );
      return source;
    } finally {
      if (seq === this.requestSeq) this.isLoadingQuestion = false;
    }
  };

  /**
   * 根据题目初始化画布
   * @param {*} question
   * @param {*} imgStr
   * @param imgString
   */
  initQustionCanvas = (question, imgString = "") => {
    // 2. 等待所有图片加载完成
    const loadImage = (url) => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.addEventListener("load", () => resolve(url));
        img.onerror = () => reject(new Error(`加载失败: ${url}`));
        img.src = url;
      });
    };

    imgString += this.getImgStrByQuestion(question);
    const parser = new DOMParser();
    const document_ = parser.parseFromString(imgString, "text/html");
    const imgUrls = [...document_.querySelectorAll("img")].map(
      (img) => img.src,
    );
    Promise.allSettled(imgUrls.map(loadImage)).then(() => {
      const jsonData = question.teacherAnnotation
        ? JSON.parse(question.teacherAnnotation)
        : null;
      this.dynamicRefs[
        `paperMarkToolRef${question.questionId}`
      ]?.initializeFabricCanvas(jsonData);
    });
  };

  /**
   * 根据题目获取选项中可能包含图片的字符串
   * @param question
   */
  getImgStrByQuestion = (question) => {
    return "";
  };

  changeAutoSubmit = (e) => {
    this.setState({
      isAutoSubmit: e.target.checked,
    });
  };

  back = () => {
    window.close() || this.props.history.goBack();
  };

  keyboardModeChange = (key) => {
    // 切换打分方式晴空分数
    let newQuList = JSON.parse(JSON.stringify(this.state.questions));
    for (const [index, item] of newQuList.entries()) {
      // 清空切图上的分数
      item.studentScore = ""; // 清空分数
      this.dynamicRefs[
        `paperMarkToolRef${item.questionId}`
      ]?.removeNumberText();
    }

    this.setState({
      keyboardMode: key,
      questions: newQuList,
    });

    // 切换打分方式清空工具
    this.resetTool();
  };

  changeAutoNext = (e) => {
    this.setState({
      isAutoNext: e.target.checked,
    });
  };

  viewScorllView = () => {
    let element = document.querySelector("#questionInputScoreBox");
    let element1 = document.querySelector("#canvasBox");
    if (element) {
      element.scrollTop = 0;
    }
    if (element1) {
      element1.scrollTop = 0;
    }
  };

  changeQuestionBloack = (id) => {
    this.viewScorllView();
    this.setHash({ defaultQuestionBlockId: id });

    // 切换题块，刷新学生列表
    this.getStudentTableData(id);

    this.setState(
      {
        questionBlockId: id,
      },
      () => {
        this.getQuestionImage(id, this.state.studentId);
      },
    );
  };

  /**
   * 打分面板选择事件
   * @param { Element } event 事件对象
   * @param { string|number } text 分数
   */
  selectScoreValue = (event, text) => {
    let handelValue = "";
    let prefix = "";
    // 满分
    if (typeof text == "string") {
      handelValue = text;
    } else {
      handelValue = text;
      prefix = this.state.keyboardMode % 2 == 0 ? "-" : "+";
    }

    this.setState({
      currentTool: "scoreRemark",
      keyboardValue: handelValue,
    });

    if (!followElement) {
      // 创建跟随元素
      followElement = document.createElement("div");
      followElement.classList.add(styles.cursor_follow);
      followElement.setAttribute("id", "followEl");

      remarkElement = document.createElement("div");
      remarkElement.classList.add(styles.remark);

      pointerEL = document.createElement("div");
      pointerEL.classList.add(styles.pointer);

      document.body.append(followElement);
      document.body.append(pointerEL);
      document.body.append(remarkElement);
    }

    // 设置数字，可以根据需要修改
    followElement.textContent = `${prefix}${handelValue}`;

    // 更新位置
    followElement.style.left = event.clientX + 20 + "px";
    followElement.style.top = event.clientY - 20 + "px";

    remarkElement.style.left =
      event.clientX + followElement.offsetWidth + 30 + "px";
    remarkElement.style.top = event.clientY - 10 + "px";

    pointerEL.style.left = event.clientX + "px";
    pointerEL.style.top = event.clientY + "px";

    // 监听鼠标移动，让元素跟随
    document.addEventListener("mousemove", this.onMouseMove);
  };

  /**
   * 清除打分面板值
   */
  clearKeyboardValue = () => {
    this.resetTool();
  };

  /**
   * @param { string|number } questionId 题目id
   * @param {Function} addNumberText 为添加分数的方法
   */
  canvasMouseDown = (questionId, addNumberText) => {
    let innerContent = document.querySelector("#followEl").innerText;
    // console.log(innerContent); //为-1或者+1
    let score = innerContent.slice(1);

    let array = JSON.parse(JSON.stringify(this.state.questions));

    let question = array.find((item) => {
      return item.questionId == questionId;
    });

    // 加分减分模式 点击画布打分
    if (this.state.keyboardMode == 1 || this.state.keyboardMode == 2) {
      let canvasReference =
        this.dynamicRefs[`paperMarkToolRef${question.questionId}`];
      canvasReference && canvasReference?.removeNumberText();

      if (this.state.keyboardMode == 1) {
        question.studentScore = Number(score);
      } else if (this.state.keyboardMode == 2) {
        question.studentScore = Number(question.questionScore) - Number(score);
      }
      addNumberText(innerContent);
    } else if (this.state.keyboardMode == 3 || this.state.keyboardMode == 4) {
      if (this.state.keyboardMode == 3) {
        // 累加模式 点击画布打分
        if (
          Number(question.studentScore) + Number(score) >
          question.questionScore
        ) {
          return message.error(
            trans("gradingPapers.exceedsFullScore", "超出满分"),
          );
        }
        question.studentScore = Number(question.studentScore) + Number(score);
      } else if (this.state.keyboardMode == 4) {
        let aaa =
          question.studentScore || question.studentScore === 0
            ? Number(question.studentScore)
            : Number(question.questionScore);

        // 累加模式 点击画布打分
        if (aaa - Number(score) < 0) {
          return message.error(
            trans("gradingPapers.exceedsFullScore", "超出满分"),
          );
        }
        question.studentScore = aaa - Number(score);
      }

      addNumberText(innerContent);
    }
    this.setState({
      questions: array,
    });

    // 加分减分模式 点击画布打分 清除工具
    if (this.state.keyboardMode == 1 || this.state.keyboardMode == 2) {
      let isAllSubQuestionsGraded = this.hasGradedAllSubQuestions();
      if (this.state.isAutoSubmit && isAllSubQuestionsGraded) {
        this.submitQuestionScore();
      }
    }
  };

  /**
   * 删除分值
   * @param { string } questionId 题目id
   * @param { string } innerContent 分数
   */
  deletQuestionScore = (questionId, innerContent) => {
    // console.log(innerContent); //为-1或者+1
    let score = innerContent;
    let array = JSON.parse(JSON.stringify(this.state.questions));
    array &&
      array.length > 0 &&
      array.map((item, index) => {
        if (item.questionId == questionId) {
          item.studentScore = Number(item.studentScore) - Number(score) || "";
        }
      });
    this.setState({
      questions: array,
    });
  };

  resetTool = () => {
    if (pointerEL && followElement) {
      document.body?.removeChild(pointerEL);
      document.body?.removeChild(followElement);
      document.body?.removeChild(remarkElement);
      pointerEL = null;
      followElement = null;
      remarkElement = null;
      document.removeEventListener("mousemove", this.onMouseMove);
    }
    this.setState({
      currentTool: null,
      keyboardValue: null,
    });
  };

  onMouseMove = (event) => {
    if (followElement) {
      followElement.style.left = event.clientX + 20 + "px";
      followElement.style.top = event.clientY - 20 + "px";

      pointerEL.style.left = event.clientX + "px";
      pointerEL.style.top = event.clientY + "px";

      remarkElement.style.left =
        event.clientX + followElement.offsetWidth + 30 + "px";
      remarkElement.style.top = event.clientY - 10 + "px";
    }
  };

  lookDetail = (status, item) => {
    console.log(item, "111");
    this.setState({
      previewVisible: status || false,
      previewInfo: item || null,
    });
  };

  setQuestionScore = (id, value) => {
    // console.log(value);// value输出格式为非负数的纯数字
    return new Promise((resolve, reject) => {
      let newQuList = JSON.parse(JSON.stringify(this.state.questions));

      let target = newQuList.find((q) => q.questionId === id);

      let errorElement = document.getElementById(
        `errorMsgBox_${target.questionId}`,
      );

      // 超出最高分强制赋值为最高分
      if (value > Number(target.questionScore)) {
        errorElement.innerText = `最高分为${target.questionScore}分`;
        errorElement.style.display = "block";

        // 减分模式，如果想要减去的分数超过最高分，那么这个题得分就为0
        if (this.state.keyboardMode == 2 || this.state.keyboardMode == 4) {
          target.studentScore = 0;
        } else if (
          this.state.keyboardMode == 1 ||
          this.state.keyboardMode == 3
        ) {
          // 加分模式，超出最高分强制赋值为最高分
          target.studentScore = Number(target.questionScore);
        }
      } else {
        // 减分模式
        if (this.state.keyboardMode == 2 || this.state.keyboardMode == 4) {
          target.studentScore = Number(target.questionScore) - Number(value);
        } else if (
          this.state.keyboardMode == 1 ||
          this.state.keyboardMode == 3
        ) {
          // 加分模式
          target.studentScore = Number(value);
        }
        errorElement.style.display = "none";
      }

      this.setState(
        {
          questions: newQuList,
        },
        () => {
          resolve();
        },
      );
    });
  };

  /**
   * 输入框改变事件
   * @param { string } id 题目id
   * @param { string } key 操作类型
   */
  inputToolChange = (id, key) => {
    let allQuestions = this.state.questions;

    let targetQu = allQuestions.find((q) => q.questionId === id);

    console.log(targetQu, "targetQu");

    let value = 0;

    // 减分模式
    if (this.state.keyboardMode % 2 == 0) {
      if (targetQu.studentScore || targetQu.studentScore === 0) {
        // 输入框当前的值
        value = Number(targetQu.questionScore) - Number(targetQu.studentScore);
      } else {
        value = 0;
      }

      if (key == "up") {
        value += V2_SCORE_STEP;
      } else {
        if (value <= 0) {
          return;
        }
        value -= V2_SCORE_STEP;
      }
    } else {
      // 输入框当前的值
      value = Number(targetQu.studentScore) || 0;
      if (key == "up") {
        value += V2_SCORE_STEP;
        console.log(value, key);
      } else {
        if (value <= 0) {
          return;
        }
        value -= V2_SCORE_STEP;
      }
    }

    this.setQuestionScore(id, value).then((res) => {
      this.addScoreToCanvas({ target: { value } }, id);
    });

    // 据根据配置来决定是否调用提交修改的函数
    if (this.state.keyboardMode == 1 || this.state.keyboardMode == 2) {
      let isAllSubQuestionsGraded = this.hasGradedAllSubQuestions();
      if (this.state.isAutoSubmit && isAllSubQuestionsGraded) {
        this.submitQuestionScore();
      }
    }
  };

  hasGradedAllSubQuestions = () => hasGradedAllQuestions(this.state.questions);

  // 确认将当前试题的分数添加到画布上
  addScoreToCanvas = (e, id) => {
    console.log(id, "e.target.value"); //格式+2 或者 -2
    let question = this.state.questions.find((item) => {
      return item.questionId == id;
    });

    let paperMarkCom = this.dynamicRefs[`paperMarkToolRef${id}`];

    this.dynamicRefs[`paperMarkToolRef${id}`].removeNumberText();

    let canvas = paperMarkCom.myCanvaRef.current;
    let x = canvas.offsetWidth * 0.8;
    let y = canvas.offsetHeight / 2;

    if (this.state.keyboardMode == 1 || this.state.keyboardMode == 3) {
      paperMarkCom.addText(`+${question.studentScore}`, x, y);
    } else if (this.state.keyboardMode == 2 || this.state.keyboardMode == 4) {
      paperMarkCom.addText(
        `-${Number(question.questionScore) - Number(question.studentScore)}`,
        x,
        y,
      );
    }
  };

  submitQuestionScore = async () => {
    // 防重入：提交进行中或题目加载中一律忽略，
    // 避免导航后自动 focus 引发的 blur 二次触发提交、以及乱序导航
    if (this.isSubmitting || this.isLoadingQuestion) {
      return;
    }
    this.isSubmitting = true;

    const { questions, isAutoNext, studentList } = this.state;

    if (!hasGradedAllQuestions(questions)) {
      this.isSubmitting = false;
      message.info(
        trans("explicitExam.scoreAllQuestions", "请完成所有题目评分"),
      );
      return;
    }

    let cloneQuestions = JSON.parse(JSON.stringify(questions));

    this.viewScorllView();

    for (const item of cloneQuestions) {
      const reference = this.dynamicRefs[`paperMarkToolRef${item.questionId}`];
      item.teacherAnnotation = JSON.stringify({
        ...reference.getCanvasJsonData(),
        canvasSize: {
          width: reference.myCanvaRef.current.offsetWidth,
          height: reference.myCanvaRef.current.offsetHeight,
        },
      });
    }

    this.setState({
      isSubmitLoading: true,
    });

    try {
      await saveV2MarkingResults(
        Number(this.examId),
        Number(this.state.studentId),
        createV2MarkingSubmission(cloneQuestions),
      );
      message.success(trans("global.saveSuccess", "保存成功"));
      const refreshedStudents = await this.getStudentTableData(
        this.state.questionBlockId,
      );
      this.setState({ studentList: refreshedStudents }, () => {
        if (isAutoNext) this.nextNoeCheckedStudent();
      });
    } catch (error) {
      message.error(error instanceof Error ? error.message : String(error));
    } finally {
      this.isSubmitting = false;
      this.setState({ isSubmitLoading: false });
    }
  };

  changeMarkStudent = (value) => {
    this.setState({
      studentId: value,
    });

    this.setHash({ defaultStudentId: value });
    this.getQuestionImage(this.state.questionBlockId, value);
  };

  clearAllCanvas = () => {
    // 切换题号清空画布
    if (this.state.questions)
      for (const item of this.state.questions) {
        this.dynamicRefs[`paperMarkToolRef${item.questionId}`]?.clearCanvas();
      }
  };

  imageContainerMouseEnter = (item) => {
    if (typeof this.state.keyboardValue === "number" && followElement) {
      if (this.state.keyboardValue > item.questionScore) {
        followElement.innerText = `${this.state.keyboardMode % 2 == 0 ? "-" : "+"}${item.questionScore}`;
        remarkElement.innerText = "超出满分";
      }
    } else if (this.state.keyboardValue === "满分") {
      followElement.innerText = `+${item.questionScore}`;
    }
  };

  mouseOutImageContainer = () => {
    if (followElement) {
      remarkElement.innerText = "";
      followElement.innerText = `${this.state.keyboardMode % 2 == 0 ? "-" : "+"}${this.state.keyboardValue}`;
    }
  };

  selectTool = (tool) => {
    this.resetTool();
    this.setState({
      currentTool: tool,
      keyboardValue: null,
    });
  };

  handleScoreInputBlur = (e, id) => {
    // 如果打开了自动提交
    if (this.state.isAutoSubmit) {
      // 判断当前题块是否全部批改完成（与自动提交使用同一套判断，避免并行逻辑）
      if (!hasGradedAllQuestions(this.state.questions) && isEnterBlur) {
        //回车触发的失去光标
        this.focusNextput(id);
      }
    } else {
      //回车触发的失去光标
      if (isEnterBlur) {
        this.focusNextput(id);
      }
    }

    isEnterBlur = false;

    let question = this.state.questions.find((item) => {
      return item.questionId == id;
    });

    let value = question.studentScore;
    // 分数没有发生改变
    if (startValue === value) {
      return;
    }
    this.addScoreToCanvas(e, id);
    // 据根据配置来决定是否调用提交修改的函数
    if (this.state.keyboardMode == 1 || this.state.keyboardMode == 2) {
      let isAllSubQuestionsGraded = this.hasGradedAllSubQuestions();
      if (this.state.isAutoSubmit && isAllSubQuestionsGraded) {
        this.submitQuestionScore();
      }
    }
  };

  //分局当前题目id自动定位到下一题光标
  focusNextput = (id) => {
    let index = this.state.questions.findIndex(
      (item) => item.questionId === id,
    );
    if (index != this.state.questions.length - 1) {
      let nextId = this.state.questions[index + 1].questionId;
      let nextInput = document.getElementById(`scoreInput_${nextId}`);
      console.log(nextInput, "nextInput");

      if (nextInput) {
        nextInput.focus();
      }
    }
  };

  handleScoreInputEnter = (e, id) => {
    isEnterBlur = true;
    e.preventDefault(); // 阻止默认事件，防止触发 onBlur
    e.target.blur(); // 手动失焦, 触发 onBlur
  };

  renderQuestion = (question, parentIndex, childIndex) => {
    return (
      <div
        key={question.questionId}
        className={styles.imageContainer}
        style={{ fontSize: 16 }}
        onMouseEnter={() => this.imageContainerMouseEnter(question)}
        onMouseOut={() => this.mouseOutImageContainer(question)}
      >
        <div style={{ marginBottom: "0.75rem" }}>
          <strong style={{ marginRight: "0.5rem" }}>
            {question.questionSerialNumber}.
          </strong>
          <CorrectionQuestionPlayer
            question={question}
            templates={this.state.questionTypeTemplates}
          />
        </div>
        <PaperMarkTool
          deletQuestionScore={(innerContent) =>
            this.deletQuestionScore(question.questionId, innerContent)
          }
          canvasMouseDown={(addNumberText) =>
            this.canvasMouseDown(question.questionId, addNumberText)
          }
          currentTool={this.state.currentTool}
          ref={(comp) => {
            this.dynamicRefs[`paperMarkToolRef${question.questionId}`] = comp;
          }}
        />
      </div>
    );
  };

  renderInputNumber = (question) => {
    const { keyboardMode } = this.state;
    return (
      <ScoreInputNumber
        question={question}
        formatter={(value) => `${keyboardMode % 2 == 0 ? "-" : "+"}${value}`}
        onFocus={() => {
          startValue = question.studentScore;
        }}
        value={
          question.studentScore || question.studentScore === 0
            ? keyboardMode % 2 == 0
              ? Number(question.questionScore) - Number(question.studentScore)
              : Number(question.studentScore)
            : undefined
        }
        onBlur={(e) => {
          this.handleScoreInputBlur(e, question.questionId);
        }}
        onChange={(value) => {
          this.setQuestionScore(question.questionId, value);
        }}
        onPressEnter={(e) => {
          this.handleScoreInputEnter(e, question.questionId);
        }}
        inputToolChange={(id, type) => {
          this.inputToolChange(id, type);
        }}
      />
    );
  };

  // 选中上一个学生，如果是最后一个学生则切换到下一个题块的第一个学生
  prevStudent = () => {
    const { studentId, studentList, questionBlockList, questionBlockId } =
      this.state;
    const studentIndex = studentList.findIndex(
      (s) => s.studentId === studentId,
    );
    const isFirstStudent = studentIndex === 0;

    // 当前题块的索引
    const blockIndex = questionBlockList.findIndex(
      (b) => b.questionSettingIdList.join(",") === questionBlockId,
    );
    const isFirstBlock = blockIndex === 0;

    if (isFirstStudent && isFirstBlock) {
      return message.error(
        trans(
          "gradingPapers.alreadyFirstStudentFirstBlock",
          "当前已为第一个学生，第一个题块",
        ),
      );
    }

    // 当前题块还有上一个学生
    if (!isFirstStudent) {
      const previousStudentId = studentList[studentIndex - 1].studentId;
      this.setState({ studentId: previousStudentId });
      this.setHash({ defaultStudentId: previousStudentId });
      this.getQuestionImage(questionBlockId, previousStudentId);
      return;
    }

    // 当前题块没有上一个学生，切换到上一个题块的最后一个学生
    if (!isFirstBlock) {
      const previousBlock = questionBlockList[blockIndex - 1];
      const previousBlockId = previousBlock.questionSettingIdList.join(",");
      this.setState({ questionBlockId: previousBlockId });

      // 切换到上一个题块的最后一个学生
      const lastStudentId = studentList.at(-1).studentId;
      this.setState({
        studentId: lastStudentId,
      });
      this.setHash({
        defaultStudentId: lastStudentId,
        defaultQuestionBlockId: previousBlockId,
      });

      this.getQuestionImage(previousBlockId, lastStudentId);
    }
  };

  nextNoeCheckedStudent = async () => {
    const { questionBlockId } = this.state;
    // 当前（刚批完）学生，作为"排除自身"的依据，避免回跳形成卡顿循环
    const currentStudentId = this.state.studentId;

    // 统一的跳转入口：人名/答案最终以 getQuestionImage 响应回写为权威
    const gotoStudent = (studentId, blockId) => {
      this.setState({ studentId });
      this.setHash({ defaultStudentId: studentId });
      this.getQuestionImage(blockId, studentId);
    };

    // Step 1. 本地学生列表里是否还有"非当前"的待批改学生
    const localNext = pickNextPendingStudent(
      this.state.studentList,
      currentStudentId,
    );
    if (localNext) {
      return gotoStudent(localNext.studentId, questionBlockId);
    }

    // Step 2. 从服务端刷新当前题块学生列表后再判断
    const refreshedStudents =
      (await this.getStudentTableData(questionBlockId)) || [];
    this.setState({ studentList: refreshedStudents });
    const refreshedNext = pickNextPendingStudent(
      refreshedStudents,
      currentStudentId,
    );
    if (refreshedNext) {
      return gotoStudent(refreshedNext.studentId, questionBlockId);
    }

    // Step 3. 当前题块已全部批改，确认是否所有题块完成
    const refreshedBlocks = (await this.getQuestionBlockList()) || [];
    this.setState({ questionBlockList: refreshedBlocks });
    if (refreshedBlocks.every((item) => item.allDone)) {
      this.setState({ checkNum: this.state.allNum });
      message.success(
        trans("gradingPapers.allQuestionsGraded", "所有试题批改完成"),
      );
      return;
    }

    // Step 4. 跳到下一个未完成题块的第一个待批改学生
    const nextBlock = refreshedBlocks.find((item) => !item.allDone);
    if (!nextBlock) {
      return;
    }
    const qusId = nextBlock.questionSettingIdList.join(",");
    const stuList = (await this.getStudentTableData(qusId)) || [];
    // 切换到新题块：该题块内从头选第一个待批改学生（不排除上一题块的当前学生）
    const nextStu = stuList.find((item) => item.pending);
    if (nextStu) {
      this.setState({ questionBlockId: qusId, studentList: stuList });
      gotoStudent(nextStu.studentId, qusId);
    }
  };

  nextStudent = () => {
    const { studentList, questionBlockList, questionBlockId } = this.state;

    const studentIndex = this.getStudentIndex();
    const isLastStudent = this.isLastStudent();

    // 当前题块索引
    const blockIndex = this.getBlockIndex();
    const isLastBlock = this.isLastBlock();

    // ✅ 已经是最后一个学生 + 最后一个题块
    if (isLastStudent && isLastBlock) {
      return this.nextNoeCheckedStudent();
    }

    // ✅ 当前题块还有下一个学生
    if (!isLastStudent) {
      const nextStudentId = studentList[studentIndex + 1].studentId;
      this.setState({ studentId: nextStudentId });
      this.setHash({ defaultStudentId: nextStudentId });
      this.getQuestionImage(questionBlockId, nextStudentId);
      return;
    }

    // ✅ 当前题块学生已走完，切换到下一个题块
    // const nextBlock = questionBlockList[blockIndex + 1];
    // ✅ 当前题块学生已走完，不切换到下一个题块
    const nextBlock = questionBlockList[blockIndex];

    const nextBlockId = nextBlock.questionSettingIdList.join(",");

    const firstStudentId = studentList[0].studentId;
    this.setState({
      studentId: firstStudentId,
      questionBlockId: nextBlockId,
    });
    this.setHash({
      defaultStudentId: firstStudentId,
      defaultQuestionBlockId: nextBlockId,
    });
    this.getQuestionImage(nextBlockId, firstStudentId);
  };

  getStudentIndex = () => {
    const { studentId, studentList } = this.state;
    return studentList.findIndex((s) => s.studentId === studentId);
  };

  isLastStudent = () => {
    const { studentList } = this.state;
    return this.getStudentIndex() === studentList.length - 1;
  };

  getBlockIndex = () => {
    const { questionBlockId, questionBlockList } = this.state;
    return questionBlockList.findIndex(
      (b) => b.questionSettingIdList.join(",") === questionBlockId,
    );
  };

  isLastBlock = () => {
    const { questionBlockList } = this.state;
    return this.getBlockIndex() === questionBlockList.length - 1;
  };

  render() {
    const { keyboardMode, questions, questionBlockList, studentId } =
      this.state;
    const percent = (this.state.checkNum / this.state.allNum) * 100;
    return (
      <div className={styles.gradingPapersBox}>
        <div className={styles.header}>
          <Icon
            type="left"
            className={[styles.closeIcon].join(" ")}
            onClick={this.back}
          />
          <span className={styles.row}>
            <span className={styles.colorfff}>
              {trans("analysis.questionIndex", "题号")}：
            </span>
            <Select
              onChange={this.changeQuestionBloack}
              value={this.state.questionBlockId}
              style={{ width: 150 }}
            >
              {questionBlockList?.length &&
                questionBlockList.map((item) => (
                  <Option
                    value={item.questionSettingIdList.join(",")}
                    key={item.questionInfo}
                  >
                    {item.questionInfo}
                  </Option>
                ))}
            </Select>
          </span>

          <span className={styles.row}>
            <span className={styles.colorfff}>
              {trans("global.studentLabel", "学生：")}
            </span>
            <Select
              onChange={this.changeMarkStudent}
              value={studentId}
              style={{ width: 150 }}
            >
              {this.state.studentList.map((item) => (
                <Option value={item.studentId} key={item.studentId}>
                  {item.studentName ||
                    `${trans("global.student", "学生")}${item.index}`}
                </Option>
              ))}
            </Select>
          </span>

          <span className={styles.row}>
            <span className={styles.colorfff}>
              {trans("global.schedule", "进度")}
            </span>
            <span className={styles.colorfff}>
              {this.state.checkNum}/{this.state.allNum}
            </span>
            <span className={styles.progress}>
              <Progress
                percent={percent}
                showInfo={false}
                strokeWidth={20}
                strokeColor="#10C553"
              />
            </span>
          </span>
        </div>
        <div className={styles.changeScoreBox}>
          <div className={styles.gradingLeft}>
            <div className={styles.canvasBox} id="canvasBox">
              <div className={styles.containerWrapper}>
                {questions.map((item, index) =>
                  this.renderQuestion(item, index),
                )}
              </div>
            </div>

            <div
              style={{
                width: "48px",
                height: "100%",
                background: "#fff",
              }}
            >
              <Toolbar
                tools={[
                  {
                    title: trans("gradingPapers.annotationTick", "打上对勾"),
                    icon: (
                      <i
                        className={styles.iconfont}
                        style={{ fontSize: "30px" }}
                      >
                        &#xeaf1;
                      </i>
                    ),
                    key: "tick",
                  },
                  {
                    title: trans("gradingPapers.annotationCross", "打上叉号"),
                    icon: (
                      <i
                        className={styles.iconfont}
                        style={{ fontSize: "30px" }}
                      >
                        &#xe893;
                      </i>
                    ),
                    key: "cross",
                  },
                  {
                    title: trans(
                      "gradingPapers.annotationHalfCorrect",
                      "打上半对",
                    ),
                    icon: (
                      <i
                        className={styles.iconfont}
                        style={{ fontSize: "30px" }}
                      >
                        &#xe894;
                      </i>
                    ),
                    key: "halfCorrect",
                  },
                  {
                    title: trans("gradingPapers.annotationRectangle", "矩形"),
                    icon: (
                      <i
                        className={styles.iconfont}
                        style={{ fontSize: "24px" }}
                      >
                        &#xe8fb;
                      </i>
                    ),
                    key: "rect",
                  },
                  {
                    title: trans("gradingPapers.annotationText", "文本"),
                    icon: (
                      <i
                        style={{ fontSize: "18px", marginRight: "5px" }}
                        className={styles.iconfont}
                      >
                        {" "}
                        &#xe8fa;
                      </i>
                    ),
                    key: "textbox",
                  },
                  {
                    title: trans("gradingPapers.annotationBrush", "画笔"),
                    icon: (
                      <i
                        className={styles.iconfont}
                        style={{ fontSize: "20px" }}
                      >
                        &#xe88e;
                      </i>
                    ),
                    key: "pen",
                  },
                ]}
                currentTool={this.state.currentTool}
                onSelect={(key) => this.selectTool(key)}
              />
            </div>
          </div>

          <div className={styles.gradingRight} style={{ position: "relative" }}>
            <div style={{ display: "flex", color: "#01113d" }}>
              <div style={{ fontWeight: "500", fontSize: "16px" }}>
                {trans("gradingPapers.scoringMode", "打分模式")}
              </div>
              <div style={{ fontSize: "14px", marginLeft: "auto" }}>
                <Radio.Group value={2}>
                  {/* <Radio value={1} disabled>面板打分</Radio> */}
                  <Radio value={2}>
                    {trans("gradingPapers.clickToScore", "点击打分")}
                  </Radio>
                </Radio.Group>
              </div>
            </div>

            <ScoreModeSwitcher
              value={keyboardMode}
              onChange={this.keyboardModeChange}
            />

            <div className={styles.countScoreBox}>
              <ScoreKeyboard
                value={this.state.keyboardValue}
                keyboardMode={keyboardMode}
                max={10}
                showHalf={false}
                onChange={(event, value) => this.selectScoreValue(event, value)}
                clearKeyboardValue={this.clearKeyboardValue}
              />
            </div>

            <div
              id="questionInputScoreBox"
              className={styles.questionInputScoreBox}
            >
              {questions.map((item) => this.renderInputNumber(item))}
            </div>

            <MyButton
              typeclass="confirmBtn"
              sizeclass="commonBtn"
              style={{ width: "100%" }}
              loading={this.state.isSubmitLoading}
              onClick={this.submitQuestionScore}
            >
              {trans("global.submit", "提交")}
            </MyButton>

            <div className={styles.nextBox}>
              <div className={styles.isAuto}>
                <Checkbox
                  onChange={this.changeAutoNext}
                  checked={this.state.isAutoNext}
                />
                <span className={styles.autoNext}>
                  {trans("global.autoNext", "评分后自动下一份")}
                </span>
                {this.state.keyboardMode == 1 ||
                this.state.keyboardMode == 2 ? (
                  <>
                    <Checkbox
                      style={{ marginLeft: "10px" }}
                      onChange={this.changeAutoSubmit}
                      checked={this.state.isAutoSubmit}
                    />
                    <span className={styles.autoNext}>
                      {trans(
                        "gradingPapers.autoSubmitAfterScoring",
                        "评分后自动提交",
                      )}
                    </span>
                  </>
                ) : null}
              </div>
              <div className={styles.nextBtn}>
                <span className={styles.feedback} onClick={this.prevStudent}>
                  <Icon type="double-left" style={{ marginRight: 12 }} />
                  {trans("global.feedback", "回评")}
                </span>
                <span className={styles.continue} onClick={this.nextStudent}>
                  {trans("global.continue", "继续")}
                  <Icon type="double-right" style={{ marginLeft: 12 }} />
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default CorrectionRemark;
