//新闻
import React, { Fragment, PureComponent } from "react";
import {
  Button,
  Checkbox,
  Icon,
  Input,
  InputNumber,
  message,
  Modal,
  Popover,
  Select,
  Tooltip,
  TreeSelect,
} from "antd";
import { connect } from "dva";

import QuestionEntryEditor from "../../components/QuestionEntryEditor";
import { updateItem as fetchQuestionDetail } from "../../services/example";
import { importQuestion as saveQuestionBatch } from "../../services/inputQuestion";
import { locale, trans } from "../../utils/i18n";
import PreviewImg from "../PreviewImg/index";

import icon from "../../icon.module.less";
import buttonStyle from "../../routes/StuTest/index.module.less";
import styles from "./index.module.less";
const { Option } = Select;
const { Search, TextArea } = Input;
import { isEqual } from "lodash";

import {
  updateQuestionChapter,
  updateQuestionIndicator,
} from "../../services/global";
import { convertToChineseNumber, loginRedirect } from "../../utils/utils";
import AnswerOptions from "../AnswerOptions";
import BraftEditor from "../BraftEditor";
import { getAssociationParentContent } from "./associationContext";
const { SHOW_PARENT } = TreeSelect;
let startValue;
// 是否以字母开头
/**
 *
 * @param string_
 */
function isAlphaStart(string_) {
  return /^[A-Za-z]/.test(string_);
}
/**
 *
 * @param array
 */
function removeSuffixId(array) {
  let list = array ? JSON.parse(JSON.stringify(array)) : [];
  let name = "";
  let medianNumber = (list.length - 1) / 2;
  for (let index = 0; index < medianNumber; index++) {
    const item = list[index];
    name += index == medianNumber - 1 ? item : `${item}-`;
  }
  return name;
}

const questionLevel = {
  1: trans("global.easy", "简单"),
  2: trans("global.general", "普通"),
  3: trans("global.difficult", "困难"),
};
const hasValue = (value) =>
  value !== undefined && value !== null && value !== "";
const toSafeArray = (value) => {
  if (Array.isArray(value)) {
    return value.filter(hasValue);
  }
  return hasValue(value) ? [value] : [];
};
const normalizeIdValue = (value) => {
  if (!hasValue(value)) {
    return;
  }
  const text = String(value).trim();
  if (!text) {
    return;
  }
  const lastPart = text.split("-").pop();
  const parsed = Number(/^\d+$/.test(lastPart) ? lastPart : text);
  return Number.isFinite(parsed) ? parsed : text;
};
const normalizeIdListForSave = (value) =>
  [...new Set(toSafeArray(value).map(normalizeIdValue))].filter(hasValue);
const normalizeScore = (value) => {
  const score = Number(value);
  return Number.isFinite(score) && score > 0 ? score : null;
};
const getQuestionTypeModuleName = (type) => {
  const questionType = Number(type);
  if (questionType === 1) return trans("global.radio", "单选题");
  if (questionType === 2) return trans("global.check", "多选题");
  if (questionType === 3) return trans("global.pack", "填空题");
  if (questionType === 4) return trans("global.judge", "判断题");
  if (questionType === 5) return trans("global.ask", "问答题");
  if (questionType === 6) return trans("global.combination", "组合题");
  if (questionType === 7) return trans("global.singleVote", "单选投票题");
  if (questionType === 8) return trans("global.multipleVote", "多选投票题");
  return "";
};
const isSameQuestionId = (left, right) => String(left) === String(right);
const isMockQuestionId = (questionId) => Number(questionId) < 0;

let timerId;
class DetailView extends PureComponent {
  constructor(properties) {
    super(properties);
    this.state = {
      list: [],
      scoreValue: 0,
      itemscoreValue: 0,
      countScoreViesble: false,
      dropVisible: false,
      modalStatus: false,
      scrollTop: 0,
      stageId: 0,
      searchValue: "",
      courseId: 0,
      gradeId: 0,
      questionType: 0,
      dropIndex: null,
      itemNameValue: "",
      chooseType: 0,
      IconFont: null,
      editModalVisible: false,
      url: null,
      checkTab: 0,
      imgVisible: false,
      activeType: null,
      index: null,
      visResolving: false,
      questionEditorSaving: false,
      analysisText: "",
      isFreeGroup: false,
      isFreeGroupIndex: null,
      topicId: "",
      selectLabel: null,
    };
    this.questionEditorController = undefined;
    this.list = [];
    this.page = 1;
    this.pageSize = 10;
    this.getCardStatus = true;
  }
  UNSAFE_componentWillReceiveProps(nextProperties) {
    if (!isEqual(this.props.detailList, nextProperties.detailList)) {
      this.setState(
        {
          list: nextProperties.detailList,
        },
        () => {
          this.props.detailList &&
            this.props.detailList.length > 0 &&
            this.props.detailList.map((it) => {
              it.questionList &&
                it.questionList.length > 0 &&
                it.questionList.map((item) => {
                  let state = Object.assign({}, this.state);
                  state[`choiceDifficultyValue${item.questionId}`] =
                    item.questionLevel;
                  // state[`selectLabel${item.questionId}`] = item.knowledgeValues;
                  // state[`selectValue${item.questionId}`] = item.knowledgeValues;
                  // state[`selectIdList${item.questionId}`] = item.idList;
                  this.setState({
                    ...state,
                  });
                });
            });
        },
      );
    }
  }
  componentDidMount() {
    if (this.props.onRef) {
      this.props.onRef(this);
    }
    console.log(this.props.detailList, "this.props.detailList");
    this.list = [...this.props.detailList];
    const IconFonts = Icon.createFromIconfontCN({
      scriptUrl: "//at.alicdn.com/t/font_789461_ovr9ifg67hb.js",
    });
    this.setState({
      IconFont: IconFonts,
    });
    this.props.detailList &&
      this.props.detailList.length > 0 &&
      this.props.detailList.map((it) => {
        it.questionList &&
          it.questionList.length > 0 &&
          it.questionList.map((item) => {
            let state = Object.assign({}, this.state);
            state[`choiceDifficultyValue${item.questionId}`] =
              item.questionLevel;
            this.setState({
              ...state,
              list: this.props.detailList,
            });
          });
      });
  }

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

  renderAssociationParentContent = (question) => {
    const parentContent = getAssociationParentContent(question);
    if (!parentContent) {
      return;
    }
    return (
      <div
        className={styles["association-parent-content"]}
        dangerouslySetInnerHTML={{ __html: parentContent }}
      />
    );
  };

  viewAnalysis = (id, analysis) => {
    // window.open(
    //   `${window.location.origin}/exam#/viewResolution/${this.props.paperId}/${id}`,
    //   "_blank"
    // );
    // this.setState({
    //   visResolving: true,
    //   analysisText: analysis,
    // });
    const e = document.getElementById(`analysis${id}`);
    // button：获取当前点击的btn，这是个傻逼写法，后面需要把所有btn按照规范写
    const button = document.getElementById(`viewButton${id}`);
    if (e) {
      if (e.style.display === "block") {
        if (button) {
          button.style.backgroundColor = "rgba(1,17,61,.05)";
          button.style.color = "rgba(1,17,61,.65)";
        }
        e.style.display = "none";
      } else {
        e.style.display = "block";
        // 由于本次优化没有做到所有btn都修改，存在btn的按照之前的代码执行，不存在的会使用规范的btn
        if (button) {
          button.style.backgroundColor = "rgba(59,111,245,0.12)";
          button.style.color = "#4D7FFF";
        }
      }
    }
  };

  viewModalAnalysis = (id) => {
    const e = document.getElementById(`modalanalysis${id}`);
    const button = document.getElementById(`viewButton${id}`);
    if (e) {
      if (e.style.display === "block") {
        e.style.display = "none";
        button.style.backgroundColor = "#fff";
        button.style.color = "#666";
      } else {
        e.style.display = "block";
        button.style.backgroundColor = "rgba(59,111,245,0.12)";
        button.style.color = "#4D7FFF";
      }
    }
  };
  dropChange = (sourceKey, targetKey) => {
    let source = Number.parseInt(sourceKey, 10);
    let target = Number.parseInt(targetKey, 10);
    let fileList = JSON.parse(JSON.stringify(this.state.list));
    sourceKey < targetKey && targetKey++;
    let newList = JSON.parse(JSON.stringify(this.list));
    fileList.splice(source, 0, ...fileList.splice(target, 1));
    newList.splice(source, 0, ...newList.splice(target, 1));
    this.list = newList;
    this.setState({
      list: fileList,
    });
  };
  dropQuestionChange = (index, sourceKey, targetKey) => {
    let newIndex = Number.parseInt(index, 10);
    let source = Number.parseInt(sourceKey, 10);
    let target = Number.parseInt(targetKey, 10);
    let fileList = JSON.parse(JSON.stringify(this.state.list));
    let newList = fileList[index].questionList;
    sourceKey < targetKey && targetKey++;
    newList.splice(target, 0, ...newList.splice(source, 1));
    fileList[index].questionList = newList;
    this.setState({
      list: fileList,
    });
  };
  scoreChange = (index, e) => {
    console.log(e, "wwww");
    if (e === 0) {
      return message.error(trans("detail.numMessage2", "请输入正整数"));
    }
    let value = e === "" ? 0 : e;
    const r = /^\d+(\.\d+)?/;
    if (!r.test(value)) {
      return message.error(trans("detail.numMessage", "请输入数字"));
    }
    this.setState({
      scoreValue: value,
    });
  };
  itemscoreChange = (index, e) => {
    console.log(e, "wwww");
    if (e === 0) {
      return message.error(trans("detail.numMessage2", "请输入正整数"));
    }
    let value = e === "" ? 0 : e;
    const r = /^\d+(\.\d+)?/;
    if (!r.test(value)) {
      return message.error(trans("detail.numMessage", "请输入数字"));
    }
    this.setState({
      itemscoreValue: value,
    });
  };

  quetionChange = (questionId, e, type) => {
    const { value } = e.target;

    if (value == 0 && value != "") {
      return message.error(trans("detail.numMessage2", "请输入正整数"));
    }

    const r = /^\d+(\.\d+)?/;
    if (!r.test(value) && value != "") {
      return message.error(trans("detail.numMessage", "请输入数字"));
    }

    let newList = JSON.parse(JSON.stringify(this.state.list));
    if (newList && newList.length > 0) {
      newList.map((item) => {
        if (item.questionList && item.questionList.length > 0) {
          let total = 0;
          item.questionList.map((it) => {
            let number_ = null;
            if (
              type == "sonQuestion" &&
              it.sonQuestionList &&
              it.sonQuestionList.length > 0
            ) {
              it.sonQuestionList.map((index) => {
                if (index.questionId === questionId) {
                  index.questionScore = value ? Number(value) : "";
                }
                number_ += index.questionScore
                  ? Number(index.questionScore)
                  : 0;
              });
              it.questionScore = number_;
            } else if (type == "question" && it.questionId == questionId) {
              it.questionScore = value ? Number(value) : "";
            }
            total += it.questionScore ? Number(it.questionScore) : 0;
          });
          item.moduleScore = total;
        }
      });
    }

    this.setState({
      list: newList,
    });
  };

  quetionChangeEnd = (id, e, type) => {
    const { value } = e.target;
    if (!value) return;
    if (
      startValue != value &&
      typeof this.props.onQuestionScoreChange == "function"
    ) {
      let object = {
        type: type,
        questionId: id,
        value: value,
      };
      this.props.onQuestionScoreChange(object);
    }
  };

  itemNameChange = (index, e) => {
    let value = e.target.value;
    this.setState({
      itemNameValue: value,
    });
  };
  RadioChange = (id, index) => {
    let fileList = JSON.parse(JSON.stringify(this.state.list));
    if (fileList && fileList.length > 0) {
      fileList.map((item) => {
        if (item.questionList && item.questionList.length > 0) {
          item.questionList.map((it) => {
            if (it.questionId === id) {
              it.studentAnswer = it.studentAnswer === index ? null : index;
            }
          });
        }
      });
    }

    localStorage.setItem(
      "answerCache",
      JSON.stringify({ examId: this.props.examId, fileList: fileList }),
    );
    this.setState({
      list: fileList,
    });
    this.props.updateList && this.props.updateList(fileList);
  };
  RadioChildChange = (id, index) => {
    let fileList = JSON.parse(JSON.stringify(this.state.list));
    if (fileList && fileList.length > 0) {
      fileList.map((item) => {
        if (item.questionList && item.questionList.length > 0) {
          item.questionList.map((it) => {
            if (it.sonQuestionList && it.sonQuestionList.length > 0) {
              it.sonQuestionList.map((iit) => {
                if (iit.questionId === id) {
                  iit.studentAnswer =
                    iit.studentAnswer === index ? null : index;
                }
              });
            }
          });
        }
      });
    }
    localStorage.setItem(
      "answerCache",
      JSON.stringify({ examId: this.props.examId, fileList: fileList }),
    );
    this.setState({
      list: fileList,
    });
    this.props.updateList && this.props.updateList(fileList);
  };

  sureCount = (index) => {
    let list = JSON.parse(JSON.stringify(this.state.list));
    let count = 0;
    if (
      list[index].questionList &&
      list[index].questionList.length > 0 &&
      this.state.scoreValue
    ) {
      list[index].questionList.map((item) => {
        item.questionScore = this.state.scoreValue || 0;
        count += item.questionScore;
      });
      list[index].moduleScore = count;
    }
    this.setState(
      {
        list: list,
        scoreValue: null,
      },
      () => {
        let state = Object.assign({}, this.state);
        state[`countScoreViesble${index}`] = false;
        this.setState(
          {
            ...state,
          },
          () => {
            this.props.updateList(list);
          },
        );
      },
    );
  };
  sureCount1 = (index) => {
    let list = JSON.parse(JSON.stringify(this.state.list));
    let count = 0;
    if (
      list[index].questionList &&
      list[index].questionList.length > 0 &&
      this.state.scoreValue
    ) {
      list[index].questionList.map((item) => {
        item.questionScore = this.state.scoreValue || 0;
        count += item.questionScore;
      });
      list[index].moduleScore = count;
    }

    this.setState(
      {
        list: list,
        scoreValue: null,
      },
      () => {
        let state = Object.assign({}, this.state);
        state[`countScoreViesble1${index}`] = false;
        this.setState(
          {
            ...state,
          },
          () => {
            this.props.updateList(list);
          },
        );
        // this.changeScoreVisible1(index);
      },
    );
  };
  changeTypeBatchScore = (index, e) => {
    console.log(e, "ee");
    let newFree = JSON.parse(JSON.stringify(this.state.list));
    newFree[index].questionList[this.state.checkTab].questionScore = e;
    let score = 0;
    newFree[index].questionList.map((it) => {
      score += it.questionScore;
    });
    newFree[index].moduleScore = score;
    // this.updateList(newFree)
    this.setState(
      {
        list: newFree,
        scoreValue: null,
      },
      () => {
        let state = Object.assign({}, this.state);
        state[`countScoreViesble1${index}`] = false;
        this.setState(
          {
            ...state,
          },
          () => {
            this.props.updateList(this.state.list);
          },
        );
        // this.changeScoreVisible1(index);
      },
    );
  };
  changeTypeSonScore = (index, ind, e) => {
    let newFree = JSON.parse(JSON.stringify(this.state.list));
    newFree[index].questionList[this.state.checkTab].sonQuestionList[
      ind
    ].questionScore = e;
    let score = 0;
    newFree[index].questionList[this.state.checkTab].sonQuestionList.map(
      (it) => {
        score += it.questionScore;
      },
    );
    newFree[index].questionList[this.state.checkTab].questionScore = score;
    let total = 0;
    newFree[index].questionList.map((it) => {
      total += it.questionScore;
    });
    newFree[index].moduleScore = total;
    // this.updateList(newFree)
    this.setState(
      {
        list: newFree,
        scoreValue: null,
      },
      () => {
        let state = Object.assign({}, this.state);
        state[`countScoreViesble1${index}`] = false;
        this.setState(
          {
            ...state,
          },
          () => {
            this.props.updateList(this.state.list);
          },
        );
        // this.changeScoreVisible1(index);
      },
    );
  };
  downTypeScore = (index, ind, score) => {
    if (!score || score == 0) {
      return;
    }
    let newFree = JSON.parse(JSON.stringify(this.state.list));
    // newFree[index].questionList[this.state.checkTab].sonQuestionList[ind].questionScore = score;
    let newScore = 0;
    newFree[index].questionList[this.state.checkTab].sonQuestionList.map(
      (it) => {
        it.questionScore = score;
        newScore += it.questionScore;
      },
    );
    newFree[index].questionList[this.state.checkTab].questionScore = newScore;
    let total = 0;
    newFree[index].questionList.map((it) => {
      total += it.questionScore;
    });
    newFree[index].moduleScore = total;
    newFree[index].moduleScore = total;
    // this.updateList(newFree)
    this.setState(
      {
        list: newFree,
        scoreValue: null,
      },
      () => {
        let state = Object.assign({}, this.state);
        state[`countScoreViesble1${index}`] = false;
        this.setState(
          {
            ...state,
          },
          () => {
            this.props.updateList(this.state.list);
          },
        );
        // this.changeScoreVisible1(index);
      },
    );
  };
  searchValue = (value) => {
    this.setState(
      {
        searchValue: value,
      },
      () => {
        this.page = 1;
        this.getPage();
      },
    );
  };
  sureItem = (id) => {
    let list = JSON.parse(JSON.stringify(this.state.list));
    if (list && list.length > 0) {
      list.map((item) => {
        let count = 0;
        if (
          item.questionList &&
          item.questionList.length > 0 &&
          this.state.itemscoreValue
        ) {
          item.questionList.map((it) => {
            if (id === it.questionId) {
              it.questionScore = this.state.itemscoreValue || 0;
            }
            count += it.questionScore;
          });
        }
        item.moduleScore = count;
      });
    }
    this.props.updateList(list);
    this.setState(
      {
        list: list,
        itemscoreValue: null,
      },
      () => {
        this.changeItemVisible(id);
      },
    );
  };
  setList = (list) => {
    this.setState({
      list,
    });
  };
  sureItemName = (index_, e) => {
    let list = JSON.parse(JSON.stringify(this.state.list));
    if (list && list.length > 0) {
      list.map((item, index) => {
        if (index === index_) {
          item.moduleName = e.target.value;
        }
      });
    }
    this.props.updateList(list);
    this.setState(
      {
        list: list,
      },
      () => {
        this.changeItemNameVisible(index_);
      },
    );
  };
  returnList = (item) => {
    let propertiesList = [...this.list];
    let stateList = [...this.state.list];
    let parentInd = 0;
    let childInd = 0;
    if (propertiesList && propertiesList.length > 0) {
      propertiesList.map((it, ind) => {
        if (it.questionList && it.questionList.length > 0) {
          it.questionList.map((index_, index) => {
            if (index_.questionId === item.questionId) {
              parentInd = ind;
              childInd = index;
            }
          });
        }
      });
    }
    if (stateList && stateList.length > 0) {
      stateList.map((it, ind) => {
        if (ind === parentInd) {
          it.questionList.splice(childInd, 0, item);
        }
      });
    }
    this.setState({
      list: stateList,
    });
    this.props.updateList(stateList);
  };
  deleteQuestion = (id) => {
    const { list } = this.state;
    // console.log(list, this.props.detailList, "xxx");
    let newList = JSON.parse(JSON.stringify(this.state.list));
    this.list = [...this.props.detailList];
    let count = 0;
    if (newList && newList.length > 0) {
      newList.map((item) => {
        if (item.questionList && item.questionList.length > 0) {
          item.questionList.map((it, ind) => {
            count += it.questionScore;
            if (id === it.questionId) {
              item.questionList.splice(ind, 1);
              this.props.updateDeleteList(it);
            }
          });
          item.moduleScore = count;
          count = 0;
        }
      });
    }
    this.setState({
      list: newList,
    });
    this.props.updateList(newList);
  };
  changeScoreVisible = (index) => {
    let state = Object.assign({}, this.state);
    console.log(index, state[`countScoreViesble${index}`], "111");
    state[`countScoreViesble${index}`] = !state[`countScoreViesble${index}`];
    this.setState({
      ...state,
      checkTab: 0,
    });
  };
  changeScoreVisible1 = (index) => {
    let state = Object.assign({}, this.state);
    console.log(state, "111");
    state[`countScoreViesble1${index}`] = !state[`countScoreViesble1${index}`];
    this.setState({
      ...state,
      checkTab: 0,
    });
  };
  checkTab = (index) => {
    this.setState({
      checkTab: index,
    });
  };
  changeItemVisible = (index) => {
    let state = Object.assign({}, this.state);
    state[`itemScoreViesble${index}`] = !state[`itemScoreViesble${index}`];
    this.setState({
      ...state,
    });
  };
  changeItemNameVisible = (index) => {
    let state = Object.assign({}, this.state);
    state[`itemNameViesb${index}`] = !state[`itemNameViesb${index}`];
    this.setState(
      {
        ...state,
      },
      () => {
        if (state[`itemNameViesb${index}`]) {
          setTimeout(() => {
            const inp = document.querySelector("#inpID2");
            inp.focus();
          }, 500);
        }
      },
    );
  };
  ondragstart(event_) {
    let t = event_.target;
    event_.dataTransfer.setDragImage(t.parentNode, 0, 0);
    event_.dataTransfer.setData("text", t.id);
  }
  ondragstartNew(event_) {
    let t = event_.target;
    if (event_.target.parentNode.className.includes("questionRight")) {
      t = event_.target.parentNode;
    } else if (
      event_.target.parentNode.parentNode &&
      event_.target.parentNode.parentNode.className.includes("questionRight")
    ) {
      t = event_.target.parentNode.parentNode;
    }
    event_.dataTransfer.setDragImage(t, 0, 0);
    event_.dataTransfer.setData("text", t.id);
  }
  ondragover(event_) {
    event_.preventDefault();
  }
  ondragenter(event_) {
    let t = event_.target.parentNode;
    t.style.opacity = 0.3;
    t.style.backgroundColor = "#333";
  }
  ondragenterNew(event_) {
    let t = event_.target;
    if (event_.target.parentNode.className.includes("questionRight")) {
      t = event_.target.parentNode;
    } else if (
      event_.target.parentNode.parentNode &&
      event_.target.parentNode.parentNode.className.includes("questionRight")
    ) {
      t = event_.target.parentNode.parentNode;
    }
    t.style.opacity = 0.3;
    t.style.backgroundColor = "#333";
  }
  ondragleave(event_) {
    let t = event_.target.parentNode;
    t.style.opacity = 1;
    t.style.backgroundColor = "#fff";
  }
  ondragleaveNew(event_) {
    let t = event_.target;
    if (event_.target.parentNode.className.includes("questionRight")) {
      t = event_.target.parentNode;
    }
    t.style.opacity = 1;
    t.style.backgroundColor = "#fff";
  }
  ondrop = (event_) => {
    let d = event_.dataTransfer.getData("text"),
      target = event_.target,
      targetId = event_.target.id;
    const newTarget = targetId.includes("-")
      ? targetId.split("-")
      : targetId.split("_");
    const newId = d.includes("-") ? d.split("-") : d.split("_");
    (targetId, d, d.includes("-"), "aaas");
    if (newTarget[0] !== newId[0]) {
      return message.error(
        trans("teacherPreview.sameQuestionTypeMoveOnly", "请在相同题型内移动"),
      );
    }
    target.parentNode.style.opacity = 1;
    target.parentNode.style.backgroundColor = "#fff";
    if (newId[1] !== newTarget[1]) {
      this.dropQuestionChange(newId[0], newId[1], newTarget[1]);
      this.props.dropQuestionChange(newId[0], newId[1], newTarget[1]);
    }
    //  d != targetId && setTimeout(() => {
    //    typeof this.props.dropChange == 'function'
    //      && this.props.dropChange(d, targetId);
    //  }, 0);
  };
  ondropNew = (event_) => {
    let newEvent = event_.target;
    if (event_.target.parentNode.className.includes("questionRight")) {
      newEvent = event_.target.parentNode;
    } else if (
      event_.target.parentNode.parentNode &&
      event_.target.parentNode.parentNode.className.includes("questionRight")
    ) {
      newEvent = event_.target.parentNode.parentNode;
    }
    let d = event_.dataTransfer.getData("text"),
      target = newEvent,
      targetId = newEvent.id;
    const newTarget = targetId.split("_");
    const newId = d.split("_");
    if (newTarget[0] !== newId[0]) {
      return message.error(trans("global.dropMessage", "请在相同题型内移动"));
    }
    target.style.opacity = 1;
    target.style.backgroundColor = "#fff";
    if (newId[1] !== newTarget[1]) {
      this.dropQuestionChange(newId[0], newId[1], newTarget[1]);
      this.props.dropQuestionChange(newId[0], newId[1], newTarget[1]);
    }
    //  d != targetId && setTimeout(() => {
    //    typeof this.props.dropChange == 'function'
    //      && this.props.dropChange(d, targetId);
    //  }, 0);
  };
  renderIndex = (id, inde, ind) => {
    const { list } = this.state;
    let newList = [];
    let count = 0;
    if (list && list.length > 0) {
      list.map((item, ii) => {
        if (item.questionList && item.questionList.length > 0) {
          item.questionList.map((it, iin) => {
            newList.push(`${it.questionId}${ii}${iin}`);
          });
        }
      });
    }
    if (newList.length > 0) {
      newList.map((item, index) => {
        if (`${id}${inde}${ind}` === item) {
          count = index + 1;
        }
      });
    }
    return count;
  };
  changeDrop = (index) => {
    this.setState({
      dropVisible: true,
      dropIndex: index,
    });
  };
  renderScore = (index) => {
    const { list } = this.state;
    let count = 0;
    if (
      list &&
      list.length > 0 &&
      list[index].questionList &&
      list[index].questionList.length > 0
    ) {
      list[index].questionList.map((item) => {
        count += item.questionScore ? item.questionScore : 0;
        console.log(list, index, "333");
      });
    }
    return count && count > 0 ? <span>{count}</span> : null;
  };
  returnVisible = (index) => {
    this.setState({
      dropVisible: false,
    });
    this.props.showSort(index);
  };
  renderCheck = (item) => {
    let label = [];
    item.optionList.map((it) => {
      label.push({ label: it.name, value: it.id });
    });
    return (
      <div>
        <Checkbox.Group
          options={label}
          defaultValue={["Apple"]}
          onChange={this.checkChange.bind(this, item.questionId)}
        />
      </div>
    );
  };
  showModal = (item, index) => {
    console.log(item, index, "aaa1");
    if (item == 0) {
      this.setState({
        isFreeGroup: true,
        isFreeGroupIndex: index,
      });
    }
    this.props.dispatch({
      type: "global/getStage",
    });
    this.props.dispatch({
      type: "global/getType",
    });
    this.setState(
      {
        questionType: item,
        index,
      },
      () => {
        this.getPage();
        this.setState({
          modalStatus: true,
        });
      },
    );
  };
  showModalAll = () => {
    this.props.dispatch({
      type: "global/getStage",
    });
    this.props.dispatch({
      type: "global/getType",
    });
    this.getPage();
    this.setState({
      modalStatus: true,
    });
  };
  changeStage = (value) => {
    this.setState(
      {
        stageId: value,
        gradeId: 0,
        courseId: 0,
        scrollTop: 0,
      },
      () => {
        this.props.dispatch({
          type: "global/getGrade",
          payload: {
            stageId: this.state.stageId,
          },
        });
        this.page = 1;
        this.getPage();
      },
    );
  };

  changeType = (value) => {
    this.setState(
      {
        questionType: value,
        scrollTop: 0,
      },
      () => {
        this.page = 1;
        this.getPage();
      },
    );
  };
  changeCourse = (value) => {
    this.setState(
      {
        courseId: value,
        scrollTop: 0,
      },
      () => {
        this.page = 1;
        this.getPage();
      },
    );
  };
  changeGrade = (value) => {
    this.setState(
      {
        gradeId: value,
        scrollTop: 0,
        courseId: 0,
      },
      () => {
        this.props.dispatch({
          type: "global/getSubject",
          payload: {
            gradeId: this.state.gradeId,
          },
        });
        this.page = 1;
        this.getPage();
      },
    );
  };
  getPage = () => {
    let list = JSON.parse(JSON.stringify(this.state.list));
    let questionIds = [];
    if (list && list.length > 0) {
      list.map((item) => {
        if (item.questionList && item.questionList.length > 0) {
          item.questionList.map((it) => {
            questionIds.push(it.questionId);
          });
        }
      });
    }
    if (this.props.deleteList && this.props.deleteList.length > 0) {
      this.props.deleteList.map((item) => {
        questionIds.push(item.questionId);
      });
    }
    this.props
      .dispatch({
        type: "home/getQuestion",
        payload: {
          questionIds: questionIds,
          content: this.state.searchValue,
          pageNo: this.page,
          limit: 10,
          type: 2,
          questionType:
            this.state.questionType === 0 ? "" : this.state.questionType,
          subjectId: this.props.subjectId || 0,
          yearPeriodId: this.state.stageId === 0 ? "" : this.state.stageId,
          gradeId: this.state.gradeId === 0 ? "" : this.state.gradeId,
        },
      })
      .then(() => {
        this.getCardStatus = true;
        this.page += 1;
      });
  };
  scrollChange = () => {
    const overflowDom = document.querySelector("#listBox");
    const cardDomList = document.querySelectorAll(".listItem");
    const mastTop = cardDomList.at(-2).offsetTop;
    const scrollTop = overflowDom.scrollTop;
    const innerHeight = window.innerHeight;
    this.setState({
      scrollTop: scrollTop,
    });
    if (scrollTop + innerHeight > mastTop && this.getCardStatus) {
      this.getCardStatus = false;
      if (scrollTop > this.state.scrollTop) {
        // this.props.getExamineList();
        this.getPage();
      }
    }
  };
  addTest = (item) => {
    console.log("iii");
    let newList = JSON.parse(JSON.stringify(this.state.list));
    if (this.state.isFreeGroup) {
      let object = {};
      object.analysis = item.analysis;
      object.answer = item.answer;
      object.content = item.content;
      object.optionList = item.answersModelList;
      object.questionId = item.id;
      object.questionLevel = item.level;
      object.questionLevelName = null;
      object.questionScore = null;
      object.questionSerialNumber = null;
      object.studentAnswer = null;
      object.type = item.type;
      if (item.type == 6) {
        console.log(item, "iii11");
        object.sonQuestionList = item.sonQuestionList;
      }
      if (this.props.isEdit) {
        newList[this.state.isFreeGroupIndex - 1].questionList.push(object);
      } else {
        if (this.state.isFreeGroupIndex == 0) {
          newList[this.state.isFreeGroupIndex].questionList.push(object);
        } else {
          newList[this.state.isFreeGroupIndex - 1].questionList.push(object);
        }
      }
    } else {
      let ifHave = false;
      let newObject = {};
      if (newList && newList.length > 0) {
        console.log(item, "iiii");
        newList.map((it) => {
          if (it.moduleType === item.type) {
            ifHave = true;
            newObject.analysis = item.analysis;
            newObject.answer = item.answer;
            newObject.content = item.content;
            newObject.optionList = item.answersModelList;
            newObject.questionId = item.id;
            newObject.questionLevel = item.level;
            newObject.questionLevelName = null;
            newObject.questionScore = null;
            newObject.questionSerialNumber = null;
            newObject.studentAnswer = null;
            newObject.type = item.type;
            if (item.type == 6) {
              console.log(item, "iii11");
              newObject.sonQuestionList = item.sonQuestionList;
            }
            it.questionList.push(newObject);
          }
        });
      }
      if (!ifHave) {
        newObject.moduleName =
          item.type === 1
            ? trans("global.radio", "单选题")
            : item.type === 2
              ? trans("global.check", "多选题")
              : item.type === 3
                ? trans("global.pack", "填空题")
                : item.type === 4
                  ? trans("global.judge", "判断题")
                  : item.type === 5
                    ? trans("global.ask", "问答题")
                    : item.type === 6
                      ? trans("global.combination", "组合题")
                      : "";
        newObject.moduleQuestionNumber = "1";
        newObject.moduleScore = null;
        newObject.moduleType = item.type;
        newObject.questionList = [
          {
            analysis: item.analysis,
            answer: item.answer,
            content: item.content,
            optionList: item.answersModelList,
            questionId: item.id,
            questionLevel: item.level,
            questionLevelName: null,
            questionScore: null,
            questionSerialNumber: null,
            studentAnswer: null,
            type: item.type,
          },
        ];
        if (item.type == 6) {
          newObject.questionList[0].sonQuestionList = item.sonQuestionList;
        }
        newList.push(newObject);
      }
    }

    this.setState(
      {
        list: newList,
      },
      () => {
        this.props.dispatch({
          type: "home/updateTestChange",
          payload: {
            questionId: item.id,
          },
        });
      },
    );
    this.props.updateList(newList);
  };
  cancelAdd = (id) => {
    let newList = JSON.parse(JSON.stringify(this.state.list));
    newList.length > 0 &&
      newList.map((item, index) => {
        newList[index].questionList =
          item.questionList &&
          item.questionList.length > 0 &&
          item.questionList.filter((it) => it.questionId != id);
      });
    this.props.updateList(newList);
    this.props.dispatch({
      type: "home/updateTestChange",
      payload: {
        questionId: id,
      },
    });
  };
  checkChange = (id, index) => {
    let fileList = JSON.parse(JSON.stringify(this.state.list));
    if (fileList && fileList.length > 0) {
      fileList.map((item) => {
        if (item.questionList && item.questionList.length > 0) {
          item.questionList.map((it) => {
            if (it.questionId === id) {
              if (it.studentAnswer && it.studentAnswer.includes(index)) {
                const reg = new RegExp(index);
                const string_ = it.studentAnswer.replace(reg, "");
                it.studentAnswer = string_;
              } else {
                if (it.studentAnswer) {
                  it.studentAnswer += index;
                } else {
                  it.studentAnswer = index;
                }
              }
            }
          });
        }
      });
    }
    localStorage.setItem(
      "answerCache",
      JSON.stringify({ examId: this.props.examId, fileList: fileList }),
    );

    this.setState({
      list: fileList,
    });
    this.props.updateList && this.props.updateList(fileList);
  };
  checkChildChange = (id, index) => {
    let fileList = JSON.parse(JSON.stringify(this.state.list));
    if (fileList && fileList.length > 0) {
      fileList.map((item) => {
        if (item.questionList && item.questionList.length > 0) {
          item.questionList.map((it) => {
            if (it.sonQuestionList && it.sonQuestionList.length > 0) {
              it.sonQuestionList.map((ii) => {
                if (ii.questionId === id) {
                  if (ii.studentAnswer && ii.studentAnswer.includes(index)) {
                    const reg = new RegExp(index);
                    const string_ = ii.studentAnswer.replace(reg, "");
                    ii.studentAnswer = string_;
                  } else {
                    if (ii.studentAnswer) {
                      ii.studentAnswer += index;
                    } else {
                      ii.studentAnswer = index;
                    }
                  }
                }
              });
            }
          });
        }
      });
    }

    localStorage.setItem(
      "answerCache",
      JSON.stringify({ examId: this.props.examId, fileList: fileList }),
    );
    this.setState({
      list: fileList,
    });
    this.props.updateList && this.props.updateList(fileList);
  };
  changeCompletion = (id, index, e) => {
    let fileList = JSON.parse(JSON.stringify(this.state.list));
    if (fileList && fileList.length > 0) {
      fileList.map((item) => {
        if (item.questionList && item.questionList.length > 0) {
          item.questionList.map((it) => {
            if (it.questionId === id) {
              it.studentGapFillingAnswer[index] = e;
            }
          });
        }
      });
    }
    localStorage.setItem(
      "answerCache",
      JSON.stringify({ examId: this.props.examId, fileList: fileList }),
    );
    this.setState({
      list: fileList,
    });
    this.props.updateList && this.props.updateList(fileList);
  };
  changeChildCompletion = (id, index, e) => {
    let fileList = JSON.parse(JSON.stringify(this.state.list));
    if (fileList && fileList.length > 0) {
      fileList.map((item) => {
        if (item.questionList && item.questionList.length > 0) {
          item.questionList.map((it) => {
            if (it.sonQuestionList && it.sonQuestionList.length > 0) {
              it.sonQuestionList.map((ii) => {
                if (ii.questionId === id) {
                  ii.studentGapFillingAnswer[index] = e;
                }
              });
            }
          });
        }
      });
    }

    localStorage.setItem(
      "answerCache",
      JSON.stringify({ examId: this.props.examId, fileList: fileList }),
    );
    this.setState({
      list: fileList,
    });
    this.props.updateList && this.props.updateList(fileList);
  };
  changeJudge = (id, judge) => {
    let fileList = JSON.parse(JSON.stringify(this.state.list));
    if (fileList && fileList.length > 0) {
      fileList.map((item) => {
        if (item.questionList && item.questionList.length > 0) {
          item.questionList.map((it) => {
            if (it.questionId === id) {
              it.studentAnswer = judge;
            }
          });
        }
      });
    }
    localStorage.setItem(
      "answerCache",
      JSON.stringify({ examId: this.props.examId, fileList: fileList }),
    );
    this.setState({
      list: fileList,
    });
    // console.log(fileList, "ffll");
    this.props.updateList && this.props.updateList(fileList);
  };
  changeChildJudge = (id, judge) => {
    let fileList = JSON.parse(JSON.stringify(this.state.list));
    if (fileList && fileList.length > 0) {
      fileList.map((item) => {
        if (item.questionList && item.questionList.length > 0) {
          item.questionList.map((it) => {
            if (it.sonQuestionList && it.sonQuestionList.length > 0) {
              it.sonQuestionList.map((ii) => {
                if (ii.questionId === id) {
                  ii.studentAnswer = judge;
                }
              });
            }
          });
        }
      });
    }

    localStorage.setItem(
      "answerCache",
      JSON.stringify({ examId: this.props.examId, fileList: fileList }),
    );
    this.setState({
      list: fileList,
    });
    // console.log(fileList, "ffll");
    this.props.updateList && this.props.updateList(fileList);
  };
  changeText = (e, id) => {
    console.log(e, "eee");
    let fileList = JSON.parse(JSON.stringify(this.state.list));
    if (fileList && fileList.length > 0) {
      fileList.map((item) => {
        if (item.questionList && item.questionList.length > 0) {
          item.questionList.map((it) => {
            if (it.questionId === id) {
              it.studentAnswer = e;
            }
          });
        }
      });
    }
    localStorage.setItem(
      "answerCache",
      JSON.stringify({ examId: this.props.examId, fileList: fileList }),
    );
    this.setState({
      list: fileList,
    });
    this.props.updateList && this.props.updateList(fileList);
  };
  changeChildText = (e, id) => {
    console.log(e, "eee");
    let fileList = JSON.parse(JSON.stringify(this.state.list));
    if (fileList && fileList.length > 0) {
      fileList.map((item) => {
        if (item.questionList && item.questionList.length > 0) {
          item.questionList.map((it) => {
            if (it.sonQuestionList && it.sonQuestionList.length > 0) {
              it.sonQuestionList.map((ii) => {
                if (ii.questionId === id) {
                  ii.studentAnswer = e;
                }
              });
            }
          });
        }
      });
    }

    localStorage.setItem(
      "answerCache",
      JSON.stringify({ examId: this.props.examId, fileList: fileList }),
    );
    this.setState({
      list: fileList,
    });
    this.props.updateList && this.props.updateList(fileList);
  };
  listChange = (fileList) => {
    this.setState({
      list: fileList,
    });
    // console.log(fileList, "sss");s
  };
  editQuestion = (id) => {
    const localQuestion = this.getExistingQuestion(id);
    if (localQuestion && isMockQuestionId(id)) {
      this.props.dispatch({
        type: "home/saveItem",
        payload: localQuestion,
      });
      this.setState({
        editModalVisible: true,
      });
      return;
    }

    this.props
      .dispatch({
        type: "home/getItem",
        payload: {
          questionId: id,
        },
      })
      .then(() => {
        this.setState({
          editModalVisible: true,
        });
      });
  };
  checkQuestion = (id) => {
    this.props.checkQuestion(id);
  };
  modalCancel = () => {
    this.props.dispatch({
      type: "home/clearQuestionList",
    });
    this.page = 1;
    this.setState({
      modalStatus: false,
    });
    this.props.showAddTopic(this.state.index);
  };
  editModalCancel = () => {
    if (this.state.questionEditorSaving) {
      return;
    }
    this.questionEditorController = undefined;
    this.props.dispatch({
      type: "home/clearQuestionItem",
    });
    this.setState({
      editModalVisible: false,
    });
  };
  handleQuestionEditorControllerReady = (controller) => {
    this.questionEditorController = controller;
  };
  submitQuestionEditor = (event) => {
    if (event && typeof event.preventDefault === "function") {
      event.preventDefault();
    }
    if (this.state.questionEditorSaving) {
      return;
    }
    if (
      this.questionEditorController &&
      typeof this.questionEditorController.submit === "function"
    ) {
      this.questionEditorController.submit("local");
    }
  };
  cancelImg = () => {
    this.setState({
      url: null,
      imgVisible: false,
    });
  };
  renderTitle = (item, index) => {
    let ifShow = false;
    if (item.questionList && item.questionList.length > 0) {
      item.questionList.map((index_, ind) => {
        if (ind > 0) {
          if (
            index_.questionScore == undefined ||
            index_.questionScore !== item.questionList[ind - 1].questionScore
          ) {
            ifShow = true;
            return;
          } else {
            console.log("false");
          }
        } else {
          if (
            item.questionList.length === 1 &&
            index_.questionScore == undefined
          ) {
            ifShow = true;
          }
        }
      });
    }
    return ifShow ? (
      <Popover
        destroyTooltipOnHide={true}
        content={
          <div>
            <div>
              <span>
                {trans("global.setCountScore", "将该分类下每题分值设为")}
              </span>
              <InputNumber
                onChange={this.scoreChange.bind(this, index)}
                // precision={0}
                autoFocus={true}
                onPressEnter={this.sureCount.bind(this, index)}
              />
              <span>{trans("global.point", "分")}</span>
            </div>
            <div className={styles.modalBottom}>
              <Button
                shape="round"
                onClick={this.changeScoreVisible.bind(this, index)}
              >
                {trans("global.cancle", "取消")}
              </Button>
              <Button
                type="primary"
                shape="round"
                onClick={this.sureCount.bind(this, index)}
              >
                {trans("global.sure", "确定")}
              </Button>
            </div>
          </div>
        }
        trigger="click"
        visible={this.state[`countScoreViesble${index}`]}
        placement={"bottom"}
        getPopupContainer={() => document.getElementById(`countScore${index}`)}
      >
        <span
          onClick={this.changeScoreVisible.bind(this, index)}
          className={styles.batch}
        >
          {trans("detail.batch", "批量设置每题分数")}
        </span>
      </Popover>
    ) : (
      <Popover
        destroyTooltipOnHide={true}
        content={
          <div>
            <div>
              <span>
                {trans("global.setCountScore", "将该分类下每题分值设为")}
              </span>
              <InputNumber
                onChange={this.scoreChange.bind(this, index)}
                // precision={0}
                autoFocus={true}
                onPressEnter={this.sureCount.bind(this, index)}
              />
              <span>{trans("global.point", "分")}</span>
            </div>
            <div className={styles.modalBottom}>
              <Button
                shape="round"
                onClick={this.changeScoreVisible.bind(this, index)}
              >
                {trans("global.cancle", "取消")}
              </Button>
              <Button
                type="primary"
                shape="round"
                onClick={this.sureCount.bind(this, index)}
              >
                {trans("global.sure", "确定")}
              </Button>
            </div>
          </div>
        }
        trigger="click"
        visible={this.state[`countScoreViesble${index}`]}
        placement={"bottom"}
        getPopupContainer={() => document.getElementById(`countScore${index}`)}
      >
        <span className={styles.countScoreEdit}>
          {trans("detai.itemScore", "每题{$num}分", {
            num:
              item.questionList &&
              item.questionList.length > 0 &&
              item.questionList[0].questionScore
                ? JSON.stringify(item.questionList[0].questionScore) || 0
                : "0",
          })}
          <i
            className={styles.iconfont}
            onClick={this.changeScoreVisible.bind(this, index)}
          >
            &#xe6aa;
          </i>
        </span>
      </Popover>
    );
  };

  onRefPropositional = (reference) => {
    this.stuBraftEditor = reference;
  };

  //格式化返回题目
  formatOption = (questionItem) => {
    const optionList = toSafeArray(questionItem && questionItem.optionList).map(
      (item) => {
        const key = item && item.key ? item.key : "";
        const answers = String((item && item.answers) || "");
        const prefixedAnswer =
          key && !answers.startsWith(`${key}:`) ? `${key}:${answers}` : answers;
        return {
          ...item,
          answers: prefixedAnswer,
        };
      },
    );
    return {
      ...questionItem,
      optionList,
    };
  };
  getExistingQuestion = (questionId, list = this.state.list) => {
    let targetQuestion = null;
    toSafeArray(list).some((moduleItem) =>
      toSafeArray(moduleItem.questionList).some((question) => {
        if (isSameQuestionId(question.questionId, questionId)) {
          targetQuestion = question;
          return true;
        }
        return false;
      }),
    );
    return targetQuestion;
  };
  getEditedQuestionScore = (questionId, draft = {}) => {
    const existingQuestion = this.getExistingQuestion(questionId);
    return (
      normalizeScore(draft.questionScore) ||
      normalizeScore(existingQuestion && existingQuestion.questionScore)
    );
  };
  normalizeQuestionDraftForSave = (draft = {}) => {
    const questionType = Number(draft.type) || 5;
    const question = {
      analysis: draft.analysis || "",
      answer: questionType === 3 ? null : draft.answer || "",
      chapterIds: normalizeIdListForSave(draft.chapterIds),
      chapterLabels: toSafeArray(draft.chapterLabels),
      chapterSelections: normalizeIdListForSave(
        draft.chapterSelections && draft.chapterSelections.length > 0
          ? draft.chapterSelections
          : draft.chapterIds,
      ),
      content: draft.content || "",
      gapFillingAnswer: questionType === 3 ? draft.gapFillingAnswer : undefined,
      indicatorIds: normalizeIdListForSave(draft.indicatorIds),
      indicatorLabels: toSafeArray(draft.indicatorLabels),
      knowledgeIds: normalizeIdListForSave(draft.knowledgeIds),
      knowledgeLabels: toSafeArray(draft.knowledgeLabels),
      knowledgeSelections: normalizeIdListForSave(
        draft.knowledgeSelections && draft.knowledgeSelections.length > 0
          ? draft.knowledgeSelections
          : draft.knowledgeIds,
      ),
      optionKnowledgeSelections: toSafeArray(
        draft.optionKnowledgeSelections,
      ).map((selection) => normalizeIdListForSave(selection)),
      optionList: toSafeArray(draft.optionList),
      questionLevel: Number(draft.questionLevel) || 2,
      questionLevelName: draft.questionLevelName,
      questionScore: normalizeScore(draft.questionScore),
      sonQuestionList:
        questionType === 6
          ? toSafeArray(draft.sonQuestionList).map((childQuestion) =>
              this.normalizeQuestionDraftForSave(childQuestion),
            )
          : [],
      type: questionType,
    };

    if (draft.questionId && !isMockQuestionId(draft.questionId)) {
      question.questionId = draft.questionId;
    }

    return question;
  };
  buildQuestionSavePayload = (draft = {}) => ({
    gradeId: draft.gradeId,
    subjectId: draft.subjectId,
    questionList: [this.normalizeQuestionDraftForSave(draft)],
    chapterIds: normalizeIdListForSave(
      draft.chapterSelections && draft.chapterSelections.length > 0
        ? draft.chapterSelections
        : draft.chapterIds,
    ),
    chapterValues: toSafeArray(draft.chapterLabels),
    indicatorIds: normalizeIdListForSave(draft.indicatorIds),
    knowledgeIds: normalizeIdListForSave(draft.knowledgeIds),
    knowledgeValues: toSafeArray(
      draft.knowledgeSelections && draft.knowledgeSelections.length > 0
        ? draft.knowledgeSelections
        : draft.knowledgeLabels,
    ),
  });
  querySavedQuestion = async (questionId) => {
    const response = await fetchQuestionDetail({ questionId });
    if (!response.ifLogin) {
      loginRedirect();
      return null;
    }
    return response.status ? response.content || null : null;
  };
  handleQuestionEditorSave = async (localSavePayload) => {
    const draft = localSavePayload && localSavePayload.draft;
    if (!draft || this.state.questionEditorSaving) {
      return;
    }

    this.setState({ questionEditorSaving: true });
    try {
      const response = await saveQuestionBatch(
        this.buildQuestionSavePayload(draft),
      );
      if (!response.ifLogin) {
        loginRedirect();
        return;
      }
      if (!response.status) {
        message.error(
          response.message ||
            trans("detailView.questionSaveFailed", "题目保存失败"),
        );
        return;
      }

      const questionId = isMockQuestionId(draft.questionId)
        ? toSafeArray(response.content)[0]
        : draft.questionId || toSafeArray(response.content)[0];
      if (!questionId) {
        message.error(
          trans(
            "detailView.questionSaveMissingId",
            "题目保存失败，未返回题目 ID",
          ),
        );
        return;
      }

      let savedQuestion = null;
      try {
        savedQuestion = await this.querySavedQuestion(questionId);
      } catch (error) {
        console.error(error);
      }
      await this.updateItem(questionId, draft, savedQuestion);
      this.props.dispatch({
        type: "home/clearQuestionItem",
      });
      this.setState({
        editModalVisible: false,
      });
      this.questionEditorController = undefined;
      message.success(trans("detailView.questionUpdated", "题目已更新"));
    } catch (error) {
      console.error(error);
      message.error(trans("detailView.questionSaveFailed", "题目保存失败"));
    } finally {
      this.setState({ questionEditorSaving: false });
    }
  };
  buildEditedQuestionForList = (id, draft = {}, savedQuestion = {}) => {
    const existingQuestion = this.getExistingQuestion(id);
    const baseQuestion = savedQuestion || existingQuestion || {};
    const draftQuestion = this.normalizeQuestionDraftForSave(draft);
    const editedScore = this.getEditedQuestionScore(id, draft);

    return this.formatOption({
      ...baseQuestion,
      ...draftQuestion,
      optionList: toSafeArray(draftQuestion.optionList),
      questionId: id,
      questionLevelName:
        draftQuestion.questionLevelName || baseQuestion.questionLevelName,
      questionScore: editedScore,
      questionSerialNumber: baseQuestion.questionSerialNumber || null,
      studentAnswer: baseQuestion.studentAnswer || null,
      type: Number(draftQuestion.type) || Number(baseQuestion.type) || 5,
    });
  };
  refreshQuestionModule = (moduleItem = {}) => {
    const questionList = toSafeArray(moduleItem.questionList);
    const moduleScore = questionList.reduce(
      (total, question) =>
        total + (normalizeScore(question.questionScore) || 0),
      0,
    );
    return {
      ...moduleItem,
      moduleQuestionNumber: questionList.length,
      moduleScore: moduleScore || null,
      questionList,
    };
  };
  replaceEditedQuestionInList = (list = [], editedQuestion) => {
    const nextList = JSON.parse(JSON.stringify(list || []));
    const questionId = editedQuestion.questionId;
    let sourceModuleIndex = -1;
    let sourceQuestionIndex = -1;

    for (const [moduleIndex, moduleItem] of nextList.entries()) {
      const questionList = toSafeArray(moduleItem.questionList);
      const questionIndex = questionList.findIndex((question) =>
        isSameQuestionId(question.questionId, questionId),
      );
      if (questionIndex > -1) {
        sourceModuleIndex = moduleIndex;
        sourceQuestionIndex = questionIndex;
        questionList.splice(questionIndex, 1);
      }
      moduleItem.questionList = questionList;
    }

    const isFreeSort = Number(this.props.keyQuestion) === 2;
    if (isFreeSort) {
      const targetModuleIndex =
        sourceModuleIndex > -1
          ? sourceModuleIndex
          : nextList.length > 0
            ? 0
            : -1;
      if (targetModuleIndex === -1) {
        nextList.push({
          moduleName: "所有题型",
          moduleQuestionNumber: 0,
          moduleScore: null,
          moduleType: 0,
          questionList: [],
        });
      }
      const targetModule =
        nextList[targetModuleIndex > -1 ? targetModuleIndex : 0];
      const insertIndex =
        sourceQuestionIndex > -1
          ? Math.min(sourceQuestionIndex, targetModule.questionList.length)
          : targetModule.questionList.length;
      targetModule.questionList.splice(insertIndex, 0, editedQuestion);
      return nextList.map(this.refreshQuestionModule);
    }

    let targetModuleIndex = nextList.findIndex(
      (moduleItem) =>
        Number(moduleItem.moduleType) === Number(editedQuestion.type),
    );
    if (targetModuleIndex === -1) {
      nextList.push({
        moduleName: getQuestionTypeModuleName(editedQuestion.type),
        moduleQuestionNumber: 0,
        moduleScore: null,
        moduleType: editedQuestion.type,
        questionList: [],
      });
      targetModuleIndex = nextList.length - 1;
    }

    const targetModule = nextList[targetModuleIndex];
    const shouldKeepPosition = sourceModuleIndex === targetModuleIndex;
    const insertIndex =
      shouldKeepPosition && sourceQuestionIndex > -1
        ? Math.min(sourceQuestionIndex, targetModule.questionList.length)
        : targetModule.questionList.length;
    targetModule.questionList.splice(insertIndex, 0, editedQuestion);

    return nextList
      .filter(
        (moduleItem) =>
          toSafeArray(moduleItem.questionList).length > 0 ||
          Number(moduleItem.moduleType) === Number(editedQuestion.type),
      )
      .map(this.refreshQuestionModule);
  };
  updateItem = (id, draft = {}, savedQuestion = null) => {
    const editedQuestion = this.buildEditedQuestionForList(
      id,
      draft,
      savedQuestion,
    );
    const newList = this.replaceEditedQuestionInList(
      this.state.list,
      editedQuestion,
    );
    this.setState({
      list: newList,
    });
    this.props.updateList(newList);
    return Promise.resolve(newList);
  };

  handleOkResolving = () => {
    this.setState({
      visResolving: false,
    });
  };

  handleCancelResolving = () => {
    this.setState({
      visResolving: false,
    });
  };

  blurEditAnalysis = () => {};

  changeDifficultyChoice = (value, index, idList) => {
    let newIdList = [];
    idList &&
      idList.length > 0 &&
      idList.map((item) => {
        let array = item.split("-");
        newIdList.push(array.at(-1));
      });
    let state = Object.assign({}, this.state);
    let list = JSON.parse(JSON.stringify(this.state.list));
    list.map((it) => {
      it.questionList &&
        it.questionList.length > 0 &&
        it.questionList.map((item) => {
          if (item.questionId == index) {
            item.questionLevel = value;
          }
        });
    });
    this.setState(
      {
        list,
        ...state,
      },
      () => {
        this.props
          .dispatch({
            type: "home/updateQuestionKnowlegeOrLevel",
            payload: {
              questionId: index,
              questionLevel: value,
              knowlegeIdList: newIdList,
            },
          })
          .then(() => {
            message.success(trans("global.editSuccess", "修改成功"));
          });
      },
    );
  };

  labelChange = (value, key, index, ind) => {
    let idList = [];
    value &&
      value.length > 0 &&
      value.map((item) => {
        let array = item.split("-");
        idList.push(array.at(-1));
      });

    const { checkQuestionId } = this.props;

    let list = JSON.parse(JSON.stringify(this.state.list));
    if (key == "knowledge") {
      this.props
        .dispatch({
          type: "home/updateQuestionKnowlegeOrLevel",
          payload: {
            questionId: list[index].questionList[ind].questionId,
            questionLevel: list[index].questionList[ind].questionLevel,
            knowlegeIdList: idList,
          },
        })
        .then(() => {
          message.success(trans("global.editSuccess", "修改成功"));
        });
      list[index].questionList[ind].knowledgeIds = value;
      list[index].questionList[ind].knowledgeValues = value;
    } else if (key == "indicator") {
      updateQuestionIndicator({
        questionId: list[index].questionList[ind].questionId,
        indicatorIds: idList,
      }).then((res) => {
        message.success(trans("global.editSuccess", "修改成功"));
      });
      list[index].questionList[ind].indicatorIds = value;
      list[index].questionList[ind].indicatorValues = value;
    } else if (key == "chapter") {
      updateQuestionChapter({
        questionId: list[index].questionList[ind].questionId,
        chapterIds: idList,
      }).then((res) => {
        message.success(trans("global.editSuccess", "修改成功"));
      });

      list[index].questionList[ind].chapterId = value;
      list[index].questionList[ind].chapterValues = value;
    }
    this.setState(
      {
        list: list,
      },
      () => {
        this.props.updateList(list);
      },
    );
  };

  renderItemSon = (item) => {
    let ifSonQuestion = false;
    if (item.questionList && item.questionList.length > 0) {
      item.questionList.map((index) => {
        if (index.type == 6) {
          ifSonQuestion = true;
        }
      });
    }
    return ifSonQuestion;
  };
  getChildOptionsContent = (question) => {
    const change = (type, data) => {
      switch (type) {
        case 1:
        case 7: {
          this.RadioChildChange(question.questionId, data.value);
          break;
        }
        case 2:
        case 8: {
          this.checkChildChange(question.questionId, data.value);
          break;
        }
        case 3: {
          this.changeChildCompletion(
            question.questionId,
            data.index,
            data.value,
          );
          break;
        }
        case 4: {
          this.changeChildJudge(question.questionId, data.value);
          break;
        }
        default: {
          break;
        }
      }
    };
    return <AnswerOptions question={question} onChange={change} />;
    //  if (question.type === 1) {
    //     return question.optionList.map((option, newI) => {
    //       // 是否以字母开头(如果是字母开头手动删除掉A. B. C.)
    //       let flag = isAlphaStart(option.answers)
    //       return <div className={styles.optionContent}
    //         onClick={this.RadioChildChange.bind(this, question.questionId, option.key)}
    //       >
    //         <div
    //           className={`${styles.optionHandle} ${question.studentAnswer === option.key ? styles.checkedOption : ''}`}
    //         >
    //           {option.key}
    //         </div>
    //         <div
    //           style={{ display: 'flex' }}
    //           dangerouslySetInnerHTML={{ __html: flag ? option.answers?.substring(2) : option.answers }}
    //         ></div>
    //       </div>
    //     })
    //   } else if (question.type === 2) {
    //     return question.optionList.map((option, newI) => {
    //       // 是否以字母开头(如果是字母开头手动删除掉A. B. C.)
    //       let flag = isAlphaStart(option.answers)
    //       return <div className={styles.optionContent}
    //         onClick={this.checkChildChange.bind(this, question.questionId, option.key)}
    //       >
    //         <div
    //           className={`${styles.optionHandle} ${question.studentAnswer?.indexOf(option.key) > -1 ? styles.checkedOption : ''}`}
    //         >
    //           {option.key}
    //         </div>
    //         <div
    //           style={{ display: 'flex', whiteSpace: 'nowrap' }}
    //           dangerouslySetInnerHTML={{ __html: flag ? option.answers?.substring(2) : option.answers }}
    //         ></div>
    //       </div>
    //     })
    //   } else if (question.type === 3) {
    //     return question.studentGapFillingAnswer?.length ? question.studentGapFillingAnswer.map((i, op) => (
    //       <div style={{ position: 'relative', marginRight: '20px', minWidth: '100px', height: '32px' }}>
    //         <span style={{ display: 'inline-block', width: '100%', height: '100%', visibility: 'hidden' }}>
    //           {i}
    //         </span>
    //         <input
    //           className={styles.gapfilling}
    //           placeholder="点击填写答案"
    //           value={i}
    //           onChange={(e) => { this.changeChildCompletion(question.questionId, op, e) }}
    //         />
    //       </div>)) : null
    //   } else if (question.type === 4) {
    //     return <div style={{
    //       display: 'flex',
    //       flexWrap: 'wrap',
    //       alignItems: 'center',
    //       minWidth: '20%',
    //       padding: '5px',
    //       margin: '0px 5px 5px 0',
    //       borderRadius: '8px'
    //     }}>
    //       <div style={{ marginRight: '8px' }}
    //         className={`${styles.judgeOption} ${question.studentAnswer == "true" || question.studentAnswer === true ? styles.checkedOption : ''}`}
    //         onClick={this.changeChildJudge.bind(this, question.questionId, true)}
    //       >
    //         <div className={styles.judgeIcon}>
    //           <i className={`${styles.iconfont}`}>&#xe6a8;</i>
    //         </div>
    //         <div className={styles.judgeLabel}>
    //           {trans("global.right", "正确")}
    //         </div>
    //       </div>
    //       <div className={`${styles.judgeOption} ${question.studentAnswer == "false" || question.studentAnswer === false ? styles.checkedOption : ''}`}
    //         onClick={this.changeChildJudge.bind(this, question.questionId, false)}
    //       >
    //         <div className={styles.judgeIcon}>
    //           <i className={`${styles.iconfont}`}>&#xe6a9;</i>
    //         </div>
    //         <div className={styles.judgeLabel}>
    //           {trans("global.wrong", "错误")}
    //         </div>
    //       </div>
    //     </div>
    //   }
  };
  // question：题干
  // isAnswer：是否支持答题
  getOptionsContent = (question, isAnswer) => {
    const change = (type, data) => {
      if (!isAnswer) {
        return;
      }
      switch (type) {
        case 1:
        case 7: {
          this.RadioChange(question.questionId, data.value);
          break;
        }
        case 2:
        case 8: {
          this.checkChange(question.questionId, data.value);
          break;
        }
        case 3: {
          this.changeCompletion(question.questionId, data.index, data.value);
          break;
        }
        case 4: {
          this.changeJudge(question.questionId, data.value);
          break;
        }
        default: {
          break;
        }
      }
    };
    return (
      <AnswerOptions
        question={question}
        isAnswer={isAnswer}
        onChange={change}
      />
    );
    //  if ((question.type === 1 || question.type === 7) && question.optionList) {
    //     return question.optionList.map((option, newI) => {
    //       // 是否以字母开头(如果是字母开头手动删除掉A. B. C.)
    //       let flag = isAlphaStart(option.answers)
    //       return <div className={styles.optionContent}
    //         onClick={() => { isAnswer && this.RadioChange(question.questionId, option.key) }}
    //       >
    //         <div
    //           className={`${styles.optionHandle} ${question.studentAnswer === option.key ? styles.checkedOption : ''}`}
    //         >
    //           {option.key}
    //         </div>
    //         <div
    //           style={{ display: 'flex' }}
    //           dangerouslySetInnerHTML={{ __html: flag ? option.answers?.substring(2) : option.answers }}
    //         ></div>
    //       </div>
    //     })
    //   } else if ((question.type === 2 || question.type === 8) && question.optionList) {
    //     return question.optionList.map((option, newI) => {
    //       // 是否以字母开头(如果是字母开头手动删除掉A. B. C.)
    //       let flag = isAlphaStart(option.answers)
    //       return <div className={styles.optionContent}
    //         onClick={() => { isAnswer && this.checkChange(question.questionId, option.key) }}
    //       >
    //         <div
    //           className={`${styles.optionHandle} ${question.studentAnswer?.indexOf(option.key) > -1 ? styles.checkedOption : ''}`}
    //         >
    //           {option.key}
    //         </div>
    //         <div
    //           style={{ display: 'flex', whiteSpace: 'nowrap' }}
    //           dangerouslySetInnerHTML={{ __html: flag ? option.answers?.substring(2) : option.answers }}
    //         ></div>
    //       </div>
    //     })
    //   } else if (question.type === 3) {
    //     if (isAnswer) {
    //       return question.studentGapFillingAnswer?.length ? question.studentGapFillingAnswer.map((i, op) => (
    //         <div style={{ position: 'relative', marginRight: '20px', minWidth: '100px', height: '32px' }}>
    //           <span style={{ display: 'inline-block', width: '100%', height: '100%', visibility: 'hidden' }}>
    //             {i}
    //           </span>
    //           <input
    //             className={styles.gapfilling}
    //             placeholder="点击填写答案"
    //             value={i}
    //             onChange={(e) => { this.changeCompletion(question.questionId, op, e) }}
    //           />
    //         </div>)) : null
    //     } else {
    //       return <div className={styles.optionContent}>
    //         {question?.studentGapFillingAnswer?.length ?
    //           question.studentGapFillingAnswer.map((i, op) => (
    //             <div className={styles.completionList}
    //               dangerouslySetInnerHTML={{ __html: i }}
    //             />))
    //           : (question.gapFillingAnswer?.answers?.length ?
    //             question.gapFillingAnswer.answers.map((i) => (
    //               <div className={`${styles.completionList} ${styles.notwrite}`} />
    //             )) : null)
    //         }
    //       </div>
    //     }
    //   } else if (question.type === 4) {
    //     return <div style={{
    //       display: 'flex',
    //       flexWrap: 'wrap',
    //       alignItems: 'center',
    //       minWidth: '20%',
    //       padding: '5px',
    //       margin: '0px 5px 5px 0',
    //       borderRadius: '8px'
    //     }}>
    //       <div style={{ marginRight: '8px' }}
    //         className={`${styles.judgeOption} ${question.studentAnswer == "true" || question.studentAnswer === true ? styles.checkedOption : ''}`}
    //         onClick={() => { isAnswer && this.changeJudge(question.questionId, true) }}
    //       >
    //         <div className={styles.judgeIcon}>
    //           <i className={`${styles.iconfont}`}>&#xe6a8;</i>
    //         </div>
    //         <div className={styles.judgeLabel}>
    //           {trans("global.right", "正确")}
    //         </div>
    //       </div>
    //       <div className={`${styles.judgeOption} ${question.studentAnswer == "false" || question.studentAnswer === false ? styles.checkedOption : ''}`}
    //         onClick={() => { isAnswer && this.changeJudge(question.questionId, false) }}
    //       >
    //         <div className={styles.judgeIcon}>
    //           <i className={`${styles.iconfont}`}>&#xe6a9;</i>
    //         </div>
    //         <div className={styles.judgeLabel}>
    //           {trans("global.wrong", "错误")}
    //         </div>
    //       </div>
    //     </div>
    //   } else if (question.type === 5) {
    //     return (<div
    //       dangerouslySetInnerHTML={{ __html: question.studentAnswer }}
    //       className={styles.completionList}
    //     />)
    //   }
  };

  getAnswerResultContent = (question) => {
    let judgement = {
      0: "待批改",
      1: "回答正确",
      2: "回答错误",
      3: "部分得分",
    }[question.isCorrect];

    let color = {
      回答正确: "#04C919",
      回答错误: "#FC491E",
      部分得分: "#FC8A1E",
      待批改: "#2B75FF",
    };

    let tag = (
      <div
        className={styles.answerResultsBox}
        style={{ border: `1px solid ${color[judgement]}` }}
      >
        <div
          className={styles.leftText}
          style={{ backgroundColor: color[judgement] }}
        >
          {judgement}
        </div>
        <div className={styles.rightText} style={{ color: color[judgement] }}>
          {judgement == "待批改"
            ? "···"
            : `${question.studentScore}${trans("global.point", "分")}`}
        </div>
      </div>
    );

    if (question.type == 1 || question.type == 2) {
      return (
        <div style={{ display: "flex", alignItems: "center" }}>
          {tag}
          {this.props?.openAnswer ? (
            <div style={{ color: "#0B1B45" }}>
              &nbsp;【{trans("global.rightAnswer", "正确答案")}】 ：
              {question.answer}
            </div>
          ) : null}
        </div>
      );
    } else if (question.type === 3) {
      return (
        <div className={[styles.optionBox, styles.completionBox].join(" ")}>
          {tag}
          {this.props?.openAnswer ? (
            <div
              style={{
                color: "#0B1B45",
                display: "flex",
                alignItems: "center",
              }}
            >
              &nbsp;【{trans("global.rightAnswer", "正确答案")}】 ：
              {question?.gapFillingAnswer?.answers?.length
                ? question.gapFillingAnswer.answers.map((index, op) => (
                    <div
                      dangerouslySetInnerHTML={{ __html: index }}
                      className={styles.completionList}
                    ></div>
                  ))
                : null}
            </div>
          ) : null}
        </div>
      );
    } else if (question.type == 4) {
      return (
        <div style={{ display: "flex", alignItems: "center" }}>
          {tag}
          {this.props?.openAnswer ? (
            <div style={{ color: "#0B1B45" }}>
              &nbsp;【{trans("global.rightAnswer", "正确答案")}】 ：
              {question.answer == "true"
                ? trans("global.booleanCorrect", "正确")
                : trans("global.booleanWrong", "错误")}
            </div>
          ) : null}
        </div>
      );
    } else if (question.type == 5) {
      // 问答题
      return (
        <div style={{ display: "flex", alignItems: "center" }}>
          {tag}
          {/* 问答题正确答案太长，放不下，暂时先隐藏掉 */}
          {/* {
          this.props?.openAnswer ? <span className={styles.completionTitle}>
            &nbsp;【{trans("global.rightAnswer", "正确答案")}】：
            <span
              dangerouslySetInnerHTML={{ __html: question.answer }}
              className={styles.completionList}
            />
          </span> : null
        } */}
        </div>
      );
    }
  };

  questionCheckedChange = (e, index, index_) => {
    let list = JSON.parse(JSON.stringify(this.state.list));
    list[index].questionList[index_].checked = e.target.checked;
    this.setState(
      {
        list: list,
      },
      () => {
        this.props.updateList(list);
        console.log(list, "list");
      },
    );
  };
  render() {
    const {
      list,
      dropIndex,
      IconFont,
      visResolving,
      analysisText,
      editModalVisible,
      questionEditorSaving,
    } = this.state;
    const {
      stageList,
      gradeList,
      subjectList,
      questionList,
      typeList,
      editQuestion,
      openScore,
      openAnswer,
      isScore,
      treeData,
      labelList,
      questionItem,
    } = this.props;
    const difficulty = [
      { key: 1, name: trans("global.easy", "简单") },
      { key: 2, name: trans("global.general", "普通") },
      { key: 3, name: trans("global.difficult", "困难") },
    ];
    let newTree = [];
    let newTree1 = [];
    console.log(this.props.ifTest, "this.props.ifTest");
    console.log(this.props.ifStu, "this.props.ifStu");

    if (labelList && labelList.length > 0) {
      newTree1 = JSON.parse(JSON.stringify(labelList));
      const handeData = (list) => {
        for (const threeItem of list) {
          threeItem.id = threeItem.key;
          threeItem.value = `${threeItem.title}-${threeItem.pinyin || ""}-${threeItem.id}`;
          if (threeItem.children && threeItem.children.length > 0) {
            handeData(threeItem.children);
          }
        }
      };
      handeData(newTree1);
      console.log(newTree1, "素养");
    }
    console.log(this.props.chapterList, "章节");
    console.log(treeData, "知识点");
    const lProperties = {
      treeData: treeData,
      treeCheckable: true,
      showCheckedStrategy: SHOW_PARENT,
      showSearch: true,
      placeholder: trans("global.pleaseChoose", "请选择"),
      getPopupContainer: () => document.querySelector("#knowledgePoints"),
    };

    return (
      <div className={styles.listBox}>
        {list && list.length > 0
          ? list.map((item, index) => (
              <div className={styles.moduleBox} key={index}>
                <div
                  className={styles.moduleTitle}
                  id={`itemNameViesb${index}`}
                >
                  <span className={styles.titleContent}>
                    {convertToChineseNumber(index + 1)}、
                    {this.props.ifEdit && !this.props.ifStu ? (
                      <Popover
                        destroyTooltipOnHide={true}
                        content={
                          <div>
                            <div>
                              <Input
                                onChange={this.itemNameChange.bind(this, index)}
                                onBlur={this.sureItemName.bind(this, index)}
                                onPressEnter={this.sureItemName.bind(
                                  this,
                                  index,
                                )}
                                id="inpID2"
                                defaultValue={
                                  this.props.detailList[index]?.moduleName
                                }
                              />
                            </div>
                          </div>
                        }
                        trigger="click"
                        visible={this.state[`itemNameViesb${index}`]}
                        placement={"bottom"}
                        getPopupContainer={() =>
                          document.getElementById(`itemNameViesb${index}`)
                        }
                        overlayClassName={styles.titlePopover}
                      >
                        <span
                          onClick={this.changeItemNameVisible.bind(this, index)}
                          style={{ cursor: "pointer" }}
                        >
                          {this.props.detailList[index]?.moduleName}
                        </span>
                      </Popover>
                    ) : (
                      <span style={{ cursor: "pointer" }}>
                        {this.props.detailList[index]?.moduleName}
                      </span>
                    )}
                  </span>

                  {/* 老师角色 */}
                  {this.props.ifTeacherView ? (
                    <span className={styles.brackets}>
                      (
                      <span className={styles.questionLength}>
                        {trans("detail.num", "共{$num}题", {
                          num: item.questionList.length || 0,
                        })}
                      </span>
                      {item.moduleType != 7 && item.moduleType != 8 ? (
                        <span
                          className={styles.questionScore}
                          id={`countScore${index}`}
                        >
                          <span>
                            {trans("global.gong", "共")}
                            <span style={{ margin: "0 4px" }}>
                              {this.renderScore(index)}
                            </span>
                            {trans("global.point", "分")}
                          </span>
                        </span>
                      ) : null}
                      )
                    </span>
                  ) : this.props.ifStu ? (
                    <span className={styles.brackets}>
                      (
                      <span className={styles.questionLength}>
                        {trans("detail.num", "共{$num}题", {
                          num: item.questionList.length || 0,
                        })}
                        {isScore ? <>{openScore ? <>，</> : null}</> : <>，</>}
                      </span>
                      {isScore ? (
                        <>
                          {openScore &&
                          item.moduleType != 7 &&
                          item.moduleType != 8 ? (
                            <span
                              className={styles.questionScore}
                              id={`countScore${index}`}
                            >
                              <span>
                                {trans("global.gong", "共")}
                                <span style={{ margin: "0 4px" }}>
                                  {this.renderScore(index)}
                                </span>
                                {trans("global.point", "分")}
                              </span>
                            </span>
                          ) : null}
                        </>
                      ) : item.moduleType != 7 && item.moduleType != 8 ? (
                        <span
                          className={styles.questionScore}
                          id={`countScore${index}`}
                        >
                          <span>
                            {trans("global.gong", "共")}
                            <span style={{ margin: "0 4px" }}>
                              {this.renderScore(index)}
                            </span>
                            {trans("global.point", "分")}
                          </span>
                        </span>
                      ) : null}
                      )
                    </span>
                  ) : this.renderItemSon(item) ? (
                    <span className={styles.brackets}>
                      (
                      <span className={styles.questionLength}>
                        {trans("detail.num", "共{$num}题", {
                          num: item.questionList.length || 0,
                        })}
                      </span>
                      <span
                        className={styles.questionScore}
                        id={`countScore${index}`}
                      >
                        {this.props.ifEdit &&
                        item.moduleType != 7 &&
                        item.moduleType != 8 &&
                        !this.props.detailList[index]?.moduleScore ? (
                          <span
                            className={styles.countScoreEdit}
                            onClick={this.changeScoreVisible.bind(this, index)}
                          >
                            {trans("global.batchSetting", "批量设分")}
                          </span>
                        ) : null}
                        <Modal
                          visible={this.state[`countScoreViesble${index}`]}
                          title={null}
                          footer={null}
                          closable={false}
                          onCancel={this.changeScoreVisible.bind(this, index)}
                        >
                          <div className={styles.batchSetBox}>
                            <div className={styles.batchSetHeader}>
                              <div
                                onClick={this.changeScoreVisible.bind(
                                  this,
                                  index,
                                )}
                                className={[
                                  icon.iconfont,
                                  styles.closeIcon,
                                ].join(" ")}
                              >
                                &#xe6a9;
                              </div>
                              <div className={styles.batchTitle}>
                                {trans(
                                  "detailView.setCombinationQuestionScore",
                                  "设置组合题分数",
                                )}
                                <span className={styles.batchScore}>
                                  （{trans("global.zongfen", "总分")}:{" "}
                                  {item.moduleScore}）
                                </span>
                              </div>
                            </div>
                            <div className={styles.batchSetTab}>
                              {item.questionList && item.questionList.length > 0
                                ? item.questionList.map((it, indd) => (
                                    <div
                                      onClick={this.checkTab.bind(this, indd)}
                                      className={[
                                        styles.questionTab,
                                        this.state.checkTab === indd
                                          ? styles.check
                                          : "",
                                      ].join(" ")}
                                    >
                                      {trans(
                                        "detailView.questionNumber",
                                        "第{$number}题",
                                        { number: indd + 1 },
                                      )}
                                    </div>
                                  ))
                                : null}
                            </div>
                            <div className={styles.batchSetContent}>
                              {item.questionList &&
                              item.questionList[this.state.checkTab] &&
                              item.questionList[this.state.checkTab].type ? (
                                item.questionList[this.state.checkTab]
                                  .sonQuestionList &&
                                item.questionList[this.state.checkTab]
                                  .sonQuestionList.length > 0 ? (
                                  item.questionList[
                                    this.state.checkTab
                                  ].sonQuestionList.map((ii, inde) => (
                                    <div className={styles.batchItem}>
                                      <span className={styles.batchTitle}>
                                        ({inde + 1})
                                      </span>
                                      <InputNumber
                                        onChange={this.changeTypeSonScore.bind(
                                          this,
                                          index,
                                          inde,
                                        )}
                                        value={ii.questionScore}
                                      />
                                      <span className={styles.score}>
                                        {trans("global.point", "分")}
                                      </span>
                                      {inde == 0 ? (
                                        <span
                                          onClick={this.downTypeScore.bind(
                                            this,
                                            index,
                                            inde,
                                            ii.questionScore,
                                          )}
                                          className={styles.down}
                                        >
                                          {trans(
                                            "detailView.fillDown",
                                            "向下填充",
                                          )}
                                        </span>
                                      ) : null}
                                    </div>
                                  ))
                                ) : (
                                  <div className={styles.batchItem}>
                                    <InputNumber
                                      onChange={this.changeTypeBatchScore.bind(
                                        this,
                                        index,
                                      )}
                                      value={
                                        item.questionList[this.state.checkTab]
                                          .questionScore
                                      }
                                    />
                                    <span className={styles.score}>
                                      {trans("global.point", "分")}
                                    </span>
                                  </div>
                                )
                              ) : null}
                            </div>
                            {item.questionList &&
                            item.questionList[this.state.checkTab] &&
                            item.questionList[this.state.checkTab]
                              .questionScore ? (
                              <div className={styles.batchModalBottom}>
                                <div className={styles.batchTitle}>
                                  {trans(
                                    "detailView.singleQuestionTotal",
                                    "单题总共",
                                  )}
                                </div>
                                <div className={styles.batchScore}>
                                  {
                                    item.questionList[this.state.checkTab]
                                      .questionScore
                                  }
                                </div>
                                <div className={styles.score}>
                                  {trans("global.point", "分")}
                                </div>
                              </div>
                            ) : (
                              <div className={styles.batchModalBottom}>
                                <div className={styles.batchTitle}>
                                  {trans(
                                    "detailView.singleQuestionTotal",
                                    "单题总共",
                                  )}
                                </div>
                                <div className={styles.batchScore}></div>
                                <div className={styles.score}>
                                  {trans("global.point", "分")}
                                </div>
                              </div>
                            )}
                          </div>
                        </Modal>

                        {this.props.detailList[index]?.moduleScore &&
                        item.moduleType != 7 &&
                        item.moduleType != 8 ? (
                          <span>
                            ，{trans("global.gong", "共")}
                            <span style={{ margin: "0 4px" }}>
                              {this.state.list[index].moduleScore}
                            </span>
                            {trans("global.point", "分")}
                          </span>
                        ) : null}
                      </span>
                      <span>
                        {this.state.dropVisible && dropIndex === index ? (
                          <span
                            className={styles.add}
                            onClick={this.returnVisible.bind(this, index)}
                            style={{ display: "none" }}
                          >
                            {trans("global.complete", "完成")}
                          </span>
                        ) : this.props.ifEdit ? (
                          <span
                            className={styles.add}
                            onClick={this.showModal.bind(this, item.moduleType)}
                            style={{ display: "none" }}
                          >
                            <i
                              className={[styles.iconfont, styles.addIcon].join(
                                " ",
                              )}
                            >
                              &#xe75a;
                            </i>
                            {trans("detail.fromLibrary", "从题库选择")}
                          </span>
                        ) : null}
                      </span>
                      )
                      {this.props.ifEdit ? (
                        this.props.detailList[index]?.moduleScore ? (
                          <Tooltip
                            title={trans("detail.batch", "批量设置每题分数")}
                            arrowPointAtCenter={true}
                            placement="topRight"
                          >
                            <span
                              className={styles.countScoreEdit}
                              style={{
                                marginLeft: "10px",
                                cursor: "pointer",
                              }}
                            >
                              <i
                                className={[
                                  styles.iconfont,
                                  styles.batchModifyScore,
                                ].join(" ")}
                                onClick={this.changeScoreVisible.bind(
                                  this,
                                  index,
                                )}
                                style={{ fontSize: "14px" }}
                              >
                                &#xe6b3;
                              </i>
                            </span>
                          </Tooltip>
                        ) : null
                      ) : null}
                      {this.props.ifEdit ? (
                        this.state.dropVisible && dropIndex === index ? null : (
                          <span
                            className={styles.reorder}
                            onClick={this.changeDrop.bind(this, index)}
                            style={{ display: "none" }}
                          >
                            <i className={styles.iconfont}>&#xe769;</i>
                            {trans("global.reorder", "调整顺序")}
                          </span>
                        )
                      ) : null}
                    </span>
                  ) : (
                    <span className={styles.brackets}>
                      (
                      <span className={styles.questionLength}>
                        {trans("detail.num", "共{$num}题", {
                          num: item.questionList.length || 0,
                        })}
                      </span>
                      <span
                        className={styles.questionScore}
                        id={`countScore${index}`}
                      >
                        <Popover
                          destroyTooltipOnHide={true}
                          content={
                            <div className={styles.batchSetPop}>
                              <div className={styles.nmbInp}>
                                <span>
                                  {trans(
                                    "global.setCountScore",
                                    "将该分类下每题分值设为",
                                  )}
                                </span>
                                <InputNumber
                                  onChange={this.scoreChange.bind(this, index)}
                                  autoFocus={true}
                                  onPressEnter={this.sureCount1.bind(
                                    this,
                                    index,
                                  )}
                                />
                                <span>{trans("global.point", "分")}</span>
                              </div>
                              <div className={styles.modalBottom1}>
                                <button
                                  className={styles.cancleScore}
                                  onClick={this.changeScoreVisible1.bind(
                                    this,
                                    index,
                                  )}
                                >
                                  {trans("global.cancle", "取消")}
                                </button>
                                <button
                                  className={styles.sureScore}
                                  onClick={this.sureCount1.bind(this, index)}
                                >
                                  {trans("global.sure", "确定")}
                                </button>
                              </div>
                            </div>
                          }
                          trigger="click"
                          visible={this.state[`countScoreViesble1${index}`]}
                          placement={"bottom"}
                          getPopupContainer={() =>
                            document.getElementById(`countScore${index}`)
                          }
                        >
                          {this.props.ifEdit &&
                          item.moduleType != 7 &&
                          item.moduleType != 8 &&
                          !this.props.detailList[index]?.moduleScore ? (
                            <span
                              className={styles.countScoreEdit}
                              onClick={this.changeScoreVisible1.bind(
                                this,
                                index,
                              )}
                            >
                              {trans("global.batchSetting", "批量设分")}
                            </span>
                          ) : null}
                        </Popover>
                        {this.props.detailList[index]?.moduleScore &&
                        item.moduleType != 7 &&
                        item.moduleType != 8 ? (
                          <span>
                            ，{trans("global.gong", "共")}
                            <span style={{ margin: "0 4px" }}>
                              {this.state.list[index].moduleScore}
                            </span>
                            {trans("global.point", "分")}
                          </span>
                        ) : null}
                      </span>
                      <span>
                        {this.state.dropVisible && dropIndex === index ? (
                          <span
                            className={styles.add}
                            onClick={this.returnVisible.bind(this, index)}
                            style={{ display: "none" }}
                          >
                            {trans("global.complete", "完成")}
                          </span>
                        ) : this.props.ifEdit ? (
                          <span
                            className={styles.add}
                            onClick={this.showModal.bind(this, item.moduleType)}
                            style={{ display: "none" }}
                          >
                            <i
                              className={[styles.iconfont, styles.addIcon].join(
                                " ",
                              )}
                            >
                              &#xe75a;
                            </i>
                            {trans("detail.fromLibrary", "从题库选择")}
                          </span>
                        ) : null}
                      </span>
                      )
                      {this.props.ifEdit ? (
                        <Popover
                          destroyTooltipOnHide={true}
                          content={
                            <div className={styles.batchSetPop}>
                              <div>
                                <span>
                                  {trans(
                                    "global.setCountScore",
                                    "将该分类下每题分值设为",
                                  )}
                                </span>
                                <InputNumber
                                  onChange={this.scoreChange.bind(this, index)}
                                  // precision={0}
                                  autoFocus={true}
                                  onPressEnter={this.sureCount.bind(
                                    this,
                                    index,
                                  )}
                                />
                                <span>{trans("global.point", "分")}</span>
                              </div>
                              <div className={styles.modalBottom1}>
                                <button
                                  className={styles.cancleScore}
                                  onClick={this.changeScoreVisible.bind(
                                    this,
                                    index,
                                  )}
                                >
                                  {trans("global.cancle", "取消")}
                                </button>
                                <button
                                  className={styles.sureScore}
                                  onClick={this.sureCount.bind(this, index)}
                                >
                                  {trans("global.sure", "确定")}
                                </button>
                              </div>
                            </div>
                          }
                          trigger="click"
                          visible={this.state[`countScoreViesble${index}`]}
                          placement={"bottom"}
                          getPopupContainer={() =>
                            document.getElementById(`countScore${index}`)
                          }
                        >
                          {this.props.detailList[index]?.moduleScore ? (
                            <Tooltip
                              title={trans("detail.batch", "批量设置每题分数")}
                              arrowPointAtCenter={true}
                              placement="topRight"
                            >
                              <span
                                className={styles.countScoreEdit}
                                style={{
                                  marginLeft: "10px",
                                  cursor: "pointer",
                                }}
                              >
                                <i
                                  className={[
                                    styles.iconfont,
                                    styles.batchModifyScore,
                                  ].join(" ")}
                                  onClick={this.changeScoreVisible.bind(
                                    this,
                                    index,
                                  )}
                                  style={{ fontSize: "14px" }}
                                >
                                  &#xe6b3;
                                </i>
                              </span>
                            </Tooltip>
                          ) : null}
                        </Popover>
                      ) : null}
                      {this.props.ifEdit ? (
                        this.state.dropVisible && dropIndex === index ? null : (
                          <span
                            className={styles.reorder}
                            onClick={this.changeDrop.bind(this, index)}
                            style={{ display: "none" }}
                          >
                            <i className={styles.iconfont}>&#xe769;</i>
                            {trans("global.reorder", "调整顺序")}
                          </span>
                        )
                      ) : null}
                    </span>
                  )}
                </div>

                {item.questionList && item.questionList.length > 0
                  ? item.questionList.map((it, ind) => (
                      <div
                        className={[
                          this.props.checkQuestionId === it.questionId
                            ? styles.active
                            : "",
                          styles.questionBox,
                          this.props.ifEdit == false
                            ? styles.viewQuestionBox
                            : "",
                          this.props.ifStu
                            ? styles.studentBox
                            : styles.teacherBox,
                        ].join(" ")}
                        id={`question${it.questionId}`}
                        key={ind}
                      >
                        <div
                          className={[
                            !this.props.ifStu && this.props.ifEdit
                              ? styles.questionRight
                              : styles.stuQuestionRight,
                            this.state.dropVisible && dropIndex === index
                              ? styles.flexBox
                              : null,
                            this.props.ifStu ? null : styles.noBottom,
                          ].join(" ")}
                          onClick={this.checkQuestion.bind(this, it.questionId)}
                          draggable={this.state.dropVisible}
                          onDragStart={this.ondragstartNew}
                          onDragOver={this.ondragover}
                          onDragLeave={this.ondragleaveNew}
                          onDrop={this.ondropNew}
                          onDragEnter={this.ondragenterNew}
                          id={`${index}_${ind}`}
                        >
                          <span
                            className={styles.fractionSubject}
                            style={{
                              verticalAlign: "middle",
                              marginRight: "5px",
                              display: "flex",
                            }}
                          >
                            {!this.props.ifStu && this.props.ifEdit ? (
                              <div
                                style={{ float: "left", marginRight: "15px" }}
                              >
                                <Checkbox
                                  onChange={(e) => {
                                    this.questionCheckedChange(e, index, ind);
                                  }}
                                  checked={it.checked}
                                />
                              </div>
                            ) : null}

                            {/* 从分析页面个性化作业进来回展示此模块 */}
                            {this.props.fromWork && !it.isShow ? (
                              <span
                                className={[
                                  this.props.checkQuestionId &&
                                  this.props.checkQuestionId === it.questionId
                                    ? styles.testCheckNumber
                                    : styles.testNumber,
                                  styles.notWork,
                                ].join(" ")}
                              >
                                【{this.renderIndex(it.questionId, index, ind)}
                                】
                              </span>
                            ) : (
                              <span
                                className={[
                                  this.props.checkQuestionId &&
                                  this.props.checkQuestionId === it.questionId
                                    ? styles.testCheckNumber
                                    : styles.testNumber,
                                ].join(" ")}
                              >
                                {this.renderIndex(it.questionId, index, ind)}.
                              </span>
                            )}
                          </span>

                          <div className={styles.newContentBox}>
                            <div
                              className={[
                                styles.modulecontent1,
                                this.state.dropVisible && dropIndex === index
                                  ? styles.inlineContent
                                  : "",
                              ].join(" ")}
                              style={{ display: "inline-block" }}
                            >
                              {it.type !== 7 &&
                                it.type !== 8 &&
                                (() => {
                                  const showScore =
                                    (!this.props.ifStu &&
                                      this.props.ifTeacherView) ||
                                    (this.props.ifStu &&
                                      (!isScore || openScore));

                                  return showScore ? (
                                    <span
                                      style={{
                                        float: "left",
                                        whiteSpace: "nowrap",
                                      }}
                                    >
                                      （{it.questionScore}{" "}
                                      {trans("global.point", "分")}）
                                    </span>
                                  ) : null;
                                })()}

                              {this.renderAssociationParentContent(it)}
                              <div
                                dangerouslySetInnerHTML={{ __html: it.content }}
                              ></div>

                              {it.sonQuestionList &&
                              it.sonQuestionList.length > 0
                                ? it.sonQuestionList.map((index_, inde) => (
                                    <div className={styles.childContentBox}>
                                      <div className={styles.childContent}>
                                        <div style={{ display: "flex" }}>
                                          <div className={styles.childTitle}>
                                            {index_.questionSerialNumber}
                                          </div>
                                        </div>
                                        <div
                                          className={styles.childBox}
                                          dangerouslySetInnerHTML={{
                                            __html: index_.content,
                                          }}
                                        ></div>
                                      </div>
                                      {this.props.ifStu ? (
                                        // ：ifTest 是否被作答 @true：已作答
                                        this.props
                                          .ifTest ? null : index_.type === 1 ||
                                          index_.type === 2 ||
                                          index_.type === 3 ||
                                          index_.type === 4 ? (
                                          <div
                                            style={{
                                              width: "100%",
                                              display: "flex",
                                              flexWrap: "wrap",
                                              marginTop: "16px",
                                            }}
                                          >
                                            {this.getChildOptionsContent(
                                              index_,
                                            )}
                                          </div>
                                        ) : index_.type === 5 ? (
                                          <div
                                            className={styles.textQuestionBox}
                                          >
                                            <BraftEditor
                                              onRef={this.onRefPropositional}
                                              questionId={index_.questionId}
                                              braftType={`text${inde}`}
                                              blurEdit={this.blurEditAnalysis}
                                              initContent={index_.studentAnswer}
                                              changeFill={this.changeChildText}
                                              questionType={1}
                                            />
                                          </div>
                                        ) : null
                                      ) : (
                                        <div
                                          className={styles.optionBox}
                                          style={{
                                            marginBottom: "6px",
                                            alignItems: "center",
                                          }}
                                        >
                                          {index_.optionList &&
                                          index_.optionList.length > 0 ? (
                                            index_.optionList.map(
                                              (optionItem, op) => (
                                                <div
                                                  className={
                                                    styles.optionContent
                                                  }
                                                  style={{ margin: "5px 0" }}
                                                >
                                                  <div
                                                    onClick={this.RadioChange.bind(
                                                      this,
                                                      index_.questionId,
                                                      optionItem.key,
                                                    )}
                                                    className={`${styles.optionHandle} ${this.props.isChecked && index_.answer.includes(optionItem.key) ? styles.checkedOption : ""}`}
                                                  >
                                                    {optionItem.key}
                                                  </div>
                                                  <div
                                                    style={{
                                                      display: "flex",
                                                      whiteSpace: "nowrap",
                                                    }}
                                                    dangerouslySetInnerHTML={{
                                                      __html: isAlphaStart(
                                                        optionItem.answers,
                                                      )
                                                        ? optionItem.answers?.slice(
                                                            2,
                                                          )
                                                        : optionItem.answers,
                                                    }}
                                                  ></div>
                                                </div>
                                              ),
                                            )
                                          ) : index_?.gapFillingAnswer?.answers
                                              ?.length &&
                                            this.props.isChecked ? (
                                            index_.gapFillingAnswer.answers.map(
                                              (inner, op) => (
                                                <div
                                                  dangerouslySetInnerHTML={{
                                                    __html: inner,
                                                  }}
                                                  className={
                                                    styles.completionList
                                                  }
                                                ></div>
                                              ),
                                            )
                                          ) : index_.type === 4 ? (
                                            <div className={styles.judgeBox}>
                                              <div
                                                className={[
                                                  styles.judgeSelect,
                                                  this.props.isChecked
                                                    ? index_.answer == "true"
                                                      ? styles.trueJudge
                                                      : ""
                                                    : styles.noJudge,
                                                ].join(" ")}
                                              >
                                                <i
                                                  className={[
                                                    styles.iconfont,
                                                    styles.judgeIcon,
                                                  ].join(" ")}
                                                >
                                                  &#xe804;
                                                </i>
                                                {trans("global.right", "正确")}
                                              </div>
                                              <div
                                                className={[
                                                  styles.judgeSelect,
                                                  this.props.isChecked
                                                    ? index_.answer == "false"
                                                      ? styles.falseJudge
                                                      : ""
                                                    : styles.noJudge,
                                                ].join(" ")}
                                              >
                                                <i
                                                  className={[
                                                    styles.iconfont,
                                                    styles.judgeIcon,
                                                  ].join(" ")}
                                                >
                                                  &#xe803;
                                                </i>
                                                {trans("global.wrong", "错误")}
                                              </div>
                                            </div>
                                          ) : null}
                                        </div>
                                      )}
                                    </div>
                                  ))
                                : null}

                              <div className={styles.optionBox}>
                                {/* 测验详情预览展示 */}
                                {this.props.ifStu ? null : it.optionList &&
                                  it.optionList.length > 0 ? (
                                  it.optionList.map((index_, op) => (
                                    <div
                                      className={styles.optionContent}
                                      style={{ margin: "5px 0" }}
                                    >
                                      <div
                                        onClick={this.RadioChange.bind(
                                          this,
                                          it.questionId,
                                          index_.key,
                                        )}
                                        className={`${styles.optionHandle} ${this.props.isChecked && it.answer.includes(index_.key) ? styles.checkedOption : ""}`}
                                      >
                                        {index_.key}
                                      </div>
                                      <div
                                        style={{
                                          display: "flex",
                                          whiteSpace: "nowrap",
                                        }}
                                        dangerouslySetInnerHTML={{
                                          __html: isAlphaStart(index_.answers)
                                            ? index_.answers?.slice(2)
                                            : index_.answers,
                                        }}
                                      ></div>
                                    </div>
                                  ))
                                ) : it?.gapFillingAnswer?.answers?.length &&
                                  this.props.isChecked ? (
                                  it.gapFillingAnswer.answers.map(
                                    (index_, op) => (
                                      <div
                                        dangerouslySetInnerHTML={{
                                          __html: index_,
                                        }}
                                        className={styles.completionList}
                                      ></div>
                                    ),
                                  )
                                ) : it.type === 4 ? (
                                  <div className={styles.judgeBox}>
                                    <div
                                      className={[
                                        styles.judgeSelect,
                                        this.props.isChecked
                                          ? it.answer == "true"
                                            ? styles.trueJudge
                                            : ""
                                          : styles.noJudge,
                                      ].join(" ")}
                                    >
                                      <i
                                        className={[
                                          styles.iconfont,
                                          styles.judgeIcon,
                                        ].join(" ")}
                                      >
                                        &#xe804;
                                      </i>
                                      {trans("global.right", "正确")}
                                    </div>
                                    <div
                                      className={[
                                        styles.judgeSelect,
                                        this.props.isChecked
                                          ? it.answer == "false"
                                            ? styles.falseJudge
                                            : ""
                                          : styles.noJudge,
                                      ].join(" ")}
                                    >
                                      <i
                                        className={[
                                          styles.iconfont,
                                          styles.judgeIcon,
                                        ].join(" ")}
                                      >
                                        &#xe803;
                                      </i>
                                      {trans("global.wrong", "错误")}
                                    </div>
                                  </div>
                                ) : null}
                              </div>

                              <div className={styles.optionBox}>
                                {/* 学生与老师开始答题，学生个性化作业点击name */}
                                {this.props.ifStu ? (
                                  this.props.ifTest ? (
                                    // 完成作答 完成试作
                                    <>
                                      {it.type === 1 ||
                                      it.type === 2 ||
                                      it.type === 3 ||
                                      it.type === 4 ||
                                      it.type === 5 ? (
                                        <>
                                          <div
                                            style={{
                                              width: "100%",
                                              display: "flex",
                                              flexWrap: "wrap",
                                              marginTop: "16px",
                                            }}
                                          >
                                            {this.getOptionsContent(it)}
                                          </div>
                                          <div
                                            className={
                                              styles.analysisBottomContent
                                            }
                                          >
                                            {this.getAnswerResultContent(it)}
                                            {this.props?.openAnswer ? (
                                              <div
                                                id={`viewButton${it.questionId}`}
                                                className={
                                                  styles.analysisButton
                                                }
                                                onClick={this.viewAnalysis.bind(
                                                  this,
                                                  it.questionId,
                                                )}
                                              >
                                                <i className={styles.iconfont}>
                                                  &#xe631;
                                                </i>
                                                <span>
                                                  {" "}
                                                  {trans(
                                                    "detail.viewAnalysis",
                                                    "解析",
                                                  )}
                                                </span>
                                              </div>
                                            ) : null}
                                          </div>
                                        </>
                                      ) : it.type === 6 &&
                                        it.sonQuestionList?.length ? (
                                        it.sonQuestionList.map((itt, indd) => (
                                          <>
                                            <div
                                              style={{
                                                display: "flex",
                                                width: "100%",
                                                alignItems: "center",
                                                marginTop: "16px",
                                              }}
                                            >
                                              <span
                                                className={styles.answerNumber}
                                                style={{ float: "left" }}
                                              >
                                                （{itt.questionSerialNumber}）
                                              </span>
                                              <div
                                                style={{
                                                  width: "100%",
                                                  display: "flex",
                                                  flexWrap: "wrap",
                                                }}
                                              >
                                                {this.getOptionsContent(itt)}
                                              </div>
                                            </div>
                                            <div
                                              className={
                                                styles.analysisBottomContent
                                              }
                                            >
                                              {this.getAnswerResultContent(itt)}
                                              {indd ==
                                                it.sonQuestionList.length - 1 &&
                                              this.props?.openAnswer ? (
                                                <div
                                                  id={`viewButton${it.questionId}`}
                                                  onClick={this.viewAnalysis.bind(
                                                    this,
                                                    it.questionId,
                                                  )}
                                                  className={
                                                    styles.analysisButton
                                                  }
                                                >
                                                  <i
                                                    className={styles.iconfont}
                                                  >
                                                    &#xe631;
                                                  </i>
                                                  <span>
                                                    {" "}
                                                    {trans(
                                                      "detail.viewAnalysis",
                                                      "解析",
                                                    )}
                                                  </span>
                                                </div>
                                              ) : null}
                                            </div>
                                          </>
                                        ))
                                      ) : it.type === 7 || it.type === 8 ? (
                                        <div
                                          style={{
                                            width: "100%",
                                            display: "flex",
                                            flexWrap: "wrap",
                                            marginTop: "16px",
                                          }}
                                        >
                                          {this.getOptionsContent(it)}
                                        </div>
                                      ) : null}
                                    </>
                                  ) : // 作答模式  试作
                                  it.type === 1 ||
                                    it.type === 2 ||
                                    it.type === 3 ||
                                    it.type === 4 ||
                                    it.type === 7 ||
                                    it.type === 8 ? (
                                    <div
                                      style={{
                                        width: "100%",
                                        display: "flex",
                                        flexWrap: "wrap",
                                        marginTop: "16px",
                                      }}
                                    >
                                      {this.getOptionsContent(it, true)}
                                    </div>
                                  ) : it.type === 5 ? (
                                    <div className={styles.textQuestionBox}>
                                      <BraftEditor
                                        placeholder={
                                          locale() == "en"
                                            ? "Please fill in here"
                                            : "请输入"
                                        }
                                        onRef={this.onRefPropositional}
                                        questionId={it.questionId}
                                        braftType={`text${ind}`}
                                        blurEdit={this.blurEditAnalysis}
                                        initContent={it.studentAnswer}
                                        changeFill={this.changeText}
                                        questionType={1}
                                      />
                                    </div>
                                  ) : null
                                ) : null}

                                {!this.props.ifStu && this.props.ifEdit ? (
                                  // 题目的底部操作区域
                                  <div className={styles.selBottom}>
                                    <div
                                      style={{
                                        width: "calc(100% - 223px)",
                                        display: "flex",
                                        flexWrap: "nowrap",
                                      }}
                                    >
                                      {/* 单选投票与多选投票不展示难易程度 */}
                                      {it.type != 7 && it.type != 8 ? (
                                        <Select
                                          dropdownClassName="selectStyles"
                                          onChange={(value) =>
                                            this.changeDifficultyChoice(
                                              value,
                                              it.questionId,
                                              it.knowledgeValues,
                                            )
                                          }
                                          value={it.questionLevel}
                                          style={{
                                            width: 68,
                                            height: 30,
                                            lineHeight: "30px",
                                          }}
                                        >
                                          {difficulty.map((item) => (
                                            <Option
                                              value={item.key}
                                              key={item.key}
                                            >
                                              <span>{item.name}</span>
                                            </Option>
                                          ))}
                                        </Select>
                                      ) : null}
                                      <div
                                        style={{
                                          width: "calc(33% - 65px)",
                                          marginLeft: "5px",
                                        }}
                                      >
                                        <span
                                          style={{
                                            whiteSpace: "nowrap",
                                            textOverflow: "normal",
                                          }}
                                        >
                                          {trans(
                                            "singleInput.knowledgeTree",
                                            "知识点",
                                          )}
                                          ：
                                        </span>
                                        <span
                                          style={{
                                            display: "inline-block",
                                            width: "calc(100% - 56px)",
                                          }}
                                        >
                                          <TreeSelect
                                            {...lProperties}
                                            maxTagCount={2}
                                            style={{ width: "100%" }}
                                            treeDefaultExpandAll
                                            value={it.knowledgeValues || []}
                                            dropdownStyle={{
                                              maxHeight: "45vh",
                                            }}
                                            onChange={(value) => {
                                              this.labelChange(
                                                value,
                                                "knowledge",
                                                index,
                                                ind,
                                              );
                                            }}
                                          />
                                        </span>
                                      </div>
                                      <div
                                        style={{
                                          width: "calc(33% - 65px)",
                                          marginLeft: "5px",
                                        }}
                                      >
                                        <span
                                          style={{
                                            whiteSpace: "nowrap",
                                            textOverflow: "normal",
                                          }}
                                        >
                                          {trans(
                                            "detailView.indicatorLabel",
                                            "素养：",
                                          )}
                                        </span>
                                        <span
                                          style={{
                                            display: "inline-block",
                                            width: "calc(100% - 43px)",
                                          }}
                                        >
                                          <TreeSelect
                                            maxTagCount={2}
                                            treeData={newTree1}
                                            treeDefaultExpandAll
                                            value={it.indicatorValues || []}
                                            onChange={(value) => {
                                              this.labelChange(
                                                value,
                                                "indicator",
                                                index,
                                                ind,
                                              );
                                            }}
                                            treeCheckable={true}
                                            showCheckedStrategy={SHOW_PARENT}
                                            showSearch={true}
                                            placeholder={trans(
                                              "global.pleaseChoose",
                                              "请选择",
                                            )}
                                            getPopupContainer={() =>
                                              document.querySelector(
                                                "#knowledgePoints",
                                              )
                                            }
                                            style={{ width: "100%" }}
                                            dropdownStyle={{
                                              maxHeight: "150px",
                                            }}
                                          />
                                        </span>
                                      </div>
                                      <div
                                        style={{
                                          width: "calc(33% - 65px)",
                                          marginLeft: "5px",
                                        }}
                                      >
                                        <span
                                          style={{
                                            whiteSpace: "nowrap",
                                            textOverflow: "normal",
                                          }}
                                        >
                                          {trans("global.chapter", "章节")}：
                                        </span>
                                        <span
                                          className={styles.knowLedge}
                                          id="knowledgePoints"
                                          style={{
                                            display: "inline-block",
                                            width: "calc(100% - 43px)",
                                          }}
                                        >
                                          <TreeSelect
                                            maxTagCount={2}
                                            treeDefaultExpandAll
                                            treeData={this.props.chapterList}
                                            value={it.chapterValues || []}
                                            onChange={(value) => {
                                              this.labelChange(
                                                value,
                                                "chapter",
                                                index,
                                                ind,
                                              );
                                            }}
                                            treeCheckable={true}
                                            showCheckedStrategy={SHOW_PARENT}
                                            showSearch={true}
                                            placeholder={trans(
                                              "global.pleaseChoose",
                                              "请选择",
                                            )}
                                            getPopupContainer={() =>
                                              document.querySelector(
                                                "#knowledgePoints",
                                              )
                                            }
                                            style={{ width: "100%" }}
                                            dropdownStyle={{
                                              maxHeight: "45vh",
                                            }}
                                          />
                                        </span>
                                      </div>
                                      <div
                                        style={{
                                          width: "108px",
                                          marginLeft: "5px",
                                        }}
                                      >
                                        <span
                                          style={{
                                            whiteSpace: "nowrap",
                                            textOverflow: "normal",
                                          }}
                                        >
                                          {trans(
                                            "detailView.scoreLabel",
                                            "分值：",
                                          )}
                                        </span>
                                        <span
                                          className={styles.knowLedge}
                                          style={{ display: "inline-block" }}
                                        >
                                          {it.type == 7 ||
                                          it.type == 8 ? null : (
                                            <>
                                              {it.type === 6 ? (
                                                <Popover
                                                  placement="bottom"
                                                  className={styles.zuhePop}
                                                  overlayClassName="zuhePop"
                                                  trigger="click"
                                                  title={null}
                                                  content={
                                                    <div
                                                      className={
                                                        styles.zuheScoreBox
                                                      }
                                                    >
                                                      <div
                                                        className={
                                                          styles.zuheScoreList
                                                        }
                                                      >
                                                        {it.sonQuestionList &&
                                                        it.sonQuestionList
                                                          .length > 0
                                                          ? it.sonQuestionList.map(
                                                              (ii, indd) => (
                                                                <div
                                                                  className={
                                                                    styles.zuheScoreItem
                                                                  }
                                                                >
                                                                  <div
                                                                    className={
                                                                      styles.itemTitle
                                                                    }
                                                                  >
                                                                    {this.renderIndex(
                                                                      it.questionId,
                                                                      index,
                                                                      ind,
                                                                    )}
                                                                    .{indd + 1}
                                                                  </div>
                                                                  <Input
                                                                    value={
                                                                      ii.questionScore
                                                                    }
                                                                    onChange={(
                                                                      e,
                                                                    ) => {
                                                                      this.quetionChange(
                                                                        ii.questionId,
                                                                        e,
                                                                        "sonQuestion",
                                                                      );
                                                                    }}
                                                                    onBlur={(
                                                                      e,
                                                                    ) => {
                                                                      this.quetionChangeEnd(
                                                                        ii.questionId,
                                                                        e,
                                                                        "sonQuestion",
                                                                      );
                                                                    }}
                                                                    onFocus={(
                                                                      e,
                                                                    ) => {
                                                                      startValue =
                                                                        e.target
                                                                          .value;
                                                                    }}
                                                                    onPressEnter={(
                                                                      e,
                                                                    ) => {
                                                                      e.target.blur();
                                                                    }}
                                                                  />
                                                                  <div
                                                                    style={{
                                                                      marginLeft:
                                                                        "5px",
                                                                    }}
                                                                  >
                                                                    {trans(
                                                                      "global.point",
                                                                      "分",
                                                                    )}
                                                                  </div>
                                                                </div>
                                                              ),
                                                            )
                                                          : null}
                                                      </div>
                                                      <div
                                                        className={
                                                          styles.zuheScoreBotton
                                                        }
                                                      >
                                                        <div
                                                          className={
                                                            styles.itemTitle
                                                          }
                                                        >
                                                          {trans(
                                                            "global.zongfen",
                                                            "总分",
                                                          )}
                                                        </div>
                                                        <div
                                                          className={
                                                            styles.itemScore
                                                          }
                                                        >
                                                          {it.questionScore}
                                                        </div>
                                                        <div
                                                          style={{
                                                            marginLeft: "5px",
                                                          }}
                                                        >
                                                          {trans(
                                                            "global.point",
                                                            "分",
                                                          )}
                                                        </div>
                                                      </div>
                                                    </div>
                                                  }
                                                >
                                                  <div
                                                    className="ant-input-number"
                                                    style={{
                                                      width: "65px",
                                                      lineHeight: "32px",
                                                      padding: "0 11px",
                                                    }}
                                                  >
                                                    {it.questionScore}
                                                  </div>
                                                </Popover>
                                              ) : (
                                                <Input
                                                  style={{ width: "65px" }}
                                                  value={it.questionScore}
                                                  onChange={(e) => {
                                                    this.quetionChange(
                                                      it.questionId,
                                                      e,
                                                      "question",
                                                    );
                                                  }}
                                                  onBlur={(e) => {
                                                    this.quetionChangeEnd(
                                                      it.questionId,
                                                      e,
                                                      "question",
                                                    );
                                                  }}
                                                  onFocus={(e) => {
                                                    startValue = e.target.value;
                                                  }}
                                                  onPressEnter={(e) => {
                                                    e.target.blur();
                                                  }}
                                                />
                                              )}
                                            </>
                                          )}
                                        </span>
                                      </div>
                                    </div>

                                    <div className={styles.operateBtn}>
                                      <Button
                                        onClick={this.viewAnalysis.bind(
                                          this,
                                          it.questionId,
                                          it.analysis,
                                        )}
                                        className={`${buttonStyle.btn} ${buttonStyle.mediumBtn} ${buttonStyle.minor}`}
                                      >
                                        <i
                                          className={styles.iconfont}
                                          style={{ marginRight: "8px" }}
                                        >
                                          &#xe631;
                                        </i>
                                        <span>
                                          {trans("global.analysis", "解析")}
                                        </span>
                                      </Button>

                                      <div
                                        className={`${styles.inline} ${styles.rightButton2}`}
                                        onClick={this.deleteQuestion.bind(
                                          this,
                                          it.questionId,
                                        )}
                                        style={
                                          this.props.ifTeacherView
                                            ? { display: "none" }
                                            : this.state.dropVisible
                                              ? { display: "none" }
                                              : null
                                        }
                                      >
                                        <i
                                          className={styles.iconfont}
                                          style={{ fontSize: 16 }}
                                        >
                                          &#xe739;
                                        </i>
                                        {trans("global.delete", "删除")}
                                      </div>
                                      <div
                                        className={[
                                          styles.inline,
                                          styles.rightButton1,
                                        ].join(" ")}
                                        onClick={this.editQuestion.bind(
                                          this,
                                          it.questionId,
                                        )}
                                        style={
                                          this.props.ifTeacherView
                                            ? { display: "none" }
                                            : this.state.dropVisible
                                              ? { display: "none" }
                                              : null
                                        }
                                      >
                                        <i
                                          className={styles.iconfont}
                                          style={{ fontSize: 16 }}
                                        >
                                          &#xe6aa;
                                        </i>
                                        {trans("global.edit", "编辑")}
                                      </div>
                                    </div>
                                  </div>
                                ) : null}
                              </div>
                            </div>

                            {/* 解析内容 */}
                            <div
                              id={`analysis${it.questionId}`}
                              className={`${styles.analysisBox} ${this.props.isChecked ? styles.showAnalysis : ""}`}
                            >
                              {it.type == 6 ? (
                                <div className={styles.analysisItem}>
                                  <div className={styles.itemTitle}>
                                    {trans("global.childDifficult", "子题难度")}
                                  </div>
                                  <div className={styles.itemChildAnswer}>
                                    {it.sonQuestionList &&
                                    it.sonQuestionList.length > 0
                                      ? it.sonQuestionList.map((iit, ind) => (
                                          <span>
                                            <span
                                              className={styles.chapterSort}
                                            >
                                              ({ind + 1}).
                                            </span>
                                            <span>
                                              {questionLevel[iit.questionLevel]}
                                            </span>
                                          </span>
                                        ))
                                      : null}
                                  </div>
                                </div>
                              ) : null}
                              <div className={styles.analysisItem}>
                                <div className={styles.itemTitle}>
                                  {trans("global.rightAnswer", "正确答案")}
                                </div>
                                {it.type == 3 ? (
                                  <>
                                    {it.gapFillingAnswer?.answers.map((iit) => (
                                      <div
                                        className={styles.itemContent}
                                        key={iit}
                                        dangerouslySetInnerHTML={{
                                          __html: iit,
                                        }}
                                      ></div>
                                    ))}
                                  </>
                                ) : it.type == 4 ? (
                                  <div className={styles.itemContent}>
                                    {it.answer == "true"
                                      ? trans(
                                          "global.booleanCorrectShort",
                                          "对",
                                        )
                                      : trans("global.booleanWrongShort", "错")}
                                  </div>
                                ) : it.type == 6 ? (
                                  <div className={styles.itemChildAnswer}>
                                    {it.sonQuestionList &&
                                    it.sonQuestionList.length > 0
                                      ? it.sonQuestionList.map(
                                          (index_, inde) => (
                                            <div
                                              className={styles.childAnsContent}
                                            >
                                              <span
                                                className={styles.chapterSort}
                                              >
                                                ({inde + 1}).
                                              </span>
                                              {index_.type == 3 ? (
                                                <>
                                                  {index_.gapFillingAnswer?.answers.map(
                                                    (ii, ind) => (
                                                      <div
                                                        className={
                                                          styles.answerFLex
                                                        }
                                                      >
                                                        <div
                                                          className={
                                                            styles.itemContent
                                                          }
                                                          key={ii}
                                                          dangerouslySetInnerHTML={{
                                                            __html: ii,
                                                          }}
                                                        ></div>
                                                        {ind <
                                                        index_.gapFillingAnswer
                                                          .answers.length -
                                                          1 ? (
                                                          <div>、</div>
                                                        ) : null}
                                                      </div>
                                                    ),
                                                  )}
                                                </>
                                              ) : index_.type == 4 ? (
                                                <div
                                                  className={styles.itemContent}
                                                >
                                                  {index_.answer == "true"
                                                    ? trans(
                                                        "global.booleanCorrectShort",
                                                        "对",
                                                      )
                                                    : trans(
                                                        "global.booleanWrongShort",
                                                        "错",
                                                      )}
                                                </div>
                                              ) : (
                                                <div
                                                  className={styles.itemContent}
                                                  dangerouslySetInnerHTML={{
                                                    __html: index_.answer,
                                                  }}
                                                ></div>
                                              )}
                                            </div>
                                          ),
                                        )
                                      : null}
                                  </div>
                                ) : (
                                  <div
                                    className={styles.itemContent}
                                    dangerouslySetInnerHTML={{
                                      __html: it.answer,
                                    }}
                                  ></div>
                                )}
                              </div>
                              {it.type === 6 && !this.props.isHidenKnowLedge ? (
                                <div className={styles.analysisItem}>
                                  <div className={styles.itemTitle}>
                                    {trans("singleInput.knowledgeTree")}
                                  </div>

                                  <div className={styles.itemContent}>
                                    {it.knowledgeValues &&
                                    it.knowledgeValues.length > 0 ? (
                                      <span className={styles.chapterSort}>
                                        {trans("global.entireQuestion", "整题")}
                                      </span>
                                    ) : null}
                                    {it.knowledgeValues &&
                                    it.knowledgeValues.length > 0
                                      ? it.knowledgeValues.map(
                                          (index_, inde) => (
                                            <span>
                                              <span
                                                className={styles.chapterItem}
                                              >
                                                {index_.split("-")[0]}
                                              </span>
                                            </span>
                                          ),
                                        )
                                      : null}
                                    {it.sonQuestionList &&
                                    it.sonQuestionList.length > 0
                                      ? it.sonQuestionList.map(
                                          (index_, inde) => (
                                            <span>
                                              {index_.knowledgeValues &&
                                              index_.knowledgeValues ? (
                                                <span
                                                  className={styles.chapterSort}
                                                >
                                                  ({inde + 1}).
                                                </span>
                                              ) : null}
                                              {index_.knowledgeValues &&
                                              index_.knowledgeValues.length > 0
                                                ? index_.knowledgeValues.map(
                                                    (ii) => (
                                                      <span
                                                        className={
                                                          styles.chapterItem
                                                        }
                                                      >
                                                        {ii.split("-")[0]}
                                                      </span>
                                                    ),
                                                  )
                                                : null}
                                            </span>
                                          ),
                                        )
                                      : null}
                                  </div>
                                </div>
                              ) : null}
                              {this.props.isHidenKnowLedge ? null : (
                                <div className={styles.analysisItem}>
                                  <div className={styles.itemTitle}>
                                    {trans("global.chapter", "章节")}
                                  </div>
                                  <div className={styles.itemContent}>
                                    {it.type == 6 ? (
                                      <div className={styles.itemContent}>
                                        {it.chapterValues &&
                                        it.chapterValues.length > 0 ? (
                                          <span className={styles.chapterSort}>
                                            {trans(
                                              "global.entireQuestion",
                                              "整题",
                                            )}
                                          </span>
                                        ) : null}
                                        {it.chapterValues &&
                                        it.chapterValues.length > 0
                                          ? it.chapterValues.map(
                                              (index_, inde) => (
                                                <span>
                                                  <span
                                                    className={
                                                      styles.chapterItem
                                                    }
                                                  >
                                                    {removeSuffixId(
                                                      index_.split("-"),
                                                    )}
                                                  </span>
                                                </span>
                                              ),
                                            )
                                          : null}
                                        {it.sonQuestionList &&
                                        it.sonQuestionList.length > 0
                                          ? it.sonQuestionList.map(
                                              (index_, inde) => (
                                                <span>
                                                  {index_.chapterValues &&
                                                  index_.chapterValues ? (
                                                    <span
                                                      className={
                                                        styles.chapterSort
                                                      }
                                                    >
                                                      ({inde + 1}).
                                                    </span>
                                                  ) : null}
                                                  {index_.chapterValues &&
                                                  index_.chapterValues.length >
                                                    0
                                                    ? index_.chapterValues.map(
                                                        (ii) => (
                                                          <span
                                                            className={
                                                              styles.chapterItem
                                                            }
                                                          >
                                                            {removeSuffixId(
                                                              ii.split("-"),
                                                            )}
                                                          </span>
                                                        ),
                                                      )
                                                    : null}
                                                </span>
                                              ),
                                            )
                                          : null}
                                      </div>
                                    ) : (
                                      <div className={styles.itemContent}>
                                        {it.chapterValues &&
                                        it.chapterValues.length > 0
                                          ? it.chapterValues.map(
                                              (index_, inde) => (
                                                <span
                                                  className={styles.chapterItem}
                                                >
                                                  {removeSuffixId(
                                                    index_.split("-"),
                                                  )}
                                                </span>
                                              ),
                                            )
                                          : null}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                              {this.props.isHidenKnowLedge ? null : (
                                <div className={styles.analysisItem}>
                                  <div className={styles.itemTitle}>
                                    {trans("singleInput.label", "素养")}
                                  </div>
                                  <div className={styles.itemContent}>
                                    {it.type == 6 ? (
                                      <div className={styles.itemContent}>
                                        {it.indicatorValues &&
                                        it.indicatorValues.length > 0 ? (
                                          <span className={styles.chapterSort}>
                                            {trans(
                                              "global.entireQuestion",
                                              "整题",
                                            )}
                                          </span>
                                        ) : null}
                                        {it.indicatorValues &&
                                        it.indicatorValues.length > 0
                                          ? it.indicatorValues.map(
                                              (index_, inde) => (
                                                <span>
                                                  <span
                                                    className={
                                                      styles.chapterItem
                                                    }
                                                  >
                                                    {removeSuffixId(
                                                      index_.split("-"),
                                                    )}
                                                  </span>
                                                </span>
                                              ),
                                            )
                                          : null}
                                        {it.sonQuestionList &&
                                        it.sonQuestionList.length > 0
                                          ? it.sonQuestionList.map(
                                              (index_, inde) => (
                                                <span>
                                                  {index_.indicatorValues &&
                                                  index_.indicatorValues
                                                    .length > 0 ? (
                                                    <span
                                                      className={
                                                        styles.chapterSort
                                                      }
                                                    >
                                                      ({inde + 1}).
                                                    </span>
                                                  ) : null}
                                                  {index_.indicatorValues &&
                                                  index_.indicatorValues
                                                    .length > 0
                                                    ? index_.indicatorValues.map(
                                                        (ii) => (
                                                          <span
                                                            className={
                                                              styles.chapterItem
                                                            }
                                                          >
                                                            {removeSuffixId(
                                                              ii.split("-"),
                                                            )}
                                                          </span>
                                                        ),
                                                      )
                                                    : null}
                                                </span>
                                              ),
                                            )
                                          : null}
                                      </div>
                                    ) : (
                                      <div className={styles.itemContent}>
                                        {it.indicatorValues &&
                                        it.indicatorValues.length > 0
                                          ? it.indicatorValues.map(
                                              (index_, inde) => (
                                                <span
                                                  className={styles.chapterItem}
                                                >
                                                  {removeSuffixId(
                                                    index_.split("-"),
                                                  )}
                                                </span>
                                              ),
                                            )
                                          : null}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                              <div className={styles.analysisItem}>
                                <div className={styles.itemTitle}>
                                  {trans("global.analysis", "解析")}
                                </div>
                                <div
                                  className={[
                                    styles.itemContent,
                                    styles.itemAnalysisContent,
                                  ].join(" ")}
                                >
                                  <div
                                    dangerouslySetInnerHTML={{
                                      __html: it.analysis
                                        ? it.analysis
                                        : `<span>${trans(
                                            "global.noAnalysis",
                                            "暂无解析",
                                          )}</span>`,
                                    }}
                                  ></div>
                                  {it.type === 6
                                    ? it.sonQuestionList &&
                                      it.sonQuestionList.length > 0
                                      ? it.sonQuestionList.map(
                                          (index_, inde) => (
                                            <div
                                              className={styles.analysisChild}
                                            >
                                              <span
                                                className={
                                                  styles.analysisItemTitle
                                                }
                                              >
                                                ({inde + 1}).
                                              </span>
                                              <span
                                                dangerouslySetInnerHTML={{
                                                  __html: index_.analysis
                                                    ? index_.analysis
                                                    : `<span>${trans("global.noAnalysis", "暂无解析")}</span>`,
                                                }}
                                              ></span>
                                            </div>
                                          ),
                                        )
                                      : null
                                    : null}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  : null}
              </div>
            ))
          : null}
        <Modal
          title={""}
          footer={null}
          getContainer={false}
          centered={true}
          visible={this.state.modalStatus}
          closable={false}
          destroyOnClose={true}
          onCancel={this.modalCancel}
        >
          <div className={styles.questionListBox}>
            <div className={styles.titleheader}>
              <i className={styles.iconfont} onClick={this.modalCancel}>
                &#xe6a9;
              </i>
              <div className={styles.content}>
                {trans("global.addFromMyQuestion", "从我的题库添加…")}
              </div>
            </div>
            <div className={styles.searchBar}>
              <span className={styles.inline}>
                <span className={styles.searchTitle}>
                  {trans("global.stage", "学段")}
                </span>
                <Select
                  onChange={this.changeStage}
                  value={this.state.stageId}
                  placeholder={trans("global.pleaseChoose", "请选择")}
                >
                  <Option value={0} key={0}>
                    {trans("global.allStage", "全部学段")}
                  </Option>
                  {stageList && stageList.length > 0
                    ? stageList.map((item) => (
                        <Option value={item.id} key={item.id}>
                          {item.name}
                        </Option>
                      ))
                    : null}
                </Select>
              </span>
              <span className={styles.inline}>
                <span className={styles.searchTitle}>
                  {trans("global.grade", "年级")}
                </span>
                <Select
                  onChange={this.changeGrade}
                  value={this.state.gradeId}
                  placeholder={trans("global.pleaseChoose", "请选择")}
                >
                  <Option value={0} key={0}>
                    {trans("global.allGrade", "全部年级")}
                  </Option>
                  {gradeList && gradeList.length > 0
                    ? gradeList.map((item) => (
                        <Option value={item.gradeId} key={item.gradeId}>
                          {item.name}
                        </Option>
                      ))
                    : null}
                </Select>
              </span>
              <span className={styles.inline}>
                <span className={styles.searchTitle}>
                  {trans("global.subject", "学科")}
                </span>
                <Select
                  value={this.props.subjectId}
                  disabled={true}
                  style={{ width: 120 }}
                  onChange={this.changeCourse}
                  placeholder={trans("global.pleaseChoose", "请选择")}
                >
                  <Option value={0} key={0}>
                    {trans("global.allSubject", "全部学科")}
                  </Option>
                  <Option
                    value={this.props.subjectId}
                    key={this.props.subjectId}
                  >
                    {this.props.subjectName}
                  </Option>
                </Select>
              </span>
              <span className={styles.inline}>
                <span className={styles.searchTitle}>
                  {trans("global.questionType", "题型")}
                </span>
                <Select
                  onChange={this.changeType}
                  value={this.state.questionType}
                  placeholder={trans("global.pleaseChoose", "请选择")}
                >
                  <Option value={0} key={0}>
                    {trans("global.allType", "全部类型")}
                  </Option>
                  {typeList && typeList.length > 0
                    ? typeList.map((item) => (
                        <Option value={item.code} key={item.code}>
                          {item.typeName}
                        </Option>
                      ))
                    : null}
                </Select>
              </span>
              <span className={styles.inline}>
                <Search
                  placeholder={trans(
                    "global.inputKeyToSearch",
                    "输入关键词搜索题目",
                  )}
                  onChange={this.changeValue}
                  onSearch={this.searchValue}
                />
              </span>
            </div>
            <div
              className={styles.questionMapList}
              id="listBox"
              onScroll={this.scrollChange}
            >
              {questionList && questionList.length > 0 ? (
                questionList.map((item, index) => (
                  <div
                    className={[styles.questionList, "listItem"].join(" ")}
                    key={index}
                  >
                    <div className={styles.header}>
                      {item.type === 1 ? (
                        <span className={styles.questionType}>
                          <i className={styles.iconfont}>&#xe761;</i>
                          {trans("global.radio", "单选题")}
                        </span>
                      ) : item.type === 2 ? (
                        <span className={styles.questionType}>
                          <i className={styles.iconfont}>&#xe761;</i>
                          {trans("global.check", "多选题")}
                        </span>
                      ) : item.type === 3 ? (
                        <span className={styles.questionType}>
                          <i className={styles.iconfont}>&#xe761;</i>
                          {trans("global.pack", "填空题")}
                        </span>
                      ) : item.type === 4 ? (
                        <span className={styles.questionType}>
                          <i className={styles.iconfont}>&#xe761;</i>
                          {trans("global.judge", "判断题")}
                        </span>
                      ) : item.type === 5 ? (
                        <span className={styles.questionType}>
                          <i className={styles.iconfont}>&#xe761;</i>
                          {trans("global.ask", "问答题")}
                        </span>
                      ) : item.type === 6 ? (
                        <span className={styles.questionType}>
                          <i className={styles.iconfont}>&#xe7f6;</i>
                          {trans("global.combination", "组合题")}
                        </span>
                      ) : null}
                      <div
                        className={[styles.inline, styles.level].join(" ")}
                        style={
                          item.level === 1
                            ? {
                                backgroundColor: "rgba(103,178,81,0.04)",
                                color: "#67b251",
                              }
                            : item.level === 2
                              ? {
                                  backgroundColor: "rgba(233,182,53,0.04)",
                                  color: "#E9B635",
                                }
                              : {
                                  backgroundColor: "rgba(221,107,71,0.04)",
                                  color: "#DD6B47",
                                }
                        }
                      >
                        <i className={styles.iconfont}>&#xe764;</i>
                        {questionLevel[item.level]}
                      </div>
                    </div>
                    <div className={styles.modulecontent}>
                      {this.renderAssociationParentContent(item)}
                      <div
                        dangerouslySetInnerHTML={{ __html: item.content }}
                      ></div>
                      {item.sonQuestionList && item.sonQuestionList.length > 0
                        ? item.sonQuestionList.map((index_, inde) => (
                            <div className={styles.childContent}>
                              <div className={styles.childTitle}>
                                ({inde + 1}).
                              </div>
                              <div
                                className={styles.childBox}
                                dangerouslySetInnerHTML={{
                                  __html: index_.content,
                                }}
                              ></div>
                            </div>
                          ))
                        : null}
                    </div>
                    <div className={styles.optionBox}>
                      {item.answersModelList && item.answersModelList.length > 0
                        ? item.answersModelList.map((it, newIn) =>
                            item.type === 1 || item.type === 2 ? (
                              <div
                                className={[
                                  styles.optionList,
                                  item.answer && item.answer.includes(it.key)
                                    ? styles.trueValue
                                    : "",
                                ].join(" ")}
                                key={newIn}
                              >
                                <div className={styles.opListLeft}>
                                  <i
                                    className={[
                                      styles.iconfont,
                                      styles.optionIcon,
                                    ].join(" ")}
                                  >
                                    &#xe6a8;
                                  </i>
                                </div>
                                <div
                                  className={styles.opListRight}
                                  dangerouslySetInnerHTML={{
                                    __html: it.answers,
                                  }}
                                ></div>
                              </div>
                            ) : item.type === 3 ? (
                              <div
                                className={styles.opListRight}
                                dangerouslySetInnerHTML={{ __html: it }}
                              ></div>
                            ) : null,
                          )
                        : null}
                    </div>

                    <div className={styles.questionTitle}>
                      <i className={styles.iconfont}>&#xe798;</i>
                      {item.gradeName}-{item.subjectName}
                    </div>
                    <div className={styles.moduleBottom}>
                      <div
                        className={[styles.inline, styles.cursor].join(" ")}
                        id={`viewButton${item.id}`}
                        onClick={this.viewModalAnalysis.bind(this, item.id)}
                      >
                        <i className={styles.iconfont}>&#xe631;</i>
                        {trans("detail.analysis", "解析")}
                      </div>
                      {item.inPaper ? (
                        <>
                          <div className={styles.isAdded}>
                            <i className={styles.iconfont}>&#xe6a8;</i>
                            {trans("global.isAdded", "已加入测验")}
                          </div>
                          <div
                            className={[styles.rightButton]}
                            onClick={this.cancelAdd.bind(this, item.id)}
                          >
                            {trans("global.cancelAddBasket", "取消加入")}
                          </div>
                        </>
                      ) : (
                        <div
                          className={styles.rightButton}
                          onClick={this.addTest.bind(this, item)}
                        >
                          {trans("global.addTest", "加入测验")}
                          <div
                            className={[styles.iconfont, "transLateIcon"].join(
                              " ",
                            )}
                            style={{ display: "none", zIndex: "999" }}
                          >
                            &#xe73c;
                          </div>
                        </div>
                      )}
                    </div>
                    <div
                      id={`modalanalysis${item.id}`}
                      className={styles.analysisBox}
                    >
                      {item.type == 6 ? (
                        <div className={styles.analysisItem}>
                          <div className={styles.itemTitle}>
                            {trans("global.childDifficult", "子题难度")}
                          </div>

                          <div className={styles.itemChildAnswer}>
                            {item.sonQuestionList &&
                            item.sonQuestionList.length > 0
                              ? item.sonQuestionList.map((it, ind) => (
                                  <span>
                                    <span className={styles.chapterSort}>
                                      ({ind + 1}).
                                    </span>
                                    <span>{questionLevel[it.level]}</span>
                                  </span>
                                ))
                              : null}
                          </div>
                        </div>
                      ) : null}
                      <div className={styles.analysisItem}>
                        <div className={styles.itemTitle}>
                          {trans("global.rightAnswer", "正确答案")}
                        </div>
                        {item.type == 3 ? (
                          <>
                            {item.gapFillingAnswer?.answers.map((item) => (
                              <div
                                className={styles.itemContent}
                                key={item}
                                dangerouslySetInnerHTML={{
                                  __html: item,
                                }}
                              ></div>
                            ))}
                          </>
                        ) : item.type == 4 ? (
                          <div className={styles.itemContent}>
                            {item.answer == "true"
                              ? trans("global.booleanCorrectShort", "对")
                              : trans("global.booleanWrongShort", "错")}
                          </div>
                        ) : item.type == 6 ? (
                          <div className={styles.itemChildAnswer}>
                            {item.sonQuestionList &&
                            item.sonQuestionList.length > 0
                              ? item.sonQuestionList.map((index_, inde) => (
                                  <div className={styles.childAnsContent}>
                                    <span className={styles.chapterSort}>
                                      ({inde + 1}).
                                    </span>
                                    {index_.type == 3 ? (
                                      <>
                                        {index_.gapFillingAnswer?.answers.map(
                                          (ii, ind) => (
                                            <div className={styles.answerFLex}>
                                              <div
                                                key={ii}
                                                dangerouslySetInnerHTML={{
                                                  __html: ii,
                                                }}
                                                // style={{ display: "inline-block" }}
                                              ></div>
                                              {ind <
                                              index_.gapFillingAnswer.answers
                                                .length -
                                                1 ? (
                                                <div>、</div>
                                              ) : null}
                                            </div>
                                          ),
                                        )}
                                      </>
                                    ) : index_.type == 4 ? (
                                      <div className={styles.itemContent}>
                                        {index_.answer == "true"
                                          ? trans(
                                              "global.booleanCorrectShort",
                                              "对",
                                            )
                                          : trans(
                                              "global.booleanWrongShort",
                                              "错",
                                            )}
                                      </div>
                                    ) : (
                                      <div
                                        className={styles.itemContent}
                                        dangerouslySetInnerHTML={{
                                          __html: index_.answer,
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
                            dangerouslySetInnerHTML={{
                              __html: item.answer,
                            }}
                          ></div>
                        )}
                      </div>
                      {item.type === 6 ? (
                        <div className={styles.analysisItem}>
                          <div className={styles.itemTitle}>
                            {trans("singleInput.knowledgeTree")}
                          </div>

                          <div className={styles.itemContent}>
                            {item.knowledgeValues &&
                            item.knowledgeValues.length > 0 ? (
                              <span className={styles.chapterSort}>
                                {trans("global.entireQuestion", "整题")}
                              </span>
                            ) : null}
                            {item.knowledgeValues &&
                            item.knowledgeValues.length > 0
                              ? item.knowledgeValues.map((index_, inde) => (
                                  <span>
                                    <span className={styles.chapterItem}>
                                      {index_.split("-")[0]}
                                    </span>
                                  </span>
                                ))
                              : null}
                            {item.sonQuestionList &&
                            item.sonQuestionList.length > 0
                              ? item.sonQuestionList.map((index_, inde) => (
                                  <span>
                                    {index_.knowledgeValues &&
                                    index_.knowledgeValues ? (
                                      <span className={styles.chapterSort}>
                                        ({inde + 1}).
                                      </span>
                                    ) : null}
                                    {index_.knowledgeValues &&
                                    index_.knowledgeValues.length > 0
                                      ? index_.knowledgeValues.map((ii) => (
                                          <span className={styles.chapterItem}>
                                            {ii.split("-")[0]}
                                          </span>
                                        ))
                                      : null}
                                  </span>
                                ))
                              : null}
                          </div>
                        </div>
                      ) : null}
                      <div className={styles.analysisItem}>
                        <div className={styles.itemTitle}>
                          {trans("global.chapter", "章节")}
                        </div>
                        <div className={styles.itemContent}>
                          {item.type == 6 ? (
                            <div className={styles.itemContent}>
                              {item.chapterValues &&
                              item.chapterValues.length > 0 ? (
                                <span className={styles.chapterSort}>
                                  {trans("global.entireQuestion", "整题")}
                                </span>
                              ) : null}
                              {item.chapterValues &&
                              item.chapterValues.length > 0
                                ? item.chapterValues.map((index_, inde) => (
                                    <span>
                                      <span className={styles.chapterItem}>
                                        {index_.split("-")[0]}
                                      </span>
                                    </span>
                                  ))
                                : null}
                              {item.sonQuestionList &&
                              item.sonQuestionList.length > 0
                                ? item.sonQuestionList.map((index_, inde) => (
                                    <span>
                                      {index_.chapterValues &&
                                      index_.chapterValues.length > 0 ? (
                                        <span className={styles.chapterSort}>
                                          ({inde + 1}).
                                        </span>
                                      ) : null}
                                      {index_.chapterValues &&
                                      index_.chapterValues.length > 0
                                        ? index_.chapterValues.map((ii) => (
                                            <span
                                              className={styles.chapterItem}
                                            >
                                              {ii.split("-")[0]}
                                            </span>
                                          ))
                                        : null}
                                    </span>
                                  ))
                                : null}
                            </div>
                          ) : (
                            <div className={styles.itemContent}>
                              {item.chapterValues &&
                              item.chapterValues.length > 0
                                ? item.chapterValues.map((index_, inde) => (
                                    <span className={styles.chapterItem}>
                                      {index_.split("-")[0]}
                                    </span>
                                  ))
                                : null}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className={styles.analysisItem}>
                        <div className={styles.itemTitle}>
                          {trans("singleInput.label", "素养")}
                        </div>
                        <div className={styles.itemContent}>
                          {item.type == 6 ? (
                            <div className={styles.itemContent}>
                              {item.indicatorValues &&
                              item.indicatorValues.length > 0 ? (
                                <span className={styles.chapterSort}>
                                  {trans("global.entireQuestion", "整题")}
                                </span>
                              ) : null}
                              {item.indicatorValues &&
                              item.indicatorValues.length > 0
                                ? item.indicatorValues.map((index_, inde) => (
                                    <span>
                                      <span className={styles.chapterItem}>
                                        {index_.split("-")[0]}
                                      </span>
                                    </span>
                                  ))
                                : null}
                              {item.sonQuestionList &&
                              item.sonQuestionList.length > 0
                                ? item.sonQuestionList.map((index_, inde) => (
                                    <span>
                                      {index_.indicatorValues &&
                                      index_.indicatorValues.length > 0 ? (
                                        <span className={styles.chapterSort}>
                                          ({inde + 1}).
                                        </span>
                                      ) : null}
                                      {index_.indicatorValues &&
                                      index_.indicatorValues.length > 0
                                        ? index_.indicatorValues.map((ii) => (
                                            <span
                                              className={styles.chapterItem}
                                            >
                                              {ii.split("-")[0]}
                                            </span>
                                          ))
                                        : null}
                                    </span>
                                  ))
                                : null}
                            </div>
                          ) : (
                            <div className={styles.itemContent}>
                              {item.indicatorValues &&
                              item.indicatorValues.length > 0
                                ? item.indicatorValues.map((index_, inde) => (
                                    <span className={styles.chapterItem}>
                                      {index_.split("-")[0]}
                                    </span>
                                  ))
                                : null}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className={styles.analysisItem}>
                        <div className={styles.itemTitle}>
                          {trans("global.analysis", "解析")}
                        </div>
                        <div
                          className={[
                            styles.itemContent,
                            styles.itemAnalysisContent,
                          ].join(" ")}
                        >
                          <div
                            dangerouslySetInnerHTML={{
                              __html: item.analysis
                                ? item.analysis
                                : `<span>${trans(
                                    "global.noAnalysis",
                                    "暂无解析",
                                  )}</span>`,
                            }}
                          ></div>
                          {item.type === 6
                            ? item.sonQuestionList &&
                              item.sonQuestionList.length > 0
                              ? item.sonQuestionList.map((index_, inde) => (
                                  <div className={styles.analysisChild}>
                                    <span className={styles.analysisItemTitle}>
                                      ({inde + 1}).
                                    </span>
                                    <span
                                      dangerouslySetInnerHTML={{
                                        __html: index_.analysis
                                          ? index_.analysis
                                          : `<span>${trans(
                                              "global.noAnalysis",
                                              "暂无解析",
                                            )}</span>`,
                                      }}
                                    ></span>
                                  </div>
                                ))
                              : null
                            : null}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : IconFont ? (
                <div className={styles.noQuestion}>
                  <div className={styles.iconBox}>
                    <IconFont
                      type="icon-chengguoweikong"
                      className={styles.noSourceIcon}
                    />{" "}
                  </div>
                  {trans("global.noQuestion", "暂时没有题目哦")}
                </div>
              ) : null}
            </div>
          </div>
        </Modal>
        <Modal
          title={""}
          footer={null}
          width={1240}
          getContainer={false}
          centered={true}
          wrapClassName={"questionEditorModalWrap"}
          className={styles.questionEditorModal}
          style={{ top: 24 }}
          destroyOnClose={true}
          visible={editModalVisible}
          closable={false}
          maskClosable={!questionEditorSaving}
          onCancel={this.editModalCancel}
        >
          {questionItem && questionItem.questionId ? (
            <div className={styles["question-editor-modal-shell"]}>
              <div className={styles["question-editor-modal-header"]}>
                <button
                  aria-label={trans("global.back", "返回")}
                  className={styles["question-editor-close"]}
                  onClick={this.editModalCancel}
                  title={trans("global.back", "返回")}
                  type="button"
                >
                  <Icon type="arrow-left" />
                </button>
                <div className={styles["question-editor-title"]}>
                  <span>{trans("global.editQuestion", "编辑题目")}</span>
                </div>
                <Button
                  disabled={questionEditorSaving}
                  loading={questionEditorSaving}
                  type="primary"
                  onClick={this.submitQuestionEditor}
                >
                  {trans("global.save", "保存")}
                </Button>
              </div>
              <div className={styles["question-editor-modal-body"]}>
                <QuestionEntryEditor
                  initialQuestion={questionItem}
                  onControllerReady={this.handleQuestionEditorControllerReady}
                  onSubmit={this.handleQuestionEditorSave}
                  saving={questionEditorSaving}
                />
              </div>
            </div>
          ) : undefined}
        </Modal>
        {this.state.imgVisible ? (
          <PreviewImg
            imgUrl={this.state.url}
            modalVisible={this.state.imgVisible}
            changeModalVisible={this.cancelImg}
          />
        ) : null}
        <Modal
          visible={visResolving}
          // onOk={this.handleOkResolving}
          onCancel={this.handleCancelResolving}
          footer={null}
        >
          <div dangerouslySetInnerHTML={{ __html: analysisText }}></div>
        </Modal>
      </div>
    );
  }
}

export default connect(({ home, global, inputQuestion }) => ({
  viewData: home.viewData,
  stageList: global.stageList,
  gradeList: global.gradeList,
  subjectList: global.subjectList,
  questionList: home.questionList,
  typeList: global.typeList,
  editQuestion: inputQuestion.editQuestion,
  questionItem: home.questionItem,
}))(DetailView);

export { getAssociationParentContent } from "./associationContext";
