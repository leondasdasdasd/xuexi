import type { ExamPaperEditDisabledReasonCode } from "../../services/examPaperV2.types";
import { trans } from "../../utils/i18n";
import { createPaperEditorDraftFromDetail } from "./paperEditorDetailModel";
import { loadPaperEditorDetailSource } from "./paperEditorService";
import type {
  GradeOption,
  PaperEditorDraft,
  PaperTypeOption,
  SubjectOption,
} from "./types";

export interface PaperDetailViewModel {
  draft: PaperEditorDraft;
  grades: GradeOption[];
  paperTypes: PaperTypeOption[];
  subjects: SubjectOption[];
  updateAllowed: boolean;
  updateDisabledReasonCode?: ExamPaperEditDisabledReasonCode;
}

export const getPaperEditDisabledMessage = (
  reasonCode?: ExamPaperEditDisabledReasonCode,
): string => {
  switch (reasonCode) {
    case "PAPER_CONTENT_FROZEN": {
      return trans(
        "paperEditor.contentFrozen",
        "该试卷内容已固化，当前不能直接编辑；如需调整，请复制试卷后编辑",
      );
    }
    case "PAPER_PERMISSION_REQUIRED": {
      return trans(
        "paperEditor.permissionRequired",
        "仅试卷创建人或拥有对应年级、学科管理权限的老师可编辑",
      );
    }
    case "ENROLLMENT_PAPER_PERMISSION_REQUIRED": {
      return trans(
        "paperEditor.enrollmentPermissionRequired",
        "仅试卷创建人或拥有招生试卷管理权限的老师可编辑",
      );
    }
    default: {
      return trans(
        "paperEditor.readOnlyPermission",
        "当前账号无试卷编辑权限，已切换为预览模式",
      );
    }
  }
};

/**
 * 将 V2 试卷详情及其选项数据统一映射为页面可消费的只读视图模型。
 * @param {number} paperId 试卷标识。
 * @param {string} locale 页面语言。
 * @returns {Promise<PaperDetailViewModel>} 详情页面唯一视图模型。
 */
export const loadPaperDetailViewModel = async (
  paperId: number,
  locale: string,
): Promise<PaperDetailViewModel> => {
  const source = await loadPaperEditorDetailSource(paperId);
  return {
    draft: createPaperEditorDraftFromDetail(
      source.detail,
      source.questionTypes,
      source.grades,
      source.subjects,
      locale,
    ),
    grades: source.grades,
    paperTypes: source.paperTypes,
    subjects: source.subjects,
    updateAllowed: source.detail.capabilities.update,
    updateDisabledReasonCode:
      source.detail.capabilities.updateDisabledReasonCode,
  };
};

/** 将详情边界错误转换为可展示文案，登录跳转保持静默。 */
export { getPaperEditorDisplayError as getPaperDetailDisplayError } from "./paperEditorService";
