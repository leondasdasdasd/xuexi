import React, { PureComponent } from "react";
import { Checkbox, message, Modal, Radio, Spin, Switch } from "antd";
import katex from "katex";

import MyButton from "../../components/MyButton";
import {
  deleteBasicSettingKnowledge,
  deleteTextbookChapter,
  importBasicSettingKnowledges,
  queryBasicSettingKnowledges,
  queryBasicSettingStageSubjects,
  queryBasicSettingTeachingMaterial,
  queryTextbookBooks,
  queryTextbookChapters,
  saveBasicSettingKnowledge,
  saveChapterKnowledgeRelations,
  saveTextbookChapter,
  sortBasicSettingKnowledges,
  sortTextbookChapters,
} from "../../services/basicSettingTextbookKnowledge";
import { getConfig, saveConfig } from "../../services/example";
import { trans } from "../../utils/i18n";
import {
  adaptBackendChapterTree,
  adaptBackendKnowledgeTree,
  adaptBackendTextbookBooks,
  buildChapterKnowledgeRequestItems,
  buildKnowledgeTreeFileName,
  buildKnowledgeTreeWorkbook,
  canAddChild,
  collectExpandableNodeIds,
  deepestKnowledgeIds,
  findTreeNode,
  flattenTree,
  knowledgeLookup,
  knowledgePathLabel,
  mapTreeNodes,
  MAX_TREE_LEVEL,
  moveSiblingNode,
  normalizeNodeName,
  normalizeStageName,
  resolveBasicSettingActiveTab,
} from "./index.helpers";

import "katex/dist/katex.min.css";
import icon from "../../icon.module.less";
import styles from "./index.module.less";

const normalizeIdList = (value) => {
  if (Array.isArray(value)) return value;
  if (typeof value === "string") return value.split(",").filter(Boolean);
  if (value === 0 || value) return [value];
  return [];
};

/**
 * 转义知识点定义中的普通文本，避免历史内容被当作 HTML 执行。
 * @param {unknown} value 原始文本
 * @returns {string} HTML 转义后的文本
 */
const escapeHtml = (value = "") =>
  String(value)
    .split("&")
    .join("&amp;")
    .split("<")
    .join("&lt;")
    .split(">")
    .join("&gt;")
    .split('"')
    .join("&quot;")
    .split("'")
    .join("&#39;");

/**
 * 读取页面知识点节点的定义草稿，空字符串必须保留以支持清空。
 * @param {object} node 知识点节点
 * @returns {string} 当前定义草稿
 */
const getKnowledgeDefinitionText = (node = {}) => {
  if (node.definitionText !== undefined && node.definitionText !== null)
    return String(node.definitionText);
  return String(node.describe || node.description || "");
};

/**
 * 将知识点定义中的 LaTeX 公式渲染为安全 HTML。
 * @param {unknown} value 知识点定义纯文本
 * @returns {string} 可展示的转义文本与 KaTeX HTML
 */
const renderKnowledgeDefinitionHtml = (value = "") => {
  const text = String(value || "");
  if (!text.trim()) return "";
  const parts = [];
  const pattern = /\$\$(.+?)\$\$|\$([^\n$]+)\$/gs;
  let lastIndex = 0;
  let match;
  while ((match = pattern.exec(text))) {
    parts.push(escapeHtml(text.slice(lastIndex, match.index)));
    const displayMode = match[1] !== undefined;
    parts.push(
      katex.renderToString(displayMode ? match[1] : match[2], {
        displayMode,
        throwOnError: false,
        strict: false,
      }),
    );
    lastIndex = pattern.lastIndex;
  }
  parts.push(escapeHtml(text.slice(lastIndex)));
  return parts.join("").split("\n").join("<br />");
};

/**
 * 将可展开节点 ID 转换为 React 状态映射。
 * @param {Array} nodeIds 可展开节点 ID
 * @returns {Array} 已展开节点 ID 列表
 */
const buildExpandedKnowledgeNodeState = (nodeIds = []) => [...nodeIds];

/**
 * 从外层宿主路由中读取当前基础设置页签，避免页面内部再渲染一组重复页签。
 * @returns 基础设置内部 activeTab 值
 */
const getBasicSettingActiveTabFromLocation = () => {
  const href =
    (typeof window !== "undefined" &&
      window.location &&
      window.location.href) ||
    "";
  const matched = href.match(
    /[#&?](?:activetab|tab|tabkey|tabskey|type)=([^#&]+)/i,
  );
  if (!matched) return resolveBasicSettingActiveTab("");
  try {
    return resolveBasicSettingActiveTab(decodeURIComponent(matched[1]));
  } catch {
    return resolveBasicSettingActiveTab(matched[1]);
  }
};

const knowledgeLevelLabel = (level) =>
  trans("basicSetting.knowledgeLevelName", "第 {$level} 级", {
    level: level + 1,
  });

class KnowledgePickerModal extends PureComponent {
  constructor(properties) {
    super(properties);
    const lookup = knowledgeLookup(properties.knowledgeTree || []);
    const selectedIds = deepestKnowledgeIds(properties.value || [], lookup);
    this.state = {
      keyword: "",
      cursorIds: this.initialCursorIds(
        properties.knowledgeTree || [],
        lookup,
        selectedIds[0],
      ),
      selectedIds,
    };
  }

  initialCursorIds = (tree, lookup, selectedId) => {
    const target = lookup[String(selectedId)];
    if (target && target.path) {
      const ids = [];
      let current = target;
      while (current) {
        ids.unshift(String(current.id || current.key));
        current = current.parentId ? lookup[String(current.parentId)] : null;
      }
      if (ids.length > 0) return ids;
    }
    return tree[0] ? [String(tree[0].id || tree[0].key)] : [];
  };

  setCursor = (node, index) => {
    const nodeId = String(node.id || node.key);
    this.setState((current) => ({
      cursorIds: current.cursorIds.slice(0, index).concat(nodeId),
    }));
    if (!node.children || node.children.length === 0)
      this.toggleSelected(nodeId);
  };

  normalizeSelection = (nextIds) => {
    const lookup = knowledgeLookup(this.props.knowledgeTree || []);
    const selectedIds = deepestKnowledgeIds(nextIds, lookup);
    this.setState({
      selectedIds,
    });
  };

  toggleSelected = (id) => {
    const nodeId = String(id);
    const { selectedIds } = this.state;
    if (selectedIds.includes(nodeId)) {
      this.normalizeSelection(selectedIds.filter((item) => item !== nodeId));
      return;
    }
    this.normalizeSelection(selectedIds.concat(nodeId));
  };

  buildLevelRows = () => {
    const { knowledgeTree = [] } = this.props;
    const { cursorIds } = this.state;
    const rows = [];
    let options = knowledgeTree;
    let index = 0;
    while (options && options.length > 0) {
      const activeId =
        cursorIds[index] &&
        options.some(
          (item) => String(item.id || item.key) === String(cursorIds[index]),
        )
          ? cursorIds[index]
          : String(options[0].id || options[0].key);
      const activeNode = options.find(
        (item) => String(item.id || item.key) === String(activeId),
      );
      rows.push({ index, options, activeId });
      options = (activeNode && activeNode.children) || [];
      index += 1;
    }
    return rows;
  };

  apply = () => {
    this.props.onApply(this.state.selectedIds);
    this.props.onClose();
  };

  render() {
    const { knowledgeTree = [], onClose } = this.props;
    const { keyword, selectedIds } = this.state;
    const lookup = knowledgeLookup(knowledgeTree);
    const selectedSet = new Set(selectedIds.map(String));
    const flatNodes = flattenTree(knowledgeTree);
    const normalizedKeyword = keyword.trim().toLowerCase();
    const searchRows = normalizedKeyword
      ? flatNodes
          .filter((item) =>
            `${item.name} ${knowledgePathLabel(lookup, item.id || item.key)}`
              .toLowerCase()
              .includes(normalizedKeyword),
          )
          .slice(0, 30)
      : [];
    return (
      <div className={styles.knowledgePickerMask}>
        <div className={styles.knowledgePicker}>
          <div className={styles.pickerHead}>
            <div>
              <strong>
                {trans("basicSetting.linkKnowledgePoints", "关联知识点")}
              </strong>
              <span>
                {trans(
                  "basicSetting.knowledgePickerDescription",
                  "支持搜索和多级展开",
                )}
              </span>
            </div>
            <button type="button" onClick={onClose}>
              {trans("global.close", "关闭")}
            </button>
          </div>
          <div className={styles.pickerTools}>
            <label className={styles.pickerSearchField}>
              <span>{trans("global.search", "搜索")}</span>
              <input
                value={keyword}
                onChange={(event) =>
                  this.setState({ keyword: event.target.value })
                }
                placeholder={trans(
                  "basicSetting.searchKnowledgeNameOrPath",
                  "搜索知识点名称 / 路径",
                )}
              />
            </label>
          </div>
          {normalizedKeyword ? (
            <div className={styles.knowledgeSearchResults}>
              {searchRows.map((item) => {
                const id = String(item.id || item.key);
                return (
                  <button
                    key={id}
                    type="button"
                    className={
                      selectedSet.has(id) ? styles.selectedKnowledgeButton : ""
                    }
                    onClick={() => this.toggleSelected(id)}
                  >
                    <strong>{item.name}</strong>
                    <span>{knowledgePathLabel(lookup, id)}</span>
                  </button>
                );
              })}
              {searchRows.length === 0 ? (
                <em>
                  {trans("basicSetting.noMatchedKnowledge", "没有匹配的知识点")}
                </em>
              ) : null}
            </div>
          ) : (
            <div className={styles.knowledgeLevelList}>
              {this.buildLevelRows().map((row) => (
                <div key={row.index} className={styles.knowledgeLevelRow}>
                  <strong>
                    {trans(
                      "basicSetting.knowledgePickerLevel",
                      "第 {$level} 层",
                      {
                        level: row.index + 1,
                      },
                    )}
                  </strong>
                  <div>
                    {row.options.map((item) => {
                      const id = String(item.id || item.key);
                      const active = String(row.activeId) === id;
                      const selected = selectedSet.has(id);
                      return (
                        <button
                          key={id}
                          type="button"
                          className={[
                            active ? styles.activeKnowledgeButton : "",
                            selected ? styles.selectedKnowledgeButton : "",
                          ].join(" ")}
                          onClick={() => this.setCursor(item, row.index)}
                        >
                          {normalizeNodeName(
                            item.name || item.text || item.title,
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
              {knowledgeTree.length === 0 ? (
                <div className={styles.emptyTree}>
                  {trans(
                    "basicSetting.noKnowledgeForScope",
                    "当前学段学科暂无知识点",
                  )}
                </div>
              ) : null}
            </div>
          )}
          <div className={styles.selectedKnowledgePanel}>
            <strong>
              {trans(
                "basicSetting.selectedKnowledgeCount",
                "已选知识点（{$count}）",
                {
                  count: selectedIds.length,
                },
              )}
            </strong>
            <div>
              {selectedIds.map((id) => (
                <span key={id} title={knowledgePathLabel(lookup, id)}>
                  {lookup[id] ? lookup[id].name : id}
                  <i onClick={() => this.toggleSelected(id)}>×</i>
                </span>
              ))}
              {selectedIds.length === 0 ? (
                <em>
                  {trans("basicSetting.noKnowledgeSelected", "未选择知识点")}
                </em>
              ) : null}
            </div>
          </div>
          <div className={styles.pickerFoot}>
            <button type="button" onClick={onClose}>
              {trans("global.cancel", "取消")}
            </button>
            <button
              type="button"
              className={styles.primaryButton}
              onClick={this.apply}
            >
              {trans("global.ok", "确定")}
            </button>
          </div>
        </div>
      </div>
    );
  }
}

class BasicSetting extends PureComponent {
  constructor(properties) {
    super(properties);
    this.knowledgeDefinitionTextareaRef = React.createRef();
    this.state = {
      activeTab: getBasicSettingActiveTabFromLocation(),
      loading: false,
      popVisible: false,
      selectedStage: 0,
      scopeList: [],
      teachingMaterialList: [],
      textbookBooks: [],
      stage: "",
      stageName: "",
      subjectId: "",
      subjectName: "",
      versionId: "",
      teachingName: "",
      knowledgeVersionId: "",
      knowledgeVersionName: "",
      selectedBookId: "",
      gradeId: "",
      gradeName: "",
      catalogByBookId: {},
      selectedCatalogNodeId: "",
      catalogCreateModalVisible: false,
      catalogCreateParentId: "",
      catalogCreateName: "",
      knowledgeCreateModalVisible: false,
      knowledgeCreateParentId: "",
      knowledgeCreateName: "",
      knowledgeCreateDefinition: "",
      knowledgeDraftData: [],
      knowledgeDraftKey: "",
      expandedKnowledgeNodeIds: [],
      editingKnowledgeDefinitionNodeId: "",
      knowledgePickerNodeId: "",
      deleteModalVisible: false,
      deleteCallback: null,
      fileInfo: {},
      knowledgeImportVisible: false,
      knowledgeImportMode: "incremental",
      allSubjectScoreParentSwitch: undefined,
      parentScoreWatchSwitch: undefined,
      parentScoreAndRankWatchSwitch: undefined,
      allSubjectScoreStudentSwitch: undefined,
      studentScoreWatchSwitch: undefined,
      studentScoreAndRankWatchSwitch: undefined,
      examAliasSwitch: undefined,
      parentStage: [],
      studentStage: [],
    };
  }

  componentDidMount() {
    if (typeof window !== "undefined") {
      window.addEventListener("hashchange", this.syncActiveTabFromLocation);
      window.addEventListener("popstate", this.syncActiveTabFromLocation);
    }
    this.loadBasicSettingScope();
    this.loadPageSettings();
  }

  loadPageSettings = () => {
    getConfig({ type: 6, schoolLevel: true, businessId: "" }).then(
      (response) => {
        if (response && response.status && response.content) {
          const {
            allSubjectScoreParentSwitch,
            parentScoreWatchSwitch,
            parentScoreAndRankWatchSwitch,
            allSubjectScoreStudentSwitch,
            studentScoreWatchSwitch,
            studentScoreAndRankWatchSwitch,
            examAliasSwitch,
            parentStage,
            studentStage,
          } = response.content;
          this.setState({
            allSubjectScoreParentSwitch,
            parentScoreWatchSwitch,
            parentScoreAndRankWatchSwitch,
            allSubjectScoreStudentSwitch,
            studentScoreWatchSwitch,
            studentScoreAndRankWatchSwitch,
            examAliasSwitch,
            parentStage: parentStage || [],
            studentStage: studentStage || [],
          });
        }
      },
    );
  };

  componentWillUnmount() {
    if (typeof window !== "undefined") {
      window.removeEventListener("hashchange", this.syncActiveTabFromLocation);
      window.removeEventListener("popstate", this.syncActiveTabFromLocation);
    }
  }

  /**
   * 外层页签变化时只同步内容区状态，基础设置页不再维护第二组可点击页签。
   */
  syncActiveTabFromLocation = () => {
    const activeTab = getBasicSettingActiveTabFromLocation();
    if (activeTab !== this.state.activeTab) this.changeTab(activeTab);
  };

  normalizeScopeList = (scopeList = []) =>
    (scopeList || []).map((item) => ({
      id: item.stageId || item.id,
      name: normalizeStageName(item.stageName || item.name),
      subjectList: (item.subjectList || []).map((subject) => ({
        id: subject.subjectId || subject.id,
        name: subject.subjectName || subject.name,
      })),
    }));

  normalizeTeachingMaterialList = (content) => {
    const teachingList = Array.isArray(content)
      ? content
      : content && content.teachingList
        ? content.teachingList
        : content && content.id
          ? [content]
          : [];
    return (teachingList || [])
      .filter((item) => item && item.id)
      .map((item) => ({
        id: item.id,
        name: item.name || item.desc || item.enName || "",
      }));
  };

  handleApiResponse = (response, fallbackMessage) => {
    if (response && response.status) return response.content;
    message.error(
      (response &&
        (response.message || (response.err && response.err.message))) ||
        fallbackMessage ||
        "接口请求失败",
    );
    return null;
  };
  getStageSubjectType = () => (this.state.activeTab === 1 ? 1 : 0);

  loadBasicSettingScope = async () => {
    this.setState({ loading: true });
    const response = await queryBasicSettingStageSubjects({
      type: this.getStageSubjectType(),
    });
    const content = this.handleApiResponse(response, "学段学科加载失败");
    const scopeList = this.normalizeScopeList(content || []);
    const stageInfo = scopeList[0];
    const subject = stageInfo && stageInfo.subjectList[0];
    if (!stageInfo || !subject) {
      this.setState({ loading: false });
      message.info(
        trans(
          "basicSetting.noConfigurableScope",
          "当前学校暂无可配置的学段学科",
        ),
      );
      return;
    }
    this.setState(
      {
        scopeList,
        selectedStage: 0,
        stage: stageInfo.id,
        stageName: stageInfo.name,
        subjectId: subject.id,
        subjectName: subject.name,
        selectedBookId: "",
        catalogByBookId: {},
        selectedCatalogNodeId: "",
      },
      this.loadTeachingMaterialAndBooks,
    );
  };

  loadTeachingMaterialAndBooks = async () => {
    const response = await queryBasicSettingTeachingMaterial({
      stage: this.state.stage,
      subjectId: this.state.subjectId,
      type: this.state.activeTab === 1 ? 2 : 1,
    });
    const content = this.handleApiResponse(response, "教材版本加载失败");
    const teachingMaterialList = this.normalizeTeachingMaterialList(content);
    const version =
      teachingMaterialList.find(
        (item) => String(item.id) === String(this.state.versionId),
      ) || teachingMaterialList[0];
    if (!version) {
      this.setState({
        teachingMaterialList: [],
        textbookBooks: [],
        knowledgeDraftData: [],
        loading: false,
      });
      message.info(
        trans(
          "basicSetting.noTextbookVersionConfig",
          "当前学段暂无教材版本配置，请先维护教材版本",
        ),
      );
      return;
    }
    this.setState(
      {
        teachingMaterialList,
        versionId: version.id,
        teachingName: version.name,
        knowledgeVersionId: version.id,
        knowledgeVersionName: version.name,
      },
      () => {
        if (this.state.activeTab === 0) {
          this.loadTextbookBooks();
        } else {
          this.setState({ loading: false });
        }
        this.loadKnowledgeTree(version.id);
      },
    );
  };

  loadTextbookBooks = async () => {
    if (!this.state.stage || !this.state.subjectId || !this.state.versionId) {
      this.setState({ loading: false });
      return;
    }
    const response = await queryTextbookBooks({
      stage: this.state.stage,
      subjectId: this.state.subjectId,
      sourceType: this.state.versionId,
    });
    const content = this.handleApiResponse(response, "教材册加载失败");
    if (!content) {
      this.setState({ loading: false });
      return;
    }
    const textbookBooks = adaptBackendTextbookBooks(content, {
      stage: this.state.stage,
      stageName: this.state.stageName,
      subjectId: this.state.subjectId,
      subjectName: this.state.subjectName,
      versionId: this.state.versionId,
      versionName: this.state.teachingName,
    });
    const activeBook =
      textbookBooks.find((item) => item.id === this.state.selectedBookId) ||
      textbookBooks[0];
    this.setState(
      {
        textbookBooks,
        selectedBookId: activeBook ? activeBook.id : "",
        gradeId: activeBook ? activeBook.gradeId : "",
        gradeName: activeBook ? activeBook.bookName : "",
        catalogByBookId: {},
        selectedCatalogNodeId: "",
        loading: false,
      },
      () => {
        if (activeBook) this.loadChapterTree(activeBook);
      },
    );
  };

  loadChapterTree = async (book = this.getActiveTextbookBook()) => {
    if (!book) return;
    const response = await queryTextbookChapters({
      stage: this.state.stage,
      subjectId: this.state.subjectId,
      sourceType: this.state.versionId,
      gradeId: book.gradeId,
      volumeType: book.volumeType,
    });
    const content = this.handleApiResponse(response, "教材目录加载失败");
    if (!content) return;
    this.setState((current) => ({
      catalogByBookId: {
        ...current.catalogByBookId,
        [book.id]: adaptBackendChapterTree(content),
      },
    }));
  };

  loadKnowledgeTree = async (versionId = this.state.knowledgeVersionId) => {
    if (!this.state.stage || !this.state.subjectId || !versionId) return;
    const response = await queryBasicSettingKnowledges({
      stage: this.state.stage,
      subjectId: this.state.subjectId,
      sourceType: versionId,
    });
    const content = this.handleApiResponse(response, "知识点加载失败");
    if (!content) return;
    const knowledgeDraftData = adaptBackendKnowledgeTree(content);
    this.setState({
      knowledgeDraftData,
      knowledgeDraftKey: this.getKnowledgeDraftKey(versionId),
      expandedKnowledgeNodeIds: buildExpandedKnowledgeNodeState(
        collectExpandableNodeIds(knowledgeDraftData),
      ),
      editingKnowledgeDefinitionNodeId: "",
    });
  };

  getCurrentStageInfo = () =>
    this.state.scopeList[this.state.selectedStage] ||
    this.state.scopeList[0] ||
    {};
  getCurrentSubjectList = () => this.getCurrentStageInfo().subjectList || [];
  getTextbookBooks = () => this.state.textbookBooks || [];
  getActiveTextbookBook = () =>
    this.getTextbookBooks().find(
      (item) => item.id === this.state.selectedBookId,
    ) ||
    this.getTextbookBooks()[0] ||
    null;
  getActiveCatalog = () => {
    const activeBook = this.getActiveTextbookBook();
    if (!activeBook) return [];
    return (
      this.state.catalogByBookId[activeBook.id] || activeBook.catalog || []
    );
  };
  updateActiveCatalog = (nextCatalog) => {
    const activeBook = this.getActiveTextbookBook();
    if (!activeBook) return;
    this.setState((current) => ({
      catalogByBookId: {
        ...current.catalogByBookId,
        [activeBook.id]: nextCatalog,
      },
    }));
  };
  ensureSelectedTextbookBook = () => {
    const activeBook = this.getActiveTextbookBook();
    if (!activeBook) return;
    this.setState((current) => ({
      selectedBookId: activeBook.id,
      versionId: activeBook.versionId,
      teachingName: activeBook.versionName,
      knowledgeVersionId: current.knowledgeVersionId || activeBook.versionId,
      knowledgeVersionName:
        current.knowledgeVersionName || activeBook.versionName,
      gradeId: activeBook.gradeId,
      gradeName: activeBook.bookName,
      catalogByBookId: current.catalogByBookId,
    }));
  };

  getKnowledgeDraftKey = (versionId) =>
    [
      this.state.stage,
      this.state.subjectId,
      versionId || this.state.knowledgeVersionId || this.state.versionId,
    ].join("_");
  getKnowledgeTreeData = () => this.state.knowledgeDraftData || [];
  updateKnowledgeDraft = (nextData) =>
    this.setState({
      knowledgeDraftData: nextData,
      knowledgeDraftKey: this.getKnowledgeDraftKey(),
    });
  getKnowledgeVersionOptions = () => this.state.teachingMaterialList || [];

  changeTab = (activeTab) =>
    this.setState(
      {
        activeTab,
        popVisible: false,
        fileInfo: {},
      },
      () => {
        if (activeTab === 0 || activeTab === 1) this.loadBasicSettingScope();
      },
    );
  changeStage = (index) => {
    const stageInfo = this.state.scopeList[index] || this.state.scopeList[0];
    const subject = stageInfo && stageInfo.subjectList[0];
    if (!stageInfo || !subject) return;
    this.setState(
      {
        selectedStage: index,
        stage: stageInfo.id,
        stageName: normalizeStageName(stageInfo.name),
        subjectId: subject.id,
        subjectName: subject.name,
        selectedBookId: "",
        catalogByBookId: {},
        selectedCatalogNodeId: "",
        textbookBooks: [],
        knowledgeDraftData: [],
        expandedKnowledgeNodeIds: [],
        editingKnowledgeDefinitionNodeId: "",
        popVisible: false,
      },
      this.loadTeachingMaterialAndBooks,
    );
  };
  changeSubject = (subject) =>
    this.setState(
      {
        subjectId: subject.id,
        subjectName: subject.name,
        selectedBookId: "",
        catalogByBookId: {},
        selectedCatalogNodeId: "",
        textbookBooks: [],
        knowledgeDraftData: [],
        expandedKnowledgeNodeIds: [],
        editingKnowledgeDefinitionNodeId: "",
        popVisible: false,
      },
      this.loadTeachingMaterialAndBooks,
    );
  changeTextbookVersion = (version) => {
    this.setState(
      {
        versionId: version.id,
        teachingName: version.name,
        knowledgeVersionId: version.id,
        knowledgeVersionName: version.name,
        selectedBookId: "",
        gradeId: "",
        gradeName: "",
        textbookBooks: [],
        catalogByBookId: {},
        knowledgeDraftData: [],
        expandedKnowledgeNodeIds: [],
        editingKnowledgeDefinitionNodeId: "",
        selectedCatalogNodeId: "",
        popVisible: false,
      },
      () => {
        this.loadTextbookBooks();
        this.loadKnowledgeTree(version.id);
      },
    );
  };
  changeTextbookBook = (book) =>
    this.setState(
      {
        selectedBookId: book.id,
        versionId: book.versionId,
        teachingName: book.versionName,
        knowledgeVersionId: book.versionId,
        knowledgeVersionName: book.versionName,
        gradeId: book.gradeId,
        gradeName: book.bookName,
        selectedCatalogNodeId: "",
        popVisible: false,
      },
      () => this.loadChapterTree(book),
    );
  changeKnowledgeVersion = (version) =>
    this.setState(
      {
        knowledgeVersionId: version.id,
        knowledgeVersionName: version.name,
        expandedKnowledgeNodeIds: [],
        editingKnowledgeDefinitionNodeId: "",
        popVisible: false,
      },
      () => this.loadKnowledgeTree(version.id),
    );

  openCatalogCreateModal = (parentId = "") => {
    const parentInfo = parentId
      ? findTreeNode(this.getActiveCatalog(), parentId)
      : null;
    if (!canAddChild(parentInfo ? parentInfo.level : 0, MAX_TREE_LEVEL)) {
      message.info(
        trans(
          "basicSetting.textbookCatalogMaxLevel",
          "教材目录最多支持 {$level} 层",
          {
            level: MAX_TREE_LEVEL,
          },
        ),
      );
      return;
    }
    const level = parentInfo ? parentInfo.level + 1 : 1;
    this.setState({
      catalogCreateModalVisible: true,
      catalogCreateParentId: parentId || "",
      catalogCreateName:
        level === 1 ? "新单元" : level === 2 ? "新章节" : "新课时",
    });
  };
  closeCatalogCreateModal = () =>
    this.setState({
      catalogCreateModalVisible: false,
      catalogCreateParentId: "",
      catalogCreateName: "",
    });
  getCatalogParentOptions = () =>
    [
      {
        id: "",
        label: trans("basicSetting.noParentRootNode", "无上级（一级节点）"),
      },
    ].concat(
      flattenTree(this.getActiveCatalog())
        .filter((item) => canAddChild(item.level, MAX_TREE_LEVEL))
        .map((item) => ({
          id: item.id || item.key,
          label: item.path.join(" / "),
        })),
    );
  normalizeParentId = (parentId) => (parentId ? parentId : null);

  getSiblingNodeIds = (nodes = [], nodeId) => {
    if (
      (nodes || []).some(
        (item) => String(item.id || item.key) === String(nodeId),
      )
    ) {
      return nodes.map((item) => item.id || item.key);
    }
    for (const item of nodes || []) {
      const childResult = this.getSiblingNodeIds(item.children || [], nodeId);
      if (childResult.length > 0) return childResult;
    }
    return [];
  };

  buildChapterSavePayload = (node = {}) => {
    const activeBook = this.getActiveTextbookBook();
    return {
      id: node.id,
      name: normalizeNodeName(node.name || node.text || node.title),
      enName: node.enName,
      describe: node.describe,
      parentId: this.normalizeParentId(node.parentId),
      stage: this.state.stage,
      subjectId: this.state.subjectId,
      sourceType: this.state.versionId,
      gradeId: activeBook && activeBook.gradeId,
      volumeType: activeBook && activeBook.volumeType,
      sortNo: node.sortNo,
    };
  };

  buildKnowledgeSavePayload = (node = {}) => {
    const definitionText = getKnowledgeDefinitionText(node);
    return {
      id: node.id,
      text: normalizeNodeName(
        node.knowledgeName || node.name || node.text || node.title,
      ),
      enText: node.enText,
      describe: definitionText,
      parentId: this.normalizeParentId(node.parentId),
      stage: this.state.stage,
      subjectId: this.state.subjectId,
      teachingMaterialVersion:
        this.state.knowledgeVersionId || this.state.versionId,
      sortNo: node.sortNo,
    };
  };

  confirmCatalogCreate = async () => {
    const parentId = this.state.catalogCreateParentId || "";
    const parentInfo = parentId
      ? findTreeNode(this.getActiveCatalog(), parentId)
      : null;
    const name = normalizeNodeName(this.state.catalogCreateName);
    if (!name)
      return message.info(
        trans("basicSetting.enterNodeName", "请输入节点名称"),
      );
    if (!canAddChild(parentInfo ? parentInfo.level : 0, MAX_TREE_LEVEL))
      return message.info(
        trans(
          "basicSetting.textbookCatalogMaxLevel",
          "教材目录最多支持 {$level} 层",
          {
            level: MAX_TREE_LEVEL,
          },
        ),
      );
    const response = await saveTextbookChapter(
      this.buildChapterSavePayload({
        name,
        parentId,
      }),
    );
    if (!response || !response.status) {
      return message.error(
        (response && response.message) || "教材节点保存失败",
      );
    }
    this.setState({
      selectedCatalogNodeId: response.content || "",
      catalogCreateModalVisible: false,
      catalogCreateParentId: "",
      catalogCreateName: "",
    });
    message.success(trans("basicSetting.textbookNodeSaved", "教材节点已保存"));
    this.loadChapterTree();
  };
  updateCatalogNode = (nodeId, patch) =>
    this.updateActiveCatalog(
      mapTreeNodes(this.getActiveCatalog(), nodeId, (item) => ({
        ...item,
        ...patch,
        title: patch.name || item.title,
        text: patch.name || item.text,
      })),
    );
  deleteCatalogNode = async (nodeId) => {
    const response = await deleteTextbookChapter({ id: nodeId });
    if (!response || !response.status) {
      return message.error(
        (response && response.message) ||
          trans("basicSetting.textbookNodeDeleteFailed", "教材节点删除失败"),
      );
    }
    message.success(
      trans("basicSetting.textbookNodeDeleted", "教材节点已删除"),
    );
    this.loadChapterTree();
  };
  requestDeleteCatalogNode = (node) => {
    if (node.children && node.children.length > 0) {
      message.info(
        trans("basicSetting.childNodeDeleteBlocked", "存在子节点，不允许删除"),
      );
      return;
    }
    this.setState({
      deleteModalVisible: true,
      deleteCallback: () => this.deleteCatalogNode(node.id || node.key),
    });
  };
  moveCatalogNode = async (nodeId, direction) => {
    const nextCatalog = moveSiblingNode(
      this.getActiveCatalog(),
      nodeId,
      direction,
    );
    const nodeIds = this.getSiblingNodeIds(nextCatalog, nodeId);
    if (nodeIds.length <= 1) return;
    this.updateActiveCatalog(nextCatalog);
    const response = await sortTextbookChapters({ nodeIds });
    if (!response || !response.status) {
      message.error(
        (response && response.message) ||
          trans(
            "basicSetting.textbookNodeSortSaveFailed",
            "教材节点排序保存失败",
          ),
      );
      this.loadChapterTree();
    }
  };
  saveCatalogNode = async (node) => {
    const response = await saveTextbookChapter(
      this.buildChapterSavePayload(node),
    );
    if (!response || !response.status) {
      return message.error(
        (response && response.message) ||
          trans("basicSetting.textbookNodeSaveFailed", "教材节点保存失败"),
      );
    }
    message.success(trans("basicSetting.textbookNodeSaved", "教材节点已保存"));
    this.loadChapterTree();
  };

  openKnowledgeCreateModal = (parentId = "") => {
    const parentInfo = parentId
      ? findTreeNode(this.getKnowledgeTreeData(), parentId)
      : null;
    if (!canAddChild(parentInfo ? parentInfo.level : 0, MAX_TREE_LEVEL))
      return message.info(
        trans("basicSetting.knowledgeMaxLevel", "知识点最多支持 {$level} 层", {
          level: MAX_TREE_LEVEL,
        }),
      );
    this.setState({
      knowledgeCreateModalVisible: true,
      knowledgeCreateParentId: parentId || "",
      knowledgeCreateName: "新知识点",
      knowledgeCreateDefinition: "",
    });
  };
  closeKnowledgeCreateModal = () =>
    this.setState({
      knowledgeCreateModalVisible: false,
      knowledgeCreateParentId: "",
      knowledgeCreateName: "",
      knowledgeCreateDefinition: "",
    });
  getKnowledgeParentOptions = () =>
    [
      {
        id: "",
        label: trans("basicSetting.noParentRootNode", "无上级（一级节点）"),
      },
    ].concat(
      flattenTree(this.getKnowledgeTreeData())
        .filter((item) => canAddChild(item.level, MAX_TREE_LEVEL))
        .map((item) => ({
          id: item.id || item.key,
          label: item.path.join(" / "),
        })),
    );
  confirmKnowledgeCreate = async () => {
    const parentId = this.state.knowledgeCreateParentId || "";
    const parentInfo = parentId
      ? findTreeNode(this.getKnowledgeTreeData(), parentId)
      : null;
    const name = normalizeNodeName(this.state.knowledgeCreateName);
    if (!name)
      return message.info(
        trans("basicSetting.enterKnowledgeName", "请输入知识点名称"),
      );
    if (!canAddChild(parentInfo ? parentInfo.level : 0, MAX_TREE_LEVEL))
      return message.info(
        trans("basicSetting.knowledgeMaxLevel", "知识点最多支持 {$level} 层", {
          level: MAX_TREE_LEVEL,
        }),
      );
    const response = await saveBasicSettingKnowledge(
      this.buildKnowledgeSavePayload({
        name,
        definitionText: this.state.knowledgeCreateDefinition,
        parentId,
      }),
    );
    if (!response || !response.status) {
      return message.error(
        (response && response.message) ||
          trans("basicSetting.knowledgeSaveFailed", "知识点保存失败"),
      );
    }
    this.setState({
      knowledgeCreateModalVisible: false,
      knowledgeCreateParentId: "",
      knowledgeCreateName: "",
      knowledgeCreateDefinition: "",
    });
    message.success(trans("basicSetting.knowledgeSaved", "知识点已保存"));
    this.loadKnowledgeTree();
  };
  updateKnowledgeNodeName = (nodeId, name) =>
    this.updateKnowledgeDraft(
      mapTreeNodes(this.getKnowledgeTreeData(), nodeId, (item) => ({
        ...item,
        name,
        text: name,
        title: name,
        knowledgeName: name,
      })),
    );
  /**
   * 更新指定知识点的定义草稿，保存仍由当前行按钮统一触发。
   * @param {string|number} nodeId 知识点 ID
   * @param {string} definitionText 定义文本
   * @returns {void}
   */
  updateKnowledgeNodeDefinition = (nodeId, definitionText) =>
    this.updateKnowledgeDraft(
      mapTreeNodes(this.getKnowledgeTreeData(), nodeId, (item) => ({
        ...item,
        definitionText,
      })),
    );
  /**
   * 聚焦当前知识点定义编辑框，恢复点击摘要后可直接输入的交互。
   * @returns {void}
   */
  focusKnowledgeDefinitionTextarea = () => {
    if (this.knowledgeDefinitionTextareaRef.current) {
      this.knowledgeDefinitionTextareaRef.current.focus();
    }
  };
  /**
   * 进入指定知识点的定义行内编辑状态。
   * @param {string|number} nodeId 知识点 ID
   * @returns {void}
   */
  startKnowledgeDefinitionInlineEdit = (nodeId) =>
    this.setState(
      { editingKnowledgeDefinitionNodeId: nodeId },
      this.focusKnowledgeDefinitionTextarea,
    );
  /**
   * 退出知识点定义行内编辑状态。
   * @returns {void}
   */
  closeKnowledgeDefinitionInlineEdit = () =>
    this.setState({ editingKnowledgeDefinitionNodeId: "" });
  /**
   * 切换指定知识点的子树展开状态。
   * @param {string|number} nodeId 知识点 ID
   * @returns {void}
   */
  toggleKnowledgeNodeExpanded = (nodeId) =>
    this.setState((current) => {
      const expandedNodeIds = current.expandedKnowledgeNodeIds || [];
      return {
        expandedKnowledgeNodeIds: expandedNodeIds.includes(nodeId)
          ? expandedNodeIds.filter((id) => id !== nodeId)
          : [...expandedNodeIds, nodeId],
      };
    });
  /**
   * 渲染知识点定义摘要和完整内容浮层。
   * @param {string|number} nodeId 知识点 ID
   * @param {string} definitionText 定义文本
   * @returns {React.ReactNode} 定义预览节点
   */
  renderKnowledgeDefinitionPreview = (nodeId, definitionText) => {
    const definitionHtml = renderKnowledgeDefinitionHtml(definitionText);
    return (
      <div className={styles.knowledgeDefinitionPreviewWrap}>
        <button
          type="button"
          className={styles.knowledgeDefinitionPreviewButton}
          title={
            definitionText ||
            trans(
              "basicSetting.clickToMaintainKnowledgeDefinition",
              "点击维护知识点定义",
            )
          }
          onClick={() => this.startKnowledgeDefinitionInlineEdit(nodeId)}
        >
          {definitionText ? (
            <span
              className={styles.knowledgeDefinitionPreview}
              dangerouslySetInnerHTML={{ __html: definitionHtml }}
            />
          ) : (
            <span className={styles.emptyInline}>
              {trans("basicSetting.noKnowledgeDefinition", "未维护定义")}
            </span>
          )}
        </button>
        {definitionText ? (
          <div
            className={styles.knowledgeDefinitionHoverCard}
            dangerouslySetInnerHTML={{ __html: definitionHtml }}
          />
        ) : null}
      </div>
    );
  };
  requestDeleteKnowledgeNode = (node) => {
    if (node.children && node.children.length > 0) {
      message.info(
        trans("basicSetting.childNodeDeleteBlocked", "存在子节点，不允许删除"),
      );
      return;
    }
    this.setState({
      deleteModalVisible: true,
      deleteCallback: () => this.deleteKnowledgeNode(node.id || node.key),
    });
  };
  deleteKnowledgeNode = async (nodeId) => {
    const response = await deleteBasicSettingKnowledge({ id: nodeId });
    if (!response || !response.status) {
      return message.error(
        (response && response.message) ||
          trans("basicSetting.knowledgeDeleteFailed", "知识点删除失败"),
      );
    }
    message.success(trans("basicSetting.knowledgeDeleted", "知识点已删除"));
    this.loadKnowledgeTree();
  };
  moveKnowledgeNode = async (nodeId, direction) => {
    const nextTree = moveSiblingNode(
      this.getKnowledgeTreeData(),
      nodeId,
      direction,
    );
    const nodeIds = this.getSiblingNodeIds(nextTree, nodeId);
    if (nodeIds.length <= 1) return;
    this.updateKnowledgeDraft(nextTree);
    const response = await sortBasicSettingKnowledges({ nodeIds });
    if (!response || !response.status) {
      message.error(
        (response && response.message) ||
          trans("basicSetting.knowledgeSortSaveFailed", "知识点排序保存失败"),
      );
      this.loadKnowledgeTree();
    }
  };
  saveKnowledgeNode = async (node) => {
    const response = await saveBasicSettingKnowledge(
      this.buildKnowledgeSavePayload(node),
    );
    if (!response || !response.status) {
      return message.error(
        (response && response.message) ||
          trans("basicSetting.knowledgeSaveFailed", "知识点保存失败"),
      );
    }
    message.success(trans("basicSetting.knowledgeSaved", "知识点已保存"));
    this.loadKnowledgeTree();
  };

  openKnowledgePicker = (node) =>
    this.setState({
      knowledgePickerNodeId: node.id || node.key,
    });
  applyKnowledgeToCatalog = async (
    knowledgeIds,
    chapterId = this.state.knowledgePickerNodeId,
  ) => {
    if (!chapterId) return;
    const response = await saveChapterKnowledgeRelations({
      chapterId,
      stage: this.state.stage,
      subjectId: this.state.subjectId,
      sourceType: this.state.versionId,
      knowledges: buildChapterKnowledgeRequestItems(knowledgeIds),
    });
    if (!response || !response.status) {
      return message.error(
        (response && response.message) || "关联知识点保存失败",
      );
    }
    this.updateCatalogNode(chapterId, {
      knowledgeIds,
      knowledgeIdList: knowledgeIds,
    });
    message.success(
      trans("basicSetting.linkedKnowledgeSaved", "关联知识点已保存"),
    );
  };
  removeKnowledgeFromCatalog = (node, knowledgeId) => {
    const knowledgeIds = normalizeIdList(
      node.knowledgeIds || node.knowledgeIdList,
    ).filter((id) => String(id) !== String(knowledgeId));
    this.applyKnowledgeToCatalog(knowledgeIds, node.id || node.key);
  };

  cancelDelete = () =>
    this.setState({ deleteModalVisible: false, deleteCallback: null });
  confirmDelete = () => {
    if (this.state.deleteCallback) this.state.deleteCallback();
    this.setState({ deleteModalVisible: false, deleteCallback: null });
  };
  uploadFile = (event) =>
    this.setState({ fileInfo: event.target.files && event.target.files[0] });
  openKnowledgeImportModal = () =>
    this.setState({
      knowledgeImportVisible: true,
      fileInfo: {},
      knowledgeImportMode: "incremental",
    });
  closeKnowledgeImportModal = () =>
    this.setState({
      knowledgeImportVisible: false,
      fileInfo: {},
      knowledgeImportMode: "incremental",
    });
  getKnowledgeVersionName = () =>
    this.state.knowledgeVersionName ||
    (
      this.getKnowledgeVersionOptions().find(
        (item) =>
          String(item.id) ===
          String(this.state.knowledgeVersionId || this.state.versionId),
      ) || {}
    ).name ||
    "";
  downloadCurrentKnowledgeTree = async () => {
    const { rows, workbook } = await buildKnowledgeTreeWorkbook(
      this.getKnowledgeTreeData(),
    );
    if (rows.length === 0)
      return message.info(
        trans(
          "basicSetting.emptyKnowledgeTreeDownloadBlocked",
          "当前知识树为空，无法下载",
        ),
      );
    const blob = new Blob([workbook], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = buildKnowledgeTreeFileName({
      stageName: this.state.stageName,
      subjectName: this.state.subjectName,
      versionName: this.getKnowledgeVersionName(),
    });
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };
  confirmUpload = async () => {
    if (!this.state.fileInfo.name)
      return message.info(
        trans(
          "basicSetting.selectKnowledgeTreeFileFirst",
          "请先选择知识树文件，再确认导入",
        ),
      );
    if (!/\.xlsx$/i.test(this.state.fileInfo.name))
      return message.info(
        trans(
          "basicSetting.uploadXlsxKnowledgeTree",
          "请上传 .xlsx 格式的知识树文件",
        ),
      );
    const response = await importBasicSettingKnowledges({
      file: this.state.fileInfo,
      stage: this.state.stage,
      subjectId: this.state.subjectId,
      sourceType: this.state.knowledgeVersionId || this.state.versionId,
      importMode: this.state.knowledgeImportMode,
    });
    if (!response || !response.status) {
      return message.error(
        (response && response.message) ||
          trans("basicSetting.knowledgeTreeImportFailed", "知识树导入失败"),
      );
    }
    message.success(
      this.state.knowledgeImportMode === "replace"
        ? trans("basicSetting.replaceImportSuccess", "全量覆盖导入成功")
        : trans("basicSetting.incrementalImportSuccess", "增量更新导入成功"),
    );
    this.closeKnowledgeImportModal();
    this.loadKnowledgeTree();
  };

  parentSwitchChange = (checked) =>
    this.setState({ allSubjectScoreParentSwitch: checked });
  examAliasSwitchChange = (checked) =>
    this.setState({ examAliasSwitch: checked });
  studentSwitchChange = (checked) =>
    this.setState({ allSubjectScoreStudentSwitch: checked });
  radioChange = (event) =>
    this.setState({
      parentScoreWatchSwitch: event.target.value === "parentScoreWatchSwitch",
      parentScoreAndRankWatchSwitch:
        event.target.value === "parentScoreAndRankWatchSwitch",
    });
  radioChangeForStudent = (event) =>
    this.setState({
      studentScoreWatchSwitch: event.target.value === "studentScoreWatchSwitch",
      studentScoreAndRankWatchSwitch:
        event.target.value === "studentScoreAndRankWatchSwitch",
    });
  reportSupportChangeForParent = (value) =>
    this.setState({ parentStage: value });
  reportSupportChangeForStudent = (value) =>
    this.setState({ studentStage: value });
  save = () => {
    const {
      allSubjectScoreParentSwitch,
      parentScoreWatchSwitch,
      parentScoreAndRankWatchSwitch,
      allSubjectScoreStudentSwitch,
      studentScoreWatchSwitch,
      studentScoreAndRankWatchSwitch,
      examAliasSwitch,
      parentStage,
      studentStage,
    } = this.state;
    saveConfig({
      type: 6,
      businessId: null,
      schoolLevel: true,
      config: JSON.stringify({
        allSubjectScoreParentSwitch,
        parentScoreWatchSwitch,
        parentScoreAndRankWatchSwitch,
        allSubjectScoreStudentSwitch,
        studentScoreWatchSwitch,
        studentScoreAndRankWatchSwitch,
        examAliasSwitch,
        parentStage,
        studentStage,
      }),
    }).then((response) => {
      if (response.status) message.success(response && response.message);
      else message.error(response.message);
    });
  };

  renderConditionPop = () => {
    const stageInfo = this.getCurrentStageInfo();
    const books = this.getTextbookBooks().filter(
      (item) => Number(item.versionId) === Number(this.state.versionId),
    );
    const versions = this.getKnowledgeVersionOptions();
    return (
      <div className={styles.conditionPop}>
        <div
          className={styles.conditionMask}
          onClick={() => this.setState({ popVisible: false })}
        />
        <div className={styles.conditionContent}>
          <div className={styles.conditionItem}>
            <span className={styles.conditionTitle}>
              {trans("global.stageLabel", "学段：")}
            </span>
            <div className={styles.stageList}>
              {(this.state.scopeList || []).map((item, index) => (
                <span
                  key={item.id}
                  className={
                    index === this.state.selectedStage ? styles.active : ""
                  }
                  onClick={() => this.changeStage(index)}
                >
                  {item.name}
                </span>
              ))}
            </div>
          </div>
          <div className={styles.conditionItem}>
            <span className={styles.conditionTitle}>
              {trans("global.subjectLabel", "学科：")}
            </span>
            <div className={styles.stageList}>
              {(stageInfo.subjectList || []).map((item) => (
                <span
                  key={item.id}
                  className={
                    String(item.id) === String(this.state.subjectId)
                      ? styles.active
                      : ""
                  }
                  onClick={() => this.changeSubject(item)}
                >
                  {item.name}
                </span>
              ))}
            </div>
          </div>
          <div className={styles.conditionItem}>
            <span className={styles.conditionTitle}>
              {this.state.activeTab === 0
                ? trans("basicSetting.textbookVersionLabel", "教材版本：")
                : trans("basicSetting.knowledgeVersionLabel", "知识点版本：")}
            </span>
            <div className={styles.stageList}>
              {versions.map((item) => (
                <span
                  key={item.id}
                  className={
                    String(item.id) ===
                    String(
                      this.state.activeTab === 0
                        ? this.state.versionId
                        : this.state.knowledgeVersionId,
                    )
                      ? styles.active
                      : ""
                  }
                  onClick={() =>
                    this.state.activeTab === 0
                      ? this.changeTextbookVersion(item)
                      : this.changeKnowledgeVersion(item)
                  }
                >
                  {item.name}
                </span>
              ))}
            </div>
          </div>
          {this.state.activeTab === 0 ? (
            <div className={styles.conditionItem}>
              <span className={styles.conditionTitle}>
                {trans("basicSetting.bookVolumeLabel", "册别：")}
              </span>
              <div className={styles.stageList}>
                {books.map((item) => (
                  <span
                    key={item.id}
                    className={
                      item.id === this.state.selectedBookId ? styles.active : ""
                    }
                    onClick={() => this.changeTextbookBook(item)}
                  >
                    {item.bookName}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    );
  };

  renderKnowledgeTags = (node, options = {}) => {
    const lookup = knowledgeLookup(
      this.getKnowledgeTreeData(
        this.state.versionId || this.state.knowledgeVersionId,
      ),
    );
    const ids = normalizeIdList(node.knowledgeIds || node.knowledgeIdList);
    if (ids.length === 0)
      return (
        <span className={styles.emptyInline}>
          {trans("basicSetting.notLinked", "未关联")}
        </span>
      );
    return (
      <div className={styles.knowledgeTagList}>
        {ids.map((id) => {
          const item = lookup[String(id)];
          return (
            <span key={id} title={knowledgePathLabel(lookup, id)}>
              {item ? item.name : id}
              {options.removable ? (
                <button
                  type="button"
                  title={trans("basicSetting.unlinkKnowledge", "取消关联")}
                  onClick={(event) => {
                    event.stopPropagation();
                    this.removeKnowledgeFromCatalog(node, id);
                  }}
                >
                  ×
                </button>
              ) : null}
            </span>
          );
        })}
      </div>
    );
  };

  renderCatalogRows = (
    nodes = [],
    level = 1,
    selectedNodeId = this.state.selectedCatalogNodeId,
  ) =>
    nodes.map((item) => {
      const nodeId = item.id || item.key;
      const selected = String(selectedNodeId) === String(nodeId);
      const name = normalizeNodeName(item.name || item.text || item.title);
      return (
        <div
          key={nodeId}
          className={[
            styles.treeRow,
            selected ? styles.activeTreeRow : "",
          ].join(" ")}
        >
          <div
            className={styles.treeNodeLine}
            style={{ paddingLeft: `${12 + (level - 1) * 14}px` }}
          >
            <button
              type="button"
              className={styles.treeSelectButton}
              onClick={() => this.setState({ selectedCatalogNodeId: nodeId })}
            >
              <i>{item.children && item.children.length > 0 ? "▾" : "•"}</i>
              <input
                value={name}
                onClick={(event) => event.stopPropagation()}
                onChange={(event) =>
                  this.updateCatalogNode(nodeId, { name: event.target.value })
                }
              />
            </button>
            <div className={styles.treeKnowledgeCell}>
              {this.renderKnowledgeTags(item, { removable: true })}
              <button
                type="button"
                className={styles.inlineLinkButton}
                onClick={() => this.openKnowledgePicker(item)}
              >
                {trans("basicSetting.linkKnowledgePoints", "关联知识点")}
              </button>
            </div>
            <div className={styles.treeActions}>
              {canAddChild(level, MAX_TREE_LEVEL) ? (
                <button
                  type="button"
                  onClick={() => this.openCatalogCreateModal(nodeId)}
                >
                  {trans("global.add", "新增")}
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => this.moveCatalogNode(nodeId, "up")}
              >
                {trans("global.moveUp", "上移")}
              </button>
              <button
                type="button"
                onClick={() => this.moveCatalogNode(nodeId, "down")}
              >
                {trans("global.moveDown", "下移")}
              </button>
              <button type="button" onClick={() => this.saveCatalogNode(item)}>
                {trans("global.save", "保存")}
              </button>
              <button
                type="button"
                onClick={() => this.requestDeleteCatalogNode(item)}
              >
                {trans("global.delete", "删除")}
              </button>
            </div>
          </div>
          {item.children && item.children.length > 0
            ? this.renderCatalogRows(item.children, level + 1, selectedNodeId)
            : null}
        </div>
      );
    });

  renderTextbookWorkspace = () => (
    <div className={styles.treeWorkspace}>
      <div className={styles.catalogTreePanel}>
        <div className={styles.catalogTreeHeader}>
          <span>{trans("basicSetting.textbookCatalog", "教材目录")}</span>
          <span>{trans("basicSetting.linkKnowledgePoints", "关联知识点")}</span>
          <span className={styles.headerActionCell}>
            {trans("global.option", "操作")}
            <button
              type="button"
              className={styles.primaryButton}
              onClick={() => this.openCatalogCreateModal("")}
            >
              {trans("global.add", "新增")}
            </button>
          </span>
        </div>
        <div className={styles.treeBody}>
          {this.getActiveCatalog().length > 0 ? (
            this.renderCatalogRows(this.getActiveCatalog())
          ) : (
            <div className={styles.emptyTree}>
              {trans("basicSetting.noCatalogForBook", "当前册别暂无教材目录")}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  renderKnowledgeRows = (nodes = [], level = 1) =>
    nodes.map((item) => {
      const nodeId = item.id || item.key;
      const hasChildren = item.children && item.children.length > 0;
      const expanded = this.state.expandedKnowledgeNodeIds.includes(nodeId);
      const name = normalizeNodeName(
        item.knowledgeName || item.text || item.name || item.title,
      );
      const definitionText = getKnowledgeDefinitionText(item);
      const editingDefinition =
        this.state.editingKnowledgeDefinitionNodeId === nodeId;
      return (
        <div key={nodeId} className={styles.treeRow}>
          <div className={styles.knowledgeNodeLine}>
            <div
              className={styles.knowledgeNameCell}
              style={{ paddingLeft: `${12 + (level - 1) * 14}px` }}
            >
              {hasChildren ? (
                <button
                  type="button"
                  className={styles.treeExpandButton}
                  aria-label={
                    expanded
                      ? trans("basicSetting.collapseKnowledge", "收起知识点")
                      : trans("basicSetting.expandKnowledge", "展开知识点")
                  }
                  onClick={() => this.toggleKnowledgeNodeExpanded(nodeId)}
                >
                  {expanded ? "▾" : "▸"}
                </button>
              ) : (
                <i>•</i>
              )}
              <input
                value={name}
                onChange={(event) =>
                  this.updateKnowledgeNodeName(nodeId, event.target.value)
                }
              />
            </div>
            <div className={styles.knowledgeDefinitionCell}>
              {editingDefinition ? (
                <textarea
                  ref={this.knowledgeDefinitionTextareaRef}
                  className={styles.knowledgeDefinitionTextarea}
                  value={definitionText}
                  placeholder={trans(
                    "basicSetting.enterKnowledgeDefinition",
                    "请输入知识点定义，行内公式使用 $...$，块级公式使用 $$...$$",
                  )}
                  onBlur={this.closeKnowledgeDefinitionInlineEdit}
                  onChange={(event) =>
                    this.updateKnowledgeNodeDefinition(
                      nodeId,
                      event.target.value,
                    )
                  }
                  onKeyDown={(event) => {
                    if (
                      event.key === "Escape" ||
                      ((event.ctrlKey || event.metaKey) &&
                        event.key === "Enter")
                    ) {
                      event.currentTarget.blur();
                    }
                  }}
                />
              ) : (
                this.renderKnowledgeDefinitionPreview(nodeId, definitionText)
              )}
            </div>
            <div className={styles.treeActions}>
              {canAddChild(level, MAX_TREE_LEVEL) ? (
                <button
                  type="button"
                  onClick={() => this.openKnowledgeCreateModal(nodeId)}
                >
                  {trans("global.add", "新增")}
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => this.moveKnowledgeNode(nodeId, "up")}
              >
                {trans("global.moveUp", "上移")}
              </button>
              <button
                type="button"
                onClick={() => this.moveKnowledgeNode(nodeId, "down")}
              >
                {trans("global.moveDown", "下移")}
              </button>
              <button
                type="button"
                onClick={() => this.saveKnowledgeNode(item)}
              >
                {trans("global.save", "保存")}
              </button>
              <button
                type="button"
                onClick={() => this.requestDeleteKnowledgeNode(item)}
              >
                {trans("global.delete", "删除")}
              </button>
            </div>
          </div>
          {hasChildren && expanded
            ? this.renderKnowledgeRows(item.children, level + 1)
            : null}
        </div>
      );
    });

  renderKnowledgeWorkspace = () => (
    <div className={styles.treeWorkspace}>
      <div className={styles.knowledgeTreeHeader}>
        <span>{trans("basicSetting.knowledgeName", "知识点名称")}</span>
        <span>{trans("basicSetting.knowledgeDefinition", "知识点定义")}</span>
        <span className={styles.headerActionCell}>
          {trans("global.option", "操作")}
          <button
            type="button"
            className={styles.primaryButton}
            onClick={() => this.openKnowledgeCreateModal("")}
          >
            {trans("global.add", "新增")}
          </button>
        </span>
      </div>
      <div className={styles.treeBody}>
        {this.getKnowledgeTreeData().length > 0 ? (
          this.renderKnowledgeRows(this.getKnowledgeTreeData())
        ) : (
          <div className={styles.emptyTree}>
            {trans(
              "basicSetting.noKnowledgeForScope",
              "当前学段学科暂无知识点",
            )}
          </div>
        )}
      </div>
    </div>
  );

  renderPageSettings = () => (
    <div className={styles.pageSettingPanel}>
      <div className={styles.settingBlock}>
        <div className={styles.settingTitle}>
          {trans("global.learningAnalysisAccessRange", "学情分析开放范围")}
        </div>
        <div className={styles.settingRow}>
          <div className={styles.settingLabel}>
            {trans("global.overallSubjectScores", "全科成绩")}
          </div>
          <div className={styles.settingContent}>
            <div className={styles.settingLine}>
              <Switch
                onChange={this.parentSwitchChange}
                checked={this.state.allSubjectScoreParentSwitch}
              />
              <span>{trans("global.visibleToParents", "家长可见")}</span>
              {this.state.allSubjectScoreParentSwitch ? (
                <>
                  <Radio
                    value="parentScoreWatchSwitch"
                    checked={this.state.parentScoreWatchSwitch}
                    onChange={this.radioChange}
                  >
                    {trans(
                      "global.onlyShowScoreRankingHidden",
                      "只给看分数，排名不可见",
                    )}
                  </Radio>
                  <Radio
                    value="parentScoreAndRankWatchSwitch"
                    checked={this.state.parentScoreAndRankWatchSwitch}
                    onChange={this.radioChange}
                  >
                    {trans("global.scoreAndRankingVisible", "分数排名均可见")}
                  </Radio>
                </>
              ) : null}
            </div>
            <div className={styles.settingLine}>
              <Switch
                onChange={this.studentSwitchChange}
                checked={this.state.allSubjectScoreStudentSwitch}
              />
              <span>{trans("global.visibleToStudents", "学生可见")}</span>
              {this.state.allSubjectScoreStudentSwitch ? (
                <>
                  <Radio
                    value="studentScoreWatchSwitch"
                    checked={this.state.studentScoreWatchSwitch}
                    onChange={this.radioChangeForStudent}
                  >
                    {trans(
                      "global.onlyShowScoreRankingHidden",
                      "只给看分数，排名不可见",
                    )}
                  </Radio>
                  <Radio
                    value="studentScoreAndRankWatchSwitch"
                    checked={this.state.studentScoreAndRankWatchSwitch}
                    onChange={this.radioChangeForStudent}
                  >
                    {trans("global.scoreAndRankingVisible", "分数排名均可见")}
                  </Radio>
                </>
              ) : null}
            </div>
          </div>
        </div>
      </div>
      <div className={styles.settingBlock}>
        <div className={styles.settingTitle}>
          {trans("global.quizNameAliasConfig", "测验名称别名配置")}
        </div>
        <div className={styles.settingRow}>
          <div className={styles.settingLabel}>
            {trans("global.supportAliasSetting", "支持设置别名")}
          </div>
          <div className={styles.settingContent}>
            <div className={styles.settingLine}>
              <Switch
                onChange={this.examAliasSwitchChange}
                checked={this.state.examAliasSwitch}
              />
              <span>
                {this.state.examAliasSwitch
                  ? trans("global.open", "打开")
                  : trans("global.close", "关闭")}
              </span>
              <span>
                （
                {trans(
                  "global.aliasUsageNote",
                  "使用场景：如画像报告按学科展示多次测验趋势时，为保证X轴的完整显示，使用简短的别名",
                )}
                ）
              </span>
            </div>
          </div>
        </div>
      </div>
      <div className={styles.settingBlock}>
        <div className={styles.settingTitle}>
          {trans(
            "basicSetting.learningReportStudentStageScope",
            "学情报告可发送给学生的学段",
          )}
        </div>
        <div className={styles.settingRow}>
          <div className={styles.settingLabel}>
            {trans("basicSetting.sendToParents", "发送给家长")}
          </div>
          <div className={styles.settingContent}>
            <Checkbox.Group
              options={[
                { label: trans("global.kindergarten", "幼儿园"), value: 1 },
                { label: trans("global.primarySchool", "小学"), value: 2 },
                { label: trans("global.middleSchool", "初中"), value: 3 },
                { label: trans("global.highSchool", "高中"), value: 4 },
              ]}
              onChange={this.reportSupportChangeForParent}
              value={this.state.parentStage || []}
            />
          </div>
        </div>
        <div className={styles.settingRow}>
          <div className={styles.settingLabel}>
            {trans("basicSetting.sendToStudents", "发送给学生")}
          </div>
          <div className={styles.settingContent}>
            <Checkbox.Group
              options={[
                { label: trans("global.kindergarten", "幼儿园"), value: 1 },
                { label: trans("global.primarySchool", "小学"), value: 2 },
                { label: trans("global.middleSchool", "初中"), value: 3 },
                { label: trans("global.highSchool", "高中"), value: 4 },
              ]}
              onChange={this.reportSupportChangeForStudent}
              value={this.state.studentStage || []}
            />
          </div>
        </div>
      </div>
      <div className={styles.settingFooter}>
        <MyButton
          sizeclass="commonBtn"
          typeclass="confirmBtn"
          onClick={this.save}
        >
          {trans("global.save", "保存")}
        </MyButton>
      </div>
    </div>
  );

  renderCreateModals = () => {
    const catalogParentOptions = this.getCatalogParentOptions();
    const knowledgeParentOptions = this.getKnowledgeParentOptions();
    const pickerNode = this.state.knowledgePickerNodeId
      ? findTreeNode(this.getActiveCatalog(), this.state.knowledgePickerNodeId)
      : null;
    return (
      <>
        {this.state.catalogCreateModalVisible ? (
          <Modal
            visible
            title={null}
            footer={null}
            onCancel={this.closeCatalogCreateModal}
            maskClosable
            centered
            className={styles.modalStyle}
            closable={false}
          >
            <div className={styles.modalContent}>
              <div className={styles.modalHead}>
                <i
                  className={icon.iconfont}
                  onClick={this.closeCatalogCreateModal}
                >
                  &#xe6e2;
                </i>
                <span>
                  {trans("basicSetting.addTextbookNode", "新增教材节点")}
                </span>
              </div>
              <div className={styles.createNodeForm}>
                <label>
                  <span>{trans("basicSetting.nodeName", "节点名称")}</span>
                  <input
                    value={this.state.catalogCreateName}
                    placeholder={trans(
                      "basicSetting.enterNodeName",
                      "请输入节点名称",
                    )}
                    onChange={(event) =>
                      this.setState({ catalogCreateName: event.target.value })
                    }
                  />
                </label>
                <label>
                  <span>{trans("basicSetting.parentNode", "上级节点")}</span>
                  <select
                    value={this.state.catalogCreateParentId}
                    onChange={(event) =>
                      this.setState({
                        catalogCreateParentId: event.target.value,
                      })
                    }
                  >
                    {catalogParentOptions.map((option) => (
                      <option key={option.id || "root"} value={option.id}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <p>
                  {trans(
                    "basicSetting.addTextbookNodeTip",
                    "默认按所选上级新增子节点；选择“无上级”时新增一级节点。",
                  )}
                </p>
              </div>
              <div className={styles.modalButton}>
                <span
                  className={styles.modalCancel}
                  onClick={this.closeCatalogCreateModal}
                >
                  {trans("global.cancel", "取消")}
                </span>
                <span
                  className={styles.modalConfirm}
                  onClick={this.confirmCatalogCreate}
                >
                  {trans("global.confirmText", "确定")}
                </span>
              </div>
            </div>
          </Modal>
        ) : null}
        {this.state.knowledgeCreateModalVisible ? (
          <Modal
            visible
            title={null}
            footer={null}
            onCancel={this.closeKnowledgeCreateModal}
            maskClosable
            centered
            className={styles.modalStyle}
            closable={false}
          >
            <div className={styles.modalContent}>
              <div className={styles.modalHead}>
                <i
                  className={icon.iconfont}
                  onClick={this.closeKnowledgeCreateModal}
                >
                  &#xe6e2;
                </i>
                <span>
                  {trans("basicSetting.addKnowledgePoint", "新增知识点")}
                </span>
              </div>
              <div className={styles.createNodeForm}>
                <label>
                  <span>
                    {trans("basicSetting.knowledgeName", "知识点名称")}
                  </span>
                  <input
                    value={this.state.knowledgeCreateName}
                    placeholder={trans(
                      "basicSetting.enterKnowledgeName",
                      "请输入知识点名称",
                    )}
                    onChange={(event) =>
                      this.setState({ knowledgeCreateName: event.target.value })
                    }
                  />
                </label>
                <label className={styles.createNodeRichTextField}>
                  <span>
                    {trans("basicSetting.knowledgeDefinition", "知识点定义")}
                  </span>
                  <div className={styles.knowledgeDefinitionEditorGrid}>
                    <textarea
                      value={this.state.knowledgeCreateDefinition}
                      placeholder={trans(
                        "basicSetting.enterKnowledgeDefinition",
                        "请输入知识点定义，行内公式使用 $...$，块级公式使用 $$...$$",
                      )}
                      onChange={(event) =>
                        this.setState({
                          knowledgeCreateDefinition: event.target.value,
                        })
                      }
                    />
                    <div
                      className={styles.knowledgeDefinitionLivePreview}
                      aria-label={trans(
                        "basicSetting.knowledgeDefinitionPreview",
                        "知识点定义预览",
                      )}
                      dangerouslySetInnerHTML={{
                        __html: renderKnowledgeDefinitionHtml(
                          this.state.knowledgeCreateDefinition,
                        ),
                      }}
                    />
                  </div>
                </label>
                <label>
                  <span>{trans("basicSetting.parentNode", "上级节点")}</span>
                  <select
                    value={this.state.knowledgeCreateParentId}
                    onChange={(event) =>
                      this.setState({
                        knowledgeCreateParentId: event.target.value,
                      })
                    }
                  >
                    {knowledgeParentOptions.map((option) => (
                      <option key={option.id || "root"} value={option.id}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <p>
                  {trans(
                    "basicSetting.addKnowledgePointTip",
                    "默认按所选上级新增子节点；选择“无上级”时新增一级知识点。",
                  )}
                </p>
              </div>
              <div className={styles.modalButton}>
                <span
                  className={styles.modalCancel}
                  onClick={this.closeKnowledgeCreateModal}
                >
                  {trans("global.cancel", "取消")}
                </span>
                <span
                  className={styles.modalConfirm}
                  onClick={this.confirmKnowledgeCreate}
                >
                  {trans("global.confirmText", "确定")}
                </span>
              </div>
            </div>
          </Modal>
        ) : null}
        {this.state.knowledgeImportVisible ? (
          <Modal
            visible
            title={null}
            footer={null}
            onCancel={this.closeKnowledgeImportModal}
            maskClosable
            centered
            className={styles.importModalStyle}
            closable={false}
          >
            <div className={styles.modalContent}>
              <div className={styles.modalHead}>
                <i
                  className={icon.iconfont}
                  onClick={this.closeKnowledgeImportModal}
                >
                  &#xe6e2;
                </i>
                <span>
                  {trans(
                    "basicSetting.batchImportKnowledgeTree",
                    "批量导入知识树",
                  )}
                </span>
              </div>
              <div className={styles.importPanel}>
                <div className={styles.importScope}>
                  <span>{trans("basicSetting.currentScope", "当前范围")}</span>
                  <strong>
                    {[
                      this.state.stageName,
                      this.state.subjectName,
                      this.getKnowledgeVersionName(),
                    ]
                      .filter(Boolean)
                      .join(" / ")}
                  </strong>
                </div>
                <div className={styles.importStep}>
                  <strong>
                    {trans(
                      "basicSetting.downloadKnowledgeTreeStep",
                      "1. 下载现有知识树",
                    )}
                  </strong>
                  <p>
                    {trans(
                      "basicSetting.downloadKnowledgeTreeTip",
                      "建议先下载当前版本知识树，在表格中修改后重新上传。",
                    )}
                  </p>
                  <button
                    type="button"
                    onClick={this.downloadCurrentKnowledgeTree}
                  >
                    {trans(
                      "basicSetting.downloadCurrentKnowledgeTree",
                      "下载现有知识树",
                    )}
                  </button>
                </div>
                <div className={styles.importStep}>
                  <strong>
                    {trans(
                      "basicSetting.selectImportModeStep",
                      "2. 选择导入方式",
                    )}
                  </strong>
                  <div className={styles.importModeGroup}>
                    <button
                      type="button"
                      className={
                        this.state.knowledgeImportMode === "incremental"
                          ? styles.activeImportMode
                          : ""
                      }
                      onClick={() =>
                        this.setState({ knowledgeImportMode: "incremental" })
                      }
                    >
                      <span>
                        {trans("basicSetting.incrementalUpdate", "增量更新")}
                      </span>
                      <em>
                        {trans(
                          "basicSetting.incrementalUpdateTip",
                          "新增或更新匹配知识点，不会删除原有知识点。",
                        )}
                      </em>
                    </button>
                    <button
                      type="button"
                      className={
                        this.state.knowledgeImportMode === "replace"
                          ? styles.activeImportMode
                          : ""
                      }
                      onClick={() =>
                        this.setState({ knowledgeImportMode: "replace" })
                      }
                    >
                      <span>
                        {trans("basicSetting.replaceAll", "全量覆盖")}
                      </span>
                      <em>
                        {trans(
                          "basicSetting.replaceAllTip",
                          "以上传文件为准重建当前范围知识树，会覆盖原有结构。",
                        )}
                      </em>
                    </button>
                  </div>
                </div>
                <div className={styles.importStep}>
                  <strong>
                    {trans(
                      "basicSetting.uploadEditedFileStep",
                      "3. 上传修改后的文件",
                    )}
                  </strong>
                  <label className={styles.importFileButton}>
                    <span>
                      {this.state.fileInfo.name ||
                        trans(
                          "basicSetting.selectKnowledgeTreeFile",
                          "选择知识树文件",
                        )}
                    </span>
                    <input
                      type="file"
                      onChange={this.uploadFile}
                      accept=".xlsx"
                    />
                  </label>
                </div>
              </div>
              <div className={styles.modalButton}>
                <span
                  className={styles.modalCancel}
                  onClick={this.closeKnowledgeImportModal}
                >
                  {trans("global.cancel", "取消")}
                </span>
                <span
                  className={styles.modalConfirm}
                  onClick={this.confirmUpload}
                >
                  {trans("basicSetting.confirmImport", "确认导入")}
                </span>
              </div>
            </div>
          </Modal>
        ) : null}
        {this.state.deleteModalVisible ? (
          <Modal
            visible
            title={null}
            footer={null}
            onCancel={this.cancelDelete}
            maskClosable
            centered
            className={styles.modalStyle}
            closable={false}
          >
            <div className={styles.modalContent}>
              <div className={styles.modalHead}>
                <i className={icon.iconfont} onClick={this.cancelDelete}>
                  &#xe6e2;
                </i>
                <span>{trans("basicSetting.deleteNode", "删除节点")}</span>
              </div>
              <p className={styles.deleteTips}>
                {trans(
                  "basicSetting.confirmDeleteNode",
                  "您确定要删除该节点吗？删除后不可恢复。",
                )}
              </p>
              <div className={styles.modalButton}>
                <span
                  className={styles.modalCancel}
                  onClick={this.cancelDelete}
                >
                  {trans("global.cancel", "取消")}
                </span>
                <span
                  className={styles.modalConfirm}
                  onClick={this.confirmDelete}
                >
                  {trans("global.confirmText", "确定")}
                </span>
              </div>
            </div>
          </Modal>
        ) : null}
        {pickerNode ? (
          <KnowledgePickerModal
            key={this.state.knowledgePickerNodeId}
            knowledgeTree={this.getKnowledgeTreeData()}
            value={
              (pickerNode.node &&
                (pickerNode.node.knowledgeIds ||
                  pickerNode.node.knowledgeIdList)) ||
              []
            }
            onApply={this.applyKnowledgeToCatalog}
            onClose={() =>
              this.setState({
                knowledgePickerNodeId: "",
              })
            }
          />
        ) : null}
      </>
    );
  };

  render() {
    const activeTitle =
      this.state.activeTab === 0
        ? [
            this.state.stageName,
            this.state.subjectName,
            this.state.teachingName,
            this.state.gradeName,
          ]
        : [
            this.state.stageName,
            this.state.subjectName,
            this.getKnowledgeVersionName(),
          ];
    return (
      <div className={styles.manageMain}>
        <div className={styles.contentBox}>
          <div className={styles.tab} id="tabbar">
            <span
              className={this.state.activeTab === 0 ? styles.activeTab : ""}
              onClick={() => this.changeTab(0)}
            >
              {trans("basicSetting.chapterManagement", "章节管理")}
            </span>
            <span
              className={this.state.activeTab === 1 ? styles.activeTab : ""}
              onClick={() => this.changeTab(1)}
            >
              {trans("basicSetting.knowledgeManagement", "知识点管理")}
            </span>
            <span
              className={this.state.activeTab === 3 ? styles.activeTab : ""}
              onClick={() => this.changeTab(3)}
            >
              {trans("basicSetting.pageFeatureSettings", "页面功能设置")}
            </span>
          </div>
          {this.state.activeTab === 0 || this.state.activeTab === 1 ? (
            <div className={styles.filterCondition} id="conditionArea">
              <div className={styles.titlePart}>
                <div
                  className={styles.filterResult}
                  onClick={() => this.setState({ popVisible: true })}
                >
                  <div>
                    <span className={styles.mainTitle}>
                      {activeTitle.filter(Boolean).join(" / ")}
                    </span>
                  </div>
                  <i className={icon.iconfont}>
                    {this.state.popVisible ? "" : ""}
                  </i>
                </div>
                {this.state.popVisible ? this.renderConditionPop() : null}
              </div>
              {this.state.activeTab === 1 ? (
                <div className={styles.operationArea}>
                  <span onClick={this.openKnowledgeImportModal}>
                    {trans("basicSetting.batchImport", "批量导入")}
                  </span>
                </div>
              ) : null}
            </div>
          ) : null}
          {this.state.activeTab === 0 || this.state.activeTab === 1 ? (
            <Spin spinning={this.state.loading} size="large">
              {this.state.activeTab === 0
                ? this.renderTextbookWorkspace()
                : this.renderKnowledgeWorkspace()}
            </Spin>
          ) : null}
          {this.state.activeTab === 3 ? this.renderPageSettings() : null}
        </div>
        {this.renderCreateModals()}
      </div>
    );
  }
}

export default BasicSetting;
