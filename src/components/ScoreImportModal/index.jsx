import React, { PureComponent } from "react";
import {
  Button,
  Checkbox,
  DatePicker,
  Icon,
  Input,
  InputNumber,
  message,
  Modal,
  Select,
  Table,
  Upload,
} from "antd";
import { connect } from "dva";
import moment from "moment";
import PropTypes from "prop-types";

import { queryAllSubject, queryGradeClass } from "../../services/example";
import {
  confirmScoreImport,
  confirmZhixueScoreImport,
  downloadScoreImportTemplate,
  previewScoreImport,
  previewZhixueScoreImport,
  queryScoreImportAppendOptions,
  queryScoreImportSubjectPreset,
  saveScoreImportSubjectPreset,
} from "../../services/global";
import { locale, trans } from "../../utils/i18n";
import { CuModal } from "../Custom";
import {
  buildIssueOverview,
  buildScoreImportPayload,
  getPreviewSummaryCards,
  getQuestionWorkbookColumns,
  getQuestionWorkbookGroups,
  getQuestionWorkbookPreviewRows,
  getScoreCorrectionChangeSummary,
  getScoreWorkbookRows,
  getScoreWorkbookSubjectColumns,
  getSubjectConfigList,
  getSubjectIdList,
  IMPORT_MODE_APPEND,
  IMPORT_MODE_CREATE,
  IMPORT_SOURCE_STANDARD,
  IMPORT_SOURCE_ZHIXUE,
  joinIds,
  OVERWRITE_REPLACE,
  OVERWRITE_SKIP,
  SCORE_UPDATE_INCREMENTAL,
  SCORE_UPDATE_OVERWRITE,
  SCORE_UPDATE_RISK_THRESHOLD,
  summarizePreview,
  validateScoreImportForm,
  validateScoreImportUploadFile,
} from "./scoreImportUtils";

import styles from "./index.module.less";

const { Option } = Select;
const language = locale() !== "en";
const SCORE_IMPORT_SUBJECT_PRESET_CONFIG_TYPE = 11;
const DEFAULT_SUBJECT_SCORE_MAP = {
  语文: 150,
  数学: 150,
  英语: 150,
  物理: 100,
  化学: 100,
  生物: 100,
  政治: 100,
  历史: 100,
  地理: 100,
  科学: 160,
  社会: 100,
  道德与法治: 100,
  历史与社会: 100,
};
const BUILTIN_PRESETS = [
  {
    presetId: "builtin-chinese-single",
    presetName: "语文单科",
    subjects: [{ subjectName: "语文", fullScore: 150 }],
  },
  {
    presetId: "builtin-junior-all",
    presetName: "初中全科",
    subjects: [
      { subjectName: "语文", fullScore: 120 },
      { subjectName: "数学", fullScore: 120 },
      { subjectName: "英语", fullScore: 120 },
      { subjectName: "科学", fullScore: 160 },
      { subjectName: "历史与社会", fullScore: 100 },
    ],
  },
  {
    presetId: "builtin-senior-nine",
    presetName: "高中九科",
    subjects: [
      { subjectName: "语文", fullScore: 150 },
      { subjectName: "数学", fullScore: 150 },
      { subjectName: "英语", fullScore: 150 },
      { subjectName: "物理", fullScore: 100 },
      { subjectName: "化学", fullScore: 100 },
      { subjectName: "生物", fullScore: 100 },
      { subjectName: "政治", fullScore: 100 },
      { subjectName: "历史", fullScore: 100 },
      { subjectName: "地理", fullScore: 100 },
    ],
  },
];
const SUBJECT_PRESET_ALIAS_MAP = {
  历史与社会: ["历史与社会", "历史社会", "社会"],
  政治: ["政治", "思想政治", "道德与法治"],
};
let subjectConfigRowSeed = 0;

/**
 *
 */
function createEmptySubjectConfig() {
  subjectConfigRowSeed += 1;
  return {
    rowKey: `subject-config-${subjectConfigRowSeed}`,
    courseIdList: [],
    courseNameList: [],
    groupIdList: [],
    groupNameList: [],
    fullScore: undefined,
  };
}

/**
 *
 * @param item
 * @param zhKey
 * @param enKey
 */
function getOptionLabel(item, zhKey, enKey) {
  return language ? item?.[zhKey] : item?.[enKey] || item?.[zhKey];
}

/**
 * 将后端排序字段转换成稳定的数值，缺失或非法时排到最后，避免异常配置打乱正常年级。
 * @param {*} value 后端返回的排序字段值。
 * @returns {number} 用于年级排序的数值。
 */
function getGradeSortValue(value) {
  const sortValue = Number(value);
  return Number.isNaN(sortValue) ? Number.MAX_SAFE_INTEGER : sortValue;
}

/**
 * 成绩导入弹层只在本地展示层排序年级，不改动 dva 中共享的 allGrade 原始数据。
 * @param {Array<object>} gradeOptions 后端返回的年级列表。
 * @returns {Array<object>} 按 stage 升序、sort 升序排列后的年级列表副本。
 */
function sortGradeOptions(gradeOptions = []) {
  return [...gradeOptions].sort((previous, next) => {
    const stageDiff =
      getGradeSortValue(previous?.stage) - getGradeSortValue(next?.stage);
    if (stageDiff !== 0) {
      return stageDiff;
    }
    return getGradeSortValue(previous?.sort) - getGradeSortValue(next?.sort);
  });
}

/**
 *
 * @param value
 */
function normalizeSubjectName(value) {
  return String(value || "").replaceAll(/\s/g, "");
}

/**
 *
 * @param value
 */
function normalizeList(value) {
  if (Array.isArray(value)) {
    return value;
  }
  if (value === undefined || value === null || value === "") {
    return [];
  }
  return [value];
}

/**
 * 生成预设科目的可匹配名称，先精确匹配，再用少量业务别名兼容学校科目命名差异。
 * @param {string} subjectName 预设中的标准科目名称。
 * @returns {string[]} 归一化后的候选科目名称。
 */
function getSubjectPresetAliasNames(subjectName) {
  const names = [
    subjectName,
    ...(SUBJECT_PRESET_ALIAS_MAP[normalizeSubjectName(subjectName)] || []),
  ];
  return [...new Set(names.map(normalizeSubjectName).filter(Boolean))];
}

/**
 *
 * @param subjectName
 */
function getDefaultFullScore(subjectName) {
  return DEFAULT_SUBJECT_SCORE_MAP[normalizeSubjectName(subjectName)];
}

/**
 *
 * @param tone
 */
function getSummaryCardClass(tone) {
  switch (tone) {
    case "error": {
      return styles["summary-card-error"];
    }
    case "primary": {
      return styles["summary-card-primary"];
    }
    case "success": {
      return styles["summary-card-success"];
    }
    case "warning": {
      return styles["summary-card-warning"];
    }
    default: {
      return "";
    }
  }
}

/**
 *
 * @param columns
 * @param minWidth
 */
function getPreviewTableScrollX(columns, minWidth = 760) {
  const width = (columns || []).reduce(
    (total, column) => total + (Number(column?.width) || 140),
    0,
  );
  return Math.max(minWidth, width);
}

/**
 *
 * @param group
 */
function getGroupId(group) {
  return group?.groupId ?? group?.studentGroupId ?? group?.id;
}

/**
 *
 * @param group
 */
function getGroupName(group) {
  return (
    getOptionLabel(group || {}, "groupName", "groupEnName") ||
    group?.groupEName ||
    group?.name ||
    group?.studentGroupName ||
    ""
  );
}

/**
 *
 * @param course
 */
function getCourseId(course) {
  return course?.courseId ?? course?.id;
}

/**
 *
 * @param course
 */
function getCourseName(course) {
  return (
    getOptionLabel(course || {}, "courseName", "courseEnName") ||
    course?.name ||
    ""
  );
}

/**
 *
 * @param presetId
 */
function isCustomPreset(presetId) {
  return String(presetId || "").indexOf("custom-") === 0;
}

const mapStateToProperties = (state) => ({
  allGrade: state.home.allGrade,
  classList: state.home.classList,
  examTypeList: state.home.examTypeList,
  stageSubjectList: state.home.stageSubjectList,
  examList: state.home.examList,
});

export class ScoreImportModal extends PureComponent {
  static propTypes = {
    allGrade: PropTypes.arrayOf(PropTypes.shape({})),
    changeExamModal: PropTypes.func,
    classList: PropTypes.arrayOf(PropTypes.shape({})),
    dispatch: PropTypes.func.isRequired,
    examList: PropTypes.shape({}),
    examOptions: PropTypes.arrayOf(PropTypes.shape({})),
    examTypeList: PropTypes.arrayOf(PropTypes.shape({})),
    examVisble: PropTypes.bool,
    getPage: PropTypes.func,
    stageSubjectList: PropTypes.arrayOf(PropTypes.shape({})),
  };

  static defaultProps = {
    allGrade: [],
    changeExamModal: undefined,
    classList: [],
    examList: {},
    examOptions: [],
    examTypeList: [],
    examVisble: false,
    getPage: undefined,
    stageSubjectList: [],
  };

  constructor(properties) {
    super(properties);
    this.state = {
      importMode: IMPORT_MODE_CREATE,
      importSource: IMPORT_SOURCE_STANDARD,
      semesterId: this.getDefaultSemesterId(properties),
      gradeId: null,
      groupIdList: [],
      selectedSubjects: [],
      subjectMapCourse: {},
      customPresetList: [],
      loadingPresetConfig: false,
      presetId: undefined,
      presetName: "",
      examType: null,
      examName: "",
      examTime: "",
      generateSummaryReport: false,
      existingExamId: undefined,
      fileId: "",
      fileName: "",
      fileList: [],
      uploadPercent: 0,
      uploading: false,
      previewData: null,
      downloading: false,
      previewing: false,
      confirming: false,
      loadingAppendExamConfig: false,
      scoreUpdateMode: SCORE_UPDATE_INCREMENTAL,
      expandedIssueKeys: [],
      appendGroupList: [],
      currentStep: 0,
    };
  }

  componentDidMount() {
    this.props.dispatch({
      type: "home/getAllGrade",
      payload: {},
    });
    this.props.dispatch({
      type: "home/getExamType",
      payload: {
        type: 1,
      },
    });
    this.loadPresetConfig();
  }

  getDefaultSemesterId = (properties = this.props) => {
    const current = (properties.examOptions || []).find((item) => item.current);
    return current?.semesterId ?? "";
  };

  getExistingExamOptions = () => {
    const examList = this.props.examList?.examList || [];
    return examList.filter((item) => item?.examId);
  };

  getPresetOptions = () => [
    ...BUILTIN_PRESETS,
    ...(this.state.customPresetList || []),
  ];

  getSubjectOption = (subjectNameOrId) => {
    const targetName = normalizeSubjectName(subjectNameOrId);
    const matchedByIdOrName = (this.props.stageSubjectList || []).find(
      (item) =>
        String(item.id) === String(subjectNameOrId) ||
        normalizeSubjectName(item.name) === targetName,
    );
    if (matchedByIdOrName) {
      return matchedByIdOrName;
    }
    const aliasNames = getSubjectPresetAliasNames(subjectNameOrId);
    const aliasMatchedSubjects = (this.props.stageSubjectList || []).filter(
      (item) => aliasNames.includes(normalizeSubjectName(item.name)),
    );
    return aliasMatchedSubjects.length === 1 ? aliasMatchedSubjects[0] : null;
  };

  /**
   * 从后端读取当前教师在当前学校下保存的成绩导入预设；读取失败时只保留内置预设。
   * @returns {Promise<void>} 配置读取请求。
   */
  loadPresetConfig = () => {
    this.setState({
      loadingPresetConfig: true,
    });
    return queryScoreImportSubjectPreset({
      type: SCORE_IMPORT_SUBJECT_PRESET_CONFIG_TYPE,
    })
      .then((res) => {
        if (!res?.status) {
          message.error(
            res?.message ||
              trans("scoreImport.presetLoadFailed", "常用配置获取失败"),
          );
          return;
        }
        this.setState({
          customPresetList: Array.isArray(res.content) ? res.content : [],
        });
      })
      .catch(() => {
        message.error(
          trans("scoreImport.presetLoadFailed", "常用配置获取失败"),
        );
      })
      .finally(() => {
        this.setState({
          loadingPresetConfig: false,
        });
      });
  };

  /**
   * 覆盖保存当前教师在当前学校下的自定义成绩导入预设列表。
   * @param {Array<object>} customPresetList 自定义预设列表。
   * @returns {Promise<boolean>} 保存是否成功。
   */
  savePresetConfig = (customPresetList) =>
    saveScoreImportSubjectPreset({
      type: SCORE_IMPORT_SUBJECT_PRESET_CONFIG_TYPE,
      config: JSON.stringify(customPresetList || []),
    })
      .then((res) => {
        if (!res?.status) {
          message.error(
            res?.message ||
              trans("scoreImport.presetSaveFailed", "常用配置保存失败"),
          );
          return false;
        }
        return true;
      })
      .catch(() => {
        message.error(
          trans("scoreImport.presetSaveFailed", "常用配置保存失败"),
        );
        return false;
      });

  loadSubjectCourses = (subjectId, gradeId = this.state.gradeId) => {
    if (!subjectId || !gradeId) {
      return Promise.resolve([]);
    }
    if (this.state.subjectMapCourse[subjectId]) {
      return Promise.resolve(this.state.subjectMapCourse[subjectId]);
    }

    return queryAllSubject({
      gradeIdList: [gradeId],
      subjectId,
    })
      .then((res) => {
        if (!res?.status) {
          message.error(
            res?.message ||
              trans("scoreImport.courseListLoadFailed", "课程列表获取失败"),
          );
          return [];
        }
        const courseList = res.content || [];
        if (String(this.state.gradeId) !== String(gradeId)) {
          return courseList;
        }
        this.setState({
          subjectMapCourse: {
            ...this.state.subjectMapCourse,
            [subjectId]: courseList,
          },
        });
        return courseList;
      })
      .catch(() => {
        message.error(
          trans("scoreImport.courseListLoadFailed", "课程列表获取失败"),
        );
        return [];
      });
  };

  loadCoursesForSubjects = (subjects) => {
    for (const item of subjects || []) {
      const subjectId = item.subjectId || item.key || item.value;
      this.loadSubjectCourses(subjectId);
    }
  };

  /**
   * 跨年级使用预设时，只复用当前年级仍然存在的课程和班级，避免旧年级 ID 进入导入链路。
   * @param {object} subjectConfig 已匹配到当前年级学科的预设配置。
   * @param {*} gradeId 当前使用预设的年级 ID。
   * @returns {Promise<object>} 过滤后的学科配置。
   */
  filterPresetSubjectConfig = (subjectConfig, gradeId = this.state.gradeId) => {
    const emptyRelationConfig = {
      ...subjectConfig,
      courseIdList: [],
      courseNameList: [],
      groupIdList: [],
      groupNameList: [],
      groupOptionList: [],
    };
    return this.loadSubjectCourses(subjectConfig.subjectId, gradeId).then(
      (courseList) => {
        const courseOptionMap = new Map(
          (courseList || []).map((course) => [
            String(getCourseId(course)),
            course,
          ]),
        );
        const availableCourseList = normalizeList(subjectConfig.courseIdList)
          .map((courseId) => courseOptionMap.get(String(courseId)))
          .filter(Boolean);
        const courseIdList = availableCourseList.map(getCourseId);
        const courseNameList = availableCourseList
          .map(getCourseName)
          .filter(Boolean);
        if (courseIdList.length === 0) {
          return emptyRelationConfig;
        }
        return queryGradeClass({
          gradeIdList: [gradeId],
          subjectId: subjectConfig.subjectId,
          courseIdList,
          semesterId: this.state.semesterId,
        })
          .then((res) => {
            if (!res?.status) {
              message.error(
                res?.message ||
                  trans("scoreImport.classListLoadFailed", "班级列表获取失败"),
              );
              return {
                ...emptyRelationConfig,
                courseIdList,
                courseNameList,
              };
            }
            const groupOptionList = res.content || [];
            const groupOptionMap = new Map(
              groupOptionList
                .map((group) => [String(getGroupId(group)), group])
                .filter(
                  ([groupId]) => groupId !== "undefined" && groupId !== "null",
                ),
            );
            const availableGroupList = normalizeList(subjectConfig.groupIdList)
              .map((groupId) => groupOptionMap.get(String(groupId)))
              .filter(Boolean);
            return {
              ...subjectConfig,
              courseIdList,
              courseNameList,
              groupOptionList,
              groupIdList: availableGroupList.map(getGroupId),
              groupNameList: availableGroupList
                .map(getGroupName)
                .filter(Boolean),
            };
          })
          .catch(() => {
            message.error(
              trans("scoreImport.classListLoadFailed", "班级列表获取失败"),
            );
            return {
              ...emptyRelationConfig,
              courseIdList,
              courseNameList,
            };
          });
      },
    );
  };

  mergeSubjectConfig = (subject) => {
    const subjectId = subject.subjectId || subject.key || subject.value;
    const subjectName = subject.subjectName || subject.label;
    return {
      rowKey: subject.rowKey || createEmptySubjectConfig().rowKey,
      key: subjectId,
      label: subjectName,
      subjectId,
      subjectName,
      courseIdList: normalizeList(subject.courseIdList || subject.courseId),
      courseNameList: normalizeList(subject.courseNameList),
      groupIdList: normalizeList(subject.groupIdList),
      groupNameList: normalizeList(subject.groupNameList),
      groupOptionList: normalizeList(
        subject.groupOptionList || subject.groupList,
      ),
      fullScore:
        subject.fullScore ??
        subject.totalScore ??
        getDefaultFullScore(subjectName),
    };
  };

  isSingleSubjectMode = (
    importSource = this.state.importSource,
    importMode = this.state.importMode,
  ) =>
    importMode !== IMPORT_MODE_APPEND && importSource === IMPORT_SOURCE_ZHIXUE;

  limitSubjectsForMode = (
    subjects = this.state.selectedSubjects,
    importSource = this.state.importSource,
  ) => {
    if (!this.isSingleSubjectMode(importSource)) {
      return subjects || [];
    }
    return subjects?.length ? [subjects[0]] : [];
  };

  updateSelectedSubjects = (selectedSubjects) => {
    this.resetPreview({
      selectedSubjects: this.limitSubjectsForMode(selectedSubjects),
    });
    this.loadCoursesForSubjects(selectedSubjects);
  };

  getSubjectRowKey = (item, index) =>
    item?.rowKey || `${item?.subjectId || "empty"}-${index}`;

  getSubjectPaperName = (subjectName) => {
    const examName = String(this.state.examName || "").trim();
    const cleanSubjectName = String(subjectName || "").trim();
    if (!examName || !cleanSubjectName) {
      return "";
    }
    return `${examName}-${cleanSubjectName}`;
  };

  getSubjectGroupList = (subjects = this.state.selectedSubjects) => {
    const groupMap = new Map();
    for (const subject of subjects || []) {
      for (const [index, groupId] of (subject.groupIdList || []).entries()) {
        if (groupId === undefined || groupId === null || groupId === "") {
          continue;
        }
        const key = String(groupId);
        if (!groupMap.has(key)) {
          groupMap.set(key, {
            groupId,
            groupName: subject.groupNameList?.[index] || String(groupId),
          });
        }
      }
    }
    return [...groupMap.values()];
  };

  getSubjectGroupIdList = (subjects = this.state.selectedSubjects) =>
    this.getSubjectGroupList(subjects).map((group) => group.groupId);

  getGroupOptionsForRow = (subjectConfig) => {
    const optionMap = new Map();
    for (const group of subjectConfig.groupOptionList || []) {
      const groupId = getGroupId(group);
      if (groupId === undefined || groupId === null) {
        continue;
      }
      optionMap.set(String(groupId), {
        groupId,
        groupName: getGroupName(group) || String(groupId),
      });
    }
    for (const [index, groupId] of (
      subjectConfig.groupIdList || []
    ).entries()) {
      const key = String(groupId);
      if (!optionMap.has(key)) {
        optionMap.set(key, {
          groupId,
          groupName: subjectConfig.groupNameList?.[index] || String(groupId),
        });
      }
    }
    return [...optionMap.values()];
  };

  getFormData = () => {
    const {
      importMode,
      importSource,
      existingExamId,
      examName,
      examTime,
      semesterId,
      gradeId,
      groupIdList,
      selectedSubjects,
      examType,
      fileId,
      fileName,
      generateSummaryReport,
      scoreUpdateMode,
    } = this.state;

    return {
      importMode,
      importSource,
      existingExamId,
      examName,
      examTime,
      semesterId,
      gradeId,
      groupIdList:
        this.getSubjectGroupIdList().length > 0
          ? this.getSubjectGroupIdList()
          : groupIdList,
      selectedSubjects,
      examType,
      fileId,
      fileName,
      generateSummaryReport: Boolean(generateSummaryReport),
      scoreUpdateMode,
    };
  };

  resetPreview = (nextState = {}) => {
    this.setState({
      expandedIssueKeys: [],
      previewData: null,
      ...nextState,
    });
  };

  closeModal = () => {
    this.props.changeExamModal && this.props.changeExamModal();
  };

  changeImportSource = (event) => {
    const importSource = event.target.value;
    this.resetPreview({
      importSource,
      selectedSubjects: this.limitSubjectsForMode(
        this.state.selectedSubjects,
        importSource,
      ),
    });
  };

  changeImportMode = (importMode) => {
    if (importMode === this.state.importMode) {
      return;
    }
    if (importMode === IMPORT_MODE_APPEND) {
      message.info(
        trans("scoreImport.appendModeComingSoon", "暂未开发，敬请期待"),
      );
      return;
    }
    this.resetPreview({
      importMode,
      importSource: IMPORT_SOURCE_STANDARD,
      existingExamId: undefined,
      examName: "",
      examTime: "",
      gradeId: null,
      groupIdList: [],
      selectedSubjects: [],
      appendGroupList: [],
      presetId: undefined,
      presetName: "",
      generateSummaryReport: false,
      fileId: "",
      fileName: "",
      fileList: [],
      uploadPercent: 0,
      uploading: false,
      scoreUpdateMode: SCORE_UPDATE_INCREMENTAL,
      currentStep: 0,
    });
  };

  changeExistingExam = (examId) => {
    const exam = this.getExistingExamOptions().find(
      (item) => String(item.examId) === String(examId),
    );
    const examTime = exam?.examDate || exam?.createDate || "";
    this.resetPreview({
      existingExamId: examId,
      examName: exam?.examName || "",
      examTime: moment(examTime).isValid()
        ? moment(examTime).format("YYYY-MM-DD")
        : "",
      gradeId: exam?.gradeId || null,
      groupIdList: [],
      selectedSubjects: [],
      appendGroupList: [],
      presetId: undefined,
      loadingAppendExamConfig: true,
    });
    queryScoreImportAppendOptions({ examId })
      .then((res) => {
        if (String(this.state.existingExamId) !== String(examId)) {
          return;
        }
        if (!res?.status) {
          message.error(
            res?.message ||
              trans(
                "scoreImport.correctableSubjectsLoadFailed",
                "可订正学科获取失败",
              ),
          );
          return;
        }
        const content = res.content || {};
        const appendGroupList = content.groupList || [];
        const appendGroupIdList =
          content.groupIdList || appendGroupList.map(getGroupId);
        const appendGroupNameList =
          content.groupNameList || appendGroupList.map(getGroupName);
        const subjectConfigList = (content.subjectConfigList || []).map(
          (item) =>
            this.mergeSubjectConfig({
              ...item,
              groupIdList: item.groupIdList || appendGroupIdList,
              groupNameList: item.groupNameList || appendGroupNameList,
              groupOptionList: item.groupList || appendGroupList,
            }),
        );
        const examConfigTime =
          content.examTime ||
          content.examDate ||
          content.createDate ||
          examTime;
        this.resetPreview({
          examName: content.examName || exam?.examName || "",
          examTime: moment(examConfigTime).isValid()
            ? moment(examConfigTime).format("YYYY-MM-DD")
            : this.state.examTime,
          semesterId: content.semesterId ?? this.state.semesterId,
          gradeId: content.gradeId ?? exam?.gradeId ?? this.state.gradeId,
          groupIdList: appendGroupIdList,
          appendGroupList,
          selectedSubjects: subjectConfigList,
        });
        this.loadCoursesForSubjects(subjectConfigList);
        if (subjectConfigList.length === 0) {
          message.warning(
            trans(
              "scoreImport.noCorrectableSubjects",
              "当前考试没有可订正成绩的学科",
            ),
          );
        }
      })
      .finally(() => {
        this.setState({
          loadingAppendExamConfig: false,
        });
      })
      .catch(() => {
        message.error(
          trans(
            "scoreImport.correctableSubjectsLoadFailed",
            "可订正学科获取失败",
          ),
        );
      });
  };

  changeSemester = (semesterId) => {
    this.resetPreview({
      semesterId,
      gradeId: null,
      groupIdList: [],
      selectedSubjects: [],
      subjectMapCourse: {},
      presetId: undefined,
      presetName: "",
      currentStep: 0,
    });
  };

  changeGrade = (gradeId) => {
    this.resetPreview({
      gradeId,
      groupIdList: [],
      selectedSubjects: [],
      subjectMapCourse: {},
      presetId: undefined,
      presetName: "",
    });

    this.props.dispatch({
      type: "home/subjectListByGrades",
      payload: {
        gradeIds: gradeId,
      },
    });
  };

  changeSubjects = (value) => {
    const nextSubjects = Array.isArray(value) ? value : value ? [value] : [];
    const existingConfigMap = new Map(
      (this.state.selectedSubjects || []).map((item) => [
        String(item.subjectId || item.key || item.value),
        item,
      ]),
    );
    this.updateSelectedSubjects(
      nextSubjects.map((item) =>
        this.mergeSubjectConfig({
          ...item,
          ...existingConfigMap.get(String(item.key || item.value)),
          key: item.key || item.value,
          label: item.label,
        }),
      ),
    );
  };

  addSubjectConfig = () => {
    if (!this.state.gradeId) {
      message.error(trans("scoreImport.gradeRequired", "请先选择年级"));
      return;
    }
    if (
      this.isSingleSubjectMode() &&
      getSubjectConfigList(this.state.selectedSubjects).length > 0
    ) {
      message.warning(
        trans("scoreImport.singleSubjectOnly", "当前导入方式只能配置一个学科"),
      );
      return;
    }
    this.resetPreview({
      selectedSubjects: [
        ...(this.state.selectedSubjects || []),
        createEmptySubjectConfig(),
      ],
    });
  };

  changeSubjectConfigSubject = (value, index) => {
    if (!this.state.gradeId) {
      message.error(trans("scoreImport.gradeRequired", "请先选择年级"));
      return;
    }
    const selectedSubjects = [...(this.state.selectedSubjects || [])];
    const current = selectedSubjects[index] || createEmptySubjectConfig();
    if (!value) {
      selectedSubjects[index] = {
        ...createEmptySubjectConfig(),
        rowKey: current.rowKey,
      };
      this.resetPreview({
        selectedSubjects,
      });
      return;
    }
    const subjectId = value.key || value.value;
    const subjectName = value.label;
    selectedSubjects[index] = this.mergeSubjectConfig({
      rowKey: current.rowKey,
      key: subjectId,
      label: subjectName,
      subjectId,
      subjectName,
      courseIdList: [],
      courseNameList: [],
    });
    this.resetPreview({
      selectedSubjects: this.limitSubjectsForMode(selectedSubjects),
    });
    this.loadSubjectCourses(subjectId);
  };

  loadGroupsForSubjectCourse = (index, subjectId, courseIdList) => {
    const rowKey = this.state.selectedSubjects[index]?.rowKey;
    if (
      !rowKey ||
      !subjectId ||
      !this.state.gradeId ||
      !courseIdList ||
      courseIdList.length === 0
    ) {
      return;
    }

    queryGradeClass({
      gradeIdList: [this.state.gradeId],
      subjectId,
      courseIdList,
      semesterId: this.state.semesterId,
    })
      .then((res) => {
        if (!res?.status) {
          message.error(
            res?.message ||
              trans("scoreImport.classListLoadFailed", "班级列表获取失败"),
          );
          return;
        }
        const groupOptionList = res.content || [];
        const normalizedGroupList = groupOptionList
          .map((group) => ({
            groupId: getGroupId(group),
            groupName: getGroupName(group),
          }))
          .filter(
            (group) =>
              group.groupId !== undefined &&
              group.groupId !== null &&
              group.groupId !== "",
          );
        const groupIdList = normalizedGroupList.map((group) => group.groupId);
        const groupNameList = normalizedGroupList.map(
          (group) => group.groupName || String(group.groupId),
        );
        this.resetPreview({
          selectedSubjects: (this.state.selectedSubjects || []).map((item) => {
            if (
              item.rowKey !== rowKey ||
              String(item.subjectId) !== String(subjectId) ||
              joinIds(item.courseIdList || []) !== joinIds(courseIdList)
            ) {
              return item;
            }
            return {
              ...item,
              groupOptionList,
              groupIdList,
              groupNameList,
            };
          }),
        });
      })
      .catch(() => {
        message.error(
          trans("scoreImport.classListLoadFailed", "班级列表获取失败"),
        );
      });
  };

  changeSubjectCourse = (index, courseIdList) => {
    const subjectId = this.state.selectedSubjects[index]?.subjectId;
    const courseOptions = this.state.subjectMapCourse[subjectId] || [];
    const courseNameList = (courseIdList || [])
      .map((courseId) => {
        const course = courseOptions.find(
          (item) => String(item.courseId) === String(courseId),
        );
        return course?.courseName;
      })
      .filter(Boolean);
    this.setState(
      {
        expandedIssueKeys: [],
        previewData: null,
        selectedSubjects: (this.state.selectedSubjects || []).map(
          (item, rowIndex) =>
            rowIndex === index
              ? {
                  ...item,
                  courseIdList,
                  courseNameList,
                  groupIdList: [],
                  groupNameList: [],
                  groupOptionList: [],
                }
              : item,
        ),
      },
      () => {
        this.loadGroupsForSubjectCourse(index, subjectId, courseIdList);
      },
    );
  };

  changeSubjectGroups = (index, groupIdList) => {
    const subjectConfig = this.state.selectedSubjects[index] || {};
    const groupOptions = this.getGroupOptionsForRow(subjectConfig);
    const groupNameList = (groupIdList || [])
      .map((groupId) => {
        const group = groupOptions.find(
          (item) => String(item.groupId) === String(groupId),
        );
        return group?.groupName || String(groupId);
      })
      .filter(Boolean);
    this.resetPreview({
      selectedSubjects: (this.state.selectedSubjects || []).map(
        (item, rowIndex) =>
          rowIndex === index
            ? {
                ...item,
                groupIdList,
                groupNameList,
              }
            : item,
      ),
    });
  };

  changeSubjectFullScore = (index, fullScore) => {
    this.resetPreview({
      selectedSubjects: (this.state.selectedSubjects || []).map(
        (item, rowIndex) =>
          rowIndex === index
            ? {
                ...item,
                fullScore,
              }
            : item,
      ),
    });
  };

  removeSubjectConfig = (index) => {
    this.resetPreview({
      selectedSubjects: (this.state.selectedSubjects || []).filter(
        (item, rowIndex) => rowIndex !== index,
      ),
    });
  };

  clearSubjectConfig = () => {
    this.resetPreview({
      selectedSubjects: [],
      presetId: undefined,
      presetName: "",
    });
  };

  applyPreset = (presetId) => {
    const preset = this.getPresetOptions().find(
      (item) => item.presetId === presetId,
    );
    if (!preset) {
      message.error(trans("scoreImport.presetRequired", "请选择要载入的配置"));
      return;
    }
    if (!this.state.gradeId) {
      message.error(trans("scoreImport.gradeRequired", "请先选择年级"));
      return;
    }
    const selectedSubjects = (preset.subjects || [])
      .map((subject) => {
        const subjectOption = this.getSubjectOption(
          subject.subjectId || subject.subjectName,
        );
        if (!subjectOption) {
          return null;
        }
        return this.mergeSubjectConfig({
          ...subject,
          key: subjectOption.id,
          label: subjectOption.name,
          subjectId: subjectOption.id,
          subjectName: subjectOption.name,
        });
      })
      .filter(Boolean);
    const subjectLimit =
      this.state.importSource === IMPORT_SOURCE_ZHIXUE
        ? 1
        : selectedSubjects.length;
    const limitedSubjects = selectedSubjects.slice(0, subjectLimit);

    if (limitedSubjects.length === 0) {
      message.error(
        trans(
          "scoreImport.noMatchedPresetSubjects",
          "当前年级下没有匹配到预设学科",
        ),
      );
      return;
    }
    if (limitedSubjects.length < (preset.subjects || []).length) {
      message.warning(
        trans(
          "scoreImport.partialPresetSubjectsUnmatched",
          "部分预设学科未在当前年级下匹配到",
        ),
      );
    }
    const gradeId = this.state.gradeId;
    this.setState({
      expandedIssueKeys: [],
      previewData: null,
      loadingPresetConfig: true,
    });
    return Promise.all(
      limitedSubjects.map((subject) =>
        this.filterPresetSubjectConfig(subject, gradeId),
      ),
    )
      .then((validatedSubjects) => {
        if (String(this.state.gradeId) !== String(gradeId)) {
          return;
        }
        this.setState({
          expandedIssueKeys: [],
          previewData: null,
          presetId,
          presetName: preset.presetName,
          selectedSubjects: this.limitSubjectsForMode(validatedSubjects),
        });
      })
      .finally(() => {
        this.setState({
          loadingPresetConfig: false,
        });
      });
  };

  savePreset = () => {
    const selectedPreset = this.getPresetOptions().find(
      (item) => item.presetId === this.state.presetId,
    );
    const presetName = String(
      this.state.presetName || selectedPreset?.presetName || "",
    ).trim();
    const subjects = getSubjectConfigList(this.state.selectedSubjects);
    if (!presetName) {
      message.error(trans("scoreImport.presetNameRequired", "请输入配置名称"));
      return;
    }
    if (subjects.length === 0) {
      message.error(trans("scoreImport.subjectRequired", "请先选择考试科目"));
      return;
    }
    const saveAsCustom =
      !selectedPreset ||
      isCustomPreset(selectedPreset.presetId) ||
      presetName !== selectedPreset.presetName;
    if (
      selectedPreset &&
      !isCustomPreset(selectedPreset.presetId) &&
      !saveAsCustom
    ) {
      message.error(
        trans(
          "scoreImport.builtinPresetCannotOverwrite",
          "内置配置不能覆盖，请输入新配置名称后另存",
        ),
      );
      return;
    }
    const presetId =
      selectedPreset && isCustomPreset(selectedPreset.presetId)
        ? selectedPreset.presetId
        : `custom-${Date.now()}`;
    const preset = {
      presetId,
      presetName,
      subjects: subjects.map((item) => ({
        subjectId: item.subjectId,
        subjectName: item.subjectName,
        courseIdList: item.courseIdList || [],
        courseNameList: item.courseNameList || [],
        groupIdList: item.groupIdList || [],
        groupNameList: item.groupNameList || [],
        fullScore: item.fullScore,
      })),
    };
    const customPresetList = [
      ...(this.state.customPresetList || []).filter(
        (item) =>
          item.presetName !== presetName && item.presetId !== preset.presetId,
      ),
      preset,
    ];
    this.setState({
      loadingPresetConfig: true,
    });
    return this.savePresetConfig(customPresetList)
      .then((success) => {
        if (!success) {
          return;
        }
        this.setState({
          customPresetList,
          presetName: preset.presetName,
          presetId: preset.presetId,
        });
        message.success(
          selectedPreset && isCustomPreset(selectedPreset.presetId)
            ? "常用配置已覆盖"
            : "常用配置已创建",
        );
      })
      .finally(() => {
        this.setState({
          loadingPresetConfig: false,
        });
      });
  };

  deletePreset = () => {
    const selectedPreset = this.getPresetOptions().find(
      (item) => item.presetId === this.state.presetId,
    );
    if (!selectedPreset) {
      message.error(
        trans("scoreImport.deletePresetRequired", "请选择要删除的配置"),
      );
      return;
    }
    if (!isCustomPreset(selectedPreset.presetId)) {
      message.error(
        trans("scoreImport.builtinPresetCannotDelete", "内置配置不能删除"),
      );
      return;
    }
    const customPresetList = (this.state.customPresetList || []).filter(
      (item) => item.presetId !== selectedPreset.presetId,
    );
    this.setState({
      loadingPresetConfig: true,
    });
    return this.savePresetConfig(customPresetList)
      .then((success) => {
        if (!success) {
          return;
        }
        this.setState({
          customPresetList,
          presetId: undefined,
          presetName: "",
        });
        message.success(trans("scoreImport.presetDeleted", "常用配置已删除"));
      })
      .finally(() => {
        this.setState({
          loadingPresetConfig: false,
        });
      });
  };

  changeExamTime = (dateValue) => {
    this.resetPreview({
      examTime: dateValue ? dateValue.format("YYYY-MM-DD") : "",
    });
  };

  changeUpload = (info, importSource = this.state.importSource) => {
    const fileList = [...info.fileList].slice(-1);
    const file = info.file;
    const response = file.response;
    const uploadPercent = Math.round(file.percent || 0);

    if (!file.status) {
      return;
    }

    if (file.status === "uploading") {
      this.setState({
        importSource,
        fileList,
        uploadPercent,
        uploading: true,
      });
      return;
    }

    if (file.status === "done") {
      if (response?.status && response?.content?.[0]?.fileId) {
        // 上传成功后立即触发校验，避免老师在上传和校验之间再点一次。
        this.setState(
          {
            expandedIssueKeys: [],
            previewData: undefined,
            importSource,
            fileId: response.content[0].fileId,
            fileName: file.name || response.content[0].fileName || "",
            fileList,
            uploadPercent: 100,
            uploading: false,
          },
          () => {
            this.previewImport();
          },
        );
        message.success(
          this.state.importMode === IMPORT_MODE_APPEND
            ? "上传完成，正在校验订正"
            : "上传完成，正在校验预览",
        );
        return;
      }
      this.setState({
        importSource,
        fileList,
        uploadPercent: 0,
        uploading: false,
      });
      message.error(
        response?.message ||
          trans("scoreImport.fileUploadFailed", "文件上传失败"),
      );
      return;
    }

    if (file.status === "error") {
      this.setState({
        importSource,
        fileList,
        uploadPercent: 0,
        uploading: false,
      });
      message.error(
        trans("scoreImport.fileUploadFailedWithName", "{$fileName} 上传失败", {
          fileName: file.name,
        }),
      );
      return;
    }

    this.setState({
      importSource,
      fileList,
      uploadPercent,
    });
  };

  beforeUpload = (file, options = {}) => {
    if (this.state.loadingPresetConfig) {
      message.warning(
        trans("scoreImport.presetLoading", "常用配置加载中，请稍后再操作"),
      );
      return false;
    }
    const error = validateScoreImportUploadFile(file, {
      allowZip:
        options.allowZip ?? this.state.importSource === IMPORT_SOURCE_ZHIXUE,
    });
    if (error) {
      message.error(error);
      return false;
    }
    return true;
  };

  deleteFile = () => {
    this.resetPreview({
      fileId: "",
      fileName: "",
      fileList: [],
      uploadPercent: 0,
      uploading: false,
    });
  };

  validateBaseForm = ({ needFile }) => {
    const formData = this.getFormData();
    const error = validateScoreImportForm({
      ...formData,
      fileId: needFile ? formData.fileId : "template-download",
    });
    if (error) {
      message.error(error);
      return false;
    }
    return true;
  };

  getSelectedGroupList = () => {
    if (
      this.state.importMode === IMPORT_MODE_APPEND &&
      this.state.appendGroupList?.length
    ) {
      return this.state.appendGroupList;
    }
    return this.getSubjectGroupList();
  };

  buildSelectedRosterParams = () => {
    const selectedGroups = this.getSelectedGroupList();
    const selectedSubjects = getSubjectConfigList(this.state.selectedSubjects);
    const groupIdList = selectedGroups.map((item) => getGroupId(item));
    return {
      groupIdListString: joinIds(groupIdList),
      groupNameListString: selectedGroups
        .map((item) => getGroupName(item))
        .filter(Boolean)
        .join(","),
      subjectIdListString: joinIds(
        selectedSubjects.map((item) => item.subjectId),
      ),
      subjectNameListString: selectedSubjects
        .map((item) => item.subjectName)
        .filter(Boolean)
        .join(","),
      subjectConfigListString: JSON.stringify(
        selectedSubjects.map((item) => ({
          subjectId: item.subjectId,
          subjectName: item.subjectName,
          courseIdList: item.courseIdList || [],
          courseNameList: item.courseNameList || [],
          groupIdList: item.groupIdList || [],
          groupNameList: item.groupNameList || [],
          fullScore: item.fullScore,
        })),
      ),
    };
  };

  getTemplateDownloadFileName = () => {
    const isAppend = this.state.importMode === IMPORT_MODE_APPEND;
    const examName = String(this.state.examName || "成绩导入")
      .trim()
      .replaceAll(/\s+/g, "")
      .replaceAll(/["*/:<>?[\\\]|]/g, "")
      .slice(0, 80);
    const examTime = String(this.state.examTime || "")
      .trim()
      .replaceAll(/["*/:<>?[\\\]|]/g, "");
    const suffix = isAppend ? "_原始成绩" : "";
    return `${examName || "成绩导入"}${
      examTime ? `_${examTime}` : ""
    }${suffix}.xlsx`;
  };

  buildTemplateParams = () => ({
    examId: this.state.existingExamId,
    existingExamId: this.state.existingExamId,
    examName: this.state.examName,
    examTime: this.state.examTime,
    semesterId: this.state.semesterId,
    gradeId: this.state.gradeId,
    groupIdList: this.getSubjectGroupIdList(),
    subjectIdList: getSubjectIdList(this.state.selectedSubjects),
    ...this.buildSelectedRosterParams(),
    importMode: this.state.importMode,
  });

  downloadTemplate = () => {
    if (this.state.loadingPresetConfig) {
      message.warning(
        trans("scoreImport.presetLoading", "常用配置加载中，请稍后再操作"),
      );
      return;
    }
    if (!this.validateBaseForm({ needFile: false })) {
      return;
    }

    const isAppend = this.state.importMode === IMPORT_MODE_APPEND;
    const failMessage = isAppend
      ? trans("scoreImport.downloadOriginalScoreFailed", "下载原始成绩失败")
      : trans("scoreImport.downloadTemplateFailed", "下载模板失败");
    this.setState({
      downloading: true,
    });
    downloadScoreImportTemplate(this.buildTemplateParams())
      .then((res) => {
        if (!res?.success) {
          message.error(res?.message || failMessage);
          return;
        }
        const blobUrl = window.URL.createObjectURL(res.blob);
        const anchor = document.createElement("a");
        anchor.href = blobUrl;
        anchor.download = res.fileName || this.getTemplateDownloadFileName();
        document.body.append(anchor);
        anchor.click();
        anchor.remove();
        window.URL.revokeObjectURL(blobUrl);
      })
      .catch(() => {
        message.error(failMessage);
      })
      .finally(() => {
        this.setState({
          downloading: false,
        });
      });
  };

  previewImport = () => {
    const isAppend = this.state.importMode === IMPORT_MODE_APPEND;
    if (this.state.loadingPresetConfig) {
      message.warning(
        trans("scoreImport.presetLoading", "常用配置加载中，请稍后再操作"),
      );
      return;
    }
    if (this.state.uploading) {
      message.warning(
        isAppend
          ? "文件上传中，请等待上传完成后再校验订正"
          : "文件上传中，请等待上传完成后再校验",
      );
      return;
    }
    if (!this.validateBaseForm({ needFile: true })) {
      return;
    }

    const payload = {
      ...buildScoreImportPayload(this.getFormData()),
      ...this.buildSelectedRosterParams(),
    };
    const previewRequest =
      this.state.importSource === IMPORT_SOURCE_ZHIXUE
        ? previewZhixueScoreImport
        : previewScoreImport;

    this.setState({
      previewing: true,
    });
    previewRequest(payload)
      .then((res) => {
        if (res?.status) {
          this.setState({
            expandedIssueKeys: [],
            previewData: res.content,
          });
          message.success(
            res.message || (isAppend ? "校验订正完成" : "校验完成"),
          );
          return;
        }
        message.error(
          res?.message || trans("scoreImport.validationFailed", "校验失败"),
        );
      })
      .finally(() => {
        this.setState({
          previewing: false,
        });
      });
  };

  submitConfirmImport = () => {
    const { previewData, scoreUpdateMode } = this.state;
    const isAppend = this.state.importMode === IMPORT_MODE_APPEND;
    const payload = {
      ...buildScoreImportPayload(this.getFormData()),
      ...this.buildSelectedRosterParams(),
      previewId: previewData.previewId,
      updateMode: isAppend ? scoreUpdateMode : undefined,
      overwritePolicy: isAppend ? OVERWRITE_REPLACE : OVERWRITE_SKIP,
    };
    this.setState({
      confirming: true,
    });
    const confirmRequest =
      this.state.importSource === IMPORT_SOURCE_ZHIXUE
        ? confirmZhixueScoreImport
        : confirmScoreImport;
    confirmRequest(payload)
      .then((res) => {
        if (res?.status) {
          message.success(
            res.message ||
              (isAppend
                ? trans("scoreImport.correctionSuccess", "订正成功")
                : trans("scoreImport.importSuccess", "导入成功")),
          );
          this.props.getPage && this.props.getPage();
          this.closeModal();
          return;
        }
        if (res?.content?.preview) {
          this.setState({
            expandedIssueKeys: [],
            previewData: res.content.preview,
          });
        }
        message.error(
          res?.message ||
            (isAppend
              ? trans("scoreImport.correctionFailed", "订正失败")
              : trans("scoreImport.importFailed", "导入失败")),
        );
      })
      .finally(() => {
        this.setState({
          confirming: false,
        });
      });
  };

  getOverwriteRiskSummary = () => {
    const { previewData, scoreUpdateMode } = this.state;
    if (
      this.state.importMode !== IMPORT_MODE_APPEND ||
      scoreUpdateMode !== SCORE_UPDATE_OVERWRITE
    ) {
      return;
    }
    const changeSummary = getScoreCorrectionChangeSummary(previewData);
    return changeSummary.total > SCORE_UPDATE_RISK_THRESHOLD
      ? changeSummary
      : undefined;
  };

  showOverwriteRiskConfirm = (changeSummary) => {
    Modal.confirm({
      title: trans("scoreImport.confirmOverwriteTitle", "确认覆盖更新？"),
      content: (
        <div>
          <p>
            {trans(
              "scoreImport.confirmOverwriteDescription",
              "覆盖更新会以当前上传文件为准，当前列表不为空的成绩会进入覆盖范围。",
            )}
          </p>
          <p>
            {trans(
              "scoreImport.confirmOverwriteSummary",
              "本次预计影响 {$total} 名学生，其中新增 {$added} 人、修改 {$updated} 人、删除 {$deleted} 人。",
              {
                total: changeSummary.total,
                added: changeSummary.added,
                updated: changeSummary.updated,
                deleted: changeSummary.deleted,
              },
            )}
          </p>
        </div>
      ),
      okText: "确认覆盖入库",
      okType: "danger",
      cancelText: "返回检查",
      onOk: this.submitConfirmImport,
    });
  };

  confirmImport = () => {
    const { previewData } = this.state;
    const isAppend = this.state.importMode === IMPORT_MODE_APPEND;
    if (this.state.uploading) {
      message.warning(
        isAppend
          ? "文件上传中，请等待上传完成后再订正"
          : "文件上传中，请等待上传完成后再导入",
      );
      return;
    }
    if (!previewData?.previewId) {
      message.error(
        isAppend
          ? trans("scoreImport.validateCorrectionFirst", "请先完成校验订正")
          : trans("scoreImport.validatePreviewFirst", "请先完成校验预览"),
      );
      return;
    }
    if (previewData.errors?.length) {
      message.error(
        trans(
          "scoreImport.blockingErrorsBeforeSubmit",
          "存在阻断错误，请修正后重新上传校验",
        ),
      );
      return;
    }

    const overwriteRiskSummary = this.getOverwriteRiskSummary();
    if (overwriteRiskSummary) {
      this.showOverwriteRiskConfirm(overwriteRiskSummary);
      return;
    }

    this.submitConfirmImport();
  };

  handleOk = () => {
    if (this.state.loadingPresetConfig) {
      message.warning(
        trans("scoreImport.presetLoading", "常用配置加载中，请稍后再操作"),
      );
      return;
    }
    if (this.state.currentStep === 0) {
      if (this.validateBaseForm({ needFile: false })) {
        this.setState({
          currentStep: 1,
        });
      }
      return;
    }
    if (this.state.previewData?.previewId) {
      this.confirmImport();
      return;
    }
    this.previewImport();
  };

  backToConfig = () => {
    this.setState({
      currentStep: 0,
    });
  };

  renderPresetPicker = () => {
    const presetOptions = this.getPresetOptions();
    const selectedPreset = presetOptions.find(
      (item) => item.presetId === this.state.presetId,
    );
    const canDeletePreset =
      selectedPreset && isCustomPreset(selectedPreset.presetId);
    const presetInputValue =
      this.state.presetName || selectedPreset?.presetName || undefined;
    return (
      <div className={styles.presetConfigRow}>
        <label className={`${styles.field} ${styles.presetConfigField}`}>
          <span className={styles.label}>
            {trans("scoreImport.presetName", "配置名称")}
          </span>
          <Select
            allowClear
            showSearch
            mode="combobox"
            value={presetInputValue}
            placeholder={trans(
              "scoreImport.presetNamePlaceholder",
              "选择或输入配置名称",
            )}
            onChange={(presetName) => {
              const preset = presetOptions.find(
                (item) => item.presetName === presetName,
              );
              if (preset) {
                this.applyPreset(preset.presetId);
                return;
              }
              this.setState({
                presetId: undefined,
                presetName: presetName || "",
              });
            }}
            optionFilterProp="children"
          >
            {presetOptions.map((item) => (
              <Option value={item.presetName} key={item.presetId}>
                {item.presetName}
              </Option>
            ))}
          </Select>
        </label>
        <button
          type="button"
          className={styles.textButton}
          disabled={this.state.loadingPresetConfig}
          onClick={this.savePreset}
        >
          <Icon type="save" />
          {trans("global.save", "保存")}
        </button>
        <button
          type="button"
          className={styles.secondaryButton}
          disabled={!canDeletePreset || this.state.loadingPresetConfig}
          onClick={this.deletePreset}
        >
          <Icon type="close-circle" />
          {trans("global.delete", "删除")}
        </button>
      </div>
    );
  };

  renderSectionCard = (title, iconType, children) => (
    <div className={styles.sectionCard}>
      <div className={styles.sectionTitle}>
        <span className={styles.sectionIcon}>
          <Icon type={iconType} />
        </span>
        <strong>{title}</strong>
      </div>
      {children}
    </div>
  );

  renderImportModeSection = () => {
    const modeOptions = [
      {
        mode: IMPORT_MODE_CREATE,
        title: trans("scoreImport.createExamMode", "新建考试"),
        description: trans(
          "scoreImport.createExamModeDescription",
          "配置考试、学科和班级后导入成绩",
        ),
      },
      {
        mode: IMPORT_MODE_APPEND,
        title: trans("scoreImport.appendMode", "批量订正"),
        description: trans(
          "scoreImport.appendModeDescription",
          "可订正已有成绩，也可以补充单题得分",
        ),
      },
    ];
    return (
      <div className={styles["mode-section"]}>
        <span className={styles["mode-label"]}>
          {trans("scoreImport.importTarget", "导入目标")}
        </span>
        <div className={styles["mode-options"]}>
          {modeOptions.map((item) => {
            const active = this.state.importMode === item.mode;
            return (
              <button
                type="button"
                className={[
                  styles["mode-option"],
                  active ? styles["mode-option-active"] : "",
                ].join(" ")}
                onClick={() => this.changeImportMode(item.mode)}
                key={item.mode}
              >
                <strong>{item.title}</strong>
                <span>{item.description}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  renderSubjectConfig = () => {
    const subjectRows = this.state.selectedSubjects || [];
    const selectedSubjectIdSet = new Set(
      getSubjectConfigList(subjectRows).map((item) => String(item.subjectId)),
    );
    const isAppend = this.state.importMode === IMPORT_MODE_APPEND;
    const canAddSubject =
      !isAppend &&
      (!this.isSingleSubjectMode() ||
        getSubjectConfigList(subjectRows).length === 0);

    return (
      <div className={styles.subjectConfigTable}>
        <div
          className={[
            styles.subjectConfigHeader,
            isAppend ? styles.subjectConfigReadOnly : "",
          ].join(" ")}
        >
          <span>{trans("scoreImport.examSubject", "考试科目")}</span>
          <span>{trans("global.course", "课程")}</span>
          <span>{trans("global.class", "班级")}</span>
          <span>{trans("global.manfen", "满分")}</span>
          {isAppend ? null : <span>{trans("global.option", "操作")}</span>}
        </div>
        {subjectRows.map((item, index) => {
          const subjectId = item.subjectId;
          const courseList = this.state.subjectMapCourse[subjectId] || [];
          const courseNameText =
            (item.courseNameList || []).join("、") ||
            (item.courseIdList || [])
              .map((courseId) => {
                const course = courseList.find(
                  (courseItem) =>
                    String(courseItem.courseId) === String(courseId),
                );
                return course?.courseName || courseId;
              })
              .join("、");
          const groupOptions = this.getGroupOptionsForRow(item);
          const groupNameText =
            (item.groupNameList || []).join("、") ||
            groupOptions
              .filter((group) =>
                (item.groupIdList || []).some(
                  (groupId) => String(groupId) === String(group.groupId),
                ),
              )
              .map((group) => group.groupName)
              .join("、");
          return (
            <div
              className={[
                styles.subjectConfigRow,
                isAppend ? styles.subjectConfigReadOnly : "",
              ].join(" ")}
              key={this.getSubjectRowKey(item, index)}
            >
              {isAppend ? (
                <div className={styles.subjectName}>{item.subjectName}</div>
              ) : (
                <div>
                  <Select
                    allowClear
                    showSearch
                    labelInValue
                    value={
                      subjectId
                        ? {
                            key: subjectId,
                            label: item.subjectName,
                          }
                        : undefined
                    }
                    placeholder={trans(
                      "scoreImport.subjectPlaceholder",
                      "选择科目",
                    )}
                    onChange={(value) =>
                      this.changeSubjectConfigSubject(value, index)
                    }
                    optionFilterProp="children"
                  >
                    {(this.props.stageSubjectList || []).map((subject) => (
                      <Option
                        value={subject.id}
                        key={subject.id}
                        disabled={
                          selectedSubjectIdSet.has(String(subject.id)) &&
                          String(subject.id) !== String(subjectId)
                        }
                      >
                        {subject.name}
                      </Option>
                    ))}
                  </Select>
                  {this.getSubjectPaperName(item.subjectName) ? (
                    <div
                      className={styles.subjectPaperName}
                      title={this.getSubjectPaperName(item.subjectName)}
                    >
                      {this.getSubjectPaperName(item.subjectName)}
                    </div>
                  ) : null}
                </div>
              )}
              {isAppend ? (
                <div className={styles.readOnlyText}>{courseNameText}</div>
              ) : (
                <Select
                  showSearch
                  mode="multiple"
                  value={item.courseIdList || []}
                  placeholder={trans(
                    "scoreImport.coursePlaceholder",
                    "选择课程",
                  )}
                  disabled={!subjectId}
                  onChange={(value) => this.changeSubjectCourse(index, value)}
                  optionFilterProp="children"
                >
                  {courseList.map((course) => (
                    <Option value={course.courseId} key={course.courseId}>
                      {course.courseName}
                    </Option>
                  ))}
                </Select>
              )}
              {isAppend ? (
                <div className={styles.readOnlyText}>{groupNameText}</div>
              ) : (
                <Select
                  showSearch
                  mode="multiple"
                  value={item.groupIdList || []}
                  placeholder={trans(
                    "scoreImport.classPlaceholder",
                    "课程带出班级，可手动删减",
                  )}
                  disabled={
                    !subjectId || (item.courseIdList || []).length === 0
                  }
                  onChange={(value) => this.changeSubjectGroups(index, value)}
                  optionFilterProp="children"
                >
                  {groupOptions.map((group) => (
                    <Option value={group.groupId} key={group.groupId}>
                      {group.groupName}
                    </Option>
                  ))}
                </Select>
              )}
              {isAppend ? (
                <div className={styles.readOnlyText}>{item.fullScore}</div>
              ) : (
                <InputNumber
                  min={0}
                  precision={1}
                  value={item.fullScore}
                  placeholder={trans("global.manfen", "满分")}
                  onChange={(value) =>
                    this.changeSubjectFullScore(index, value)
                  }
                />
              )}
              {isAppend ? null : (
                <div className={styles.subjectActions}>
                  <button
                    type="button"
                    className={styles.iconButton}
                    title={trans("scoreImport.deleteSubject", "删除科目")}
                    onClick={() => this.removeSubjectConfig(index)}
                  >
                    <Icon type="delete" />
                  </button>
                </div>
              )}
            </div>
          );
        })}
        {canAddSubject ? (
          <button
            type="button"
            className={styles.addSubjectButton}
            onClick={this.addSubjectConfig}
          >
            <Icon type="plus" />
            {trans("scoreImport.addSubject", "添加科目")}
          </button>
        ) : null}
      </div>
    );
  };

  renderSubjectConfigSection = () => {
    const isAppend = this.state.importMode === IMPORT_MODE_APPEND;
    const title = isAppend
      ? trans("scoreImport.correctableScoreSubjects", "可订正成绩学科")
      : trans("scoreImport.subjectCourseSettings", "学科课程设置");
    const content = (
      <>
        {isAppend ? (
          <div className={styles["append-tip"]}>
            {trans(
              "scoreImport.appendDownloadTip",
              "下载后会得到这场考试的原始成绩文件，可一次处理多科；可订正学科得分，也可以补充或修正单题得分，上传校验后选择增量更新或覆盖更新。",
            )}
          </div>
        ) : null}
        {isAppend ? null : (
          <div className={styles.subjectPresetToolbar}>
            {this.renderPresetPicker()}
          </div>
        )}
        {this.renderSubjectConfig()}
      </>
    );
    return this.renderSectionCard(title, "book", content);
  };

  renderAppendForm = () => {
    const { existingExamId, examName, examTime, loadingAppendExamConfig } =
      this.state;
    return (
      <div className={styles["append-exam-layout"]}>
        <label
          className={[styles.field, styles["append-exam-selector"]].join(" ")}
        >
          <span className={styles.label}>
            {trans("scoreImport.examName", "考试名称")}
          </span>
          <Select
            showSearch
            loading={loadingAppendExamConfig}
            placeholder={trans(
              "scoreImport.appendExamPlaceholder",
              "选择需要批量订正的考试",
            )}
            value={existingExamId}
            onChange={this.changeExistingExam}
            optionFilterProp="children"
          >
            {this.getExistingExamOptions().map((item) => {
              const optionName =
                String(item.examId) === String(existingExamId) && examName
                  ? examName
                  : getOptionLabel(item, "examName", "examEnName");
              return (
                <Option value={item.examId} key={item.examId}>
                  {optionName || item.examId}
                </Option>
              );
            })}
          </Select>
        </label>
        {existingExamId ? (
          <div className={styles["append-exam-meta"]}>
            <span>{trans("scoreImport.examTime", "考试时间")}</span>
            <strong title={examTime || "-"}>{examTime || "-"}</strong>
          </div>
        ) : null}
      </div>
    );
  };

  renderForm = () => {
    const { allGrade, examOptions, examTypeList } = this.props;
    const {
      examName,
      examTime,
      examType,
      generateSummaryReport,
      gradeId,
      importMode,
      semesterId,
    } = this.state;
    const isAppend = importMode === IMPORT_MODE_APPEND;
    const examTypeOptions = examTypeList || [];
    const gradeOptions = sortGradeOptions(allGrade || []);

    if (isAppend) {
      return this.renderSectionCard(
        trans("scoreImport.selectExistingExam", "选择已有考试"),
        "file-done",
        this.renderAppendForm(),
      );
    }

    const form = (
      <div className={styles.formGrid}>
        <label className={`${styles.field} ${styles.examNameField}`}>
          <span className={styles.label}>
            {trans("scoreImport.examName", "考试名称")}
          </span>
          <Input
            value={examName}
            onChange={(event) =>
              this.resetPreview({ examName: event.target.value })
            }
            placeholder={trans(
              "scoreImport.examNamePlaceholder",
              "请输入考试名称",
            )}
          />
        </label>

        <label className={`${styles.field} ${styles.examTimeField}`}>
          <span className={styles.label}>
            {trans("scoreImport.examDate", "考试日期")}
          </span>
          <DatePicker
            value={examTime ? moment(examTime, "YYYY-MM-DD") : null}
            format="YYYY-MM-DD"
            placeholder={trans(
              "scoreImport.examDatePlaceholder",
              "请选择考试日期",
            )}
            showToday
            onChange={this.changeExamTime}
          />
        </label>

        <label className={`${styles.field} ${styles.semesterField}`}>
          <span className={styles.label}>
            {trans("global.semester", "学期")}
          </span>
          <Select value={semesterId} onChange={this.changeSemester}>
            <Option value={0}>{trans("global.allSemester", "全部学期")}</Option>
            {(examOptions || []).map((item) => (
              <Option value={item.semesterId} key={item.semesterId}>
                {item.semesterName}
              </Option>
            ))}
          </Select>
        </label>

        <div className={`${styles.field} ${styles["flat-choice-row"]}`}>
          <span className={styles.label}>
            {trans("scoreImport.examType", "考试类型")}
          </span>
          <div
            className={styles["flat-choice-list"]}
            role="group"
            aria-label={trans("scoreImport.examType", "考试类型")}
          >
            {examTypeOptions.length > 0 ? (
              examTypeOptions.map((item) => {
                const value = item.code ?? item.examTypeCode;
                const label = item.typeName || item.examTypeName;
                const isSelected = String(examType) === String(value);
                return (
                  <button
                    type="button"
                    key={value}
                    className={[
                      styles["flat-choice-option"],
                      isSelected ? styles["flat-choice-option-active"] : "",
                    ].join(" ")}
                    onClick={() => this.resetPreview({ examType: value })}
                  >
                    {label}
                  </button>
                );
              })
            ) : (
              <span className={styles["flat-choice-empty"]}>
                {trans("scoreImport.noExamTypes", "暂无考试类型")}
              </span>
            )}
          </div>
        </div>

        <div className={`${styles.field} ${styles["flat-choice-row"]}`}>
          <span className={styles.label}>{trans("global.grade", "年级")}</span>
          <div
            className={styles["flat-choice-list"]}
            role="group"
            aria-label={trans("global.grade", "年级")}
          >
            {gradeOptions.length > 0 ? (
              gradeOptions.map((item) => {
                const optionGradeId = item.gradeId;
                const label = getOptionLabel(item, "gradeName", "gradeEnName");
                const isSelected = String(gradeId) === String(optionGradeId);
                return (
                  <button
                    type="button"
                    key={optionGradeId}
                    className={[
                      styles["flat-choice-option"],
                      isSelected ? styles["flat-choice-option-active"] : "",
                    ].join(" ")}
                    onClick={() => this.changeGrade(optionGradeId)}
                  >
                    {label}
                  </button>
                );
              })
            ) : (
              <span className={styles["flat-choice-empty"]}>
                {trans("scoreImport.noGrades", "暂无年级")}
              </span>
            )}
          </div>
        </div>

        <div className={`${styles.field} ${styles.summaryReportField}`}>
          <Checkbox
            checked={generateSummaryReport}
            onChange={(event) =>
              this.resetPreview({
                generateSummaryReport: event.target.checked,
              })
            }
          >
            {trans(
              "scoreImport.generateSummaryAfterImport",
              "导入成功后生成成绩汇总",
            )}
          </Checkbox>
        </div>
      </div>
    );
    return this.renderSectionCard(
      trans("scoreImport.examBasicInfo", "考试基本信息"),
      "profile",
      form,
    );
  };

  renderUploadFlow = () => {
    const {
      fileId,
      fileList,
      importMode,
      loadingPresetConfig,
      uploadPercent,
      uploading,
    } = this.state;
    const isAppend = importMode === IMPORT_MODE_APPEND;
    const flowCopy = isAppend
      ? {
          templateTitle: trans("scoreImport.originalScoreFile", "原始成绩文件"),
          downloadButtonText: trans(
            "scoreImport.downloadOriginalScores",
            "下载原始成绩",
          ),
          uploadTitle: trans("scoreImport.correctedFile", "订正后文件"),
          validateTitle: trans("scoreImport.validateCorrection", "校验订正"),
          validateDescription: trans(
            "scoreImport.validateCorrectionDescription",
            "上传完成后自动校验，随后选择更新方式",
          ),
        }
      : {
          templateTitle: trans("scoreImport.standardTemplate", "标准模板"),
          downloadButtonText: trans("scoreImport.downloadTemplate", "下载模板"),
          uploadTitle: trans("scoreImport.scoreFile", "成绩文件"),
          validateTitle: trans("scoreImport.validateImport", "校验导入"),
          validateDescription: trans(
            "scoreImport.validateImportDescription",
            "上传完成后自动校验",
          ),
        };
    const uploadProperties = {
      name: "files",
      action: "/api/upload_file",
      accept: ".xlsx,.xls",
      showUploadList: false,
      fileList,
      beforeUpload: (file) => this.beforeUpload(file, { allowZip: false }),
      onChange: (info) => this.changeUpload(info, IMPORT_SOURCE_STANDARD),
    };
    const zhixueUploadProperties = {
      name: "files",
      action: "/api/upload_file",
      accept: ".xlsx,.xls,.zip",
      showUploadList: false,
      fileList,
      beforeUpload: (file) => this.beforeUpload(file, { allowZip: true }),
      onChange: (info) => this.changeUpload(info, IMPORT_SOURCE_ZHIXUE),
    };

    return (
      <>
        <div className={styles.flowGrid}>
          <div className={styles.flowItem}>
            <span className={styles.stepIndex}>1</span>
            <div>
              <div className={styles.stepTitle}>{flowCopy.templateTitle}</div>
            </div>
            <button
              type="button"
              className={styles.textButton}
              disabled={
                this.state.downloading || this.state.loadingPresetConfig
              }
              onClick={this.downloadTemplate}
            >
              {this.state.downloading
                ? trans("scoreImport.downloading", "下载中...")
                : flowCopy.downloadButtonText}
            </button>
          </div>

          <div className={styles.flowItem}>
            <span className={styles.stepIndex}>2</span>
            <div>
              <div className={styles.stepTitle}>{flowCopy.uploadTitle}</div>
            </div>
            <div
              style={{
                display: "inline-flex",
                gap: "0.5rem",
                alignItems: "center",
              }}
            >
              <Upload {...uploadProperties}>
                <button
                  type="button"
                  className={styles.textButton}
                  disabled={uploading || loadingPresetConfig}
                >
                  {uploading
                    ? trans("scoreImport.uploading", "上传中...")
                    : trans("scoreImport.uploadFile", "上传文件")}
                </button>
              </Upload>
              {isAppend ? null : (
                <Upload {...zhixueUploadProperties}>
                  <button
                    type="button"
                    className={styles.secondaryButton}
                    disabled={uploading || loadingPresetConfig}
                  >
                    {trans("scoreImport.zhixueFile", "智学网文件")}
                  </button>
                </Upload>
              )}
            </div>
            {fileList.length > 0 ? (
              <div className={styles.fileUploadStatus}>
                <span className={styles.fileName}>
                  {fileList[0].name}
                  {uploading ? null : (
                    <Icon type="close-circle" onClick={this.deleteFile} />
                  )}
                </span>
                <div className={styles.uploadProgress}>
                  <span style={{ width: `${uploadPercent}%` }} />
                </div>
                <small>
                  {uploading
                    ? trans(
                        "scoreImport.uploadingPercent",
                        "上传中 {$percent}%",
                        {
                          percent: uploadPercent,
                        },
                      )
                    : fileId
                      ? trans("scoreImport.uploadComplete", "上传完成")
                      : trans("scoreImport.waitingUpload", "等待上传")}
                </small>
              </div>
            ) : null}
          </div>

          <div className={styles.flowItem}>
            <span className={styles.stepIndex}>3</span>
            <div>
              <div className={styles.stepTitle}>{flowCopy.validateTitle}</div>
              <div className={styles.stepDesc}>
                {flowCopy.validateDescription}
              </div>
            </div>
          </div>
        </div>
      </>
    );
  };

  renderUpdateModeSection = (changeSummary) => {
    const { scoreUpdateMode } = this.state;
    const updateOptions = [
      {
        mode: SCORE_UPDATE_INCREMENTAL,
        title: trans("scoreImport.incrementalUpdate", "增量更新"),
        description: trans(
          "scoreImport.incrementalUpdateDescription",
          "只写入新增或有变化的数据，不清空未上传的已有成绩",
        ),
      },
      {
        mode: SCORE_UPDATE_OVERWRITE,
        title: trans("scoreImport.overwriteUpdate", "覆盖更新"),
        description: trans(
          "scoreImport.overwriteUpdateDescription",
          "以当前文件的学生和学科列表为准，覆盖当前范围内已有成绩",
        ),
      },
    ];
    return (
      <div className={styles["update-mode-panel"]}>
        <div className={styles["update-mode-header"]}>
          <strong>{trans("scoreImport.updateMode", "更新方式")}</strong>
          <span>
            {trans(
              "scoreImport.updateModeSummary",
              "本次预计影响 {$total} 名学生，新增 {$added} 人、修改 {$updated} 人、删除 {$deleted} 人",
              {
                total: changeSummary.total,
                added: changeSummary.added,
                updated: changeSummary.updated,
                deleted: changeSummary.deleted,
              },
            )}
          </span>
        </div>
        <div
          className={styles["update-mode-options"]}
          role="radiogroup"
          aria-label={trans(
            "scoreImport.correctionUpdateMode",
            "成绩订正更新方式",
          )}
        >
          {updateOptions.map((item) => {
            const active = scoreUpdateMode === item.mode;
            return (
              <button
                type="button"
                key={item.mode}
                className={[
                  styles["update-mode-option"],
                  active ? styles["update-mode-option-active"] : "",
                ].join(" ")}
                aria-pressed={active}
                onClick={() => this.setState({ scoreUpdateMode: item.mode })}
              >
                <strong>{item.title}</strong>
                <span>{item.description}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  renderPreview = () => {
    const { expandedIssueKeys, previewData } = this.state;
    const isAppend = this.state.importMode === IMPORT_MODE_APPEND;
    if (!previewData) {
      return null;
    }

    const summary = summarizePreview(previewData);
    const summaryCards = getPreviewSummaryCards(summary);
    const issueGroups = buildIssueOverview(previewData);
    const hasBlockingIssue = summary.errorCount > 0;

    const issueColumns = [
      {
        title: trans("scoreImport.priority", "优先级"),
        dataIndex: "level",
        width: 88,
        render: (level) => {
          const isError = level === "错误";
          return (
            <span
              className={
                isError
                  ? styles["issue-error-tag"]
                  : styles["issue-warning-tag"]
              }
            >
              {isError
                ? trans("scoreImport.preview.errors", "错误")
                : trans("scoreImport.preview.warnings", "警告")}
            </span>
          );
        },
      },
      {
        title: trans("scoreImport.impactScope", "影响范围"),
        dataIndex: "count",
        width: 110,
        render: (count) =>
          trans("scoreImport.recordCount", "{$count} 条记录", { count }),
      },
      {
        title: trans("scoreImport.issue", "问题"),
        dataIndex: "message",
        render: (message) => (
          <div className={styles["issue-content"]}>
            <strong>{message}</strong>
          </div>
        ),
      },
      {
        title: trans("scoreImport.examplePosition", "示例位置"),
        dataIndex: "positions",
        width: 320,
        render: (positions, record) => {
          const isExpanded = expandedIssueKeys.includes(record.key);
          const displayPositions = isExpanded
            ? record.allPositions || []
            : positions || [];
          return (
            <div className={styles["issue-position-list"]}>
              {(displayPositions.length > 0
                ? displayPositions
                : [trans("scoreImport.fileSummaryItem", "文件汇总项")]
              ).map((position, index) => (
                <div key={`${position}-${index}`}>{position}</div>
              ))}
              {(record.allPositions || []).length >
                (positions || []).length && (
                <Button
                  className={styles["issue-expand-button"]}
                  type="link"
                  size="small"
                  onClick={() => {
                    const nextExpandedIssueKeys = isExpanded
                      ? expandedIssueKeys.filter((key) => key !== record.key)
                      : [...expandedIssueKeys, record.key];
                    this.setState({
                      expandedIssueKeys: nextExpandedIssueKeys,
                    });
                  }}
                >
                  {isExpanded
                    ? trans("scoreImport.collapse", "收起")
                    : trans("scoreImport.viewAll", "查看全部")}
                </Button>
              )}
            </div>
          );
        },
      },
    ];
    const scoreSubjectColumns = getScoreWorkbookSubjectColumns(previewData);
    const scoreColumns = [
      { title: trans("global.status", "状态"), dataIndex: "status", width: 90 },
      {
        title: trans("global.studentNo", "学号"),
        dataIndex: "studentNo",
        width: 120,
      },
      {
        title: trans("global.name", "姓名"),
        dataIndex: "studentName",
        width: 100,
      },
      {
        title: trans("global.class", "班级"),
        dataIndex: "className",
        width: 120,
      },
      ...scoreSubjectColumns.map((subject) => ({
        title: subject.subjectName,
        key: subject.subjectName,
        width: 90,
        render: (text, record) => record.subjectScoreMap?.[subject.subjectName],
      })),
    ];
    const questionBaseColumns = [
      { title: trans("global.status", "状态"), dataIndex: "status", width: 90 },
      {
        title: trans("global.studentNo", "学号"),
        dataIndex: "studentNo",
        width: 120,
      },
      {
        title: trans("global.name", "姓名"),
        dataIndex: "studentName",
        width: 100,
      },
      {
        title: trans("global.class", "班级"),
        dataIndex: "className",
        width: 120,
      },
    ];

    const scoreRows = getScoreWorkbookRows(previewData);
    const questionGroups = getQuestionWorkbookGroups(previewData);
    const changeSummary = getScoreCorrectionChangeSummary(previewData);

    return (
      <div className={styles.previewBox}>
        <div className={styles.summaryGrid}>
          {summaryCards.map((item) => (
            <div
              key={item.key}
              className={`${styles["summary-card"]} ${getSummaryCardClass(
                item.tone,
              )}`}
            >
              <strong>
                {item.value}
                <em>{item.unit}</em>
              </strong>
              <span>{item.label}</span>
              <small>{item.description}</small>
            </div>
          ))}
        </div>

        {isAppend ? this.renderUpdateModeSection(changeSummary) : null}

        {issueGroups.length > 0 && (
          <div className={styles["issue-panel"]}>
            <div
              className={
                hasBlockingIssue
                  ? styles["issue-panel-header-error"]
                  : styles["issue-panel-header-warning"]
              }
            >
              <strong>
                {hasBlockingIssue
                  ? trans(
                      "scoreImport.blockingErrorCount",
                      "{$count} 个错误阻止{$action}",
                      {
                        count: summary.errorCount,
                        action: isAppend
                          ? trans("scoreImport.correctionAction", "订正")
                          : trans("scoreImport.importAction", "导入"),
                      },
                    )
                  : trans(
                      "scoreImport.warningCountNeedsConfirmation",
                      "{$count} 条警告需要确认",
                      { count: summary.warningCount },
                    )}
              </strong>
              <span>
                {hasBlockingIssue
                  ? trans(
                      "scoreImport.fixErrorsAndReupload",
                      "请优先处理错误，修正文件后重新上传。",
                    )
                  : trans(
                      "scoreImport.warningContinueHint",
                      "这些记录不会自动按 0 分写入，确认无误后可以继续{$action}。",
                      {
                        action: isAppend
                          ? trans("scoreImport.correctionAction", "订正")
                          : trans("scoreImport.importAction", "导入"),
                      },
                    )}
              </span>
            </div>
            {issueGroups.length > 0 && (
              <Table
                className={styles.previewTable}
                columns={issueColumns}
                dataSource={issueGroups}
                pagination={false}
                scroll={{ x: getPreviewTableScrollX(issueColumns), y: 260 }}
                size="small"
              />
            )}
          </div>
        )}

        <div className={styles.previewSectionTitle}>
          {isAppend
            ? trans("scoreImport.subjectScoreReference", "学科得分参考")
            : trans("scoreImport.subjectScores", "1_学科得分")}
        </div>
        <Table
          className={styles.previewTable}
          columns={scoreColumns}
          dataSource={scoreRows.map((item, index) => ({
            ...item,
            key: index,
          }))}
          pagination={false}
          scroll={{ x: getPreviewTableScrollX(scoreColumns), y: 280 }}
          size="small"
        />

        {questionGroups.map((group) => {
          const questionColumns = [
            ...questionBaseColumns,
            ...getQuestionWorkbookColumns(group).map((question) => ({
              title: (
                <div className={styles.questionColumnTitle}>
                  <strong>{question.questionNo}</strong>
                  <span>
                    {trans("scoreImport.majorQuestion", "大题")}{" "}
                    {question.moduleNo || "-"}
                  </span>
                  <span>
                    {trans("scoreImport.subQuestion", "小题")}{" "}
                    {question.subQuestionNo || "-"}
                  </span>
                </div>
              ),
              key: question.questionNo,
              width: 96,
              render: (text, record) =>
                record.questionScoreMap?.[question.questionNo],
            })),
          ];
          return (
            <React.Fragment key={group.sheetName || group.subjectName}>
              <div className={styles.previewSectionTitle}>
                {group.sheetName ||
                  trans(
                    "scoreImport.subjectQuestionScores",
                    "{$subject}_小题得分",
                    {
                      subject: group.subjectName,
                    },
                  )}
              </div>
              <Table
                className={styles.previewTable}
                columns={questionColumns}
                dataSource={getQuestionWorkbookPreviewRows(group).map(
                  (item, index) => ({
                    ...item,
                    key: index,
                  }),
                )}
                pagination={false}
                scroll={{
                  x: getPreviewTableScrollX(questionColumns, 1200),
                  y: 360,
                }}
                size="small"
              />
            </React.Fragment>
          );
        })}
      </div>
    );
  };

  render() {
    const okLoading =
      this.state.uploading ||
      this.state.previewing ||
      this.state.confirming ||
      this.state.loadingPresetConfig;
    const isAppend = this.state.importMode === IMPORT_MODE_APPEND;
    const okText =
      this.state.currentStep === 0
        ? "下一步"
        : this.state.previewData?.previewId
          ? isAppend
            ? "确认订正"
            : "确认导入"
          : isAppend
            ? "校验订正"
            : "校验预览";
    const cancelText = this.state.currentStep === 0 ? "取消" : "上一步";
    const modalFooter = [
      <button
        type="button"
        className={styles.footerSecondaryButton}
        key="cancel"
        onClick={
          this.state.currentStep === 0 ? this.closeModal : this.backToConfig
        }
      >
        {cancelText}
      </button>,
      <button
        type="button"
        className={styles.footerPrimaryButton}
        key="ok"
        disabled={okLoading}
        onClick={this.handleOk}
      >
        {okText}
      </button>,
    ];
    return (
      <CuModal
        visible={this.props.examVisble}
        onCancel={this.closeModal}
        title={trans("global.importGrades", "导入成绩")}
        width={1280}
        wrapClassName={styles.scoreImportModalWrap}
        style={{ top: "1rem" }}
        closable
        maskClosable={false}
        destroyOnClose
        footer={modalFooter}
      >
        <div className={styles.scoreImportModal}>
          <div className={styles.contentShell}>
            {this.state.currentStep === 0 ? (
              <>
                {this.renderImportModeSection()}
                {this.renderForm()}
                {this.renderSubjectConfigSection()}
              </>
            ) : (
              <>
                {this.renderSectionCard(
                  isAppend ? "批量订正" : "导入成绩",
                  "upload",
                  this.renderUploadFlow(),
                )}
                {this.renderPreview()}
              </>
            )}
          </div>
        </div>
      </CuModal>
    );
  }
}

export default connect(mapStateToProperties)(ScoreImportModal);
