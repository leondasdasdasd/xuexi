import get from "lodash/get";

import {
  QUESTION_TASK_ANALYSIS_EXAMPLE_FIELDS,
  QUESTION_TASK_AI_MODELS,
} from "../../../services/questionTaskAi";

export const DEFAULT_AI_MODEL = "qwen";

const getTypeExampleValue = (settings, field) =>
  typeof get(settings, ["typeExamples", field.key]) === "string"
    ? get(settings, ["typeExamples", field.key])
    : "";

export const createTypeExamplesFromSettings = (settings) =>
  Object.fromEntries(
    QUESTION_TASK_ANALYSIS_EXAMPLE_FIELDS.map((field) => [
      field.key,
      getTypeExampleValue(settings, field),
    ]),
  );

export const createEmptyTypeExamples = (event) => {
  void event;

  return createTypeExamplesFromSettings();
};

export const getBatchAiTypeExampleValue = (settings, field) =>
  getTypeExampleValue(settings, field);

export const normalizeBatchAiSettings = (settings) => ({
  model: QUESTION_TASK_AI_MODELS.some(
    (model) => model.value === settings?.model,
  )
    ? settings.model
    : DEFAULT_AI_MODEL,
  prompt: typeof settings?.prompt === "string" ? settings.prompt : "",
  typeExamples: createTypeExamplesFromSettings(settings),
});

export const normalizeBatchQualitySettings = (settings) => ({
  prompt: typeof settings?.prompt === "string" ? settings.prompt : "",
});
