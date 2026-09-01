import React, { useEffect, useMemo, useState } from "react";
import { Button, Input, message, Select, Spin, Switch } from "antd";

import {
  queryExamPaperOcrLlmConfigs,
  saveExamPaperOcrLlmConfig,
} from "../../services/examPaperOcrLlmConfig";
import { getSubjectList } from "../../services/inputQuestion";
import { formatDateTime, trans } from "../../utils/i18n";

import styles from "./index.module.less";

const { Option } = Select;
const { TextArea } = Input;
const DEFAULT_BUSINESS_TYPE = "general";
const DEFAULT_STAGE = "general";
const SERVICE_DEFAULT_PROMPT = JSON.parse("null");
const TEXTAREA_ROWS = Number("12");
const FIELD_LABEL_CLASS = styles["field-label"];

export const BUSINESS_TYPE_OPTIONS = [
  {
    descriptionKey: "examPaperOcrLlmConfig.businessGeneralHint",
    descriptionText: "没有专门业务配置时，识别服务会使用这组通用配置。",
    labelKey: "examPaperOcrLlmConfig.businessGeneral",
    labelText: "通用",
    value: "general",
  },
  {
    descriptionKey: "examPaperOcrLlmConfig.businessQuestionExtractionHint",
    descriptionText: "用于整卷 OCR 中的题目结构、题干和小题信息提取。",
    labelKey: "examPaperOcrLlmConfig.businessQuestionExtraction",
    labelText: "题目提取",
    value: "question_extraction",
  },
  {
    descriptionKey: "examPaperOcrLlmConfig.businessAnswerExtractionHint",
    descriptionText: "用于整卷 OCR 中的答案、解析和评分点提取。",
    labelKey: "examPaperOcrLlmConfig.businessAnswerExtraction",
    labelText: "答案提取",
    value: "answer_extraction",
  },
];

const SCHOOL_STAGE_OPTIONS = [
  {
    labelKey: "examPaperOcrLlmConfig.stageGeneral",
    labelText: "通用",
    value: "general",
  },
  {
    labelKey: "examPaperOcrLlmConfig.stagePrimary",
    labelText: "小学",
    value: "primary",
  },
  {
    labelKey: "examPaperOcrLlmConfig.stageJuniorHigh",
    labelText: "初中",
    value: "junior_high",
  },
  {
    labelKey: "examPaperOcrLlmConfig.stageSeniorHigh",
    labelText: "高中",
    value: "senior_high",
  },
];

const createEmptyForm = (businessType = DEFAULT_BUSINESS_TYPE) => ({
  businessType,
  enableThinking: false,
  prompt: "",
  schoolStage: DEFAULT_STAGE,
  subjectId: undefined,
});

const getResponseContent = (response) => {
  if (response && response.status) {
    return response.content;
  }

  const error = new Error(
    (response && response.message) ||
      trans("examPaperOcrLlmConfig.requestFailed", "请求失败"),
  );

  new Function("error", "throw error")(error);
};

const normalizeSubjectOption = (item) => ({
  label: item.name || item.subjectName || item.label || String(item.id),
  value: item.id || item.subjectId || item.value,
});

const normalizeSubjects = (content) =>
  (Array.isArray(content) ? content : [])
    .map((item) => normalizeSubjectOption(item))
    .filter((item) => item.value);

export const getConfigKey = (config) =>
  `${config && config.businessType}_${config && config.subjectId}_${
    config && config.schoolStage
  }`;

export const promptToPayloadValue = (prompt) => {
  const value = typeof prompt === "string" ? prompt : "";

  return value.trim() ? value : SERVICE_DEFAULT_PROMPT;
};

const getPrompt = (config) =>
  typeof (config && config.prompt) === "string" ? config.prompt : "";

export const configToForm = (config) => {
  const normalizedConfig = config || {};

  return {
    businessType: normalizedConfig.businessType || DEFAULT_BUSINESS_TYPE,
    enableThinking: Boolean(normalizedConfig.enableThinking),
    prompt: getPrompt(normalizedConfig),
    schoolStage: normalizedConfig.schoolStage || DEFAULT_STAGE,
    subjectId: normalizedConfig.subjectId,
  };
};

export const formToPayload = (form) => ({
  businessType: form.businessType,
  enableThinking: Boolean(form.enableThinking),
  prompt: promptToPayloadValue(form.prompt),
  schoolStage: form.schoolStage,
  subjectId: form.subjectId,
});

const upsertConfig = (configs, nextConfig) => {
  const nextKey = getConfigKey(nextConfig);
  const exists = configs.some((config) => getConfigKey(config) === nextKey);

  if (!exists) {
    return [nextConfig, ...configs];
  }

  return configs.map((config) =>
    getConfigKey(config) === nextKey ? nextConfig : config,
  );
};

const findConfigByForm = (configs, form) =>
  configs.find(
    (config) =>
      config.businessType === form.businessType &&
      config.subjectId === form.subjectId &&
      config.schoolStage === form.schoolStage,
  );

const getBusinessOption = (businessType) =>
  BUSINESS_TYPE_OPTIONS.find((item) => item.value === businessType) ||
  BUSINESS_TYPE_OPTIONS[0];

const getBusinessLabel = (businessType) => {
  const option = getBusinessOption(businessType);

  return trans(option.labelKey, option.labelText);
};

const getBusinessDescription = (businessType) => {
  const option = getBusinessOption(businessType);

  return trans(option.descriptionKey, option.descriptionText);
};

const getStageLabel = (schoolStage) => {
  const option = SCHOOL_STAGE_OPTIONS.find(
    (item) => item.value === schoolStage,
  );

  return option
    ? trans(option.labelKey, option.labelText)
    : trans("examPaperOcrLlmConfig.unknownStage", "未知学段");
};

const getSubjectLabel = (subjectOptions, subjectId) => {
  const option = subjectOptions.find((item) => item.value === subjectId);

  return option
    ? option.label
    : trans("examPaperOcrLlmConfig.unknownSubject", "未知学科");
};

const formatUpdateTime = (updatedAt) =>
  updatedAt
    ? formatDateTime(new Date(updatedAt))
    : trans("examPaperOcrLlmConfig.noUpdateTime", "暂无更新时间");

const renderConfigMeta = (config) =>
  `${getStageLabel(config.schoolStage)} · ${formatUpdateTime(config.updatedAt)}`;

const groupConfigsByBusiness = (configs) =>
  BUSINESS_TYPE_OPTIONS.map((business) => ({
    ...business,
    configs: configs.filter((config) => config.businessType === business.value),
  }));

/**
 * 整卷 OCR LLM 配置页。
 * @param {object} properties React 路由注入参数。
 * @returns {React.ReactElement} 配置页。
 */
function ExamPaperOcrLlmConfig(properties) {
  void properties;

  const [configs, setConfigs] = useState([]);
  const [form, setForm] = useState(createEmptyForm);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedKey, setSelectedKey] = useState("");
  const [subjectOptions, setSubjectOptions] = useState([]);

  const groupedConfigs = useMemo(
    (event) => {
      void event;

      return groupConfigsByBusiness(configs);
    },
    [configs],
  );

  const selectedConfig = useMemo(
    (event) => {
      void event;

      return configs.find((config) => getConfigKey(config) === selectedKey);
    },
    [configs, selectedKey],
  );

  const loadPageData = async (event) => {
    void event;

    setLoading(true);

    try {
      const subjectResponse = await getSubjectList();
      const configResponse = await queryExamPaperOcrLlmConfigs();
      const nextSubjects = normalizeSubjects(
        getResponseContent(subjectResponse),
      );
      const nextConfigs = getResponseContent(configResponse) || [];

      setSubjectOptions(nextSubjects);
      setConfigs(Array.isArray(nextConfigs) ? nextConfigs : []);

      if (Array.isArray(nextConfigs) && nextConfigs.length > 0) {
        setSelectedKey(getConfigKey(nextConfigs[0]));
        setForm(configToForm(nextConfigs[0]));
      }
    } catch (error) {
      message.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect((event) => {
    void event;

    void loadPageData();
  }, []);

  const updateForm = (key, value) => {
    const nextForm = {
      ...form,
      [key]: value,
    };
    const matchedConfig = findConfigByForm(configs, nextForm);

    setForm(nextForm);
    setSelectedKey(matchedConfig ? getConfigKey(matchedConfig) : "");
  };

  const resetForm = (businessType = DEFAULT_BUSINESS_TYPE) => {
    setForm(createEmptyForm(businessType));
    setSelectedKey("");
  };

  const selectConfig = (config) => {
    setSelectedKey(getConfigKey(config));
    setForm(configToForm(config));
  };

  const validateForm = (event) => {
    void event;

    if (!form.businessType) {
      message.error(
        trans("examPaperOcrLlmConfig.businessRequired", "请先选择业务场景"),
      );
      return false;
    }

    if (!form.subjectId) {
      message.error(
        trans("examPaperOcrLlmConfig.subjectRequired", "请先选择学科"),
      );
      return false;
    }

    if (!form.schoolStage) {
      message.error(
        trans("examPaperOcrLlmConfig.stageRequired", "请先选择学段"),
      );
      return false;
    }

    return true;
  };

  const saveForm = async (event) => {
    void event;

    if (!validateForm()) {
      return;
    }

    setSaving(true);

    try {
      // 前端统一把空白提示词转成 null，表示回退识别服务默认提示词。
      const content = getResponseContent(
        await saveExamPaperOcrLlmConfig(formToPayload(form)),
      );

      setConfigs((previousConfigs) => upsertConfig(previousConfigs, content));
      setSelectedKey(getConfigKey(content));
      setForm(configToForm(content));
      message.success(trans("examPaperOcrLlmConfig.saveSuccess", "配置已保存"));
    } catch (error) {
      message.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles["header-text"]}>
          <h1 className={styles.title}>
            {trans("examPaperOcrLlmConfig.title", "整卷 OCR LLM 配置")}
          </h1>
          <p className={styles.description}>
            {trans(
              "examPaperOcrLlmConfig.description",
              "按业务场景、学科和学段管理整卷 OCR LLM 的提示词与 thinking 开关。",
            )}
          </p>
        </div>
        <Button
          aria-label={trans("examPaperOcrLlmConfig.refresh", "刷新")}
          disabled={loading}
          icon="reload"
          onClick={loadPageData}
        >
          {trans("examPaperOcrLlmConfig.refresh", "刷新")}
        </Button>
      </div>

      <Spin spinning={loading}>
        <div className={styles.layout}>
          <aside className={styles["list-panel"]}>
            <div className={styles["panel-header"]}>
              <h2 className={styles["panel-title"]}>
                {trans("examPaperOcrLlmConfig.configList", "配置列表")}
              </h2>
              <Button
                aria-label={trans("examPaperOcrLlmConfig.newConfig", "新增")}
                icon="plus"
                onClick={(event) => {
                  void event;
                  resetForm();
                }}
                size="small"
              >
                {trans("examPaperOcrLlmConfig.newConfig", "新增")}
              </Button>
            </div>
            <div className={styles["config-list"]}>
              {groupedConfigs.map((group) => (
                <section className={styles["business-group"]} key={group.value}>
                  <div className={styles["business-group-header"]}>
                    <span className={styles["business-title"]}>
                      {trans(group.labelKey, group.labelText)}
                    </span>
                    <Button
                      aria-label={trans(
                        "examPaperOcrLlmConfig.newBusinessConfig",
                        "新增此业务配置",
                      )}
                      icon="plus"
                      onClick={(event) => {
                        void event;
                        resetForm(group.value);
                      }}
                      size="small"
                      type="link"
                    />
                  </div>
                  {group.configs.length > 0 ? (
                    group.configs.map((config) => (
                      <button
                        className={[
                          styles["config-item"],
                          selectedKey === getConfigKey(config)
                            ? styles["config-item-active"]
                            : "",
                        ].join(" ")}
                        key={getConfigKey(config)}
                        onClick={(event) => {
                          void event;
                          selectConfig(config);
                        }}
                        type="button"
                      >
                        <span className={styles["config-name"]}>
                          {getSubjectLabel(subjectOptions, config.subjectId)}
                        </span>
                        <span className={styles["config-meta"]}>
                          {renderConfigMeta(config)}
                        </span>
                      </button>
                    ))
                  ) : (
                    <div className={styles["business-empty"]}>
                      {trans(
                        "examPaperOcrLlmConfig.emptyBusiness",
                        "该业务暂无配置",
                      )}
                    </div>
                  )}
                </section>
              ))}
            </div>
          </aside>

          <main className={styles["form-panel"]}>
            <div className={styles["panel-header"]}>
              <h2 className={styles["panel-title"]}>
                {selectedConfig
                  ? trans("examPaperOcrLlmConfig.editConfig", "编辑配置")
                  : trans("examPaperOcrLlmConfig.createConfig", "新增配置")}
              </h2>
            </div>

            <div className={styles["form-body"]}>
              <div className={styles["form-grid"]}>
                <label>
                  <span className={FIELD_LABEL_CLASS}>
                    {trans("examPaperOcrLlmConfig.businessScene", "业务场景")}
                  </span>
                  <Select
                    onChange={(value) => updateForm("businessType", value)}
                    style={{ width: "100%" }}
                    value={form.businessType}
                  >
                    {BUSINESS_TYPE_OPTIONS.map((business) => (
                      <Option key={business.value} value={business.value}>
                        {trans(business.labelKey, business.labelText)}
                      </Option>
                    ))}
                  </Select>
                </label>

                <label>
                  <span className={FIELD_LABEL_CLASS}>
                    {trans("global.subject", "学科")}
                  </span>
                  <Select
                    allowClear
                    onChange={(value) => updateForm("subjectId", value)}
                    placeholder={trans(
                      "examPaperOcrLlmConfig.subjectPlaceholder",
                      "请选择学科",
                    )}
                    style={{ width: "100%" }}
                    value={form.subjectId}
                  >
                    {subjectOptions.map((subject) => (
                      <Option key={subject.value} value={subject.value}>
                        {subject.label}
                      </Option>
                    ))}
                  </Select>
                </label>

                <label>
                  <span className={FIELD_LABEL_CLASS}>
                    {trans("global.stage", "学段")}
                  </span>
                  <Select
                    onChange={(value) => updateForm("schoolStage", value)}
                    style={{ width: "100%" }}
                    value={form.schoolStage}
                  >
                    {SCHOOL_STAGE_OPTIONS.map((stage) => (
                      <Option key={stage.value} value={stage.value}>
                        {trans(stage.labelKey, stage.labelText)}
                      </Option>
                    ))}
                  </Select>
                </label>
              </div>

              <section className={styles.section}>
                <div className={styles["section-header"]}>
                  <div>
                    <h3 className={styles["section-title"]}>
                      {getBusinessLabel(form.businessType)}
                    </h3>
                    <p className={styles["section-hint"]}>
                      {getBusinessDescription(form.businessType)}
                    </p>
                  </div>
                  <label className={styles["thinking-switch"]}>
                    <span>
                      {trans(
                        "examPaperOcrLlmConfig.enableThinking",
                        "开启 thinking",
                      )}
                    </span>
                    <Switch
                      checked={form.enableThinking}
                      onChange={(checked) =>
                        updateForm("enableThinking", checked)
                      }
                    />
                  </label>
                </div>
                <p className={styles["section-hint"]}>
                  {trans(
                    "examPaperOcrLlmConfig.promptDefaultHint",
                    "提示词留空时保存为服务默认值。",
                  )}
                </p>
                <TextArea
                  className={styles.textarea}
                  onChange={(event) => updateForm("prompt", event.target.value)}
                  placeholder={trans(
                    "examPaperOcrLlmConfig.promptPlaceholder",
                    "输入当前业务的自定义提示词；留空则使用识别服务默认提示词。",
                  )}
                  rows={TEXTAREA_ROWS}
                  value={form.prompt}
                />
              </section>
            </div>

            <div className={styles.footer}>
              <Button
                aria-label={trans("global.cancel", "取消")}
                onClick={(event) => {
                  void event;
                  resetForm();
                }}
              >
                {trans("global.cancel", "取消")}
              </Button>
              <Button
                aria-label={trans("global.save", "保存")}
                loading={saving}
                onClick={saveForm}
                type="primary"
              >
                {trans("global.save", "保存")}
              </Button>
            </div>
          </main>
        </div>
      </Spin>
    </div>
  );
}

export default ExamPaperOcrLlmConfig;
