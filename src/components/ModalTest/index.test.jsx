import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";

import ModalTest from "./index";

const createModalTestProps = (overrides = {}) => ({
  clickDotMatrixPen: jest.fn(),
  clickDownloadTestPaper: jest.fn(),
  clickLaunchOnline: jest.fn(),
  clickMachine: jest.fn(),
  clickTestPaperOnline: jest.fn(),
  isSegmentation: true,
  options: {
    onCancel: jest.fn(),
    visible: true,
  },
  ...overrides,
});

describe("ModalTest online exam availability", () => {
  beforeEach(() => {
    window.globalLange = "zh-CN";
  });

  it("disables only the online exam action while the paper is recognizing", () => {
    const clickLaunchOnline = jest.fn();
    const clickMachine = jest.fn();
    render(
      <ModalTest
        modalTestProps={createModalTestProps({
          clickLaunchOnline,
          clickMachine,
          onlineTestDisabled: true,
          onlineTestDisabledReason: "试卷识别中，暂不可发起线上测验",
        })}
      />,
    );

    const onlineButton = screen.getByRole("button", { name: "发起线上测验" });
    const machineButton = screen.getByRole("button", { name: "发起机阅测验" });

    expect(onlineButton).toBeDisabled();
    expect(
      screen.getByTitle("试卷识别中，暂不可发起线上测验"),
    ).toBeInTheDocument();
    fireEvent.click(onlineButton);
    fireEvent.click(machineButton);
    expect(clickLaunchOnline).not.toHaveBeenCalled();
    expect(clickMachine).toHaveBeenCalledTimes(1);
  });

  it("keeps the online exam action enabled for an available paper", () => {
    const clickLaunchOnline = jest.fn();
    render(
      <ModalTest
        modalTestProps={createModalTestProps({ clickLaunchOnline })}
      />,
    );

    const onlineButton = screen.getByRole("button", { name: "发起线上测验" });
    expect(onlineButton).toBeEnabled();
    fireEvent.click(onlineButton);
    expect(clickLaunchOnline).toHaveBeenCalledTimes(1);
  });
});
