import { render, screen, waitFor } from "@testing-library/react";

import { getCurrentUser } from "../../services/explicitExam";
import StuTest, { resolveLegacyStuTestEntry } from "./index";

jest.mock("../../services/explicitExam", () => ({
  getCurrentUser: jest.fn(),
}));

describe("legacy StuTest entry", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("resolves the tablet URL to the ExplicitExam student answer route", () => {
    expect(
      resolveLegacyStuTestEntry({
        examId: "123",
        id: "true",
        isSeePaper: "456",
      }),
    ).toEqual({
      kind: "redirect",
      path: "/student/exams/123/tasks/456/answer",
    });
  });

  it("resolves the standard student URL from the current identity", () => {
    expect(
      resolveLegacyStuTestEntry({ examId: "123", id: "456" }, "student"),
    ).toEqual({
      kind: "redirect",
      path: "/student/exams/123/tasks/456/answer",
    });
  });

  it("resolves the teacher result URL without treating studentId as a task", () => {
    expect(
      resolveLegacyStuTestEntry({
        examId: "123",
        id: "789",
        isSeePaper: "true",
      }),
    ).toEqual({
      kind: "redirect",
      path: "/teacher/exams/123/students/789/result",
    });
  });

  it("resolves an unflagged teacher URL to the paper trial route", () => {
    expect(
      resolveLegacyStuTestEntry({ examId: "123", id: "99" }, "employee"),
    ).toEqual({
      kind: "redirect",
      path: "/teacher/papers/99/trial",
    });
  });

  it("replaces the tablet URL without rendering the legacy page", async () => {
    const history = { replace: jest.fn() };

    render(
      <StuTest
        history={history}
        match={{
          params: { examId: "123", id: "true", isSeePaper: "456" },
        }}
      />,
    );

    await waitFor(() => {
      expect(history.replace).toHaveBeenCalledWith(
        "/student/exams/123/tasks/456/answer",
      );
    });
    expect(
      screen.queryByText(/历史入口|legacy entry/i),
    ).not.toBeInTheDocument();
  });

  it("loads the identity before redirecting an unflagged legacy URL", async () => {
    const history = { replace: jest.fn() };
    getCurrentUser.mockResolvedValue({ currentIdentity: "student" });

    render(
      <StuTest
        history={history}
        match={{ params: { examId: "123", id: "456" } }}
      />,
    );

    await waitFor(() => {
      expect(history.replace).toHaveBeenCalledWith(
        "/student/exams/123/tasks/456/answer",
      );
    });
    expect(getCurrentUser).toHaveBeenCalledTimes(1);
  });

  it("shows an invalid-route state for malformed tablet parameters", () => {
    const history = { replace: jest.fn() };

    render(
      <StuTest
        history={history}
        match={{
          params: { examId: "123", id: "true", isSeePaper: "invalid" },
        }}
      />,
    );

    expect(history.replace).not.toHaveBeenCalled();
    expect(
      screen.getByText(/链接参数无效|invalid link parameters/i),
    ).toBeInTheDocument();
  });

  it("shows a load failure when the current identity cannot be loaded", async () => {
    const history = { replace: jest.fn() };
    getCurrentUser.mockRejectedValue(new Error("Identity service unavailable"));

    render(
      <StuTest
        history={history}
        match={{ params: { examId: "123", id: "456" } }}
      />,
    );

    expect(
      await screen.findByText(/加载失败|unable to load exam content/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Identity service unavailable"),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/链接参数无效|invalid link parameters/i),
    ).not.toBeInTheDocument();
    expect(history.replace).not.toHaveBeenCalled();
  });
});
