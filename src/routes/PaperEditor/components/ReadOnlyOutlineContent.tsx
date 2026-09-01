import React, { useMemo } from "react";

import PaperStructureNavigation from "../../../common/PaperStructureNavigation";
import { getPaperQuestionElementId } from "../paperEditorDomIds";
import { mapPaperEditorDraftToStructureNavigation } from "../paperStructureNavigationMapper";
import type { PaperEditorDraft } from "../types";

interface Props {
  draft: PaperEditorDraft;
  onNavigate: (elementId: string) => void;
}

/**
 * 渲染仅承担定位职责的只读试卷目录。
 * @param {Props} root0 只读目录属性。
 * @param {PaperEditorDraft} root0.draft 试卷草稿。
 * @param {(elementId: string) => void} root0.onNavigate 定位回调。
 * @returns {React.ReactElement} 只读试卷目录。
 */
function ReadOnlyOutlineContent({
  draft,
  onNavigate,
}: Props): React.ReactElement {
  const modules = useMemo(
    () => mapPaperEditorDraftToStructureNavigation(draft),
    [draft],
  );
  return (
    <div data-testid="readonly-outline">
      <PaperStructureNavigation
        modules={modules}
        onQuestionSelect={(question) =>
          onNavigate(getPaperQuestionElementId(question.key))
        }
      />
    </div>
  );
}

export default ReadOnlyOutlineContent;
