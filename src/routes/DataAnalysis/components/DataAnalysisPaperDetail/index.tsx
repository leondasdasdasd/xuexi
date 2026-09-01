import React, { useEffect, useLayoutEffect, useState } from "react";
import { Alert, Button, Empty, Spin } from "antd";

import TeacherPaperTrialQrCodeModal from "../../../../common/TeacherPaperTrialQrCodeModal";
import { locale, trans } from "../../../../utils/i18n";
import {
  getPaperDetailDisplayError,
  loadPaperDetailViewModel,
  type PaperDetailViewModel,
  ReadOnlyPaperDetailContent,
} from "../../../PaperEditor/paperDetail";
import {
  isValidPaperDetailId,
  PAPER_DETAIL_STATUS,
  type PaperDetailStatus,
} from "../../paperDetailStatus";

import styles from "./index.module.less";

export type { PaperDetailStatus } from "../../paperDetailStatus";
export { PAPER_DETAIL_STATUS } from "../../paperDetailStatus";

interface Props {
  onSourceChange?: (source: PaperDetailViewModel | null) => void;
  onStatusChange: (status: PaperDetailStatus) => void;
  onTrial: (paperId: number) => void;
  paperId?: number | null;
  visible: boolean;
}

const getPaperDetailLocale = (): "en-US" | "zh-CN" =>
  locale() === "en" ? "en-US" : "zh-CN";
const paperDetailStateClassName = styles["paper-detail-state"];

interface PaperDetailLoadState {
  error: string;
  loading: boolean;
  paperId?: number | null;
  viewModel: PaperDetailViewModel | null;
}

const createLoadingState = (paperId?: number | null): PaperDetailLoadState => ({
  error: "",
  loading: true,
  paperId,
  viewModel: null,
});

/**
 * 为数据分析页加载并渲染 V2 试卷详情，向外层仅暴露操作所需的语义状态。
 * @param {Props} properties 试卷标识、显示状态与能力状态回调。
 * @returns {React.ReactElement|null} 数据分析页内的试卷详情。
 */
function DataAnalysisPaperDetail(properties: Props): React.ReactElement | null {
  const { onSourceChange, onStatusChange, onTrial, paperId, visible } =
    properties;
  const [loadState, setLoadState] = useState<PaperDetailLoadState>(() =>
    createLoadingState(paperId),
  );
  const [retryVersion, setRetryVersion] = useState(0);
  const [ipadTrialPaperId, setIpadTrialPaperId] = useState<number>();
  const paperLocale = getPaperDetailLocale();
  const currentLoadState =
    loadState.paperId === paperId ? loadState : createLoadingState(paperId);

  // paperId 变化时在浏览器绘制前收回旧权限和二维码，避免新试卷短暂沿用旧能力。
  useLayoutEffect(() => {
    setIpadTrialPaperId(void 0);
    onStatusChange(PAPER_DETAIL_STATUS.loading);
  }, [onStatusChange, paperId]);

  // 离开试卷预览时立即收回弹窗状态，返回同一试卷不能恢复旧二维码。
  useLayoutEffect(() => {
    if (!visible) setIpadTrialPaperId(void 0);
  }, [visible]);

  useEffect(() => {
    setLoadState(createLoadingState(paperId));
    onSourceChange?.(null);
    onStatusChange(PAPER_DETAIL_STATUS.loading);

    if (!isValidPaperDetailId(paperId)) {
      setLoadState({
        error: trans(
          "dataAnalysis.paperDetailInvalid",
          "当前测验缺少有效试卷，无法加载详情",
        ),
        loading: false,
        paperId,
        viewModel: null,
      });
      onStatusChange(PAPER_DETAIL_STATUS.error);
      return;
    }

    let active = true;
    const load = async () => {
      try {
        const result = await loadPaperDetailViewModel(paperId, paperLocale);
        if (!active) return;
        setLoadState({
          error: "",
          loading: false,
          paperId,
          viewModel: result,
        });
        onSourceChange?.(result);
        onStatusChange(
          result.updateAllowed
            ? PAPER_DETAIL_STATUS.ready
            : PAPER_DETAIL_STATUS.denied,
        );
      } catch (error) {
        if (!active) return;
        const displayError = getPaperDetailDisplayError(
          error,
          trans("paperEditor.loadFailed", "试卷加载失败"),
        );
        setLoadState({
          error: displayError || "",
          loading: false,
          paperId,
          viewModel: null,
        });
        onSourceChange?.(null);
        onStatusChange(PAPER_DETAIL_STATUS.error);
      }
    };
    void load();
    return () => {
      active = false;
    };
  }, [onSourceChange, onStatusChange, paperId, paperLocale, retryVersion]);

  if (!visible) return null;
  if (!isValidPaperDetailId(paperId)) {
    return (
      <div className={paperDetailStateClassName}>
        <Empty
          description={trans(
            "dataAnalysis.paperDetailInvalid",
            "当前测验缺少有效试卷，无法加载详情",
          )}
        />
      </div>
    );
  }
  if (currentLoadState.loading) {
    return (
      <div className={paperDetailStateClassName}>
        <Spin tip={trans("paperEditor.loading", "正在加载试卷")} />
      </div>
    );
  }
  if (currentLoadState.error || !currentLoadState.viewModel) {
    return (
      <div className={paperDetailStateClassName}>
        <Alert message={currentLoadState.error} showIcon type="error" />
        <Button
          onClick={() => {
            setLoadState(createLoadingState(paperId));
            onStatusChange(PAPER_DETAIL_STATUS.loading);
            setRetryVersion((version) => version + 1);
          }}
        >
          {trans("dataAnalysis.paperDetailRetry", "重试")}
        </Button>
      </div>
    );
  }
  return (
    <>
      <ReadOnlyPaperDetailContent
        className={styles["paper-detail-content"]}
        draft={currentLoadState.viewModel.draft}
        locale={paperLocale}
        onIpadTrial={() => setIpadTrialPaperId(paperId)}
        onTrial={() => onTrial(paperId)}
        paperTypes={currentLoadState.viewModel.paperTypes}
      />
      <TeacherPaperTrialQrCodeModal
        onClose={() => setIpadTrialPaperId(void 0)}
        paperId={ipadTrialPaperId}
      />
    </>
  );
}

export default DataAnalysisPaperDetail;
