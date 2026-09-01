import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";

import { PAPER_DETAIL_STATUS } from "../../paperDetailStatus";
import PaperDetailEditAction from ".";

describe("PaperDetailEditAction", () => {
  beforeEach(() => {
    Reflect.set(window, "globalLange", "zh-CN");
  });

  it("disables editing while the detail is loading", async () => {
    render(
      <PaperDetailEditAction
        onOpenPath={jest.fn()}
        paperId={99}
        status={PAPER_DETAIL_STATUS.loading}
      />,
    );

    const editButton = screen.getByRole("button", { name: "编辑试卷" });
    expect(editButton).toBeDisabled();
    fireEvent.mouseEnter(editButton.parentElement!);
    expect(
      await screen.findByText("试卷详情正在加载，请稍候"),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "试作" }),
    ).not.toBeInTheDocument();
  });

  it("keeps editing disabled with the compatibility fallback", async () => {
    render(
      <PaperDetailEditAction
        onOpenPath={jest.fn()}
        paperId={99}
        status={PAPER_DETAIL_STATUS.denied}
      />,
    );

    const editButton = screen.getByRole("button", { name: "编辑试卷" });
    expect(editButton).toBeDisabled();
    fireEvent.mouseEnter(editButton.parentElement!);
    expect(
      await screen.findByText("当前账号无试卷编辑权限，已切换为预览模式"),
    ).toBeInTheDocument();
  });

  it("explains the real reason for denied editing", async () => {
    render(
      <PaperDetailEditAction
        editDisabledReasonCode="PAPER_CONTENT_FROZEN"
        onOpenPath={jest.fn()}
        paperId={99}
        status={PAPER_DETAIL_STATUS.denied}
      />,
    );

    const editButton = screen.getByRole("button", { name: "编辑试卷" });
    fireEvent.mouseEnter(editButton.parentElement!);

    expect(
      await screen.findByText(
        "该试卷内容已固化，当前不能直接编辑；如需调整，请复制试卷后编辑",
      ),
    ).toBeInTheDocument();
  });

  it("opens the V2 editor when update is allowed", () => {
    const onOpenPath = jest.fn();
    render(
      <PaperDetailEditAction
        onOpenPath={onOpenPath}
        paperId={99}
        status={PAPER_DETAIL_STATUS.ready}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "编辑试卷" }));

    expect(onOpenPath).toHaveBeenCalledWith(
      "/paperEditor?mode=edit&paperId=99",
    );
  });
});
