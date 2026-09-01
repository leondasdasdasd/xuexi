import React, { PureComponent } from "react";
import { Button, Empty, Input, message, Modal, Select } from "antd";
import { connect } from "dva";

import { htmlToSlate, slateToHtml } from "../../components/SlateRichEditor";
import { getHtmlRecognitionModelList } from "../../services/htmlRecognition";
import { trans } from "../../utils/i18n";
import {
  convertImportFileToHtml,
  IMPORT_FILE_ACCEPT,
  recognizeQuestionsFromHtml,
} from "./importHelpers";
import QuestionEditorCard from "./QuestionEditorCard";
import {
  buildBatchImportPayload,
  cleanupRichTextHtml,
  collectRichFieldDefinitions,
  createEmptyQuestion,
  createGapAnswerGroup,
  createGapAnswerItem,
  createUid,
  normalizeTreeData,
  parseJsonQuestions,
  resetQuestionByType,
  syncGapFillingAnswerDraft,
  syncQuestionListMetaByTree,
  updateQuestionListRichField,
  validateQuestionList,
} from "./utils";

import icon from "../../icon.module.less";
import styles from "./index.module.less";

const { Option } = Select;
const { TextArea } = Input;

const updateQuestionTree = (list, path, updater) =>
  list.map((item, index) => {
    if (index !== path[0]) {
      return item;
    }

    if (path.length === 1) {
      return updater(item);
    }

    return {
      ...item,
      sonQuestionList: updateQuestionTree(
        item.sonQuestionList || [],
        path.slice(1),
        updater,
      ),
    };
  });

const removeQuestionTree = (list, path) => {
  if (path.length === 1) {
    return list.filter((item, index) => index !== path[0]);
  }

  return list.map((item, index) => {
    if (index !== path[0]) {
      return item;
    }

    return {
      ...item,
      sonQuestionList: removeQuestionTree(
        item.sonQuestionList || [],
        path.slice(1),
      ),
    };
  });
};

const normalizeModelOptions = (modelList) =>
  (modelList || [])
    .map((item) => ({
      modelCode:
        item && (item.modelCode || item.id) ? item.modelCode || item.id : "",
      modelName:
        (item &&
          (item.modelName ||
            item.modelEname ||
            item.name ||
            item.modelCode ||
            item.id)) ||
        "",
      isDefault: !!(item && item.isDefault),
    }))
    .filter((item) => item.modelCode);

const extractModelList = (response) => {
  if (!response || response.err || response.error) {
    return [];
  }

  if (Array.isArray(response)) {
    return response;
  }

  if (Array.isArray(response.data)) {
    return response.data;
  }

  if (Array.isArray(response.models)) {
    return response.models;
  }

  if (Array.isArray(response.content)) {
    return response.content;
  }

  if (response.content && Array.isArray(response.content.data)) {
    return response.content.data;
  }

  if (response.content && Array.isArray(response.content.models)) {
    return response.content.models;
  }

  return [];
};

class JsonQuestionImport extends PureComponent {
  constructor(properties) {
    super(properties);
    this.fileInputRef = React.createRef();
    this.state = {
      activeFieldId: null,
      activeFieldMeta: null,
      aiRawText: "",
      chapterTreeData: [],
      cleanedHtml: "",
      convertingHtml: false,
      fieldHtmlMap: {},
      fieldMetaMap: {},
      fieldSlateValueMap: {},
      gradeValue: undefined,
      importFileName: "",
      importFileType: "",
      jsonText: "",
      knowledgeTreeData: [],
      modelList: [],
      modelListLoading: false,
      mountedRichFieldIdMap: {},
      parsing: false,
      questionList: [],
      recognizingHtml: false,
      saveResultVisible: false,
      saveSuccessCount: 0,
      saving: false,
      selectedModel: undefined,
      subjectValue: undefined,
    };
  }

  componentDidMount() {
    window.parent.postMessage("padding", "*");
    this.props.dispatch({
      type: "inputQuestion/getAllGradeList",
    });
    this.loadModelList();
  }

  loadModelList = () => {
    this.setState({
      modelListLoading: true,
    });

    getHtmlRecognitionModelList()
      .then((response) => {
        const modelList = normalizeModelOptions(extractModelList(response));

        if (modelList.length === 0) {
          this.setState({
            modelListLoading: false,
          });
          return;
        }

        const defaultModel =
          modelList.find((item) => item.isDefault) || modelList[0];

        this.setState((previousState) => ({
          modelList,
          modelListLoading: false,
          selectedModel: modelList.some(
            (item) => item.modelCode === previousState.selectedModel,
          )
            ? previousState.selectedModel
            : defaultModel.modelCode,
        }));
      })
      .catch(() => {
        this.setState({
          modelListLoading: false,
        });
      });
  };

  getFieldSlateValue = (fieldId) => this.state.fieldSlateValueMap[fieldId];

  buildEditorContext = (
    questionList,
    previousFieldSlateValueMap = {},
    previousFieldHtmlMap = {},
  ) => {
    const fieldDefinitions = collectRichFieldDefinitions(questionList);
    const fieldHtmlMap = {};
    const fieldMetaMap = {};
    const fieldSlateValueMap = {};

    for (const definition of fieldDefinitions) {
      const normalizedHtml = cleanupRichTextHtml(definition.html);
      fieldHtmlMap[definition.fieldId] = normalizedHtml;
      fieldSlateValueMap[definition.fieldId] =
        previousFieldHtmlMap[definition.fieldId] === normalizedHtml &&
        previousFieldSlateValueMap[definition.fieldId]
          ? previousFieldSlateValueMap[definition.fieldId]
          : htmlToSlate(normalizedHtml);
      fieldMetaMap[definition.fieldId] = definition.meta;
    }

    return {
      fieldHtmlMap,
      fieldMetaMap,
      fieldSlateValueMap,
    };
  };

  setQuestionList = (updater, extraState = {}) => {
    this.setState((previousState) => {
      const nextQuestionList =
        typeof updater === "function"
          ? updater(previousState.questionList)
          : updater;
      const nextEditorContext = this.buildEditorContext(
        nextQuestionList,
        previousState.fieldSlateValueMap,
        previousState.fieldHtmlMap,
      );
      const requestedActiveFieldId = Object.prototype.hasOwnProperty.call(
        extraState,
        "activeFieldId",
      )
        ? extraState.activeFieldId
        : previousState.activeFieldId;
      const nextActiveFieldId =
        requestedActiveFieldId &&
        nextEditorContext.fieldMetaMap[requestedActiveFieldId]
          ? requestedActiveFieldId
          : null;
      const nextActiveFieldMeta = nextActiveFieldId
        ? extraState.activeFieldMeta ||
          (nextActiveFieldId === previousState.activeFieldId
            ? previousState.activeFieldMeta
            : null)
        : null;
      const nextMountedRichFieldIdMap = Object.keys(
        previousState.mountedRichFieldIdMap || {},
      ).reduce((map, fieldId) => {
        if (nextEditorContext.fieldMetaMap[fieldId]) {
          map[fieldId] = true;
        }
        return map;
      }, {});

      if (nextActiveFieldId) {
        nextMountedRichFieldIdMap[nextActiveFieldId] = true;
      }

      return {
        ...extraState,
        ...nextEditorContext,
        activeFieldId: nextActiveFieldId,
        activeFieldMeta: nextActiveFieldMeta,
        mountedRichFieldIdMap: nextMountedRichFieldIdMap,
        questionList: nextQuestionList,
      };
    });
  };

  updateQuestion = (path, updater, extraState) => {
    this.setQuestionList(
      (questionList) => updateQuestionTree(questionList, path, updater),
      extraState,
    );
  };

  buildQuestionListWithRichHtml = (
    questionList = this.state.questionList,
    fieldSlateValueMap = this.state.fieldSlateValueMap,
    fieldMetaMap = this.state.fieldMetaMap,
  ) =>
    Object.keys(fieldSlateValueMap || {}).reduce(
      (nextQuestionList, fieldId) => {
        const fieldMeta = fieldMetaMap[fieldId];
        if (!fieldMeta) {
          return nextQuestionList;
        }

        return updateQuestionListRichField(
          nextQuestionList,
          fieldMeta,
          cleanupRichTextHtml(slateToHtml(fieldSlateValueMap[fieldId])),
        );
      },
      questionList,
    );

  changeGrade = (value) => {
    this.setState(
      {
        chapterTreeData: [],
        gradeValue: value,
        knowledgeTreeData: [],
        subjectValue: undefined,
      },
      () => {
        this.props.dispatch({
          type: "inputQuestion/getSubjectList",
          payload: {
            gradeId: value,
          },
        });
      },
    );
  };

  changeSubject = (value) => {
    this.setState(
      {
        subjectValue: value,
      },
      () => {
        const { gradeValue } = this.state;
        this.props.dispatch({
          type: "inputQuestion/getTree",
          payload: {
            gradeId: gradeValue,
            subjectId: value,
          },
          onSuccess: (content) => {
            const knowledgeTreeData = normalizeTreeData(content);
            this.setState({
              knowledgeTreeData,
            });
            this.setQuestionList((questionList) =>
              syncQuestionListMetaByTree(
                questionList,
                knowledgeTreeData,
                this.state.chapterTreeData,
              ),
            );
          },
        });
        this.props.dispatch({
          type: "inputQuestion/getChapter",
          payload: {
            gradeId: gradeValue,
            isSegmentation: true,
            subjectId: value,
          },
          onSuccess: (content) => {
            const chapterTreeData = normalizeTreeData(content);
            this.setState({
              chapterTreeData,
            });
            this.setQuestionList((questionList) =>
              syncQuestionListMetaByTree(
                questionList,
                this.state.knowledgeTreeData,
                chapterTreeData,
              ),
            );
          },
        });
      },
    );
  };

  handleJsonTextChange = (event) => {
    this.setState({
      jsonText: event.target.value,
    });
  };

  handleModelChange = (value) => {
    this.setState({
      selectedModel: value,
    });
  };

  triggerFileSelect = () => {
    if (this.fileInputRef.current) {
      this.fileInputRef.current.click();
    }
  };

  handleFileChange = (event) => {
    const file = event.target.files && event.target.files[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    const fileType = String(file.name || "")
      .split(".")
      .pop()
      .toLowerCase();

    this.setQuestionList([], {
      aiRawText: "",
      cleanedHtml: "",
      convertingHtml: true,
      importFileName: file.name || "",
      importFileType: fileType,
      jsonText: "",
      parsing: false,
      recognizingHtml: false,
    });

    convertImportFileToHtml(file)
      .then((cleanedHtml) => {
        this.setState(
          {
            cleanedHtml,
            convertingHtml: false,
          },
          () => {
            this.handleRecognizeHtml(cleanedHtml);
          },
        );
      })
      .catch((error) => {
        this.setState({
          convertingHtml: false,
          recognizingHtml: false,
        });
        message.error(
          error.message || trans("jsonInput.fileParseFailed", "文件解析失败"),
        );
      });
  };

  handleRecognizeHtml = (htmlOverride) => {
    const html =
      typeof htmlOverride === "string" ? htmlOverride : this.state.cleanedHtml;

    if (!cleanupRichTextHtml(html)) {
      message.info(
        trans("jsonInput.htmlEmpty", "请先上传文件并生成可识别的 HTML 内容"),
      );
      return;
    }

    if (!this.state.selectedModel) {
      message.info(
        this.state.modelListLoading
          ? trans("jsonInput.modelLoading", "模型列表加载中，请稍后重试")
          : trans("jsonInput.modelRequired", "请先选择模型"),
      );
      return;
    }

    this.setState({
      aiRawText: "",
      jsonText: "",
      recognizingHtml: true,
    });

    recognizeQuestionsFromHtml(html, this.state.selectedModel, {
      onText: (text) => {
        this.setState((previousState) => ({
          aiRawText: `${previousState.aiRawText || ""}${text}`,
        }));
      },
    })
      .then(({ jsonError, jsonText, rawText }) => {
        this.setState(
          {
            aiRawText: rawText,
            jsonText,
            recognizingHtml: false,
          },
          () => {
            if (jsonText && !jsonError) {
              this.handleParseJson(jsonText);
            }

            if (jsonError) {
              message.error(jsonError);
              return;
            }

            message.success(
              trans("jsonInput.aiSuccess", "题目识别完成，已自动解析结果"),
            );
          },
        );
      })
      .catch((error) => {
        this.setState({
          recognizingHtml: false,
        });
        message.error(
          error.message ||
            trans("jsonInput.aiFailed", "题目识别失败，请稍后重试"),
        );
      });
  };

  handleParseJson = (jsonOverride) => {
    const { chapterTreeData, knowledgeTreeData } = this.state;
    const jsonText =
      typeof jsonOverride === "string" ? jsonOverride : this.state.jsonText;

    if (!String(jsonText || "").trim()) {
      message.info(
        trans(
          "jsonInput.emptyJson",
          "请先上传文件完成识别，或在下方粘贴 JSON 内容",
        ),
      );
      return;
    }

    this.setState({
      parsing: true,
    });

    try {
      const questionList = syncQuestionListMetaByTree(
        parseJsonQuestions(jsonText),
        knowledgeTreeData,
        chapterTreeData,
      );
      this.setQuestionList(questionList, {
        parsing: false,
      });
      message.success(
        `${trans("jsonInput.parseSuccess", "JSON 解析成功")}，${trans(
          "jsonInput.questionCount",
          "当前题目数",
        )}: ${questionList.length}`,
      );
    } catch (error) {
      this.setState({
        parsing: false,
      });
      message.error(
        error.message || trans("jsonInput.parseFailed", "JSON 解析失败"),
      );
    }
  };

  handleFieldChange = (path, field, value) => {
    this.updateQuestion(path, (question) => {
      if (field === "questionLevel") {
        return {
          ...question,
          questionLevel: value,
          questionLevelName:
            value === 1
              ? trans("global.easy", "简单")
              : value === 3
                ? trans("global.difficult", "困难")
                : trans("global.general", "普通"),
        };
      }

      return {
        ...question,
        [field]: value,
      };
    });
  };

  handleQuestionTypeChange = (path, type) => {
    this.updateQuestion(path, (question) =>
      resetQuestionByType(question, type),
    );
  };

  handleRichFieldFocus = (fieldId, meta) => {
    this.setState((previousState) => {
      if (!previousState.fieldMetaMap[fieldId]) {
        return null;
      }

      return {
        activeFieldId: fieldId,
        activeFieldMeta: meta,
        mountedRichFieldIdMap: {
          ...previousState.mountedRichFieldIdMap,
          [fieldId]: true,
        },
      };
    });
  };

  handleRichFieldChange = (fieldId, nextSlateValue) => {
    this.setState((previousState) => {
      const fieldMeta = previousState.fieldMetaMap[fieldId];
      if (!fieldMeta) {
        return null;
      }

      return {
        fieldSlateValueMap: {
          ...previousState.fieldSlateValueMap,
          [fieldId]: nextSlateValue,
        },
      };
    });
  };

  handleOptionAnswerToggle = (path, optionKey, checked) => {
    this.updateQuestion(path, (question) => {
      let answer = String(question.answer || "");
      if (Number(question.type) === 1) {
        answer = checked ? optionKey : "";
      } else {
        const answerList = answer ? answer.split("") : [];
        if (checked && !answerList.includes(optionKey)) {
          answerList.push(optionKey);
        }
        answer = checked
          ? answerList.sort().join("")
          : answerList.filter((item) => item !== optionKey).join("");
      }

      return {
        ...question,
        answer,
      };
    });
  };

  handleAddOption = (path) => {
    this.updateQuestion(path, (question) => {
      const optionList = question.optionList || [];
      if (optionList.length >= 10) {
        message.info(
          trans("singleInput.optionMaxLength", "选项最多添加10个哦~"),
        );
        return question;
      }

      const optionKey = [..."ABCDEFGHIJKLMNOPQRSTUVWXYZ"][optionList.length];
      return {
        ...question,
        optionList: optionList.concat({
          answers: "",
          key: optionKey,
          knowledgeIds: [],
          uid: createUid(`option-${optionKey}`),
        }),
      };
    });
  };

  handleRemoveOption = (path, optionIndex) => {
    this.updateQuestion(path, (question) => {
      const optionList = (question.optionList || []).filter(
        (item, index) => index !== optionIndex,
      );
      const answer = String(question.answer || "")
        .split("")
        .filter((item) => optionList.some((option) => option.key === item))
        .join("");

      return {
        ...question,
        answer,
        optionList,
      };
    });
  };

  handleBlankOrderChange = (path, checked) => {
    this.updateQuestion(path, (question) => ({
      ...question,
      gapFillingAnswer: syncGapFillingAnswerDraft({
        ...question.gapFillingAnswer,
        isOrder: checked,
      }),
    }));
  };

  handleAddBlank = (path) => {
    this.updateQuestion(path, (question) => ({
      ...question,
      gapFillingAnswer: syncGapFillingAnswerDraft({
        ...question.gapFillingAnswer,
        answerGroups: (
          (question.gapFillingAnswer &&
            question.gapFillingAnswer.answerGroups) ||
          []
        ).concat(createGapAnswerGroup([""])),
      }),
    }));
  };

  handleRemoveBlank = (path, groupIndex) => {
    this.updateQuestion(path, (question) => {
      const answerGroups = (
        (question.gapFillingAnswer && question.gapFillingAnswer.answerGroups) ||
        []
      ).filter((item, index) => index !== groupIndex);

      return {
        ...question,
        gapFillingAnswer: syncGapFillingAnswerDraft({
          ...question.gapFillingAnswer,
          answerGroups:
            answerGroups.length > 0
              ? answerGroups
              : [createGapAnswerGroup([""])],
        }),
      };
    });
  };

  handleAddBlankAnswer = (path, groupIndex) => {
    this.updateQuestion(path, (question) => ({
      ...question,
      gapFillingAnswer: syncGapFillingAnswerDraft({
        ...question.gapFillingAnswer,
        answerGroups: (
          (question.gapFillingAnswer &&
            question.gapFillingAnswer.answerGroups) ||
          []
        ).map((group, index) =>
          index === groupIndex
            ? {
                ...group,
                answers: (group.answers || []).concat(createGapAnswerItem("")),
              }
            : group,
        ),
      }),
    }));
  };

  handleRemoveBlankAnswer = (path, groupIndex, answerIndex) => {
    this.updateQuestion(path, (question) => ({
      ...question,
      gapFillingAnswer: syncGapFillingAnswerDraft({
        ...question.gapFillingAnswer,
        answerGroups: (
          (question.gapFillingAnswer &&
            question.gapFillingAnswer.answerGroups) ||
          []
        ).map((group, index) => {
          if (index !== groupIndex) {
            return group;
          }

          const answers = (group.answers || []).filter(
            (item, childIndex) => childIndex !== answerIndex,
          );

          return {
            ...group,
            answers: answers.length > 0 ? answers : [createGapAnswerItem("")],
          };
        }),
      }),
    }));
  };

  handleAddQuestion = () => {
    this.setQuestionList((questionList) =>
      questionList.concat(createEmptyQuestion(1)),
    );
  };

  handleRemoveQuestion = (path) => {
    this.setQuestionList((questionList) =>
      removeQuestionTree(questionList, path),
    );
  };

  handleAddChildQuestion = (path) => {
    this.updateQuestion(path, (question) => ({
      ...question,
      sonQuestionList: (question.sonQuestionList || []).concat(
        createEmptyQuestion(1),
      ),
    }));
  };

  uploadRichImage = (file) => {
    return new Promise((resolve, reject) => {
      if (!file) {
        reject(new Error(trans("global.uploadFailed", "图片上传失败")));
        return;
      }

      const { dispatch } = this.props;
      const uploadTask = dispatch({
        type: "global/uploadFile",
        payload: file,
        onSuccess: (res) => {
          const fileUrl = res && res[0] && res[0].url;
          if (!fileUrl) {
            reject(new Error(trans("global.uploadFailed", "图片上传失败")));
            return;
          }

          const imageUrl = window.location.origin.includes("localhost")
            ? `https://task.daily.yungu-inc.org/${fileUrl}`
            : `${window.location.origin}${fileUrl}`;

          resolve(imageUrl);
        },
      });

      if (uploadTask && typeof uploadTask.catch === "function") {
        uploadTask.catch(reject);
      }
    });
  };

  handleSave = () => {
    const { dispatch } = this.props;
    const {
      fieldMetaMap,
      fieldSlateValueMap,
      gradeValue,
      questionList,
      saving,
      subjectValue,
    } = this.state;

    if (saving) {
      return;
    }

    if (!gradeValue || !subjectValue) {
      message.info(
        trans("jsonInput.missingGradeSubject", "请先选择年级和学科"),
      );
      return;
    }

    if (questionList.length === 0) {
      message.info(
        trans(
          "jsonInput.noQuestionToSave",
          "请先上传文件识别、解析 JSON，或手动添加题目",
        ),
      );
      return;
    }

    const questionListWithRichHtml = this.buildQuestionListWithRichHtml(
      questionList,
      fieldSlateValueMap,
      fieldMetaMap,
    );
    const validationMessage = validateQuestionList(questionListWithRichHtml);
    if (validationMessage) {
      message.info(validationMessage);
      return;
    }

    this.setState({
      saving: true,
    });

    dispatch({
      type: "inputQuestion/importQuestion",
      payload: buildBatchImportPayload({
        gradeId: gradeValue,
        questionList: questionListWithRichHtml,
        subjectId: subjectValue,
      }),
      onSuccess: (content) => {
        this.setState({
          saveResultVisible: true,
          saveSuccessCount: content && content.length > 0 ? content.length : 0,
        });
      },
    })
      .then(() => {
        this.setState({
          saving: false,
        });
      })
      .catch(() => {
        this.setState({
          saving: false,
        });
      });
  };

  render() {
    const { allGradeList, subjectList } = this.props;
    const {
      activeFieldId,
      aiRawText,
      chapterTreeData,
      cleanedHtml,
      convertingHtml,
      gradeValue,
      importFileName,
      importFileType,
      jsonText,
      knowledgeTreeData,
      modelList,
      modelListLoading,
      mountedRichFieldIdMap,
      parsing,
      questionList,
      recognizingHtml,
      saveResultVisible,
      saveSuccessCount,
      saving,
      selectedModel,
      subjectValue,
    } = this.state;

    return (
      <div className={styles.page}>
        <input
          ref={this.fileInputRef}
          type="file"
          accept={IMPORT_FILE_ACCEPT}
          style={{ display: "none" }}
          onChange={this.handleFileChange}
        />
        <div className={styles.header}>
          <div
            className={styles.back}
            onClick={() => {
              window.parent.postMessage("false", "*");
              this.props.history.go(-1);
            }}
          >
            <i className={`${icon.iconfont}`}>{"\uE786"}</i>
            <span className={styles.headerTitle}>
              {trans("jsonInput.pageTitle", "文件导题录题")}
            </span>
          </div>
          <div className={styles.headerActions}>
            <Button onClick={this.handleAddQuestion}>
              {trans("jsonInput.addQuestion", "新增题目")}
            </Button>
            <Button type="primary" loading={saving} onClick={this.handleSave}>
              {trans("batchInput.saveToExam", "保存到题库")}
            </Button>
          </div>
        </div>

        <div className={styles.content}>
          <div className={styles.pageWorkspace}>
            <div className={styles.leftSidebar}>
              <div className={styles.panel}>
                <div className={styles.panelTitle}>
                  {trans("jsonInput.basicInfo", "基础信息")}
                </div>
                <div className={styles.toolbar}>
                  <div className={styles.toolbarItem}>
                    <Select
                      value={gradeValue}
                      placeholder={trans("global.grade", "年级")}
                      style={{ width: "100%" }}
                      onChange={this.changeGrade}
                    >
                      {(allGradeList || []).map((item) => (
                        <Option value={item.gradeId} key={item.gradeId}>
                          {item.name}
                        </Option>
                      ))}
                    </Select>
                  </div>
                  <div className={styles.toolbarItem}>
                    <Select
                      value={subjectValue}
                      placeholder={trans("global.subject", "学科")}
                      style={{ width: "100%" }}
                      disabled={!gradeValue}
                      onChange={this.changeSubject}
                    >
                      {(subjectList || []).map((item) => (
                        <Option value={item.id} key={item.id}>
                          {item.name}
                        </Option>
                      ))}
                    </Select>
                  </div>
                  <div className={styles.toolbarItem}>
                    <Select
                      value={selectedModel}
                      placeholder={trans("jsonInput.model", "模型")}
                      style={{ width: "100%" }}
                      loading={modelListLoading}
                      onChange={this.handleModelChange}
                      dropdownMatchSelectWidth={false}
                    >
                      {(modelList || []).map((item) => (
                        <Option value={item.modelCode} key={item.modelCode}>
                          {item.modelName || item.modelCode}
                        </Option>
                      ))}
                    </Select>
                  </div>
                </div>
                <div className={styles.hintText}>
                  {trans(
                    "jsonInput.metaHint",
                    "先选年级和学科，章节/知识点树会自动匹配到已识别的名称。",
                  )}
                </div>
              </div>

              <div className={styles.panel}>
                <div className={styles.panelTitle}>
                  {trans("jsonInput.fileSource", "文件导入")}
                </div>
                <div className={styles.fileCard}>
                  <div className={styles.fileCardName}>
                    {importFileName ||
                      trans("jsonInput.filePlaceholder", "尚未选择导入文件")}
                  </div>
                  <div className={styles.fileCardMeta}>
                    <span>
                      {trans("jsonInput.fileType", "文件类型")}：
                      {importFileType || "--"}
                    </span>
                    <span>
                      {convertingHtml
                        ? trans("jsonInput.fileConverting", "正在解析文件")
                        : recognizingHtml
                          ? trans("jsonInput.aiRecognizing", "正在识别题目")
                          : cleanedHtml
                            ? trans("jsonInput.fileReady", "已生成 HTML")
                            : trans("jsonInput.waitUpload", "等待上传")}
                    </span>
                  </div>
                </div>
                <div className={styles.jsonActionRow}>
                  <div className={styles.jsonActionLeft}>
                    <Button onClick={this.triggerFileSelect}>
                      {trans("jsonInput.uploadFile", "上传文件")}
                    </Button>
                    <Button
                      type="primary"
                      disabled={!cleanedHtml}
                      loading={recognizingHtml}
                      onClick={() => this.handleRecognizeHtml()}
                    >
                      {trans("jsonInput.recognizeQuestions", "重新识别题目")}
                    </Button>
                  </div>
                  <div className={styles.summary}>
                    <span>
                      {trans("jsonInput.questionCount", "当前题目数")}：
                      {questionList.length}
                    </span>
                  </div>
                </div>
                <div className={styles.hintText}>
                  {trans(
                    "jsonInput.fileHint",
                    "支持上传 docx 或 pdf，系统会自动转成 HTML 并调用大模型识别题目结构。",
                  )}
                </div>
              </div>

              <div className={styles.panel}>
                <div className={styles.panelTitle}>
                  {trans("jsonInput.cleanedHtml", "清洗后 HTML")}
                </div>
                {cleanedHtml ? (
                  <>
                    <div
                      className={styles.htmlPreview}
                      dangerouslySetInnerHTML={{ __html: cleanedHtml }}
                    />
                    <div className={styles.subPanelTitle}>
                      {trans(
                        "jsonInput.cleanedHtmlString",
                        "清洗后 HTML 字符串",
                      )}
                    </div>
                    <TextArea
                      className={styles.htmlSourceArea}
                      value={cleanedHtml}
                      readOnly
                      autoSize={{ minRows: 8, maxRows: 16 }}
                    />
                  </>
                ) : (
                  <div className={styles.previewEmpty}>
                    {trans(
                      "jsonInput.cleanedHtmlEmpty",
                      "上传文件后，这里会展示清洗后的 HTML 预览。",
                    )}
                  </div>
                )}
              </div>

              <div className={styles.panel}>
                <div className={styles.panelTitle}>
                  {trans("jsonInput.aiRawResult", "AI 原始返回")}
                </div>
                <TextArea
                  className={styles.resultArea}
                  value={aiRawText}
                  readOnly
                  autoSize={{ minRows: 6, maxRows: 12 }}
                  placeholder={trans(
                    "jsonInput.aiRawPlaceholder",
                    "识别后，这里会展示大模型的原始返回内容。",
                  )}
                />
              </div>

              <div className={styles.panel}>
                <div className={styles.panelTitle}>
                  {trans("jsonInput.finalJson", "最终 JSON")}
                </div>
                <TextArea
                  className={styles.jsonArea}
                  value={jsonText}
                  onChange={this.handleJsonTextChange}
                  autoSize={{ minRows: 10, maxRows: 18 }}
                  placeholder={trans(
                    "jsonInput.jsonPlaceholder",
                    "识别后的 JSON 会展示在这里，你也可以手动修正后再解析。",
                  )}
                />
                <div className={styles.jsonActionRow}>
                  <div className={styles.jsonActionLeft}>
                    <Button
                      type="primary"
                      loading={parsing}
                      onClick={() => this.handleParseJson()}
                    >
                      {trans("jsonInput.parseJson", "解析题目")}
                    </Button>
                  </div>
                  <div className={styles.summary}>
                    <span>
                      {trans("jsonInput.jsonLength", "JSON 字符数")}：
                      {String(jsonText || "").length}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.rightEditor}>
              <div className={styles.panel}>
                <div className={styles.panelTitle}>
                  {trans("jsonInput.editorTitle", "题目编辑区")}
                </div>

                {questionList.length > 0 ? (
                  questionList.map((question, index) => (
                    <QuestionEditorCard
                      key={question.uid || `question-${index}`}
                      activeFieldId={activeFieldId}
                      allowRemove={questionList.length > 1}
                      chapterTreeData={chapterTreeData}
                      displayIndex={`${index + 1}`}
                      getFieldSlateValue={this.getFieldSlateValue}
                      knowledgeTreeData={knowledgeTreeData}
                      mountedRichFieldIdMap={mountedRichFieldIdMap}
                      onAddBlank={this.handleAddBlank}
                      onAddBlankAnswer={this.handleAddBlankAnswer}
                      onAddChildQuestion={this.handleAddChildQuestion}
                      onAddOption={this.handleAddOption}
                      onBlankOrderChange={this.handleBlankOrderChange}
                      onFieldChange={this.handleFieldChange}
                      onOptionAnswerToggle={this.handleOptionAnswerToggle}
                      onQuestionRemove={this.handleRemoveQuestion}
                      onQuestionTypeChange={this.handleQuestionTypeChange}
                      onRemoveBlank={this.handleRemoveBlank}
                      onRemoveBlankAnswer={this.handleRemoveBlankAnswer}
                      onRemoveOption={this.handleRemoveOption}
                      onRichFieldChange={this.handleRichFieldChange}
                      onRichFieldFocus={this.handleRichFieldFocus}
                      path={[index]}
                      question={question}
                      uploadImage={this.uploadRichImage}
                    />
                  ))
                ) : (
                  <div className={styles.emptyState}>
                    <Empty
                      description={trans(
                        "jsonInput.emptyEditor",
                        "还没有题目，先上传文件识别，或手动新增一题开始编辑。",
                      )}
                    />
                  </div>
                )}

                <div className={styles.footerActions}>
                  <div className={styles.hintText}>
                    {trans(
                      "jsonInput.footerHint",
                      "当前编辑器是新建的独立组件，不会复用原来的录题编辑器。",
                    )}
                  </div>
                  <Button
                    type="primary"
                    loading={saving}
                    onClick={this.handleSave}
                  >
                    {trans("batchInput.saveToExam", "保存到题库")}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <Modal
          footer={null}
          visible={saveResultVisible}
          onCancel={() => {
            this.setState({
              saveResultVisible: false,
            });
          }}
        >
          <div style={{ padding: "16px 0", textAlign: "center" }}>
            <div style={{ marginBottom: 12, fontSize: 18, fontWeight: 600 }}>
              {trans("batchInput.result", "录入结果")}
            </div>
            <div style={{ marginBottom: 20, color: "#50607a" }}>
              {trans("batchInput.importSuccess", "成功录入")}
              <span
                style={{ color: "#0445FC", fontWeight: 600, margin: "0 6px" }}
              >
                {saveSuccessCount}
              </span>
              {trans("import.stemNum", "道试题")}
            </div>
            <Button
              type="primary"
              onClick={() => {
                this.setState({
                  saveResultVisible: false,
                });
              }}
            >
              {trans("batchInput.continueImport", "继续录入")}
            </Button>
          </div>
        </Modal>
      </div>
    );
  }
}

export default connect(({ inputQuestion }) => ({
  allGradeList: inputQuestion.allGradeList,
  subjectList: inputQuestion.subjectList,
}))(JsonQuestionImport);
