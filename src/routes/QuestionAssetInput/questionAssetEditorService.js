import { queryEnabledBusinessQuestionTypesV2 } from "../../services/businessQuestionTypeV2";
import { richerUploadFile } from "../../services/global";
import {
  createQuestionV2Resource,
  queryQuestionV2Resource,
  updateQuestionV2Resource,
} from "../../services/questionV2";
import { trans } from "../../utils/i18n";
import { getStageIdByGradeId } from "../../utils/teachingContextAdapter";
import { loginRedirect } from "../../utils/utils";
import {
  createQuestionAssetEditorStateFromV2Aggregate,
  createQuestionAssetV2CreateRequest,
  createQuestionAssetV2UpdateRequest,
} from "./questionAssetContentAdapter";

export const requireQuestionAssetResponse = (response) => {
  if (!response?.ifLogin && response?.ifLogin !== undefined) {
    loginRedirect();
    throw new Error(trans("global.loginTimeout", "登录已过期"));
  }
  if (!response?.status) {
    throw new Error(response?.message || trans("global.failed", "操作失败"));
  }
  return response.content;
};

export const uploadQuestionAssetImage = async (file) => {
  const content = requireQuestionAssetResponse(await richerUploadFile(file));
  const url = content?.[0]?.url;
  if (!url) throw new Error(trans("global.uploadFailed", "图片上传失败"));
  return `${window.location.origin}${url}`;
};

export const queryQuestionAssetTypes = async ({ stageId, subjectId }) => {
  if (!stageId || !subjectId) {
    throw new Error(
      trans("questionAssetInput.noQuestionType", "暂无可用题型，暂无法保存"),
    );
  }
  return requireQuestionAssetResponse(
    await queryEnabledBusinessQuestionTypesV2({ stageId, subjectId }),
  );
};

export const loadQuestionAssetEditState = async (questionId, allGradeList) => {
  const aggregate = requireQuestionAssetResponse(
    await queryQuestionV2Resource(questionId),
  );
  const stageId = getStageIdByGradeId(
    allGradeList,
    aggregate.resource?.gradeId,
  );
  const questionTypes = await queryQuestionAssetTypes({
    stageId,
    subjectId: aggregate.resource?.subjectId,
  });
  const editorState = createQuestionAssetEditorStateFromV2Aggregate(
    aggregate,
    questionTypes,
  );
  if (!editorState) {
    throw new Error(
      trans("questionAssetInput.noQuestionType", "暂无可用题型，暂无法保存"),
    );
  }
  return editorState;
};

export const saveQuestionAsset = async ({
  draft,
  questionId,
  questionTypes,
  resource,
}) => {
  const payload = questionId
    ? createQuestionAssetV2UpdateRequest({ draft, questionTypes, resource })
    : createQuestionAssetV2CreateRequest({ draft, questionTypes, resource });
  const content = requireQuestionAssetResponse(
    questionId
      ? await updateQuestionV2Resource(questionId, payload)
      : await createQuestionV2Resource(payload),
  );
  const savedId = Number(questionId || content?.id);
  if (!Number.isInteger(savedId) || savedId <= 0) {
    throw new Error(
      trans("questionAssetInput.questionIdMissing", "题目 ID 缺失"),
    );
  }
  return savedId;
};

export const querySavedQuestionAsset = async (questionId) =>
  requireQuestionAssetResponse(await queryQuestionV2Resource(questionId));
