import { fireEvent, render, screen } from "@testing-library/react";
import { message } from "antd";
import React from "react";

import {
  AnalysisDimensionImportModalBase,
  buildImportErrorRows,
  buildImportedFileList,
  buildUploadFileState,
  IMPORT_MODE,
} from "./index";

const createComponent = (properties = {}) => {
  const component = new AnalysisDimensionImportModalBase({
    attainmentTest: null,
    dispatch: jest.fn(() => Promise.resolve()),
    examId: 10_798,
    modifyAnalysisDimension: null,
    paperId: 9879,
    ...properties,
  });

  component.setState = (nextState, callback) => {
    component.state = {
      ...component.state,
      ...(typeof nextState === "function"
        ? nextState(component.state, component.props)
        : nextState),
    };
    callback && callback();
  };

  return component;
};

describe("AnalysisDimensionImportModal", () => {
  beforeEach(() => {
    window.globalLange = "zh-CN";
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("opens from the trigger and queries the existing imported file", async () => {
    const dispatch = jest.fn(() =>
      Promise.resolve({
        content: {
          downloadUrl: "/api/preview_file?id=1",
          fileId: 123,
          fileName: "analysis.xlsx",
        },
        status: true,
      }),
    );

    render(
      <AnalysisDimensionImportModalBase
        attainmentTest={null}
        dispatch={dispatch}
        examId={10_798}
        modifyAnalysisDimension={null}
        paperId={9879}
        renderTrigger={({ open }) => (
          <button onClick={() => open(IMPORT_MODE)}>打开导入</button>
        )}
      />,
    );

    fireEvent.click(screen.getByText("打开导入"));

    expect(dispatch).toHaveBeenCalledWith({
      type: "home/getModifyAnalysisDimension",
      payload: {
        examId: 10_798,
      },
    });
    expect(await screen.findByText("导入分析维度")).toBeInTheDocument();
    expect(await screen.findByText("analysis.xlsx")).toBeInTheDocument();
  });

  it("keeps the uploaded file id from a successful upload response", () => {
    expect(
      buildUploadFileState({
        fileList: [
          {
            name: "analysis.xlsx",
            response: {
              content: [{ fileId: 456 }],
              url: "/api/preview_file?id=456",
            },
          },
        ],
      }),
    ).toEqual({
      fileId: 456,
      fileList: [
        expect.objectContaining({
          name: "analysis.xlsx",
          url: "/api/preview_file?id=456",
        }),
      ],
    });
  });

  it("confirms with file id and paper id, then calls success callback", async () => {
    const dispatch = jest.fn(() =>
      Promise.resolve({
        content: null,
        status: true,
      }),
    );
    const onSuccess = jest.fn();
    jest.spyOn(message, "success").mockImplementation(() => {});
    const component = createComponent({ dispatch, onSuccess });

    component.setState({
      fileId: 456,
    });
    await component.handleConfirm();

    expect(dispatch).toHaveBeenCalledWith({
      type: "home/getAttainmentTest",
      payload: {
        fileId: 456,
        paperId: 9879,
      },
    });
    expect(onSuccess).toHaveBeenCalled();
    expect(component.state.visible).toBe(false);
  });

  it("shows row-level errors when the backend returns invalid rows", async () => {
    const dispatch = jest.fn(() =>
      Promise.resolve({
        content: [2, 5],
        status: false,
      }),
    );
    const component = createComponent({
      dispatch,
    });

    await component.handleConfirm();

    expect(component.state.importFailed).toBe(true);
    expect(component.state.errorRows).toEqual([
      {
        lineNumber: 2,
        mistake: "请检查该行的分析维度内容",
      },
      {
        lineNumber: 5,
        mistake: "请检查该行的分析维度内容",
      },
    ]);
    expect(dispatch).toHaveBeenLastCalledWith({
      type: "home/changeAttainmentTest",
      payload: {
        attainmentTest: component.state.errorRows,
      },
    });
  });

  it("builds existing imported file and error row display data", () => {
    expect(
      buildImportedFileList({
        downloadUrl: "/api/preview_file?id=1",
        fileId: 123,
        fileName: "analysis.xlsx",
      }),
    ).toEqual([
      {
        name: "analysis.xlsx",
        status: "done",
        uid: 123,
        url: "/api/preview_file?id=1",
      },
    ]);
    expect(buildImportErrorRows([8], "格式错误")).toEqual([
      {
        lineNumber: 8,
        mistake: "格式错误",
      },
    ]);
  });
});
