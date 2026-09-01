import React from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";

import StageSubjectButton from "./stageSubjectBtn";

jest.mock("antd", () => ({
  Icon: ({ type }) => <span data-icon={type} />,
  Popover: ({ children, content, overlayClassName }) => (
    <div className={overlayClassName}>
      {children}
      <div data-testid="stage-subject-popover">{content}</div>
    </div>
  ),
}));

describe("StageSubjectButton", () => {
  const stageSubjects = [
    {
      stageId: 1,
      stageName: "小学",
      subjectList: [
        { id: 1, name: "语文" },
        { id: 2, name: "数学" },
      ],
    },
    {
      stageId: 2,
      stageName: "初中",
      subjectList: [{ id: 3, name: "英语" }],
    },
  ];

  it("keeps every stage and subject inside the scrollable popover boundary", () => {
    render(<StageSubjectButton stageSubjects={stageSubjects} />);

    const popover = screen.getByTestId("stage-subject-popover");
    const scrollContainer = popover.firstElementChild;

    expect(scrollContainer).toHaveClass("stage-subject-list");
    expect(within(scrollContainer).getByText("小学：")).toBeVisible();
    expect(within(scrollContainer).getByText("语文")).toBeVisible();
    expect(within(scrollContainer).getByText("初中：")).toBeVisible();
    expect(within(scrollContainer).getByText("英语")).toBeVisible();
  });

  it("emits the selected subject and its stage", () => {
    const onChange = jest.fn();

    render(
      <StageSubjectButton onChange={onChange} stageSubjects={stageSubjects} />,
    );

    fireEvent.click(screen.getByText("英语"));

    expect(onChange).toHaveBeenCalledWith(
      stageSubjects[1].subjectList[0],
      stageSubjects[1],
    );
  });

  it.each(["Enter", " "])(
    "supports selecting a subject with the %p key",
    (key) => {
      const onChange = jest.fn();

      render(
        <StageSubjectButton
          onChange={onChange}
          stageSubjects={stageSubjects}
        />,
      );

      const eventWasNotCancelled = fireEvent.keyDown(screen.getByText("英语"), {
        key,
      });

      expect(eventWasNotCancelled).toBe(false);
      expect(onChange).toHaveBeenCalledWith(
        stageSubjects[1].subjectList[0],
        stageSubjects[1],
      );
    },
  );
});
