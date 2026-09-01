//批量录入
import React, { PureComponent } from "react";
import {
  Dropdown,
  Menu,
  message,
  Modal,
  Popover,
  Select,
  TreeSelect,
} from "antd";
import { connect } from "dva";
import $ from "jquery";

import MathEditor from "components/MathEditor";
import PreviewImg from "components/PreviewImg";

import {
  changeDifficulity,
  initFroala,
  serializeFn as serializeFunction,
} from "../../../utils/froala.js";
import { locale, trans } from "../../../utils/i18n";
import { getPageQuery } from "../../../utils/utils";

import "./importStyle.module.less";
import icon from "../../../icon.module.less";
import styles from "./index.module.less";

const { SHOW_PARENT } = TreeSelect;
const language = locale() == "en" ? false : true;
const { Option } = Select;

let canSave = true,
  canSaveBasket = true;
@connect((state) => ({
  importMsg: state.inputQuestion.importMsg, //录入试题
  sectionList: state.inputQuestion.sectionList, //学段
  // gradeList: state.inputQuestion.gradeList, //年级
  subjectList: state.inputQuestion.subjectList, //学科
  mathImage: state.inputQuestion.mathImage, //公式转为图片
  importBasketMsg: state.inputQuestion.importBasketMsg, //录入试题到试题篮
  treeData: state.inputQuestion.treeData,
  labelList: state.inputQuestion.labelList,
  allGradeList: state.inputQuestion.allGradeList, //年级
  chapterList: state.inputQuestion.chapterList,
}))
class BatchInput extends PureComponent {
  constructor(properties) {
    super(properties);
    this.state = {
      gradeValue: undefined,
      // sectionValue: undefined,
      subjectValue: undefined,
      difficultType: 1,
      successVisible: false,
      mathEditorVisible: false,
      importType: 0,
      imgUrl: "",
      modalVisible: false,
      selectTree: [],
      selectLabel: [],
      target: null,
      selectChapter: null,
      difficultValue: undefined,
    };
    this.editQuestion = null;
    this.child = null;
    this.lastEditRange = null;
    this.editor = null;
    this.previewHtml = null;
    this.isUnmounted = false;
    this.windowDblClickHandler = null;
    this.windowPasteHandler = null;
    this.previewClickHandler = null;
  }

  /**
   * 判断当前页面是否处于招生题库模式。
   * @returns {boolean} true 表示当前录题操作来源于招生题库
   */
  isRecruitQuestionMode = () => {
    const query = getPageQuery();
    return String(query.queryZhaoShengQuestion) === "true";
  };

  /**
   * 为录题保存相关请求补充招生题库参数。
   * @param {object} payload 原始请求参数
   * @returns {object} 合并招生参数后的请求参数
   */
  getRecruitQuestionPayload = (payload = {}) => {
    if (!this.isRecruitQuestionMode()) {
      return payload;
    }
    return {
      ...payload,
      saveZhaoShengQuestion: true,
    };
  };

  /**
   * 为录题页试题篮统计请求补充招生参数。
   * @param {object} payload 原始请求参数
   * @returns {object} 合并招生参数后的请求参数
   */
  getRecruitBasketPayload = (payload = {}) => {
    if (!this.isRecruitQuestionMode()) {
      return payload;
    }
    return {
      ...payload,
      queryZhaoShengQuestion: true,
    };
  };

  getEditor = () => {
    return this.editor;
  };

  getCurrentRange = () => {
    const selection = window.getSelection && window.getSelection();
    if (!selection || !selection.rangeCount) {
      return null;
    }
    try {
      return selection.getRangeAt(0);
    } catch {
      return null;
    }
  };

  setLastEditRange = () => {
    this.lastEditRange = this.getCurrentRange();
  };

  destroyEditor = ({ clearContent = false } = {}) => {
    const currentEditor = this.editor;
    this.editor = null;
    if (!currentEditor) {
      return;
    }
    if (clearContent) {
      try {
        currentEditor.html && currentEditor.html.set("");
      } catch (error) {
        console.warn("clear froala content failed", error);
      }
    }
    try {
      currentEditor.destroy && currentEditor.destroy();
    } catch (error) {
      console.warn("destroy froala failed", error);
    }
  };

  initEditor = (html = "") => {
    if (this.isUnmounted || !document.querySelector("#text-input")) {
      return;
    }
    this.destroyEditor();
    try {
      this.editor = this.createFroala(this, html);
    } catch (error) {
      this.editor = null;
      console.error("create froala failed", error);
    }
  };

  //创建编辑器
  createFroala = (that, html) => {
    return new FroalaEditor(document.querySelector("#text-input"), {
      placeholderText: trans(
        "batchInput.placeholder",
        "请将要录入的试题复制到这里，注意格式规范，点击上方“如何输入题目”可了解输入规范",
      ),
      charCounterCount: false, //字符计数器
      toolbarInline: false,
      spellcheck: false,
      pasteAllowLocalImages: false,
      pasteAllowedStyleProps: ["font-size", "color"],
      pastePlain: true,
      imageDefaultWidth: "auto", //图片默认宽度
      imageDefaultAlign: "left",
      wordAllowedStyleProps: [], //允许从word粘贴的标签的样式
      htmlAllowedTags: ["p", "img", "br", "sub", "sup", "div"], //允许出现的标签
      imageAllowedTypes: ["jpeg", "jpg", "png", "gif", "webp"],
      imageUploadParam: "file",
      imageUploadURL: `/api/tc/upload_file`,
      froalaContent: "<p>aaa</p>",
      events: {
        initialized: function () {
          that.editor = this;
          if (that.props.editQuestion && that.props.editQuestion) {
            this.html.set(html);
            let _this = this;
            if (!that.editQuestion) {
              that.editQuestion = that.props.editQuestion;
              setTimeout(() => {
                if (that.isUnmounted || that.editor !== _this) {
                  return;
                }
                initFroala(_this, that.props.editQuestion);
              }, 1500);
            }
          } else if (window.localStorage.getItem("yungu_question")) {
            this.html.set(html);
            let _this = this;
            setTimeout(() => {
              if (that.isUnmounted || that.editor !== _this) {
                return;
              }
              initFroala(_this);
            }, 1500);
          }
        },
        keyup: () => {
          this.setLastEditRange();
        },
        click: (e) => {
          let target = e.target || e.srcElement;
          if (target.nodeName.toLowerCase() == "img") {
            return;
          }
          this.setLastEditRange();
        },
        contentChanged: function () {
          let _this = this;
          setTimeout(() => {
            if (that.isUnmounted || that.editor !== _this) {
              return;
            }
            initFroala(_this);
          }, 1500);
        },
        "image.beforeUpload": function (images) {
          console.log(images, "beforeUpload");
        },
        "image.uploaded": function (response) {
          console.log(response, "uploaded");
        },
        "image.error": function (error, response) {
          if (error.code == 5) {
            message.error(
              trans("batchInput.imageUploadTooLarge", "图片过大，无法上传"),
            );
          } else if (error.code == 6) {
            message.error(
              trans(
                "batchInput.imageUploadTypeUnsupported",
                "不支持该图片类型，请上传jpeg，jpg，png，gif，webp格式的图片",
              ),
            );
          } else if (error.code == 8) {
            message.error(trans("batchInput.imageBroken", "图片已经损坏"));
          }
        },
        focus: function () {
          if (this.placeholder && this.placeholder.isVisible()) {
            $(".fr-placeholder").hide();
          }
        },
        blur: function () {
          var _this = this;
          if (_this.html.get() == "") {
            $(".fr-placeholder").show();
          }
        },
        destroy: function () {},
      },
    });
  };

  componentDidMount() {
    this.props.dispatch({
      type: "inputQuestion/getAllGradeList",
    });
    let html = "";
    if (this.props.editQuestion && this.props.editQuestion) {
      let a = "";
      this.props.editQuestion.optionList.map((item) => {
        a += `<span>${item.key}、${item.answers}</span><br/>`;
      });
      html = `
                <div className=${styles.standardStyle}>
                    <h4>${trans("batchInput.choiceQuestionHeading", "选择题：")}</h4>
                    <p id=${this.props.editQuestion.questionId}>
                        <span>1、${this.props.editQuestion.content}</span><br/>
                        ${a}
                        <input value=${this.props.editQuestion.questionId}/>
                        <span>${trans("batchInput.exampleAnswerLabel", "答案Answer：")}${
                          this.props.editQuestion.answer
                        }</span><br/>
                        <span>${trans("batchInput.exampleDifficultyLabel", "难度Difficulty：")}${
                          this.props.editQuestion.questionLevelName
                        }</span><br/>
                        <span>${trans("batchInput.exampleAnalysisLabel", "解析Analysis：")}${
                          this.props.editQuestion.analysis || ""
                        }</span>
                    </p>
                </div>
            `;
    } else if (window.localStorage.getItem("yungu_question")) {
      html = window.localStorage.getItem("yungu_question");
    }
    this.initEditor(html);
    this.getSection();
    if (this.props.editQuestion && this.props.editQuestion.gradeId) {
      this.getGrade(this.props.editQuestion.yearPeriodId);
      this.getSubject(this.props.editQuestion.gradeId);
      this.setState({
        // sectionValue: this.props.editQuestion.yearPeriodId,
        gradeValue: this.props.editQuestion.gradeId,
        subjectValue: this.props.editQuestion.subjectId,
      });
    }

    this.previewHtml = document.querySelector("#preview");
    this.windowDblClickHandler = (event_) => {
      let event = event_ || window.event;
      let target = event.target || event.srcElement;
      if (target.nodeName.toLowerCase() == "img") {
        let number_ = target.currentSrc.lastIndexOf("mathUrl");
        if (number_ > 0) {
          let mathUrl = target.currentSrc.substring(
            number_ + 8,
            target.currentSrc.length,
          );
          this.child && this.child.setContent(mathUrl);
          if (mathUrl) {
            this.setState({
              target: target,
              mathEditorVisible: true,
            });
          }
        }
      }
    };
    this.windowPasteHandler = (e) => {
      let text = (e.clipboardData || window.clipboardData).getData("text");
      const rangeText = this.lastEditRange ? this.lastEditRange.toString() : "";
      console.log(rangeText, text, "hhb");
    };
    this.previewClickHandler = (event_) => {
      let event = event_ || window.event;
      let target = event.target || event.srcElement;
      if (target.nodeName.toLowerCase() == "img") {
        let url = target.src;
        let imgUrl = url && url.split("&style=")[0];
        if (imgUrl) {
          this.setState({
            imgUrl,
            modalVisible: true,
          });
        }
      }
    };
    window.addEventListener("dblclick", this.windowDblClickHandler, true);
    window.addEventListener("paste", this.windowPasteHandler);
    this.previewHtml &&
      this.previewHtml.addEventListener(
        "click",
        this.previewClickHandler,
        true,
      );
  }

  componentWillUnmount() {
    this.isUnmounted = true;
    if (this.windowDblClickHandler) {
      window.removeEventListener("dblclick", this.windowDblClickHandler, true);
    }
    if (this.windowPasteHandler) {
      window.removeEventListener("paste", this.windowPasteHandler);
    }
    if (this.previewHtml && this.previewClickHandler) {
      this.previewHtml.removeEventListener(
        "click",
        this.previewClickHandler,
        true,
      );
    }
    this.destroyEditor();
  }
  onRef = (reference) => {
    this.child = reference;
  };
  getTree = () => {
    this.props.dispatch({
      type: "inputQuestion/getTree",
      payload: {
        subjectId: this.state.subjectValue,
        gradeId: this.state.gradeValue,
        // stage: this.state.sectionValue,
      },
    });
  };
  getChapter = () => {
    this.props.dispatch({
      type: "inputQuestion/getChapter",
      payload: {
        subjectId: this.state.subjectValue,
        gradeId: this.state.gradeValue,
        // stage: this.state.sectionValue,
      },
    });
  };
  getLabel = () => {
    this.props.dispatch({
      type: "inputQuestion/getLabel",
      payload: {
        subjectId: this.state.subjectValue,
        gradeId: this.state.gradeValue,
      },
    });
  };
  //获取学段
  getSection = () => {
    const { dispatch } = this.props;
    dispatch({
      type: "inputQuestion/getSectionList",
      payload: {},
    });
  };
  knowledgeChange = (value) => {
    console.log("onChange", value);
    this.setState({
      selectTree: value,
    });
  };
  chapterChange = (value) => {
    console.log("onChange", value);
    this.setState({
      selectChapter: value,
    });
  };
  labelChange = (value) => {
    this.setState({
      selectLabel: value,
    });
  };
  //获取年级
  getGrade = (stageId) => {
    const { dispatch } = this.props;
    dispatch({
      type: "inputQuestion/getGradeList",
      payload: {
        stageId: stageId,
      },
    });
  };

  //获取学科
  getSubject = (id) => {
    const { dispatch } = this.props;
    dispatch({
      type: "inputQuestion/getSubjectList",
      payload: {
        gradeId: id,
      },
    });
  };

  //选择学段
  changeSection = (value) => {
    this.setState(
      {
        sectionValue: value,
        gradeValue: undefined,
        subjectValue: undefined,
      },
      () => {
        this.getGrade(value);
      },
    );
  };

  //选择年级
  changeGrade = (value) => {
    this.setState(
      {
        gradeValue: value,
        subjectValue: undefined,
        selectChapter: undefined,
        selectTree: [],
      },
      () => {
        this.getSubject(value);
        this.props.dispatch({
          type: "inputQuestion/cleanTree",
        });
      },
    );
  };

  //选择学科
  changeSubject = (value) => {
    this.setState(
      {
        selectTree: [],
        selectLabel: [],
        subjectValue: value,
        selectChapter: undefined,
      },
      () => {
        this.getTree();
        this.getLabel();
        this.getChapter();
      },
    );
  };
  changeDifficulty = (value) => {
    console.log(value, "vv");
    this.setState(
      {
        difficultValue: value,
      },
      () => {
        const currentEditor = this.getEditor();
        if (!currentEditor) {
          return;
        }
        let content = currentEditor.html.get();
        let newCon = content.split("<br>");
        let list = [];
        newCon.map((item, index) => {
          if (item.includes("难度Difficulty")) {
            newCon[index] = `难度Difficulty: 
            ${
              {
                1: trans("global.easy", "简单"),
                2: trans("global.general", "普通"),
                3: trans("global.difficult", "困难"),
              }[value]
            }`;
          }
        });
        const a = newCon.join("<br>");

        currentEditor.html.set(a);
        currentEditor.html.insert("");
      },
    );
  };
  //切换题目的难易
  changeDifficult = (item) => {
    this.setState(
      {
        difficultType: item.key,
      },
      () => {
        $(function () {
          changeDifficulity(item.name);
        });
      },
    );
  };
  back = () => {
    this.props.cancelModal();
    window.localStorage.removeItem("yungu_question");
    this.clearFroala();
  };
  //导入试题
  importQuestion = () => {
    const { dispatch } = this.props;
    const { gradeValue, subjectValue } = this.state;
    var previewHtml = $("#preview").html();
    var previewText = $("#preview").text();
    if (!canSave) return false;
    if (!gradeValue || !subjectValue) {
      message.info(trans("batchInpt.message1", "年级、学科缺一不可哦~"));
      return false;
    }
    if ($.trim(previewHtml) === "" || $.trim(previewText) === "") {
      message.info(trans("batchInput.message2", "导入内容不能为空哦~"));
      return false;
    }
    if ($(".check_error").size() > 0) {
      message.error(trans("batchInput.message3", "存在错误，请检查试题~"));
      return false;
    }
    canSave = false;
    let payloadObject = {};
    //payloadObj.questionList = serializeFn();
    let dom = null;
    if (this.props.editQuestion) {
      dom = $(`#${this.props.editQuestion.questionId}`);
    }
    payloadObject.questionList = serializeFunction();
    if (payloadObject.questionList && payloadObject.questionList.length > 0) {
      payloadObject.questionList.map((item) => {
        item.knowledgeNames = item.knowledge;
        item.indicatorNames = item.indicator;
        item.chapterNames = item.chapter;
      });
    }
    if (this.state.difficultValue) {
      payloadObject.difficulty = this.state.difficultValue;
    }
    if (
      dom &&
      payloadObject.questionList &&
      payloadObject.questionList.length > 0
    ) {
      payloadObject.questionList.map((item) => {
        if (dom[0] && dom[0].innerHTML.includes(item.content)) {
          item.questionId = this.props.editQuestion.questionId;
        } else {
          payloadObject.questionList[0].questionId =
            this.props.editQuestion.questionId;
          console.log("error");
        }
      });
    }
    payloadObject.subjectId = subjectValue;
    payloadObject.knowledgeNames = this.state.knowledgeValues;
    payloadObject.gradeId = gradeValue;
    // payloadObj.yearPeriodId = sectionValue;
    let newTreeList = [];
    if (this.state.selectTree.length > 0) {
      this.state.selectTree.map((item) => {
        newTreeList.push(Number.parseInt(item.split("-")[2], 10));
      });
    }
    payloadObject.indicatorIds = this.state.selectLabel;
    payloadObject.knowledgeIds = newTreeList;
    if (this.state.selectChapter) {
      payloadObject.chapterIds = [
        Number.parseInt(this.state.selectChapter.split("-")[2], 10),
      ];
    }
    // payloadObj.knowledgeValues = this.state.selectTree;
    dispatch({
      type: "inputQuestion/importQuestion",
      payload: this.getRecruitQuestionPayload(payloadObject),
      onSuccess: () => {
        if (this.props.ifEdit) {
          this.props.cancelModal();
          this.props.updateItem(this.props.editQuestion.questionId);
          this.clearFroala();
        } else {
          this.setState({
            successVisible: true,
            importType: 0, //保存到试题篮类型
          });
        }
      },
    }).then(() => {
      window.localStorage.removeItem("yungu_question");
      canSave = true;
    });
  };

  //批量导入试题到试题篮
  importQuestionBasket = () => {
    const { dispatch } = this.props;
    const { gradeValue, subjectValue } = this.state;
    var previewHtml = $("#preview").html();
    var previewText = $("#preview").text();
    if (!canSaveBasket) return false;
    if (!gradeValue || !subjectValue) {
      message.info(trans("batchInpt.message1", "年级、学科缺一不可哦~"));
      return false;
    }
    if ($.trim(previewHtml) === "" || $.trim(previewText) === "") {
      message.info(trans("batchInput.message2", "导入内容不能为空哦~"));
      return false;
    }
    if ($(".check_error").size() > 0) {
      message.error(trans("batchInput.message3", "存在错误，请检查试题~"));
      return false;
    }
    // console.log($(this).find(".qt_difficult"), "222");
    // if (!!$(this).find(".qt_difficult")) {
    //   message.info("难度不能为空");
    //   return false;
    // }
    canSaveBasket = false;
    let payloadObject = {};
    let dom = null;
    if (this.props.editQuestion) {
      dom = $(`#${this.props.editQuestion.questionId}`);
    }
    payloadObject.questionList = serializeFunction();
    if (payloadObject.questionList && payloadObject.questionList.length > 0) {
      payloadObject.questionList.map((item) => {
        item.knowledgeNames = item.knowledge;
        item.indicatorNames = item.indicator;
        item.chapterNames = item.chapter;
      });
    }
    if (this.state.difficultValue) {
      payloadObject.difficulty = this.state.difficultValue;
    }
    if (
      dom &&
      payloadObject.questionList &&
      payloadObject.questionList.length > 0
    ) {
      payloadObject.questionList.map((item) => {
        item.knowledgeNames = item.knowledge;
        item.indicatorNames = item.indicator;
        item.chapterNames = item.chapter;
        if (dom[0] && dom[0].innerHTML.includes(item.content)) {
          item.questionId = this.props.editQuestion.questionId;
        } else {
          payloadObject.questionList[0].questionId =
            this.props.editQuestion.questionId;
        }
      });
    }
    payloadObject.subjectId = subjectValue;
    payloadObject.gradeId = gradeValue;
    // payloadObj.yearPeriodId = sectionValue;
    let newTreeList = [];
    if (this.state.selectTree.length > 0) {
      this.state.selectTree.map((item) => {
        newTreeList.push(Number.parseInt(item.split("-")[2], 10));
      });
    }
    payloadObject.indicatorIds = this.state.selectLabel;
    payloadObject.knowledgeIds = newTreeList;
    if (this.state.selectChapter) {
      payloadObject.chapterIds = [
        Number.parseInt(this.state.selectChapter.split("-")[2], 10),
      ];
    }
    // payloadObj.knowledgeValues = this.state.selectTree;
    dispatch({
      type: "inputQuestion/importQuestionBasket",
      payload: this.getRecruitQuestionPayload(payloadObject),
      onSuccess: () => {
        if (this.props.ifEdit) {
          this.props.cancelModal();
          this.props.updateItem(this.props.editQuestion.questionId);
          this.clearFroala();
        } else {
          this.props.dispatch({
            type: "home/getCount",
            payload: this.getRecruitBasketPayload(),
          });
          this.props.dispatch({
            type: "home/getBasketList",
            payload: this.getRecruitBasketPayload(),
          });
          this.setState({
            successVisible: true,
            importType: 1, //保存到试题篮
          });
        }
      },
    }).then(() => {
      window.localStorage.removeItem("yungu_question");
      canSaveBasket = true;
    });
  };

  forbiddenFun = () => {
    return false;
  };

  //展示公式编辑器
  showMathEditor = (visible) => {
    // console.log(this.lastEditRange.toString(), 'hhb')
    if (this.lastEditRange) {
      let text = this.lastEditRange.toString();
      if (text && text !== "") {
        this.child && this.child.setContent(encodeURI(text));
      }
    }
    if (!visible) {
      this.child && this.child.setContent("");
    }
    this.setState({
      mathEditorVisible: visible,
    });
  };

  //公式转为图片
  mathToImage = (content, callback) => {
    const { dispatch } = this.props;
    dispatch({
      type: "inputQuestion/mathToImage",
      payload: {
        latex: content,
      },
      onSuccess: () => {
        const { mathImage } = this.props;
        const currentEditor = this.getEditor();
        if (!currentEditor) {
          return;
        }
        console.log(content, "cc");
        const newContent = encodeURI(content);
        callback && callback();
        const { target } = this.state;
        console.log(target, "tt1");
        if (target) {
          target.src = `${mathImage}?mathUrl=${newContent}`;
          target.dataset.value = newContent;
          this.setState({
            target: null,
          });
        } else {
          // let htmlStr = `<img src=${mathImage} data-value=${newContent} class="f-marker" />`;
          let htmlString = `<img src=${mathImage}?mathUrl=${newContent} class="f-marker" style="height: 30px" />`;
          // let htmlStr = `<img src=${mathImage} class="f-marker" />`;
          const selection = window.getSelection && window.getSelection();
          if (!selection) {
            return;
          }
          if (this.lastEditRange) {
            selection.removeAllRanges();
            selection.addRange(this.lastEditRange);
          }
          this.lastEditRange = selection.rangeCount
            ? selection.getRangeAt(0)
            : null;
          currentEditor.html.insert(htmlString);
        }
      },
    });
  };

  //插入范例
  insertExample = (ind) => {
    let html = "";
    if (ind == 1) {
      html = language
        ? `
        <div className=${styles.standardStyle}>
            <p>1.${trans("batchInput.exampleQuestionContent", "输入题目内容")}</p>
            <span>A.${trans("batchInput.exampleOptionDescription", "选项描述")}</span><br/>
            <span>B.${trans("batchInput.exampleOptionDescription", "选项描述")}</span><br/>
            <span>C.${trans("batchInput.exampleOptionDescription", "选项描述")}</span><br/>
            <span>D.${trans("batchInput.exampleOptionDescription", "选项描述")}</span><br/>
            <span>${trans("batchInput.exampleAnswerLabel", "答案Answer：")}C</span><br/>
            <span>${trans("batchInput.exampleDifficultyLabel", "难度Difficulty：")}${trans("batchInput.exampleDifficultyRequired", "简单、普通、困难，三选一，必填")}</span><br/>
            <span>${trans("batchInput.exampleChapterLabel", "章节Chapter：")}${trans("batchInput.exampleOptional", "非必填")}</span><br/>
            <span>${trans("batchInput.exampleKnowledgeLabel", "知识点Knowledge：")}${trans("batchInput.exampleOptionalRecommendedForLearningAnalysis", "非必填，建议填写，便于学情分析")}</span><br/>
            <span>${trans("batchInput.exampleIndicatorLabel", "学科素养Indicator：")}${trans("batchInput.exampleOptionalRecommendedForLearningAnalysis", "非必填，建议填写，便于学情分析")}</span><br/>
            <span>${trans("batchInput.exampleAnalysisLabel", "解析Analysis：")}${trans("batchInput.exampleAnalysisOptionalRecommended", "非必填，建议填写，便于学生答题后直接自查学习")}</span><br/>
        </div>
    `
        : `
        <div className=${styles.standardStyle}>
            <p>1.Please enter the question</p>
            <span>A.Description of Option</span><br/>
            <span>B.Description of Option</span><br/>
            <span>C.Description of Option</span><br/>
            <span>D.Description of Option</span><br/>
            <span>${trans("batchInput.exampleAnswerLabel", "答案Answer：")}C</span><br/>
            <span>${trans("batchInput.exampleDifficultyLabel", "难度Difficulty：")}${trans("batchInput.exampleDifficultyRequired", "简单、普通、困难，三选一，必填")}</span><br/>
            <span>${trans("batchInput.exampleChapterLabel", "章节Chapter：")}${trans("batchInput.exampleOptional", "非必填")}</span><br/>
            <span>${trans("batchInput.exampleKnowledgeLabel", "知识点Knowledge：")}${trans("batchInput.exampleOptionalRecommendedForLearningAnalysis", "非必填，建议填写，便于学情分析")}</span><br/>
            <span>${trans("batchInput.exampleIndicatorLabel", "学科素养Indicator：")}${trans("batchInput.exampleOptionalRecommendedForLearningAnalysis", "非必填，建议填写，便于学情分析")}</span><br/>
            <span>${trans("batchInput.exampleAnalysisLabel", "解析Analysis：")}${trans("batchInput.exampleAnalysisOptionalRecommended", "非必填，建议填写，便于学生答题后直接自查学习")}</span><br/>
        </div>
    `;
    } else if (ind == 2) {
      html = language
        ? `
        <div className=${styles.standardStyle}>
            <p>2.${trans("batchInput.exampleQuestionContent", "输入题目内容")}</p>
            <span>A.${trans("batchInput.exampleOptionDescription", "选项描述")}</span><br/>
            <span>B.${trans("batchInput.exampleOptionDescription", "选项描述")}</span><br/>
            <span>C.${trans("batchInput.exampleOptionDescription", "选项描述")}</span><br/>
            <span>D.${trans("batchInput.exampleOptionDescription", "选项描述")}</span><br/>
            <span>${trans("batchInput.exampleAnswerLabel", "答案Answer：")}AC</span><br/>
            <span>${trans("batchInput.exampleDifficultyLabel", "难度Difficulty：")}${trans("batchInput.exampleDifficultyRequired", "简单、普通、困难，三选一，必填")}</span><br/>
            <span>${trans("batchInput.exampleChapterLabel", "章节Chapter：")}${trans("batchInput.exampleOptional", "非必填")}</span><br/>
            <span>${trans("batchInput.exampleKnowledgeLabel", "知识点Knowledge：")}${trans("batchInput.exampleOptionalRecommendedForLearningAnalysis", "非必填，建议填写，便于学情分析")}</span><br/>
            <span>${trans("batchInput.exampleIndicatorLabel", "学科素养Indicator：")}${trans("batchInput.exampleOptionalRecommendedForLearningAnalysis", "非必填，建议填写，便于学情分析")}</span><br/>
            <span>${trans("batchInput.exampleAnalysisLabel", "解析Analysis：")}${trans("batchInput.exampleAnalysisOptionalRecommended", "非必填，建议填写，便于学生答题后直接自查学习")}</span><br/>
        </div>
    `
        : `
        <div className=${styles.standardStyle}>
            <p>2.Please enter the question</p>
            <span>A.Description of Option</span><br/>
            <span>B.Description of Option</span><br/>
            <span>C.Description of Option</span><br/>
            <span>D.Description of Option</span><br/>
            <span>${trans("batchInput.exampleAnswerLabel", "答案Answer：")}AC</span><br/>
            <span>${trans("batchInput.exampleDifficultyLabel", "难度Difficulty：")}${trans("batchInput.exampleDifficultyRequired", "简单、普通、困难，三选一，必填")}</span><br/>
            <span>${trans("batchInput.exampleChapterLabel", "章节Chapter：")}${trans("batchInput.exampleOptional", "非必填")}</span><br/>
            <span>${trans("batchInput.exampleKnowledgeLabel", "知识点Knowledge：")}${trans("batchInput.exampleOptionalRecommendedForLearningAnalysis", "非必填，建议填写，便于学情分析")}</span><br/>
            <span>${trans("batchInput.exampleIndicatorLabel", "学科素养Indicator：")}${trans("batchInput.exampleOptionalRecommendedForLearningAnalysis", "非必填，建议填写，便于学情分析")}</span><br/>
            <span>${trans("batchInput.exampleAnalysisLabel", "解析Analysis：")}${trans("batchInput.exampleAnalysisOptionalRecommended", "非必填，建议填写，便于学生答题后直接自查学习")}</span><br/>
        </div>
    `;
    } else if (ind == 3) {
      html = language
        ? `
        <div className=${styles.standardStyle}>
            <p>3、${trans("batchInput.exampleYunguGoalQuestion", "云谷的培养目标：培养________、________、________、________、________的地球公民")}</p>
            <span>${trans("batchInput.exampleAnswerLabel", "答案Answer：")}${trans("batchInput.exampleYunguGoalAnswer", "仁爱精神|独立意志|社会担当|终身学习|幸福感&&Happiness&&幸福力")}</span><br/>
            <span>${trans("batchInput.exampleDifficultyLabel", "难度Difficulty：")}${trans("global.easy", "简单")}</span><br/>
            <span>${trans("batchInput.exampleChapterLabel", "章节Chapter：")}${trans("batchInput.exampleOptional", "非必填")}</span><br/>
            <span>${trans("batchInput.exampleKnowledgeLabel", "知识点Knowledge：")}${trans("batchInput.exampleOptionalRecommendedForLearningAnalysis", "非必填，建议填写，便于学情分析")}</span><br/>
            <span>${trans("batchInput.exampleIndicatorLabel", "学科素养Indicator：")}${trans("batchInput.exampleOptionalRecommendedForLearningAnalysis", "非必填，建议填写，便于学情分析")}</span><br/>
            <span>${trans("batchInput.exampleAnalysisLabel", "解析Analysis：")}${trans("batchInput.exampleNone", "无")}</span><br/>
        </div>
    `
        : `
        <div className=${styles.standardStyle}>
            <p>3、Yungu School is committed to growing（）,（）,（）who are（）global citizens with a（）</p>
            <span>${trans("batchInput.exampleAnswerLabel", "答案Answer：")}happy|healthy|independent life long learners|thoughtful|strong sense of social responsibility</span><br/>
            <span>${trans("batchInput.exampleDifficultyLabel", "难度Difficulty：")}${trans("global.easy", "简单")}</span><br/>
            <span>${trans("batchInput.exampleChapterLabel", "章节Chapter：")}${trans("batchInput.exampleOptional", "非必填")}</span><br/>
            <span>${trans("batchInput.exampleKnowledgeLabel", "知识点Knowledge：")}${trans("batchInput.exampleOptionalRecommendedForLearningAnalysis", "非必填，建议填写，便于学情分析")}</span><br/>
            <span>${trans("batchInput.exampleIndicatorLabel", "学科素养Indicator：")}${trans("batchInput.exampleOptionalRecommendedForLearningAnalysis", "非必填，建议填写，便于学情分析")}</span><br/>
            <span>${trans("batchInput.exampleAnalysisLabel", "解析Analysis：")}${trans("batchInput.exampleNone", "无")}</span><br/>
        </div>
    `;
    } else if (ind == 4) {
      html = language
        ? `
        <div className=${styles.standardStyle}>
            <p>4、${trans("batchInput.exampleYunguJudgeQuestion", "云谷是一所国际学校，对吗？")}</p>
            <span>${trans("batchInput.exampleAnswerLabel", "答案Answer：")}${trans("batchInput.exampleFalseAnswer", "错误")}</span><br/>
            <span>${trans("batchInput.exampleDifficultyLabel", "难度Difficulty：")}${trans("global.easy", "简单")}</span><br/>
            <span>${trans("batchInput.exampleChapterLabel", "章节Chapter：")}${trans("batchInput.exampleOptional", "非必填")}</span><br/>
            <span>${trans("batchInput.exampleKnowledgeLabel", "知识点Knowledge：")}${trans("batchInput.exampleOptionalRecommendedForLearningAnalysis", "非必填，建议填写，便于学情分析")}</span><br/>
            <span>${trans("batchInput.exampleIndicatorLabel", "学科素养Indicator：")}${trans("batchInput.exampleOptionalRecommendedForLearningAnalysis", "非必填，建议填写，便于学情分析")}</span><br/>
            <span>${trans("batchInput.exampleAnalysisLabel", "解析Analysis：")}${trans("batchInput.exampleNone", "无")}</span><br/>
        </div>
    `
        : `
        <div className=${styles.standardStyle}>
            <p>4、${trans("batchInput.exampleYunguJudgeQuestion", "云谷是一所国际学校，对吗？")}</p>
            <span>${trans("batchInput.exampleAnswerLabel", "答案Answer：")}${trans("batchInput.exampleFalseAnswer", "错误")}</span><br/>
            <span>${trans("batchInput.exampleDifficultyLabel", "难度Difficulty：")}${trans("global.easy", "简单")}</span><br/>
            <span>${trans("batchInput.exampleChapterLabel", "章节Chapter：")}${trans("batchInput.exampleOptional", "非必填")}</span><br/>
            <span>${trans("batchInput.exampleKnowledgeLabel", "知识点Knowledge：")}${trans("batchInput.exampleOptionalRecommendedForLearningAnalysis", "非必填，建议填写，便于学情分析")}</span><br/>
            <span>${trans("batchInput.exampleIndicatorLabel", "学科素养Indicator：")}${trans("batchInput.exampleOptionalRecommendedForLearningAnalysis", "非必填，建议填写，便于学情分析")}</span><br/>
            <span>${trans("batchInput.exampleAnalysisLabel", "解析Analysis：")}${trans("batchInput.exampleNone", "无")}</span><br/>
        </div>
    `;
    } else {
      html = language
        ? `
        <div className=${styles.standardStyle}>
            <p>5、${trans("batchInput.exampleYunguPerspectiveQuestion", "说说你对云谷教育观的理解？")}</p>
            <span>${trans("batchInput.exampleAnswerLabel", "答案Answer：")}${trans("batchInput.exampleYunguPerspectiveAnswer", "我们相信，学习不仅发生在书本中，而且还存在于“动手做”的体验中、日常生活的选择中、充分理解并熟练运用知识解决真实世界问题的经历中。我们相信，育人的本质在于唤醒、鼓舞和成就。我们的老师是帮助学生创建“链接”的人，创造人与人之间的链接、人与世界的链接，唤醒学生心中的热爱，鼓励学生探索反思，成就每一个独特生命长成最好的自己。")}</span><br/>
            <span>${trans("batchInput.exampleDifficultyLabel", "难度Difficulty：")}${trans("global.easy", "简单")}</span><br/>
            <span>${trans("batchInput.exampleChapterLabel", "章节Chapter：")}${trans("batchInput.exampleOptional", "非必填")}</span><br/>
            <span>${trans("batchInput.exampleKnowledgeLabel", "知识点Knowledge：")}${trans("batchInput.exampleOptionalRecommendedForLearningAnalysis", "非必填，建议填写，便于学情分析")}</span><br/>
            <span>${trans("batchInput.exampleIndicatorLabel", "学科素养Indicator：")}${trans("batchInput.exampleOptionalRecommendedForLearningAnalysis", "非必填，建议填写，便于学情分析")}</span><br/>
            <span>${trans("batchInput.exampleAnalysisLabel", "解析Analysis：")}${trans("batchInput.exampleNone", "无")}</span><br/>
        </div>
    `
        : `
        <div className=${styles.standardStyle}>
            <p>5、${trans("batchInput.exampleYunguPerspectiveQuestion", "说说你对云谷教育观的理解？")}</p>
            <span>${trans("batchInput.exampleAnswerLabel", "答案Answer：")}${trans("batchInput.exampleYunguPerspectiveAnswer", "我们相信，学习不仅发生在书本中，而且还存在于“动手做”的体验中、日常生活的选择中、充分理解并熟练运用知识解决真实世界问题的经历中。我们相信，育人的本质在于唤醒、鼓舞和成就。我们的老师是帮助学生创建“链接”的人，创造人与人之间的链接、人与世界的链接，唤醒学生心中的热爱，鼓励学生探索反思，成就每一个独特生命长成最好的自己。")}</span><br/>
            <span>${trans("batchInput.exampleDifficultyLabel", "难度Difficulty：")}${trans("global.easy", "简单")}</span><br/>
            <span>${trans("batchInput.exampleChapterLabel", "章节Chapter：")}${trans("batchInput.exampleOptional", "非必填")}</span><br/>
            <span>${trans("batchInput.exampleKnowledgeLabel", "知识点Knowledge：")}${trans("batchInput.exampleOptionalRecommendedForLearningAnalysis", "非必填，建议填写，便于学情分析")}</span><br/>
            <span>${trans("batchInput.exampleIndicatorLabel", "学科素养Indicator：")}${trans("batchInput.exampleOptionalRecommendedForLearningAnalysis", "非必填，建议填写，便于学情分析")}</span><br/>
            <span>${trans("batchInput.exampleAnalysisLabel", "解析Analysis：")}${trans("batchInput.exampleNone", "无")}</span><br/>
        </div>
    `;
    }
    const currentEditor = this.getEditor();
    if (!currentEditor) {
      return;
    }
    currentEditor.html.insert(html);
    console.log(currentEditor.html.get());
    html = "";
  };

  //输入规范
  renderStandard = () => {
    return (
      <div className={styles.standardStyle}>
        <h4>{trans("batchInput.inputRulesTitle", "输入规范")}</h4>
        <p>
          {trans(
            "batchInput.inputRuleNumbering",
            "1、所有题型标号支持1.或1、或（1）三种格式",
          )}
        </p>
        <p>
          {trans(
            "batchInput.inputRuleAnswerRequiredPrefix",
            "2、所有题型必须含有“",
          )}
          <em className={styles.redFont}>
            {trans("batchInput.answerFieldName", "答案Answer")}
          </em>
          {trans(
            "batchInput.inputRuleAnswerRequiredSuffix",
            "：”字段，且不能为空。输入答案、answer、Answer、ANSWER、或中文和英文任意组合均可，自动识别成",
          )}
          <em className={styles.redFont}>
            {trans("batchInput.answerFieldName", "答案Answer")}
          </em>
          {trans("batchInput.inputRuleSentenceEnd", "。")}
        </p>
        <p>
          {trans(
            "batchInput.inputRuleDifficultyRequiredPrefix",
            "3、所有题型必须含有“",
          )}
          <em className={styles.redFont}>
            {trans("batchInput.difficultyFieldName", "难度Difficulty")}
          </em>
          {trans(
            "batchInput.inputRuleDifficultyRequiredMiddle",
            "：”字段，且不能为空，难度分为三档：",
          )}
          <em className={styles.blueFont}>{trans("global.easy", "简单")}</em>
          {trans("batchInput.inputRuleListSeparator", "、")}
          <em className={styles.blueFont}>{trans("global.general", "普通")}</em>
          {trans("batchInput.inputRuleListSeparator", "、")}
          <em className={styles.blueFont}>
            {trans("global.difficult", "困难")}
          </em>
          {trans(
            "batchInput.inputRuleDifficultyRequiredSuffix",
            "；输入难度、difficulty、Difficulty、DIFFICULTY、或中文和英文任意组合均可，自动识别成",
          )}
          <em className={styles.redFont}>
            {trans("batchInput.difficultyFieldName", "难度Difficulty")}
          </em>
          {trans("batchInput.inputRuleSentenceEnd", "。")}
        </p>
        <p>
          {trans("batchInput.inputRuleAnalysisOptionalPrefix", "4、所有题型“")}
          <em className={styles.redFont}>
            {trans("batchInput.analysisFieldName", "解析Analysis")}
          </em>
          {trans(
            "batchInput.inputRuleAnalysisOptionalSuffix",
            "：”字段：字段非必填，没有可不填。输入解析、analysis、Analysis、ANALYSIS、或中文和英文任意组合均可，自动识别成",
          )}
          <em className={styles.redFont}>
            {trans("batchInput.analysisFieldName", "解析Analysis")}
          </em>
          {trans("batchInput.inputRuleSentenceEnd", "。")}
        </p>
        <p>
          {trans(
            "batchInput.inputRuleImagePlacement",
            "5、所有题型题目中包含图片，则将图片插入到指定位置即可。",
          )}
        </p>
        <p>
          {trans("batchInput.inputRuleChoicePrefix", "6、")}
          <em className={styles.blueFont}>
            {trans("batchInput.choiceQuestionType", "选择题")}
          </em>
          <em className={styles.redFont}>
            {trans("batchInput.inputRuleChoiceMinimum", "最少支持2个选项A，B")}
          </em>
          {trans(
            "batchInput.inputRuleChoiceMaximum",
            "，最多支持8个选项A，B，C，D，E，F，G，H且按照顺序使用。",
          )}
        </p>
        <p>
          {trans("batchInput.inputRuleChoiceSeparatorPrefix", "7、")}
          <em className={styles.blueFont}>
            {trans("batchInput.choiceQuestionType", "选择题")}
          </em>
          {trans(
            "batchInput.inputRuleChoiceSeparatorSuffix",
            "A-H这些选项号与内容之间要用、或.分开。",
          )}
        </p>
        <p>
          {trans("batchInput.inputRuleChoiceAnswerPrefix", "8、")}
          <em className={styles.blueFont}>
            {trans("batchInput.choiceQuestionType", "选择题")}
          </em>
          {trans(
            "batchInput.inputRuleChoiceAnswerSuffix",
            "答案中请勿加分隔符或者空格，多选题答案直接用答案号连写，如ABC。",
          )}
        </p>
        <p>
          {trans("batchInput.inputRuleJudgePrefix", "9、")}
          <span style={{ color: "red" }}>
            {trans("global.judge", "判断题")}
          </span>
          {trans(
            "batchInput.inputRuleJudgeSuffix",
            "答案支持 “错误”，“正确”或者 “错”，“对”。",
          )}
        </p>
        <p>
          {trans("batchInput.inputRuleBlankPrefix", "10、")}
          <span style={{ color: "purple" }}>
            {trans("global.pack", "填空题")}
          </span>
          {trans(
            "batchInput.inputRuleBlankParentheses",
            "仅支持题目中出现括号。",
          )}
        </p>
        <p>
          {trans("batchInput.inputRuleBlankAnswersPrefix", "11、")}
          <span style={{ color: "purple" }}>
            {trans("global.pack", "填空题")}
          </span>
          {trans(
            "batchInput.inputRuleBlankAnswersSuffix",
            "目里的多个填空答案要用 | 分割，单个答案不用添加。",
          )}
        </p>
        <p>
          {trans("batchInput.inputRuleBlankSynonymsPrefix", "12、")}
          <span style={{ color: "purple" }}>
            {trans("global.pack", "填空题")}
          </span>
          {trans(
            "batchInput.inputRuleBlankSynonymsSuffix",
            "的填空答案支持输入同义词，用&&连接多个同义词答案。",
          )}
        </p>
        <p>
          {trans(
            "batchInput.inputRuleSupportedTypes",
            "13、目前可支持的题型：单选题、多选题、填空题、判断题。",
          )}
        </p>
      </div>
    );
  };

  //复制范例
  onCopy = (text, result) => {
    if (result) {
      message.success(trans("global.copySuccess", "复制成功"));
    }
  };

  //预览图片弹窗
  changeModalVisible = (visible) => {
    this.setState({
      modalVisible: visible,
    });
  };
  //输入范例
  renderStandardDemo = () => {
    return (
      <div className={styles.standardStyle}>
        <input
          className={styles.standardTitle}
          onCopy={this.forbiddenFun}
          onCut={this.forbiddenFun}
          value={trans("batchInput.demoChoiceQuestionTitle", "选择题")}
          readOnly
        />
        <span className={styles.copyAllTxt}>
          （
          {trans(
            "batchInput.needSelectAll",
            "选中文案后，通过Command/Ctrl+C复制",
          )}
          ）
        </span>
        <p>
          <span>
            {trans(
              "batchInput.demoChemistryQuestion",
              "1、空气中含量最多，化学性质又不活泼的气体是（）",
            )}
          </span>
          <br />
          <span>{trans("batchInput.demoOptionOxygen", "A、氧气")}</span>
          <br />
          <span>{trans("batchInput.demoOptionNitrogen", "B、氮气")}</span>
          <br />
          <span>{trans("batchInput.demoOptionWaterVapor", "C、水蒸气")}</span>
          <br />
          <span>
            {trans("batchInput.demoOptionCarbonDioxide", "D、二氧化碳")}
          </span>
          <br />
          <span>{trans("batchInput.demoAnswer", "答案Answer：D ")}</span>
          <br />
          <span>
            {trans("batchInput.demoDifficultyEasy", "难度Difficulty：简单")}
          </span>
          <br />
          <span>
            {trans(
              "batchInput.demoAnalysisPlaceholder",
              "解析Analysis：这里填写解析过程，便于学生查看",
            )}
            <input
              className={styles.forbiddenText}
              onCopy={this.forbiddenFun}
              onCut={this.forbiddenFun}
              value={trans(
                "batchInput.demoAnalysisOptionalNote",
                "（若无解析本行可不填）",
              )}
              readOnly
            />
          </span>
        </p>
      </div>
    );
  };

  //继续录入试题
  hideSuccessModal = () => {
    this.setState(
      {
        successVisible: false,
      },
      () => {
        this.clearFroala();
      },
    );
  };

  //清空froala
  clearFroala = () => {
    this.lastEditRange = null;
    $(".fr-placeholder").show();
    $("#preview").empty();
    this.initEditor("");
  };
  formatTree = (li) => {
    let newArray = li;
    li.map((item) => {
      item.title = item.text;
      item.value = `${item.text}-${item.pinyin || ""}-${item.id}`;
      item.key = JSON.stringify(item.id);
      if (item.children && item.children.length > 0) {
        item.children.map((index) => {
          index.title = index.text;
          index.value = `${index.text}-${index.pinyin || ""}-${index.id}`;
          index.key = JSON.stringify(index.id);
          if (index.children && index.children.length > 0) {
            index.children = this.formatTree(index.children);
          }
        });
      }
    });
    return newArray;
  };
  render() {
    const {
      sectionList,
      gradeList,
      subjectList,
      importMsg,
      importBasketMsg,
      treeData,
      labelList,
      ifAdmin,
      allGradeList,
    } = this.props;
    const {
      gradeValue,
      difficultType,
      // sectionValue,
      subjectValue,
      importType,
      difficultValue,
    } = this.state;

    let newTree = [];
    const lProperties = {
      treeData: labelList,
      value: this.state.selectLabel,
      onChange: this.labelChange,
      treeCheckable: true,
      showCheckedStrategy: SHOW_PARENT,
      placeholder: trans("singleInput.label", "素养"),
      showSearch: true,
      style: {
        maxWidth: "160px",
        minWidth: "100px",
        height: "36px",
      },
    };
    treeData &&
      treeData.length &&
      treeData.map((item) => {
        newTree.push({
          title: item.text,
          value: `${item.text}-${item.pinyin || ""}-${item.id}`,
          key: JSON.stringify(item.id),
          children: item.children,
        });
      });
    treeData && treeData.length && this.formatTree(treeData);

    console.log(newTree, "jj");
    const tProperties = {
      treeData: newTree,
      value: this.state.selectTree,
      onChange: this.knowledgeChange,
      treeCheckable: true,
      showCheckedStrategy: SHOW_PARENT,
      placeholder: trans("singleInput.knowledgeTree", "知识点"),
      showSearch: true,
      style: {
        maxWidth: "160px",
        minWidth: "100px",
        height: "36px",
      },
    };
    const cProperties = {
      treeData: this.props.chapterList,
      value: this.state.selectChapter,
      onChange: this.chapterChange,
      // treeCheckable: true,
      showCheckedStrategy: SHOW_PARENT,
      placeholder: trans("global.chapter", "章节"),
      showSearch: true,
      style: {
        maxWidth: "160px",
        minWidth: "100px",
        height: "36px",
        marginLeft: "10px",
      },
    };
    return (
      <div
        className={styles.batchContent}
        style={{ marginTop: this.props.ifEdit ? "60px" : "12px" }}
      >
        {this.props.ifEdit ? (
          <div className={styles.header}>
            <i className={icon.iconfont} onClick={this.back}>
              &#xe6a9;
            </i>
            <div className={styles.title}>
              {trans("global.editTitle", "编辑题目内容")}
            </div>
          </div>
        ) : null}

        <div className={styles.batchInputArea}>
          <div className={`${styles.commonBox} ${styles.batchInputBox}`}>
            <div className={styles.batchTitle}>
              <span>{trans("batchInput.fillText", "输入内容")}</span>
              <Dropdown
                overlayClassName="insertDemonstration"
                // visible={true}
                overlayStyle={{ width: "100px" }}
                placement="bottomRight"
                overlay={() => {
                  return (
                    <Menu>
                      <Menu.Item key="1" onClick={() => this.insertExample(1)}>
                        {trans("global.radio", "单选题")}
                      </Menu.Item>
                      <Menu.Item key="2" onClick={() => this.insertExample(2)}>
                        {trans("global.check", "多选题")}
                      </Menu.Item>
                      <Menu.Item key="3" onClick={() => this.insertExample(3)}>
                        {trans("global.pack", "填空题")}
                      </Menu.Item>
                      <Menu.Item key="4" onClick={() => this.insertExample(4)}>
                        {trans("global.judge", "判断题")}
                      </Menu.Item>
                      <Menu.Item key="5" onClick={() => this.insertExample(5)}>
                        {trans("global.ask", "问答题")}
                      </Menu.Item>
                    </Menu>
                  );
                }}
              >
                <span
                  className={[
                    styles.standardDemo,
                    language ? "" : styles.enDemo,
                  ].join(" ")}
                >
                  {trans("batchInput.insertExample", "插入范例")}
                  <i className={`${icon.iconfont} ${styles.popIcon}`}>
                    &#xe613;
                  </i>
                </span>
              </Dropdown>

              {/* <Popover content={this.renderStandardDemo()} title={null} trigger="click" placement="bottomRight"><span className={styles.standardDemo}>{trans("batchInput.insertExample", "插入范例")}<i className={`${icon.iconfont} ${styles.popIcon}`}>&#xe762;</i></span></Popover> */}
              <Popover
                content={this.renderStandard()}
                title={null}
                trigger="click"
                placement="bottomLeft"
              >
                <span className={styles.inputStandard}>
                  {trans("batchInput.howToFill", "如何输入题目")}
                  <i className={`${icon.iconfont} ${styles.popIcon}`}>
                    &#xe727;
                  </i>
                </span>
              </Popover>
              <span
                className={styles.inputStandard}
                onClick={() => this.showMathEditor(true)}
              >
                {trans("batchInput.latexEdit", "公式编辑")}
                <i className={`${icon.iconfont} ${styles.popIcon}`}>&#xe8a9;</i>
              </span>
            </div>
            <div id="text-input" className={styles.textInput}></div>
          </div>
          <div className={`${styles.commonBox} ${styles.batchPreviewBox}`}>
            <div className={styles.batchTitle}>
              <span>{trans("batchInput.reviewText", "检查预览")}</span>
            </div>
            <div id="preview" style={{ whiteSpace: "pre-wrap" }}></div>
          </div>
        </div>

        <Modal
          footer={null}
          title={null}
          visible={this.state.successVisible}
          onCancel={this.hideSuccessModal}
          closable={false}
          maskClosable={false}
        >
          <div className={styles.importResult}>
            <h4>{trans("batchInput.result", "录入结果")}</h4>
            <p className={styles.resultTips}>
              {trans("batchInput.importSuccess", "成功录入")}
              <em className={styles.success}>
                {importType === 0
                  ? (importMsg ? importMsg.length : 0) || 0
                  : importBasketMsg || 0}
              </em>
              {trans("import.stemNum", "道试题")}，
              {trans("import.fail", "失败")}
              <em className={styles.error}>0</em>
              {trans("import.stemNum", "道试题")}
            </p>
            <div className={styles.operBtn1} style={{ textAlign: "center" }}>
              <span className={styles.blueBtn} onClick={this.hideSuccessModal}>
                {trans("batchInput.continueImport", "继续录入")}
              </span>
              {/* <span className={styles.blueBtn}>去创建考试</span> */}
            </div>
          </div>
        </Modal>
        <MathEditor
          visible={this.state.mathEditorVisible}
          target={this.state.target}
          onRef={this.onRef}
          showMathEditor={(bool) => this.showMathEditor(bool)}
          mathToImage={(content, callback) =>
            this.mathToImage(content, callback)
          }
        />

        <PreviewImg
          imgUrl={this.state.imgUrl}
          modalVisible={this.state.modalVisible}
          changeModalVisible={this.changeModalVisible}
        />
      </div>
    );
  }
}

export default BatchInput;
