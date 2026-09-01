//单题录入
import React, { PureComponent } from "react";
import { Checkbox, message, Popover, Select, TreeSelect } from "antd";
import { connect } from "dva";
import { routerRedux } from "dva/router";

import { trans } from "../../../utils/i18n";
import { getPageQuery, getQueryPath } from "../../../utils/utils";
import BraftEditor from "../../BraftEditor/index";

import icon from "../../../icon.module.less";
import styles from "./index.module.less";
const { SHOW_PARENT } = TreeSelect;
const { Option } = Select;

let canSave = true,
  canSaveBasket = true;
let optionItem = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"];
let childType = {
  1: trans("global.radio"),
  2: trans("global.check"),
  3: trans("global.pack"),
  4: trans("global.judge"),
  5: trans("global.ask"),
};

let hardArray = {
  1: trans("global.easy", "简单"),
  2: trans("global.general", "普通"),
  3: trans("global.difficult", "困难"),
};
const QUESTION_TYPE_OPTIONS = [
  { value: 1, icon: "e761", label: trans("global.radio", "单选题") },
  { value: 2, icon: "e755", label: trans("global.check", "多选题") },
  { value: 3, icon: "e802", label: trans("global.pack", "填空题") },
  { value: 4, icon: "e800", label: trans("global.judge", "判断题") },
  {
    value: 5,
    icon: "e807",
    iconStyle: { fontSize: 12 },
    label: trans("global.ask", "问答题"),
  },
  {
    value: 6,
    icon: "e7f6",
    iconStyle: { fontSize: 12 },
    label: trans("global.combination", "组合题"),
  },
  {
    value: 7,
    icon: "e7f6",
    iconStyle: { fontSize: 12 },
    label: trans("newMyQuestion.singleVote", "单选投票"),
  },
  {
    value: 8,
    icon: "e7f6",
    iconStyle: { fontSize: 12 },
    label: trans("newMyQuestion.multipleVote", "多选投票"),
  },
];
const getIconText = (code) => String.fromCharCode(Number.parseInt(code, 16));
const toSafeArray = (value) => (Array.isArray(value) ? value : []);
@connect((state) => ({
  sectionList: state.inputQuestion.sectionList, //学段
  // gradeList: state.inputQuestion.gradeList, //年级
  subjectList: state.inputQuestion.subjectList, //学科
  importMsg: state.inputQuestion.importMsg, //录入试题
  importBasketMsg: state.inputQuestion.importBasketMsg, //录入试题到试题篮
  treeData: state.inputQuestion.treeData,
  labelList: state.inputQuestion.labelList,
  ifAdmin: state.inputQuestion.ifAdmin,
  chapterList: state.inputQuestion.chapterList,
  allGradeList: state.inputQuestion.allGradeList, //年级
}))
class SingleInput extends PureComponent {
  constructor(properties) {
    super(properties);
    this.state = {
      gradeValue: undefined,
      // sectionValue: undefined,
      subjectValue: undefined,
      hardValue: 1,
      questionType: 1, //1：单选题 2：多选题 3: 填空题 4: 判断题
      questionMenus: window.localStorage.getItem("yungu_questionMenus")
        ? JSON.parse(window.localStorage.getItem("yungu_questionMenus"))
        : [0, 1, 2, 3], //题目选项的初始个数
      //checkedOption: window.localStorage.getItem("yungu_checkedOption") ? JSON.parse(window.localStorage.getItem("yungu_checkedOption")) : {},
      checkedOption: {}, //选项=>{0:true,1: true}
      isEditOption: {}, //是否进入编辑选项的模式
      isEditContent: false, //是否编辑题目内容
      isEditAnalysis: false, //是否编辑解析内容
      isEditAnswer: false, //是否编辑答案内容
      optionContent: window.localStorage.getItem("yungu_optionContent")
        ? JSON.parse(window.localStorage.getItem("yungu_optionContent"))
        : {}, //选项内容=> {0:xxx,1:xxx}
      questionContent: properties.editQuestion
        ? properties.editQuestion.content
        : window.localStorage.getItem("yungu_questionContent")
          ? window.localStorage.getItem("yungu_questionContent")
          : "", //题干
      analysisContent: properties.editQuestion
        ? properties.editQuestion.analysis
        : window.localStorage.getItem("yungu_analysisContent")
          ? window.localStorage.getItem("yungu_analysisContent")
          : "", //答案解析
      answerContent: properties.editQuestion
        ? properties.editQuestion.answer
        : window.localStorage.getItem("yungu_answerContent")
          ? window.localStorage.getItem("yungu_answerContent")
          : "", //问答题答案
      successVisible: false, //保存成功弹窗
      importType: 0,
      selectTree: [],
      selectTreeValue: [],
      indicatorValues: [],
      selectLabel: [],
      selectTreeList: [],
      judgeId: null,
      tags: [],
      inputVisible: false,
      inputValue: "",
      completionSwitch: true,
      answers: [],
      chapterIds: [],
      chapterValues: [],
      // coreKey: [],
      // generalKey: [],
      childQuestion: [],
      childItem: null,
    };
    this.editQuestion = null;
    // this.arr = [];
    this.completionArr = [];
    this.selectRef = React.createRef();
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

  /**
   * 生成返回我的题库的地址，并按需保留招生上下文。
   * @returns {string} 最终跳转地址
   */
  getMyQuestionPath = () => {
    if (!this.isRecruitQuestionMode()) {
      return "/myQuestion";
    }
    return getQueryPath("/myQuestion", {
      queryZhaoShengQuestion: true,
    });
  };

  componentDidMount() {
    this.getSection();
    this.props.dispatch({
      type: "inputQuestion/getAdmin",
    });
    this.props.dispatch({
      type: "inputQuestion/getAllGradeList",
    });
    if (this.props.editQuestion) {
      this.initData();
      if (this.props.editQuestion.gradeId) {
        // this.getGrade(this.props.editQuestion.yearPeriodId);
        this.getSubject(this.props.editQuestion.gradeId);
        this.setState(
          {
            // sectionValue: this.props.editQuestion.yearPeriodId,
            gradeValue: this.props.editQuestion.gradeId,
            subjectValue: this.props.editQuestion.subjectId,
            selectLabel: this.props.editQuestion.indicatorIds,
          },
          () => {
            this.props
              .dispatch({
                type: "inputQuestion/getTree",
                payload: {
                  subjectId: this.state.subjectValue,
                  gradeId: this.state.gradeValue,
                },
              })
              .then(() => {
                this.setState({
                  selectTree: this.props.editQuestion.knowledgeSelections || [],
                });
              });
            this.getLabel();
            this.getChapter();
          },
        );
      }
    }

    if (this.props.gradeId && this.props.subjectId) {
      this.setState({
        gradeValue: this.props.gradeId,
        subjectValue: this.props.subjectId,
        questionType: this.props.questionType,
        hardValue: this.props.questionLevelType,
        // chapterIds: this.props.chapterId,
        // chapterValues: this.props.chapterName,
        // selectTree: this.props.knowledgeIds,
        // selectTreeValue: this.props.knowledgeName,
        // 素养id
        // selectLabel: this.props.indicatorIds,
        // indicatorValues: this.props.indicatorName,
      });
      this.getSubject(this.props.gradeId);
      this.setState(
        {
          subjectValue: this.props.subjectId,
        },
        () => {
          this.getTree(() => {
            if (
              this.props.treeData &&
              this.props.treeData.length > 0 &&
              this.props.knowledgeIds &&
              this.props.knowledgeIds.length > 0
            ) {
              const findNameById = (data, id) => {
                for (const item of data) {
                  if (item.id == id) {
                    return item;
                  }
                  if (item.children && item.children.length > 0) {
                    let result = findNameById(item.children, id);
                    if (result) {
                      return result;
                    }
                  }
                }
                return null;
              };
              let ls = findNameById(
                this.props.treeData,
                this.props.knowledgeIds[0],
              );
              if (ls) {
                this.setState({
                  selectTree: [ls.value],
                  selectTreeValue: [ls.title],
                });
              }
            }
          });
          this.getLabel(() => {
            if (
              this.props.labelList &&
              this.props.labelList.length > 0 &&
              this.props.indicatorIds &&
              this.props.indicatorIds.length > 0
            ) {
              const findNameById = (data, id) => {
                for (const item of data) {
                  if (item.value == id) {
                    return item;
                  }
                  if (item.children && item.children.length > 0) {
                    let result = findNameById(item.children, id);
                    if (result) {
                      return result;
                    }
                  }
                }
                return null;
              };
              let ls = findNameById(
                this.props.labelList,
                this.props.indicatorIds[0],
              );
              if (ls) {
                this.setState({
                  selectLabel: [ls.value],
                  indicatorValues: [ls.title],
                });
              }
            }
          });
          this.getChapter(() => {
            if (
              this.props.chapterList &&
              this.props.chapterList.length > 0 &&
              this.props.chapterId
            ) {
              const findChapterNameById = (data, id) => {
                for (const item of data) {
                  if (item.id == id) {
                    return item;
                  }
                  if (item.children && item.children.length > 0) {
                    let result = findChapterNameById(item.children, id);
                    if (result) {
                      return result;
                    }
                  }
                }
                return null;
              };
              let ls = findChapterNameById(
                this.props.chapterList,
                this.props.chapterId,
              );
              if (ls) {
                this.setState({
                  chapterIds: ls.value,
                  chapterValues: [ls.title],
                });
              }
            }
          });
        },
      );
    }
  }
  getTree = (callback) => {
    this.props
      .dispatch({
        type: "inputQuestion/getTree",
        payload: {
          subjectId: this.state.subjectValue,
          gradeId: this.state.gradeValue,
        },
      })
      .then(() => {
        callback && callback();
      });
  };
  getLabel = (callback) => {
    this.props
      .dispatch({
        type: "inputQuestion/getLabel",
        payload: {
          subjectId: this.state.subjectValue,
          gradeId: this.state.gradeValue,
        },
      })
      .then((res) => {
        callback && callback();
      });
  };
  getChapter = (callback) => {
    this.props
      .dispatch({
        type: "inputQuestion/getChapter",
        payload: {
          subjectId: this.state.subjectValue,
          gradeId: this.state.gradeValue,
          isSegmentation: true,
        },
      })
      .then(() => {
        callback && callback();
      });
  };
  //编辑初始化数据
  initData = () => {
    const { editQuestion } = this.props;
    let questionMenus = [];
    if (editQuestion.type == 3) {
      let array1 =
        editQuestion.gapFillingAnswer && editQuestion.gapFillingAnswer.answers
          ? editQuestion.gapFillingAnswer.answers
          : [];
      array1.length &&
        array1.map((it, index) => {
          // const newState = JSON.parse(JSON.stringify(this.state));
          console.log(it, "ss");
          let array = it;
          if ((it + "").includes("&&")) {
            array = it.split("&&");
          }
          // let arr = it.split("&&")
          // newState[`tags${index}`] = arr;
          // this.setState({ ...newState });
          this.completionArr[index] = array;
        });
      questionMenus =
        editQuestion.gapFillingAnswer && editQuestion.gapFillingAnswer.answers
          ? editQuestion.gapFillingAnswer.answers
          : [];
    } else {
      questionMenus = this.formatOptionList(
        editQuestion.optionList,
        "questionMenus",
      ); //选项个数
    }
    let list = [];
    if (editQuestion.type == 6) {
      list = editQuestion.sonQuestionList || [];
      if (list && list.length > 0) {
        list.map((item) => {
          item.optionContent = this.formatOptionList(
            item.optionList,
            "optionContent",
          );
          ((item.judgeId =
            item.answer == "true" ? 1 : item.answer == "false" ? 2 : null),
            (item.checkedOption = this.formatAnswer(item)));
          item.chapterId =
            item.chapterSelections && item.chapterSelections.length > 0
              ? item.chapterSelections[0]
              : "";
          item.chapterValues = item.chapterLabels || [];
          item.knowledgeIds = item.knowledgeSelections || [];
          item.knowledgeValues = item.knowledgeLabels || [];
          item.indicatorValues = item.indicatorLabels || [];
          item.knowledgeNames = null;
          if (item.type == 3) {
            let array1 =
              item.gapFillingAnswer && item.gapFillingAnswer.answers
                ? item.gapFillingAnswer.answers
                : [];
            item.completionArr = [];
            array1.length &&
              array1.map((it, index) => {
                // const newState = JSON.parse(JSON.stringify(this.state));
                console.log(it, "ss");
                let array = it;
                if ((it + "").includes("&&")) {
                  array = it.split("&&");
                }
                // let arr = it.split("&&")
                // newState[`tags${index}`] = arr;
                // this.setState({ ...newState });

                item.completionArr[index] = array;
              });
            item.isOrder = !(
              item.gapFillingAnswer && item.gapFillingAnswer.isOrder
            );
            item.questionMenus =
              item.gapFillingAnswer && item.gapFillingAnswer.answers
                ? item.gapFillingAnswer.answers
                : [];
          } else {
            item.questionMenus = this.formatOptionList(
              item.optionList,
              "questionMenus",
            );
          }
        });
      }
    }
    // this.completionArr = editQuestion.gapFillingAnswer.answers;
    let questionType = editQuestion.type, //试题类型
      questionContent = editQuestion.content, //题干
      analysisContent = editQuestion.analysis, //答案解析
      answerContent = editQuestion.answer, //答案
      judgeId =
        editQuestion.answer == "true"
          ? 1
          : editQuestion.answer == "false"
            ? 2
            : null,
      optionContent = this.formatOptionList(
        editQuestion.optionList,
        "optionContent",
      ), //选项内容
      selectTreeList = this.formatTreeList(
        editQuestion.optionList,
        editQuestion.optionKnowledgeSelections,
      ),
      checkedOption = this.formatAnswer(editQuestion),
      chapterValues = editQuestion.chapterLabels || [],
      chapterIds =
        editQuestion.chapterSelections &&
        editQuestion.chapterSelections.length > 0
          ? editQuestion.chapterSelections[0]
          : "",
      selectTreeValue = editQuestion.knowledgeLabels || [],
      indicatorValues = editQuestion.indicatorLabels || [],
      hardValue = editQuestion.questionLevel; //题目难易程度
    this.setState({
      questionType,
      judgeId,
      questionContent,
      analysisContent,
      answerContent,
      questionMenus,
      optionContent,
      checkedOption,
      hardValue,
      childQuestion: list,
      chapterValues,
      chapterIds,
      selectTreeList,
      selectTree: editQuestion.knowledgeSelections || [],
      selectTreeValue,
      indicatorValues,
      completionSwitch: !editQuestion?.gapFillingAnswer?.isOrder,
    });
    this.arr = editQuestion.gapFillingAnswer?.answers;
  };
  formatTreeList = (option, optionKnowledgeSelections) => {
    let newList = [];
    if (
      Array.isArray(optionKnowledgeSelections) &&
      optionKnowledgeSelections.length > 0
    ) {
      newList = optionKnowledgeSelections.map((selection) =>
        Array.isArray(selection) ? selection : [],
      );
    } else if (option && option.length > 0) {
      option.map((item) => {
        newList.push(item.knowledgeValues || []);
      });
    }
    return newList;
  };
  //格式化选项
  formatOptionList = (option, type) => {
    let array = option || [];
    let questionMenus = [],
      optionContent = {};
    for (const [index, element] of array.entries()) {
      questionMenus.push(index);
      optionContent[`${index}`] = element["answers"];
    }
    if (type == "questionMenus") {
      return questionMenus;
    } else if (type == "optionContent") {
      return optionContent;
    }
  };

  //格式化答案
  formatAnswer = (editQuestion) => {
    if (editQuestion.type == 3) {
      return {};
    }
    if (editQuestion.type == 4) {
      return {};
    }
    if (editQuestion.type == 5) {
      return {};
    }
    let option = editQuestion.optionList,
      answer = editQuestion.answer;
    let result = {};
    for (const element of answer) {
      for (const [index, element_] of option.entries()) {
        if (element_["key"] == element) {
          result[`${index}`] = true;
        }
      }
    }
    return result;
  };

  //获取学段
  getSection = () => {
    const { dispatch } = this.props;
    dispatch({
      type: "inputQuestion/getSectionList",
      payload: {},
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
      },
      () => {
        this.getSubject(value);
      },
    );
  };

  //选择学科
  changeSubject = (value) => {
    this.setState(
      {
        selectTree: [],
        selectLabel: [],
        selectTreeList: [],
        subjectValue: value,
      },
      () => {
        this.getTree();
        this.getLabel();
        this.getChapter();
      },
    );
  };

  //选择难易程度
  changeDifficult = (value) => {
    this.setState({
      hardValue: value,
    });
  };

  changeChildDifficult = (value, name, ind) => {
    let newList = JSON.parse(JSON.stringify(this.state.childQuestion));
    newList[ind].questionLevel = value;
    newList[ind].questionLevelName = hardArray[value];
    this.setState({
      childQuestion: newList,
    });
  };
  //切换题型
  changeQuestionType = (questionType) => {
    if (questionType !== this.state.questionType) {
      this.setState({
        childQuestion: [],
      });
    }
    this.setState({
      questionType,
    });
  };

  //重置题目录入选项
  resetQuestion = () => {
    this.setState({
      questionMenus: [0, 1, 2, 3], //题目选项的初始个数
      checkedOption: {}, //选中选项
      optionContent: {}, //选项内容
      isEditOption: {}, //是否进入编辑模式
      isEditContent: false, //是否进入编辑题干
      isEditAnalysis: false, //是否进入编辑解析
      isEditAnswer: false, //是否进入编辑答案
      questionContent: "", //题干
      analysisContent: "", //答案解析
      answerContent: "", //答案
    });
  };

  dragOver(e) {
    e.stopPropagation();
    e.preventDefault();
  }

  dragLeave(e) {
    e.stopPropagation();
    e.preventDefault();
    let target = e.target;
    target.style.opacity = 1;
    target.style.backgroundColor = "";
  }

  drop = (e) => {
    e.stopPropagation();
    e.preventDefault();
    let d = e.dataTransfer.getData("text"),
      target = e.target,
      targetId = e.target.id.replace("key", "");

    target.style.opacity = 1;
    target.style.backgroundColor = "";

    d != targetId &&
      setTimeout(() => {
        this.dropChange(d, targetId);
      }, 0);
  };

  dropChange(sourceKey, targetKey) {
    const { questionMenus } = this.state;
    let list = [...questionMenus];
    list.splice(targetKey, 0, ...list.splice(sourceKey, 1));
    this.setState(
      {
        questionMenus: list,
      },
      () => {
        this.saveToLocal(
          "yungu_questionMenus",
          JSON.stringify(this.state.questionMenus),
        );
      },
    );
  }

  dragEnter(e) {
    let t = e.target;
    if (t.tagName && t.tagName.toLowerCase() == "li") {
      t.style.opacity = "0.3";
      t.style.backgroundColor = "#aaa";
    }
  }

  dragStart(e) {
    let t = e.target;
    e.dataTransfer.setDragImage(t.parentNode, 0, 0);
    e.dataTransfer.setData("text", t.id);
  }

  //填写选项内容
  changeFillOption = (item, content) => {
    let optionContent = JSON.parse(JSON.stringify(this.state.optionContent));
    optionContent[item] = content;
    this.setState(
      {
        optionContent,
      },
      () => {
        this.saveToLocal(
          "yungu_optionContent",
          JSON.stringify(this.state.optionContent),
        );
      },
    );
  };

  changeChildFillOption = (item, ind, content) => {
    let newList = JSON.parse(JSON.stringify(this.state.childQuestion));
    console.log(newList[ind], "111");
    if (!newList[ind].optionContent) {
      newList[ind].optionContent = {};
    }
    newList[ind].optionContent[item] = content;
    newList[ind].optionContent[item] = content;
    this.setState({
      childQuestion: newList,
    });
  };

  blurChildEditOption = (ind, item) => {
    setTimeout(() => {
      let newList = JSON.parse(JSON.stringify(this.state.childQuestion));
      newList[ind].isEditOption[item] = false;
      this.setState(
        {
          childQuestion: newList,
        },
        // () => {
        //   this.saveToLocal(
        //     "yungu_optionContent",
        //     JSON.stringify(this.state.optionContent)
        //   );
        // }
      );
    }, 100);
  };
  onRef = (reference) => {
    this.braftEditor = reference;
  };

  focusEditor = () => {
    this.braftEditor.foucusFn();
  };
  handleClose = (removedTag, index) => {
    console.log(this.state.tags, "222");
    const newState = JSON.parse(JSON.stringify(this.state));
    newState[`tags${index}`] = newState[`tags${index}`].filter(
      (tag) => tag !== removedTag,
    );
    const tags = newState[`tags${index}`].filter((tag) => tag !== removedTag);
    this.setState({ ...newState[`tags${index}`] });
  };

  showInput = (index) => {
    const newState = JSON.parse(JSON.stringify(this.state));
    newState[`inputVisible${index}`] = true;
    this.setState({ ...newState }, () => this.input && this.input.focus());
  };

  handleInputChange = (index, e) => {
    const newState = JSON.parse(JSON.stringify(this.state));
    // newState[`inputValue${index}`] = [];
    newState[`inputValue${index}`] = [
      // ...newState[`inputValue${index}`],
      e.target.value,
    ];
    this.setState({
      ...newState,
    });
    // this.setState({ inputValue: e.target.value });
  };
  // 填空
  handleInputConfirm = (index, e) => {
    const newState = JSON.parse(JSON.stringify(this.state));
    newState[`inputVisible${index}`] = false;
    if (!newState[`tags${index}`]) {
      newState[`tags${index}`] = [];
    }
    // newState[`tags${index}`] = [];
    // const { inputValue } = this.state;
    // let { tags } = this.state;
    if (
      newState[`inputValue${index}`] &&
      newState[`tags${index}`]?.indexOf(newState[`inputValue${index}`]) === -1
    ) {
      newState[`tags${index}`] = [
        ...newState[`tags${index}`],
        // ...newState[`inputValue${index}`],
        e.target.value,
      ];
    }
    // console.log(newState[`inputValue${index}`], "aaa");
    newState[`inputValue${index}`] = "";
    this.setState({
      ...newState,
      ...newState[`tags${index}`],
      ...newState[`inputValue${index}`],
    });
    let string_ = "";
    if (newState[`tags${index}`].length > 1) {
      string_ = newState[`tags${index}`].join("&&");
      this.arr[index] = string_;
    } else {
      this.arr[index] = newState[`tags${index}`][0];
    }
  };

  saveInputRef = (input) => {
    this.input = input;
  };
  handleChange = (index, e) => {
    e = e.length == 1 ? e[0] : e.join("&&");
    this.completionArr[index] = e;
    console.log(this.completionArr, "111");
  };
  handleChildChange = (ind, index, e) => {
    let newList = JSON.parse(JSON.stringify(this.state.childQuestion));
    if (!newList[ind].completionArr) {
      newList[ind].completionArr = [];
    }
    e = e.length == 1 ? e[0] : e.join("&&");
    newList[ind].completionArr[index] = e;
    this.setState({
      childQuestion: newList,
    });
  };
  changeGeneral = (e) => {
    e = e.length == 1 ? e[0] : e.join("&&");
    this.setState({
      generalKey: e,
    });
  };
  changeCore = (e) => {
    e = e.length == 1 ? e[0] : e.join("&&");
    this.setState({
      coreKey: e,
    });
  };
  changeChildGeneral = (ind, e) => {
    let newList = JSON.parse(JSON.stringify(this.state.childQuestion));

    e = e.length == 1 ? e[0] : e.join("&&");
    newList[ind].generalKey = e;
    this.setState({
      childQuestion: newList,
    });
  };
  changeChildCore = (ind, e) => {
    let newList = JSON.parse(JSON.stringify(this.state.childQuestion));
    e = e.length == 1 ? e[0] : e.join("&&");
    newList[ind].coreKey = e;
    this.setState({
      childQuestion: newList,
    });
  };
  changeChildJudge = (ind, type) => {
    let newList = JSON.parse(JSON.stringify(this.state.childQuestion));
    newList[ind].judgeId = type;
    this.setState({
      childQuestion: newList,
    });
  };
  addChild = (type) => {
    let newList = JSON.parse(JSON.stringify(this.state.childQuestion));
    if (type === 1 || type === 2) {
      newList.push({
        type,
        questionMenus: [0, 1, 2, 3],
      });
    } else if (type === 3) {
      newList.push({
        type,
        questionMenus: [0, 1, 2, 3],
        isOrder: true,
      });
    } else {
      newList.push({
        type,
      });
    }
    this.setState({
      childQuestion: newList,
    });
  };
  //渲染题目选项
  renderQuestionOption = (questionType) => {
    const {
      questionMenus,
      checkedOption,
      isEditOption,
      optionContent,
      answerContent,
      tags,
      inputVisible,
      isEditAnswer,
      inputValue,
      childQuestion,
    } = this.state;
    console.log(checkedOption, questionMenus, childQuestion, "11");
    const { treeData } = this.props;
    let dragEvents = {
      onDragStart: this.dragStart,
      onDragOver: this.dragOver,
      onDragLeave: this.dragLeave,
      onDrop: this.drop,
      onDragEnter: this.dragEnter,
    };
    let newTree = [];
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
    newTree.length &&
      newTree.map((item) => {
        if (item.children && item.children.length > 0) {
          item.children.map((index) => {
            index.title = index.text;
            index.value = `${index.text}-${index.pinyin || ""}-${index.id}`;
            index.key = JSON.stringify(index.id);
            if (index.children && index.children.length > 0) {
              index.children.map((it) => {
                it.title = it.text;
                it.value = `${it.text}-${it.pinyin || ""}-${it.id}`;
                it.key = JSON.stringify(it.id);
                if (it.children && it.children.length > 0) {
                  it.children.map((ite) => {
                    ite.title = ite.text;
                    ite.value = `${ite.text}-${ite.pinyin || ""}-${ite.id}`;
                    ite.key = JSON.stringify(ite.id);
                    if (ite.children && ite.children.length > 0) {
                      ite.children.map((et) => {
                        et.title = et.text;
                        et.value = `${et.text}-${et.id}`;
                        et.key = JSON.stringify(et.id);
                      });
                    }
                  });
                }
              });
            }
          });
          console.log(item, "ii");
        }
      });

    if (questionType == 4) {
      return (
        <div className={styles.judgeBox}>
          <div
            className={[
              this.state.judgeId == 1 ? styles.blue : null,
              styles.correct,
              styles.judeg,
            ].join(" ")}
            onClick={() => this.setState({ judgeId: 1 })}
          >
            <span
              className={[
                styles.radioBox,
                this.state.judgeId == 1 ? styles.checkedRadio : null,
              ].join(" ")}
              onClick={() => this.setState({ judgeId: 1 })}
            >
              {this.state.judgeId == 1 ? (
                <div className={styles.checkedRadioContent}></div>
              ) : null}
            </span>
            <span className={styles.judgeNum}>A.</span>
            {trans("global.right", "正确")}
          </div>
          <div
            className={[
              this.state.judgeId == 2 ? styles.blue : null,
              styles.error,
              styles.judeg,
            ].join(" ")}
            onClick={() => this.setState({ judgeId: 2 })}
          >
            <span
              className={[
                styles.radioBox,
                this.state.judgeId == 2 ? styles.checkedRadio : null,
              ].join(" ")}
              onClick={() => this.setState({ judgeId: 2 })}
            >
              {this.state.judgeId == 2 ? (
                <div className={styles.checkedRadioContent}></div>
              ) : null}
            </span>
            <span className={styles.judgeNum}>B.</span>
            {trans("global.wrong", "错误")}
          </div>
        </div>
      );
    }
    if (questionType == 5) {
      return (
        <div className={styles.answerArea}>
          {isEditAnswer == true ? (
            <BraftEditor
              onRef={this.onRef}
              braftType="answerContent"
              blue={true}
              blurEdit={this.blurEditAnswer}
              initContent={answerContent}
              changeFill={this.fillAnswerContent}
              questionType={questionType}
            />
          ) : answerContent ? (
            <div
              className={styles.fillAnswer}
              dangerouslySetInnerHTML={{ __html: answerContent }}
              onClick={this.editAnswer}
            ></div>
          ) : (
            <div onClick={this.editAnswer} className={styles.fillTips}>
              {trans("global.clickInput", "点此输入内容")}
            </div>
          )}
        </div>
      );
    }
    if (questionType == 6) {
      return (
        <div className={styles.childQuestionBox}>
          {childQuestion && childQuestion.length > 0
            ? childQuestion.map((it, ind) => (
                <div
                  id={`childQuestion${ind}`}
                  className={[
                    styles.childQuestionList,
                    this.state.childItem === ind
                      ? styles.checkChildQuestion
                      : "",
                  ].join(" ")}
                >
                  <div className={styles.childHeader}>
                    <div>
                      {childType[it.type]}
                      {it.type === 3 ? (
                        <span className={styles.orderTips}>
                          <Checkbox
                            checked={it.isOrder}
                            onChange={this.changeChildOrder.bind(this, ind)}
                          >
                            {trans(
                              "singleInput.allowAnswerOrderMismatch",
                              "允许学生答案与参考答案顺序不一致",
                            )}
                          </Checkbox>
                        </span>
                      ) : null}
                    </div>
                    <div className={styles.optionTrRight}>
                      <i
                        className={[styles.rightIcon, icon.iconfont].join(" ")}
                        onClick={() => this.deleteChild(ind)}
                      >
                        {" "}
                        &#xe739;
                      </i>
                      {ind == 0 ? (
                        <i
                          className={[
                            styles.rightIcon,
                            icon.iconfont,
                            styles.noCheck,
                          ].join(" ")}
                        >
                          &#xeb0b;
                        </i>
                      ) : (
                        <i
                          className={[styles.rightIcon, icon.iconfont].join(
                            " ",
                          )}
                          onClick={this.upChild.bind(this, ind)}
                        >
                          &#xeb0b;
                        </i>
                      )}
                      {ind == childQuestion.length - 1 ? (
                        <i
                          className={[
                            styles.rightIcon,
                            icon.iconfont,
                            styles.noCheck,
                          ].join(" ")}
                        >
                          &#xeb0a;
                        </i>
                      ) : (
                        <i
                          className={[styles.rightIcon, icon.iconfont].join(
                            " ",
                          )}
                          onClick={this.downChild.bind(this, ind)}
                        >
                          &#xeb0a;
                        </i>
                      )}
                    </div>
                  </div>
                  <div className={styles.childContent}>
                    <div className={styles.questionArea}>
                      {this.state[`childContent${ind}`] == true ? (
                        <BraftEditor
                          focus={true}
                          onRef={this.onRef}
                          blue={true}
                          braftType="questionContent"
                          blurEdit={this.blurChildContent.bind(this, ind)}
                          initContent={it.content}
                          questionType={it.type}
                          changeFill={this.fillChildContent.bind(this, ind)}
                        />
                      ) : it.content ? (
                        <div
                          className={styles.fillContent}
                          dangerouslySetInnerHTML={{ __html: it.content }}
                          style={{}}
                          onClick={this.editChildContent.bind(this, ind)}
                        ></div>
                      ) : (
                        <div
                          style={{}}
                          onClick={this.editChildContent.bind(this, ind)}
                          className={styles.fillMessage}
                        >
                          {trans("global.clickChildInput", "子题干，点此编辑")}
                        </div>
                      )}
                    </div>
                    <div className={styles.questionArea}>
                      {it.type == 4 ? (
                        <div className={styles.judgeBox}>
                          <div
                            className={[
                              it.judgeId == 1 ? styles.blue : null,
                              styles.correct,
                              styles.judeg,
                            ].join(" ")}
                            onClick={() => this.changeChildJudge(ind, 1)}
                          >
                            <span
                              className={[
                                styles.radioBox,
                                it.judgeId == 1 ? styles.checkedRadio : null,
                              ].join(" ")}
                              onClick={() => this.changeChildJudge(ind, 1)}
                            >
                              {it.judgeId == 1 ? (
                                <div
                                  className={styles.checkedRadioContent}
                                ></div>
                              ) : null}
                            </span>
                            <span className={styles.judgeNum}>A.</span>
                            {trans("global.right", "正确")}
                          </div>
                          <div
                            className={[
                              it.judgeId == 2 ? styles.blue : null,
                              styles.error,
                              styles.judeg,
                            ].join(" ")}
                            onClick={() => this.changeChildJudge(ind, 2)}
                          >
                            <span
                              className={[
                                styles.radioBox,
                                it.judgeId == 2 ? styles.checkedRadio : null,
                              ].join(" ")}
                              onClick={() => this.changeChildJudge(ind, 2)}
                            >
                              {it.judgeId == 2 ? (
                                <div
                                  className={styles.checkedRadioContent}
                                ></div>
                              ) : null}
                            </span>
                            <span className={styles.judgeNum}>B.</span>
                            {trans("global.wrong", "错误")}
                          </div>
                        </div>
                      ) : it.type == 5 ? (
                        <div className={styles.answerArea}>
                          {it.isEditAnswer == true ? (
                            <BraftEditor
                              onRef={this.onRef}
                              braftType="answerContent"
                              blue={true}
                              blurEdit={this.blurChildEditAnswer.bind(
                                this,
                                ind,
                              )}
                              initContent={it.answer}
                              changeFill={this.fillChildAnswerContent.bind(
                                this,
                                ind,
                              )}
                              questionType={questionType}
                            />
                          ) : it.answer ? (
                            <div
                              className={styles.fillAnswer}
                              dangerouslySetInnerHTML={{ __html: it.answer }}
                              onClick={this.editChildAnswer.bind(this, ind)}
                            ></div>
                          ) : (
                            <div
                              onClick={this.editChildAnswer.bind(this, ind)}
                              className={styles.fillTips}
                            >
                              {trans("global.clickInput", "点此输入内容")}
                            </div>
                          )}
                        </div>
                      ) : it.type === 1 || it.type === 2 || it.type === 3 ? (
                        it.questionMenus && it.questionMenus.length > 0 ? (
                          it.questionMenus.map((item, index) => (
                            <li
                              className={styles.optionList}
                              key={index}
                              id={"key" + index}
                              {...dragEvents}
                            >
                              {it.type == 1 ? (
                                <span
                                  className={[
                                    styles.radioBox,
                                    it.checkedOption && it.checkedOption[item]
                                      ? styles.checkedRadio
                                      : "",
                                  ].join(" ")}
                                  onClick={this.checkChildOption.bind(
                                    this,
                                    item,
                                    !(
                                      it.checkedOption && it.checkedOption[item]
                                    ),
                                    ind,
                                    it.type,
                                  )}
                                >
                                  {it.checkedOption &&
                                  it.checkedOption[item] ? (
                                    <div
                                      className={styles.checkedRadioContent}
                                    ></div>
                                  ) : null}
                                </span>
                              ) : it.type == 2 ? (
                                <span
                                  className={[
                                    styles.checkBox,
                                    it.checkedOption && it.checkedOption[item]
                                      ? styles.checkedRadio
                                      : "",
                                  ].join(" ")}
                                  onClick={this.checkChildOption.bind(
                                    this,
                                    item,
                                    !(
                                      it.checkedOption && it.checkedOption[item]
                                    ),
                                    ind,
                                    it.type,
                                  )}
                                >
                                  {it.checkedOption &&
                                  it.checkedOption[item] ? (
                                    <i
                                      className={[
                                        styles.checkedCheck,
                                        icon.iconfont,
                                      ].join(" ")}
                                    >
                                      &#xeaf1;
                                    </i>
                                  ) : null}
                                </span>
                              ) : it.type == 3 ? (
                                <span className={styles.completionSerial}>
                                  {index + 1}
                                </span>
                              ) : null}
                              <div className={styles.optionContent}>
                                {it.type == 1 || it.type == 2 ? (
                                  <div
                                    className={[
                                      styles.optionNum,
                                      it.checkedOption && it.checkedOption[item]
                                        ? styles.checkNum
                                        : null,
                                    ].join(" ")}
                                  >
                                    {optionItem[index]}.
                                  </div>
                                ) : null}
                                {it.isEditOption &&
                                it.isEditOption[item] == true ? (
                                  <div className={styles.braftEditorStyle}>
                                    <BraftEditor
                                      onRef={this.onRef}
                                      blue={true}
                                      blurEdit={() =>
                                        this.blurChildEditOption(ind, item)
                                      }
                                      braftType="option"
                                      initContent={
                                        it.optionContent &&
                                        it.optionContent[item]
                                      }
                                      changeFill={(content) =>
                                        this.changeChildFillOption(
                                          item,
                                          ind,
                                          content,
                                        )
                                      }
                                    />
                                  </div>
                                ) : it.optionContent &&
                                  it.optionContent[item] ? (
                                  <div
                                    className={styles.selectArea}
                                    id={`selectArea${ind}${index}`}
                                    dangerouslySetInnerHTML={{
                                      __html: it.optionContent[item],
                                    }}
                                    onClick={(e) =>
                                      this.editChildOption(ind, item, e)
                                    }
                                  ></div>
                                ) : it.type == 3 ? (
                                  <div
                                    className={styles.selectArea}
                                    style={{ width: "calc(100% - 50px)" }}
                                  >
                                    <Select
                                      className="tiankong"
                                      dropdownStyle={{
                                        display: "none",
                                        marginLeft: "0",
                                      }}
                                      mode="tags"
                                      if={`selectArea${ind}${index}`}
                                      style={{
                                        width: "100%",
                                        display: "block",
                                      }}
                                      defaultValue={
                                        it.completionArr &&
                                        it.completionArr[index]
                                      }
                                      placeholder={
                                        "点击编辑，回车保存；支持保存多个答案"
                                      }
                                      onChange={(e) =>
                                        this.handleChildChange(ind, index, e)
                                      }
                                    >
                                      {/* {children} */}
                                    </Select>
                                  </div>
                                ) : (
                                  <div
                                    className={styles.selectArea}
                                    onClick={(e) =>
                                      this.editChildOption(ind, item, e)
                                    }
                                    id={`selectArea${ind}${index}`}
                                  >
                                    <em className={styles.placeholderTxt}>
                                      {trans(
                                        "singleInput.placeholderTxt",
                                        "请输入选项内容",
                                      )}
                                    </em>
                                  </div>
                                )}
                              </div>
                              {it.type == 1 || it.type == 2 ? (
                                <div className={styles.optionTrRight}>
                                  <i
                                    className={[
                                      styles.rightIcon,
                                      icon.iconfont,
                                    ].join(" ")}
                                    onClick={() =>
                                      this.deleteChildOption(
                                        item,
                                        ind,
                                        index,
                                        it.type,
                                      )
                                    }
                                  >
                                    {" "}
                                    &#xe739;
                                  </i>
                                  {index == 0 ? (
                                    <i
                                      className={[
                                        styles.rightIcon,
                                        icon.iconfont,
                                        styles.noCheck,
                                      ].join(" ")}
                                    >
                                      &#xeb0b;
                                    </i>
                                  ) : (
                                    <i
                                      className={[
                                        styles.rightIcon,
                                        icon.iconfont,
                                      ].join(" ")}
                                      onClick={this.upChildParent.bind(
                                        this,
                                        ind,
                                        index,
                                      )}
                                    >
                                      &#xeb0b;
                                    </i>
                                  )}
                                  {index == questionMenus.length - 1 ? (
                                    <i
                                      className={[
                                        styles.rightIcon,
                                        icon.iconfont,
                                        styles.noCheck,
                                      ].join(" ")}
                                    >
                                      &#xeb0a;
                                    </i>
                                  ) : (
                                    <i
                                      className={[
                                        styles.rightIcon,
                                        icon.iconfont,
                                      ].join(" ")}
                                      onClick={this.downChildParent.bind(
                                        this,
                                        ind,
                                        index,
                                      )}
                                    >
                                      &#xeb0a;
                                    </i>
                                  )}
                                </div>
                              ) : it.type == 3 || it.type == 5 ? (
                                <i
                                  className={`${icon.iconfont} ${styles.deleteIcon}`}
                                  onClick={() =>
                                    this.deleteChildOption(
                                      item,
                                      ind,
                                      index,
                                      it.type,
                                    )
                                  }
                                >
                                  &#xe739;
                                </i>
                              ) : null}
                            </li>
                          ))
                        ) : null
                      ) : null}
                      {it.type !== 4 && it.type !== 5 && it.type !== 6 ? (
                        <div
                          className={styles.addOptionBtn}
                          onClick={this.addChildSelectOption.bind(this, ind)}
                        >
                          <i className={icon.iconfont}>&#xe75a;</i>
                          {it.type === 3 ? (
                            <span>
                              {trans("global.add")}
                              {trans("global.answer", "选项")}
                            </span>
                          ) : (
                            <span>
                              {trans("global.add")}
                              {trans("global.xuanxiang", "选项")}
                            </span>
                          )}
                        </div>
                      ) : null}
                    </div>
                    <div className={styles.analysisChild}>
                      {this.state[`childAnalysis${ind}`] == true ? (
                        <BraftEditor
                          onRef={this.onRef}
                          blue={true}
                          braftType="analysisContent"
                          blurEdit={this.blurChildAnalysis.bind(this, ind)}
                          initContent={it.analysis}
                          changeFill={this.fillChildAnalysis.bind(this, ind)}
                          questionType={questionType}
                        />
                      ) : it.analysis ? (
                        <div
                          className={styles.fillAnalysis}
                          dangerouslySetInnerHTML={{ __html: it.analysis }}
                          onClick={this.editChildAnalysis.bind(this, ind)}
                        ></div>
                      ) : (
                        <div
                          className={[
                            styles.fillAnalysis,
                            styles.noContent,
                          ].join(" ")}
                          onClick={this.editChildAnalysis.bind(this, ind)}
                        >
                          {trans(
                            "global.childAnalysis",
                            "题目解析，点此编辑，非必填",
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            : null}
          <div className={styles.addBox}>
            <Popover
              overlayClassName={styles.addPop}
              className={styles.addPop}
              content={
                <div className={styles.childList}>
                  <div
                    className={styles.childItem}
                    onClick={this.addChild.bind(this, 1)}
                  >
                    {trans("global.radio")}
                  </div>
                  <div
                    className={styles.childItem}
                    onClick={this.addChild.bind(this, 2)}
                  >
                    {trans("global.check")}
                  </div>
                  <div
                    className={styles.childItem}
                    onClick={this.addChild.bind(this, 3)}
                  >
                    {trans("global.pack")}
                  </div>
                  <div
                    className={styles.childItem}
                    onClick={this.addChild.bind(this, 4)}
                  >
                    {trans("global.judge")}
                  </div>
                  <div
                    className={styles.childItem}
                    onClick={this.addChild.bind(this, 5)}
                  >
                    {trans("global.ask")}
                  </div>
                </div>
              }
            >
              <div className={styles.addBtn}>
                <i className={icon.iconfont}>&#xe75a;</i>
                <span className={styles.addBtnName}>
                  {trans("global.addChild", "添加子题")}
                </span>
              </div>
            </Popover>
            {/* <div className={styles.addBtn}>
              <i className={icon.iconfont}>&#xe75a;</i>
              <span className={styles.addBtnName}>{trans('global.batchAddChild', '批量导入子题')}</span>
            </div> */}
          </div>
        </div>
      );
    }
    return questionMenus.map((item, index) => {
      return (
        <li
          className={styles.optionList}
          key={index}
          id={"key" + index}
          {...dragEvents}
        >
          {questionType == 1 ? (
            <span
              className={[
                styles.radioBox,
                checkedOption[item] ? styles.checkedRadio : "",
              ].join(" ")}
              onClick={this.checkOption.bind(this, item, !checkedOption[item])}
            >
              {checkedOption[item] ? (
                questionType == 1 ? (
                  <div className={styles.checkedRadioContent}></div>
                ) : (
                  <i className={[styles.checkedCheck, icon.iconfont].join(" ")}>
                    &#xeaf1;
                  </i>
                )
              ) : null}
            </span>
          ) : questionType == 2 ? (
            <span
              className={[
                styles.checkBox,
                checkedOption[item] ? styles.checkedRadio : "",
              ].join(" ")}
              onClick={this.checkOption.bind(this, item, !checkedOption[item])}
            >
              {checkedOption[item] ? (
                questionType == 1 ? (
                  <div className={styles.checkedRadioContent}></div>
                ) : (
                  <i className={[styles.checkedCheck, icon.iconfont].join(" ")}>
                    &#xeaf1;
                  </i>
                )
              ) : null}
            </span>
          ) : questionType == 3 ? (
            <span className={styles.completionSerial}>{index + 1}</span>
          ) : questionType == 7 ? (
            <span
              className={[
                styles.radioBox,
                checkedOption[item] ? styles.checkedRadio : "",
              ].join(" ")}
              onClick={this.checkOption.bind(this, item, !checkedOption[item])}
            >
              {checkedOption[item] ? (
                questionType == 7 ? (
                  <div className={styles.checkedRadioContent}></div>
                ) : (
                  <i className={[styles.checkedCheck, icon.iconfont].join(" ")}>
                    &#xeaf1;
                  </i>
                )
              ) : null}
            </span>
          ) : questionType == 8 ? (
            <span
              className={[
                styles.checkBox,
                checkedOption[item] ? styles.checkedRadio : "",
              ].join(" ")}
              onClick={this.checkOption.bind(this, item, !checkedOption[item])}
            >
              {checkedOption[item] ? (
                questionType == 1 ? (
                  <div className={styles.checkedRadioContent}></div>
                ) : (
                  <i className={[styles.checkedCheck, icon.iconfont].join(" ")}>
                    &#xeaf1;
                  </i>
                )
              ) : null}
            </span>
          ) : null}
          <div className={styles.optionContent}>
            {questionType == 1 || questionType == 2 ? (
              <div
                className={[
                  styles.optionNum,
                  checkedOption[item] ? styles.checkNum : null,
                ].join(" ")}
              >
                {optionItem[index]}.
              </div>
            ) : null}

            {isEditOption[item] == true ? (
              <div className={styles.braftEditorStyle}>
                <BraftEditor
                  onRef={this.onRef}
                  blue={true}
                  blurEdit={() => this.blurEditOption(item)}
                  braftType="option"
                  initContent={optionContent[item]}
                  changeFill={(content) => this.changeFillOption(item, content)}
                />
              </div>
            ) : optionContent[item] ? (
              <div
                className={styles.selectArea}
                id={`selectArea${index}`}
                dangerouslySetInnerHTML={{ __html: optionContent[item] }}
                onClick={() => this.editOption(item)}
              ></div>
            ) : questionType == 3 ? (
              <div
                className={styles.selectArea}
                id={`selectArea${index}`}
                style={{ width: "calc(100% - 50px)" }}
              >
                <Select
                  className="tiankong"
                  dropdownStyle={{ display: "none", marginLeft: "0" }}
                  mode="tags"
                  style={{ width: "100%", display: "block" }}
                  defaultValue={this.completionArr[index]}
                  placeholder={trans(
                    "singleInput.multiAnswerEditPlaceholder",
                    "点击编辑，回车保存；支持保存多个答案",
                  )}
                  onChange={(e) => this.handleChange(index, e)}
                >
                  {/* {children} */}
                </Select>
              </div>
            ) : (
              <div
                className={styles.selectArea}
                onClick={() => this.editOption(item)}
                id={`selectArea${index}`}
              >
                <em className={styles.placeholderTxt}>
                  {trans("singleInput.placeholderTxt", "请输入选项内容")}
                </em>
              </div>
            )}
          </div>

          {questionType == 1 ||
          questionType == 2 ||
          questionType == 7 ||
          questionType == 8 ? (
            <div className={styles.optionTrRight}>
              <i
                className={[styles.rightIcon, icon.iconfont].join(" ")}
                onClick={() => this.deleteOption(item, index)}
              >
                {" "}
                &#xe739;
              </i>
              {index == 0 ? (
                <i
                  className={[
                    styles.rightIcon,
                    icon.iconfont,
                    styles.noCheck,
                  ].join(" ")}
                >
                  &#xeb0b;
                </i>
              ) : (
                <i
                  className={[styles.rightIcon, icon.iconfont].join(" ")}
                  onClick={this.upParent.bind(this, index)}
                >
                  &#xeb0b;
                </i>
              )}
              {index == questionMenus.length - 1 ? (
                <i
                  className={[
                    styles.rightIcon,
                    icon.iconfont,
                    styles.noCheck,
                  ].join(" ")}
                >
                  &#xeb0a;
                </i>
              ) : (
                <i
                  className={[styles.rightIcon, icon.iconfont].join(" ")}
                  onClick={this.downParent.bind(this, index)}
                >
                  &#xeb0a;
                </i>
              )}
            </div>
          ) : questionType == 3 || questionType == 5 ? (
            <i
              className={`${icon.iconfont} ${styles.deleteIcon}`}
              onClick={() => this.deleteOption(item, index)}
            >
              &#xe739;
            </i>
          ) : null}
        </li>
      );
    });
  };

  //选项进入编辑状态
  editOption = (item) => {
    let isEditOption = JSON.parse(JSON.stringify(this.state.isEditOption));
    isEditOption = {};
    console.log(isEditOption, "come1");
    isEditOption[item] = true;
    //
    this.setState(
      {
        isEditOption,
        isEditContent: false, //是否进入编辑题干
        isEditAnalysis: false, //是否进入编辑解析
        isEditAnswer: false, //是否进入编辑答案
      },
      () => {
        console.log(this.state.isEditOption, "come4");
        this.focusEditor();
      },
    );
    //
  };
  editChildOption = (ind, item, e) => {
    // e.stopPropagation;
    let newList = JSON.parse(JSON.stringify(this.state.childQuestion));
    newList[ind].isEditOption = {};
    newList[ind].isEditOption[item] = true;
    this.setState(
      {
        childQuestion: newList,
      },
      () => {
        this.focusEditor();
      },
    );
  };
  //选中选项
  checkOption = (item, checked) => {
    // let checked = e.target.checked;
    const { questionType } = this.state;
    console.log(checked);
    let checkedOption = JSON.parse(JSON.stringify(this.state.checkedOption));
    if (questionType == 1 || questionType == 7) {
      //单选
      checkedOption = {};
      checkedOption[item] = checked;
    } else if (questionType == 2 || questionType == 8) {
      //多选
      checkedOption[item] = checked;
    }
    this.setState(
      {
        checkedOption,
      },
      () => {
        //this.saveToLocal("yungu_checkedOption", JSON.stringify(this.state.checkedOption));
      },
    );
  };
  checkChildOption = (item, checked, ind, type) => {
    let newList = JSON.parse(JSON.stringify(this.state.childQuestion));
    if (type == 1) {
      //单选
      newList[ind].checkedOption = {};
      newList[ind].checkedOption[item] = checked;
    } else if (type == 2) {
      //多选
      if (!newList[ind].checkedOption) {
        newList[ind].checkedOption = {};
      }
      newList[ind].checkedOption[item] = checked;
    }
    this.setState({
      childQuestion: newList,
    });
  };

  //添加题目选项
  addSelectOption = () => {
    const { questionMenus } = this.state;
    if (questionMenus.length > 9) {
      message.info(trans("singleInput.optionMaxLength", "选项最多添加10个哦~"));
      return false;
    }
    let array = JSON.parse(JSON.stringify(questionMenus));
    let number_ = array.at(-1) + 1;
    if (number_) {
      array.push(number_);
    } else {
      array.push(0);
    }
    this.setState(
      {
        questionMenus: array,
      },
      () => {
        this.saveToLocal(
          "yungu_questionMenus",
          JSON.stringify(this.state.questionMenus),
        );
      },
    );
  };
  addChildSelectOption = (ind) => {
    const { questionMenus } = this.state;
    let newList = JSON.parse(JSON.stringify(this.state.childQuestion));

    if (newList[ind].questionMenus.length > 9) {
      message.info(trans("singleInput.optionMaxLength", "选项最多添加10个哦~"));
      return false;
    }
    let number_ = newList[ind].questionMenus.at(-1) + 1;
    newList[ind].questionMenus.push(number_);
    this.setState({
      childQuestion: newList,
    });
  };
  //删除填空选项
  deleteCompletion = (index) => {
    this.completionArr = this.completionArr.splice(index, 1);
  };

  //删除题目选项
  deleteOption = (item, index) => {
    if (this.state.questionType == 3) {
      this.completionArr.splice(-1, 1);
      console.log(this.completionArr);
    }
    const { questionMenus, optionContent, checkedOption } = this.state;
    if (
      (this.state.questionType == 1 || this.state.questionType == 2) &&
      questionMenus.length < 3
    ) {
      message.info(trans("singleInput.optionMinLength", "选项最少为2个哦~"));
      return false;
    }
    //选项展示的数组
    let array = JSON.parse(JSON.stringify(questionMenus));
    array.splice(index, 1);
    //输入内容的选项
    let object = JSON.parse(JSON.stringify(optionContent));
    delete object[item];
    //选中选项
    let checked = JSON.parse(JSON.stringify(checkedOption));
    delete checked[item];
    this.setState(
      {
        questionMenus: array,
        optionContent: object,
        checkedOption: checked,
      },
      () => {
        this.saveToLocal(
          "yungu_questionMenus",
          JSON.stringify(this.state.questionMenus),
        );
        this.saveToLocal(
          "yungu_optionContent",
          JSON.stringify(this.state.optionContent),
        );
      },
    );
  };
  deleteChildOption = (item, ind, index, type) => {
    const { questionMenus, optionContent, checkedOption } = this.state;
    let newList = JSON.parse(JSON.stringify(this.state.childQuestion));
    if ((type == 1 || type == 2) && newList[ind].questionMenus.length < 3) {
      message.info(trans("singleInput.optionMinLength", "选项最少为2个哦~"));
      return false;
    }

    newList[ind].questionMenus.splice(index, 1);
    if (newList[ind].optionContent) {
      delete newList[ind].optionContent[item];
    }
    //选中选项
    let checked = JSON.parse(JSON.stringify(checkedOption));
    if (newList[ind].checkedOption) {
      delete newList[ind].checkedOption[item];
    }
    this.setState({
      childQuestion: newList,
    });
  };

  upParent = (index) => {
    let newList = JSON.parse(JSON.stringify(this.state.questionMenus));
    let newItem = newList[index];
    newList.splice(index, 1);
    newList.splice(index - 1, 0, newItem);
    const dom = document.getElementById(`selectArea${index - 1}`);
    if (dom) {
      dom.style.border = "1px solid rgba(4,69,252,0.25)";
      setTimeout(() => {
        dom.style.border = "";
      }, 500);
    }
    this.setState(
      {
        questionMenus: newList,
      },
      () => {
        this.saveToLocal(
          "yungu_questionMenus",
          JSON.stringify(this.state.questionMenus),
        );
      },
    );
  };
  downParent = (index) => {
    let newList = JSON.parse(JSON.stringify(this.state.questionMenus));
    let newItem = newList[index];
    newList.splice(index, 1);
    console.log(newList, "n1");
    newList.splice(index + 1, 0, newItem);
    const dom = document.getElementById(`selectArea${index + 1}`);
    if (dom) {
      dom.style.border = "1px solid rgba(4,69,252,0.25)";
      setTimeout(() => {
        dom.style.border = "";
      }, 500);
    }
    this.setState(
      {
        questionMenus: newList,
        checkParent: index + 1,
      },
      () => {
        this.saveToLocal(
          "yungu_questionMenus",
          JSON.stringify(this.state.questionMenus),
        );
      },
    );
  };
  upChildParent = (ind, index) => {
    let newList = JSON.parse(JSON.stringify(this.state.childQuestion));
    let newItem = newList[ind].questionMenus[index];

    newList[ind].questionMenus.splice(index, 1);
    newList[ind].questionMenus.splice(index - 1, 0, newItem);
    const dom = document.getElementById(`selectArea${ind}${index - 1}`);
    console.log(dom, "ddom");
    if (dom) {
      dom.style.border = "1px solid rgba(4,69,252,0.25)";
      setTimeout(() => {
        dom.style.border = "";
      }, 500);
    }
    this.setState({
      childQuestion: newList,
    });
  };
  downChildParent = (ind, index) => {
    let newList = JSON.parse(JSON.stringify(this.state.childQuestion));
    let newItem = newList[ind].questionMenus[index];
    newList[ind].questionMenus.splice(index, 1);

    newList[ind].questionMenus.splice(index + 1, 0, newItem);
    const dom = document.getElementById(`selectArea${ind}${index + 1}`);
    if (dom) {
      dom.style.border = "1px solid rgba(4,69,252,0.25)";
      setTimeout(() => {
        dom.style.border = "";
      }, 500);
    }
    this.setState({
      childQuestion: newList,
    });
  };
  deleteChild = (ind) => {
    let newList = JSON.parse(JSON.stringify(this.state.childQuestion));
    newList.splice(ind, 1);
    this.setState({
      childQuestion: newList,
    });
  };
  changeChildOrder = (ind, e) => {
    let newList = JSON.parse(JSON.stringify(this.state.childQuestion));
    newList[ind].isOrder = e.target.checked;
    this.setState({
      childQuestion: newList,
    });
  };
  upChild = (index) => {
    let newList = JSON.parse(JSON.stringify(this.state.childQuestion));
    let newItem = newList[index];
    newList.splice(index, 1);
    newList.splice(index - 1, 0, newItem);
    this.setState({
      childQuestion: newList,
    });
  };
  downChild = (index) => {
    let newList = JSON.parse(JSON.stringify(this.state.childQuestion));
    let newItem = newList[index];
    newList.splice(index, 1);
    console.log(newList, "n1");
    newList.splice(index + 1, 0, newItem);
    this.setState({
      childQuestion: newList,
    });
  };
  //暂存功能
  saveToLocal = (key, value) => {
    window.localStorage.setItem(key, value);
  };

  //清除暂存
  clearToLocal = () => {
    window.localStorage.removeItem("yungu_questionMenus");
    window.localStorage.removeItem("yungu_optionContent");
    window.localStorage.removeItem("yungu_questionContent");
    window.localStorage.removeItem("yungu_analysisContent");
    window.localStorage.removeItem("yungu_answerContent");
    this.completionArr = [];
  };

  //输入题目题干
  fillQuestionContent = (content) => {
    this.setState(
      {
        questionContent: content,
      },
      () => {
        this.saveToLocal("yungu_questionContent", this.state.questionContent);
      },
    );
  };

  fillChildContent = (ind, content) => {
    const newList = JSON.parse(JSON.stringify(this.state.childQuestion));
    newList[ind].content = content;
    this.setState({
      childQuestion: newList,
    });
  };

  fillChildAnalysis = (ind, content) => {
    const newList = JSON.parse(JSON.stringify(this.state.childQuestion));
    newList[ind].analysis = content;
    this.setState({
      childQuestion: newList,
    });
  };

  //输入答案解析
  fillAnalysisContent = (content) => {
    this.setState(
      {
        analysisContent: content,
      },
      () => {
        this.saveToLocal("yungu_analysisContent", this.state.analysisContent);
      },
    );
  };

  //输入答案
  fillAnswerContent = (content) => {
    this.setState(
      {
        answerContent: content,
      },
      () => {
        this.saveToLocal("yungu_answerContent", this.state.answerContent);
      },
    );
  };

  //判断选项内容是否有空
  judgeOption = () => {
    const { optionContent, questionMenus } = this.state;
    let result = false;
    for (const questionMenu of questionMenus) {
      if (optionContent[questionMenu]) {
        result = true;
        break;
      }
    }
    return result;
  };

  judgeOptionChild = (optionContent, questionMenus) => {
    let result = true;
    if (!optionContent || !questionMenus) {
      return (result = false);
    }
    for (const questionMenu of questionMenus) {
      if (optionContent[questionMenu]) {
        result = true;
        break;
      }
    }
    return result;
  };

  //判断题目是否有答案
  isHaveAnswer = () => {
    const { checkedOption } = this.state;
    let result;
    if (JSON.stringify(checkedOption) == "{}") {
      result = false;
    }
    for (let index in checkedOption) {
      if (checkedOption[index] == true) {
        result = true;
      }
    }
    return result;
  };
  isHaveAnswerChild = (checkedOption) => {
    let result;
    if (JSON.stringify(checkedOption) == "{}") {
      result = false;
    }
    for (let index in checkedOption) {
      if (checkedOption[index] == true) {
        result = true;
      }
    }
    return result;
  };

  isLocalSaveMode = () =>
    this.props.saveMode === "local" &&
    typeof this.props.onLocalSave === "function";

  parseSelectedIds = (value) =>
    toSafeArray(value).reduce((result, item) => {
      const rawValue = String(item || "");
      const lastPart = rawValue.split("-").pop();
      const id = /^\d+$/.test(lastPart) ? Number(lastPart) : Number(item);

      if (Number.isFinite(id) && !result.includes(id)) {
        result.push(id);
      }
      return result;
    }, []);

  buildChildDraft = (question, childState) => ({
    analysis: (question && question.analysis) || "",
    answer:
      question && question.answer !== undefined && question.answer !== null
        ? question.answer
        : "",
    chapterIds: this.parseSelectedIds(childState && childState.chapterId),
    chapterLabels: [...toSafeArray(childState && childState.chapterValues)],
    chapterSelections: [...toSafeArray(childState && childState.chapterId)],
    content: (question && question.content) || "",
    gapFillingAnswer: (question && question.gapFillingAnswer) || null,
    indicatorIds: this.parseSelectedIds(childState && childState.indicatorIds),
    indicatorLabels: [...toSafeArray(childState && childState.indicatorValues)],
    knowledgeIds: this.parseSelectedIds(childState && childState.knowledgeIds),
    knowledgeLabels: [...toSafeArray(childState && childState.knowledgeValues)],
    knowledgeSelections: [
      ...toSafeArray(childState && childState.knowledgeIds),
    ],
    optionList: toSafeArray(question && question.optionList),
    questionId:
      question && Number.isFinite(Number(question.questionId))
        ? Number(question.questionId)
        : childState && Number.isFinite(Number(childState.questionId))
          ? Number(childState.questionId)
          : null,
    questionLevel: Number(question && question.questionLevel) || 2,
    questionLevelName: (question && question.questionLevelName) || hardArray[2],
    sonQuestionList: (Array.isArray(question && question.sonQuestionList)
      ? question.sonQuestionList
      : []
    ).map((childQuestion, index) =>
      this.buildChildDraft(
        childQuestion,
        childState && Array.isArray(childState.sonQuestionList)
          ? childState.sonQuestionList[index]
          : null,
      ),
    ),
    type: Number(question && question.type) || 5,
  });

  buildLocalSavePayload = (question, localStateSnapshot) => ({
    draft: {
      analysis: (question && question.analysis) || "",
      answer:
        question && question.answer !== undefined && question.answer !== null
          ? question.answer
          : "",
      chapterIds: this.parseSelectedIds(localStateSnapshot.chapterSelections),
      chapterLabels: [...toSafeArray(localStateSnapshot.chapterLabels)],
      chapterSelections: [...toSafeArray(localStateSnapshot.chapterSelections)],
      content: (question && question.content) || "",
      gapFillingAnswer: (question && question.gapFillingAnswer) || null,
      gradeId: localStateSnapshot.gradeValue,
      indicatorIds: this.parseSelectedIds(
        localStateSnapshot.indicatorSelections,
      ),
      indicatorLabels: [...toSafeArray(localStateSnapshot.indicatorLabels)],
      knowledgeIds: this.parseSelectedIds(
        localStateSnapshot.knowledgeSelections,
      ),
      knowledgeLabels: [...toSafeArray(localStateSnapshot.knowledgeLabels)],
      knowledgeSelections: [
        ...toSafeArray(localStateSnapshot.knowledgeSelections),
      ],
      optionList: toSafeArray(question && question.optionList),
      optionKnowledgeSelections: Array.isArray(
        localStateSnapshot.optionKnowledgeSelections,
      )
        ? localStateSnapshot.optionKnowledgeSelections.map((selection) =>
            Array.isArray(selection) ? [...selection] : [],
          )
        : [],
      questionId:
        this.props.editQuestion &&
        Number.isFinite(Number(this.props.editQuestion.questionId))
          ? Number(this.props.editQuestion.questionId)
          : null,
      questionLevel: Number(question && question.questionLevel) || 2,
      questionLevelName:
        (question && question.questionLevelName) ||
        hardArray[Number(question && question.questionLevel) || 2],
      sonQuestionList: (Array.isArray(question && question.sonQuestionList)
        ? question.sonQuestionList
        : []
      ).map((childQuestion, index) =>
        this.buildChildDraft(
          childQuestion,
          Array.isArray(localStateSnapshot.childQuestionState)
            ? localStateSnapshot.childQuestionState[index]
            : null,
        ),
      ),
      subjectId: localStateSnapshot.subjectValue,
      type: Number(question && question.type) || 5,
    },
  });

  //导入试题
  importQuestion = () => {
    const { dispatch } = this.props;
    const {
      gradeValue,
      subjectValue,
      questionContent,
      optionContent,
      checkedOption,
      questionType,
      judgeId,
      analysisContent,
      childQuestion,
      hardValue,
    } = this.state;
    const localStateSnapshot = {
      chapterLabels: [...toSafeArray(this.state.chapterValues)],
      chapterSelections: this.state.chapterIds,
      childQuestionState: JSON.parse(JSON.stringify(this.state.childQuestion)),
      gradeValue,
      indicatorSelections: [...toSafeArray(this.state.selectLabel)],
      indicatorLabels: [...toSafeArray(this.state.indicatorValues)],
      knowledgeSelections: [...toSafeArray(this.state.selectTree)],
      knowledgeLabels: [...toSafeArray(this.state.selectTreeValue)],
      optionKnowledgeSelections: Array.isArray(this.state.selectTreeList)
        ? this.state.selectTreeList.map((selection) =>
            Array.isArray(selection) ? [...selection] : [],
          )
        : [],
      subjectValue,
    };
    console.log(canSave, "canSave");

    if (!canSave) return false;

    console.log(childQuestion, "qquu");
    if (!gradeValue || !subjectValue) {
      message.info(trans("batchInpt.message1", "年级、学科缺一不可哦~"));
      return false;
    }
    if (!questionContent) {
      message.info(trans("singleInput.fillQuestion", "请输入题目"));
      return false;
    }
    if (questionType == 4 && !judgeId) {
      message.info(trans("singleInput.setAnswer", "请设置题目答案哦~"));
      return false;
    }
    if (
      questionType == 1 ||
      questionType == 2 ||
      questionType == 7 ||
      questionType == 8
    ) {
      if (!this.judgeOption() || JSON.stringify(optionContent) == "{}") {
        message.info(trans("singleInput.fillOption", "选项内容不能为空哦~"));
        return false;
      }
      if (!this.isHaveAnswer() && questionType != 7 && questionType != 8) {
        message.info(trans("singleInput.setAnswer", "请设置题目答案哦~"));
        return false;
      }
      if (this.handleAnswer().length > 1 && questionType == 1) {
        message.info(
          trans(
            "singleInput.answerError",
            "您编辑的是单选题，答案仅能设置一项哦~",
          ),
        );
        return false;
      }
    }

    let payloadObject = {};
    payloadObject.subjectId = subjectValue;
    payloadObject.gradeId = gradeValue;
    payloadObject.questionList = this.serializeFn();
    let ifChildOk = true;
    console.log(childQuestion, "childQuestion");
    if (childQuestion && childQuestion.length > 0 && questionType == 6) {
      childQuestion.map((item) => {
        if (
          item.type == 3 &&
          (!item.completionArr || item.completionArr.length === 0)
        ) {
          message.info(trans("singleInput.setAnswer", "请设置题目答案哦~"));
          return (ifChildOk = false);
        }
        if (item.type == 4 && !item.judgeId) {
          message.info(trans("singleInput.setAnswer", "请设置题目答案哦~"));
          return (ifChildOk = false);
        }
        if (item.type == 1 || item.type == 2) {
          if (
            !this.judgeOptionChild(item.optionContent, item.questionMenus) ||
            JSON.stringify(item.optionContent) == "{}"
          ) {
            message.info(
              trans("singleInput.fillOption", "选项内容不能为空哦~"),
            );
            return (ifChildOk = false);
          }
          if (!this.isHaveAnswerChild(item.checkedOption)) {
            message.info(trans("singleInput.setAnswer", "请设置题目答案哦~"));
            return (ifChildOk = false);
          }
          if (this.handleAnswerChild(item).length > 1 && item.type == 1) {
            message.info(
              trans(
                "singleInput.answerError",
                "您编辑的是单选题，答案仅能设置一项哦~",
              ),
            );
            return (ifChildOk = false);
          }
        }
        item = this.serializeChildFn(item);

        console.log(item, "1112");
      });
      payloadObject.questionList[0].sonQuestionList = childQuestion;
    }
    if (!ifChildOk) {
      return false;
    }
    if (this.isLocalSaveMode()) {
      this.props.onLocalSave(
        this.buildLocalSavePayload(
          payloadObject.questionList[0],
          localStateSnapshot,
        ),
      );
      message.success(trans("newMyQuestion.operationSuccess", "操作成功"));
      this.props.cancelModal && this.props.cancelModal();
      this.clearToLocal();
      return true;
    }
    canSave = false;
    let newTreeList = [];
    if (this.state.selectTree.length > 0) {
      this.state.selectTree.map((item) => {
        let a = item.split("-");
        newTreeList.push(Number.parseInt(item.split("-")[a.length - 1], 10));
      });
    }
    payloadObject.indicatorIds = this.state.selectLabel;
    payloadObject.knowledgeIds = newTreeList;
    payloadObject.knowledgeValues = this.state.selectTree;
    let newChapter = [];
    if (this.state.chapterIds.length > 0) {
      let a = this.state.chapterIds.split("-");
      newChapter.push(
        Number.parseInt(this.state.chapterIds.split("-")[a.length - 1], 10),
      );
    }
    payloadObject.chapterIds = newChapter;
    payloadObject.chapterValues = this.state.chapterValues;
    dispatch({
      type: "inputQuestion/importQuestion",
      payload: this.getRecruitQuestionPayload(payloadObject),
      onSuccess: (ids) => {
        // 这里将canSave重置，避免canSave重置不及时而页面已经被销毁
        canSave = true;
        console.log(this.props.ifEdit, "this.props.ifEdit");
        message.success(trans("newMyQuestion.operationSuccess", "操作成功"));
        if (this.props.ifEdit) {
          //编辑状态
          this.props.cancelModal && this.props.cancelModal(ids[0]);
          this.props.updateItem &&
            this.props.updateItem(this.props.editQuestion.questionId);
          // this.hideSuccessModal();
        } else {
          this.setState({
            importType: 0, //保存到试题篮
          });
        }
        this.clearQuestionContent();
      },
    }).then(() => {
      canSave = true;
      this.clearToLocal();
    });
  };

  clearQuestionContent = () => {
    this.setState({
      questionContent: "", //题干
      analysisContent: "", //答案解析
      answerContent: "", //  问答题选项
      questionMenus: [0, 1, 2, 3],
      optionContent: {}, //选项内容
      checkedOption: {}, //选中的答案
      judgeId: null, //判断题答案
      childQuestion: [], //子题
    });
    // this.completionArr = {}
  };

  //导入试题到试题篮
  importQuestionBasket = () => {
    const { dispatch } = this.props;
    const {
      // sectionValue,
      gradeValue,
      subjectValue,
      questionContent,
      optionContent,
      checkedOption,
      questionType,
      judgeId,
      analysisContent,
      childQuestion,
      hardValue,
    } = this.state;

    if (!canSaveBasket) return false;
    if (!gradeValue || !subjectValue) {
      message.info(trans("batchInpt.message1", "年级、学科缺一不可哦~"));
      return false;
    }
    if (!questionContent) {
      message.info(trans("singleInput.fillQuestion", "请输入题目"));
      return false;
    }

    if (questionType == 3 && this.completionArr.length === 0) {
      message.info(trans("singleInput.setAnswer", "请设置题目答案哦~"));
      return false;
    }
    if (questionType == 4 && !judgeId) {
      message.info(trans("singleInput.setAnswer", "请设置题目答案哦~"));
      return false;
    }
    if (questionType == 1 || questionType == 2) {
      if (!this.judgeOption() || JSON.stringify(optionContent) == "{}") {
        message.info(trans("singleInput.fillOption", "选项内容不能为空哦~"));
        return false;
      }
      if (!this.isHaveAnswer()) {
        message.info(trans("singleInput.setAnswer", "请设置题目答案哦~"));
        return false;
      }
      if (this.handleAnswer().length > 1 && questionType == 1) {
        message.info(
          trans(
            "singleInput.answerError",
            "您编辑的是单选题，答案仅能设置一项哦~",
          ),
        );
        return false;
      }
    }

    let payloadObject = {};
    payloadObject.subjectId = subjectValue;
    payloadObject.gradeId = gradeValue;
    payloadObject.questionList = this.serializeFn();
    let ifChildOk = true;
    if (childQuestion && childQuestion.length > 0 && questionType == 6) {
      childQuestion.map((item) => {
        if (
          item.type == 3 &&
          (!item.completionArr || item.completionArr.length === 0)
        ) {
          message.info(trans("singleInput.setAnswer", "请设置题目答案哦~"));
          return (ifChildOk = false);
        }
        if (item.type == 4 && !item.judgeId) {
          message.info(trans("singleInput.setAnswer", "请设置题目答案哦~"));
          return (ifChildOk = false);
        }
        if (item.type == 1 || item.type == 2) {
          if (
            !this.judgeOptionChild(item.optionContent, item.questionMenus) ||
            JSON.stringify(item.optionContent) == "{}"
          ) {
            message.info(
              trans("singleInput.fillOption", "选项内容不能为空哦~"),
            );
            return (ifChildOk = false);
          }
          if (!this.isHaveAnswerChild(item.checkedOption)) {
            message.info(trans("singleInput.setAnswer", "请设置题目答案哦~"));
            return (ifChildOk = false);
          }
          if (this.handleAnswerChild(item).length > 1 && item.type == 1) {
            message.info(
              trans(
                "singleInput.answerError",
                "您编辑的是单选题，答案仅能设置一项哦~",
              ),
            );
            return (ifChildOk = false);
          }
        }
        item = this.serializeChildFn(item);

        console.log(item, "1112");
      });

      payloadObject.questionList[0].sonQuestionList = childQuestion;
    }
    if (!ifChildOk) {
      return false;
    }
    canSaveBasket = false;
    let newTreeList = [];
    if (this.state.selectTree.length > 0) {
      this.state.selectTree.map((item) => {
        let a = item.split("-");
        newTreeList.push(Number.parseInt(item.split("-")[a.length - 1], 10));
      });
    }
    payloadObject.indicatorIds = this.state.selectLabel;
    payloadObject.knowledgeIds = newTreeList;
    payloadObject.knowledgeValues = this.state.selectTree;

    let newChapter = [];
    if (this.state.chapterIds.length > 0) {
      let a = this.state.chapterIds.split("-");
      newChapter.push(
        Number.parseInt(this.state.chapterIds.split("-")[a.length - 1], 10),
      );
    }
    payloadObject.chapterIds = newChapter;
    payloadObject.chapterValues = this.state.chapterValues;
    dispatch({
      type: "inputQuestion/importQuestionBasket",
      payload: this.getRecruitQuestionPayload(payloadObject),
      onSuccess: () => {
        message.success(trans("newMyQuestion.operationSuccess", "操作成功"));
        if (this.props.ifEdit) {
          this.props.cancelModal();
          this.props.updateItem(this.props.editQuestion.questionId);
          // this.hideSuccessModal();
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
            // successVisible: true,
            importType: 1, //保存到试题篮
          });
        }
        this.clearQuestionContent();
      },
    }).then(() => {
      canSaveBasket = true;
      this.clearToLocal();
    });
  };

  //整理题目
  serializeFn = () => {
    const {
      questionContent,
      questionType,
      analysisContent,
      answerContent,
      hardValue,
      checkedOption,
      completionSwitch,
    } = this.state;

    let questionList = {};
    questionList.type = questionType; //题型（1：单选 2： 多选）
    questionList.analysis = analysisContent; //答案解析
    questionList.content = questionContent; //题干
    questionList.questionLevel = hardValue; //题目难易程度
    questionList.questionLevelName = hardArray[hardValue]; //题目难易程度文本
    if (this.state.questionType == 4) {
      questionList.optionList = [];
    } else if (this.state.questionType == 3) {
      questionList.optionList = [];
    } else if (this.state.questionType == 5) {
      questionList.optionList = [];
    } else if (this.state.questionType === 6) {
      questionList.optionList = [];
    } else {
      questionList.optionList = this.handleOption();
    }
    let array = [];
    this.completionArr.map((item, ind) => {
      if (Array.isArray(item)) {
        array.push(item.join("&&"));
      } else {
        array.push(item);
      }
    });
    console.log(array, "555");
    let gapFillingAnswer = {
      isOrder: !completionSwitch,
      answers: array,
    };
    if (this.state.questionType == 5) {
      // questionList.coreKey = this.state.coreKey;
      // questionList.generalKey = this.state.generalKey;
    }
    if (this.state.questionType == 3) {
      questionList.gapFillingAnswer = gapFillingAnswer;
    }
    if (this.state.questionType == 3) {
      questionList.answer = null;
    } else if (this.state.questionType === 6) {
      questionList.answer = "";
    } else {
      questionList.answer = this.handleAnswer();
    }
    // console.log(questionList.answer, "aaa");
    if (this.props.editQuestion && !this.props.isAdapt) {
      questionList.questionId = this.props.editQuestion.questionId; //题目id
    }
    return [questionList];
  };
  serializeChildFn = (item) => {
    const {
      questionContent,
      questionType,
      analysisContent,
      answerContent,
      hardValue,
      checkedOption,
      completionSwitch,
    } = this.state;

    let questionList = item;

    questionList.questionLevelName = hardArray[questionList.questionLevel]; //题目难易程度文本
    if (item.type == 4) {
      questionList.optionList = [];
    } else if (item.type == 3) {
      questionList.optionList = [];
    } else if (item.type == 5) {
      questionList.optionList = [];
    } else {
      questionList.optionList = this.handleOptionChild(
        item,
        item.optionContent,
        item.questionMenus,
      );
    }
    let array = [];
    item.completionArr &&
      item.completionArr.map((item, ind) => {
        if (Array.isArray(item)) {
          array.push(item.join("&&"));
        } else {
          array.push(item);
        }
      });
    console.log(array, "555");
    let gapFillingAnswer = {
      isOrder: !item.isOrder,
      answers: array,
    };
    let newChapter = [];
    if (item.chapterId && item.chapterId.length > 0) {
      let a = item.chapterId.split("-");
      newChapter.push(
        Number.parseInt(item.chapterId.split("-")[a.length - 1], 10),
      );
    }
    item.chapterId = newChapter;
    let newKnowLEdge = [];
    if (item.knowledgeIds && item.knowledgeIds.length > 0) {
      item.knowledgeIds.map((item) => {
        let a = item.split("-");
        newKnowLEdge.push(Number.parseInt(item.split("-")[a.length - 1], 10));
      });
    }

    item.knowledgeIds = newKnowLEdge;
    if (item.type == 3) {
      questionList.gapFillingAnswer = gapFillingAnswer;
    }
    questionList.answer = item.type == 3 ? null : this.handleAnswerChild(item);
    if (this.props.editQuestion && !this.props.isAdapt) {
      questionList.questionId = item.questionId; //题目id
    }
    return questionList;
  };

  //处理选项
  handleOption = () => {
    const { optionContent, questionMenus, checkedOption } = this.state;
    console.log(optionContent, questionMenus, "asasa");
    let optionResult = [];
    let array = JSON.parse(JSON.stringify(questionMenus));
    let object1 = JSON.parse(JSON.stringify(optionContent));
    let checked = JSON.parse(JSON.stringify(checkedOption));

    for (let index = array.length - 1; index >= 0; index--) {
      if (!optionContent[array[index]]) {
        console.log(object1, array[index], object1[array[index]], "asas");
        array.splice(index, 1);
        delete checked[array[index]];
      }
    }
    console.log();
    for (const [index, element] of array.entries()) {
      let newTreeList = [];
      if (
        this.state.selectTreeList[element] &&
        this.state.selectTreeList[element].length > 0
      ) {
        this.state.selectTreeList[element].map((item) => {
          newTreeList.push(Number.parseInt(item.split("-")[1], 10));
        });
      }
      let object = {
        key: optionItem[index],
        answers: `${optionItem[index]}.${object1[element] || ""}`,
        knowledgeIds: newTreeList,
      };
      optionResult.push(object);
    }
    this.setState({
      questionMenus: array,
      optionContent: object1,
      checkedOption: checked,
    });
    return optionResult;
  };
  handleOptionChild = (item, optionContent, questionMenus) => {
    let optionResult = [];

    let array = JSON.parse(JSON.stringify(item.questionMenus));
    let object1 = JSON.parse(JSON.stringify(item.optionContent));
    let checked = JSON.parse(JSON.stringify(item.checkedOption));
    for (let index = array.length - 1; index >= 0; index--) {
      if (!item.optionContent[array[index]]) {
        array.splice(index, 1);
        delete checked[array[index]];
      }
    }
    for (const [index, element] of array.entries()) {
      let newTreeList = [];

      let object = {
        key: optionItem[index],
        answers: `${optionItem[index]}.${object1[element] || ""}`,
        knowledgeIds: newTreeList,
      };
      optionResult.push(object);
    }
    return optionResult;
  };
  knowledgeChange = (value, label, extra) => {
    this.setState({
      selectTree: value,
      selectTreeValue: label,
    });
  };
  childKnowledgeChange = (ind, value, label, extra) => {
    let newList = JSON.parse(JSON.stringify(this.state.childQuestion));
    newList[ind].knowledgeIds = value;
    newList[ind].knowledgeValues = label;
    this.setState({
      childQuestion: newList,
    });
  };
  chapterChange = (value, label) => {
    this.setState({
      chapterIds: value,
      chapterValues: label,
    });
  };
  childChapterChange = (ind, value, label) => {
    let newList = JSON.parse(JSON.stringify(this.state.childQuestion));
    newList[ind].chapterId = value;
    newList[ind].chapterValues = label;
    this.setState({
      childQuestion: newList,
    });
  };
  delKnowledge = (ind) => {
    let newSe = JSON.parse(JSON.stringify(this.state.selectTree));
    let newValue = JSON.parse(JSON.stringify(this.state.selectTreeValue));
    newSe.splice(ind, 1);
    newValue.splice(ind, 1);
    this.setState({
      selectTree: newSe,
      selectTreeValue: newValue,
    });
  };
  delChildKnowledge = (ind, inde) => {
    let newList = JSON.parse(JSON.stringify(this.state.childQuestion));
    newList[ind].knowledgeIds.splice(inde, 1);
    newList[ind].knowledgeValues.splice(inde, 1);

    this.setState({
      childQuestion: newList,
    });
  };
  delChapter = (ind) => {
    this.setState({
      chapterIds: "",
      chapterValues: [],
    });
  };
  delChildChapter = (ind, inde) => {
    let newList = JSON.parse(JSON.stringify(this.state.childQuestion));
    newList[ind].chapterId = "";
    newList[ind].chapterValues = [];
    this.setState({
      childQuestion: newList,
    });
  };
  delInd = (ind) => {
    let newSe = JSON.parse(JSON.stringify(this.state.selectLabel));
    let newValue = JSON.parse(JSON.stringify(this.state.indicatorValues));
    newSe.splice(ind, 1);
    newValue.splice(ind, 1);
    this.setState({
      selectLabel: newSe,
      indicatorValues: newValue,
    });
  };
  delChildInd = (ind, inde) => {
    let newList = JSON.parse(JSON.stringify(this.state.childQuestion));

    newList[ind].indicatorIds.splice(inde, 1);
    newList[ind].indicatorValues.splice(inde, 1);
    this.setState({
      childQuestion: newList,
    });
  };
  knowledgeChangeOption = (item, value) => {
    console.log(item, value);
    let newList = JSON.parse(JSON.stringify(this.state.selectTreeList));
    newList[item] = value;
    this.setState({
      selectTreeList: newList,
    });
  };
  labelChange = (value, label) => {
    this.setState({
      selectLabel: value,
      indicatorValues: label,
    });
  };
  childLabelChange = (ind, value, label) => {
    let newList = JSON.parse(JSON.stringify(this.state.childQuestion));
    newList[ind].indicatorIds = value;
    newList[ind].indicatorValues = label;
    this.setState({
      childQuestion: newList,
    });
  };
  //处理答案
  handleAnswer = () => {
    if (this.state.questionType == 4) {
      if (this.state.judgeId == 1) {
        return true;
      }
      if (this.state.judgeId == 2) {
        return false;
      }
    } else if (this.state.questionType == 5) {
      let a = this.state.answerContent;
      let b = a;
      if (a && a.includes("<p>")) {
        b = a.slice(3);
        b = b.slice(0, Math.max(0, b.length - 4));
      }
      return b;
    } else {
      const { checkedOption, questionMenus, optionContent } = this.state;
      let array = JSON.parse(JSON.stringify(questionMenus));
      let checked = JSON.parse(JSON.stringify(checkedOption));

      for (let index = array.length - 1; index >= 0; index--) {
        if (!optionContent[array[index]]) {
          array.splice(index, 1);
        }
      }
      let answer = "";
      for (let index in checked) {
        if (checked[index] == true) {
          let option = optionItem[array.indexOf(Number(index))];
          answer += option;
        }
      }
      //答案排序
      let sortAnswer = answer ? answer.split("").sort() : [];
      return sortAnswer.join("");
    }
  };
  handleAnswerChild = (item) => {
    if (item.type == 4) {
      if (item.judgeId == 1) {
        return true;
      }
      if (item.judgeId == 2) {
        return false;
      }
    } else if (item.type == 5) {
      let a = item.answer;
      let b = a;
      if (a && a.includes("<p>")) {
        b = a.slice(3);
        b = b.slice(0, Math.max(0, b.length - 4));
      }
      return b;
    } else {
      let answer = "";
      let array = JSON.parse(JSON.stringify(item.questionMenus));
      let checked = JSON.parse(JSON.stringify(item.checkedOption));
      for (let index = array.length - 1; index >= 0; index--) {
        if (!item.optionContent[array[index]]) {
          array.splice(index, 1);
        }
      }
      for (let index in item.checkedOption) {
        if (item.checkedOption[index] == true) {
          let option = optionItem[array.indexOf(Number(index))];
          answer += option;
        }
      }
      //答案排序
      let sortAnswer = answer ? answer.split("").sort() : "";
      return sortAnswer.join("");
    }
  };

  //继续录入试题
  hideSuccessModal = () => {
    this.setState(
      {
        // successVisible: false,
        // questionType: undefined,
      },
      () => {
        this.resetQuestion();
        // this.setState({
        //   questionType: 1,
        // });
        this.clearToLocal();
        // if (this.props.ifEdit !== true) {
        //   window.location.reload();
        // }
      },
    );
  };

  //去我的题库查看
  goToMyQuestion = () => {
    this.props.dispatch(routerRedux.push(this.getMyQuestionPath()));
  };

  //关闭弹窗
  closeModal = () => {
    this.resetQuestion();
    this.clearToLocal();
    window.location.reload();
  };

  back = () => {
    this.props.cancelModal();
    this.resetQuestion();
    this.clearToLocal();
  };

  //进入编辑题干
  editQuestionContent = () => {
    this.setState(
      {
        isEditContent: true,
        isEditOption: {},
        isEditAnalysis: false,
        isEditAnswer: false,
      },
      () => {
        this.focusEditor();
      },
    );
  };
  editChildContent = (ind) => {
    const newState = JSON.parse(JSON.stringify(this.state));
    newState[`childContent${ind}`] = true;
    this.setState(
      {
        ...newState,
      },
      () => {
        console.log(this.state, "112");
      },
    );
  };
  editChildAnalysis = (ind) => {
    const newState = JSON.parse(JSON.stringify(this.state));
    newState[`childAnalysis${ind}`] = true;
    this.setState(
      {
        ...newState,
      },
      () => {
        console.log(this.state, "112");
      },
    );
  };
  //进入编辑解析
  editAnalysis = () => {
    this.setState(
      {
        isEditContent: false,
        isEditOption: {},
        isEditAnalysis: true,
        isEditAnswer: false,
      },
      () => {
        this.focusEditor();
      },
    );
  };
  checkChild = (ind) => {
    this.setState(
      {
        childItem: ind,
      },
      () => {
        const dom = document.getElementById(
          `childQuestion${this.state.childItem}`,
        );
        dom.scrollIntoView({ behavior: "smooth", block: "center" });
      },
    );
  };
  //进入编辑答案
  editAnswer = () => {
    this.setState(
      {
        isEditContent: false,
        isEditOption: {},
        isEditAnalysis: false,
        isEditAnswer: true,
      },
      () => {
        this.focusEditor();
      },
    );
  };

  //编辑题目失去焦点
  blurEditContent = () => {
    setTimeout(() => {
      this.setState({
        isEditContent: false, //是否编辑题目内容
      });
    }, 500);
  };
  blurChildContent = (ind) => {
    setTimeout(() => {
      const newState = JSON.parse(JSON.stringify(this.state));
      newState[`childContent${ind}`] = false;
      this.setState({
        ...newState,
      });
    }, 100);
  };
  blurChildAnalysis = (ind) => {
    const newState = JSON.parse(JSON.stringify(this.state));
    newState[`childAnalysis${ind}`] = false;
    this.setState({
      ...newState,
    });
  };
  //编辑解析失去焦点
  blurEditAnalysis = () => {
    this.setState({
      isEditAnalysis: false, //是否编辑解析内容
    });
  };
  //答案失去焦点
  blurEditAnswer = () => {
    this.setState({
      isEditAnswer: false, //是否编辑答案内容
    });
  };
  blurChildEditAnswer = (ind) => {
    let newList = JSON.parse(JSON.stringify(this.state.childQuestion));
    ((newList[ind].isEditAnswer = false),
      this.setState({
        childQuestion: newList, //是否编辑答案内容
      }));
  };

  fillChildAnswerContent = (ind, content) => {
    let newList = JSON.parse(JSON.stringify(this.state.childQuestion));
    ((newList[ind].answer = content),
      this.setState({
        childQuestion: newList, //是否编辑答案内容
      }));
  };
  editChildAnswer = (ind) => {
    let newList = JSON.parse(JSON.stringify(this.state.childQuestion));
    ((newList[ind].isEditAnswer = true),
      this.setState({
        childQuestion: newList, //是否编辑答案内容
      }));
  };
  //填空题答案乱序开关
  onChangeCompletion = (e) => {
    this.setState({
      completionSwitch: e.target.checked,
    });
  };

  //编辑选项失去焦点
  blurEditOption = (item) => {
    setTimeout(() => {
      console.log("come2");
      let isEditOption = JSON.parse(JSON.stringify(this.state.isEditOption));
      console.log(isEditOption[item], isEditOption, "come2");
      isEditOption[item] = false;
      console.log(isEditOption, this.state.isEditOption, "come3");
      //
      this.setState(
        {
          isEditOption, //是否进入编辑选项的模式
        },
        () => {
          console.log(this.state.isEditOption, "come5");
        },
      );
    }, 1000);
  };
  clickKnow = () => {
    console.log(
      this.selectRef.current,
      this.selectRef.context,
      this.selectRef,
      "sdsd",
    );
  };
  render() {
    const {
      sectionList,
      allGradeList,
      subjectList,
      importMsg,
      importBasketMsg,
      treeData,
      labelList,
      ifEdit,
    } = this.props;
    const {
      gradeValue,
      // sectionValue,
      subjectValue,
      hardValue,
      questionType,
      importType,
      questionContent,
      analysisContent,
      answerContent,
      isEditContent,
      isEditAnalysis,
      selectTreeValue,
      selectLabel,
      indicatorValues,
      chapterValues,
      childQuestion,
    } = this.state;
    const isDrawerMode = this.props.layoutMode === "drawer";
    const difficulty = [
      { key: 1, name: trans("global.easy", "简单") },
      { key: 2, name: trans("global.general", "普通") },
      { key: 3, name: trans("global.difficult", "困难") },
    ];
    console.log(selectLabel, selectTreeValue, this.props.chapterList, "jjj");
    let newTree = [];
    const lProperties = {
      treeData: labelList,
      value: this.state.selectLabel,
      onChange: this.labelChange,
      className: styles.fieldControl,
      treeCheckable: true,
      showCheckedStrategy: SHOW_PARENT,
      placeholder: trans("global.pleaseChoose", "请选择"),
      showSearch: true,
    };
    treeData &&
      treeData.length &&
      treeData.map((item) => {
        newTree.push({
          title: item.text,
          value: `${item.text}-${item.pinyin || ""}-${item.id}`,
          // value: item.text,
          key: JSON.stringify(item.id),
          children: item.children,
        });
      });
    newTree.length &&
      newTree.map((item) => {
        if (item.children && item.children.length > 0) {
          item.children.map((index) => {
            index.title = index.text;
            index.value = `${index.text}-${index.pinyin || ""}-${index.id}`;
            // i.value = i.text;
            index.key = JSON.stringify(index.id);
            if (index.children && index.children.length > 0) {
              index.children.map((it) => {
                it.title = it.text;
                it.value = `${it.text}-${it.pinyin || ""}-${it.id}`;
                // it.value = it.text;
                it.key = JSON.stringify(it.id);
                if (it.children && it.children.length > 0) {
                  it.children.map((ite) => {
                    ite.title = ite.text;
                    ite.value = `${ite.text}-${ite.pinyin || ""}-${ite.id}`;
                    // ite.value = ite.text;
                    ite.key = JSON.stringify(ite.id);
                    if (ite.children && ite.children.length > 0) {
                      ite.children.map((et) => {
                        et.title = et.text;
                        et.value = `${et.text}-${et.pinyin || ""}-${et.id}`;
                        // et.value = et.text;
                        et.key = JSON.stringify(et.id);
                      });
                    }
                  });
                }
              });
            }
          });
        }
      });

    const tProperties = {
      treeData: newTree,
      value: this.state.selectTree,
      onChange: this.knowledgeChange,
      className: styles.fieldControl,
      treeCheckable: true,
      showCheckedStrategy: SHOW_PARENT,
      placeholder: trans("global.pleaseChoose", "请选择"),
      getPopupContainer: () => document.querySelector("#singleInput"),
    };

    return (
      <div
        className={[
          styles.singleContent,
          isDrawerMode ? styles.drawerMode : "",
        ].join(" ")}
        style={{
          marginTop: isDrawerMode ? 0 : this.props.ifEdit ? "60px" : "12px",
        }}
        id="singleInput"
      >
        {this.props.ifEdit ? (
          <div className={styles.header}>
            <i
              className={`${icon.iconfont} ${styles.backButton}`}
              onClick={this.back}
            >
              &#xe6a9;
            </i>
            {isDrawerMode ? (
              <span
                className={styles.headerSaveButton}
                onClick={this.importQuestion}
              >
                {trans("global.save", "保存")}
              </span>
            ) : null}
          </div>
        ) : null}
        {isDrawerMode && this.props.ifEdit ? null : (
          <div className={styles.questionType}>
            <div className={styles.conditionArea}>
              <div className={styles.conditionTop}>
                <div
                  className={[
                    styles.choice,
                    this.props.ifEdit ? styles.bjChoice : "",
                  ].join(" ")}
                >
                  <>
                    <div className={styles.knowledgePoints}></div>
                    <div className={styles.accomplishment}></div>
                  </>
                </div>
                {this.props.ifEdit ? (
                  <div className={styles.operBtn}>
                    <span
                      className={styles.blueBtn1}
                      onClick={this.importQuestion}
                    >
                      {trans("global.save", "保存")}
                    </span>
                  </div>
                ) : (
                  <div className={styles.operBtn}>
                    <span
                      className={styles.whiteBtn}
                      onClick={this.importQuestion}
                    >
                      {trans("batchInput.saveToExam", "保存到题库")}
                    </span>
                    <span
                      className={styles.blueBtn}
                      onClick={this.importQuestionBasket}
                    >
                      {trans("batchInput.saveToBasket", "保存并加入试题篮")}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        <div className={styles.newSingleArea}>
          <div className={styles.leftQuestion}>
            <div className={styles.questionArea}>
              <p className={styles.questionTips}>
                {questionType === 6 ? (
                  <span>
                    {trans("singleInput.adminquestionTips1", "主题干描述")}
                  </span>
                ) : (
                  <span>{trans("singleInput.questionTips1", "题干描述")}</span>
                )}
              </p>
              {isEditContent == true ? (
                <BraftEditor
                  focus={true}
                  onRef={this.onRef}
                  blue={true}
                  braftType="questionContent"
                  blurEdit={this.blurEditContent}
                  initContent={questionContent}
                  questionType={questionType}
                  changeFill={this.fillQuestionContent}
                />
              ) : questionContent ? (
                <div
                  className={styles.fillContent}
                  dangerouslySetInnerHTML={{ __html: questionContent }}
                  onClick={this.editQuestionContent}
                ></div>
              ) : (
                <div
                  onClick={this.editQuestionContent}
                  className={styles.fillMessage}
                >
                  {trans("global.clickInput", "点此输入内容")}
                </div>
              )}
            </div>
            <div className={styles.questionArea}>
              {questionType == 1 || questionType == 2 ? (
                <p className={styles.questionTips}>
                  <span>{trans("singleInput.questionTips3", "选项描述")}</span>
                  <em>
                    {trans(
                      "singleInput.questionTips4",
                      "单选或多选的选项数2-10个之间，必填，不用输入ABCD的序号，系统会自动生成",
                    )}
                  </em>
                </p>
              ) : questionType == 3 ? (
                <p className={styles.questionTips}>
                  <span>{trans("global.answer", "选项描述")}</span>
                  <span className={styles.orderTips}>
                    <Checkbox
                      checked={this.state.completionSwitch}
                      onChange={this.onChangeCompletion}
                    >
                      {trans(
                        "singleInput.allowAnswerOrderMismatch",
                        "允许学生答案与参考答案顺序不一致",
                      )}
                    </Checkbox>
                  </span>
                </p>
              ) : questionType == 4 ? (
                <p className={styles.questionTips}>
                  <span>{trans("singleInput.questionTips3", "选项描述")}</span>
                  <em>
                    {trans("global.chooseRightOrWrong", "选择正确或错误")}
                  </em>
                </p>
              ) : questionType == 5 ? (
                <p className={styles.questionTips}>
                  <span>{trans("global.answer", "答案")}</span>
                </p>
              ) : questionType == 6 ? (
                <p className={styles.questionTips}>
                  <span>{trans("global.childQuestion", "子试题")}</span>
                </p>
              ) : null}
              {this.renderQuestionOption(questionType)}
              {questionType !== 4 &&
              questionType !== 5 &&
              questionType !== 6 ? (
                <div
                  className={styles.addOptionBtn}
                  onClick={this.addSelectOption}
                >
                  <i className={icon.iconfont}>&#xe75a;</i>
                  {questionType === 3 ? (
                    <span>
                      {trans("global.add")}
                      {trans("global.answer", "选项")}
                    </span>
                  ) : (
                    <span>
                      {trans("global.add")}
                      {trans("global.xuanxiang", "选项")}
                    </span>
                  )}
                </div>
              ) : null}
            </div>
            <div className={styles.questionArea}>
              <p className={styles.questionTips}>
                {trans("singleInput.analysis", "答案解析")}{" "}
                <em>{trans("singleInput.noRequired", "非必填项")}</em>
              </p>
              <div className={styles.analysisArea}>
                {isEditAnalysis == true ? (
                  <BraftEditor
                    onRef={this.onRef}
                    blue={true}
                    focus={true}
                    braftType="analysisContent"
                    blurEdit={this.blurEditAnalysis}
                    initContent={analysisContent}
                    changeFill={this.fillAnalysisContent}
                    questionType={questionType}
                  />
                ) : analysisContent ? (
                  <div
                    className={styles.fillAnalysis}
                    dangerouslySetInnerHTML={{ __html: analysisContent }}
                    onClick={this.editAnalysis}
                  ></div>
                ) : (
                  <div
                    className={[styles.fillAnalysis, styles.noContent].join(
                      " ",
                    )}
                    onClick={this.editAnalysis}
                  >
                    {trans("singleInput.clickToEnterContent", "点此输入内容")}
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className={styles.rightOption}>
            <div className={styles.optionTitle}>
              {trans("global.scope", "范围")}
            </div>
            <div
              className={[styles.optionRow, styles.scopeRow].join(" ")}
              style={{ marginBottom: "14px" }}
            >
              <Select
                className={[styles.selectStyle, styles.rangeSelect].join(" ")}
                onChange={this.changeGrade}
                value={gradeValue}
                placeholder={trans("global.grade", "年级")}
              >
                {allGradeList &&
                  allGradeList.length > 0 &&
                  allGradeList.map((item) => (
                    <Option value={item.gradeId} key={item.gradeId}>
                      <a title={item.name} className={styles.subjectName}>
                        {item.name}
                      </a>
                    </Option>
                  ))}
              </Select>
              <Select
                className={[styles.selectStyle, styles.rangeSelect].join(" ")}
                onChange={this.changeSubject}
                value={subjectValue}
                placeholder={trans("global.subject", "学科")}
              >
                {subjectList &&
                  subjectList.length > 0 &&
                  subjectList.map((item) => (
                    <Option value={item.id} key={item.id}>
                      <a title={item.name} className={styles.subjectName}>
                        {item.name}
                      </a>
                    </Option>
                  ))}
              </Select>
            </div>
            <div className={styles.optionTitle}>
              {trans("global.questionType", "题型")}
            </div>
            <div
              className={[styles.optionRow, styles.questionTypeRow].join(" ")}
              style={{ marginBottom: "4px" }}
            >
              <Select
                className={styles.questionTypeSelect}
                onChange={this.changeQuestionType}
                value={questionType}
              >
                {QUESTION_TYPE_OPTIONS.map((item) => (
                  <Option value={item.value} key={item.value}>
                    {item.label}
                  </Option>
                ))}
              </Select>
              <div className={styles.questionTypeButtons}>
                {QUESTION_TYPE_OPTIONS.map((item) => (
                  <span
                    key={item.value}
                    className={
                      questionType == item.value
                        ? styles.selected1
                        : styles.unSelected
                    }
                    onClick={() => this.changeQuestionType(item.value)}
                  >
                    <i className={icon.iconfont} style={item.iconStyle}>
                      {getIconText(item.icon)}
                    </i>
                    <span>{item.label}</span>
                  </span>
                ))}
              </div>
            </div>
            {questionType !== 7 && questionType !== 8 ? (
              <div>
                <div className={styles.optionTitle}>
                  {trans("singleInput.difficultyContent", "难易程度")}
                </div>
                <div className={styles.optionRow}>
                  {difficulty.map((item) => (
                    <span
                      key={item.key}
                      onClick={this.changeDifficult.bind(this, item.key)}
                      className={[
                        styles.difficultyBox,
                        hardValue === item.key ? styles.checkDiff : "",
                      ].join(" ")}
                    >
                      {item.name}
                    </span>
                  ))}
                </div>
                <div className={styles.optionTitle}>
                  {trans("global.chapter", "章节")}
                </div>
                <div className={styles.optionRow}>
                  <TreeSelect
                    className={styles.fieldControl}
                    treeData={this.props.chapterList}
                    value={this.state.chapterIds}
                    onChange={this.chapterChange}
                    showCheckedStrategy={SHOW_PARENT}
                    placeholder={trans("global.pleaseChoose", "请选择")}
                    id={"knowLedge"}
                    ref={this.selectRef}
                  />
                </div>
                <div className={styles.optionTitle}>
                  {trans("singleInput.knowledgeTree", "知识点")}
                </div>
                <div className={styles.optionRow}>
                  <TreeSelect {...tProperties} />
                </div>
                <div className={styles.optionTitle}>
                  {trans("singleInput.label", "素养")}
                </div>
                <div className={styles.optionRow}>
                  <TreeSelect {...lProperties} />
                </div>
              </div>
            ) : null}

            <div>
              {childQuestion && childQuestion.length > 0
                ? childQuestion.map((it, ind) => (
                    <div key={ind} className={styles.childOptionBox}>
                      <div className={styles.childQuestionNo}>
                        <div
                          onClick={this.checkChild.bind(this, ind)}
                          className={[
                            styles.childNoTitle,
                            this.state.childItem === ind
                              ? styles.checkChild
                              : "",
                          ].join(" ")}
                        >
                          {trans("global.childQuestionTitle", "子题")}
                          {ind + 1}-{childType[it.type]}
                        </div>
                        <div className={styles.childLine}></div>
                      </div>
                      <div className={styles.optionTitle}>
                        {trans("singleInput.difficultyContent", "难易程度")}
                      </div>
                      <div className={styles.optionRow}>
                        {difficulty.map((item) => (
                          <span
                            key={item.key}
                            onClick={this.changeChildDifficult.bind(
                              this,
                              item.key,
                              item.name,
                              ind,
                            )}
                            className={[
                              styles.difficultyBox,
                              it.questionLevel === item.key
                                ? styles.checkDiff
                                : "",
                            ].join(" ")}
                          >
                            {item.name}
                          </span>
                        ))}
                      </div>
                      <div className={styles.optionTitle}>
                        {trans("global.chapter", "章节")}
                      </div>
                      <div className={styles.optionRow}>
                        <TreeSelect
                          className={styles.fieldControl}
                          treeData={this.props.chapterList}
                          value={it.chapterId}
                          onChange={this.childChapterChange.bind(this, ind)}
                          showCheckedStrategy={SHOW_PARENT}
                          placeholder={trans("global.pleaseChoose", "请选择")}
                        />
                      </div>
                      <div className={styles.optionTitle}>
                        {trans("singleInput.knowledgeTree", "知识点")}
                      </div>
                      <div className={styles.optionRow}>
                        <TreeSelect
                          className={styles.fieldControl}
                          treeData={newTree}
                          value={it.knowledgeIds}
                          onChange={this.childKnowledgeChange.bind(this, ind)}
                          placeholder={trans("global.pleaseChoose", "请选择")}
                          treeCheckable={true}
                          showCheckedStrategy={SHOW_PARENT}
                          getPopupContainer={() =>
                            document.querySelector("#singleInput")
                          }
                        />
                      </div>
                      <div className={styles.optionTitle}>
                        {trans("singleInput.label", "素养")}
                      </div>
                      <div className={styles.optionRow}>
                        <TreeSelect
                          className={styles.fieldControl}
                          treeData={labelList}
                          value={it.indicatorIds}
                          onChange={this.childLabelChange.bind(this, ind)}
                          placeholder={trans("global.pleaseChoose", "请选择")}
                          treeCheckable={true}
                          showCheckedStrategy={SHOW_PARENT}
                        />
                      </div>
                    </div>
                  ))
                : null}
            </div>
          </div>
        </div>

        {/* <Modal
          footer={null}
          title={null}
          visible={this.state.successVisible}
          onCancel={this.closeModal}
          closable={true}
          maskClosable={false}
        >
          <div className={styles.importResult}>
            <h4>{trans("batchInput.result", "录入结果")}</h4>
            <p className={styles.resultTips}>
              <i className={icon.iconfont}>&#xe7a0;</i>
              <span className={styles.tips}>
                {trans("batchInput.singleImportSuccess", "录入成功")}
              </span>
            </p>
            <div
              className={styles.operBtn}
              style={{ textAlign: "center", top: 95 }}
            >
              <span className={styles.whiteBtn} onClick={this.goToMyQuestion}>
                {trans("singleInput.lookMyQuestion", "去题库查看")}
              </span>
              <span className={styles.blueBtn} onClick={this.hideSuccessModal}>
                {trans("batchInput.continueImport", "继续录入")}
              </span>
            </div>
          </div>
        </Modal> */}
      </div>
    );
  }
}

export default SingleInput;
