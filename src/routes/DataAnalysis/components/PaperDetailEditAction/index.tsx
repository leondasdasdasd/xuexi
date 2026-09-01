import React from "react";
import { Tooltip } from "antd";

import { trans } from "../../../../utils/i18n";
import {
  getPaperEditDisabledMessage,
  type PaperDetailViewModel,
} from "../../../PaperEditor/paperDetail";
import { buildPaperEditorEditPath } from "../../../PaperEditor/paperEditorPageContext";
import {
  isValidPaperDetailId,
  PAPER_DETAIL_STATUS,
  type PaperDetailStatus,
} from "../../paperDetailStatus";

interface Props {
  className?: string;
  editDisabledReasonCode?: PaperDetailViewModel["updateDisabledReasonCode"];
  onOpenPath: (path: string) => void;
  paperId?: number | null;
  status: PaperDetailStatus;
}

/**
 * 渲染数据分析页顶部的 V2 编辑入口，并按详情能力控制可用状态。
 * @param {Props} properties 试卷标识、详情状态和路径打开边界。
 * @returns {React.ReactElement} 编辑试卷操作。
 */
function PaperDetailEditAction(properties: Props): React.ReactElement {
  const { className, editDisabledReasonCode, onOpenPath, paperId, status } =
    properties;
  const editAllowed =
    isValidPaperDetailId(paperId) && status === PAPER_DETAIL_STATUS.ready;
  const actionTip =
    status === PAPER_DETAIL_STATUS.loading
      ? trans("dataAnalysis.paperDetailLoading", "试卷详情正在加载，请稍候")
      : trans(
          "dataAnalysis.paperDetailUnavailable",
          "试卷详情暂不可用，请在测验预览中重试",
        );
  const openEditor = () => {
    if (isValidPaperDetailId(paperId)) {
      onOpenPath(buildPaperEditorEditPath(paperId));
    }
  };

  return (
    <Tooltip
      title={
        editAllowed
          ? undefined
          : status === PAPER_DETAIL_STATUS.denied
            ? getPaperEditDisabledMessage(editDisabledReasonCode)
            : actionTip
      }
    >
      <span>
        <button
          className={className}
          disabled={!editAllowed}
          type="button"
          onClick={openEditor}
        >
          {trans("global.editPaper", "编辑试卷")}
        </button>
      </span>
    </Tooltip>
  );
}

export default PaperDetailEditAction;
