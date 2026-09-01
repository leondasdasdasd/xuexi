//新闻
import React, { Fragment, PureComponent } from "react";
import {
  Button,
  Dropdown,
  Empty,
  Icon,
  Input,
  Menu,
  message,
  Modal,
  Pagination,
  Popover,
  Select,
  Table,
  Tooltip,
  TreeSelect,
} from "antd";
import { connect } from "dva";
import { Link } from "dva/router";

import Basket from "components/Basket/index";
import QuestionEntryEditor from "components/QuestionEntryEditor";

import { V2_QUESTION_LIST_ROUTE } from "../../common/v2QuestionListRoute";
import PreviewImg from "../../components/PreviewImg/index";
import { getExamModule } from "../../services/exam";
import {
  updateQuestionChapter,
  updateQuestionIndicator,
} from "../../services/global";
import { locale, trans } from "../../utils/i18n";
import { getQuestionOptionDisplayKey } from "../../utils/questionOptionDisplay";
import { getPageQuery, setCookie } from "../../utils/utils";
import QuestionMetaBindPanel from "./components/QuestionMetaBindPanel";

import icon from "../../icon.module.less";
import styles from "./index.module.less";

const { Option } = Select;
const { Search } = Input;
const { SHOW_PARENT } = TreeSelect;
let sortList = {
  1: "STUDENT_NO",
  2: "STUDENT_NAME",
  3: "STUDENT_E_NAME",
  4: "SCORE",
  5: "SCORE",
};
const questionLevel = {
  1: trans("global.easy", "简单"),
  2: trans("global.general", "普通"),
  3: trans("global.difficult", "困难"),
};

const getInnerContent = (tableData) => {
  const columns = [
    {
      title: trans("global.QuizList", "测验列表"),
      dataIndex: "examName",
      key: "examName",
      render: (text, record) => <span>{text}</span>,
    },
    {
      title: trans("global.creationTime", "创建时间"),
      dataIndex: "examDate",
      key: "examDate",
    },
    {
      title: trans("global.testType", "测验类型"),
      dataIndex: "examTypeName",
      key: "examTypeName",
    },
    {
      title: trans("global.numberOfRespondents", "作答人数"),
      dataIndex: "studentNum",
      key: "studentNum",
    },
    {
      title: trans("global.scoringRate", "得分率"),
      dataIndex: "questionExamScoreAverage",
      key: "questionExamScoreAverage",
    },
  ];
  const options = {
    pagination: false,
  };
  return <Table columns={columns} {...options} dataSource={tableData} />;
};

@connect((state) => ({
  testSubject: state.home.testSubject,
}))
class MyQuestion extends PureComponent {
  constructor(properties) {
    super(properties);
    this.state = {
      scrollTop: 0,
      examType: 0,
      stageId: 0,
      subjectId: 0,
      gradeId: 0,
      questionType: 0,
      searchValue: "",
      IconFont: null,
      questionList: [],
      editModalVisible: false,
      url: null,
      imgVisible: false,
      visible: false,
      expandedAnalysis: {},
      cur: 2,
      selectTree: [],
      selectTreeValue: [],
      // gradeValue: undefined,
      // subjectValue: undefined,
      difficultyValue: [],
      difficultyVisible: {},
      difficultyDataVisible: {},
      selectValue: [],
      choiceDifficultyValue: "",
    };
    this.child = null;
    // 编辑弹窗内 QuestionEntryEditor 的命令式控制器，用于在弹窗底部按钮触发提交。
    this.editEditorController = null;
    this.page = 1;
    this.pageSize = 50;
    this.getCardStatus = true;
    this.id = properties.match.params.id
      ? JSON.parse(properties.match.params.id)
      : null;
  }

  /**
   * 判断当前页面是否处于招生题库模式。
   * @returns {boolean} true 表示当前入口需要查询招生题库/试题篮数据
   */
  isRecruitQuestionMode = () => {
    const query = getPageQuery();
    return String(query.queryZhaoShengQuestion) === "true";
  };

  /**
   * 按当前入口上下文补充招生题库查询参数。
   * @param {object} payload 原始请求参数
   * @returns {object} 合并招生上下文后的请求参数
   */
  getRecruitQuestionPayload = (payload = {}) => {
    if (!this.isRecruitQuestionMode()) {
      return payload;
    }
    return {
      ...payload,
      queryZhaoShengQuestion: true,
    };
  };

  /**
   * 生成录题页跳转地址，并按需保留招生上下文。
   * @param {string} path 录题页路径
   * @returns {string} 最终跳转地址
   */
  getInputQuestionPath = (path) => {
    if (!this.isRecruitQuestionMode()) {
      return path;
    }
    return `${path}?queryZhaoShengQuestion=true`;
  };

  //查询parents
  findParentEle(element) {
    if (element) {
      if (element.id == "knowledgePoints") {
        return true;
      } else if (element.tagName == "BODY") {
        return false;
      } else {
        let parentNode = element.parentNode;
        return this.findParentEle(parentNode);
      }
    }
  }

  componentDidMount() {
    this.props.dispatch({
      type: "inputQuestion/getAllGradeList",
    });
    this.props.dispatch({
      type: "inputQuestion/getSubjectList",
    });
    this.props.dispatch({
      type: "global/getStage",
    });
    this.props.dispatch({
      type: "global/getType",
    });
    this.props.dispatch({
      type: "home/getExamType",
      payload: {
        type: 0,
      },
    });
    this.getPage();
    const IconFonts = Icon.createFromIconfontCN({
      scriptUrl: "//at.alicdn.com/t/font_789461_ovr9ifg67hb.js",
    });
    this.setState({
      IconFont: IconFonts,
    });
    this.props.dispatch({
      type: "home/getBasketList",
      payload: this.getRecruitQuestionPayload(),
    });
    this.props.dispatch({
      type: "home/getCount",
      payload: this.getRecruitQuestionPayload(),
    });
    this.getPermission();
  }

  getPermission = () => {
    // 获取校级配置，决定列表是否拥有平行卷操作权限
    getExamModule().then((res) => {
      if (res.status) {
        if (res.content) {
          for (const item of res.content) {
            if (
              item.groupCode == "PRECISION_TEACHING" &&
              item.childModuleCodeList &&
              item.childModuleCodeList.includes("XueKeWang")
            ) {
              this.setState({
                XueKeWang: true,
              });
            }
          }
        }
      } else {
        message.error(res.message);
      }
    });
  };

  changeValue = (e) => {
    console.log(e.target.value);
  };
  componentDidUpdate() {
    // const imgList = document.querySelectorAll("img");
    // for (const element of imgList) {
    //   let source = element.src;
    //   if (source.includes("&style=")) {
    //     source = source.split("&style=")[0];
    //   }
    //   element.addEventListener("click", (event) => {
    //     if (event) {
    //       event.stopPropagation();
    //     }
    //     this.showImg(source);
    //   });
    // }
  }
  // showImg = (source) => {
  //   // console.log("1111");
  //   this.setState({
  //     imgVisible: true,
  //     url: source,
  //   });
  // };
  // cancelImg = () => {
  //   this.setState({
  //     url: null,
  //     imgVisible: false,
  //   });
  // };
  deleteQuestion = (id) => {
    this.changeScoreVisible(id);
    this.props
      .dispatch({
        type: "home/deleteItem",
        payload: {
          questionBankId: id,
        },
      })
      .then(() => {
        this.props.dispatch({
          type: "home/getCount",
          payload: this.getRecruitQuestionPayload(),
        });
        this.props.dispatch({
          type: "home/getBasketList",
          payload: this.getRecruitQuestionPayload(),
        });
      });
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

  changeDifficulty = (value) => {
    this.setState(
      {
        difficultyValue: value,
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
        subjectId: value,
        scrollTop: 0,
        selectTree: [],
        selectTreeValue: [],
        // gradeId: 0,
      },
      () => {
        this.props.dispatch({
          type: "inputQuestion/getTree",
          payload: {
            subjectId: this.state.subjectId,
            gradeId: this.state.gradeId,
          },
          onSuccess: (res) => {
            console.log("onsuccess", res);
            this.setState({
              selectValue: res,
            });
          },
        });
        this.page = 1;

        if (this.state.subjectId && this.state.gradeId) {
          this.getQualityTree();
        }

        this.getPage();
      },
    );
  };

  changeGrade = (value) => {
    this.setState(
      {
        gradeId: value,
        scrollTop: 0,
        selectTree: [],
        selectTreeValue: [],
      },
      () => {
        this.props.dispatch({
          type: "inputQuestion/getTree",
          payload: {
            subjectId: this.state.subjectId,
            gradeId: this.state.gradeId,
          },
          onSuccess: (res) => {
            console.log("onsuccess", res);
            this.setState({
              selectValue: res,
            });
          },
        });
        this.page = 1;

        if (this.state.subjectId && this.state.gradeId) {
          this.getQualityTree();
        }

        this.getPage();
      },
    );
  };
  getPage = () => {
    this.setState({
      loading: true,
    });
    // if (
    //   this.page !== 1 &&
    //   this.page > Math.ceil(this.props.questionTotal / 10)
    // ) {
    //   this.getCardStatus = true;
    //   return;
    // }
    // console.log("first", this.state.selectTree);
    let newTreeList = [];
    if (this.state.selectTree.length > 0) {
      this.state.selectTree.map((item) => {
        // newTreeList.push(parseInt(item, 10));
        let a = item.split("-");
        newTreeList.push(Number.parseInt(item.split("-")[a.length - 1], 10));
      });
    }
    // this.props
    //   .dispatch({
    //     type: "home/clearQuestionList",
    //   })
    //   .then(() => {
    this.props
      .dispatch({
        type: "home/getQuestion",
        payload: {
          isNoCancat: true,
          content: this.state.searchValue,
          pageNo: this.page,
          limit: this.pageSize,
          type: this.state.cur,
          questionType:
            this.state.questionType === 0 ? "" : this.state.questionType,
          subjectId: this.state.subjectId === 0 ? "" : this.state.subjectId,
          yearPeriodId: this.state.stageId === 0 ? "" : this.state.stageId,
          gradeId: this.state.gradeId === 0 ? "" : this.state.gradeId,
          examType: this.state.examType === 0 ? "" : this.state.examType,
          questionLevelList:
            this.state.difficultyValue === 0 ? [] : this.state.difficultyValue,
          knowlegeIds: newTreeList,
          indicatorIds: this.state.qualityValue,
          ...this.getRecruitQuestionPayload(),
          // knowledgeValues: this.state.selectTree,
        },
      })
      .then(() => {
        this.getCardStatus = true;
        // if (
        //   this.page !== 1 &&
        //   this.page <= Math.ceil(this.props.questionTotal / 10)
        // ) {
        //   this.page += 1;
        //   this.setState({
        //     questionList: this.props.questionList,
        //   });
        // } else {
        //   if (this.page === 1) {
        //     this.page += 1;
        //   }
        // }
        this.setState({
          loading: false,
        });
        this.props.questionList.map((item) => {
          let state = Object.assign({}, this.state);
          state[`choiceDifficultyValue${item.id}`] = item.level;
          this.setState({
            ...state,
            questionList: this.props.questionList,
          });
        });
      });
    // });
  };
  cancelAdd = (id) => {
    if (!this.getCardStatus) {
      return;
    }
    this.getCardStatus = false;
    this.props
      .dispatch({
        type: "global/cancelBasket",
        payload: {
          questionId: id,
          ...this.getRecruitQuestionPayload(),
        },
      })
      .then(() => {
        this.getCardStatus = true;
        this.props.dispatch({
          type: "home/getCount",
          payload: this.getRecruitQuestionPayload(),
        });
        this.props.dispatch({
          type: "home/getBasketList",
          payload: this.getRecruitQuestionPayload(),
        });
      });
  };
  showTransLate = (item) => {
    // const transDom = document.getElementsByClassName('transLateIcon')[index]
    // transDom.style.color = '#4d7fff';
    // transDom.style.display = 'block';
    // console.log(transDom.offsetTop, 'll')
    // setTimeout(() => {
    //   transDom.style.position = 'absolute';
    //   transDom.style.transform = `translateY(-${transDom.offsetTop - 10}px)`;
    // }, 500)
    // console.log(transDom.style.transform)
    if (!this.getCardStatus) {
      return;
    }
    this.getCardStatus = false;
    this.props
      .dispatch({
        type: "global/addBasket",
        payload: {
          gradeId: item.gradeId,
          subjectId: item.subjectId,
          questionId: item.id,
          ...this.getRecruitQuestionPayload(),
        },
      })
      .then(() => {
        this.getCardStatus = true;
        this.props.dispatch({
          type: "home/getCount",
          payload: this.getRecruitQuestionPayload(),
        });
        this.props.dispatch({
          type: "home/getBasketList",
          payload: this.getRecruitQuestionPayload(),
        });
      });
  };
  scrollChange = () => {
    const overflowDom = document.querySelector("#listBox");
    const cardDomList = document.querySelectorAll(".listItem");
    const mastTop = cardDomList && cardDomList.at(-2).offsetTop;
    const scrollTop = overflowDom.scrollTop;
    const innerHeight = window.innerHeight;
    this.setState({
      scrollTop: scrollTop,
    });
    if (
      scrollTop + innerHeight > mastTop &&
      this.getCardStatus &&
      scrollTop > this.state.scrollTop
    ) {
      console.log(this.getCardStatus, "xixi");
      this.getCardStatus = false;
      // this.props.getExamineList();
      this.getPage();
    }
  };
  editQuestion = (id) => {
    console.log(id, "111");
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
  updateItem = (id) => {
    console.log(id, "aaa");
    this.props
      .dispatch({
        type: "home/getItem",
        payload: {
          questionId: id,
        },
      })
      .then(() => {
        // if(this.props.questionItem) {
        //   console.log(this.props.questionItem, 'qqqa');
        //   let newList = JSON.parse(JSON.stringify(this.props.questionList));
        //   newList.map((item,index) => {
        //     if(item.id === this.props.questionItem.questionId) {
        //       newList[index].id = this.props.questionItem.questionId;
        //       newList[index].answersModelList = this.props.questionItem.optionList;
        //       newList[index].level = this.props.questionItem.questionLevel;
        //       newList[index].analysis = this.props.questionItem.analysis;
        //       newList[index].answer = this.props.questionItem.answer;
        //       newList[index].content = this.props.questionItem.content;
        //       newList[index].type = this.props.questionItem.type;
        //     }
        //   })
        //   console.log(newList, '111')
        //   this.props.dispatch({
        //     type: 'home/upQuestionItem',
        //     payload: newList,
        //   })
        // }
        this.setState(
          {
            // scrollTop: 0,
            // questionList: [],
          },
          () => {
            this.props.dispatch({
              type: "home/getCount",
              payload: this.getRecruitQuestionPayload(),
            });
            this.props.dispatch({
              type: "home/getBasketList",
              payload: this.getRecruitQuestionPayload(),
            });
            // this.page = 1;
            this.getPage();
          },
        );
      });
  };
  viewAnalysis = (id) => {
    this.setState((previousState) => {
      const expanded = !previousState.expandedAnalysis[id];
      return {
        expandedAnalysis: {
          ...previousState.expandedAnalysis,
          [id]: expanded,
        },
      };
    });
  };
  isAnalysisVisible = (id) => {
    return !!this.state.expandedAnalysis[id];
  };
  componentWillUnmount() {
    this.props.dispatch({
      type: "global/clearSearch",
    });
  }
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
    console.log(value, "b");
  };
  editModalCancel = () => {
    this.editEditorController = null;
    this.props.dispatch({
      type: "home/clearQuestionItem",
    });
    this.setState({
      editModalVisible: false,
    });
  };

  /**
   * 接收 QuestionEntryEditor 暴露的命令式控制器，便于弹窗底部按钮触发保存。
   * @param {{submit: Function}} controller 编辑器控制器
   */
  handleEditEditorReady = (controller) => {
    this.editEditorController = controller;
  };

  /**
   * 处理编辑器保存提交：更新题库并刷新当前题目与试题篮数据。
   * @param {{payload: object}} submitResult 编辑器构建的保存数据
   */
  handleEditSubmit = ({ payload }) => {
    const questionId =
      this.props.questionItem && this.props.questionItem.questionId;
    this.props.dispatch({
      type: "inputQuestion/importQuestion",
      payload: this.getRecruitQuestionPayload(payload),
      onSuccess: () => {
        message.success(trans("global.operateSuccess", "操作成功"));
        this.editModalCancel();
        if (questionId) {
          this.updateItem(questionId);
        }
      },
    });
  };

  /**
   * 触发编辑器提交保存到题库。
   */
  handleEditSaveClick = () => {
    if (
      this.editEditorController &&
      typeof this.editEditorController.submit === "function"
    ) {
      this.editEditorController.submit("bank");
    }
  };
  changeScoreVisible = (index) => {
    console.log("index", index);
    let state = Object.assign({}, this.state);
    console.log(state);
    state[`itemViesble${index}`] = !state[`itemViesble${index}`];
    this.setState({
      ...state,
    });
  };
  changeTab = (tab) => {
    this.setState({
      cur: tab,
    });
    this.props
      .dispatch({
        type: "home/clearQuestionList",
      })
      .then(() => {
        this.page = 1;
        this.getPage();
      });
  };
  handleMenuClick = (e) => {
    if (e.key === "1") {
      this.setState({ visible: false });
    }
  };
  // changeInputType = (type) => {
  //   this.setState(
  //     {
  //       selectedType: type,
  //     },
  //     () => {
  //       this.props.dispatch(
  //         routerRedux.push(`/inputQuestion/${this.id}/${type}`)
  //       );
  //     }
  //   );
  // };

  knowledgeChange = (value, label, extra) => {
    console.log("onChange", value);
    this.setState(
      {
        selectTree: value,
        selectTreeValue: label,
      },
      () => {
        console.log(
          "selectTree",
          this.state.selectTree,
          this.state.selectTreeValue,
        );
        this.page = 1;
        this.getPage();
      },
    );
  };

  bindLabelChange = (value, key, listIndex, sonIndex) => {
    const idList = [];
    value &&
      value.length > 0 &&
      value.forEach((element) => {
        const array = element.split("-");
        idList.push(array.at(-1));
      });

    const { questionList } = this.props;
    const item = questionList[listIndex];
    if (!item) return;

    const sub =
      sonIndex != undefined &&
      item.sonQuestionList &&
      item.sonQuestionList[sonIndex]
        ? item.sonQuestionList[sonIndex]
        : null;
    const questionId = sub ? (sub.id ?? sub.questionId) : item.id;
    const qLevel = sub
      ? sub.level
      : this.state[`choiceDifficultyValue${item.id}`] === undefined
        ? item.level
        : this.state[`choiceDifficultyValue${item.id}`];

    switch (key) {
      case "knowledge": {
        this.props
          .dispatch({
            type: "home/updateQuestionKnowlegeOrLevel",
            payload: {
              questionId,
              questionLevel: qLevel,
              knowlegeIdList: idList,
            },
          })
          .then(() => {
            message.success(trans("global.editSuccess", "修改成功"));
            this.getPage();
          });

        break;
      }
      case "indicator": {
        updateQuestionIndicator({ questionId, indicatorIds: idList }).then(
          () => {
            message.success(trans("global.editSuccess", "修改成功"));
            this.getPage();
          },
        );

        break;
      }
      case "chapter": {
        updateQuestionChapter({ questionId, chapterIds: idList }).then(() => {
          message.success(trans("global.editSuccess", "修改成功"));
          this.getPage();
        });

        break;
      }
      // No default
    }
  };

  changeEditDifficulty = (index) => {
    let difficultyVisible = {};
    difficultyVisible[index] = true;
    this.setState(
      {
        difficultyVisible,
        // knowLedgePointVisible: false,
      },
      () => {
        // this.onChangeDifficulty();
      },
    );
  };

  changeHiddenDifficulty = () => {
    this.setState({
      // difficultyDataVisible: false,
      difficultyVisible: false,
    });
  };

  onChangeDifficulty = (index, levelName, id) => {
    let difficultyDataVisible = {};
    difficultyDataVisible[index] = true;
    this.setState(
      {
        difficultyDataVisible,
        choiceDifficultyValue: levelName,
      },
      () => {},
    );
  };

  changeDifficultyChoice = (value, index, idList) => {
    console.log("index>>>>", value, index, idList);
    let state = Object.assign({}, this.state);
    state[`choiceDifficultyValue${index}`] = value;
    const { questionList } = this.props;
    console.log(state[`choiceDifficultyValue${index}`]);
    this.setState(
      {
        difficultyDataVisible: {},
        difficultyVisible: {},
        // selectLabel: idList,
        ...state,
        // choiceDifficultyValue: value,
        // difficultyDataVisible: false,
      },
      () => {
        this.props
          .dispatch({
            type: "home/updateQuestionKnowlegeOrLevel",
            payload: {
              questionId: index,
              questionLevel: value,
              knowlegeIdList: idList,
            },
          })
          .then(() => {
            // this.page = 1;
            // this.getPage();
            message.success(trans("global.editSuccess", "修改成功"));
          });
      },
    );
  };

  qualityChange = (value, label, extra) => {
    this.setState(
      {
        qualityValue: value,
        qualityLabel: label,
      },
      () => {
        this.page = 1;
        this.getPage();
      },
    );
  };

  getQualityTree = () => {
    this.props.dispatch({
      type: "inputQuestion/getLabel",
      payload: {
        subjectId: this.state.subjectId,
        gradeId: this.state.gradeId,
      },
    });
  };

  onDropdownVisibleChange = (open) => {
    console.log("open", open);
  };

  // 分页
  onShowSizeChange = (current, pageSize) => {
    this.page = 1;
    this.pageSize = pageSize;
    this.getPage();
  };

  changeNo = (value, pageSize) => {
    if (document.querySelector("#listBox")) {
      document.querySelector("#listBox").scrollTop = 0;
    }
    this.page = value;
    this.getPage();
  };
  clickSubjectNetwork = () => {
    window.open(`${window.location.origin}/api/subject/network/get/auth/link `);
  };
  examTypeChange = (value) => {
    this.setState(
      {
        examType: value,
        scrollTop: 0,
      },
      () => {
        this.page = 1;
        this.getPage();
      },
    );
  };

  goNewVersion = () => {
    setCookie("touterUrl", "newMyQuestion", 365, window.origin);
    this.props.history.push(V2_QUESTION_LIST_ROUTE.path);
  };

  render() {
    const {
      viewData,
      stageList,
      gradeList,
      subjectList,
      typeList,
      questionList,
      basketList,
      basketSubjectId,
      count,
      allGradeList,
      testSubject,
      questionTotal,
      currentUser,
      examTypeList,
    } = this.props;
    const {
      deleteList,
      detaiList,
      IconFont,
      cur,
      difficultyValue,
      difficultyVisible,
      difficultyDataVisible,
      selectValue,
      choiceDifficultyValue,
    } = this.state;
    const inputType = [
      { name: trans("inputQuestion.batchInput", "批量录入"), key: 0 },
      { name: trans("inputQuestion.singleInput", "单题录入"), key: 1 },

      //   {
      //     name: trans("inputQuestion.excel", "EXCEL文件导入（敬请期待）"),
      //     key: 2,
      //   },
    ];

    let newSelectValueTree = [];
    selectValue &&
      selectValue.length &&
      selectValue.map((item) => {
        newSelectValueTree.push({
          title: item.text,
          value: `${item.text}-${item.pinyin || ""}-${item.id}`,
          // value: item.text,
          key: JSON.stringify(item.id),
          children: item.children,
        });
      });
    newSelectValueTree.length &&
      newSelectValueTree.map((item) => {
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
      treeData: newSelectValueTree,
      value: this.state.selectTree,
      onChange: this.knowledgeChange,
      // onBlur: this.blurTreeSelect,
      treeCheckable: true,
      showCheckedStrategy: SHOW_PARENT,
      placeholder: trans("singleInput.knowledgeTree", "知识点"),
      showSearch: true,
      getPopupContainer: () => document.querySelector("#knowledgePoints"),
      style: {
        maxWidth: "450px",
        minWidth: "100px",
        marginTop: "0px",
      },
    };

    const difficulty = [
      { key: 1, name: trans("global.easy", "简单") },
      { key: 2, name: trans("global.general", "普通") },
      { key: 3, name: trans("global.difficult", "困难") },
    ];

    let device = window.yg;

    return (
      <div className={styles.questionContent}>
        <div
          className={styles.tabList}
          id="questionTabHeader"
          style={{
            display: "flex",
            alignItems: "flex-start",
            flexWrap: "nowrap",
            alignContent: "flex-start",
            justifyContent: "space-between",
          }}
        >
          <div className={styles.filterToolbar}>
            <div className={styles.menuTab}>
              <div
                className={[
                  styles.normal,
                  styles.leftMal,
                  cur === 1 ? styles.cur : styles.nocur,
                ].join(" ")}
                onClick={this.changeTab.bind(this, 1)}
              >
                {trans("global.myQuestionNum", "我的题目")}
              </div>
              <div
                className={[
                  styles.normal,
                  styles.rightMal,
                  cur === 2 ? styles.cur : styles.nocur,
                ].join(" ")}
                onClick={this.changeTab.bind(this, 2)}
              >
                {trans("global.schoolQuestionNum", "校本题目")}
              </div>
            </div>

            <span className={styles.inline}>
              <Select
                value={this.state.subjectId}
                style={{ width: 100 }}
                onChange={this.changeCourse}
                dropdownMatchSelectWidth={false}
              >
                <Option value={0} key={0}>
                  <span title={trans("global.allSubject", "全部学科")}>
                    {trans("global.allSubject", "全部学科")}
                  </span>
                </Option>
                {subjectList &&
                  subjectList.length &&
                  subjectList.map((item) => (
                    <Option value={item.id} key={item.id}>
                      <span title={item.name}>{item.name}</span>
                    </Option>
                  ))}
              </Select>
            </span>

            <span className={styles.inline}>
              <Select
                onChange={this.changeGrade}
                value={this.state.gradeId}
                style={{ width: 100 }}
                dropdownMatchSelectWidth={false}
              >
                <Option value={0} key={0}>
                  <span title={trans("global.allGrade", "全部年级")}>
                    {trans("global.allGrade", "全部年级")}
                  </span>
                </Option>
                {allGradeList && allGradeList.length > 0
                  ? allGradeList.map((item) => (
                      <Option value={item.gradeId} key={item.gradeId}>
                        <span title={item.name}>{item.name}</span>
                      </Option>
                    ))
                  : null}
              </Select>
            </span>

            <span className={styles.inline}>
              {examTypeList && examTypeList.length > 0 ? (
                <Select
                  onChange={this.examTypeChange}
                  value={this.state.examType}
                  style={{ width: "100px" }}
                  dropdownMatchSelectWidth={false}
                >
                  <Option value={0} key={-1}>
                    {trans("global.allScene", "全部场景")}
                  </Option>
                  {examTypeList.map((item) => (
                    <Option value={item.code} key={item.code}>
                      {item.typeName}
                    </Option>
                  ))}
                </Select>
              ) : null}
            </span>

            <div className={styles.inline}>
              <TreeSelect
                treeData={this.props.labelList}
                value={this.state.qualityValue}
                onChange={this.qualityChange}
                dropdownMatchSelectWidth={false}
                treeCheckable={true}
                showCheckedStrategy={SHOW_PARENT}
                placeholder={trans("singleInput.label", "素养")}
                showSearch={true}
                className={styles.qualityTreeSelect}
              />
            </div>

            <span className={styles.inlineKnowledgePoints} id="knowledgePoints">
              <TreeSelect {...tProperties} />
            </span>

            <span
              className={[styles.inline, styles.allQuestionTypes].join(" ")}
            >
              {typeList && typeList.length > 0 ? (
                <Select
                  onChange={this.changeType}
                  value={this.state.questionType}
                  dropdownMatchSelectWidth={false}
                >
                  <Option value={0} key={0}>
                    {trans("global.allQuestionTypes", "全部题型")}
                  </Option>
                  {typeList.map((item) => (
                    <Option value={item.code} key={item.code}>
                      {item.typeName}
                    </Option>
                  ))}
                </Select>
              ) : null}
            </span>

            <span
              data-type={trans("data.selectionDifficulty", "选择难度")}
              className={[styles.inline1, styles.difficulty].join(" ")}
            >
              <Select
                mode="multiple"
                onChange={this.changeDifficulty}
                value={this.state.difficultyValue}
                width={130}
                placeholder={trans("data.selectionDifficulty", "选择难度")}
                dropdownMatchSelectWidth={false}
              >
                <Option value={1} key={1}>
                  {trans("global.easy", "简单")}
                </Option>
                <Option value={2} key={2}>
                  {trans("global.general", "普通")}
                </Option>
                <Option value={3} key={3}>
                  {trans("global.difficult", "困难")}
                </Option>
              </Select>
            </span>

            <span className={styles.inline}>
              <Search
                style={{ width: "150px" }}
                placeholder={trans("global.search", "搜索")}
                onChange={this.changeValue}
                onSearch={this.searchValue}
              />
            </span>
          </div>
          <div
            className={
              device == "ipad"
                ? styles.testPaperRecordingIpad
                : styles.testPaperRecording
            }
            style={{
              display: "flex",
              alignItems: "center",
              flexWrap: "nowrap",
              flexShrink: 0,
            }}
          >
            {this.state.XueKeWang ? (
              <span
                className={styles.subjectNetwork}
                onClick={this.clickSubjectNetwork}
              >
                {trans("global.science", "学科网组卷")}
              </span>
            ) : null}
            <Popover
              content={
                <Basket
                  count={this.props.count}
                  dispatch={this.props.dispatch}
                  basketList={basketList}
                  basketSubjectId={basketSubjectId}
                />
              }
              title={null}
              trigger="click"
              getPopupContainer={() =>
                document.querySelector("#questionTabHeader")
              }
            >
              <div className={styles.buyCar}>
                <Tooltip
                  placement="top"
                  title={trans("global.basketName", "试题篮")}
                  trigger={"hover"}
                >
                  <i className={`${icon.iconfont} ${styles.buyCarIcon}`}>
                    &#xe73c;
                  </i>
                  <span className={styles.count}>{this.props.count}</span>
                  <span className={styles.split}>|</span>
                  {trans("myQuestion.assemblePaper", "组卷")}
                </Tooltip>
              </div>
            </Popover>
            <Dropdown
              overlayClassName="inputStem"
              placement="bottomLeft"
              // visible="true"
              overlay={() => {
                return (
                  <Menu onClick={this.handleMenuClick}>
                    <Menu.Item>
                      <Link
                        to={this.getInputQuestionPath(
                          `/mutipleInput/${this.id}`,
                        )}
                      >
                        {trans("inputQuestion.batchInput", "批量录入")}
                      </Link>
                    </Menu.Item>
                    <Menu.Item>
                      <Link
                        to={this.getInputQuestionPath(
                          `/singleInput/${this.id}`,
                        )}
                      >
                        {trans("inputQuestion.singleInput", "单题录入")}
                      </Link>
                    </Menu.Item>
                  </Menu>
                );
              }}
            >
              <div
                className={styles.entryTitle}
                onClick={(e) => e.preventDefault()}
              >
                {trans("global.inputStem", "录题")}
                <Icon style={{ marginLeft: "6px" }} type="down" />
              </div>
            </Dropdown>
          </div>
        </div>

        <div className={styles.questionListSpin}>
          <div className={styles.questionListBox}>
            <div
              className={styles.questionMapList}
              style={{ position: "relative" }}
              id="listBox"
            >
              {questionList && questionList.length > 0 ? (
                questionList.map((item, index) => (
                  <div
                    className={[styles.questionList, "listItem"].join(" ")}
                    key={index}
                  >
                    <div className={styles.header}></div>
                    <div
                      className={[
                        styles.modulecontent,
                        styles.questionClickable,
                      ].join(" ")}
                      onClick={this.viewAnalysis.bind(this, item.id)}
                    >
                      <div
                        dangerouslySetInnerHTML={{ __html: item.content }}
                      ></div>
                      {item.sonQuestionList && item.sonQuestionList
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

                    <div
                      className={[
                        styles.optionBox,
                        styles.questionClickable,
                      ].join(" ")}
                      onClick={this.viewAnalysis.bind(this, item.id)}
                    >
                      {item.answersModelList && item.answersModelList.length > 0
                        ? item.answersModelList.map((it, ind) => (
                            <div
                              className={[
                                styles.optionList,
                                item.answer && item.answer.includes(it.key)
                                  ? styles.trueValue
                                  : "",
                              ].join(" ")}
                              key={ind}
                            >
                              <div className={styles.opListLeft}>
                                {getQuestionOptionDisplayKey(it, ind)}.
                              </div>
                              <div
                                className={styles.opListRight}
                                dangerouslySetInnerHTML={{ __html: it.answers }}
                              ></div>
                            </div>
                          ))
                        : null}
                    </div>

                    <div
                      className={styles.moduleBottom}
                      id={`bottom${item.id}`}
                    >
                      <div className={styles.viewBottom}>
                        <div style={{ marginTop: "4px", marginBottom: "4px" }}>
                          <div className={styles.createUser}>
                            <i className={styles.iconfont}>&#xe798;</i>
                            {item.gradeName}-{item.subjectName}
                          </div>
                          <span
                            className={[
                              styles.questionType1,
                              styles.questionType,
                            ].join(" ")}
                          >
                            {
                              {
                                1: [
                                  <i className={styles.iconfont}>&#xe761;</i>,
                                  trans("global.radio", "单选题"),
                                ],
                                2: [
                                  <i className={styles.iconfont}>&#xe755;</i>,
                                  trans("global.check", "多选题"),
                                ],
                                3: [
                                  <i className={styles.iconfont}>&#xe802;</i>,
                                  trans("global.pack", "填空题"),
                                ],
                                4: [
                                  <i className={styles.iconfont}>&#xe800;</i>,
                                  trans("global.judge", "判断题"),
                                ],
                                5: [
                                  <i
                                    className={styles.iconfont}
                                    style={{ fontSize: 12 }}
                                  >
                                    &#xe807;{" "}
                                  </i>,
                                  trans("global.ask", "问答题"),
                                ],
                                6: [
                                  <i className={styles.iconfont}>&#xe7f6;</i>,
                                  trans("global.combination", "组合题"),
                                ],
                                7: [
                                  <i className={styles.iconfont}>&#xe7f6;</i>,
                                  "单选投票",
                                ],
                                8: [
                                  <i className={styles.iconfont}>&#xe7f6;</i>,
                                  "多选投票",
                                ],
                              }[item.type]
                            }
                          </span>

                          {item.type !== 7 && item.type !== 8 ? (
                            <span className={styles.inlineDifficulty}>
                              <Select
                                dropdownClassName="selectStyles"
                                onChange={(value) =>
                                  this.changeDifficultyChoice(
                                    value,
                                    item.id,
                                    item.knowledgeIds,
                                  )
                                }
                                value={
                                  this.state[`choiceDifficultyValue${item.id}`]
                                }
                                style={{
                                  width: 78,
                                  height: 30,
                                  lineHeight: "30px",
                                }}
                              >
                                {difficulty.map((item) => (
                                  <Option value={item.key} key={item.key}>
                                    <span>{item.name}</span>
                                  </Option>
                                ))}
                              </Select>
                            </span>
                          ) : null}

                          {this.state.cur && this.state.cur !== 1 ? (
                            <div className={[styles.createUser].join(" ")}>
                              {trans("global.addPerson")}：{item.createUserName}
                            </div>
                          ) : null}

                          {item.questionStatisticalResponseVO?.totalExamNum ==
                          undefined ? null : (
                            <Popover
                              content={getInnerContent(
                                item.questionStatisticalResponseVO
                                  ?.questionStatisticalWithExamResponseVOList,
                              )}
                            >
                              <div className={[styles.createUser].join(" ")}>
                                {trans("global.testPaper", "组卷")}：
                                <span className={styles.canClickText}>
                                  {
                                    item.questionStatisticalResponseVO
                                      ?.totalExamNum
                                  }
                                </span>
                              </div>
                            </Popover>
                          )}

                          {item.questionStatisticalResponseVO
                            ?.totalStudentNum == undefined ? null : (
                            <Popover
                              content={getInnerContent(
                                item.questionStatisticalResponseVO
                                  ?.questionStatisticalWithExamResponseVOList,
                              )}
                            >
                              <div className={[styles.createUser].join(" ")}>
                                {trans("global.reply", "作答人数")}：
                                <span className={styles.canClickText}>
                                  {
                                    item.questionStatisticalResponseVO
                                      ?.totalStudentNum
                                  }
                                </span>
                              </div>
                            </Popover>
                          )}

                          {item.questionStatisticalResponseVO
                            ?.questionScoreAverage != undefined &&
                          item.type != 7 &&
                          item.type != 8 ? (
                            <Popover
                              content={getInnerContent(
                                item.questionStatisticalResponseVO
                                  ?.questionStatisticalWithExamResponseVOList,
                              )}
                            >
                              <div className={[styles.createUser].join(" ")}>
                                {trans("global.averageScoreRate", "平均得分率")}
                                ：
                                <span className={styles.canClickText}>
                                  {
                                    item.questionStatisticalResponseVO
                                      ?.questionScoreAverage
                                  }
                                </span>
                              </div>
                            </Popover>
                          ) : null}
                        </div>

                        <div className={styles.bottomBtn}>
                          {item.isInQuestionBasket ? (
                            <div
                              className={[
                                styles.bianji,
                                styles.cursor,
                                styles.active,
                              ].join(" ")}
                              onClick={this.cancelAdd.bind(this, item.id)}
                            >
                              <i className={styles.iconfont}>&#xe6a8;</i>
                              &nbsp;{trans("global.isAdded", "已加入试题篮")}
                              &nbsp;{" "}
                              {trans("global.cancelAddBasket", "取消加入")}
                            </div>
                          ) : (
                            <div
                              className={[styles.bianji, styles.cursor].join(
                                " ",
                              )}
                              onClick={this.showTransLate.bind(this, item)}
                            >
                              <i className={`${styles.iconfont}`}>&#xe73c;</i>
                              &nbsp;{trans("global.addBasket", "加入试题篮")}
                            </div>
                          )}

                          {item.canEdit ? (
                            <div
                              className={[styles.bianji, styles.cursor].join(
                                " ",
                              )}
                              onClick={this.editQuestion.bind(this, item.id)}
                            >
                              <i className={styles.iconfont}>&#xe6aa;</i>
                              &nbsp;{trans("global.edit", "编辑")}
                            </div>
                          ) : null}

                          {item.canEdit ? (
                            <Popover
                              content={
                                <div>
                                  <div className={styles.messageContent}>
                                    <span>
                                      {trans(
                                        "global.questionContent",
                                        "你确定要删除这个测验吗？删除后，该测验所有内容将不可恢复。",
                                      )}
                                    </span>
                                  </div>
                                  <div className={styles.modalBottom}>
                                    <Button
                                      shape="round"
                                      onClick={this.changeScoreVisible.bind(
                                        this,
                                        item.id,
                                      )}
                                    >
                                      {trans("global.cancle", "取消")}
                                    </Button>
                                    <Button
                                      type="primary"
                                      shape="round"
                                      onClick={this.deleteQuestion.bind(
                                        this,
                                        item.id,
                                      )}
                                    >
                                      {trans("global.sure", "确定")}
                                    </Button>
                                  </div>
                                </div>
                              }
                              trigger="click"
                              visible={this.state[`itemViesble${item.id}`]}
                              placement={"bottom"}
                              getPopupContainer={() =>
                                document.getElementById(`bottom${item.id}`)
                              }
                            >
                              <div
                                className={[styles.bianji, styles.cursor].join(
                                  " ",
                                )}
                                onClick={this.changeScoreVisible.bind(
                                  this,
                                  item.id,
                                )}
                              >
                                <i className={styles.iconfont}>&#xe739;</i>
                                &nbsp;{trans("global.delete", "删除")}
                              </div>
                            </Popover>
                          ) : null}

                          <div
                            className={[
                              styles.bianji,
                              styles.cursor,
                              this.isAnalysisVisible(item.id)
                                ? styles.active
                                : "",
                            ].join(" ")}
                            onClick={this.viewAnalysis.bind(this, item.id)}
                          >
                            <i className={styles.iconfont}>&#xe631;</i>
                            &nbsp;
                            {this.isAnalysisVisible(item.id)
                              ? trans("detail.hideAnalysis", "收起解析")
                              : trans("detail.viewAnalysis", "查看解析")}
                          </div>
                        </div>
                      </div>

                      <div
                        id={`analysis${item.id}`}
                        className={styles.analysisBox}
                        style={{
                          display: this.isAnalysisVisible(item.id)
                            ? "block"
                            : "none",
                        }}
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
                                      <span>({ind + 1}).</span>
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
                                              <div
                                                className={styles.answerFLex}
                                              >
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
                                          {/* <span>
                                      {item.gapFillingAnswer?.answers?.join("，")}
                                    </span> */}
                                        </>
                                      ) : index_.type == 4 ? (
                                        <div>
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
                              dangerouslySetInnerHTML={{
                                __html: item.answer,
                              }}
                            ></div>
                          )}
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
                                      <span
                                        className={styles.analysisItemTitle}
                                      >
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
                        <QuestionMetaBindPanel
                          styles={styles}
                          item={item}
                          index={index}
                          onLabelChange={this.bindLabelChange}
                          getPopupContainer={() =>
                            document.querySelector("#listBox") || document.body
                          }
                        />
                      </div>
                    </div>
                  </div>
                ))
              ) : IconFont ? (
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    alignItems: "center",
                    alignContent: "center",
                    justifyContent: "center",
                    height: "100%",
                  }}
                >
                  <Empty
                    description={trans(
                      "global.singleImport",
                      "暂时没有题目，你可以尝试以下方式录入题目",
                    )}
                  />
                  <div
                    style={{
                      display: "flex",
                      width: "100%",
                      justifyContent: "center",
                      height: "40px",
                      lineHeight: "40px",
                      color: "#0445FC",
                    }}
                  >
                    <Link
                      style={{
                        marginRight: "30px",
                        cursor: "pointer",
                        color: "#0445fc",
                      }}
                      to={this.getInputQuestionPath(`/mutipleInput/${this.id}`)}
                    >
                      {trans("inputQuestion.batchInput", "批量录入")}
                    </Link>
                    <Link
                      style={{ cursor: "pointer", color: "#0445fc" }}
                      to={this.getInputQuestionPath(`/singleInput/${this.id}`)}
                    >
                      {trans("inputQuestion.singleInput", "单题录入")}
                    </Link>
                  </div>
                  {/*  <div className={styles.noQuestionList}>
                  <div className={styles.iconBox}>
                   <IconFont
                      type="icon-chengguoweikong"
                      className={styles.noSourceIcon}
                    />{" "}
                  </div> {trans("global.noQuestionList", "暂时没有题目哦")}
                  <div className={styles.canOpen}>
                    <Link to={"/inputQuestion"}>
                      {trans("global.goInput", "去录入题目")}
                    </Link>
                  </div>
                </div>*/}
                </div>
              ) : null}
            </div>
          </div>
          {this.state.loading ? (
            <div className={styles.questionListLoadingMask}>
              <Icon
                type="loading"
                spin={true}
                className={styles.questionListLoadingIcon}
              />
            </div>
          ) : null}
        </div>

        {questionTotal == 0 ? null : (
          <div className={styles.pagination}>
            <Pagination
              size="small"
              current={this.page}
              pageSize={this.pageSize}
              pageSizeOptions={[50, 100, 150, 200]}
              total={questionTotal || 0}
              onChange={this.changeNo}
              showSizeChanger
              showQuickJumper
              onShowSizeChange={this.onShowSizeChange}
            />
          </div>
        )}

        <Modal
          title={""}
          footer={null}
          getContainer={false}
          // getContainer={false}
          centered={true}
          wrapClassName={"editModal"}
          visible={this.state.editModalVisible}
          closable={false}
          destroyOnClose={true}
          onCancel={this.editModalCancel}
        >
          {this.props.questionItem && this.props.questionItem.questionId ? (
            <div className={styles.editModalBody}>
              <div className={styles.editModalHeader}>
                <span className={styles.editModalTitle}>
                  {trans("global.editQuestion", "编辑题目")}
                </span>
                <div className={styles.editModalActions}>
                  <Button onClick={this.editModalCancel}>
                    {trans("global.cancel", "取消")}
                  </Button>
                  <Button type="primary" onClick={this.handleEditSaveClick}>
                    {trans("global.save", "保存")}
                  </Button>
                </div>
              </div>
              <div className={styles.editModalEditor}>
                <QuestionEntryEditor
                  initialQuestion={this.props.questionItem}
                  onControllerReady={this.handleEditEditorReady}
                  onSubmit={this.handleEditSubmit}
                />
              </div>
            </div>
          ) : null}
        </Modal>
        {/* {this.state.imgVisible ? (
          <PreviewImg
            imgUrl={this.state.url}
            modalVisible={this.state.imgVisible}
            changeModalVisible={this.cancelImg}
          />
        ) : null} */}
        <div className={styles.versionChecked}>
          <span onClick={this.goNewVersion} style={{ cursor: "pointer" }}>
            体验
            <br />
            新版
          </span>
        </div>
      </div>
    );
  }
}

export default connect(({ home, global, inputQuestion }) => ({
  stageList: global.stageList,
  gradeList: global.gradeList,
  subjectList: inputQuestion.subjectList,
  questionList: home.questionList,
  typeList: global.typeList,
  questionItem: home.questionItem,
  questionTotal: home.questionTotal,
  basketList: home.basketList,
  count: home.count,
  examTypeList: home.examTypeList,
  basketSubjectId: home.basketSubjectId,
  currentUser: global.currentUser,
  allGradeList: inputQuestion.allGradeList, //年级
  labelList: inputQuestion.labelList,
}))(MyQuestion);
const cloneObjectList = (list) => {
  let moveList = [];

  for (const element of list) {
    if (element) {
      moveList.push(Object.assign({}, element));
    }
  }
  return moveList;
};
