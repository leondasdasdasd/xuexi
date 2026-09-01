import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";

import * as api from "../../../services/explicitExam";
import StudentResultSwitcher from "../components/StudentResultSwitcher";

jest.mock("../../../services/explicitExam");
jest.mock("../../../utils/i18n", () => ({
  locale: () => "zh-CN",
  trans: (_key: string, fallback: string) => fallback,
}));

describe("StudentResultSwitcher", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest
      .mocked(api.getTeacherExamStudents)
      .mockImplementation(async (_examId, query = {}) => ({
        groups: [{ groupId: 3, groupName: "Class 3" }],
        limit: 20,
        pageNo: query.pageNo || 1,
        students: [
          {
            groupId: 3,
            studentId: (query.pageNo || 1) + 7,
            studentName: query.keyword || "Ada",
          },
        ],
        total: 2,
      }));
  });

  afterEach(() => jest.useRealTimers());

  it("keeps accessible control names without visible field labels", async () => {
    const { container } = render(
      <StudentResultSwitcher
        examId={12}
        onSelect={jest.fn()}
        selectedStudent={{ id: 8, name: "Ada" }}
      />,
    );

    expect(
      await screen.findByRole("option", { name: "Class 3" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("全部班级")).toBeInTheDocument();
    expect(screen.getByLabelText("搜索学生")).toBeInTheDocument();
    expect(screen.getByLabelText("切换学生")).toBeInTheDocument();
    expect(container.querySelectorAll("label > span")).toHaveLength(0);
  });

  it("keeps the initial directory after the debounce interval", async () => {
    jest.useFakeTimers();
    render(
      <StudentResultSwitcher
        examId={12}
        onSelect={jest.fn()}
        selectedStudent={{ id: 99, name: "Current student" }}
      />,
    );
    await act(async () => Promise.resolve());
    expect(screen.getByRole("option", { name: "Ada" })).toBeInTheDocument();

    act(() => jest.advanceTimersByTime(300));
    await act(async () => Promise.resolve());

    expect(screen.getByRole("option", { name: "Ada" })).toBeInTheDocument();
    expect(api.getTeacherExamStudents).toHaveBeenCalledTimes(1);
  });

  it("debounces name filtering and appends the next page", async () => {
    jest.useFakeTimers();
    render(
      <StudentResultSwitcher
        examId={12}
        onSelect={jest.fn()}
        selectedStudent={{ id: 8, name: "Ada" }}
      />,
    );
    await act(async () => Promise.resolve());

    fireEvent.change(screen.getByLabelText("搜索学生"), {
      target: { value: "Grace" },
    });
    act(() => jest.advanceTimersByTime(300));
    await waitFor(() =>
      expect(api.getTeacherExamStudents).toHaveBeenCalledWith(12, {
        groupId: undefined,
        keyword: "Grace",
        limit: 20,
        pageNo: 1,
      }),
    );
    fireEvent.click(screen.getByRole("button", { name: "加载更多学生" }));
    await waitFor(() =>
      expect(api.getTeacherExamStudents).toHaveBeenCalledWith(12, {
        groupId: undefined,
        keyword: "Grace",
        limit: 20,
        pageNo: 2,
      }),
    );
  });
});
