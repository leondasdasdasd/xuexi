//新闻
import React, { PureComponent } from "react";
import {
  Dropdown,
  Empty,
  Icon,
  Input,
  Menu,
  message,
  Pagination,
  Popover,
  Select,
  Spin,
  Tooltip,
  Tree,
} from "antd";
import { connect } from "dva";
import { Link } from "dva/router";

import Basket from "components/Basket/index";

import QuestionPreviewContent from "../../components/QuestionPreviewContent";
import {
  updateQuestionChapter,
  updateQuestionIndicator,
} from "../../services/global";
import {
  queryChapter,
  queryLabel,
  queryTree,
} from "../../services/inputQuestion";
import {
  batchQueryNewMyBusinessQuestionTypes,
  queryEnabledNewMyBusinessQuestionTypes,
  queryNewMyQuestionPage,
} from "../../services/newMyQuestion";
import {
  bindQuestionV2Basket,
  deleteQuestionV2Resource,
  unbindQuestionV2Basket,
} from "../../services/questionV2";
import {
  stageSubjectList,
  teachingMaterialAndGradeList,
} from "../../services/qustion";
import { trans } from "../../utils/i18n";
import { createBusinessQuestionTypesById } from "../../utils/questionPreviewAdapter.js";
import { loginRedirect } from "../../utils/utils";
import { getNewMyQuestionBasketCount } from "./basketViewModel";
import KnowledgeChapterTree from "./components/KnowledgeChapterTree";
import QuestionBottomActions from "./components/QuestionBottomActions";
import QuestionTab from "./components/questionTab";
import SrarchForm from "./components/srarchForm";
import StageSubjectButton from "./components/stageSubjectBtn";
import {
  buildNewMyQuestionInputPath,
  buildNewMyQuestionPaperEditorPath,
  NEW_MY_QUESTION_INPUT_ROUTE_ITEMS,
} from "./questionInputRoutes.js";
import {
  createQuestionListPayload,
  createRestoredQueryState,
  getQuestionTypeFilterGradeIds,
  isValidQuestionTypeGradeFilter,
  reconcileSavedTeachingContext,
  resolveStageSubjectSelection,
  resolveTeachingSelection,
} from "./questionListQueryContext";
import {
  normalizeV2QuestionListQueryContext,
  readV2QuestionListQuerySession,
  saveV2QuestionListQuerySession,
} from "./questionListQuerySession";
import {
  collectBusinessQuestionTypeIdsFromAggregates,
  createNewMyQuestionListItemViewModel,
  createNewMyQuestionTypeFilterOptions,
  updateNewMyQuestionAggregateBasketMembership,
} from "./questionPreviewAdapter.js";

import styles from "./index.module.less";

const { Option } = Select;
const { Search } = Input;
const { TreeNode } = Tree;

const getDefinedValue = (value, fallback) =>
  value === undefined ? fallback : value;

const getParentKey = (key, tree) => {
  let parentKey;
  for (const node of tree) {
    if (node.children && node.children.length > 0) {
      if (node.children.some((item) => item.id === key)) {
        parentKey = `${node.id}`;
      } else if (getParentKey(key, node.children)) {
        parentKey = getParentKey(key, node.children);
      }
    }
  }
  return parentKey;
};
let EXP = [];

const getNewMyQuestionLocale = (_unusedReason = "default") => (
  void _unusedReason,
  typeof window !== "undefined" &&
  String(window.globalLange || navigator.language || "").startsWith("en")
    ? "en"
    : "zh"
);

const validateNewMyQuestionMutationResponse = (response) => {
  if (!response) {
    return false;
  }

  if (response.err) {
    message.error(response.err.message || trans("global.failed", "操作失败"));
    return false;
  }

  if (!response.ifLogin) {
    loginRedirect();
    return false;
  }

  if (!response.status) {
    message.error(response.message || trans("global.failed", "操作失败"));
    return false;
  }

  return true;
};

export class V2QuestionList extends PureComponent {
  constructor(properties) {
    super(properties);
    const savedQueryContext = readV2QuestionListQuerySession();
    this.state = {
      value: 1,
      cur: 1,
      IconFont: null,
      answerDetailsVisibleById: {},
      knExpandedKeys: [],
      loading: false,
      questionList: [],
      questionTotal: 0,
      questionTypeOptions: [],
      businessQuestionTypesById: {},
      dataList: [],
      treeSearchVal: "",
      editionAndGradeData: [],
      teachingMaterial: "",
      selectGrade: "",
      stage: {},
      subject: {},
      stageSubjects: [],
      operationType: 1,
      knowlegeMerge: true,
      type: 1,
      examType: -1,
      ...createRestoredQueryState(savedQueryContext),
    };
    this.id = properties.match.params.id
      ? JSON.parse(properties.match.params.id)
      : null;
    this.pageNo = savedQueryContext?.pageNo || 1;
    this.limit = savedQueryContext?.limit || 10;
    this.initialQueryContext = savedQueryContext;
    this.questionTypeRequestVersion = 0;
  }
  async componentDidMount() {
    // 获取学段学科数据
    this.getStageSubjectlist();

    this.props.dispatch({
      type: "home/getV2BasketList",
    });

    const IconFonts = Icon.createFromIconfontCN({
      scriptUrl: "//at.alicdn.com/t/font_789461_ovr9ifg67hb.js",
    });
    this.setState({
      IconFont: IconFonts,
    });
  }

  resetQuestionTypeContext = () => {
    this.questionTypeRequestVersion += 1;
    this.setState({
      businessQuestionTypeIds: [],
      questionTypeOptions: [],
    });
  };

  getQuestionTypeOptions = async ({ stageId, subjectId }) => {
    const requestVersion = ++this.questionTypeRequestVersion;
    this.setState({
      questionTypeOptions: [],
    });

    const response = await queryEnabledNewMyBusinessQuestionTypes({
      stageId,
      subjectId,
    });

    if (requestVersion !== this.questionTypeRequestVersion) {
      return;
    }

    if (!response.ifLogin) {
      loginRedirect();
      return;
    }

    if (!response.status) {
      message.error(response.message);
      return;
    }

    this.setState({
      questionTypeOptions: createNewMyQuestionTypeFilterOptions(
        response.content,
        getNewMyQuestionLocale(),
      ),
    });
  };

  createQueryContext = (parameters = {}) => {
    const knowledgeMultiple = getDefinedValue(
      parameters.knowledgeMultiple,
      this.state.knowledgeMultiple,
    );
    const knowledgeIds = getDefinedValue(
      parameters.knowledgeIds,
      knowledgeMultiple
        ? this.state.checkKnowledgeIds
        : this.state.knowledgeIds,
    );

    return normalizeV2QuestionListQueryContext({
      businessQuestionTypeIds: getDefinedValue(
        parameters.businessQuestionTypeIds,
        this.state.businessQuestionTypeIds,
      ),
      chapterGradeId: getDefinedValue(
        parameters.chapterGradeId,
        this.state.selectGrade?.gradeId,
      ),
      chapterIds: getDefinedValue(parameters.chapterIds, this.state.chapterIds),
      gradeIds: getDefinedValue(parameters.gradeIds, this.state.gradeIds),
      keyword: getDefinedValue(parameters.keyword, this.state.keyword),
      knowledgeIds,
      knowledgeMultiple,
      levels: getDefinedValue(parameters.levels, this.state.levels),
      limit: getDefinedValue(parameters.limit, this.limit),
      pageNo: getDefinedValue(parameters.pageNo, this.pageNo),
      stageId: getDefinedValue(parameters.stageId, this.state.stage?.stageId),
      subjectId: getDefinedValue(parameters.subjectId, this.state.subject?.id),
      tabKey: getDefinedValue(parameters.tabKey, this.state.tabKey),
      teachingMaterialId: getDefinedValue(
        parameters.teachingMaterialId,
        this.state.teachingMaterial?.id,
      ),
    });
  };

  getPage = async (parameters = {}) => {
    const queryContext = this.createQueryContext(parameters);
    const payload = createQuestionListPayload(queryContext);
    this.pageNo = queryContext.pageNo;
    this.limit = queryContext.limit;
    saveV2QuestionListQuerySession(queryContext);
    this.initialQueryContext = undefined;

    this.setState({
      loading: true,
    });

    try {
      const questionResponse = await queryNewMyQuestionPage(payload);

      if (!questionResponse.ifLogin) {
        this.setState({ loading: false, searchLoading: false });
        loginRedirect();
        return;
      }

      if (!questionResponse.status) {
        this.setState({ loading: false, searchLoading: false });
        message.error(questionResponse.message);
        return;
      }

      const questionList = questionResponse.content.data;
      const businessQuestionTypeIds =
        collectBusinessQuestionTypeIdsFromAggregates(questionList);
      const questionTypeResponse = await batchQueryNewMyBusinessQuestionTypes({
        businessQuestionTypeIds,
      });

      if (!questionTypeResponse.ifLogin) {
        this.setState({ loading: false, searchLoading: false });
        loginRedirect();
        return;
      }

      if (!questionTypeResponse.status) {
        this.setState({ loading: false, searchLoading: false });
        message.error(questionTypeResponse.message);
        return;
      }

      this.setState({
        loading: false,
        questionList,
        questionTotal: questionResponse.content.total,
        businessQuestionTypesById: createBusinessQuestionTypesById(
          questionTypeResponse.content,
        ),
        searchLoading: false,
      });
    } catch (error) {
      message.error(error?.message || trans("global.failed", "操作失败"));
      this.setState({
        loading: false,
        searchLoading: false,
      });
    }
  };

  // 获取章节
  getChapterTree = ({ subjectId, gradeId, teachingMaterialId }) => {
    queryChapter({
      subjectId,
      gradeId,
      isSegmentation: true,
      teachingMaterialId,
    }).then((res) => {
      if (res.ifLogin) {
        if (res.status) {
          let list = [];
          if (res.content && res.content.length > 0) {
            res.content.map((item) => {
              list.push(`${item.id}`);
            });
          }
          this.setState({
            chExpandedKeys: list || [],
            chTreeData: res.content,
          });
        } else {
          message.error(res.message);
        }
      } else {
        loginRedirect();
      }
    });
  };

  // 获取知识点
  getKnowledgeTree = ({ subjectId, stageId }) => {
    queryTree({
      subjectId,
      stageId,
    }).then((res) => {
      if (res.ifLogin) {
        if (res.status) {
          let list = [];
          if (res.content && res.content.length > 0) {
            res.content.map((item) => {
              list.push(`${item.id}`);
            });
          }
          const dataList = [];
          const generateList = (data) => {
            for (const node of data) {
              const { id, title } = node;
              dataList.push({ key: id, title: title });
              if (node.children) {
                generateList(node.children);
              }
            }
          };
          generateList(res.content);

          EXP = list;
          this.setState({
            knExpandedKeys: list || [],
            dataList: dataList,
            knTreeData: res.content,
          });
        } else {
          message.error(res.message);
        }
      } else {
        loginRedirect();
      }
    });
  };

  // 获取教材和年级数据
  getTeachingMaterialAndGradeList = async ({
    stageId,
    subject,
    queryContext,
  }) => {
    const response = await teachingMaterialAndGradeList({
      stageId,
    });
    const { stage: currentStage, subject: currentSubject } = this.state;
    if (currentStage.stageId !== stageId || currentSubject.id !== subject.id) {
      return;
    }
    if (!response.ifLogin) {
      loginRedirect();
      return;
    }
    if (!response.status) {
      message.error(response.message);
      return;
    }

    const { chapterIds, grade, gradeIds, teachingMaterial } =
      resolveTeachingSelection(response.content, queryContext);
    this.setState({
      editionAndGradeData: response.content,
      teachingMaterial,
      selectGrade: grade,
      gradeIds,
      chapterIds,
    });

    this.getChapterTree({
      teachingMaterialId: teachingMaterial.id,
      gradeId: grade.gradeId,
      subjectId: subject.id,
    });
    this.getPage({
      ...queryContext,
      chapterGradeId: grade.gradeId,
      chapterIds,
      gradeIds,
      stageId,
      subjectId: subject.id,
      teachingMaterialId: teachingMaterial.id,
    });
  };

  getLabel = () => {
    this.props.dispatch({
      type: "inputQuestion/getLabel",
      payload: {
        subjectId: this.state.subjectId,
        gradeId: this.state.gradeIds?.[0],
      },
    });
  };

  questionSourceChange = (tab) => {
    this.setState({
      type: tab,
    });
    this.pageNo = 1;
    this.getPage({ pageNo: 1 });
    this.resetScrll();
  };

  deleteQuestion = async (id, index) => {
    const response = await deleteQuestionV2Resource(id);

    if (!validateNewMyQuestionMutationResponse(response)) {
      return;
    }

    this.props.dispatch({
      type: "home/getV2BasketList",
    });
    const questionList = [...this.state.questionList];
    questionList.splice(index, 1);
    this.setState({
      questionList,
      questionTotal: Math.max(0, this.state.questionTotal - 1),
    });
    message.success(trans("global.operateSuccess", "操作成功"));
  };

  toggleAnswerDetails = (questionKey) => {
    this.setState((state) => ({
      answerDetailsVisibleById: {
        ...state.answerDetailsVisibleById,
        [questionKey]: !state.answerDetailsVisibleById[questionKey],
      },
    }));
  };

  changeNo = (value, pageSize) => {
    this.resetScrll();
    this.pageNo = value;
    this.getPage({ pageNo: value });
  };

  resetScrll = () => {
    if (document.querySelector("#tableWarp")) {
      document.querySelector("#tableWarp").scrollTop = 0;
    }
  };

  // 分页
  onShowSizeChange = (current, pageSize) => {
    this.pageNo = 1;
    this.limit = pageSize;
    this.getPage({ limit: pageSize, pageNo: 1 });
  };

  editQuestion = (id) => {
    this.props.history.push(`/questionAssetInput/${id}`);
  };

  onTreeKnowledgeSelect = (selectedKeys, info, key) => {
    this.pageNo = 1;
    if (key == "ch") {
      this.setState({
        chapterIds: selectedKeys,
      });
      this.getPage({ chapterIds: selectedKeys, pageNo: 1 });
    } else if (key == "kn" && !this.state.knowledgeMultiple) {
      this.setState({
        knowledgeIds: selectedKeys,
      });
      this.getPage({ knowledgeIds: selectedKeys, pageNo: 1 });
    }
  };

  clickSubjectNetwork = () => {
    window.open(`${window.location.origin}/api/subject/network/get/auth/link `);
  };

  knowledgeTreeSearch = (e) => {
    const { value } = e.target;
    const expandedKeys = this.state.dataList
      .map((item) => {
        if (item.title.includes(value)) {
          return getParentKey(item.key, this.state.knTreeData);
        }
        return null;
      })
      .filter((item, index, self) => item && self.indexOf(item) === index);

    this.setState({
      knExpandedKeys: value ? expandedKeys : EXP,
      treeSearchVal: value,
    });
  };

  knExpand = (expandedKeys) => {
    if (!this.knowledgeValues) {
      EXP = expandedKeys;
    }
    this.setState({
      knExpandedKeys: expandedKeys,
    });
  };

  chExpand = (expandedKeys) => {
    if (!this.knowledgeValues) {
      EXP = expandedKeys;
    }
    this.setState({
      chExpandedKeys: expandedKeys,
    });
  };

  labelChange = (value, key, index) => {
    let idList = [];
    value &&
      value.length > 0 &&
      value.map((item) => {
        let array = item.split("-");
        idList.push(array.at(-1));
      });

    let list = JSON.parse(JSON.stringify(this.state.questionList));

    if (key == "knowledge") {
      this.props
        .dispatch({
          type: "home/updateQuestionKnowlegeOrLevel",
          payload: {
            questionId: list[index].id,
            knowlegeIdList: idList,
          },
        })
        .then(() => {
          message.success(trans("newMyQuestion.updateSuccess", "修改成功"));
        });
      list[index].knowlegeIds = value;
      list[index].knowledgeValues = value;
    } else if (key == "indicator") {
      updateQuestionIndicator({
        questionId: list[index].id,
        indicatorIds: idList,
      }).then((res) => {
        message.success(trans("newMyQuestion.updateSuccess", "修改成功"));
      });
      list[index].indicatorIds = value;
      list[index].indicatorValues = value;
    } else if (key == "chapter") {
      updateQuestionChapter({
        questionId: list[index].id,
        chapterIds: idList,
      }).then((res) => {
        message.success(trans("newMyQuestion.updateSuccess", "修改成功"));
      });
      list[index].chapterId = value;
      list[index].chapterValues = value;
    }
    this.setState({
      questionList: list,
    });
  };

  showTransLate = async (item) => {
    const response = await bindQuestionV2Basket({
      gradeId: item.gradeId,
      questionId: item.id,
      subjectId: item.subjectId,
    });

    if (!validateNewMyQuestionMutationResponse(response)) {
      return;
    }

    this.props.dispatch({
      type: "home/getV2BasketList",
    });
    this.setState((state) => ({
      questionList: updateNewMyQuestionAggregateBasketMembership(
        state.questionList,
        item.id,
        true,
      ),
    }));
  };

  cancelAdd = async (id) => {
    const response = await unbindQuestionV2Basket({
      questionId: id,
    });

    if (!validateNewMyQuestionMutationResponse(response)) {
      return;
    }

    this.props.dispatch({
      type: "home/getV2BasketList",
    });
    this.setState((state) => ({
      questionList: updateNewMyQuestionAggregateBasketMembership(
        state.questionList,
        id,
        false,
      ),
    }));
  };

  gradeAndTextbookChange = (value, key) => {
    let parameters = {
      teachingMaterialId: this.state.teachingMaterial.id,
      gradeId: this.state.selectGrade.gradeId,
      subjectId: this.state.subject.id,
      chapterIds: [], //选择教材和年级，清空已选章节
    };
    if (key == "textbook") {
      this.setState({
        teachingMaterial: value,
        chapterIds: [],
      });
      parameters = {
        ...parameters,
        teachingMaterialId: value.id,
      };
    } else {
      this.setState({
        selectGrade: value,
        gradeIds: [value.gradeId],
        chapterIds: [],
      });
      parameters = {
        ...parameters,
        gradeId: value.gradeId,
      };
    }
    this.getChapterTree(parameters);
    this.getPage({
      chapterGradeId: parameters.gradeId,
      chapterIds: [],
      gradeIds: [parameters.gradeId],
      teachingMaterialId: parameters.teachingMaterialId,
    });
  };

  // 获取学段学科数据
  getStageSubjectlist = async () => {
    const response = await stageSubjectList({});
    if (!response.ifLogin) {
      loginRedirect();
      return;
    }
    if (!response.status) {
      message.error(response.message);
      return;
    }

    const savedQueryContext = this.initialQueryContext;
    const { canRestoreTeachingContext, stage, subject } =
      resolveStageSubjectSelection(response.content, savedQueryContext);
    const queryContext = reconcileSavedTeachingContext(
      savedQueryContext,
      stage,
      subject,
      canRestoreTeachingContext,
    );
    if (savedQueryContext && !canRestoreTeachingContext) this.pageNo = 1;
    this.setState({
      stageSubjects: response.content,
      stage,
      subject,
      ...(canRestoreTeachingContext
        ? {}
        : {
            businessQuestionTypeIds: [],
            chapterIds: [],
            checkKnowledgeIds: [],
            gradeIds: [],
            knowledgeIds: [],
          }),
    });

    this.getQuestionTypeOptions({
      stageId: stage.stageId,
      subjectId: subject.id,
    });
    this.getTeachingMaterialAndGradeList({
      queryContext,
      stageId: stage.stageId,
      subject,
    });
    this.getKnowledgeTree({
      stageId: stage.stageId,
      subjectId: subject.id,
    });
  };

  stageSubjectChange = (subject, stage) => {
    this.resetQuestionTypeContext();
    this.setState({
      subject: subject,
      stage: stage,
      knowledgeIds: [], //切换学段学科，清空已经选的知识点,
      checkKnowledgeIds: [],
    });

    this.getQuestionTypeOptions({
      stageId: stage.stageId,
      subjectId: subject.id,
    });

    this.getTeachingMaterialAndGradeList({
      stageId: stage.stageId,
      subject,
    });
    this.getKnowledgeTree({
      stageId: stage.stageId,
      subjectId: subject.id,
    });
  };

  treeTypeChange = (value) => {
    const queryContext = this.createQueryContext({ tabKey: value });
    const businessQuestionTypeIds = isValidQuestionTypeGradeFilter(
      queryContext.businessQuestionTypeIds,
      getQuestionTypeFilterGradeIds(queryContext),
    )
      ? queryContext.businessQuestionTypeIds
      : [];
    this.setState({
      businessQuestionTypeIds,
      tabKey: value,
    });
    this.getPage({ businessQuestionTypeIds, tabKey: value });
  };

  quTypeChange = (value) => {
    const businessQuestionTypeIds = value.code === -1 ? [] : [value.code];
    const queryContext = this.createQueryContext({ businessQuestionTypeIds });
    if (
      !isValidQuestionTypeGradeFilter(
        businessQuestionTypeIds,
        getQuestionTypeFilterGradeIds(queryContext),
      )
    ) {
      return;
    }

    this.setState({
      businessQuestionTypeIds,
    });
    this.pageNo = 1;
    this.getPage({ businessQuestionTypeIds, pageNo: 1 });
  };

  userChange = (value) => {
    this.setState({
      createUserId: value,
    });
    this.pageNo = 1;
    this.getPage({ pageNo: 1 });
  };

  gradeChange = (value) => {
    const gradeIds = value.gradeId === -1 ? [] : [value.gradeId];
    const queryContext = this.createQueryContext({ gradeIds });
    if (
      !isValidQuestionTypeGradeFilter(
        this.state.businessQuestionTypeIds,
        getQuestionTypeFilterGradeIds(queryContext),
      )
    ) {
      return;
    }

    this.setState({
      gradeIds,
    });
    this.pageNo = 1;
    this.getPage({ gradeIds, pageNo: 1 });
  };

  examTypeChange = (value) => {
    this.setState({
      examType: value.code,
    });
    this.pageNo = 1;
    this.getPage({ pageNo: 1 });
  };

  quLevelChange = (value) => {
    const levels = value === -1 ? [] : [value];

    this.setState({
      levels,
    });
    this.pageNo = 1;
    this.getPage({ levels, pageNo: 1 });
  };

  yearChange = (value) => {
    this.setState({
      year: value,
    });
    this.pageNo = 1;
    this.getPage({ pageNo: 1 });
  };
  searchQustion = (value) => {
    this.setState({
      keyword: value,
      searchLoading: true,
    });
    this.pageNo = 1;
    this.getPage({ keyword: value, pageNo: 1 });
  };

  questionBind = (question, key) => {
    const { subjectId, gradeId, id } = question;
    let parentDom = document.getElementsByClassName(`${key}${id}`);

    if (key == "knowledge") {
      this.setState({
        knowledgeTreeLoading: true,
      });
      queryTree({
        subjectId,
        gradeId,
      })
        .then((response) => {
          if (response.ifLogin) {
            if (response.status) {
              this.setState({
                knowledgeTreeData: response.content,
              });
              if (parentDom) {
                setTimeout(() => {
                  parentDom[0]
                    ?.getElementsByClassName("ant-select-selection")[0]
                    .click();
                }, 150);
              }
            } else {
              message.error(response.message);
            }
          } else {
            loginRedirect();
          }
        })
        .finally(() => {
          this.setState({
            knowledgeTreeLoading: false,
          });
        });
    } else if (key == "chapter") {
      this.setState({
        chapterTreeLoading: true,
      });
      queryChapter({
        subjectId,
        gradeId,
        isSegmentation: true,
      })
        .then((response) => {
          if (response.ifLogin) {
            if (response.status) {
              this.setState({
                chapterTreeData: response.content,
              });
              if (parentDom) {
                setTimeout(() => {
                  parentDom[0]
                    ?.getElementsByClassName("ant-select-selection")[0]
                    .click();
                }, 150);
              }
            } else {
              message.error(response.message);
            }
          } else {
            loginRedirect();
          }
        })
        .finally(() => {
          this.setState({
            chapterTreeLoading: false,
          });
        });
    } else if (key == "indicator") {
      this.setState({
        indicatorTreeLoading: true,
      });
      let newTree1 = [];
      queryLabel({
        subjectId,
        gradeId,
        isSegmentation: true,
      })
        .then((response) => {
          if (response.ifLogin) {
            if (response.status) {
              if (response.content && response.content.length > 0) {
                newTree1 = JSON.parse(JSON.stringify(response.content));
                const handeData = (list) => {
                  if (list && list.length > 0) {
                    for (const threeItem of list) {
                      threeItem.value = `${threeItem.name}-${threeItem.pinyin || ""}-${threeItem.id}`;
                      threeItem.title = `${threeItem.name}`;
                      if (
                        threeItem.indicatorSon &&
                        threeItem.indicatorSon.length > 0
                      ) {
                        handeData(threeItem.indicatorSon);
                      }
                    }
                  }
                };
                handeData(newTree1);

                this.setState({
                  indicatorTreeData: newTree1,
                });

                if (parentDom) {
                  setTimeout(() => {
                    parentDom[0]
                      ?.getElementsByClassName("ant-select-selection")[0]
                      .click();
                  }, 150);
                }
              }
            } else {
              message.error(response.message);
            }
          } else {
            loginRedirect();
          }
        })
        .finally(() => {
          this.setState({
            indicatorTreeLoading: false,
          });
        });
    }
  };

  checkKnowledge = (checkedKeys) => {
    this.setState({
      checkKnowledgeIds: checkedKeys,
    });

    this.getPage({ knowledgeIds: checkedKeys });
  };

  knowledgeMultipleChange = (checked) => {
    this.setState({
      knowledgeMultiple: checked,
    });

    if (checked) {
      this.setState({
        knowledgeIds: [],
      });
    } else {
      this.setState({
        checkKnowledgeIds: [],
      });
    }

    this.getPage({ knowledgeIds: [], knowledgeMultiple: checked });
  };

  toggleSetMode = (value) => {
    this.setState({
      operationType: value,
      knowlegeMerge: value == 1,
      knowlegeIntersection: value == 2,
    });
    this.getPage({
      pageNo: 1,
    });
  };

  render() {
    let device = window.yg;
    const questionInputRouteItems = NEW_MY_QUESTION_INPUT_ROUTE_ITEMS;
    const basketCount = getNewMyQuestionBasketCount(this.props.basketList);

    return (
      <div className={styles.newMyQuestion}>
        <div className={styles.searchBar}>
          <StageSubjectButton
            stageSubjects={this.state.stageSubjects}
            onChange={(subject, stage) => {
              this.stageSubjectChange(subject, stage);
            }}
            subject={this.state.subject}
            stage={this.state.stage}
          />

          <QuestionTab onChange={this.questionSourceChange} />

          <span className={styles.inline} style={{ marginLeft: "auto" }}>
            <Search
              defaultValue={this.state.keyword}
              style={{ width: "220px" }}
              placeholder={trans(
                "newMyQuestion.searchQuestionPlaceholder",
                "输入关键词搜索题目",
              )}
              // onChange={this.changeValue}
              onSearch={this.searchQustion}
              loading={this.state.searchLoading}
            />
          </span>

          <div
            className={`${device == "ipad" ? styles.testPaperRecordingIpad : styles.testPaperRecording}`}
          >
            {this.props.currentUser && this.props.currentUser.loadXueKeWang ? (
              <span
                className={styles.buyCar}
                onClick={this.clickSubjectNetwork}
              >
                {trans("global.science", "去学科网组卷")}
              </span>
            ) : null}

            <Popover
              content={
                <Basket
                  count={basketCount}
                  dispatch={this.props.dispatch}
                  basketList={this.props.basketList}
                  basketSubjectId={this.props.basketSubjectId}
                  previewPathBuilder={(basketSubjectId) =>
                    buildNewMyQuestionPaperEditorPath(basketSubjectId)
                  }
                />
              }
              title={null}
              trigger="click"
            >
              <div className={styles.buyCar}>
                <Tooltip
                  placement="top"
                  title={trans("global.basketName", "试题篮")}
                  trigger={"hover"}
                >
                  <i className={`${styles.iconfont} ${styles.buyCarIcon}`}>
                    &#xe73c;
                  </i>
                  <span className={styles.count}>{basketCount}</span>
                  <span className={styles.split}>|</span>
                  {trans("global.gotoBasket", "去组卷")}
                </Tooltip>
              </div>
            </Popover>

            <Dropdown
              overlayClassName="inputStem"
              placement="bottomLeft"
              overlay={() => {
                return (
                  <Menu>
                    {questionInputRouteItems.map((item) => (
                      <Menu.Item key={item.key}>
                        <Link to={buildNewMyQuestionInputPath(item, this.id)}>
                          {trans(item.nameKey, item.text)}
                        </Link>
                      </Menu.Item>
                    ))}
                  </Menu>
                );
              }}
            >
              <div
                className={styles.entryTitle}
                onClick={(e) => e.preventDefault()}
              >
                {trans("global.inputStem", "录入题目")}
                <Icon style={{ marginLeft: "6px" }} type="down" />
              </div>
            </Dropdown>
          </div>
        </div>

        <div className={styles.content}>
          <KnowledgeChapterTree
            editionAndGradeData={this.state.editionAndGradeData} //年级和教材版本数据
            treeData={this.state.knTreeData} //知识点树数据
            chapterList={this.state.chTreeData} //章节树数据
            teachingMaterial={this.state.teachingMaterial} //教材版本
            textBoxGrade={this.state.selectGrade} //选中的年级
            onTextbookChange={(value) => {
              this.gradeAndTextbookChange(value, "textbook");
            }}
            onGradeChange={(value) => {
              this.gradeAndTextbookChange(value, "grade");
            }}
            searchVal={this.state.treeSearchVal} //过滤知识点的key
            knowledgeTreeSearch={this.knowledgeTreeSearch}
            knowlegeIntersection={false} //知识点是否交集
            knowlegeMerge={false} //知识点是否并集
            onKnExpand={this.knExpand} //知识点树展开事件
            onChExpand={this.chExpand} //章节树展开事件
            chExpandedKeys={this.state.chExpandedKeys} // 默认章节展开的树节点
            knExpandedKeys={this.state.knExpandedKeys} // 默认知识点展开的树节点
            onSelect={(selectedKeys, info, key) => {
              this.onTreeKnowledgeSelect(selectedKeys, info, key);
            }} //选中节点
            onCheck={(checkedKeys) => {
              this.checkKnowledge(checkedKeys);
            }}
            knowlegeIds={this.state.knowledgeIds}
            chapterIds={this.state.chapterIds}
            knowledgeMultipleChange={this.knowledgeMultipleChange}
            knowledgeMultiple={this.state.knowledgeMultiple}
            onTabChange={this.treeTypeChange}
            tabKey={this.state.tabKey}
            onToggleSetMode={this.toggleSetMode}
            operationType={this.state.operationType}
            checkKnowledgeids={this.state.checkKnowledgeIds}
          />

          <div className={styles.rightContent}>
            <SrarchForm
              onQuTypeChange={this.quTypeChange}
              businessQuestionTypeIds={this.state.businessQuestionTypeIds} //类型
              questionTypeGradeIds={getQuestionTypeFilterGradeIds(
                this.createQueryContext(),
              )}
              typeList={this.state.questionTypeOptions}
              onExamTypeChange={this.examTypeChange}
              examType={this.state.examType} //场景
              onQuLevelChange={(value) => {
                this.quLevelChange(value);
              }}
              levels={this.state.levels} //难度
              onYearChange={(value) => {
                this.yearChange(value);
              }}
              year={this.state.year} //年
              onGradeChange={(value) => {
                this.gradeChange(value);
              }}
              gradeIds={this.state.gradeIds} //年级
              onUserChange={(value) => {
                this.userChange(value);
              }}
              createUserId={this.state.createUserId} //收录人
              editionAndGradeData={this.state.editionAndGradeData} //年级和教材版本数据
              total={this.state.questionTotal || 0}
              tabKey={this.state.tabKey}
            />

            <div className={styles.tableWarp} id="tableWarp">
              <Spin spinning={this.state.loading}>
                <div
                  className={styles.questionMapList}
                  id="questionMapList"
                  style={{ position: "relative" }}
                >
                  {this.state.questionList &&
                  this.state.questionList.length > 0 ? (
                    this.state.questionList.map((item, index) => {
                      const listItemViewModel =
                        createNewMyQuestionListItemViewModel(
                          item,
                          index,
                          this.state.businessQuestionTypesById,
                          {
                            locale: getNewMyQuestionLocale(),
                          },
                        );
                      const answerDetailsVisible = Boolean(
                        this.state.answerDetailsVisibleById[
                          listItemViewModel.key
                        ],
                      );
                      const previewViewModel =
                        listItemViewModel.previewViewModel;

                      return (
                        <div
                          className={styles.listItem}
                          key={listItemViewModel.key}
                        >
                          <QuestionPreviewContent
                            showAnswerDetails={answerDetailsVisible}
                            viewModel={previewViewModel}
                          />
                          <div
                            className={styles.moduleBottom}
                            id={`bottom${previewViewModel.actionItem.id}`}
                          >
                            <QuestionBottomActions
                              answerDetailsVisible={answerDetailsVisible}
                              index={index}
                              item={previewViewModel.actionItem}
                              onCancelAdd={this.cancelAdd}
                              onDeleteQuestion={this.deleteQuestion}
                              onEditQuestion={this.editQuestion}
                              onShowTransLate={this.showTransLate}
                              onToggleAnswerDetails={() => {
                                this.toggleAnswerDetails(listItemViewModel.key);
                              }}
                              styles={styles}
                            />
                          </div>
                        </div>
                      );
                    })
                  ) : this.state.IconFont ? (
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
                        {questionInputRouteItems.map((item, index) => (
                          <Link
                            key={item.key}
                            style={{
                              color: "#0445fc",
                              cursor: "pointer",
                              marginRight:
                                index === questionInputRouteItems.length - 1
                                  ? 0
                                  : "1.875rem",
                            }}
                            to={buildNewMyQuestionInputPath(item)}
                          >
                            {trans(item.nameKey, item.text)}
                          </Link>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              </Spin>
            </div>
            <div className={styles.pagination}>
              <Pagination
                size="small"
                current={this.pageNo}
                pageSize={this.limit}
                pageSizeOptions={["50", "100", "150", "200"]}
                total={this.state.questionTotal || 0}
                onChange={this.changeNo}
                showSizeChanger
                showQuickJumper
                onShowSizeChange={this.onShowSizeChange}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default connect(({ home, global, inputQuestion }) => ({
  typeList: global.typeList,
  stageList: global.stageList,
  gradeList: global.gradeList,
  currentUser: global.currentUser,
  basketList: home.basketList,
  testSubject: home.testSubject,
  questionList: home.questionList,
  examTypeList: home.examTypeList,
  questionItem: home.questionItem,
  questionTotal: home.questionTotal,
  basketSubjectId: home.basketSubjectId,
  treeData: inputQuestion.treeData,
  subjectList: inputQuestion.subjectList,
  allGradeList: inputQuestion.allGradeList, //年级
  chapterList: inputQuestion.chapterList,
  labelList: inputQuestion.labelList,
}))(V2QuestionList);
