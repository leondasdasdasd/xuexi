import React, { Fragment, PureComponent } from "react";
import {
  Checkbox,
  Empty,
  Icon,
  Input,
  InputNumber,
  message,
  Modal,
  Popover,
  Select,
  Spin,
  Tooltip,
  Tree,
  TreeSelect,
} from "antd";
import { connect } from "dva";
import pathToRegexp, { compile, match } from "path-to-regexp";
import { v4 as uuidv4 } from "uuid";

import icon from "../../icon.module.less";
const { TreeNode } = Tree;
import MyButton from "components/MyButton";

import { trans } from "../../utils/i18n";
import { buildQuestionAssetInputCreatePath } from "../QuestionAssetInput/questionAssetInputRoute.js";

import styles from "./index.module.less";
const { Option } = Select;
const { Search, TextArea } = Input;
import SingleInput from "components/InputQuestion/SingleInput";

import ComnModal from "../../components/ComnModal";
import HoverTooltip from "../../components/HoverTooltip";
import { thisSemester } from "../../services/global";
import {
  queryChapter,
  queryLabel,
  queryTree,
} from "../../services/inputQuestion";
import { queryEnabledNewMyBusinessQuestionTypes } from "../../services/newMyQuestion";
import {
  createSegmentationPaper,
  querySegmentationCandidateQuestions,
  querySegmentationPaper,
  querySegmentationQuestionsByIds,
  recommendSegmentationQuestions,
  updateSegmentationPaper,
} from "../../services/segmentationPaperV2";
import { convertToChineseNumber, getCurrentTime } from "../../utils/utils";
const { SHOW_PARENT } = TreeSelect;
import { ensureSessionId } from "../../utils/sessionId";
import { mapGradeSubjectToTeachingContext } from "../../utils/teachingContextAdapter.js";
import {
  buildAssociationModalSearchContext,
  buildAssociationRecommendationTarget,
  buildAssociationResourcePatch,
  buildQuestionAssociationIdentityPatch,
} from "./associationResource.js";
import CandidateAnswerDetailsAction, {
  toggleAnswerDetailsVisibility,
} from "./CandidateAnswerDetailsAction";
import {
  combinationLeafAssociationCopy,
  getCombinationLeafRangeDescription,
} from "./combinationLeafAssociationCopy.js";
import {
  buildCombinationLeafAssociationPlan,
  collectCombinationLeafQuestions,
} from "./combinationQuestionTree.js";
import EditLockModal from "./editLockModal.jsx";
import FooterActions from "./footerActions.jsx";
import FormHeader from "./formHeader.jsx";
import Header from "./header.jsx";
import QuestionPlacementMoveActions from "./QuestionPlacementMoveActions";
import {
  buildQuestionNumber,
  buildQuestionPositionKey,
  buildSynchronizedQuestionScorePatch,
  clearQuestionChildren,
  flattenQuestionDescendants,
  getQuestionAtPath,
  hasQuestionChildren,
  removeQuestionAtPath,
  setQuestionTreeLeafScores,
  synchronizeQuestionTreeScores,
  updateQuestionFieldAtPath,
} from "./questionPosition.js";
import QuestionTypeBar from "./questionTypeBar.jsx";
import {
  applyModuleQuestionTypeTemplate,
  buildQuestionTypeContextKey,
  createEmptyTwoWayQuestion,
  findQuestionTypeByBusinessId,
  getBusinessQuestionTypeLabel,
  inheritTwoWayQuestionType,
  initializeModuleQuestionTypeTemplate,
  mapServerQuestionTypesToTwoWayOptions,
  shouldApplyQuestionTypeResponse,
  shouldReuseQuestionTypeRegistry,
} from "./questionTypeRegistry.js";
import ResourceQuestionTypeLabel from "./ResourceQuestionTypeLabel";
import {
  mapTwoWayViewToV2SegmentationPaperRequest,
  mapV2QuestionAggregatesWithRegistryToTwoWayViews,
  mapV2SegmentationPaperToTwoWayView,
} from "./segmentationPaperV2Adapter";
import TableHeader from "./tableHeader.jsx";
import {
  convertQualityDialogTreeData,
  convertQualityTreeData,
} from "./treeData.js";
import TwoWayQuestionPreview from "./TwoWayQuestionPreview";
import {
  ASSOCIATION_STRATEGY_TYPES,
  BLANK_ASSOCIATION_NUMBERING_MODE,
  buildAssociationStrategy,
  buildBlankAssociationStrategy,
  buildBlankAssociationTargetLabels,
  buildBlankSubquestionAssociationPatch,
  buildClearAssociatedChildrenPatch,
  buildCombinationQuestionAssociationPatch,
  buildQuestionAssociationStrategy,
  buildQuestionFromPreviousTemplate,
  buildQuestionPlacementUnits,
  buildVirtualAssociationPlan,
  canEditBlankAssociationField,
  changeVirtualAssociationMode,
  formatDecimalDisplay,
  getAssociationStrategyLabel,
  getCombinationChildDisplayLabel,
  getDefaultBlankAssociationNumberingMode,
  getLeafAssociationSourceId,
  getQuestionAssociationIds as getAssociationQuestionIds,
  getQuestionFillBlankParts,
  hasAssociatedQuestionInResizeRemovedRange,
  isAssociationFollowerQuestion,
  isValidModuleQuestionCount,
  MIN_MODULE_QUESTION_COUNT,
  moveQuestionPlacementUnit,
  normalizeExamSideSonQuestions,
  normalizeSaveSonQuestion,
  removeBlankSplitAssociationGroup,
  removeCombinationSplitAssociationGroup,
  resizeExamSideSonQuestions,
  sanitizeAssociationPayloadQuestion,
} from "./virtualAssociationGroups.js";

const ASSOCIATION_MODE_COPY_BY_VALUE = {
  "blank-compatible": {
    key: "paper.match.compatibility.blankCompatible",
    fallback: "关联空位",
  },
  "parent-child": {
    key: "paper.match.compatibility.parentChild",
    fallback: "关联子题",
  },
  "parent-only": {
    key: "paper.match.compatibility.parentOnly",
    fallback: "先生成子题",
  },
  single: {
    key: "paper.match.compatibility.single",
    fallback: "关联整题",
  },
};

let messageText = "";

let timeId = null;
const MIN_MODULE_QUESTION_COUNT_MESSAGE = trans(
  "twoWayTest.minimumSectionQuestionCount",
  "每个大题至少保留 1 个小题",
);

const createSessionId = () => {
  const browserCrypto = window.crypto;
  if (browserCrypto && typeof browserCrypto.randomUUID === "function") {
    return browserCrypto.randomUUID();
  }
  return uuidv4();
};

// 获取name ['1407', '问我', '问']
/**
 *
 * @param array
 */
function getName(array) {
  let list = array ? JSON.parse(JSON.stringify(array)) : [];
  let name = "";
  for (let index = 1; index < array.length; index++) {
    const item = list[index];
    name += index == 1 ? item : `-${item}`;
  }
  return name;
}

const getParentKey = (key, tree) => {
  let parentKey;
  for (const node of tree) {
    if (node.children) {
      if (node.children.some((item) => item.key === key)) {
        parentKey = node.key;
      } else if (getParentKey(key, node.children)) {
        parentKey = getParentKey(key, node.children);
      }
    }
  }
  return parentKey;
};

// 打平数组
const flattenTree = (tree, childKey = "children") => {
  const result = [];
  const flatten = (node) => {
    const { key, value } = node;
    result.push({ key, value });
    if (node[childKey] && Array.isArray(node[childKey])) {
      for (const child of node[childKey]) flatten(child);
    }
  };
  for (const rootNode of tree) flatten(rootNode);
  return result;
};

const initExpandedKeys = (threeData) => {
  let keys = [];
  /**
   *
   * @param node
   */
  function traverse(node) {
    if (node.children) {
      keys.push(node.key);
      for (const item of node.children) {
        traverse(item);
      }
    }
  }
  for (const item of threeData) {
    traverse(item);
  }
  return keys;
};

const loop = (data) => {
  return data.map((item) => {
    if (item.children) {
      return (
        <TreeNode
          key={item.key}
          title={<span id={item.key}>{item.title}</span>}
          titleStr={item.title}
        >
          {loop(item.children)}
        </TreeNode>
      );
    }
    return (
      <TreeNode
        key={item.key}
        title={<span id={item.key}>{item.title}</span>}
        titleStr={item.title}
      >
        {loop(item.children)}
      </TreeNode>
    );
  });
};

/**
 *
 * @param tree
 */
function handeTreeData(tree) {
  return tree.map((item) => ({
    ...item,
    value: item.key,
    searchKeyWord: item.value,
    children:
      item.children && item.children.length > 0
        ? handeTreeData(item.children)
        : null,
  }));
}

const scrollToDmoById = (id, scrollDom = "quAttributeTreeContent") => {
  let ele = document.getElementById(id);
  let scrollContainer = document.getElementById(scrollDom);
  console.log(ele, id, "ele");

  if (ele) {
    // 获取目标元素与滚动容器的边界
    const targetRect = ele.getBoundingClientRect();
    const containerRect = scrollContainer.getBoundingClientRect();
    // 计算目标 <span> 距离滚动容器顶部的距离
    let top = targetRect.top - containerRect.top;
    // 如果当前选中的题目属性(知识点 章节 素养 不在可视区域 则进行滚动)
    if (top > scrollContainer.offsetHeight) {
      ele.scrollIntoView();
    }
  }
};

var date = new Date();
var year = date.getFullYear();
var month = date.getMonth() + 1;
if (month < 7 || month === 7) {
  year -= 1;
}

const sourceTypeMap = {
  1: trans("global.Originalquestion", "原题"),
  2: trans("global.original", "原创"),
  3: trans("global.adapt", "改编"),
};

const questionLevelMap = {
  1: trans("global.easy", "简单"),
  2: trans("global.general", "普通"),
  3: trans("global.difficult", "困难"),
};

const difficulty = {
  1: trans("global.easy", "简单"),
  2: trans("global.general", "普通"),
  3: trans("global.difficult", "困难"),
};

/**
 *
 * @param data
 */
function convertTreeData(data) {
  return data && data.length > 0
    ? data.map((node) => {
        return {
          ...node,
          value: node.id,
          searchKey: node.value,
          children: node.children ? convertTreeData(node.children) : null,
        };
      })
    : [];
}

export class TwoWayTest extends PureComponent {
  constructor(properties) {
    super(properties);
    this.url = this.props.history.location.pathname;
    this.pathMatch = pathToRegexp("/twoWayTest/:id?").exec(this.url);
    this.testId = this.pathMatch[1] ? JSON.parse(this.pathMatch[1]) : null;
    this.savedPaperId = this.testId || properties.saveProps?.paperId || null;
    this.saveInFlight = false;
    this.saveQueued = false;
    this.queuedSaveCallback = null;
    this.isUnmounted = false;
    this.state = {
      delParentIndex: "",
      treeLoding: false,
      handelTheckedType: [],
      questionTypeList: [],
      candidateQuestions: [],
      answerDetailsVisibleByQuestionId: {},
      candidateQuestionTotal: 0,
      candidateQuestionTypes: [],
      candidateQuestionTypeContextKey: null,
      candidateQuestionTypeLoadError: null,
      candidateQuestionTypeLoading: false,
      v2BusinessQuestionTypes: [],
      enabledQuestionTypes: [],
      enabledQuestionTypeContextKey: null,
      questionTypeLoadError: null,
      questionTypeLoading: false,
      associatedQuestions: [],
      checkParent: null,
      checkChild: null,
      modalStatus: false,
      prentQuestionNum: null,
      IconFont: null,
      childenQuestionNum: null,
      knowledgeVisible: false,
      allChecked: false,
      gradeId: null,
      subjectId: null,
      questionType: null,
      type: null,
      subname: "",
      gradeName: "",
      titleValue: "",
      checkedKey: [],
      checkedChapter: [],
      isKnowLedge: false,
      isAttainment: false,
      isChapter: false,
      modalsubjectId: null,
      modalstageId: 0,
      // modalgradeId: null,
      isguanlian: false,
      searchValue: "",
      quoteQuestionIds: [],
      scrollTop: 0,
      childVisible: false,
      questionModalVisible: false,
      checkedQuality: [],
      sonQuestionIndex: null,
      selectedQuestionPath: null,
      // 查询条件的查询值
      searchQueLevelType: 0,
      searchGradeId: 0,
      searchRangeType: 2,
      searchQuestionType: 0,
      searchSelectChapterList: [],
      searchSelectKnowledgePointList: [],
      knowledgeTree: [],
      chapterThree: [],
      qualityData: [],
      modalQuestionType: "list",
      isExpand: true,
      originalQuestion: null,
      tableLoding: true,
      expandedKeys: [],
      searchQuValue: "",
      chapterTreeList: [],
      editLockModalVisible: false,
      combinationAssociationVisible: false,
      combinationAssociationSource: null,
      combinationAssociationEndNo: null,
      blankAssociationVisible: false,
      blankAssociationSource: null,
      blankAssociationEndNo: null,
      blankAssociationNumberingMode:
        BLANK_ASSOCIATION_NUMBERING_MODE.continuous,
      // sonQuestionNum: null
    };

    this.child = null;
    this.page = 1;
    this.getCardStatus = true;
    this.candidateQuestionTypeRequestVersion = 0;
    this.questionTypeRequestVersion = 0;
  }

  UNSAFE_componentWillMount() {
    this.initSessionId();
  }

  componentDidMount() {
    window.parent.postMessage("padding", "*");
    this.getBaseExamNmae();
    const IconFonts = Icon.createFromIconfontCN({
      scriptUrl: "//at.alicdn.com/t/font_789461_ovr9ifg67hb.js",
    });
    this.setState({
      IconFont: IconFonts,
    });

    this.props.dispatch({
      type: "inputQuestion/getAllGradeList",
      onSuccess: this.testId
        ? (response) => this.getDetail(response?.content || [])
        : undefined,
    });

    this.props.dispatch({
      type: "global/getTypeList",
    });

    if (this.testId) {
      this.tryAcquireEditLock();
    } else {
      this.startAutoSave();
    }
  }

  componentDidUpdate(previousProperties, previousState) {
    if (
      previousState.gradeId !== this.state.gradeId ||
      previousState.subjectId !== this.state.subjectId ||
      previousProperties.allGradeList !== this.props.allGradeList
    ) {
      this.loadEnabledQuestionTypes();
    }
  }

  fetchQuestionTypeRegistry = async (teachingContext) => {
    const response =
      await queryEnabledNewMyBusinessQuestionTypes(teachingContext);
    if (!response?.status) {
      throw new Error("QUESTION_TYPE_REGISTRY_LOAD_FAILED");
    }

    return {
      contextKey: buildQuestionTypeContextKey(teachingContext),
      enabledQuestionTypes: mapServerQuestionTypesToTwoWayOptions(
        response.content || [],
      ),
      rawQuestionTypes: response.content || [],
    };
  };

  loadEnabledQuestionTypes = async (teachingContextOverride) => {
    const teachingContext =
      teachingContextOverride ||
      mapGradeSubjectToTeachingContext(
        this.props.allGradeList,
        this.state.gradeId,
        this.state.subjectId,
      );
    if (!teachingContext) {
      this.setState({
        enabledQuestionTypes: [],
        enabledQuestionTypeContextKey: null,
        questionTypeLoadError: null,
        questionTypeLoading: false,
      });
      return;
    }
    const contextKey = buildQuestionTypeContextKey(teachingContext);
    if (
      shouldReuseQuestionTypeRegistry({
        loadedContextKey: this.state.enabledQuestionTypeContextKey,
        loading: this.state.questionTypeLoading,
        loadError: this.state.questionTypeLoadError,
        requestedContextKey: contextKey,
      })
    ) {
      return {
        contextKey,
        enabledQuestionTypes: this.state.enabledQuestionTypes,
        rawQuestionTypes: this.state.v2BusinessQuestionTypes,
      };
    }
    const requestVersion = ++this.questionTypeRequestVersion;
    this.setState({
      enabledQuestionTypes: [],
      enabledQuestionTypeContextKey: null,
      questionTypeLoadError: null,
      questionTypeLoading: true,
    });
    try {
      const registry = await this.fetchQuestionTypeRegistry(teachingContext);
      const currentTeachingContext =
        teachingContextOverride ||
        mapGradeSubjectToTeachingContext(
          this.props.allGradeList,
          this.state.gradeId,
          this.state.subjectId,
        );
      const currentContextKey = currentTeachingContext
        ? buildQuestionTypeContextKey(currentTeachingContext)
        : null;
      if (
        !shouldApplyQuestionTypeResponse({
          currentContextKey,
          currentRequestVersion: this.questionTypeRequestVersion,
          requestContextKey: contextKey,
          requestVersion,
        })
      ) {
        return;
      }
      const selectedQuestionTypeStillAvailable = Boolean(
        findQuestionTypeByBusinessId(
          registry.enabledQuestionTypes,
          this.state.searchQuestionType,
        ),
      );
      this.setState({
        enabledQuestionTypes: registry.enabledQuestionTypes,
        enabledQuestionTypeContextKey: registry.contextKey,
        questionTypeLoadError: null,
        questionTypeLoading: false,
        searchQuestionType: selectedQuestionTypeStillAvailable
          ? this.state.searchQuestionType
          : 0,
        v2BusinessQuestionTypes: registry.rawQuestionTypes,
      });
      return registry;
    } catch {
      if (requestVersion !== this.questionTypeRequestVersion) return;
      this.setState({
        questionTypeLoadError: trans(
          "twoWayTest.questionTypesLoadFailed",
          "题型加载失败，请重试",
        ),
        questionTypeLoading: false,
      });
    }
  };

  retryQuestionTypeRegistry = () => this.loadEnabledQuestionTypes();

  loadCandidateQuestionTypes = async (gradeId = this.state.searchGradeId) => {
    const requestVersion = ++this.candidateQuestionTypeRequestVersion;
    const teachingContext = mapGradeSubjectToTeachingContext(
      this.props.allGradeList,
      gradeId,
      this.state.subjectId,
    );
    if (!teachingContext) {
      this.setState({
        candidateQuestionTypes: [],
        candidateQuestionTypeContextKey: null,
        candidateQuestionTypeLoadError: null,
        candidateQuestionTypeLoading: false,
      });
      return;
    }

    const contextKey = buildQuestionTypeContextKey(teachingContext);
    this.setState({
      candidateQuestionTypes: [],
      candidateQuestionTypeContextKey: null,
      candidateQuestionTypeLoadError: null,
      candidateQuestionTypeLoading: true,
    });
    try {
      const registry = await this.fetchQuestionTypeRegistry(teachingContext);
      const currentTeachingContext = mapGradeSubjectToTeachingContext(
        this.props.allGradeList,
        this.state.searchGradeId,
        this.state.subjectId,
      );
      const currentContextKey = currentTeachingContext
        ? buildQuestionTypeContextKey(currentTeachingContext)
        : null;
      if (
        !shouldApplyQuestionTypeResponse({
          currentContextKey,
          currentRequestVersion: this.candidateQuestionTypeRequestVersion,
          requestContextKey: contextKey,
          requestVersion,
        })
      ) {
        return;
      }
      this.setState({
        candidateQuestionTypes: registry.enabledQuestionTypes,
        candidateQuestionTypeContextKey: registry.contextKey,
        candidateQuestionTypeLoadError: null,
        candidateQuestionTypeLoading: false,
      });
    } catch {
      if (requestVersion !== this.candidateQuestionTypeRequestVersion) return;
      const errorMessage = trans(
        "twoWayTest.questionTypesLoadFailed",
        "题型加载失败，请重试",
      );
      this.setState({
        candidateQuestionTypes: [],
        candidateQuestionTypeContextKey: null,
        candidateQuestionTypeLoadError: errorMessage,
        candidateQuestionTypeLoading: false,
      });
      message.error(errorMessage);
    }
  };

  componentWillUnmount() {
    this.isUnmounted = true;
    if (timeId) {
      clearInterval(timeId);
    }
    if (this.testId) {
      this.getLock({
        paperId: this.testId,
        tabId: sessionStorage.getItem("sessionId"),
        query: true,
        duration: 1,
      });
    }
  }

  initSessionId = () => {
    // 初始化sessionId 1
    ensureSessionId();
  };

  /* 获取锁 */
  async tryAcquireEditLock() {
    // 是否是老 session（决定是否需要抢锁）

    // 调用接口
    const response = await this.getLock({
      paperId: this.testId,
      tabId: sessionStorage.getItem("sessionId"),
      query: true,
    });

    // 处理锁
    this.handleEditLock(response, {
      onStartEdit: () => {
        this.startAutoSave();
      },
      onShowModal: (message_) => {
        messageText = message_;
        this.setState({
          editLockModalVisible: true,
        });
      },
      onError: (message_) => {
        message.error(message_);
      },
    });
  }

  getDetail = async (gradeList = this.props.allGradeList) => {
    const detailResponse = await querySegmentationPaper(this.testId);
    if (!detailResponse?.status) {
      message.error(detailResponse?.message);
      return;
    }
    const teachingContext = mapGradeSubjectToTeachingContext(
      gradeList,
      detailResponse.content.gradeId,
      detailResponse.content.subjectId,
    );
    if (!teachingContext) {
      message.error(
        trans(
          "twoWayTest.questionTypeContextUnavailable",
          "无法确定细目表题型上下文",
        ),
      );
      return;
    }
    const registry = await this.loadEnabledQuestionTypes(teachingContext);
    if (!registry) return;
    const businessQuestionTypes = registry.rawQuestionTypes;
    const legacyTypeIdByBusinessId = Object.fromEntries(
      businessQuestionTypes.map((item) => [
        item.businessQuestionTypeId,
        item.legacyTypeId,
      ]),
    );
    const segementDetail = mapV2SegmentationPaperToTwoWayView(
      detailResponse.content,
      legacyTypeIdByBusinessId,
    );
    console.log(segementDetail, "segementDetail");

    let newList = JSON.parse(JSON.stringify(segementDetail));

    this.props
      .dispatch({
        type: "global/getSubject",
        payload: {
          gradeId: segementDetail.gradeId,
        },
      })
      .then(async () => {
        // 公共方法：格式化 ids
        const formatIds = (ids) =>
          ids && ids.length > 0 ? ids.map(String) : [];

        // 公共方法：根据 id 排序 names
        const sortNamesByIds = (ids, values) => {
          if (!ids || ids.length === 0 || !values || values.length === 0)
            return [];
          return (
            ids
              .map((id) =>
                values.find(
                  (value) => Number.parseInt(value.split("-")[0]) == id,
                ),
              )
              // ["1407-问我-问"] , ["20282-补全对话", "20284-其它（教材同步资料）"]
              .map((item) => getName(item.split("-")))
          );
        };

        // 公共方法：处理子题
        const processSonQuestions = (sonList, parentType) => {
          for (const son of sonList) {
            son.indicatorIds = formatIds(son.indicatorIds);
            son.knowledgeIds = formatIds(son.knowledgeIds);
            son.chapterId = formatIds(son.chapterId);

            son.indicatorName = sortNamesByIds(
              son.indicatorIds,
              son.indicatorValues,
            );
            son.knowledge = sortNamesByIds(
              son.knowledgeIds,
              son.knowledgeValues,
            );
            son.chapterName = sortNamesByIds(son.chapterId, son.chapterValues);

            son.type = parentType;
          }
        };

        // 主体处理
        if (newList.moduleModelList && newList.moduleModelList.length > 0) {
          for (const module of newList.moduleModelList) {
            if (module.questionList && module.questionList.length > 0) {
              module.questionNum = module.questionList.length;

              for (const question of module.questionList) {
                question.indicatorIds = formatIds(question.indicatorIds);
                question.knowledgeIds = formatIds(question.knowledgeIds);
                question.chapterId = formatIds(question.chapterId);

                question.indicatorName = sortNamesByIds(
                  question.indicatorIds,
                  question.indicatorValues,
                );
                question.knowledge = sortNamesByIds(
                  question.knowledgeIds,
                  question.knowledgeValues,
                );
                question.chapterName = sortNamesByIds(
                  question.chapterId,
                  question.chapterValues,
                );

                if (Array.isArray(question.sonQuestionList)) {
                  processSonQuestions(question.sonQuestionList, question.type);
                }
              }
            }
          }
        }

        const detailQuestionTypeOptions = mapServerQuestionTypesToTwoWayOptions(
          businessQuestionTypes,
        );
        const hydratedQuestionTypeList = (
          await this.hydrateAssociationStrategies(
            newList.moduleModelList,
            businessQuestionTypes,
          )
        ).map((module) =>
          initializeModuleQuestionTypeTemplate(
            module,
            detailQuestionTypeOptions,
          ),
        );

        this.setState({
          subjectId: segementDetail.subjectId,
          gradeId: segementDetail.gradeId,
          modalsubjectId: segementDetail.subjectId,
          searchGradeId: segementDetail.gradeId,
          type: segementDetail.type,
          titleValue: segementDetail.title,
          questionTypeList: hydratedQuestionTypeList,
          enabledQuestionTypes: registry.enabledQuestionTypes,
          enabledQuestionTypeContextKey: registry.contextKey,
          v2BusinessQuestionTypes: registry.rawQuestionTypes,
        });
      });
  };

  /*
  @param paperId 细目表id
  @param tabId 页面的唯一标识id
  @param query 为 true 是查询，为false是抢锁
  */

  getLock = (payload) => {
    return this.props.dispatch({
      type: "paper/paperCanEdit",
      payload: payload,
    });
  };

  confirmEditLockModal = async () => {
    this.setState({
      editLockModalVisible: false,
    });

    let response = await this.getLock({
      paperId: this.testId,
      tabId: sessionStorage.getItem("sessionId"),
      query: false,
    });

    this.handleEditLock(response, {
      onStartEdit: () => {
        this.getDetail();
        this.startAutoSave();
      },
      onError: (message_) => {
        message.error(message_);
      },
    });
  };

  closeEditLockModal = () => {
    this.setState({
      editLockModalVisible: false,
      maskVisible: true,
    });
  };

  /**
   * @param {*} response  — 后端返回的数据
   * @param {*} callbacks — 一组回调函数（解耦组件内部逻辑）
   */
  handleEditLock = (response, callbacks) => {
    const {
      onStartEdit, // 获取编辑权限成功时调用
      onShowModal, // 显示弹窗 modal(text)
      onError, // 错误处理
    } = callbacks;

    if (!response || !response.status) {
      return onError?.(
        trans(
          "twoWay.editLock.acquireFailed",
          "获取编辑权限失败，请稍后重试！",
        ),
      );
    }

    const { type, currentUserName } = response.content;

    switch (type) {
      case 1: {
        // 没有人编辑
        onStartEdit?.();
        break;
      }
      case 2: // 有其他人在编辑
      case 3: // 自己在其他页面编辑
      case 4: {
        // 有其他人在编辑，自己是历史编辑者
        const messageTextMap = {
          2: trans(
            "twoWay.editLock.otherUserEditingOverwriteConfirm",
            "{$name} 正在编辑，你的编辑会覆盖TA的内容，确认要开始编辑吗?",
            {
              name: currentUserName,
            },
          ),
          3: trans(
            "twoWay.editLock.sameAccountEditingConfirm",
            "你的账号当前正在另一台设备或其他页面上编辑，确认要开始编辑吗?",
          ),
          4: trans(
            "twoWay.editLock.reacquireFromUserConfirm",
            "{$name} 正在编辑，确认要重新获得编辑权限吗?",
            {
              name: currentUserName,
            },
          ),
        };
        onShowModal?.(messageTextMap[type]);
        break;
      }

      case 5: {
        //自己在自己窗口编辑 (刷新当前窗口)
        onStartEdit?.();
        break;
      }
      case 6: {
        // 抢锁成功
        onStartEdit?.();
        break;
      }
      default: {
        onError?.(
          trans(
            "twoWay.editLock.acquireFailed",
            "获取编辑权限失败，请稍后重试！",
          ),
        );
      }
    }
  };

  getBaseExamNmae = () => {
    thisSemester().then((res) => {
      if (res.status) {
        this.setState({
          baseExamNmae: res.content,
        });
        return;
      }
      message.error(res.message);
    });
  };

  startAutoSave = () => {
    if (timeId) {
      clearInterval(timeId);
    }
    timeId = setInterval(() => {
      if (
        this.state.questionTypeList &&
        this.state.questionTypeList.length > 0 &&
        this.state.subjectId != undefined &&
        this.state.gradeId != undefined &&
        this.state.type != undefined
      ) {
        this.save();
      }
    }, 5000);
  };

  questionNumerChange = (index, e) => {
    const value = Number(e.target.value);
    if (!isValidModuleQuestionCount(value)) {
      message.error(MIN_MODULE_QUESTION_COUNT_MESSAGE);
      return;
    }

    let newList = JSON.parse(JSON.stringify(this.state.questionTypeList));
    // 当前选中的题目
    let targetModal = newList[index];
    let qusLength = targetModal.questionList.length;

    if (value > qusLength) {
      targetModal.questionNum = value;
      const lastQuestion = targetModal.questionList[qusLength - 1];
      const questionTypeTemplate = targetModal.questionTypeTemplate;
      if (!questionTypeTemplate?.businessQuestionTypeId) {
        message.error(
          trans(
            "twoWayTest.firstQuestionTypeMissing",
            "当前大题首题缺少业务题型，无法增加题数",
          ),
        );
        return;
      }
      for (let index_ = qusLength; index_ < value; index_++) {
        targetModal.questionList.push(
          applyModuleQuestionTypeTemplate(
            buildQuestionFromPreviousTemplate(lastQuestion),
            targetModal,
          ),
        );
      }
    } else if (value < qusLength) {
      if (
        hasAssociatedQuestionInResizeRemovedRange(
          targetModal.questionList,
          value,
        )
      ) {
        message.error(
          trans(
            "twoWay.association.resizeAssociatedRangeBlocked",
            "删减范围内存在已关联题目，请先取消关联后再调整题数",
          ),
        );
        return;
      }

      targetModal.questionList.splice(value, qusLength - value);
      targetModal.questionNum = value;
    } else {
      targetModal.questionNum = value;
    }
    this.setState({
      questionTypeList: newList,
    });
  };

  changeScoreLength = (value) => {
    const parentQuestion =
      this.state.questionTypeList?.[this.state.checkParent]?.questionList?.[
        this.state.checkChild
      ];
    const newList = resizeExamSideSonQuestions({
      parentType: parentQuestion?.type,
      sonQuestions: this.state.modalSonQuestionsData,
      targetCount: value,
    }).map((question) => inheritTwoWayQuestionType(question, parentQuestion));

    this.setState({
      modalSonQuestionsData: newList,
    });
  };

  changeScore = (index, value) => {
    let newList = JSON.parse(JSON.stringify(this.state.modalSonQuestionsData));
    newList[index].questionScore = value;
    this.setState({
      modalSonQuestionsData: newList,
    });
  };

  buildQuestionAssociationPlan = (
    targetQuestion,
    sourceQuestion,
    index,
    ind,
  ) => {
    const normalizedSourceQuestion = Array.isArray(sourceQuestion)
      ? sourceQuestion[0]
      : sourceQuestion;

    if (!targetQuestion || !normalizedSourceQuestion) {
      return null;
    }

    const sourceQuestionLabel = String(
      normalizedSourceQuestion?.questionSerialNumber ||
        normalizedSourceQuestion?.questionSort ||
        normalizedSourceQuestion?.displayQuestionNumber ||
        normalizedSourceQuestion?.questionNo ||
        normalizedSourceQuestion?.index ||
        normalizedSourceQuestion?.id ||
        trans("twoWay.association.sourceQuestionFallback", "源题"),
    );

    const targetQuestionLabel = String(
      targetQuestion?.questionSerialNumber ||
        targetQuestion?.index ||
        this.renderNo(index, ind),
    );

    return buildVirtualAssociationPlan({
      targetQuestion,
      sourceQuestion: normalizedSourceQuestion,
      targetQuestionLabel,
      sourceQuestionLabel,
    });
  };

  refreshAssociationPlanForQuestion = (question, index, ind) => {
    if (!question?.associationSourceSnapshot) {
      return question;
    }

    question.virtualAssociation = this.buildQuestionAssociationPlan(
      question,
      question.associationSourceSnapshot,
      index,
      ind,
    );

    return question;
  };

  isSameQuestionId = (left, right) =>
    left != undefined && right != undefined && String(left) === String(right);

  getAssociationSourceId = (question) =>
    getLeafAssociationSourceId(question) || question?.questionId;

  getQuestionAssociationIds = (question) => getAssociationQuestionIds(question);

  getSourceAssociationIds = (sourceQuestion, sourceQuestionId) => {
    const ids = [sourceQuestionId];
    const children = this.getCombinationChildren(sourceQuestion);

    for (const childQuestion of children) {
      const childQuestionId = this.getQuestionId(childQuestion);

      if (childQuestionId != undefined) {
        ids.push(childQuestionId);
      }
    }

    return ids.filter((id) => id != undefined);
  };

  setQuestionAssociation = (
    question,
    questionId,
    associationStrategy = null,
  ) => {
    Object.assign(
      question,
      buildQuestionAssociationIdentityPatch(questionId, associationStrategy),
    );
    delete question.associationCompatibility;
    delete question.blankSplitAssociation;
    delete question.combinationSplitAssociation;
    delete question.associationList;
  };

  isCompatibilityFollowerQuestion = (question, options) => {
    return isAssociationFollowerQuestion(question, options);
  };

  isAssociationAttributeEditBlocked = (question, fieldName, options) =>
    this.isCompatibilityFollowerQuestion(question, options) &&
    !canEditBlankAssociationField(question, fieldName);

  clearQuestionAssociationBySource = (
    question,
    sourceQuestionId,
    sourceQuestion = null,
    includeChildQuestionIds = true,
  ) => {
    if (!question || sourceQuestionId == undefined) {
      return false;
    }

    const sourceIds = includeChildQuestionIds
      ? this.getSourceAssociationIds(sourceQuestion, sourceQuestionId)
      : [sourceQuestionId];
    const hasAssociation = sourceIds.some((id) =>
      this.isSameQuestionId(question.questionId, id),
    );
    const sourceMatched = this.isSameQuestionId(
      getLeafAssociationSourceId(question),
      sourceQuestionId,
    );

    if (!hasAssociation && !sourceMatched) {
      return false;
    }

    question.questionId = null;
    question.associationStrategy = null;
    delete question.associationList;
    question.associationSourceSnapshot = null;
    delete question.associationCompatibility;
    delete question.blankSplitAssociation;
    delete question.combinationSplitAssociation;
    question.virtualAssociation = null;
    question.checked = false;

    return true;
  };

  releaseQuestionAssociationsBySource = (
    questionTypeList,
    sourceQuestionId,
    exceptPosition,
    sourceQuestion = null,
    includeChildQuestionIds = true,
  ) => {
    let releaseCount = 0;

    for (const [moduleIndex, moduleItem] of questionTypeList.entries()) {
      if (!moduleItem.questionList) {
        continue;
      }

      for (const [
        questionIndex,
        question,
      ] of moduleItem.questionList.entries()) {
        if (
          exceptPosition &&
          exceptPosition.moduleIndex === moduleIndex &&
          exceptPosition.questionIndex === questionIndex
        ) {
          continue;
        }

        if (
          this.clearQuestionAssociationBySource(
            question,
            sourceQuestionId,
            sourceQuestion,
            includeChildQuestionIds,
          )
        ) {
          releaseCount += 1;
        }
      }
    }

    return releaseCount;
  };

  mapV2QuestionAggregatesToViews = (aggregates, businessQuestionTypes) => {
    const result = mapV2QuestionAggregatesWithRegistryToTwoWayViews(
      aggregates,
      businessQuestionTypes,
    );
    if (result.missingBusinessQuestionTypeIds.length > 0) {
      const missingIds = result.missingBusinessQuestionTypeIds.join(", ");
      message.error(
        trans(
          "twoWayTest.businessQuestionTypesMissing",
          "题型列表缺少业务题型 {$ids}",
          { ids: missingIds },
        ),
      );
      return null;
    }
    return result.views;
  };

  loadV2QuestionViewsByIds = async (questionIds, businessQuestionTypes) => {
    if (!questionIds || questionIds.length === 0) return [];
    const response = await querySegmentationQuestionsByIds(questionIds);
    if (!response?.status) {
      message.error(response?.message);
      return [];
    }
    const aggregates = response.content.items || [];
    return (
      this.mapV2QuestionAggregatesToViews(aggregates, businessQuestionTypes) ||
      []
    );
  };

  hydrateAssociationStrategies = async (
    questionTypeList,
    businessQuestionTypes,
  ) => {
    const associationIds = [];

    for (const moduleItem of questionTypeList) {
      if (moduleItem.questionList)
        for (const question of moduleItem.questionList) {
          const questionAssociationIds =
            this.getQuestionAssociationIds(question);

          if (questionAssociationIds.length > 0) {
            associationIds.push(questionAssociationIds[0]);
          }
        }
    }

    if (associationIds.length === 0) {
      return questionTypeList;
    }

    const sourceQuestions = await this.loadV2QuestionViewsByIds(
      associationIds,
      businessQuestionTypes,
    );
    if (sourceQuestions.length === 0) {
      return questionTypeList;
    }

    const sourceQuestionMap = sourceQuestions.reduce(
      (result, sourceQuestion) => {
        const sourceQuestionId =
          sourceQuestion?.questionId || sourceQuestion?.id;

        if (sourceQuestionId) {
          result[sourceQuestionId] = sourceQuestion;
        }

        return result;
      },
      {},
    );

    return questionTypeList.map((moduleItem, moduleIndex) => ({
      ...moduleItem,
      questionList: moduleItem.questionList?.map((question, questionIndex) => {
        const associationId = this.getQuestionAssociationIds(question)[0];
        const sourceQuestion = sourceQuestionMap[associationId];

        if (!associationId || !sourceQuestion) {
          return question;
        }

        return {
          ...question,
          associationSourceSnapshot: sourceQuestion,
          virtualAssociation: this.buildQuestionAssociationPlan(
            question,
            sourceQuestion,
            moduleIndex,
            questionIndex,
          ),
        };
      }),
    }));
  };

  batchScore = (index, value) => {
    let newList = JSON.parse(JSON.stringify(this.state.questionTypeList));
    if (newList[index].questionList && newList[index].questionList.length > 0) {
      newList[index].questionList = newList[index].questionList.map((it) =>
        this.isCompatibilityFollowerQuestion(it)
          ? it
          : setQuestionTreeLeafScores(
              it,
              value,
              (question) =>
                !this.isCompatibilityFollowerQuestion(question, {
                  includeFirstBlank: true,
                }),
            ),
      );
    }
    this.setState({
      questionTypeList: newList,
    });
  };

  batchDifficult = (typeSource, value, extra) => {
    let newList = JSON.parse(JSON.stringify(this.state.questionTypeList));

    let labelList = [];
    let valueList = [];

    if (
      typeSource == "knowledge" ||
      typeSource == "chapter" ||
      typeSource == "quality"
    ) {
      labelList = value.map((item) => item.label);
      valueList = value.map((item) => item.value);
    }

    const updateItem = (item, options) => {
      if (!item.checked || this.isCompatibilityFollowerQuestion(item, options))
        return;

      switch (typeSource) {
        case "knowledge": {
          item.knowledge = labelList;
          item.knowledgeIds = valueList;

          break;
        }
        case "chapter": {
          item.chapterName = labelList;
          item.chapterId = valueList;

          break;
        }
        case "quality": {
          item.indicatorName = labelList;
          item.indicatorIds = valueList;

          break;
        }
        default: {
          item[typeSource] = value;
        }
      }
    };

    for (const item of newList) {
      if (item.questionList)
        for (const it of item.questionList) {
          updateItem(it);

          if (it.sonQuestionList)
            for (const sonQu of it.sonQuestionList) {
              updateItem(sonQu, { includeFirstBlank: true });
            }
        }
    }

    this.setState({
      questionTypeList: newList,
    });
  };

  delParent = (index) => {
    this.setState({
      questionModalVisible: true,
      delParentIndex: index,
    });
  };

  delChild = (index, ind) => {
    let newList = JSON.parse(JSON.stringify(this.state.questionTypeList));
    const target = newList[index]?.questionList[ind];

    if (!target || this.isCompatibilityFollowerQuestion(target)) {
      return;
    }

    if (target.associationStrategy?.type === ASSOCIATION_STRATEGY_TYPES.leaf) {
      const nextList = removeCombinationSplitAssociationGroup(newList, target, {
        moduleIndex: index,
        questionIndex: ind,
      });
      if (!isValidModuleQuestionCount(nextList[index]?.questionList?.length)) {
        message.error(MIN_MODULE_QUESTION_COUNT_MESSAGE);
        return;
      }

      this.setState({
        questionTypeList: nextList,
      });
      return;
    }

    if (target.associationStrategy?.type === ASSOCIATION_STRATEGY_TYPES.blank) {
      const nextList = removeBlankSplitAssociationGroup(newList, target, {
        moduleIndex: index,
        questionIndex: ind,
      });
      if (!isValidModuleQuestionCount(nextList[index]?.questionList?.length)) {
        message.error(MIN_MODULE_QUESTION_COUNT_MESSAGE);
        return;
      }

      this.setState({
        questionTypeList: nextList,
      });
      return;
    }

    if (!isValidModuleQuestionCount(newList[index].questionList.length - 1)) {
      message.error(MIN_MODULE_QUESTION_COUNT_MESSAGE);
      return;
    }

    newList[index].questionList.splice(ind, 1);
    newList[index].questionNum = newList[index].questionList.length;
    this.setState({
      questionTypeList: newList,
    });
  };

  delDescendantQuestion = (moduleIndex, rootQuestionIndex, questionPath) => {
    const newList = JSON.parse(JSON.stringify(this.state.questionTypeList));
    const rootQuestion =
      newList[moduleIndex]?.questionList?.[rootQuestionIndex];
    const target = getQuestionAtPath(
      rootQuestion?.sonQuestionList,
      questionPath,
    );
    if (
      !rootQuestion ||
      !target ||
      this.isCompatibilityFollowerQuestion(target, { includeFirstBlank: true })
    ) {
      return;
    }

    const [synchronizedRootQuestion] = removeQuestionAtPath(
      [rootQuestion],
      [0, ...questionPath],
    );
    newList[moduleIndex].questionList[rootQuestionIndex] =
      synchronizedRootQuestion;
    this.refreshAssociationPlanForQuestion(
      synchronizedRootQuestion,
      moduleIndex,
      rootQuestionIndex,
    );
    this.setState({
      questionTypeList: newList,
      selectedQuestionPath: null,
    });
  };

  changeDescendantField = (
    moduleIndex,
    rootQuestionIndex,
    questionPath,
    fieldName,
    value,
  ) => {
    const newList = JSON.parse(JSON.stringify(this.state.questionTypeList));
    const rootQuestion =
      newList[moduleIndex]?.questionList?.[rootQuestionIndex];
    const target = getQuestionAtPath(
      rootQuestion?.sonQuestionList,
      questionPath,
    );
    if (
      !target ||
      this.isAssociationAttributeEditBlocked(target, fieldName, {
        includeFirstBlank: true,
      })
    ) {
      return;
    }

    rootQuestion.sonQuestionList = updateQuestionFieldAtPath(
      rootQuestion.sonQuestionList,
      questionPath,
      fieldName,
      value,
    );
    if (fieldName === "questionScore") {
      Object.assign(
        rootQuestion,
        buildSynchronizedQuestionScorePatch(rootQuestion),
      );
    }
    this.setState({ questionTypeList: newList });
  };

  selectDescendantQuestion = (moduleIndex, rootQuestionIndex, questionPath) => {
    this.setState({
      checkParent: moduleIndex,
      checkChild: rootQuestionIndex,
      selectedQuestionPath: questionPath,
      sonQuestionIndex: questionPath.length === 1 ? questionPath[0] : null,
    });
  };

  isDescendantQuestionSelected = (
    moduleIndex,
    rootQuestionIndex,
    questionPath,
  ) =>
    this.state.checkParent == moduleIndex &&
    this.state.checkChild == rootQuestionIndex &&
    JSON.stringify(this.state.selectedQuestionPath) ===
      JSON.stringify(questionPath);

  renderAllScore = (index) => {
    let score = null;
    let newList = JSON.parse(JSON.stringify(this.state.questionTypeList));
    let newItem = newList[index];
    if (newItem.questionList && newItem.questionList.length > 0) {
      newItem.questionList.map((it) => {
        score += it.questionScore || 0;
      });
    }
    return score;
  };

  getBindableQuestions = async () => {
    this.setState({
      tableLoding: true,
    });
    let questionIds = [];
    if (this.props.deleteList && this.props.deleteList.length > 0) {
      this.props.deleteList.map((item) => {
        questionIds.push(item.questionId);
      });
    }

    const {
      searchQueLevelType,
      searchGradeId,
      searchSelectChapterList,
      searchSelectKnowledgePointList,
      searchQuestionType,
    } = this.state;
    const payload = {
      keyword: this.state.searchValue,
      pageNo: this.page,
      limit: 10,
      gradeIds: searchGradeId == 0 ? [] : [searchGradeId],
      subjectIds: this.state.modalsubjectId ? [this.state.modalsubjectId] : [],
      businessQuestionTypeIds: searchQuestionType ? [searchQuestionType] : [],
      levels: searchQueLevelType ? [searchQueLevelType] : [],
      chapterIds: searchSelectChapterList, //章节
      knowledgeIds: searchSelectKnowledgePointList,
    };

    let bindQuestionIds = [];
    for (const modal of this.state.questionTypeList) {
      if (modal.questionList && modal.questionList.length > 0) {
        for (const item of modal.questionList) {
          if (item.questionId) {
            bindQuestionIds = [...bindQuestionIds, item.questionId];
          }
          if (
            item.personalityQuestions &&
            item.personalityQuestions.length > 0
          ) {
            bindQuestionIds = [
              ...bindQuestionIds,
              ...item.personalityQuestions,
            ];
          }
        }
      }
    }

    payload.excludeIds = [...questionIds, ...bindQuestionIds];
    const response = await querySegmentationCandidateQuestions(payload);
    if (!response?.status) {
      message.error(response?.message);
      this.setState({ tableLoding: false });
      return;
    }
    const aggregates = response.content.items || [];
    const nextQuestions = this.mapV2QuestionAggregatesToViews(
      aggregates,
      this.state.v2BusinessQuestionTypes,
    );
    if (!nextQuestions) {
      this.setState({ tableLoding: false });
      return;
    }
    this.getCardStatus = true;
    this.setState((state) => ({
      candidateQuestions:
        this.page === 1
          ? nextQuestions
          : [...state.candidateQuestions, ...nextQuestions],
      candidateQuestionTotal: response.content.total,
      tableLoding: false,
    }));
  };

  addQuestionType = (item) => {
    const { businessQuestionTypeId, label } = item;
    let { questionTypeList } = this.state;
    let list = [
      ...questionTypeList,
      initializeModuleQuestionTypeTemplate({
        moduleName: label,
        businessQuestionTypeId,
        id: businessQuestionTypeId,
        questionNum: 1,
        questionList: [createEmptyTwoWayQuestion(item)],
      }),
    ];
    this.setState({
      questionTypeList: list,
    });
  };

  questionModalOk = () => {
    let newList = JSON.parse(JSON.stringify(this.state.questionTypeList));
    newList.splice(this.state.delParentIndex, 1);

    this.setState({
      questionTypeList: newList,
      questionModalVisible: false,
    });
  };

  questionModaCancel = () => {
    this.setState({
      questionModalVisible: false,
    });
  };

  openJoinQuestionModal = (index, ind, list, guanlian) => {
    let cloneQuestionTypeList = JSON.parse(
      JSON.stringify(this.state.questionTypeList),
    );
    let target = cloneQuestionTypeList[index]?.questionList[ind];

    // 获取知识点
    queryTree({
      subjectId: this.state.subjectId,
      gradeId: this.state.gradeId,
      isSegmentation: true, //写死,后端用
    }).then((res) => {
      if (res.status) {
        this.setState({
          knowledgeTree: handeTreeData(res.content),
        });
      }
    });

    // 获取章节
    queryChapter({
      subjectId: this.state.subjectId,
      gradeId: this.state.gradeId,
      isSegmentation: true,
    }).then((res) => {
      if (res.status) {
        this.setState({
          chapterThree: handeTreeData(res.content),
        });
      }
    });

    this.setState(
      {
        ...buildAssociationModalSearchContext({
          gradeId: this.state.gradeId,
          isAssociation: guanlian,
        }),
        prentQuestionNum: index,
        childenQuestionNum: ind,
        isguanlian: guanlian,
        modalQuestionType: "list",
        candidateQuestionTypes: guanlian
          ? []
          : this.state.candidateQuestionTypes,
        candidateQuestionTypeContextKey: guanlian
          ? null
          : this.state.candidateQuestionTypeContextKey,
        candidateQuestionTypeLoadError: guanlian
          ? null
          : this.state.candidateQuestionTypeLoadError,
        candidateQuestionTypeLoading: guanlian,
        searchQuestionType: guanlian ? 0 : this.state.searchQuestionType,
        searchSelectChapterList: guanlian ? [] : target.chapterId,
        searchSelectKnowledgePointList: guanlian ? [] : target.knowledgeIds,
        topQuestionType: target.type,
        modalStatus: true,
      },
      () => {
        // 始终将题号保持在可视区域
        let number_ = 0;
        outerLoop: for (const [
          index_,
          element,
        ] of cloneQuestionTypeList.entries()) {
          for (
            let index__ = 0;
            index__ < element.questionList.length;
            index__++
          ) {
            number_ += 1;
            if (index == index_ && ind == index__) {
              setTimeout(() => {
                scrollToDmoById(
                  `question_number_${number_}`,
                  "questionNumWarp",
                );
              }, 0);
              break outerLoop;
            }
          }
        }

        let newLi = list ? list : [];
        if (newLi && newLi.length > 0) {
          // 题目或相似题已经被关联过，获取已关联题目
          this.loadV2QuestionViewsByIds(
            newLi,
            this.state.v2BusinessQuestionTypes,
          ).then((associatedQuestions) =>
            this.setState({ associatedQuestions }),
          );
        } else if (guanlian) {
          // 关联题目时获取当前未关联的试题
          this.page = 1;
          this.getBindableQuestions();
        }
        if (guanlian) {
          this.loadCandidateQuestionTypes(this.state.searchGradeId);
        }
      },
    );

    // 相似题推荐调用此函数时获取原题
    if (!guanlian) {
      this.getOriginalQuestion(index, ind);
    }
  };

  modalCancel = () => {
    this.page = 1;
    this.candidateQuestionTypeRequestVersion += 1;
    // 清空
    this.props.dispatch({
      type: "home/clearQuestionList",
    });
    // 清空已关联的题目
    this.props.dispatch({
      type: "global/clearListIds",
    });
    this.setState({
      isguanlian: false,
      modalStatus: false,
      qualityData: [],
      chapterThree: [],
      candidateQuestionTypes: [],
      candidateQuestionTypeContextKey: null,
      candidateQuestionTypeLoadError: null,
      candidateQuestionTypeLoading: false,
      knowledgeTree: [],
      searchValue: "",
      searchQueLevelType: 0,
      searchRangeType: 1,
      searchQuestionType: 0,
      searchSelectChapterList: [],
      searchSelectKnowledgePointList: [],
    });
  };

  onCheckAllTable = (e) => {
    let newList = JSON.parse(JSON.stringify(this.state.questionTypeList));
    if (newList && newList.length > 0) {
      newList.map((item) => {
        item.checked = e.target.checked;
        if (item.questionList && item.questionList) {
          item.questionList.map((it) => {
            it.checked = e.target.checked;
            if (it.sonQuestionList) {
              it.sonQuestionList.map((item1) => {
                item1.checked = this.isCompatibilityFollowerQuestion(item1, {
                  includeFirstBlank: true,
                })
                  ? false
                  : e.target.checked;
              });
            }
            if (this.isCompatibilityFollowerQuestion(it)) {
              it.checked = false;
            }
          });
        }
      });
    }
    this.setState({
      questionTypeList: newList,
      allChecked: e.target.checked,
    });
  };

  onCheckAllChange = (index, e) => {
    let newList = JSON.parse(JSON.stringify(this.state.questionTypeList));
    newList[index].checked = e.target.checked;
    if (newList[index].questionList.length > 0) {
      newList[index].questionList.map((item) => {
        item.checked = this.isCompatibilityFollowerQuestion(item)
          ? false
          : e.target.checked;
        if (item.sonQuestionList) {
          for (const { question: descendant } of flattenQuestionDescendants(
            item.sonQuestionList,
          )) {
            descendant.checked = this.isCompatibilityFollowerQuestion(
              descendant,
              {
                includeFirstBlank: true,
              },
            )
              ? false
              : e.target.checked;
          }
        }
      });
    }
    this.setState({
      questionTypeList: newList,
    });
  };

  onCheckChange = (index, ind, e) => {
    let newList = JSON.parse(JSON.stringify(this.state.questionTypeList));
    if (
      this.isCompatibilityFollowerQuestion(newList[index]?.questionList[ind])
    ) {
      return;
    }
    newList[index].questionList[ind].checked = e.target.checked;
    this.setState({
      questionTypeList: newList,
    });
  };

  onSonQuCheckChange = (index, index_, k, e) => {
    let newList = JSON.parse(JSON.stringify(this.state.questionTypeList));
    if (
      this.isCompatibilityFollowerQuestion(
        newList[index]?.questionList[index_]?.sonQuestionList[k],
        { includeFirstBlank: true },
      )
    ) {
      return;
    }
    newList[index].questionList[index_].sonQuestionList[k].checked =
      e.target.checked;
    this.setState({
      questionTypeList: newList,
    });
  };

  // 修改单行预测难度
  changePrediction = (index, ind, value) => {
    let newList = JSON.parse(JSON.stringify(this.state.questionTypeList));
    if (
      this.isAssociationAttributeEditBlocked(
        newList[index]?.questionList[ind],
        "predictionDifficulty",
      )
    ) {
      return;
    }
    newList[index].questionList[ind].predictionDifficulty = value;
    this.setState({
      questionTypeList: newList,
    });
  };

  // 修改单行预测难度
  changeSonPrediction = (index, index_, k, value) => {
    let newList = JSON.parse(JSON.stringify(this.state.questionTypeList));
    if (
      this.isAssociationAttributeEditBlocked(
        newList[index]?.questionList[index_]?.sonQuestionList[k],
        "predictionDifficulty",
        { includeFirstBlank: true },
      )
    ) {
      return;
    }
    newList[index].questionList[index_].sonQuestionList[
      k
    ].predictionDifficulty = value;
    this.setState({
      questionTypeList: newList,
    });
  };

  // 修改单行分数
  changeCheckScore = (index, ind, value) => {
    let newList = JSON.parse(JSON.stringify(this.state.questionTypeList));
    if (
      this.isAssociationAttributeEditBlocked(
        newList[index]?.questionList[ind],
        "questionScore",
      ) ||
      hasQuestionChildren(newList[index]?.questionList[ind])
    ) {
      return;
    }
    newList[index].questionList[ind].questionScore = value;
    this.setState({
      questionTypeList: newList,
    });
  };

  // 修改单行难度
  changeDifficult = (index, ind, value) => {
    let newList = JSON.parse(JSON.stringify(this.state.questionTypeList));
    if (
      this.isAssociationAttributeEditBlocked(
        newList[index]?.questionList[ind],
        "questionLevelType",
      )
    ) {
      return;
    }
    newList[index].questionList[ind].questionLevelType = value;
    this.setState({
      questionTypeList: newList,
    });
  };

  // 修改单行难度
  changeSonDifficult = (index, index_, k, value) => {
    let newList = JSON.parse(JSON.stringify(this.state.questionTypeList));
    if (
      this.isAssociationAttributeEditBlocked(
        newList[index]?.questionList[index_]?.sonQuestionList[k],
        "questionLevelType",
        { includeFirstBlank: true },
      )
    ) {
      return;
    }
    newList[index].questionList[index_].sonQuestionList[k].questionLevelType =
      value;
    this.setState({
      questionTypeList: newList,
    });
  };

  // 修改单行来源
  changeSource = (index, ind, value) => {
    let newList = JSON.parse(JSON.stringify(this.state.questionTypeList));
    if (
      this.isAssociationAttributeEditBlocked(
        newList[index]?.questionList[ind],
        "sourceType",
      )
    ) {
      return;
    }
    newList[index].questionList[ind].sourceType = value;
    this.setState({
      questionTypeList: newList,
    });
  };

  // 修改单行来源
  changeSonSource = (index, index_, k, value) => {
    let newList = JSON.parse(JSON.stringify(this.state.questionTypeList));
    if (
      this.isAssociationAttributeEditBlocked(
        newList[index]?.questionList[index_]?.sonQuestionList[k],
        "sourceType",
        { includeFirstBlank: true },
      )
    ) {
      return;
    }
    newList[index].questionList[index_].sonQuestionList[k].sourceType = value;
    this.setState({
      questionTypeList: newList,
    });
  };

  // 修改是否子题
  changeIfChild = (index, ind, value) => {
    let newList = JSON.parse(JSON.stringify(this.state.questionTypeList));
    const parentQuestion = newList[index].questionList[ind];
    if (value == 1) {
      this.setState({
        checkChild: ind,
        checkParent: index,
        selectedQuestionPath: null,
        modalSonQuestionsData: [
          inheritTwoWayQuestionType({}, parentQuestion),
          inheritTwoWayQuestionType({}, parentQuestion),
        ],
        childVisible: true,
      });
    } else if (value == 0) {
      newList[index].questionList[ind] = clearQuestionChildren(parentQuestion);
      this.refreshAssociationPlanForQuestion(
        newList[index].questionList[ind],
        index,
        ind,
      );
    }

    this.setState({
      questionTypeList: newList,
    });
  };

  // 修改名字
  changeNameValue = (index, e) => {
    let newList = JSON.parse(JSON.stringify(this.state.questionTypeList));
    newList[index].moduleName = e.target.value;
    this.setState({
      questionTypeList: newList,
    });
  };

  blur = (index) => {
    const newState = JSON.parse(JSON.stringify(this.state));
    newState[`name${index}`] = false;
    this.setState({
      ...newState,
    });
  };

  toggleCandidateAnswerDetails = (questionId) => {
    this.setState((state) => ({
      answerDetailsVisibleByQuestionId: toggleAnswerDetailsVisibility(
        state.answerDetailsVisibleByQuestionId,
        questionId,
      ),
    }));
  };

  isCandidateAnswerDetailsVisible = (question) =>
    Boolean(
      this.state.answerDetailsVisibleByQuestionId[
        String(this.getQuestionId(question))
      ],
    );

  changeName = (index) => {
    const newState = JSON.parse(JSON.stringify(this.state));
    newState[`name${index}`] = true;
    this.setState({
      ...newState,
    });
  };

  // 获取原题
  getOriginalQuestion = (index, ind) => {
    console.log(index, ind);
    let cloneQuestionTypeList = JSON.parse(
      JSON.stringify(this.state.questionTypeList),
    );
    let questionIds = this.getQuestionAssociationIds(
      cloneQuestionTypeList[index]?.questionList[ind],
    );
    if (questionIds && questionIds.length > 0) {
      this.loadV2QuestionViewsByIds(
        [questionIds[0]],
        this.state.v2BusinessQuestionTypes,
      ).then((questions) => {
        if (questions.length > 0) {
          this.setState({
            originalQuestion: questions,
          });
        }
      });
    } else {
      this.setState({
        originalQuestion: null,
      });
    }
  };

  openChapterDialog = ({
    prentQuestionNum,
    childenQuestionNum,
    sonQuestionNum,
    questionPath,
    ids,
  }) => {
    this.getOriginalQuestion(prentQuestionNum, childenQuestionNum);

    queryChapter({
      subjectId: this.state.subjectId,
      gradeId: this.state.gradeId,
      isSegmentation: true,
    }).then((res) => {
      if (res.status) {
        this.setState(
          {
            chapterThree: res.content,
            treeLoding: false,
            flatThree: flattenTree(res.content),
            expandedKeys: res.content ? initExpandedKeys(res.content) : [],
          },
          () => {
            if (ids && ids.length > 0) {
              scrollToDmoById(ids[0]);
            }
          },
        );
      }
    });

    this.setState({
      treeLoding: true,
      prentQuestionNum: prentQuestionNum,
      childenQuestionNum: childenQuestionNum,
      sonQuestionNum: sonQuestionNum,
      selectedQuestionPath: questionPath || null,
      checkedChapter: ids || [],
      knowledgeVisible: true,
      isKnowLedge: false,
      isAttainment: false,
      isChapter: true,
    });
  };

  openKnowledgeDialog = ({
    prentQuestionNum,
    childenQuestionNum,
    sonQuestionNum,
    questionPath,
    ids,
  }) => {
    this.getOriginalQuestion(prentQuestionNum, childenQuestionNum);

    queryTree({
      subjectId: this.state.subjectId,
      gradeId: this.state.gradeId,
      isSegmentation: true, //写死,后端用
    }).then((res) => {
      if (res.status) {
        this.setState(
          {
            knowledgeTree: res.content,
            treeLoding: false,
            flatThree: flattenTree(res.content),
            expandedKeys: res.content ? initExpandedKeys(res.content) : [],
          },
          () => {
            if (ids && ids.length > 0 && ids && ids[0]) {
              scrollToDmoById(ids[0]);
            }
          },
        );
      }
    });
    this.setState({
      treeLoding: true,
      prentQuestionNum: prentQuestionNum,
      childenQuestionNum: childenQuestionNum,
      sonQuestionNum: sonQuestionNum,
      selectedQuestionPath: questionPath || null,
      checkedKey: ids || [],
      knowledgeVisible: true,
      isKnowLedge: true,
      isAttainment: false,
      isChapter: false,
    });
  };

  openQualityDialog = ({
    prentQuestionNum,
    childenQuestionNum,
    sonQuestionNum,
    questionPath,
    ids,
  }) => {
    this.getOriginalQuestion(prentQuestionNum, childenQuestionNum);
    queryLabel({
      subjectId: this.state.subjectId,
      gradeId: this.state.gradeId,
    }).then((res) => {
      if (res.status) {
        let data = [];
        if (res.content && res.content.length > 0) {
          data = convertQualityDialogTreeData(res.content);
        }

        this.setState(
          {
            flatThree: flattenTree(data),
            qualityData: data,
            treeLoding: false,
            expandedKeys: data ? initExpandedKeys(data) : [],
          },
          () => {
            if (ids && ids[0]) {
              scrollToDmoById(ids[0]);
            }
          },
        );
      }
    });
    this.setState({
      checkedQuality: ids ? ids : [],
      treeLoding: true,
      prentQuestionNum: prentQuestionNum,
      childenQuestionNum: childenQuestionNum,
      sonQuestionNum: sonQuestionNum,
      selectedQuestionPath: questionPath || null,
      knowledgeVisible: true,
      isKnowLedge: false,
      isAttainment: true,
      isChapter: false,
    });
  };

  getKnowledge = () => {
    queryTree({
      subjectId: this.state.subjectId,
      gradeId: this.state.gradeId,
      isSegmentation: true, //写死,后端用
    }).then((response) => {
      if (response.ifLogin) {
        if (response.status) {
          this.setState({
            knowledgeTreeList: convertTreeData(response.content),
          });
        } else {
          message.error(response.message);
        }
      } else {
        loginRedirect();
      }
    });
  };

  getChapter = () => {
    queryChapter({
      subjectId: this.state.subjectId,
      gradeId: this.state.gradeId,
      isSegmentation: true, //写死,后端用
      // stage: this.state.sectionValue,
    }).then((response) => {
      if (response.ifLogin) {
        if (response.status) {
          this.setState({
            chapterTreeList: convertTreeData(response.content),
          });
        } else {
          message.error(response.message);
        }
      } else {
        loginRedirect();
      }
    });
  };

  getQuality = () => {
    queryLabel({
      subjectId: this.state.subjectId,
      gradeId: this.state.gradeId,
    }).then((response) => {
      if (response.ifLogin) {
        if (response.status) {
          this.setState({
            qualityTreeList: convertQualityTreeData(response.content),
          });
        } else {
          message.error(response.message);
        }
      } else {
        loginRedirect();
      }
    });
  };

  selectTree = (key, node) => {
    const { props } = node;
    const {
      prentQuestionNum,
      childenQuestionNum,
      sonQuestionNum,
      selectedQuestionPath,
      questionTypeList,
    } = this.state;

    let cloneQuestionTypeList = JSON.parse(JSON.stringify(questionTypeList));
    let target =
      cloneQuestionTypeList[prentQuestionNum].questionList[childenQuestionNum];

    if (Array.isArray(selectedQuestionPath)) {
      target = getQuestionAtPath(target.sonQuestionList, selectedQuestionPath);
    } else if (sonQuestionNum != undefined) {
      target = target.sonQuestionList[sonQuestionNum];
    }

    // 映射配置，统一处理
    const keyMap = {
      quality: {
        idKey: "indicatorIds",
        nameKey: "indicatorName",
        stateKey: "checkedQuality",
      },
      chapter: {
        idKey: "chapterId",
        nameKey: "chapterName",
        stateKey: "checkedChapter",
      },
      knowledge: {
        idKey: "knowledgeIds",
        nameKey: "knowledge",
        stateKey: "checkedKey",
      },
    };

    const mapping = keyMap[key];

    if (mapping) {
      let idList = target[mapping.idKey];
      let nameList = target[mapping.nameKey];
      const itemIndex = idList?.findIndex((item) => item == props.eventKey);
      if (idList == undefined) {
        idList = [props.eventKey];
        // 不存在则新增
        target[mapping.idKey] = [props.eventKey];
        target[mapping.nameKey] = [props.titleStr];
      } else if (itemIndex > -1) {
        // 如果存在则取消选中
        idList.splice(itemIndex, 1);
        nameList.splice(itemIndex, 1);
      } else {
        // 不存在则新增
        idList.push(props.eventKey);
        nameList.push(props.titleStr);
      }

      this.setState({
        [mapping.stateKey]: [...idList], // 更新当前选中项
        questionTypeList: cloneQuestionTypeList, // 更新总数据
      });
    }
  };

  checkedTree = (node, e, key) => {
    const checkedKeys = node.checked;
    const {
      prentQuestionNum,
      childenQuestionNum,
      sonQuestionNum,
      selectedQuestionPath,
      questionTypeList,
    } = this.state;

    // 深拷贝 questionTypeList
    let cloneQuestionTypeList = JSON.parse(JSON.stringify(questionTypeList));

    // 取当前目标节点
    let target =
      cloneQuestionTypeList[prentQuestionNum].questionList[childenQuestionNum];
    if (Array.isArray(selectedQuestionPath)) {
      target = getQuestionAtPath(target.sonQuestionList, selectedQuestionPath);
    } else if (sonQuestionNum != undefined) {
      target = target.sonQuestionList[sonQuestionNum];
    }

    // 获取选中节点名称
    const names = e.checkedNodes.map((item) => item.props.titleStr);

    // 定义映射关系，减少冗余判断
    const keyMap = {
      quality: {
        idKey: "indicatorIds",
        nameKey: "indicatorName",
        stateKey: "checkedQuality",
      },
      chapter: {
        idKey: "chapterId",
        nameKey: "chapterName",
        stateKey: "checkedChapter",
      },
      knowledge: {
        idKey: "knowledgeIds",
        nameKey: "knowledge",
        stateKey: "checkedKey",
      },
    };

    const mapping = keyMap[key];
    if (mapping) {
      target[mapping.idKey] = checkedKeys;
      target[mapping.nameKey] = names;

      this.setState({
        [mapping.stateKey]: checkedKeys,
        questionTypeList: cloneQuestionTypeList,
      });
    }
  };

  delChecked = (e, index, ind, l) => {
    e.stopPropagation();
    let newList = JSON.parse(JSON.stringify(this.state.questionTypeList));
    if (this.state.isAttainment) {
      newList[index].questionList[ind].indicatorIds.splice(l, 1);
      newList[index].questionList[ind].indicatorName.splice(l, 1);

      this.setState({
        checkedQuality: newList[index].questionList[ind].indicatorIds,
      });
    } else if (this.state.isKnowLedge) {
      newList[index].questionList[ind].knowledgeIds.splice(l, 1);
      newList[index].questionList[ind].knowledge.splice(l, 1);

      this.setState({
        checkedKey: newList[index].questionList[ind].knowledgeIds,
      });
    } else if (this.state.isChapter) {
      newList[index].questionList[ind].chapterId.splice(l, 1);
      newList[index].questionList[ind].chapterName.splice(l, 1);

      this.setState({
        checkedChapter: newList[index].questionList[ind].chapterId,
      });
    }

    this.setState({
      questionTypeList: newList,
    });
  };

  delSonChecked = (e, index, index_, k, l) => {
    e.stopPropagation();
    let newList = JSON.parse(JSON.stringify(this.state.questionTypeList));
    let target = newList[index].questionList[index_].sonQuestionList[k];
    if (this.state.isAttainment) {
      target.indicatorIds.splice(l, 1);
      target.indicatorName.splice(l, 1);

      this.setState({
        checkedQuality: target.indicatorIds,
      });
    } else if (this.state.isKnowLedge) {
      target.knowledgeIds.splice(l, 1);
      target.knowledge.splice(l, 1);

      this.setState({
        checkedKey: target.knowledgeIds,
      });
    } else if (this.state.isChapter) {
      target.chapterId.splice(l, 1);
      target.chapterName.splice(l, 1);

      this.setState({
        checkedChapter: target.chapterId,
      });
    }
    this.setState({
      questionTypeList: newList,
    });
  };

  // 关联成功后复用同一套题号推进规则，保持“添加”和“确认关联”的数据流一致。
  selectNextUnassociatedQuestion = (questionTypeList, fallbackQuestionId) => {
    const { prentQuestionNum, childenQuestionNum } = this.state;

    for (
      let moduleIndex = prentQuestionNum;
      moduleIndex < questionTypeList.length;
      moduleIndex++
    ) {
      const startQuestionIndex =
        moduleIndex === prentQuestionNum ? childenQuestionNum : 0;
      const questionIndex = questionTypeList[
        moduleIndex
      ].questionList.findIndex(
        (question, index) =>
          index >= startQuestionIndex && !question.questionId,
      );

      if (questionIndex !== -1) {
        this.questionNumChange(moduleIndex, questionIndex);
        return;
      }
    }

    this.loadV2QuestionViewsByIds(
      [fallbackQuestionId],
      this.state.v2BusinessQuestionTypes,
    ).then((associatedQuestions) => this.setState({ associatedQuestions }));
  };

  addTest = (id, item) => {
    const { prentQuestionNum, childenQuestionNum, questionTypeList } =
      this.state;
    const normalizedItem = Array.isArray(item) ? item[0] : item;

    // 关联题目
    if (this.state.isguanlian) {
      const cloneQuestionTypeList = JSON.parse(
        JSON.stringify(questionTypeList),
      );
      const associationPosition = {
        moduleIndex: prentQuestionNum,
        questionIndex: childenQuestionNum,
      };
      let target =
        cloneQuestionTypeList[prentQuestionNum].questionList[
          childenQuestionNum
        ];
      if (!target?.businessQuestionTypeId) {
        message.error(
          trans(
            "twoWayTest.placementTypeMissing",
            "当前题位缺少规划题型，无法关联",
          ),
        );
        return;
      }
      const sourceQuestionId = this.getQuestionId(normalizedItem) || id;

      if ([3, 6].includes(Number(normalizedItem?.type))) {
        // 组合题整体绑定只释放已有父题整体绑定，允许同一组合题的子题拆分绑定继续保留。
        this.releaseQuestionAssociationsBySource(
          cloneQuestionTypeList,
          sourceQuestionId,
          associationPosition,
          normalizedItem,
          Number(normalizedItem?.type) !== 6,
        );
        target =
          cloneQuestionTypeList[prentQuestionNum].questionList[
            childenQuestionNum
          ];
      }

      this.setQuestionAssociation(
        target,
        sourceQuestionId,
        buildQuestionAssociationStrategy(normalizedItem),
      );
      Object.assign(
        target,
        buildCombinationQuestionAssociationPatch(normalizedItem),
      );
      target.associationSourceSnapshot = normalizedItem || null;
      target.virtualAssociation = this.buildQuestionAssociationPlan(
        target,
        normalizedItem,
        prentQuestionNum,
        childenQuestionNum,
      );

      Object.assign(
        target,
        buildAssociationResourcePatch(target, normalizedItem),
      );

      if (
        !target.questionLevelType &&
        target.questionLevelType != 0 &&
        (normalizedItem?.level || normalizedItem?.level == 0)
      ) {
        target.questionLevelType = normalizedItem.level;
      }

      let bindQuestionIds = [];
      for (const modal of cloneQuestionTypeList) {
        if (modal.questionList && modal.questionList.length > 0) {
          for (const item of modal.questionList) {
            if (item.questionId) {
              bindQuestionIds = [...bindQuestionIds, item.questionId];
            }
            if (
              item.personalityQuestions &&
              item.personalityQuestions.length > 0
            ) {
              bindQuestionIds = [
                ...bindQuestionIds,
                ...item.personalityQuestions,
              ];
            }
          }
        }
      }

      // 获取相似题推荐
      recommendSegmentationQuestions(
        { gradeId: this.state.gradeId, subjectId: this.state.subjectId },
        {
          excludedQuestionIds: bindQuestionIds,
          targets: [
            buildAssociationRecommendationTarget(
              buildQuestionPositionKey(prentQuestionNum, childenQuestionNum),
              target,
            ),
          ],
        },
      ).then((res) => {
        if (res.status && res.content?.items?.length > 0) {
          target.personalityQuestions = res.content.items[0].questions.map(
            (question) => question.id,
          );
        }
        this.setState({
          questionTypeList: cloneQuestionTypeList,
        });
      });

      this.selectNextUnassociatedQuestion(cloneQuestionTypeList, id);
    } else {
      let cloneQuestionTypeList = JSON.parse(JSON.stringify(questionTypeList));
      let target =
        cloneQuestionTypeList[prentQuestionNum].questionList[
          childenQuestionNum
        ];
      let ids = target.personalityQuestions
        ? [...target.personalityQuestions, id]
        : [id];
      target.personalityQuestions = ids;
      this.loadV2QuestionViewsByIds(
        target.personalityQuestions,
        this.state.v2BusinessQuestionTypes,
      ).then((associatedQuestions) => this.setState({ associatedQuestions }));
      this.setState({
        questionTypeList: cloneQuestionTypeList,
      });
    }
  };

  releaseQuestionAssociationsAndGetTarget = (
    questionTypeList,
    parentQuestionIndex,
    childQuestionIndex,
    sourceQuestionId,
  ) => {
    this.releaseQuestionAssociationsBySource(
      questionTypeList,
      sourceQuestionId,
    );

    return questionTypeList[parentQuestionIndex]?.questionList?.[
      childQuestionIndex
    ];
  };

  clearQuestionAssociationTarget = (
    questionTypeList,
    parentQuestionIndex,
    childQuestionIndex,
  ) => {
    const target =
      questionTypeList[parentQuestionIndex]?.questionList?.[childQuestionIndex];

    if (!target) {
      return null;
    }

    const sourceQuestionId = this.getAssociationSourceId(target);
    const currentTarget =
      sourceQuestionId != undefined && target?.associationStrategy
        ? this.releaseQuestionAssociationsAndGetTarget(
            questionTypeList,
            parentQuestionIndex,
            childQuestionIndex,
            sourceQuestionId,
          )
        : target;

    if (!currentTarget) {
      return null;
    }

    currentTarget.questionId = null;
    currentTarget.associationStrategy = null;
    Object.assign(currentTarget, buildClearAssociatedChildrenPatch());
    delete currentTarget.associationList;
    currentTarget.personalityQuestions = null;
    currentTarget.virtualAssociation = null;
    currentTarget.associationSourceSnapshot = null;
    delete currentTarget.associationCompatibility;
    delete currentTarget.combinationSplitAssociation;
    delete currentTarget.blankSplitAssociation;

    currentTarget.knowledgeIds = [];
    currentTarget.knowledge = null;
    currentTarget.chapterId = [];
    currentTarget.chapterName = null;
    currentTarget.indicatorIds = [];
    currentTarget.indicatorName = null;
    currentTarget.questionLevelType = null;

    return currentTarget;
  };

  cancelQuestionAssociationAt = (parentQuestionIndex, childQuestionIndex) => {
    const { questionTypeList } = this.state;
    const cloneQuestionTypeList = JSON.parse(JSON.stringify(questionTypeList));
    const target = this.clearQuestionAssociationTarget(
      cloneQuestionTypeList,
      parentQuestionIndex,
      childQuestionIndex,
    );

    if (!target) {
      return;
    }

    // 清空已关联的题目
    this.props.dispatch({
      type: "global/clearListIds",
    });

    this.setState(
      {
        questionTypeList: cloneQuestionTypeList,
      },
      () => {
        // 刷新当前题目可以用来关联的题目
        this.page = 1;
        this.getBindableQuestions();
      },
    );
  };

  cancelQuestionAssociationFromRow = (index, ind, event) => {
    event?.preventDefault?.();
    event?.stopPropagation?.();
    this.cancelQuestionAssociationAt(index, ind);
  };

  cancelAdd = (id, ifEdit) => {
    void ifEdit;

    const {
      isguanlian,
      prentQuestionNum,
      childenQuestionNum,
      questionTypeList,
    } = this.state;
    /* 关联题目 */
    if (isguanlian) {
      this.cancelQuestionAssociationAt(prentQuestionNum, childenQuestionNum);
    } else {
      const cloneQuestionTypeList = JSON.parse(
        JSON.stringify(questionTypeList),
      );
      //个性推题 查看状态时直点击取消关联，直接从已关联的相似题中删除
      let target =
        cloneQuestionTypeList[prentQuestionNum].questionList[
          childenQuestionNum
        ];
      if (
        target.personalityQuestions &&
        target.personalityQuestions.length > 0
      ) {
        target.personalityQuestions.map((item, index) => {
          if (item === id) {
            target.personalityQuestions.splice(index, 1);
          }
        });
      }
      this.setState(
        {
          questionTypeList: cloneQuestionTypeList,
        },
        () => {
          if (
            target.personalityQuestions &&
            target.personalityQuestions.length > 0
          ) {
            // 刷新当前题目展示已关联的题目
            this.loadV2QuestionViewsByIds(
              target.personalityQuestions,
              this.state.v2BusinessQuestionTypes,
            ).then((associatedQuestions) =>
              this.setState({ associatedQuestions }),
            );
          } else {
            this.setState({ associatedQuestions: [] });
          }
        },
      );
    }
  };

  selectQuestionNumber = (index, ind) => {
    this.getOriginalQuestion(index, ind);
    let newList = JSON.parse(JSON.stringify(this.state.questionTypeList));

    this.setState({
      prentQuestionNum: index,
      childenQuestionNum: ind,
      sonQuestionNum: null,
      checkedKey: newList[index].questionList[ind].knowledgeIds || [],
      checkedChapter: newList[index].questionList[ind].chapterId || [],
      checkedQuality: newList[index].questionList[ind].indicatorIds || [],
    });

    let ids = [];
    if (this.state.isAttainment) {
      ids = newList[index].questionList[ind].indicatorIds;
    } else if (this.state.isChapter) {
      ids = newList[index].questionList[ind].chapterId;
    } else if (this.state.isKnowLedge) {
      ids = newList[index].questionList[ind].knowledgeIds;
    }

    if (ids && ids.length > 0) {
      scrollToDmoById(ids[0]);
    }
  };

  selectSonQuestionNumber = (index, index_, k) => {
    let newList = JSON.parse(JSON.stringify(this.state.questionTypeList));
    this.setState({
      prentQuestionNum: index,
      childenQuestionNum: index_,
      sonQuestionNum: k,
      checkedKey:
        newList[index].questionList[index_].sonQuestionList[k].knowledgeIds ||
        [],
      checkedChapter:
        newList[index].questionList[index_].sonQuestionList[k].chapterId || [],
      checkedQuality:
        newList[index].questionList[index_].sonQuestionList[k].indicatorIds ||
        [],
    });

    let ids = [];
    if (this.state.isAttainment) {
      ids = newList[index].questionList[index_].sonQuestionList[k].indicatorIds;
    } else if (this.state.isChapter) {
      ids = newList[index].questionList[index_].sonQuestionList[k].chapterId;
    } else if (this.state.isKnowLedge) {
      ids = newList[index].questionList[index_].sonQuestionList[k].knowledgeIds;
    }

    if (ids && ids.length > 0) {
      scrollToDmoById(ids[0]);
    }
  };

  changeSubjetc = (value) => {
    const { subjectList } = this.props;
    let subname = "";
    subjectList.map((item) => {
      if (item.id === value) {
        subname = item.name;
      }
    });
    this.setState({
      subjectId: value,
      subname,
      modalsubjectId: value,
    });
  };

  changeType = (value) => {
    this.setState({
      type: value,
    });
  };

  // 选择年级
  changeGradeTotal = (value) => {
    this.props.dispatch({
      type: "global/getSubject",
      payload: {
        gradeId: value,
      },
      onSuccess: (res) => {
        if (res) {
          let subjectIndex = res.findIndex(
            (item) => item.id == this.state.subjectId,
          );
          if (subjectIndex == -1) {
            this.setState({
              subjectId: null,
            });
          }
        }
      },
    });

    const { allGradeList } = this.props;
    let gradeName = "";
    allGradeList.map((item) => {
      if (item.gradeId === value) {
        gradeName = item.name;
      }
    });
    this.setState({
      gradeId: value,
      gradeName,
      // modalgradeId: value,
      searchGradeId: value,
    });
  };

  renderNo = (index, ind) => {
    const { questionTypeList } = this.state;
    let number_ = 1;
    let returnNumber = null;
    questionTypeList.map((item, index_) => {
      item.questionList.length &&
        item.questionList.map((ite, ii) => {
          if (index == index_ && ind === ii) {
            returnNumber = number_;
          }
          number_ += 1;
        });
    });
    return returnNumber;
  };

  changeTitle = (e) => {
    this.setState({
      titleValue: e.target.value,
    });
  };

  closeModal = () => {
    // 章节 知识点 素养 每次确定及时保存数据
    this.save();

    this.setState({
      knowledgeVisible: false,
      qualityData: [],
      chapterThree: [],
      knowledgeTree: [],
      searchQuValue: "",
      isKnowLedge: false,
      isAttainment: false,
      isChapter: false,
    });
  };

  renderCheck = () => {
    const { questionTypeList } = this.state;
    let isCheck = false;
    if (questionTypeList && questionTypeList.length > 0) {
      questionTypeList.map((item) => {
        if (item.questionList && item.questionList.length > 0) {
          item.questionList.map((it) => {
            if (it.checked) {
              isCheck = true;
            }
          });
        }
      });
    }
    return isCheck;
  };

  searchChange = (type, value) => {
    const refreshList = () => {
      this.page = 1;
      this.getBindableQuestions();
    };
    if (type == "range") {
      this.setState(
        {
          searchRangeType: value,
        },
        () => {
          refreshList();
        },
      );
    } else if (type == "type") {
      if (this.state.searchGradeId == 0) {
        message.error(
          trans(
            "twoWayTest.selectGradeBeforeQuestionType",
            "请先选择具体年级再筛选业务题型",
          ),
        );
        return;
      }
      this.setState(
        {
          searchQuestionType: value,
        },
        () => {
          refreshList();
        },
      );
    }
    if (type == "grade") {
      this.setState(
        {
          candidateQuestionTypes: [],
          candidateQuestionTypeContextKey: null,
          candidateQuestionTypeLoadError: null,
          candidateQuestionTypeLoading: value != 0,
          searchGradeId: value,
          searchQuestionType: 0,
        },
        () => {
          refreshList();
          this.loadCandidateQuestionTypes(value);
        },
      );
    } else if (type == "leve") {
      this.setState(
        {
          searchQueLevelType: value,
        },
        () => {
          refreshList();
        },
      );
    } else if (type == "knowledge") {
      console.log("knowledge", value);
      this.setState(
        {
          searchSelectKnowledgePointList: value,
        },
        () => {
          refreshList();
        },
      );
    } else if (type == "chapter") {
      console.log(value, "chapter");

      this.setState(
        {
          searchSelectChapterList: value,
        },
        () => {
          refreshList();
        },
      );
    } else if (type == "keyWord") {
      refreshList();
    }
  };

  save = async (callback) => {
    if (this.saveInFlight) {
      this.saveQueued = true;
      if (callback) {
        this.queuedSaveCallback = callback;
      }
      return;
    }
    this.saveInFlight = true;
    const {
      subname,
      gradeName,
      questionTypeList,
      gradeId,
      subjectId,
      titleValue,
      checkedType,
    } = this.state;
    let newQuestionList = JSON.parse(JSON.stringify(questionTypeList));

    if (newQuestionList && newQuestionList.length > 0) {
      newQuestionList.map((item, inde) => {
        if (item.questionList && item.questionList.length > 0) {
          item.questionList.map((it, ind) => {
            const synchronizedQuestion = synchronizeQuestionTreeScores(it);
            delete it.sonQuestionScores;
            Object.assign(it, synchronizedQuestion);
            sanitizeAssociationPayloadQuestion(it);
            if (it.sonQuestionList) {
              it.sonQuestionList = it.sonQuestionList.map((sonQu) =>
                normalizeSaveSonQuestion({
                  ...sonQu,
                  indicatorName: "",
                }),
              );
              it.sonQuestionList.forEach(sanitizeAssociationPayloadQuestion);
            }

            it.indicatorName = "";
            it.questionSerialNumber = this.renderNo(inde, ind);
            it.index = this.renderNo(inde, ind);
            item.type === it.type;
          });
        }
      });
    }
    let payload = {
      paperId:
        this.savedPaperId ||
        this.testId ||
        this.props.saveProps?.paperId ||
        null,
      type: this.state.type,
      // 编辑
      title: this.testId
        ? this.state.titleValue
        : `${this.state.baseExamNmae}${gradeName}${subname}${titleValue}`,
      gradeId,
      subjectId,
      isPreview: this.state.isPreview,
      totalScore: this.renderTotal(),
      paperModuleModels: newQuestionList,
      tabId: sessionStorage.getItem("sessionId"),
    };

    const requestPayload = mapTwoWayViewToV2SegmentationPaperRequest(payload);
    const paperId = payload.paperId;
    try {
      const res = paperId
        ? await updateSegmentationPaper(paperId, requestPayload)
        : await createSegmentationPaper(requestPayload);
      if (res?.status) {
        const savedPaperId = res.content.id || paperId;
        this.savedPaperId = savedPaperId;
        this.testId = savedPaperId;
        if (!paperId && savedPaperId) {
          this.setHash({ id: savedPaperId });
        }
        const saveResponse = {
          ...res,
          content: { paperId: savedPaperId, saveSuccess: true },
        };
        if (callback) callback(saveResponse);
        await this.saveSuccess(saveResponse);
      } else {
        message.error(res?.message);
      }
    } finally {
      this.saveInFlight = false;
      if (!this.isUnmounted && this.saveQueued) {
        this.saveQueued = false;
        const queuedSaveCallback = this.queuedSaveCallback;
        this.queuedSaveCallback = null;
        this.save(queuedSaveCallback);
      }
    }
  };

  saveSuccess = async (res) => {
    const { saveSuccess, paperId } = res.content;
    if (saveSuccess) {
      this.setState({
        saveTime: `${getCurrentTime("date")} ${getCurrentTime("seconds")}`,
      });
      // 保存数据后的回调
    } else if (!saveSuccess && paperId) {
      let response = await this.getLock({
        paperId,
        tabId: sessionStorage.getItem("sessionId"),
        query: true,
      });
      // 处理锁
      this.handleEditLock(response, {
        onShowModal: (message_) => {
          if (timeId) {
            clearInterval(timeId);
          }
          messageText = message_;
          this.setState({
            editLockModalVisible: true,
          });
        },
        onError: (message_) => {
          message.error(message_);
        },
      });
    }
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
    const pattern = "/twoWayTest/:id?";

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

  renderTotal = () => {
    const { subname, gradeName, questionTypeList, gradeId, subjectId } =
      this.state;
    let number_ = 0;
    if (questionTypeList && questionTypeList.length > 0) {
      questionTypeList.map((item) => {
        if (item.questionList && item.questionList.length > 0) {
          item.questionList.map((it) => {
            number_ += it.questionScore || 0;
          });
        }
      });
    }
    return number_;
  };

  renderDifficult = () => {
    const { subname, gradeName, questionTypeList, gradeId, subjectId } =
      this.state;
    let number_ = 0;
    let length = 0;
    if (questionTypeList && questionTypeList.length > 0) {
      questionTypeList.map((item) => {
        if (item.questionList && item.questionList.length > 0) {
          item.questionList.map((it) => {
            if (it.predictionDifficulty) {
              number_ += it.predictionDifficulty || 0;
              length += 1;
            }
          });
        }
      });
    }
    return length ? this.formatNumber(number_ / length, 100) : 0;
  };

  // 获取表格中指定可选内容所占比例
  renderDiff = (value, key) => {
    const { questionTypeList } = this.state;
    let number_ = 0;
    let length = 0;
    if (questionTypeList && questionTypeList.length > 0) {
      questionTypeList.map((item) => {
        if (item.questionList && item.questionList.length > 0) {
          item.questionList.map((it) => {
            if (it[key]) {
              length += 1;
            }
            if (value == it[key]) {
              number_ += 1;
            }

            if (it.sonQuestionList) {
              for (const item1 of it.sonQuestionList) {
                if (item1[key]) {
                  length += 1;
                }
                if (value == item1[key]) {
                  number_ += 1;
                }
              }
            }
          });
        }
      });
    }
    return length ? this.formatNumber(number_ / length, 10) : 0;
  };

  formatNumber = (value, def) => {
    let number = value;
    return Math.round(number * def) / def;
  };

  scrollChange = () => {
    // 查看当前相似题推荐时不进行分页查询
    if (this.state.modalQuestionType == "list" && !this.state.isguanlian) {
      return;
    }
    console.log("scrollChange", 123);

    const questionTotal = this.state.candidateQuestionTotal;
    const questionList = this.state.candidateQuestions;
    const overflowDom = document.querySelector("#listBox");
    const scrollTop = overflowDom.scrollTop;
    const clientHeight = overflowDom.clientHeight;
    const scrollHeight = overflowDom.scrollHeight;
    this.setState({
      scrollTop: scrollTop,
    });
    if (scrollTop + clientHeight + 50 >= scrollHeight) {
      // 正在获取表格数据
      if (!this.getCardStatus) {
        return;
      }
      // 所有表格数据加载完毕
      if (this.page != 1 && questionTotal == questionList.length) {
        return;
      }

      this.getCardStatus = false;
      this.page += 1;
      this.getBindableQuestions();
    }
  };

  closeChild = () => {
    this.setState({
      childVisible: false,
      modalSonQuestionsData: null,
    });
  };

  sureChild = () => {
    const { checkParent, checkChild } = this.state;
    let newQuestionList = JSON.parse(
      JSON.stringify(this.state.questionTypeList),
    );
    const parentQuestion =
      newQuestionList[checkParent].questionList[checkChild];
    const sonQuestionList = normalizeExamSideSonQuestions(
      this.state.modalSonQuestionsData,
      parentQuestion.type,
    ).map((question) => inheritTwoWayQuestionType(question, parentQuestion));
    parentQuestion.sonQuestionList = sonQuestionList;
    Object.assign(
      parentQuestion,
      synchronizeQuestionTreeScores(parentQuestion),
    );
    this.refreshAssociationPlanForQuestion(
      newQuestionList[checkParent].questionList[checkChild],
      checkParent,
      checkChild,
    );

    this.setState(
      {
        childVisible: false,
      },
      () => {
        this.closeChild();
        this.setState({
          questionTypeList: newQuestionList,
        });
      },
    );
  };

  showChild = (list, index, ind) => {
    let newQuestionList = JSON.parse(
      JSON.stringify(this.state.questionTypeList),
    );
    this.setState({
      childVisible: true,
      modalSonQuestionsData:
        newQuestionList[index].questionList[ind].sonQuestionList,
    });
  };

  closePage = () => {
    this.props.dispatch({
      type: "global/clearSaveProp",
    });
    window.parent.postMessage("false", "*");
    window.close();
    this.props.history.goBack();
  };

  onExpand = (expandedKeys) => {
    this.setState({
      expandedKeys,
      // 如果不将autoExpandParent设置为false，如果子级已展开，则父级不能折叠。
      autoExpandParent: false,
    });
  };

  // 过滤树数据
  filterTreeData = (data) => {
    return data
      .map((node) => {
        const children = node.children
          ? this.filterTreeData(node.children)
          : [];
        if (
          node.value
            .toLowerCase()
            .includes(this.state.searchQuValue.toLowerCase()) ||
          children.length > 0 // 如果子节点中有满足条件的，保留当前节点
        ) {
          return {
            ...node,
            children, // 保留过滤后的子节点
          };
        }
        return null; // 不满足条件的节点过滤掉
      })
      .filter(Boolean); // 移除 null 节点
  };

  //同一弹窗显示不同tree
  renderTreeByType = () => {
    const {
      isAttainment,
      isChapter,
      isKnowLedge,
      treeLoding,
      checkedQuality,
      checkedChapter,
      checkedKey,
      expandedKeys,
      autoExpandParent,
    } = this.state;

    if (treeLoding) {
      return <Spin className={styles.spin} />;
    }

    let treeConfig = null;

    if (isAttainment && this.state.qualityData?.length) {
      treeConfig = {
        key: "quality",
        data: this.state.qualityData,
        checkedKeys: checkedQuality,
      };
    } else if (isChapter && this.state.chapterThree?.length) {
      treeConfig = {
        key: "chapter",
        data: this.state.chapterThree,
        checkedKeys: checkedChapter,
      };
    } else if (isKnowLedge && this.state.knowledgeTree?.length) {
      treeConfig = {
        key: "knowledge",
        data: this.state.knowledgeTree,
        checkedKeys: checkedKey,
      };
    }

    if (!treeConfig) {
      return <Empty />;
    }

    const filterData = this.filterTreeData(treeConfig.data);

    return (
      <Tree
        checkedKeys={treeConfig.checkedKeys}
        showLine={true}
        checkable={true}
        checkStrictly
        expandedKeys={expandedKeys}
        onExpand={this.onExpand}
        autoExpandParent={autoExpandParent}
        onSelect={(selectedKeys, { node }) =>
          this.selectTree(treeConfig.key, node)
        }
        onCheck={(node, e) => this.checkedTree(node, e, treeConfig.key)}
        defaultExpandAll={treeConfig.key !== "quality"} // quality 不默认展开
      >
        {loop(filterData)}
      </Tree>
    );
  };

  returnFloat = (number_) => {
    return formatDecimalDisplay(number_);
  };

  addQuestion = () => {
    this.props.history.push(
      buildQuestionAssetInputCreatePath({
        gradeId: this.state.gradeId,
        subjectId: this.state.subjectId,
      }),
    );
  };

  questionNumChange = (index, ind) => {
    let target = this.state.questionTypeList[index]?.questionList[ind];
    if (!this.state.isguanlian && !target.questionId) {
      message.error(
        trans("global.addGuanlianFirst", "请先添加关联题目，再添加相似题"),
      );
      return;
    }
    this.setState(
      {
        prentQuestionNum: index,
        childenQuestionNum: ind,
        modalQuestionType: "list",
        searchSelectChapterList: this.state.isguanlian ? [] : target.chapterId,
        searchSelectKnowledgePointList: this.state.isguanlian
          ? []
          : target.knowledgeIds,
        topQuestionType: this.state.isguanlian ? null : target.type,
      },
      () => {
        let ids = [];
        if (this.state.isguanlian) {
          ids = this.getQuestionAssociationIds(target);
        } else if (target.personalityQuestions) {
          ids = target.personalityQuestions;
        }
        if (ids && ids.length > 0) {
          // 若已关联，则获取已关联题目
          this.loadV2QuestionViewsByIds(
            ids,
            this.state.v2BusinessQuestionTypes,
          ).then((associatedQuestions) =>
            this.setState({ associatedQuestions }),
          );
        } else {
          this.setState({ associatedQuestions: [] });
        }
      },
    );
    // 获取原题
    if (!this.state.isguanlian) {
      this.getOriginalQuestion(index, ind);
    }
  };

  similarityEdit = () => {
    this.setState({
      modalQuestionType: "edit",
    });
    // 刷新当前题目可以用来关联的题目
    this.page = 1;
    this.getBindableQuestions();
  };

  similarityCancel = () => {
    this.setState({
      modalQuestionType: "list",
    });
  };

  expandChange = () => {
    this.setState({
      isExpand: !this.state.isExpand,
    });
  };

  findQuestionLinks = (allLinkedQuestionIds, id) => {
    let array = [];
    allLinkedQuestionIds.map((qst) => {
      if (qst.id == id) {
        array.push(qst.linkQuestionNumber);
      }
    });
    if (array && array.length > 0) {
      return (
        <div
          style={{
            color: "rgb(238,155,77)",
            fontSize: "13px",
            marginLeft: "10px",
          }}
        >
          {trans(
            "twoWay.questionAddedToPositions",
            "该题已被添加到第{$positions}题",
            { positions: array.join(",") },
          )}
        </div>
      );
    }
    return null;
  };

  adaptChange = (id) => {
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

  editModalCancel = (questionId) => {
    if (questionId) {
      this.loadV2QuestionViewsByIds(
        [questionId],
        this.state.v2BusinessQuestionTypes,
      ).then((questions) => {
        if (questions.length > 0) {
          this.addTest(questionId, questions);
          this.props.dispatch({
            type: "home/clearQuestionItem",
          });
          this.setState({
            editModalVisible: false,
          });
        }
      });
    } else {
      this.props.dispatch({
        type: "home/clearQuestionItem",
      });
      this.setState({
        editModalVisible: false,
      });
    }
  };

  getTopLevelQuestionOptions = () => {
    const { questionTypeList } = this.state;
    const options = [];
    let questionNo = 0;

    for (const [moduleIndex, moduleItem] of questionTypeList.entries()) {
      if (moduleItem.questionList)
        for (const [
          questionIndex,
          question,
        ] of moduleItem.questionList.entries()) {
          const isLocked = this.isCompatibilityFollowerQuestion(question);
          questionNo += 1;
          options.push({
            disabled:
              isLocked ||
              (Array.isArray(question?.sonQuestionList) &&
                question.sonQuestionList.length > 0),
            key: buildQuestionPositionKey(moduleIndex, questionIndex),
            label: String(questionNo),
            moduleIndex,
            question,
            questionIndex,
            typeLabel: this.getQuestionTypeText(question),
          });
        }
    }

    return options;
  };

  getQuestionTypeText = (question) =>
    getBusinessQuestionTypeLabel(
      this.state.enabledQuestionTypes,
      question?.businessQuestionTypeId,
    );

  getQuestionId = (question) => question?.questionId || question?.id;

  getCombinationChildren = (question) =>
    (this.getCombinationLeaves(question) || []).map((leaf) => leaf.question);

  getCombinationLeaves = (question) =>
    collectCombinationLeafQuestions(question);

  getCurrentTopLevelQuestionNo = () => {
    const { prentQuestionNum, childenQuestionNum } = this.state;

    if (prentQuestionNum == undefined || childenQuestionNum == undefined) {
      return null;
    }

    return this.renderNo(prentQuestionNum, childenQuestionNum);
  };

  getCombinationChildLabel = (childIndex) => {
    // 组合题拆分关联展示稳定的子问序号，避免导入题号污染弹窗里的匹配顺序。
    return getCombinationChildDisplayLabel(childIndex);
  };

  openCombinationAssociationModal = (sourceQuestion) => {
    const leaves = this.getCombinationLeaves(sourceQuestion);

    if (leaves === null) {
      message.error(
        trans(
          "twoWayTest.combinationNodeIdMissing",
          "组合题节点缺少稳定ID，无法关联",
        ),
      );
      return;
    }

    if (Number(sourceQuestion?.type) !== 6 || leaves.length === 0) {
      message.error(
        trans(
          "twoWayTest.onlyCombinationSupportsLeafAssociation",
          "只有组合题可以使用叶子关联",
        ),
      );
      return;
    }

    const startNo = this.getCurrentTopLevelQuestionNo();

    this.setState({
      combinationAssociationEndNo: startNo
        ? startNo + leaves.length - 1
        : leaves.length,
      combinationAssociationSource: sourceQuestion,
      combinationAssociationVisible: true,
    });
  };

  closeCombinationAssociationModal = () => {
    this.setState({
      combinationAssociationEndNo: null,
      combinationAssociationSource: null,
      combinationAssociationVisible: false,
    });
  };

  changeCombinationAssociationEndNo = (value) => {
    this.setState({
      combinationAssociationEndNo: value,
    });
  };

  getCombinationAssociationValidation = () => {
    const leaves = this.getCombinationLeaves(
      this.state.combinationAssociationSource,
    );
    const startNo = this.getCurrentTopLevelQuestionNo();
    const endNo = Number(this.state.combinationAssociationEndNo);
    const questionOptions = this.getTopLevelQuestionOptions();

    if (!leaves || leaves.length === 0) {
      return {
        message: trans("twoWayTest.selectCombinationQuestion", "请选择组合题"),
        valid: false,
      };
    }

    if (!startNo || !Number.isInteger(endNo) || endNo < startNo) {
      return {
        message: trans(
          "twoWayTest.endPositionMustIncludeCurrent",
          "结束题号必须包含当前题",
        ),
        valid: false,
      };
    }

    const rangeLength = endNo - startNo + 1;

    if (rangeLength !== leaves.length) {
      return {
        message: trans(
          "twoWayTest.leafPositionCountMismatch",
          "组合题有 {$count} 个叶子题，题号范围必须正好是 {$count} 道连续题",
          { count: leaves.length },
        ),
        valid: false,
      };
    }

    const targetOptions = questionOptions.slice(startNo - 1, endNo);

    if (targetOptions.length !== leaves.length) {
      return {
        message: trans(
          "twoWayTest.notEnoughFollowingPositions",
          "当前细目表后续题数不够，不能完成连续关联",
        ),
        valid: false,
      };
    }

    if (targetOptions.some((option) => option.disabled)) {
      return {
        message: trans(
          "twoWayTest.rangeContainsNestedQuestions",
          "范围内已有子题结构，请先调整成普通题后再关联组合题",
        ),
        valid: false,
      };
    }

    const expectedLabels = Array.from({ length: leaves.length }).map(
      (_, index) => String(startNo + index),
    );
    const actualLabels = targetOptions.map((option) => option.label);

    if (expectedLabels.join(",") !== actualLabels.join(",")) {
      return {
        message: trans(
          "twoWayTest.positionsMustBeConsecutive",
          "题号范围必须连续",
        ),
        valid: false,
      };
    }

    return {
      message: trans(
        "twoWayTest.leafAssociationSummary",
        "当前试卷第 {$startNo}-{$endNo} 题将连续对应组合题的 {$count} 个叶子题",
        { count: leaves.length, endNo, startNo },
      ),
      targetOptions,
      valid: true,
    };
  };

  renderCombinationAssociationRange = () => {
    const children = this.getCombinationChildren(
      this.state.combinationAssociationSource,
    );
    const startNo = this.getCurrentTopLevelQuestionNo();
    const endNo = Number(this.state.combinationAssociationEndNo);

    if (!startNo || !endNo || children.length === 0) {
      return "";
    }

    return `${startNo}-${endNo}`;
  };

  applyCombinationAssociation = () => {
    const validation = this.getCombinationAssociationValidation();

    if (!validation.valid) {
      message.error(validation.message);
      return;
    }

    const sourceQuestion = this.state.combinationAssociationSource;
    const sourceQuestionId = this.getQuestionId(sourceQuestion);
    const leaves = this.getCombinationLeaves(sourceQuestion);
    const questionTypeList = JSON.parse(
      JSON.stringify(this.state.questionTypeList),
    );
    const associationPlan = buildCombinationLeafAssociationPlan({
      leaves,
      questionTypeList,
      targetOptions: validation.targetOptions,
    });

    if (!associationPlan) {
      message.error(
        trans(
          "twoWayTest.invalidLeafPaths",
          "组合题叶子路径无效，未修改任何关联",
        ),
      );
      return;
    }

    this.releaseQuestionAssociationsBySource(
      questionTypeList,
      sourceQuestionId,
      null,
      sourceQuestion,
    );

    for (const {
      leafQuestion,
      leafQuestionId,
      strategy,
      target,
    } of associationPlan) {
      this.setQuestionAssociation(target, leafQuestionId, strategy);
      target.associationSourceSnapshot = sourceQuestion;
      target.sonQuestionList = null;
      target.sonQuestionScores = null;
      target.virtualAssociation = null;
      if (leafQuestion?.questionScore != undefined) {
        target.questionScore = leafQuestion.questionScore;
      }
    }

    this.setState(
      {
        combinationAssociationEndNo: null,
        combinationAssociationSource: null,
        combinationAssociationVisible: false,
        questionTypeList,
      },
      () => {
        this.selectNextUnassociatedQuestion(questionTypeList, sourceQuestionId);
      },
    );
    message.success(
      trans("twoWayTest.leafAssociationCompleted", "已完成组合题叶子关联"),
    );
  };

  applyCombinationAsSingleAssociation = (sourceQuestion) => {
    const { prentQuestionNum, childenQuestionNum, questionTypeList } =
      this.state;
    const children = this.getCombinationChildren(sourceQuestion);
    const sourceQuestionId = this.getQuestionId(sourceQuestion);

    if (Number(sourceQuestion?.type) !== 6 || children.length === 0) {
      message.error(
        trans(
          "twoWay.combinationAssociation.onlyCombinationAsSingle",
          "只有组合题可以关联为单题",
        ),
      );
      return;
    }

    if (prentQuestionNum == undefined || childenQuestionNum == undefined) {
      message.error(
        trans(
          "twoWay.association.selectCurrentQuestion",
          "请先选择当前细目表题目",
        ),
      );
      return;
    }

    const questionTypeListCopy = JSON.parse(JSON.stringify(questionTypeList));
    this.releaseQuestionAssociationsBySource(
      questionTypeListCopy,
      sourceQuestionId,
      {
        moduleIndex: prentQuestionNum,
        questionIndex: childenQuestionNum,
      },
      sourceQuestion,
      false,
    );
    const target =
      questionTypeListCopy[prentQuestionNum]?.questionList?.[
        childenQuestionNum
      ];

    if (!target) {
      message.error(
        trans(
          "twoWay.association.currentQuestionNotFound",
          "未找到当前细目表题目",
        ),
      );
      return;
    }

    if (
      Array.isArray(target?.sonQuestionList) &&
      target.sonQuestionList.length > 0
    ) {
      message.error(
        trans(
          "twoWay.combinationAssociation.targetHasChildren",
          "当前题已有子题，请使用关联组合或先调整结构",
        ),
      );
      return;
    }

    this.setQuestionAssociation(
      target,
      sourceQuestionId,
      buildQuestionAssociationStrategy(sourceQuestion, {
        bindCombinationAsSingle: true,
      }),
    );
    target.associationSourceSnapshot = sourceQuestion;
    target.virtualAssociation = this.buildQuestionAssociationPlan(
      target,
      sourceQuestion,
      prentQuestionNum,
      childenQuestionNum,
    );

    this.setState(
      {
        questionTypeList: questionTypeListCopy,
      },
      () => {
        this.selectNextUnassociatedQuestion(
          questionTypeListCopy,
          sourceQuestionId,
        );
      },
    );
    message.success(
      trans(
        "twoWay.combinationAssociation.singleAssociationSuccess",
        "已关联为当前单题",
      ),
    );
  };

  openCombinationSingleAssociationConfirm = (sourceQuestion) => {
    const children = this.getCombinationChildren(sourceQuestion);
    const currentNo = this.getCurrentTopLevelQuestionNo();

    if (Number(sourceQuestion?.type) !== 6 || children.length === 0) {
      message.error(
        trans(
          "twoWay.combinationAssociation.onlyCombinationAsSingle",
          "只有组合题可以关联为单题",
        ),
      );
      return;
    }

    Modal.confirm({
      title: trans(
        "twoWay.combinationAssociation.singleConfirmTitle",
        "关联为单题",
      ),
      content: trans(
        "twoWay.combinationAssociation.singleConfirmContent",
        "把组合题 {$count} 个小问挂到当前第 {$currentNo} 题，题号不变。错题打印使用组合题题干和已挂小问。",
        { count: children.length, currentNo: currentNo || "-" },
      ),
      okText: trans("twoWay.confirmAssociation", "确认关联"),
      cancelText: trans("twoWay.cancel", "取消"),
      onOk: () => {
        this.applyCombinationAsSingleAssociation(sourceQuestion);
      },
    });
  };

  getCombinationSourceRangeText = () => {
    const sourceQuestion = this.state.combinationAssociationSource;
    const children = this.getCombinationChildren(sourceQuestion);

    if (children.length === 0) {
      return "-";
    }

    const firstLabel = this.getCombinationChildLabel(0);
    const lastLabel = this.getCombinationChildLabel(children.length - 1);

    return firstLabel === lastLabel ? firstLabel : `${firstLabel}-${lastLabel}`;
  };

  getFillBlankParts = (question) => {
    return getQuestionFillBlankParts(question);
  };

  openBlankAssociationModal = (sourceQuestion) => {
    const blankParts = this.getFillBlankParts(sourceQuestion);

    if (blankParts.length === 0) {
      message.error(
        trans(
          "twoWayTest.onlyV2FillSupportsBlankAssociation",
          "只有声明 V2 fill 空位的题目可以关联填空",
        ),
      );
      return;
    }

    const startNo = this.getCurrentTopLevelQuestionNo();
    const currentQuestion =
      this.state.questionTypeList?.[this.state.prentQuestionNum]
        ?.questionList?.[this.state.childenQuestionNum];
    const numberingMode =
      getDefaultBlankAssociationNumberingMode(currentQuestion);

    this.setState({
      blankAssociationEndNo: startNo
        ? numberingMode === BLANK_ASSOCIATION_NUMBERING_MODE.subquestion
          ? startNo
          : startNo + blankParts.length - 1
        : blankParts.length,
      blankAssociationNumberingMode: numberingMode,
      blankAssociationSource: sourceQuestion,
      blankAssociationVisible: true,
    });
  };

  closeBlankAssociationModal = () => {
    this.setState({
      blankAssociationEndNo: null,
      blankAssociationNumberingMode:
        BLANK_ASSOCIATION_NUMBERING_MODE.continuous,
      blankAssociationSource: null,
      blankAssociationVisible: false,
    });
  };

  changeBlankAssociationNumberingMode = (numberingMode) => {
    const blankParts = this.getFillBlankParts(
      this.state.blankAssociationSource,
    );
    const startNo = this.getCurrentTopLevelQuestionNo();

    this.setState({
      blankAssociationEndNo:
        numberingMode === BLANK_ASSOCIATION_NUMBERING_MODE.subquestion
          ? startNo
          : startNo + blankParts.length - 1,
      blankAssociationNumberingMode: numberingMode,
    });
  };

  changeBlankAssociationEndNo = (value) => {
    this.setState({
      blankAssociationEndNo: value,
    });
  };

  getBlankAssociationValidation = () => {
    const blankParts = this.getFillBlankParts(
      this.state.blankAssociationSource,
    );
    const startNo = this.getCurrentTopLevelQuestionNo();
    const endNo = Number(this.state.blankAssociationEndNo);
    const questionOptions = this.getTopLevelQuestionOptions();
    const numberingMode = this.state.blankAssociationNumberingMode;

    if (blankParts.length === 0) {
      return {
        message: trans(
          "twoWay.blankAssociation.selectBlankQuestion",
          "请选择带空位的填空题",
        ),
        valid: false,
      };
    }

    if (!startNo || !Number.isInteger(endNo) || endNo < startNo) {
      return {
        message: trans(
          "twoWay.association.endQuestionMustIncludeCurrent",
          "结束题号必须包含当前题",
        ),
        valid: false,
      };
    }

    if (numberingMode === BLANK_ASSOCIATION_NUMBERING_MODE.subquestion) {
      const targetOption = questionOptions[startNo - 1];
      const childQuestions = Array.isArray(
        targetOption?.question?.sonQuestionList,
      )
        ? targetOption.question.sonQuestionList
        : [];

      if (
        !targetOption ||
        (targetOption.disabled && childQuestions.length === 0)
      ) {
        return {
          message: trans(
            "twoWay.blankAssociation.currentQuestionCannotGenerateSubquestions",
            "当前题不能生成子题号，请先调整成普通题",
          ),
          valid: false,
        };
      }

      if (
        childQuestions.length > 0 &&
        childQuestions.length !== blankParts.length
      ) {
        return {
          message: trans(
            "twoWay.blankAssociation.childCountMismatch",
            "当前题已有 {$childCount} 个子题，和填空题 {$blankCount} 个空不一致",
            {
              blankCount: blankParts.length,
              childCount: childQuestions.length,
            },
          ),
          valid: false,
        };
      }

      const targetLabels = buildBlankAssociationTargetLabels({
        blankCount: blankParts.length,
        numberingMode,
        startNo,
      });

      return {
        message: trans(
          "twoWay.blankAssociation.subquestionValidationSummary",
          "当前试卷第 {$startLabel}-{$endLabel} 题将对应填空题的 {$count} 个空",
          {
            count: blankParts.length,
            endLabel: targetLabels.at(-1),
            startLabel: targetLabels[0],
          },
        ),
        targetLabels,
        targetOptions: [targetOption],
        valid: true,
      };
    }

    const rangeLength = endNo - startNo + 1;

    if (rangeLength !== blankParts.length) {
      return {
        message: trans(
          "twoWay.blankAssociation.rangeMustMatchBlankCount",
          "填空题有 {$count} 个空，题号范围必须正好是 {$count} 道连续题",
          { count: blankParts.length },
        ),
        valid: false,
      };
    }

    const targetOptions = questionOptions.slice(startNo - 1, endNo);

    if (targetOptions.length !== blankParts.length) {
      return {
        message: trans(
          "twoWay.association.followingQuestionCountInsufficient",
          "当前细目表后续题数不够，不能完成连续关联",
        ),
        valid: false,
      };
    }

    if (targetOptions.some((option) => option.disabled)) {
      return {
        message: trans(
          "twoWay.blankAssociation.rangeContainsChildStructure",
          "范围内已有子题结构，请先调整成普通题后再关联填空题",
        ),
        valid: false,
      };
    }

    const expectedLabels = Array.from({ length: blankParts.length }).map(
      (_, index) => String(startNo + index),
    );
    const actualLabels = targetOptions.map((option) => option.label);

    if (expectedLabels.join(",") !== actualLabels.join(",")) {
      return {
        message: trans(
          "twoWay.association.questionNumberRangeMustBeContinuous",
          "题号范围必须连续",
        ),
        valid: false,
      };
    }

    return {
      message: trans(
        "twoWay.blankAssociation.continuousValidationSummary",
        "当前试卷第 {$startNo}-{$endNo} 题将连续对应填空题的 {$count} 个空",
        { count: blankParts.length, endNo, startNo },
      ),
      targetLabels: buildBlankAssociationTargetLabels({
        blankCount: blankParts.length,
        numberingMode,
        startNo,
      }),
      targetOptions,
      valid: true,
    };
  };

  renderBlankAssociationRange = () => {
    const blankParts = this.getFillBlankParts(
      this.state.blankAssociationSource,
    );
    const startNo = this.getCurrentTopLevelQuestionNo();
    const endNo = Number(this.state.blankAssociationEndNo);

    if (!startNo || !endNo || blankParts.length === 0) {
      return "";
    }

    if (
      this.state.blankAssociationNumberingMode ===
      BLANK_ASSOCIATION_NUMBERING_MODE.subquestion
    ) {
      const targetLabels = buildBlankAssociationTargetLabels({
        blankCount: blankParts.length,
        numberingMode: this.state.blankAssociationNumberingMode,
        startNo,
      });

      return targetLabels.length === 1
        ? targetLabels[0]
        : `${targetLabels[0]}-${targetLabels.at(-1)}`;
    }

    return `${startNo}-${endNo}`;
  };

  getBlankSourceRangeText = () => {
    const blankParts = this.getFillBlankParts(
      this.state.blankAssociationSource,
    );

    if (blankParts.length === 0) {
      return "-";
    }

    return blankParts.length === 1
      ? trans("twoWay.blankAssociation.blankLabel", "空{$index}", {
          index: "1",
        })
      : trans("twoWay.blankAssociation.blankRange", "空1-空{$count}", {
          count: String(blankParts.length),
        });
  };

  renderBlankPartLabel = (blankPart, blankIndex) =>
    trans("twoWay.blankAssociation.blankLabel", "空{$index}", {
      index: String(blankPart.label || blankIndex + 1),
    });

  renderAssociationModeLabel = (modeValue) => {
    const copy = ASSOCIATION_MODE_COPY_BY_VALUE[modeValue];
    return copy ? trans(copy.key, copy.fallback) : modeValue;
  };

  renderAssociationModeTitle = (modeOption, modeTips) =>
    modeTips[modeOption.value] ||
    this.renderAssociationModeLabel(modeOption.value);

  applyBlankAssociation = () => {
    const validation = this.getBlankAssociationValidation();

    if (!validation.valid) {
      message.error(validation.message);
      return;
    }

    const sourceQuestion = this.state.blankAssociationSource;
    const sourceQuestionId = this.getQuestionId(sourceQuestion);
    const blankParts = this.getFillBlankParts(sourceQuestion);
    const questionTypeList = JSON.parse(
      JSON.stringify(this.state.questionTypeList),
    );
    const numberingMode = this.state.blankAssociationNumberingMode;

    this.releaseQuestionAssociationsBySource(
      questionTypeList,
      sourceQuestionId,
      null,
      sourceQuestion,
    );

    if (numberingMode === BLANK_ASSOCIATION_NUMBERING_MODE.subquestion) {
      const targetOption = validation.targetOptions[0];
      const target =
        questionTypeList[targetOption.moduleIndex]?.questionList?.[
          targetOption.questionIndex
        ];
      const childQuestions = Array.isArray(target?.sonQuestionList)
        ? target.sonQuestionList
        : [];
      Object.assign(
        target,
        buildBlankSubquestionAssociationPatch({
          blankParts,
          childQuestions,
          parentScore: target?.questionScore,
          questionType: target?.type,
          sourceQuestionId,
        }),
      );
      delete target.associationList;
      target.associationSourceSnapshot = sourceQuestion;
      delete target.blankSplitAssociation;
      delete target.combinationSplitAssociation;
      target.virtualAssociation = null;
    } else {
      for (const [
        blankOrder,
        targetOption,
      ] of validation.targetOptions.entries()) {
        const { moduleIndex, questionIndex } = targetOption;
        const target =
          questionTypeList[moduleIndex]?.questionList?.[questionIndex];
        if (!target) {
          continue;
        }

        this.setQuestionAssociation(
          target,
          sourceQuestionId,
          buildBlankAssociationStrategy(blankParts[blankOrder]),
        );
        target.associationSourceSnapshot = sourceQuestion;
        target.sonQuestionList = null;
        target.sonQuestionScores = null;
        target.virtualAssociation = null;
      }
    }

    this.setState(
      {
        blankAssociationEndNo: null,
        blankAssociationNumberingMode:
          BLANK_ASSOCIATION_NUMBERING_MODE.continuous,
        blankAssociationSource: null,
        blankAssociationVisible: false,
        questionTypeList,
      },
      () => {
        this.selectNextUnassociatedQuestion(questionTypeList, sourceQuestionId);
      },
    );
    message.success(
      trans("twoWay.blankAssociation.success", "已完成填空题关联"),
    );
  };

  searchQuestionAttribute = (e) => {
    const { value } = e.target;

    let treeData = [];
    if (this.state.isAttainment) {
      treeData = this.state.qualityData;
    } else if (this.state.isKnowLedge) {
      treeData = this.state.knowledgeTree;
    } else if (this.state.isChapter) {
      treeData = this.state.chapterThree;
    }

    const expandedKeys = this.state.flatThree
      .map((item) => {
        if (item.value.includes(value)) {
          return getParentKey(item.key, treeData);
        }
        return null;
      })
      .filter((item, index, self) => item && self.indexOf(item) === index);
    this.setState({
      expandedKeys,
      searchQuValue: value,
      autoExpandParent: true,
    });
  };

  selectSonQuestion = (index, index_, k) => {
    this.setState({
      checkParent: index,
      checkChild: index_,
      selectedQuestionPath: [k],
      sonQuestionIndex: k,
    });
  };

  selectQuestion = (index, ind) => {
    this.setState({
      checkParent: index,
      checkChild: ind,
      selectedQuestionPath: null,
      sonQuestionIndex: null,
    });
  };

  moveQuestionPlacement = (moduleIndex, questionIndex, direction) => {
    const questionTypeList = JSON.parse(
      JSON.stringify(this.state.questionTypeList),
    );
    const moduleItem = questionTypeList[moduleIndex];
    const result = moveQuestionPlacementUnit(
      moduleItem?.questionList,
      questionIndex,
      direction,
    );

    if (!moduleItem || !result.moved) {
      return;
    }

    moduleItem.questionList = result.questionList;
    // 题号变化会影响关联展示文案，因此仅重算当前题块内已有的展示计划。
    for (const [index, question] of moduleItem.questionList.entries()) {
      this.refreshAssociationPlanForQuestion(question, moduleIndex, index);
    }

    const nextState = { questionTypeList };
    if (this.state.checkParent === moduleIndex) {
      nextState.checkChild = result.indexMap[this.state.checkChild];
    }
    if (this.state.prentQuestionNum === moduleIndex) {
      nextState.childenQuestionNum =
        result.indexMap[this.state.childenQuestionNum];
    }

    this.setState(nextState);
  };

  isSonQuestionSelected = (index, index_, k) => {
    const { checkParent, checkChild, sonQuestionIndex } = this.state;
    return (
      checkParent == index && checkChild == index_ && sonQuestionIndex == k
    );
  };

  isQuestionSelected = (index, index_) => {
    const { checkParent, checkChild, selectedQuestionPath, sonQuestionIndex } =
      this.state;
    return (
      checkParent == index &&
      checkChild == index_ &&
      selectedQuestionPath == null &&
      sonQuestionIndex == undefined
    );
  };

  fillDownChange = () => {
    let score = this.state.modalSonQuestionsData[0].questionScore;
    let cloneModalSonQuestionsData = JSON.parse(
      JSON.stringify(this.state.modalSonQuestionsData),
    );
    for (const item of cloneModalSonQuestionsData) {
      item.questionScore = score;
    }
    this.setState({
      modalSonQuestionsData: cloneModalSonQuestionsData,
    });
  };

  triggerSave = (isPreview) => {
    this.setState(
      {
        isPreview: isPreview,
      },
      () => {
        this.save((res) => {
          if (isPreview) {
            const paperId =
              res?.content?.paperId ||
              this.props.saveProps?.paperId ||
              this.testId;

            if (paperId && this.state.isPreview) {
              window.location.href = `${window.location.origin}/exam#/detail/true/true/${this.state.subjectId}/${paperId}`;
            }
          } else {
            message.success(res.message);
          }
        });
      },
    );
  };

  renderClickableTreeItem = ({
    data,
    keyName,
    idName,
    dialogFn,
    index,
    ind,
    sonQuIndex = null,
    questionPath = null,
    isSon = false,
    disabled = false,
  }) => {
    const isSelected = isSon
      ? Array.isArray(questionPath)
        ? this.isDescendantQuestionSelected(index, ind, questionPath)
        : this.isSonQuestionSelected(index, ind, sonQuIndex)
      : this.isQuestionSelected(index, ind);
    const names = data[keyName];

    const handleClick = () => {
      this[dialogFn]({
        prentQuestionNum: index,
        childenQuestionNum: ind,
        sonQuestionNum: sonQuIndex,
        questionPath,
        ids: data[idName] || [],
      });
    };
    const text = Array.isArray(names) ? names.join(",") : names;

    return (
      <div
        style={{
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          overflow: "hidden",
        }}
      >
        {disabled ? (
          <span className={styles.lockedStructureText}>{text || "-"}</span>
        ) : names && names.length > 0 ? (
          <HoverTooltip
            handelClick={handleClick}
            text={text}
            maxWidth={"100%"}
          />
        ) : (
          <i
            className={[
              icon.iconfont,
              styles.addIcon,
              isSelected ? styles.lightIcon : "",
            ].join(" ")}
            onClick={handleClick}
          >
            &#xe759;
          </i>
        )}
      </div>
    );
  };

  renderQuestionTypeCell = (question) => {
    const strategyLabel = getAssociationStrategyLabel(
      question?.associationStrategy,
    );
    const strategyBadgeClassMap = {
      [ASSOCIATION_STRATEGY_TYPES.blank]: styles.blankSplitBadge,
      [ASSOCIATION_STRATEGY_TYPES.leaf]: styles.comboChildBadge,
      [ASSOCIATION_STRATEGY_TYPES.group]: styles.comboGroupBadge,
    };
    const strategyTitleMap = {
      [ASSOCIATION_STRATEGY_TYPES.blank]: trans(
        "twoWay.association.blankStrategyTitle",
        "对应填空题{$label}",
        { label: strategyLabel },
      ),
      [ASSOCIATION_STRATEGY_TYPES.leaf]: trans(
        "twoWay.association.childStrategyTitle",
        "对应组合题{$label}",
        { label: strategyLabel },
      ),
      [ASSOCIATION_STRATEGY_TYPES.group]: trans(
        "twoWay.association.groupStrategyTitle",
        "组合题整体关联到当前题",
      ),
    };

    return (
      <div className={styles.questionTypeCell}>
        <span>{this.getQuestionTypeText(question)}</span>
        {strategyLabel ? (
          <Tooltip
            title={
              strategyTitleMap[question?.associationStrategy?.type] ||
              strategyLabel
            }
          >
            <span
              className={
                strategyBadgeClassMap[question?.associationStrategy?.type] ||
                styles.comboChildBadge
              }
            >
              {strategyLabel}
            </span>
          </Tooltip>
        ) : null}
      </div>
    );
  };

  renderAssociationOperationCell = (
    question,
    index,
    ind,
    isSelected,
    disabled = false,
  ) => {
    const hasAssociation = question?.questionId != undefined;

    if (disabled) {
      return <div className={styles.associationOperationCell}></div>;
    }

    if (hasAssociation) {
      return (
        <div className={styles.associationOperationCell}>
          <span
            onClick={this.openJoinQuestionModal.bind(
              this,
              index,
              ind,
              this.getQuestionAssociationIds(question),
              true,
            )}
            className={isSelected ? styles.isView : styles.view}
          >
            {trans("global.view1", "查看")}
          </span>
          <button
            type="button"
            className={styles.associationCancelButton}
            title={trans("twoWay.association.cancel", "取消关联")}
            onClick={this.cancelQuestionAssociationFromRow.bind(
              this,
              index,
              ind,
            )}
          >
            ×
          </button>
        </div>
      );
    }

    return (
      <div className={styles.associationOperationCell}>
        <i
          className={[
            icon.iconfont,
            styles.addIcon,
            isSelected ? styles.lightIcon : "",
          ].join(" ")}
          onClick={this.openJoinQuestionModal.bind(this, index, ind, [], true)}
        >
          &#xe759;
        </i>
      </div>
    );
  };

  openChildQuestionsFromRow = (index, ind, event) => {
    event?.preventDefault?.();
    event?.stopPropagation?.();
    this.changeIfChild(index, ind, 1);
  };

  clearChildQuestionsFromRow = (index, ind, event) => {
    event?.preventDefault?.();
    event?.stopPropagation?.();
    this.changeIfChild(index, ind, 0);
  };

  renderChildQuestionOperationCell = (
    question,
    index,
    ind,
    isSelected,
    disabled = false,
  ) => {
    const childQuestions = Array.isArray(question?.sonQuestionList)
      ? question.sonQuestionList
      : [];

    if (childQuestions.length > 0) {
      return (
        <div className={[styles.flexRow, styles.ifChildBox].join(" ")}>
          <button
            type="button"
            className={[
              styles.childQuestionCountButton,
              isSelected ? styles.isView : styles.view,
            ].join(" ")}
            onClick={this.showChild.bind(this, childQuestions, index, ind)}
          >
            {trans("twoWay.childQuestionCount", "子题数")}
            {childQuestions.length}
          </button>
          {disabled ? null : (
            <button
              type="button"
              className={styles.associationCancelButton}
              title={trans("twoWay.clearChildQuestions", "清空子题")}
              onClick={this.clearChildQuestionsFromRow.bind(this, index, ind)}
            >
              ×
            </button>
          )}
        </div>
      );
    }

    if (disabled) {
      return null;
    }

    return (
      <button
        type="button"
        className={[
          styles.childQuestionAddButton,
          icon.iconfont,
          styles.addIcon,
          isSelected ? styles.lightIcon : "",
        ].join(" ")}
        onClick={this.openChildQuestionsFromRow.bind(this, index, ind)}
      >
        &#xe759;
      </button>
    );
  };

  changeQuestionAssociationMode = (index, ind, nextMode) => {
    const questionTypeList = JSON.parse(
      JSON.stringify(this.state.questionTypeList),
    );
    const target = questionTypeList[index]?.questionList[ind];

    if (!target?.virtualAssociation) {
      return;
    }

    target.virtualAssociation = changeVirtualAssociationMode({
      plan: target.virtualAssociation,
      nextMode,
    });

    this.setState({
      questionTypeList,
    });
  };

  getSuggestedChildCount = (question) => {
    if (question?.virtualAssociation?.mode !== "parent-only") {
      return 0;
    }

    const count =
      question?.virtualAssociation?.sourceSummary?.fragmentCount ||
      question?.virtualAssociation?.targetSummary?.fragmentCount;

    return count && count > 1 ? count : 0;
  };

  canCollectFollowingQuestions = (index, ind, question) => {
    if (
      Array.isArray(question?.sonQuestionList) &&
      question.sonQuestionList.length > 0
    ) {
      return 0;
    }

    const count = this.getSuggestedChildCount(question);
    const questionList = this.state.questionTypeList[index]?.questionList || [];

    if (!count || questionList.length - ind < count) {
      return 0;
    }

    const followingRows = questionList.slice(ind + 1, ind + count);
    const hasNestedRow = followingRows.some(
      (row) =>
        Array.isArray(row?.sonQuestionList) && row.sonQuestionList.length > 0,
    );

    if (hasNestedRow) {
      return 0;
    }

    return count;
  };

  applyCollectFollowingQuestions = (index, ind, count) => {
    const questionTypeList = JSON.parse(
      JSON.stringify(this.state.questionTypeList),
    );
    const moduleItem = questionTypeList[index];
    const questionList = moduleItem?.questionList || [];
    const rows = questionList.slice(ind, ind + count);
    const parent = rows[0];

    if (!parent || rows.length < count) {
      message.error(
        trans(
          "twoWay.childQuestions.followingQuestionCountInsufficient",
          "后续题目数量不足，不能生成子题",
        ),
      );
      return;
    }

    parent.sonQuestionList = rows.map((row) => {
      const child = {
        ...row,
        checked: false,
        indicatorName: row.indicatorName || [],
      };

      delete child.associationCompatibility;
      delete child.associationList;
      delete child.associationStrategy;
      delete child.associationSourceSnapshot;
      delete child.id;
      delete child.index;
      delete child.personalityQuestions;
      delete child.questionId;
      delete child.questionSerialNumber;
      delete child.sonQuestionList;
      delete child.virtualAssociation;

      return child;
    });
    Object.assign(parent, synchronizeQuestionTreeScores(parent));

    questionList.splice(ind + 1, count - 1);
    moduleItem.questionNum = questionList.length;
    this.refreshAssociationPlanForQuestion(parent, index, ind);

    this.setState({
      checkChild: ind,
      checkParent: index,
      questionTypeList,
      selectedQuestionPath: null,
      sonQuestionIndex: null,
    });

    message.success(
      trans(
        "twoWay.childQuestions.collectFollowingSuccess",
        "已把后续题目收为当前题的子题",
      ),
    );
  };

  collectFollowingQuestionsAsChildren = (index, ind, count) => {
    const startNo = this.renderNo(index, ind);
    const endNo = startNo + count - 1;

    Modal.confirm({
      title: trans(
        "twoWay.childQuestions.collectConfirmTitle",
        "确认收为子题？",
      ),
      content: trans(
        "twoWay.childQuestions.collectConfirmContent",
        "会把第 {$startNo}-{$endNo} 题合并为第 {$startNo} 题的 {$count} 个子题，合并后显示为 {$startNo}.1-{$startNo}.{$count}。",
        { count, endNo, startNo },
      ),
      okText: trans("twoWay.childQuestions.generate", "生成子题"),
      cancelText: trans("twoWay.cancel", "取消"),
      onOk: () => {
        this.applyCollectFollowingQuestions(index, ind, count);
      },
    });
  };

  renderAssociationStrategyBar = (question, index, ind) => {
    if (!question?.questionId || !question.virtualAssociation) {
      return null;
    }

    const {
      availableModes,
      mode,
      note,
      previewPairs,
      sourceSummary,
      sourceQuestionLabel,
      targetSummary,
    } = question.virtualAssociation;
    const sourceText =
      sourceSummary?.structureKind === "fillBlank"
        ? trans(
            "twoWay.association.sourceFillBlankQuestion",
            "{$count} 空填空题",
            { count: sourceSummary.fragmentCount },
          )
        : sourceSummary?.structureKind === "combination"
          ? trans(
              "twoWay.association.sourceCombinationQuestion",
              "{$count} 小问组合题",
              { count: sourceSummary.fragmentCount },
            )
          : sourceSummary?.typeLabel ||
            trans("twoWay.association.singleQuestion", "单题");
    const targetText =
      targetSummary?.structureKind === "childQuestions"
        ? trans("twoWay.association.targetChildQuestions", "{$count} 个子题", {
            count: targetSummary.fragmentCount,
          })
        : targetSummary?.structureKind === "fillBlank"
          ? trans("twoWay.association.targetBlankSlots", "{$count} 个空", {
              count: targetSummary.fragmentCount,
            })
          : targetSummary?.structureLabel ||
            trans("twoWay.association.singleQuestion", "单题");
    const currentNo = this.renderNo(index, ind);
    const strategySummary = trans(
      "twoWay.association.strategySummary",
      "原卷第 {$sourceQuestionLabel} 题：{$sourceText}；当前第 {$currentNo} 题：{$targetText}",
      {
        currentNo,
        sourceQuestionLabel,
        sourceText,
        targetText,
      },
    );
    const shouldShowPairs =
      mode === "parent-child" || mode === "blank-compatible";
    const isSingleTargetParentChild =
      mode === "parent-child" &&
      targetSummary?.fragmentCount === 1 &&
      sourceSummary?.structureKind === "combination" &&
      sourceSummary?.fragmentCount > 1;
    const downstreamNote = isSingleTargetParentChild
      ? trans(
          "twoWay.association.singleTargetParentChildNote",
          "当前题号不变；错题打印使用组合题题干和已挂小问。",
        )
      : trans(
          "twoWay.association.downstreamNote",
          "保存后，错题分析和打印按当前题号展示；子题会记录对应的原卷来源。",
        );
    const collectCount = this.canCollectFollowingQuestions(
      index,
      ind,
      question,
    );
    const modeTips = {
      single: trans(
        "twoWay.associationMode.singleTip",
        "只把当前题关联到原卷整题，不处理子题。",
      ),
      "parent-child": trans(
        "twoWay.associationMode.parentChildTip",
        "关联原卷组合题的小问；当前题号保持不变。",
      ),
      "blank-compatible": trans(
        "twoWay.associationMode.blankCompatibleTip",
        "当前题已有子题时，按顺序关联原卷填空题的空位。",
      ),
      "parent-only": trans(
        "twoWay.associationMode.parentOnlyTip",
        "当前还不是子题结构，先生成子题再继续关联。",
      ),
    };

    return (
      <div className={styles.associationStrategyRow}>
        <div className={styles.associationStrategyMain}>
          <div className={styles.associationStrategyMeta}>
            <span className={styles.associationStrategyLabel}>
              {trans("twoWay.association.questionLabel", "关联题目")}
            </span>
            <span className={styles.associationStrategyBadge}>
              {this.renderAssociationModeLabel(mode)}
            </span>
            <span className={styles.associationStrategySummary}>
              {strategySummary}
            </span>
          </div>
          <div className={styles.associationStrategyNote}>{note}</div>
          <div className={styles.associationInlineActions}>
            <span className={styles.associationInlineActionLabel}>
              {trans("twoWay.association.handlingMethod", "处理方式")}
            </span>
            {availableModes?.map((modeOption) => (
              <button
                type="button"
                title={this.renderAssociationModeTitle(modeOption, modeTips)}
                className={[
                  styles.associationStrategyAction,
                  modeOption.value === mode
                    ? styles.associationStrategyActionActive
                    : "",
                ].join(" ")}
                key={modeOption.value}
                onClick={() => {
                  this.changeQuestionAssociationMode(
                    index,
                    ind,
                    modeOption.value,
                  );
                }}
              >
                {this.renderAssociationModeLabel(modeOption.value)}
              </button>
            ))}
          </div>
          {shouldShowPairs && previewPairs && previewPairs.length > 0 ? (
            <div className={styles.associationPreviewList}>
              {previewPairs.map((pair) => (
                <div
                  className={styles.associationPreviewItem}
                  key={`${pair.targetLabel}-${pair.sourceLabel}`}
                >
                  <span className={styles.associationPreviewTarget}>
                    {trans(
                      "twoWay.association.currentTarget",
                      "当前 {$label}",
                      { label: pair.targetLabel },
                    )}
                  </span>
                  <span className={styles.previewArrow}>{"->"}</span>
                  <span>
                    {trans(
                      "twoWay.association.sourceQuestion",
                      "源题 {$label}",
                      { label: pair.sourceLabel },
                    )}
                  </span>
                </div>
              ))}
            </div>
          ) : null}
          {mode === "single" ? null : (
            <div className={styles.associationDownstreamNote}>
              {downstreamNote}
            </div>
          )}
          {collectCount > 0 ? (
            <div className={styles.collectChildBox}>
              <span>
                {trans(
                  "twoWay.childQuestions.collectSuggestion",
                  "如果第 {$startNo}-{$endNo} 题其实是同一道题的{$count} 个部分，可以先生成第 {$startNo} 题的子题。",
                  {
                    count: collectCount,
                    endNo: currentNo + collectCount - 1,
                    startNo: currentNo,
                  },
                )}
              </span>
              <button
                type="button"
                className={styles.collectChildButton}
                onClick={() => {
                  this.collectFollowingQuestionsAsChildren(
                    index,
                    ind,
                    collectCount,
                  );
                }}
              >
                {trans(
                  "twoWay.childQuestions.generateRange",
                  "生成 {$startNo}.1-{$startNo}.{$count}",
                  { count: collectCount, startNo: currentNo },
                )}
              </button>
            </div>
          ) : null}
        </div>
      </div>
    );
  };

  render() {
    const { subjectList, labelList, stuTypeList, allGradeList } = this.props;

    const {
      IconFont,
      questionTypeList,
      checkParent,
      checkChild,
      originalQuestion,
      sonQuestionNum,
      baseExamNmae,
      subname,
      gradeName,
      questionModalVisible,
      prentQuestionNum,
      childenQuestionNum,
      modalQuestionType,
      isguanlian,
      candidateQuestions,
      associatedQuestions,
    } = this.state;
    const questionList = candidateQuestions;
    const listIds = associatedQuestions;

    let handelQuestionList = [];
    let linkedQuestionIds = [];
    let allLinkedQuestionIds = [];
    let number_ = 0;

    /**
     *
     * @param item
     */
    function getClass(item) {
      if (isguanlian) {
        if (item.questionId) {
          return styles.overAssociation;
        }
      } else {
        if (item.personalityQuestions && item.personalityQuestions.length > 0) {
          return styles.overAssociation;
        }
      }
    }

    if (isguanlian) {
      // 一:关联题目
      //.1）如果是已经关联-展示已关联题目
      if (
        questionTypeList[prentQuestionNum]?.questionList[childenQuestionNum]
          ?.questionId &&
        listIds?.length
      ) {
        handelQuestionList = listIds;
        // 当前题目已经关联的题目id集合
        linkedQuestionIds = this.getQuestionAssociationIds(
          questionTypeList[prentQuestionNum]?.questionList[childenQuestionNum],
        );
      } else {
        //.2) 如果是未关联-展示所有题库题目
        handelQuestionList = questionList;
        // 拿到所有已经被关联的题，用于提示这个题目已被关联
        let number__ = 0;
        for (const item of questionTypeList) {
          if (item.questionList && item.questionList.length > 0) {
            for (const item1 of item.questionList) {
              number__ += 1;
              if (item1.questionId) {
                allLinkedQuestionIds = [
                  ...allLinkedQuestionIds,
                  {
                    id: item1.questionId,
                    linkQuestionNumber: number__,
                  },
                ];
              }
            }
          }
        }
      }
    } else {
      // * 二.相似题推荐
      if (modalQuestionType == "list") {
        // .1) 如果是查看-展示已经关联的相似题目
        handelQuestionList = listIds;
      } else {
        // .2) 如果是修改-展示所有相似题目
        handelQuestionList = questionList;
      }
      linkedQuestionIds =
        questionTypeList[prentQuestionNum]?.questionList[childenQuestionNum]
          ?.personalityQuestions;
    }

    const combinationChildren = this.getCombinationChildren(
      this.state.combinationAssociationSource,
    );
    const combinationValidation = this.getCombinationAssociationValidation();
    const blankParts = this.getFillBlankParts(
      this.state.blankAssociationSource,
    );
    const blankValidation = this.getBlankAssociationValidation();
    const placementUnitsByModule = questionTypeList.map((moduleItem) =>
      buildQuestionPlacementUnits(moduleItem.questionList),
    );

    return (
      <div className={styles.twoWayBox}>
        <Header
          {...{
            time: this.state.saveTime,
            totalScore: this.renderTotal(), // 满分
            difficultyIndex: this.renderDifficult(), // 难度系数
            easyMediumHard: [
              this.renderDiff(1, "questionLevelType"),
              this.renderDiff(2, "questionLevelType"),
              this.renderDiff(3, "questionLevelType"),
            ], // 易中难分布
            originalStats: [
              this.renderDiff(1, "sourceType"),
              this.renderDiff(2, "sourceType"),
              this.renderDiff(3, "sourceType"),
            ], // 原题/原创/改编分布
            onSave: () => {
              this.triggerSave(false);
            }, // 点击“保存”按钮回调
            onPreview: () => {
              this.triggerSave(true);
            }, // 点击“预览试卷”按钮回调
            closePage: () => this.closePage(), // 点击“关闭”按钮回调
          }}
        />

        <div className={styles.twoWayContent}>
          <FormHeader
            {...{
              gradeOptions: allGradeList, // 表单下拉框数据
              subjectOptions: subjectList, // 表单下拉框数据
              categoryOptions: stuTypeList, // 表单下拉框数据
              nameStr: this.testId
                ? false
                : `${baseExamNmae}${gradeName}${subname}`,
              formValues: {
                // 表单录入的value
                grade: this.state.gradeId || undefined,
                subject: this.state.subjectId || undefined,
                category: this.state.type || undefined,
                title: this.state.titleValue || undefined,
              },
              onFormChange: (key, e) => {
                if (key == "grade") {
                  this.changeGradeTotal(e);
                } else if (key == "subject") {
                  this.changeSubjetc(e);
                } else if (key == "category") {
                  this.changeType(e);
                } else if (key == "title") {
                  this.changeTitle(e);
                }
              },
            }}
          />

          {this.state.gradeId != undefined &&
          this.state.subjectId != undefined &&
          this.state.type != undefined ? (
            <>
              <QuestionTypeBar
                {...{
                  errorMessage: this.state.questionTypeLoadError,
                  loading: this.state.questionTypeLoading,
                  onAddQuestionType: this.addQuestionType,
                  onRetry: this.retryQuestionTypeRegistry,
                  questionTypes: this.state.enabledQuestionTypes,
                }}
              />
              <div className={styles.twoWayTable}>
                <TableHeader
                  allChecked={this.state.allChecked}
                  onCheckAllTable={this.onCheckAllTable}
                />
                {questionTypeList && questionTypeList.length > 0
                  ? questionTypeList.map((item, index) => (
                      <div>
                        <div
                          className={[styles.typeTr, styles.flexRow].join(" ")}
                        >
                          <div
                            className={styles.checkTitle}
                            style={{ width: "26px" }}
                          >
                            <Checkbox
                              onChange={this.onCheckAllChange.bind(this, index)}
                              checked={item.checked}
                            />
                          </div>

                          <div className={styles.typeTrTitle}>
                            {convertToChineseNumber(index + 1)}、
                          </div>

                          {this.state[`name${index}`] ? (
                            <div
                              className={[styles.nameBox, styles.flexRow].join(
                                " ",
                              )}
                            >
                              <Input
                                value={item.moduleName}
                                onChange={this.changeNameValue.bind(
                                  this,
                                  index,
                                )}
                                onBlur={this.blur.bind(this, index)}
                              />
                            </div>
                          ) : (
                            <div
                              className={[styles.nameBox, styles.flexRow].join(
                                " ",
                              )}
                            >
                              <div className={styles.typeTrTitle}>
                                {item.moduleName}
                              </div>
                              <i
                                className={[
                                  styles.editName,
                                  icon.iconfont,
                                ].join(" ")}
                                onClick={this.changeName.bind(this, index)}
                              >
                                &#xe7a1;
                              </i>
                            </div>
                          )}

                          <div
                            className={styles.questionScoreBox}
                            style={{ marginLeft: "10px" }}
                          >
                            <span>
                              {trans("analysis.questionScore", "分值：")}：
                            </span>
                            <span className={styles.allScore}>
                              {this.renderAllScore(index)}
                            </span>
                            <Popover
                              placement="top"
                              title={null}
                              content={
                                <div className={styles.batchSCore}>
                                  <InputNumber
                                    min={0}
                                    onChange={this.batchScore.bind(this, index)}
                                  />
                                </div>
                              }
                              trigger="click"
                            >
                              <Tooltip
                                placement="bottom"
                                title={trans(
                                  "global.batchSetScore",
                                  "批量设置每题分值",
                                )}
                              >
                                <i className={[styles.setScore, icon.iconfont]}>
                                  &#xe6b3;
                                </i>
                              </Tooltip>
                            </Popover>
                          </div>

                          <div className={styles.questionNumBox}>
                            <span>{trans("global.questionNum", "题数")}：</span>
                            <InputNumber
                              min={MIN_MODULE_QUESTION_COUNT}
                              defaultValue={1}
                              value={item.questionNum}
                              controls={false}
                              onPressEnter={this.questionNumerChange.bind(
                                this,
                                index,
                              )}
                            />
                          </div>

                          <div
                            className={`${styles.typeTrRight} ${styles["delete-operation-cell"]}`}
                          >
                            <button
                              aria-label={trans("global.delete", "删除")}
                              className={`${styles.rightIcon} ${styles["delete-operation-button"]} ${icon.iconfont}`}
                              onClick={(event) => {
                                event.stopPropagation();
                                this.delParent(index);
                              }}
                              type="button"
                            >
                              &#xe7a8;
                            </button>
                          </div>
                        </div>

                        {item.questionList && item.questionList.length > 0
                          ? item.questionList.map((it, ind) => (
                              <div className={`${styles.childTr}`}>
                                {(() => {
                                  const isCompatibilityLocked =
                                    this.isCompatibilityFollowerQuestion(it);
                                  const isSelected = this.isQuestionSelected(
                                    index,
                                    ind,
                                  );
                                  const canEditRow =
                                    isSelected && !isCompatibilityLocked;
                                  const canEditAttribute = (fieldName) =>
                                    canEditRow ||
                                    canEditBlankAssociationField(it, fieldName);
                                  const placementUnits =
                                    placementUnitsByModule[index];
                                  const placementUnitIndex =
                                    placementUnits.findIndex(
                                      (unit) => unit.start === ind,
                                    );

                                  return (
                                    <Fragment>
                                      <div
                                        onClick={
                                          isCompatibilityLocked
                                            ? undefined
                                            : this.selectQuestion.bind(
                                                this,
                                                index,
                                                ind,
                                              )
                                        }
                                        className={`${this.isQuestionSelected(index, ind) ? styles.check : ""}  ${styles.childenRowBox}`}
                                      >
                                        <div>
                                          <Checkbox
                                            onChange={this.onCheckChange.bind(
                                              this,
                                              index,
                                              ind,
                                            )}
                                            checked={it.checked}
                                            disabled={isCompatibilityLocked}
                                          />
                                          &nbsp;
                                          {this.renderNo(index, ind)}
                                        </div>

                                        {this.renderQuestionTypeCell(it)}

                                        <div>
                                          {hasQuestionChildren(it) ||
                                          (isCompatibilityLocked &&
                                            !canEditAttribute(
                                              "questionScore",
                                            )) ? (
                                            it.questionScore
                                          ) : !it.questionScore ||
                                            canEditAttribute(
                                              "questionScore",
                                            ) ? (
                                            <InputNumber
                                              min={0}
                                              value={it.questionScore || null}
                                              onChange={this.changeCheckScore.bind(
                                                this,
                                                index,
                                                ind,
                                              )}
                                            />
                                          ) : (
                                            <div style={{ padding: "0 11px" }}>
                                              {it.questionScore}
                                            </div>
                                          )}
                                        </div>

                                        <div>
                                          {isCompatibilityLocked &&
                                          !canEditAttribute(
                                            "predictionDifficulty",
                                          ) ? (
                                            <div style={{ padding: "0 11px" }}>
                                              {this.returnFloat(
                                                it.predictionDifficulty,
                                              )}
                                            </div>
                                          ) : !it.predictionDifficulty ||
                                            canEditAttribute(
                                              "predictionDifficulty",
                                            ) ? (
                                            <InputNumber
                                              min={0}
                                              step={0.01}
                                              max={1}
                                              value={it.predictionDifficulty}
                                              onChange={this.changePrediction.bind(
                                                this,
                                                index,
                                                ind,
                                              )}
                                            />
                                          ) : (
                                            <div style={{ padding: "0 11px" }}>
                                              {this.returnFloat(
                                                it.predictionDifficulty,
                                              )}
                                            </div>
                                          )}
                                        </div>

                                        <div>
                                          {isCompatibilityLocked &&
                                          !canEditAttribute(
                                            "questionLevelType",
                                          ) ? (
                                            <div style={{ paddingLeft: "3px" }}>
                                              {
                                                questionLevelMap[
                                                  it.questionLevelType
                                                ]
                                              }
                                            </div>
                                          ) : !it.questionLevelType ||
                                            canEditAttribute(
                                              "questionLevelType",
                                            ) ? (
                                            <Select
                                              value={it.questionLevelType}
                                              placeholder={trans(
                                                "global.selectDifficulty",
                                                "选择难易",
                                              )}
                                              style={{ width: 90 }}
                                              onChange={this.changeDifficult.bind(
                                                this,
                                                index,
                                                ind,
                                              )}
                                            >
                                              <Option value={1}>
                                                {trans("global.easy", "简单")}
                                              </Option>
                                              <Option value={2}>
                                                {trans(
                                                  "global.general",
                                                  "普通",
                                                )}
                                              </Option>
                                              <Option value={3}>
                                                {trans(
                                                  "global.difficult",
                                                  "困难",
                                                )}
                                              </Option>
                                            </Select>
                                          ) : (
                                            <div style={{ paddingLeft: "3px" }}>
                                              {
                                                questionLevelMap[
                                                  it.questionLevelType
                                                ]
                                              }
                                            </div>
                                          )}
                                        </div>

                                        <div
                                          className={styles.smallLargeTitle}
                                          style={{ width: "80px" }}
                                        >
                                          {isCompatibilityLocked &&
                                          !canEditAttribute("sourceType") ? (
                                            sourceTypeMap[it.sourceType]
                                          ) : !it.sourceType ||
                                            canEditAttribute("sourceType") ? (
                                            <Select
                                              value={it.sourceType}
                                              placeholder={trans(
                                                "twoWay.selectQuestionSource",
                                                "选择来源",
                                              )}
                                              style={{ width: 80 }}
                                              onChange={this.changeSource.bind(
                                                this,
                                                index,
                                                ind,
                                              )}
                                            >
                                              <Option value={1}>
                                                {trans(
                                                  "global.Originalquestion",
                                                  "原题",
                                                )}
                                              </Option>
                                              <Option value={2}>
                                                {trans(
                                                  "global.original",
                                                  "原创",
                                                )}
                                              </Option>
                                              <Option value={3}>
                                                {trans("global.adapt", "改编")}
                                              </Option>
                                            </Select>
                                          ) : (
                                            sourceTypeMap[it.sourceType]
                                          )}
                                        </div>

                                        {this.renderClickableTreeItem({
                                          data: it,
                                          keyName: "chapterName",
                                          idName: "chapterId",
                                          dialogFn: "openChapterDialog",
                                          index,
                                          ind,
                                          sonQuIndex: null, // 固定传 null
                                          isSon: false, // 用来切换选中判断函数
                                          disabled:
                                            isCompatibilityLocked &&
                                            !canEditAttribute("chapterId"),
                                        })}

                                        {this.renderClickableTreeItem({
                                          data: it,
                                          keyName: "knowledge",
                                          idName: "knowledgeIds",
                                          dialogFn: "openKnowledgeDialog",
                                          index,
                                          ind,
                                          sonQuIndex: null,
                                          isSon: false,
                                          disabled:
                                            isCompatibilityLocked &&
                                            !canEditAttribute("knowledgeIds"),
                                        })}

                                        {this.renderClickableTreeItem({
                                          data: it,
                                          keyName: "indicatorName",
                                          idName: "indicatorIds",
                                          dialogFn: "openQualityDialog",
                                          index,
                                          ind,
                                          sonQuIndex: null,
                                          isSon: false,
                                          disabled:
                                            isCompatibilityLocked &&
                                            !canEditAttribute("indicatorIds"),
                                        })}

                                        {/* 关联题目 */}
                                        {this.renderAssociationOperationCell(
                                          it,
                                          index,
                                          ind,
                                          canEditRow,
                                          isCompatibilityLocked,
                                        )}

                                        <div>
                                          {this.renderChildQuestionOperationCell(
                                            it,
                                            index,
                                            ind,
                                            isSelected,
                                            isCompatibilityLocked,
                                          )}
                                        </div>

                                        <div>
                                          {isCompatibilityLocked ? null : it.personalityQuestions &&
                                            it.personalityQuestions.length >
                                              0 ? (
                                            <span
                                              onClick={
                                                isCompatibilityLocked
                                                  ? undefined
                                                  : this.openJoinQuestionModal.bind(
                                                      this,
                                                      index,
                                                      ind,
                                                      it.personalityQuestions,
                                                      false,
                                                    )
                                              }
                                              className={
                                                this.isQuestionSelected(
                                                  index,
                                                  ind,
                                                )
                                                  ? styles.isView
                                                  : styles.view
                                              }
                                            >
                                              {trans("global.view1")}{" "}
                                              {it.personalityQuestions.length}
                                            </span>
                                          ) : it.questionId &&
                                            !isCompatibilityLocked ? (
                                            <i
                                              className={[
                                                icon.iconfont,
                                                styles.addIcon,
                                                this.isQuestionSelected(
                                                  index,
                                                  ind,
                                                )
                                                  ? styles.lightIcon
                                                  : "",
                                              ].join(" ")}
                                              onClick={this.openJoinQuestionModal.bind(
                                                this,
                                                index,
                                                ind,
                                                [],
                                                false,
                                              )}
                                            >
                                              &#xe759;
                                            </i>
                                          ) : (
                                            <Tooltip
                                              title={trans(
                                                "global.addGuanlianFirst",
                                                "请先添加关联题目，再添加相似题",
                                              )}
                                              trigger="click"
                                            >
                                              <i
                                                className={[
                                                  icon.iconfont,
                                                  styles.addIcon,
                                                ].join(" ")}
                                              >
                                                &#xe759;
                                              </i>
                                            </Tooltip>
                                          )}
                                        </div>

                                        <div
                                          className={
                                            styles["delete-operation-cell"]
                                          }
                                        >
                                          {isCompatibilityLocked ||
                                          placementUnitIndex < 0 ? null : (
                                            <QuestionPlacementMoveActions
                                              canMoveDown={
                                                placementUnitIndex <
                                                placementUnits.length - 1
                                              }
                                              canMoveUp={placementUnitIndex > 0}
                                              onMoveDown={() => {
                                                this.moveQuestionPlacement(
                                                  index,
                                                  ind,
                                                  "down",
                                                );
                                              }}
                                              onMoveUp={() => {
                                                this.moveQuestionPlacement(
                                                  index,
                                                  ind,
                                                  "up",
                                                );
                                              }}
                                            />
                                          )}
                                          {isCompatibilityLocked ? null : (
                                            <button
                                              aria-label={trans(
                                                "global.delete",
                                                "删除",
                                              )}
                                              className={[
                                                styles.addIcon,
                                                styles[
                                                  "delete-operation-button"
                                                ],
                                                canEditRow
                                                  ? styles.lightIcon
                                                  : "",
                                                icon.iconfont,
                                              ].join(" ")}
                                              onClick={(event) => {
                                                event.stopPropagation();
                                                this.delChild(index, ind);
                                              }}
                                              type="button"
                                            >
                                              &#xe7a8;
                                            </button>
                                          )}
                                        </div>
                                      </div>
                                    </Fragment>
                                  );
                                })()}

                                {flattenQuestionDescendants(
                                  it.sonQuestionList,
                                ).map(
                                  ({ question: sonQuestion, questionPath }) => {
                                    const sonQuIndex = questionPath[0];
                                    const isSonCompatibilityLocked =
                                      this.isCompatibilityFollowerQuestion(
                                        sonQuestion,
                                        { includeFirstBlank: true },
                                      );
                                    const isSonSelected =
                                      this.isDescendantQuestionSelected(
                                        index,
                                        ind,
                                        questionPath,
                                      );
                                    const canEditSonRow =
                                      isSonSelected &&
                                      !isSonCompatibilityLocked;
                                    const canEditSonAttribute = (fieldName) =>
                                      canEditSonRow ||
                                      canEditBlankAssociationField(
                                        sonQuestion,
                                        fieldName,
                                      );

                                    return (
                                      <div
                                        key={`${this.renderNo(index, ind)}-${questionPath.join("-")}`}
                                        onClick={
                                          isSonCompatibilityLocked
                                            ? undefined
                                            : () => {
                                                this.selectDescendantQuestion(
                                                  index,
                                                  ind,
                                                  questionPath,
                                                );
                                              }
                                        }
                                        className={`${isSonSelected ? styles.check : ""} ${styles.grandsonRowBox}`}
                                      >
                                        <div>
                                          <Checkbox
                                            onChange={(e) => {
                                              this.changeDescendantField(
                                                index,
                                                ind,
                                                questionPath,
                                                "checked",
                                                e.target.checked,
                                              );
                                            }}
                                            checked={sonQuestion.checked}
                                            disabled={isSonCompatibilityLocked}
                                          />
                                          &nbsp;
                                          {buildQuestionNumber(
                                            this.renderNo(index, ind),
                                            questionPath,
                                          )}
                                        </div>

                                        <div>
                                          {this.renderQuestionTypeCell(
                                            sonQuestion,
                                          )}
                                        </div>

                                        <div>
                                          {hasQuestionChildren(sonQuestion) ||
                                          (isSonCompatibilityLocked &&
                                            !canEditSonAttribute(
                                              "questionScore",
                                            )) ? (
                                            sonQuestion.questionScore
                                          ) : !sonQuestion.questionScore ||
                                            canEditSonAttribute(
                                              "questionScore",
                                            ) ? (
                                            <InputNumber
                                              min={0}
                                              value={
                                                sonQuestion.questionScore ??
                                                null
                                              }
                                              onChange={(value) =>
                                                this.changeDescendantField(
                                                  index,
                                                  ind,
                                                  questionPath,
                                                  "questionScore",
                                                  value,
                                                )
                                              }
                                            />
                                          ) : (
                                            <div style={{ padding: "0 11px" }}>
                                              {sonQuestion.questionScore}
                                            </div>
                                          )}
                                        </div>

                                        <div>
                                          {isSonCompatibilityLocked &&
                                          !canEditSonAttribute(
                                            "predictionDifficulty",
                                          ) ? (
                                            <div style={{ padding: "0 11px" }}>
                                              {this.returnFloat(
                                                sonQuestion.predictionDifficulty,
                                              )}
                                            </div>
                                          ) : !sonQuestion.predictionDifficulty ||
                                            canEditSonAttribute(
                                              "predictionDifficulty",
                                            ) ? (
                                            <InputNumber
                                              min={0}
                                              step={0.01}
                                              max={1}
                                              value={
                                                sonQuestion.predictionDifficulty
                                              }
                                              onChange={(value) =>
                                                this.changeDescendantField(
                                                  index,
                                                  ind,
                                                  questionPath,
                                                  "predictionDifficulty",
                                                  value,
                                                )
                                              }
                                            />
                                          ) : (
                                            <div style={{ padding: "0 11px" }}>
                                              {this.returnFloat(
                                                sonQuestion.predictionDifficulty,
                                              )}
                                            </div>
                                          )}
                                        </div>

                                        <div>
                                          {isSonCompatibilityLocked &&
                                          !canEditSonAttribute(
                                            "questionLevelType",
                                          ) ? (
                                            <div style={{ paddingLeft: "3px" }}>
                                              {
                                                questionLevelMap[
                                                  sonQuestion.questionLevelType
                                                ]
                                              }
                                            </div>
                                          ) : !sonQuestion.questionLevelType ||
                                            canEditSonAttribute(
                                              "questionLevelType",
                                            ) ? (
                                            <Select
                                              value={
                                                sonQuestion.questionLevelType
                                              }
                                              placeholder={trans(
                                                "global.selectDifficulty",
                                                "选择难易",
                                              )}
                                              style={{ width: 90 }}
                                              onChange={(value) =>
                                                this.changeDescendantField(
                                                  index,
                                                  ind,
                                                  questionPath,
                                                  "questionLevelType",
                                                  value,
                                                )
                                              }
                                            >
                                              <Option value={1}>
                                                {trans("global.easy", "简单")}
                                              </Option>
                                              <Option value={2}>
                                                {trans(
                                                  "global.general",
                                                  "普通",
                                                )}
                                              </Option>
                                              <Option value={3}>
                                                {trans(
                                                  "global.difficult",
                                                  "困难",
                                                )}
                                              </Option>
                                            </Select>
                                          ) : (
                                            <div style={{ paddingLeft: "3px" }}>
                                              {
                                                questionLevelMap[
                                                  sonQuestion.questionLevelType
                                                ]
                                              }
                                            </div>
                                          )}
                                        </div>

                                        <div>
                                          {isSonCompatibilityLocked &&
                                          !canEditSonAttribute("sourceType") ? (
                                            sourceTypeMap[
                                              sonQuestion.sourceType
                                            ]
                                          ) : !sonQuestion.sourceType ||
                                            canEditSonAttribute(
                                              "sourceType",
                                            ) ? (
                                            <Select
                                              value={sonQuestion.sourceType}
                                              placeholder={trans(
                                                "twoWay.selectQuestionSource",
                                                "选择来源",
                                              )}
                                              style={{ width: 80 }}
                                              onChange={(value) =>
                                                this.changeDescendantField(
                                                  index,
                                                  ind,
                                                  questionPath,
                                                  "sourceType",
                                                  value,
                                                )
                                              }
                                            >
                                              <Option value={1}>
                                                {trans(
                                                  "global.Originalquestion",
                                                  "原题",
                                                )}
                                              </Option>
                                              <Option value={2}>
                                                {trans(
                                                  "global.original",
                                                  "原创",
                                                )}
                                              </Option>
                                              <Option value={3}>
                                                {trans("global.adapt", "改编")}
                                              </Option>
                                            </Select>
                                          ) : (
                                            sourceTypeMap[
                                              sonQuestion.sourceType
                                            ]
                                          )}
                                        </div>

                                        {this.renderClickableTreeItem({
                                          data: sonQuestion,
                                          keyName: "chapterName",
                                          idName: "chapterId",
                                          dialogFn: "openChapterDialog",
                                          index,
                                          ind,
                                          sonQuIndex,
                                          questionPath,
                                          isSon: true,
                                          disabled:
                                            isSonCompatibilityLocked &&
                                            !canEditSonAttribute("chapterId"),
                                        })}

                                        {this.renderClickableTreeItem({
                                          data: sonQuestion,
                                          keyName: "knowledge",
                                          idName: "knowledgeIds",
                                          dialogFn: "openKnowledgeDialog",
                                          index,
                                          ind,
                                          sonQuIndex,
                                          questionPath,
                                          isSon: true,
                                          disabled:
                                            isSonCompatibilityLocked &&
                                            !canEditSonAttribute(
                                              "knowledgeIds",
                                            ),
                                        })}

                                        {this.renderClickableTreeItem({
                                          data: sonQuestion,
                                          keyName: "indicatorName",
                                          idName: "indicatorIds",
                                          dialogFn: "openQualityDialog",
                                          index,
                                          ind,
                                          sonQuIndex,
                                          questionPath,
                                          isSon: true,
                                          disabled:
                                            isSonCompatibilityLocked &&
                                            !canEditSonAttribute(
                                              "indicatorIds",
                                            ),
                                        })}

                                        {/* 网格布局占位标签 */}
                                        <div></div>
                                        <div></div>
                                        <div></div>

                                        <div
                                          className={
                                            styles["delete-operation-cell"]
                                          }
                                        >
                                          {isSonCompatibilityLocked ? null : (
                                            <button
                                              aria-label={trans(
                                                "global.delete",
                                                "删除",
                                              )}
                                              className={`${icon.iconfont}
                                          ${styles.addIcon} ${styles["delete-operation-button"]}
                                          ${isSonSelected ? styles.lightIcon : ""}`}
                                              onClick={(event) => {
                                                event.stopPropagation();
                                                this.delDescendantQuestion(
                                                  index,
                                                  ind,
                                                  questionPath,
                                                );
                                              }}
                                              type="button"
                                            >
                                              &#xe7a8;
                                            </button>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  },
                                )}
                              </div>
                            ))
                          : null}
                      </div>
                    ))
                  : null}
              </div>
              <FooterActions
                {...{
                  onCheckAll: this.onCheckAllTable,
                  checked: this.state.allChecked,
                  disable: this.renderCheck(),
                  chapterTreeList: this.state.chapterTreeList,
                  knowledgeTreeList: this.state.knowledgeTreeList,
                  qualityTreeList: this.state.qualityTreeList,
                  onFormChange: (key, e) => {
                    this.batchDifficult(key, e);
                  },
                  onSelectedRow: (key) => {
                    switch (key) {
                      case "chapter": {
                        this.getChapter();

                        break;
                      }
                      case "knowledge": {
                        this.getKnowledge();

                        break;
                      }
                      case "quality": {
                        this.getQuality();

                        break;
                      }
                      // No default
                    }
                  },
                }}
              />
            </>
          ) : null}
        </div>

        <ComnModal
          options={{
            visible: this.state.knowledgeVisible,
            centered: true,
            width: "100%",
            cancelButtonProps: {
              style: { display: "none" },
            },
            title: this.state.isAttainment
              ? trans("global.addAttainment", "添加素养")
              : this.state.isChapter
                ? trans("global.addChapter", "添加章节")
                : trans("global.addKnowledge", "添加知识点"),
            onOk: this.closeModal, // 提交表单
            onCancel: this.closeModal,
            okText: trans("global.save", "保存"),
            wrapClassName: styles.questionAttributeEditingDialog,
          }}
          innerContent={
            <div style={{ display: "flex", width: "100%", height: "100%" }}>
              <div
                style={{
                  width: "33%",
                  height: "100%",
                  overflowY: "auto",
                  borderRight: "2px solid #eee",
                  paddingRight: "10px",
                }}
              >
                {this.state.originalQuestion &&
                this.state.originalQuestion.length > 0 ? (
                  this.state.originalQuestion.map((item) => (
                    <div
                      className={styles.modulecontent}
                      key={item.id}
                      style={{ color: "#01113d" }}
                    >
                      <TwoWayQuestionPreview
                        aggregate={item.v2Aggregate}
                        questionTypes={this.state.v2BusinessQuestionTypes}
                        showAnswer
                      />
                    </div>
                  ))
                ) : (
                  <div
                    style={{
                      textAlign: "center",
                      display: "flex",
                      justifyContent: "center",
                    }}
                  >
                    <div className={styles.iconBox}>
                      {IconFont ? (
                        <IconFont
                          type="icon-chengguoweikong"
                          className={styles.noSourceIcon}
                        />
                      ) : null}
                    </div>
                    {trans("global.noQuestionList", "暂时没有题目哦")}
                  </div>
                )}
              </div>

              <div
                id="questionNumberContent"
                style={{
                  width: "33%",
                  height: "100%",
                  overflowY: "auto",
                  borderRight: "2px solid #eee",
                  padding: "0 10px",
                }}
              >
                {questionTypeList && questionTypeList.length > 0
                  ? questionTypeList.map((item, index) => (
                      <div>
                        <div
                          className={[styles.modalParent, styles.flexRow].join(
                            " ",
                          )}
                        >
                          <div className={styles.chNum}>
                            {convertToChineseNumber(index + 1)}、
                          </div>
                          <div className={styles.typeTrTitle}>
                            {item.moduleName}
                          </div>
                        </div>
                        {item.questionList && item.questionList.length > 0
                          ? item.questionList.map((it, ind) => (
                              <>
                                <div
                                  onClick={this.selectQuestionNumber.bind(
                                    this,
                                    index,
                                    ind,
                                  )}
                                  className={`${styles.modalChild} ${styles.flexRow}
                                     ${
                                       childenQuestionNum === ind &&
                                       prentQuestionNum === index &&
                                       sonQuestionNum == undefined
                                         ? styles.knowledgeChildCheck
                                         : ""
                                     }`}
                                >
                                  <div
                                    className={`${styles.childNo} 
                                       ${
                                         childenQuestionNum === ind &&
                                         prentQuestionNum === index &&
                                         sonQuestionNum == undefined
                                           ? styles.checkNo
                                           : ""
                                       }`}
                                  >
                                    {this.renderNo(index, ind)}
                                  </div>

                                  {this.state.isAttainment ? (
                                    <div className={styles.names_content}>
                                      {it.indicatorName?.map((text, l) => {
                                        return (
                                          <div className={styles.name_item}>
                                            {text}
                                            <div
                                              className={`${icon.iconfont}
                                              ${styles.deleteKonwledge}
                                              ${
                                                prentQuestionNum === index &&
                                                childenQuestionNum === ind &&
                                                sonQuestionNum == undefined
                                                  ? styles.checkDel
                                                  : ""
                                              }`}
                                              onClick={(event) => {
                                                this.delChecked(
                                                  event,
                                                  index,
                                                  ind,
                                                  l,
                                                );
                                              }}
                                            >
                                              &#xe893;
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  ) : null}

                                  {this.state.isChapter ? (
                                    <div className={styles.names_content}>
                                      {it.chapterName?.map((text, l) => {
                                        return (
                                          <div className={styles.name_item}>
                                            {text}
                                            <div
                                              className={`${icon.iconfont}
                                              ${styles.deleteKonwledge}
                                              ${
                                                prentQuestionNum === index &&
                                                childenQuestionNum === ind &&
                                                sonQuestionNum == undefined
                                                  ? styles.checkDel
                                                  : ""
                                              }`}
                                              onClick={(event) => {
                                                this.delChecked(
                                                  event,
                                                  index,
                                                  ind,
                                                  l,
                                                );
                                              }}
                                            >
                                              &#xe893;
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  ) : null}
                                  {this.state.isKnowLedge ? (
                                    <div className={styles.names_content}>
                                      {it.knowledge?.map((text, l) => {
                                        return (
                                          <div className={styles.name_item}>
                                            {text}
                                            <div
                                              className={`${icon.iconfont}
                                              ${styles.deleteKonwledge}
                                              ${
                                                prentQuestionNum === index &&
                                                childenQuestionNum === ind &&
                                                sonQuestionNum == undefined
                                                  ? styles.checkDel
                                                  : ""
                                              }`}
                                              onClick={(event) => {
                                                this.delChecked(
                                                  event,
                                                  index,
                                                  ind,
                                                  l,
                                                );
                                              }}
                                            >
                                              &#xe893;
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  ) : null}
                                </div>
                                {it.sonQuestionList
                                  ? it.sonQuestionList.map(
                                      (sonQuestion, sonQuIndex) => (
                                        <div
                                          onClick={this.selectSonQuestionNumber.bind(
                                            this,
                                            index,
                                            ind,
                                            sonQuIndex,
                                          )}
                                          className={`${styles.modalChild} ${styles.flexRow} 
                                           ${
                                             prentQuestionNum === index &&
                                             childenQuestionNum === ind &&
                                             sonQuestionNum == sonQuIndex
                                               ? styles.knowledgeChildCheck
                                               : ""
                                           }`}
                                          style={{ marginLeft: "10px" }}
                                        >
                                          <div
                                            className={`${styles.childNo}
                                             ${
                                               prentQuestionNum === index &&
                                               childenQuestionNum === ind &&
                                               sonQuestionNum == sonQuIndex
                                                 ? styles.checkNo
                                                 : ""
                                             }`}
                                          >
                                            {this.renderNo(index, ind)}.
                                            {sonQuIndex + 1}
                                          </div>

                                          {this.state.isAttainment ? (
                                            <div
                                              className={styles.names_content}
                                            >
                                              {sonQuestion.indicatorName?.map(
                                                (item_indicator, l) => {
                                                  return (
                                                    <div
                                                      className={
                                                        styles.name_item
                                                      }
                                                    >
                                                      {item_indicator}
                                                      <div
                                                        className={`
                                                ${icon.iconfont}
                                                ${styles.deleteKonwledge}
                                                ${
                                                  prentQuestionNum === index &&
                                                  childenQuestionNum === ind &&
                                                  sonQuestionNum == sonQuIndex
                                                    ? styles.checkDel
                                                    : ""
                                                }`}
                                                        onClick={(event) => {
                                                          this.delSonChecked(
                                                            event,
                                                            index,
                                                            ind,
                                                            sonQuIndex,
                                                            l,
                                                          );
                                                        }}
                                                      >
                                                        &#xe893;
                                                      </div>
                                                    </div>
                                                  );
                                                },
                                              )}
                                            </div>
                                          ) : null}

                                          {this.state.isChapter ? (
                                            <div
                                              className={styles.names_content}
                                            >
                                              {sonQuestion.chapterName}
                                            </div>
                                          ) : null}
                                          {this.state.isKnowLedge ? (
                                            <div
                                              className={styles.names_content}
                                            >
                                              {sonQuestion.knowledge}
                                            </div>
                                          ) : null}
                                          {(sonQuestion.knowledge &&
                                            this.state.isKnowLedge) ||
                                          (sonQuestion.chapterId &&
                                            this.state.isChapter) ? (
                                            <div
                                              className={`
                                                ${icon.iconfont}
                                                ${styles.deleteKonwledge}
                                                ${
                                                  prentQuestionNum === index &&
                                                  childenQuestionNum === ind &&
                                                  sonQuestionNum == sonQuIndex
                                                    ? styles.checkDel
                                                    : ""
                                                }`}
                                              onClick={(event) => {
                                                this.delSonChecked(
                                                  event,
                                                  index,
                                                  ind,
                                                  sonQuIndex,
                                                );
                                              }}
                                            >
                                              &#xe893;
                                            </div>
                                          ) : null}
                                        </div>
                                      ),
                                    )
                                  : null}
                              </>
                            ))
                          : null}
                      </div>
                    ))
                  : null}
              </div>

              <div
                style={{
                  width: "33%",
                  height: "100%",
                  paddingLeft: "10px",
                }}
              >
                <div style={{ width: "100%", height: "100%" }}>
                  <div style={{ marginBottom: 8 }}>
                    <Search
                      placeholder={trans(
                        "twoWay.questionAttributeSearchPlaceholder",
                        "请输入查询条件",
                      )}
                      onChange={this.searchQuestionAttribute}
                      value={this.state.searchQuValue}
                    />
                  </div>
                  <div
                    id="quAttributeTreeContent"
                    className={styles.quAttributeTreeContent}
                    style={{
                      height: "calc(100% - 40px)",
                      overflow: "auto",
                    }}
                  >
                    {this.renderTreeByType()}
                  </div>
                </div>
              </div>
            </div>
          }
        />

        <ComnModal
          options={{
            visible: this.state.childVisible,
            centered: true,
            title: trans("twoWay.childQuestionSettings", "子题设置"),
            width: 400,
            wrapClassName: styles.knowledgeModal,
            onCancel: this.closeChild,
            footer: (
              <div style={{ display: "flex", alignItems: "center" }}>
                <div style={{ color: "rgba(1, 17, 61, 0.85)" }}>
                  {trans("twoWay.childQuestionTotalPrefix", "该题共")}
                  <span style={{ color: "#54B835" }}>
                    {
                      synchronizeQuestionTreeScores({
                        sonQuestionList: this.state.modalSonQuestionsData,
                      }).questionScore
                    }
                  </span>
                  {trans("global.point", "分")}
                </div>
                <MyButton
                  sizeclass="commonBtn"
                  typeclass="cancelBtn"
                  style={{ marginLeft: "auto" }}
                  onClick={this.closeChild}
                >
                  {trans("global.cancle")}
                </MyButton>
                <MyButton
                  sizeclass="commonBtn"
                  typeclass="confirmBtn"
                  style={{ marginLeft: "10px" }}
                  onClick={this.sureChild}
                >
                  {trans("global.sure")}
                </MyButton>
              </div>
            ),
          }}
          innerContent={
            <div
              className={styles.childCon}
              style={{ display: "flex", justifyContent: "center" }}
            >
              <div>
                <div className={`${styles.flexRow} ${styles.childDiv}`}>
                  <div
                    style={{
                      minWidth: "50px",
                      textAlign: "right",
                      marginRight: "10px",
                    }}
                  >
                    {trans("twoWay.childQuestionCount", "子题数")}
                  </div>
                  <div style={{ width: "110px" }}>
                    <InputNumber
                      value={this.state.modalSonQuestionsData?.length}
                      onChange={this.changeScoreLength.bind(this)}
                    />
                  </div>
                </div>
                {this.state.modalSonQuestionsData?.map((item, index) => (
                  <div
                    className={`${styles.flexRow} ${styles.childDiv}`}
                    key={item.id}
                  >
                    <div
                      style={{
                        minWidth: "50px",
                        textAlign: "right",
                        marginRight: "10px",
                      }}
                    >
                      {this.renderNo(checkParent, checkChild)}.{index + 1}
                    </div>
                    <div style={{ display: "flex", alignItems: "center" }}>
                      <InputNumber
                        value={item.questionScore}
                        onChange={this.changeScore.bind(this, index)}
                      />
                      <div style={{ marginLeft: "5px" }}>
                        {trans("global.point", "分")}
                      </div>
                      {index == 0 ? (
                        <div
                          onClick={this.fillDownChange}
                          style={{
                            color: "#0445FC",
                            cursor: "pointer",
                            marginLeft: "10px",
                          }}
                        >
                          {trans("twoWay.childQuestions.fillDown", "向下填充")}
                        </div>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          }
        />

        <Modal
          visible={this.state.combinationAssociationVisible}
          centered
          title={combinationLeafAssociationCopy.title}
          width={760}
          wrapClassName={styles.combinationAssociationModal}
          onCancel={this.closeCombinationAssociationModal}
          footer={
            <div className={styles.combinationAssociationFooter}>
              <span
                className={
                  combinationValidation.valid
                    ? styles.combinationAssociationValid
                    : styles.combinationAssociationError
                }
              >
                {combinationValidation.message}
              </span>
              <MyButton
                sizeclass="commonBtn"
                typeclass="cancelBtn"
                onClick={this.closeCombinationAssociationModal}
              >
                {combinationLeafAssociationCopy.cancel}
              </MyButton>
              <MyButton
                sizeclass="commonBtn"
                typeclass={
                  combinationValidation.valid ? "confirmBtn" : "cancelBtn"
                }
                onClick={this.applyCombinationAssociation}
              >
                {combinationLeafAssociationCopy.confirm}
              </MyButton>
            </div>
          }
        >
          <div className={styles.combinationAssociationContent}>
            <div className={styles.combinationRangeBox}>
              <div>
                <div className={styles.combinationAssociationTitle}>
                  {combinationLeafAssociationCopy.rangeTitle}
                </div>
                <div className={styles.combinationRangeText}>
                  {getCombinationLeafRangeDescription({
                    endNumber: this.state.combinationAssociationEndNo || "-",
                    startNumber: this.getCurrentTopLevelQuestionNo() || "-",
                  })}
                </div>
              </div>
              <div className={styles.combinationRangeInput}>
                <span>{combinationLeafAssociationCopy.endNumber}</span>
                <InputNumber
                  min={this.getCurrentTopLevelQuestionNo() || 1}
                  max={this.getTopLevelQuestionOptions().length || undefined}
                  value={this.state.combinationAssociationEndNo}
                  onChange={this.changeCombinationAssociationEndNo}
                />
              </div>
            </div>
            <div className={styles.combinationRangeSummary}>
              <div>
                <span>{combinationLeafAssociationCopy.currentRange}</span>
                <strong>
                  {this.renderCombinationAssociationRange() || "-"}
                </strong>
              </div>
              <div>
                <span>{combinationLeafAssociationCopy.leafRange}</span>
                <strong>{this.getCombinationSourceRangeText()}</strong>
              </div>
            </div>
            <div className={styles.associationPrintNote}>
              {combinationLeafAssociationCopy.printNote}
            </div>
            <div className={styles.combinationAssociationList}>
              {combinationChildren.map((childQuestion, childIndex) => (
                <div
                  className={styles.combinationAssociationItem}
                  key={
                    this.getQuestionId(childQuestion) ||
                    `combo-child-${childIndex}`
                  }
                >
                  <div className={styles.combinationAssociationChild}>
                    <div className={styles.combinationAssociationChildNo}>
                      {this.getCombinationChildLabel(childIndex)}
                    </div>
                    <div className={styles.combinationAssociationChildContent}>
                      {combinationLeafAssociationCopy.targetLeaf(
                        (this.getCurrentTopLevelQuestionNo() || 0) + childIndex,
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Modal>

        <Modal
          visible={this.state.blankAssociationVisible}
          centered
          title={trans("twoWay.blankAssociation.title", "关联填空题")}
          width={760}
          wrapClassName={styles.combinationAssociationModal}
          onCancel={this.closeBlankAssociationModal}
          footer={
            <div className={styles.combinationAssociationFooter}>
              <span
                className={
                  blankValidation.valid
                    ? styles.combinationAssociationValid
                    : styles.combinationAssociationError
                }
              >
                {blankValidation.message}
              </span>
              <MyButton
                sizeclass="commonBtn"
                typeclass="cancelBtn"
                onClick={this.closeBlankAssociationModal}
              >
                {trans("twoWay.cancel", "取消")}
              </MyButton>
              <MyButton
                sizeclass="commonBtn"
                typeclass={blankValidation.valid ? "confirmBtn" : "cancelBtn"}
                onClick={this.applyBlankAssociation}
              >
                {trans("twoWay.confirmAssociation", "确认关联")}
              </MyButton>
            </div>
          }
        >
          <div className={styles.combinationAssociationContent}>
            <div className={styles.combinationRangeBox}>
              <div>
                <div className={styles.combinationAssociationTitle}>
                  {trans(
                    "twoWay.blankAssociation.questionNumberMode",
                    "题号方式",
                  )}
                </div>
                <div className={styles.combinationRangeText}>
                  {this.state.blankAssociationNumberingMode ===
                  BLANK_ASSOCIATION_NUMBERING_MODE.subquestion
                    ? trans(
                        "twoWay.blankAssociation.subquestionNumberHint",
                        "从当前第 {$startNo} 题生成 .1 子题号；确认后不占用后续大题号。",
                        {
                          startNo: this.getCurrentTopLevelQuestionNo() || "-",
                        },
                      )
                    : trans(
                        "twoWay.blankAssociation.continuousRangeHint",
                        "从当前第 {$startNo} 题开始，必须连续到第 {$endNo} 题；确认后题号保持不变，只在题型旁标“空”。",
                        {
                          endNo: this.state.blankAssociationEndNo || "-",
                          startNo: this.getCurrentTopLevelQuestionNo() || "-",
                        },
                      )}
                </div>
              </div>
              <div className={styles.combinationRangeInput}>
                <span>
                  {trans("twoWay.blankAssociation.questionNo", "题号")}
                </span>
                <Select
                  value={this.state.blankAssociationNumberingMode}
                  style={{ width: 120 }}
                  onChange={this.changeBlankAssociationNumberingMode}
                >
                  <Option value={BLANK_ASSOCIATION_NUMBERING_MODE.continuous}>
                    {trans(
                      "twoWay.blankAssociation.integerIncrementMode",
                      "加整数1",
                    )}
                  </Option>
                  <Option value={BLANK_ASSOCIATION_NUMBERING_MODE.subquestion}>
                    {trans(
                      "twoWay.blankAssociation.subquestionIncrementMode",
                      "加 .1",
                    )}
                  </Option>
                </Select>
                <span>
                  {trans("twoWay.associationEndQuestionNo", "结束题号")}
                </span>
                <InputNumber
                  disabled={
                    this.state.blankAssociationNumberingMode ===
                    BLANK_ASSOCIATION_NUMBERING_MODE.subquestion
                  }
                  min={this.getCurrentTopLevelQuestionNo() || 1}
                  max={this.getTopLevelQuestionOptions().length || undefined}
                  value={this.state.blankAssociationEndNo}
                  onChange={this.changeBlankAssociationEndNo}
                />
              </div>
            </div>
            <div className={styles.combinationRangeSummary}>
              <div>
                <span>
                  {trans(
                    "twoWay.blankAssociation.paperQuestionNo",
                    "当前试卷题号",
                  )}
                </span>
                <strong>{this.renderBlankAssociationRange() || "-"}</strong>
              </div>
              <div>
                <span>
                  {trans("twoWay.blankAssociation.blankSlots", "填空题空位")}
                </span>
                <strong>{this.getBlankSourceRangeText()}</strong>
              </div>
            </div>
            <div className={styles.blankLockNote}>
              {trans(
                "twoWay.blankAssociation.wrongPrintNote",
                "错题打印：按原填空题合并，错 1 空或 5 空都只打印 1 道。空位内容请改编原题。",
              )}
            </div>
            <div className={styles.combinationAssociationList}>
              {blankParts.map((blankPart, blankOrder) => (
                <div
                  className={styles.combinationAssociationItem}
                  key={`blank-part-${blankPart.blankId}`}
                >
                  <div className={styles.combinationAssociationChild}>
                    <div className={styles.combinationAssociationChildNo}>
                      {this.renderBlankPartLabel(blankPart, blankOrder)}
                    </div>
                    <div className={styles.combinationAssociationChildContent}>
                      {trans(
                        "twoWay.blankAssociation.targetQuestion",
                        "对应当前第 {$num} 题",
                        {
                          num:
                            blankValidation.targetLabels?.[blankOrder] ||
                            (this.getCurrentTopLevelQuestionNo() || 0) +
                              blankOrder,
                        },
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Modal>

        <ComnModal
          options={{
            visible: this.state.modalStatus,
            title: this.state.isguanlian
              ? trans("global.guanlian", "关联题目")
              : trans("global.addgexing", "相似题推荐"),
            onCancel: this.modalCancel,
            wrapClassName: styles.questionModalContent,
            centered: true,
            width: "100%",
            footer: this.state.isguanlian
              ? null
              : [
                  <MyButton
                    key="edit"
                    typeclass="text"
                    style={{ marginRight: "10px" }}
                  >
                    {trans("global.choosedNum", "已选 {$num} ", {
                      num: questionTypeList[prentQuestionNum]?.questionList[
                        childenQuestionNum
                      ]?.personalityQuestions?.length,
                    })}
                  </MyButton>,
                  <MyButton
                    key="edit"
                    typeclass="minor"
                    sizeclass="commonBtn"
                    onClick={this.similarityEdit}
                    style={{
                      display:
                        modalQuestionType == "list" ? "inline-block" : "none",
                    }}
                  >
                    {trans("twoWay.editPersonalizedQuestions", "修改个性推题")}
                  </MyButton>,
                  <MyButton
                    key="back"
                    style={{
                      display:
                        modalQuestionType == "edit" ? "inline-block" : "none",
                    }}
                    typeclass="cancelBtn"
                    sizeclass="commonBtn"
                    onClick={this.similarityCancel}
                  >
                    {trans("global.goBack", "返回")}
                  </MyButton>,
                ],
          }}
          innerContent={
            <div
              className={styles.querstionModal}
              style={{
                height: `calc(100vh - ${this.state.isguanlian ? 51 + 14 : 51 + 55 + 14}px)`,
              }}
            >
              <div className={styles.contentLeft}>
                <div className={styles.mark}>
                  {trans("analysis.questionIndex", "题号")}
                </div>
                <div className={styles.questionNumWarp} id="questionNumWarp">
                  {questionTypeList.map((item, index) => {
                    return item.questionList.map((item1, ind) => {
                      return (
                        <div
                          key={buildQuestionPositionKey(index, ind)}
                          className={`${styles.questionNumBtn} ${index == prentQuestionNum && ind == childenQuestionNum ? styles.active : ""} ${getClass(item1)}`}
                          onClick={() => {
                            this.questionNumChange(index, ind);
                          }}
                          id={`question_number_${number_ + 1}`}
                        >
                          {(number_ += 1)}
                        </div>
                      );
                    });
                  })}
                </div>
              </div>
              <div className={styles.contentRight}>
                <div className={styles.headerWarp}>
                  <div>
                    <Select
                      placeholder={trans("global.pleaseChoose", "请选择")}
                      style={{ width: "100px" }}
                      value={this.state.searchRangeType}
                      onChange={(value) => {
                        this.searchChange("range", value);
                      }}
                    >
                      <Option value={1}>
                        {trans("global.myQuestionNum", "我的题目")}
                      </Option>
                      <Option value={2}>
                        {" "}
                        {trans("global.schoolQuestionNum", "校本题目")}
                      </Option>
                    </Select>
                  </div>

                  <div style={{ marginLeft: "10px" }}>
                    <Select
                      placeholder={trans("global.pleaseChoose", "请选择")}
                      style={{ width: "100px" }}
                      value={this.state.searchGradeId}
                      onChange={(value) => {
                        this.searchChange("grade", value);
                      }}
                    >
                      {allGradeList.map((item) => (
                        <Option key={item.gradeId} value={item.gradeId}>
                          {item.name}
                        </Option>
                      ))}
                    </Select>
                  </div>

                  <div style={{ marginLeft: "10px" }}>
                    <Select
                      disabled={
                        this.state.searchGradeId == 0 ||
                        this.state.candidateQuestionTypeLoading ||
                        Boolean(this.state.candidateQuestionTypeLoadError)
                      }
                      loading={this.state.candidateQuestionTypeLoading}
                      placeholder={trans("global.pleaseChoose", "请选择")}
                      style={{ width: "100px" }}
                      value={this.state.searchQuestionType}
                      onChange={(value) => {
                        this.searchChange("type", value);
                      }}
                    >
                      <Option value={0} key={0}>
                        {trans("global.allQuestionTypes", "全部题型")}
                      </Option>
                      {this.state.candidateQuestionTypes.map((item) => (
                        <Option
                          key={item.businessQuestionTypeId}
                          value={item.businessQuestionTypeId}
                        >
                          {item.label}
                        </Option>
                      ))}
                    </Select>
                  </div>

                  <div style={{ marginLeft: "10px" }}>
                    <Select
                      placeholder={trans("global.pleaseChoose", "请选择")}
                      value={this.state.searchQueLevelType}
                      style={{ width: "100px" }}
                      onChange={(value) => {
                        this.searchChange("leve", value);
                      }}
                    >
                      <Option value={0}>{trans("global.All", "所有")}</Option>
                      <Option value={1}>{trans("global.easy", "简单")}</Option>
                      <Option value={2}>
                        {trans("global.general", "普通")}
                      </Option>
                      <Option value={3}>
                        {trans("global.difficult", "困难")}
                      </Option>
                    </Select>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      marginLeft: "10px",
                    }}
                  >
                    {trans("singleInput.knowledgeTree", "知识点")}：
                    <div>
                      <TreeSelect
                        value={this.state.searchSelectKnowledgePointList}
                        treeCheckable={true}
                        showSearch={true}
                        placeholder={trans("global.pleaseChoose", "请选择")}
                        treeData={this.state.knowledgeTree}
                        treeDefaultExpandAll
                        showCheckedStrategy={SHOW_PARENT}
                        allowClear
                        treeNodeFilterProp="searchKeyWord"
                        onChange={(value) => {
                          this.searchChange("knowledge", value);
                        }}
                        dropdownClassName={styles.maxHeightLimit}
                        style={{ minWidth: "130px" }}
                      />
                    </div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      marginLeft: "10px",
                    }}
                  >
                    {trans("global.chapter", "章节")}：
                    <div>
                      <TreeSelect
                        value={this.state.searchSelectChapterList}
                        treeCheckable={true}
                        showSearch={true}
                        placeholder={trans("global.pleaseChoose", "请选择")}
                        treeData={this.state.chapterThree}
                        showCheckedStrategy={SHOW_PARENT}
                        treeDefaultExpandAll
                        treeNodeFilterProp="searchKeyWord"
                        onChange={(value) => {
                          this.searchChange("chapter", value);
                        }}
                        dropdownClassName={styles.maxHeightLimit}
                        style={{ minWidth: "130px" }}
                      />
                    </div>
                  </div>

                  <Search
                    style={{ width: "120px", marginLeft: "10px" }}
                    placeholder={trans(
                      "global.inputKeyToSearch",
                      "输入关键词搜索题目",
                    )}
                    onChange={(e) => {
                      this.setState({ searchValue: e.target.value });
                    }}
                    value={this.state.searchValue}
                    onSearch={(value) => {
                      this.searchChange("keyWord", value);
                    }}
                  />

                  <MyButton
                    sizeclass="commonBtn"
                    typeclass="confirmBtn"
                    style={{ marginLeft: "auto" }}
                    onClick={this.addQuestion}
                  >
                    {trans("global.addQuestion", "新增题目")}
                  </MyButton>
                </div>
                <div className={styles.questionContent}>
                  {/* <Spin spinning={this.state.tableLoding}> </Spin> */}
                  <div
                    id="listBox"
                    onScroll={this.scrollChange}
                    className={styles.questionListBox}
                    style={{
                      overflowY: "scroll",
                    }}
                  >
                    <div className={styles.questionMapList}>
                      {originalQuestion &&
                      originalQuestion.length > 0 &&
                      !this.state.isguanlian ? (
                        <div style={{ position: "relative" }}>
                          <div
                            style={{
                              cursor: "pointer",
                              color: "rgba(4,69,252,0.85)",
                              whiteSpace: "nowrap",
                              position: "absolute",
                              right: "13px",
                              top: "14px",
                              zIndex: "999",
                            }}
                            onClick={this.expandChange}
                          >
                            {this.state.isExpand
                              ? trans(
                                  "twoWay.collapseOriginalQuestion",
                                  "收起原题",
                                )
                              : trans(
                                  "twoWay.expandOriginalQuestion",
                                  "展开原题",
                                )}
                          </div>
                          <div className={styles.originQuestionContent}>
                            {originalQuestion.map((item, index) => (
                              <>
                                <div
                                  style={{
                                    height: this.state.isExpand
                                      ? "auto"
                                      : "60px",
                                    overflow: this.state.isExpand
                                      ? "auto"
                                      : "hidden",
                                    width: "100%",
                                  }}
                                >
                                  <div
                                    className={styles.modulecontent}
                                    key={index}
                                  >
                                    <TwoWayQuestionPreview
                                      aggregate={item.v2Aggregate}
                                      questionTypes={
                                        this.state.v2BusinessQuestionTypes
                                      }
                                      showAnswer
                                    />
                                  </div>
                                </div>
                                <div className={styles.moduleBottom}>
                                  <div className={styles.viewBottom}>
                                    <div
                                      style={{
                                        marginTop: "4px",
                                        marginBottom: "4px",
                                      }}
                                    >
                                      <ResourceQuestionTypeLabel
                                        businessQuestionTypeId={
                                          item.businessQuestionTypeId
                                        }
                                        className={styles.questionType}
                                        questionTypes={
                                          this.state.enabledQuestionTypes
                                        }
                                      />
                                      <span className={styles.inlineDifficulty}>
                                        <span className={styles.questionLevel}>
                                          <span>
                                            {difficulty[item.level] ||
                                              trans("global.easy", "简单")}
                                          </span>
                                        </span>
                                      </span>
                                      <div
                                        className={[styles.createUser].join(
                                          " ",
                                        )}
                                      >
                                        {trans("global.addPerson", "创建人")}：
                                        {item.createUserName}
                                      </div>
                                    </div>

                                    <div
                                      style={{
                                        display: "flex",
                                        marginLeft: "15px",
                                        color: "rgba(1, 17, 61, 0.65)",
                                        fontSize: "13px",
                                      }}
                                    >
                                      {trans("global.chapter", "章节")} ：
                                      <div>
                                        {item.chapterValues &&
                                        item.chapterValues.length > 0
                                          ? item.chapterValues?.map((item) => {
                                              return (
                                                <span
                                                  style={{ marginRight: "5px" }}
                                                >
                                                  {item?.split("-")[0]}
                                                </span>
                                              );
                                            })
                                          : "--"}
                                      </div>
                                    </div>

                                    <div
                                      style={{
                                        display: "flex",
                                        marginLeft: "15px",
                                        color: "rgba(1, 17, 61, 0.65)",
                                        fontSize: "13px",
                                      }}
                                    >
                                      {trans(
                                        "singleInput.knowledgeTree",
                                        "知识点",
                                      )}
                                      ：
                                      <div>
                                        {item.knowledgeValues &&
                                        item.knowledgeValues.length > 0
                                          ? item.knowledgeValues?.map(
                                              (item) => {
                                                return (
                                                  <span
                                                    style={{
                                                      marginRight: "5px",
                                                    }}
                                                  >
                                                    {item?.split("-")[0]}
                                                  </span>
                                                );
                                              },
                                            )
                                          : "--"}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </>
                            ))}
                          </div>
                        </div>
                      ) : null}

                      {handelQuestionList && handelQuestionList.length > 0 ? (
                        handelQuestionList.map((item, index) => (
                          <div
                            className={[styles.questionList, "listItem"].join(
                              " ",
                            )}
                            key={index}
                          >
                            <div className={styles.header}></div>
                            <div className={styles.modulecontent}>
                              <TwoWayQuestionPreview
                                aggregate={item.v2Aggregate}
                                questionTypes={
                                  this.state.v2BusinessQuestionTypes
                                }
                                showAnswer={this.isCandidateAnswerDetailsVisible(
                                  item,
                                )}
                              />
                            </div>
                            <div
                              className={styles.moduleBottom}
                              id={`bottom${item.id}`}
                            >
                              <div className={styles.viewBottom}>
                                <div
                                  style={{
                                    marginTop: "4px",
                                    marginBottom: "4px",
                                  }}
                                >
                                  <ResourceQuestionTypeLabel
                                    businessQuestionTypeId={
                                      item.businessQuestionTypeId
                                    }
                                    className={styles.questionType}
                                    questionTypes={
                                      this.state.enabledQuestionTypes
                                    }
                                  />
                                  <span className={styles.inlineDifficulty}>
                                    <span className={styles.questionLevel}>
                                      <span>
                                        {difficulty[item.level] ||
                                          trans("global.easy", "简单")}
                                      </span>
                                    </span>
                                  </span>
                                  <div
                                    className={[styles.createUser].join(" ")}
                                  >
                                    {trans("global.addPerson", "创建人")}：
                                    {item.createUserName}
                                  </div>
                                </div>
                                {allLinkedQuestionIds &&
                                allLinkedQuestionIds.length > 0
                                  ? this.findQuestionLinks(
                                      allLinkedQuestionIds,
                                      item.id,
                                    )
                                  : null}

                                <div
                                  style={{
                                    display: "flex",
                                    marginLeft: "15px",
                                    color: "rgba(1, 17, 61, 0.65)",
                                    fontSize: "13px",
                                  }}
                                >
                                  {trans("global.chapter", "章节")}：
                                  <div>
                                    {item.chapterValues &&
                                    item.chapterValues.length > 0
                                      ? item.chapterValues?.map((item) => {
                                          return (
                                            <span
                                              style={{ marginRight: "5px" }}
                                            >
                                              {item?.split("-")[0]}
                                            </span>
                                          );
                                        })
                                      : "--"}
                                  </div>
                                </div>

                                <div
                                  style={{
                                    display: "flex",
                                    marginLeft: "15px",
                                    color: "rgba(1, 17, 61, 0.65)",
                                    fontSize: "13px",
                                  }}
                                >
                                  {trans("singleInput.knowledgeTree", "知识点")}
                                  ：
                                  <div>
                                    {item.knowledgeValues &&
                                    item.knowledgeValues.length > 0
                                      ? item.knowledgeValues?.map((item) => {
                                          return (
                                            <span
                                              style={{ marginRight: "5px" }}
                                            >
                                              {item?.split("-")[0]}
                                            </span>
                                          );
                                        })
                                      : "--"}
                                  </div>
                                </div>

                                <div className={styles.bottomBtn}>
                                  <div
                                    className={`${styles.viewResolution} ${styles.cursor}`}
                                    onClick={() => {
                                      this.adaptChange(item.id);
                                    }}
                                  >
                                    {trans("global.Adapt", "改编")}
                                  </div>

                                  {this.state.isguanlian &&
                                  Number(item.type) === 6 &&
                                  this.getCombinationChildren(item).length >
                                    0 ? (
                                    <>
                                      <div
                                        className={`${styles.viewResolution} ${styles.cursor} ${styles.singleComboAssociateButton}`}
                                        onClick={() => {
                                          this.openCombinationSingleAssociationConfirm(
                                            item,
                                          );
                                        }}
                                      >
                                        {trans(
                                          "twoWay.associateSingleQuestion",
                                          "关联单题",
                                        )}
                                      </div>
                                      <div
                                        className={`${styles.viewResolution} ${styles.cursor} ${styles.comboAssociateButton}`}
                                        onClick={() => {
                                          this.openCombinationAssociationModal(
                                            item,
                                          );
                                        }}
                                      >
                                        {trans(
                                          "twoWay.associateCombination",
                                          "关联组合",
                                        )}
                                      </div>
                                    </>
                                  ) : null}

                                  {this.state.isguanlian &&
                                  this.getFillBlankParts(item).length > 0 ? (
                                    <div
                                      className={`${styles.viewResolution} ${styles.cursor} ${styles.blankAssociateButton}`}
                                      onClick={() => {
                                        this.openBlankAssociationModal(item);
                                      }}
                                    >
                                      {trans(
                                        "twoWay.associateBlank",
                                        "关联填空",
                                      )}
                                    </div>
                                  ) : null}

                                  <CandidateAnswerDetailsAction
                                    visible={this.isCandidateAnswerDetailsVisible(
                                      item,
                                    )}
                                    onToggle={() => {
                                      this.toggleCandidateAnswerDetails(
                                        this.getQuestionId(item),
                                      );
                                    }}
                                  />

                                  {linkedQuestionIds?.some((linkedId) =>
                                    this.isSameQuestionId(
                                      linkedId,
                                      this.getQuestionId(item) || item.id,
                                    ),
                                  ) ? (
                                    <div className={styles.isAddedContent}>
                                      <div
                                        className={`${styles.rightCancel} ${styles.cancelAdd}`}
                                        onClick={this.cancelAdd.bind(
                                          this,
                                          item.id,
                                          false,
                                        )}
                                      >
                                        {trans(
                                          "global.cancelAddBasket",
                                          "取消加入",
                                        )}
                                      </div>
                                    </div>
                                  ) : (
                                    <div
                                      className={styles.rightCancel}
                                      onClick={this.addTest.bind(
                                        this,
                                        item.id,
                                        item,
                                      )}
                                    >
                                      {trans("global.add", "添加")}
                                      <div
                                        className={`${styles.iconfont} transLateIcon`}
                                        style={{
                                          display: "none",
                                          zIndex: "999",
                                        }}
                                      >
                                        &#xe73c;
                                      </div>
                                    </div>
                                  )}
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
                            />
                          </div>
                          {trans("global.noQuestionList", "暂时没有题目哦")}
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          }
        />

        <Modal
          title={""}
          footer={null}
          centered={true}
          wrapClassName={styles.editModal}
          visible={this.state.editModalVisible}
          closable={false}
          destroyOnClose={true}
          onCancel={this.editModalCancel}
        >
          {this.props.questionItem && this.props.questionItem.questionId ? (
            <SingleInput
              editQuestion={this.props.questionItem}
              isAdapt={true}
              cancelModal={this.editModalCancel}
              // updateItem={this.updateItem}
              ifEdit={true}
            />
          ) : null}
        </Modal>

        <ComnModal
          options={{
            visible: questionModalVisible,
            centered: true,
            title: trans("global.prompt", "提示"),
            onOk: this.questionModalOk, // 提交表单
            onCancel: this.questionModaCancel,
          }}
          innerContent={
            <p style={{ display: "flex", alignItems: "center" }}>
              <Icon
                type="exclamation-circle"
                theme="filled"
                style={{ color: "#faad14", fontSize: "20px" }}
              />
              <div style={{ paddingLeft: "10px" }}>
                {trans(
                  "twoWay.cancelQuestionTypeWarning",
                  "该题型已经做过设置，取消这个题型，这些内容也会消失，",
                )}
                <br />
                {trans("twoWay.cancelQuestionTypeConfirm", "确认要取消吗？")}
              </div>
            </p>
          }
        />

        <EditLockModal
          visible={this.state.editLockModalVisible}
          message={messageText}
          onConfirm={this.confirmEditLockModal}
          onCancel={this.closeEditLockModal}
        />

        {this.state.maskVisible ? <div className={styles.maskDiv}></div> : null}
      </div>
    );
  }
}

export default connect(({ home, global, studyPictures, inputQuestion }) => ({
  subjectList: global.subjectList,
  questionList: home.questionList,
  questionTotal: home.questionTotal,
  labelList: inputQuestion.labelList,
  listIds: global.listIds,
  saveProps: global.saveProps,
  viewProps: global.viewProps,
  stuTypeList: global.stuTypeList,
  allGradeList: inputQuestion.allGradeList,
  segementDetail: global.segementDetail,
  questionItem: home.questionItem,
}))(TwoWayTest);
