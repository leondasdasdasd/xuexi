import { message } from "antd";

import {
  bindQuestionV2Basket,
  unbindQuestionV2Basket,
} from "../../services/questionV2";
import { loginRedirect } from "../../utils/utils";
import { V2QuestionList } from "./index";

jest.mock("../../services/global", () => ({
  updateQuestionChapter: jest.fn(),
  updateQuestionIndicator: jest.fn(),
}));
jest.mock("../../services/questionV2", () => ({
  bindQuestionV2Basket: jest.fn(),
  deleteQuestionV2Resource: jest.fn(),
  unbindQuestionV2Basket: jest.fn(),
}));
jest.mock("../../utils/utils", () => ({
  ...jest.requireActual("../../utils/utils"),
  loginRedirect: jest.fn(),
}));

const bindV2Mock = bindQuestionV2Basket;
const unbindV2Mock = unbindQuestionV2Basket;
const loginRedirectMock = loginRedirect;

const createPage = () => {
  const dispatch = jest.fn();
  const page = new V2QuestionList({
    dispatch,
    history: { push: jest.fn() },
    match: { params: {} },
  });
  page.setState = jest.fn((update) => {
    const nextState =
      typeof update === "function" ? update(page.state) : update;
    page.state = { ...page.state, ...nextState };
  });
  page.state.questionList = [
    {
      inQuestionBasket: false,
      question: { id: 341 },
    },
  ];
  return { dispatch, page };
};

describe("newMyQuestion v2 basket mutations", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(message, "error").mockImplementation(jest.fn());
  });

  it("adds through the legacy endpoint and refreshes basket state", async () => {
    bindV2Mock.mockResolvedValue({ ifLogin: true, status: true });
    const { dispatch, page } = createPage();

    await page.showTransLate({ gradeId: 7, id: 341, subjectId: 2 });

    expect(bindV2Mock).toHaveBeenCalledWith({
      gradeId: 7,
      questionId: 341,
      subjectId: 2,
    });
    expect(dispatch).toHaveBeenCalledWith({ type: "home/getV2BasketList" });
    expect(dispatch).toHaveBeenCalledTimes(1);
    expect(page.state.questionList[0].inQuestionBasket).toBe(true);
  });

  it("removes through the legacy endpoint", async () => {
    unbindV2Mock.mockResolvedValue({ ifLogin: true, status: true });
    const { page } = createPage();
    page.state.questionList[0].inQuestionBasket = true;

    await page.cancelAdd(341);

    expect(unbindV2Mock).toHaveBeenCalledWith({ questionId: 341 });
    expect(page.state.questionList[0].inQuestionBasket).toBe(false);
  });

  it("does not update local or global state after a failed mutation", async () => {
    bindV2Mock.mockResolvedValue({
      ifLogin: true,
      message: "加入失败",
      status: false,
    });
    const { dispatch, page } = createPage();

    await page.showTransLate({ gradeId: 7, id: 341, subjectId: 2 });

    expect(dispatch).not.toHaveBeenCalled();
    expect(page.state.questionList[0].inQuestionBasket).toBe(false);
    expect(message.error).toHaveBeenCalledWith("加入失败");
  });

  it("redirects login without updating state", async () => {
    unbindV2Mock.mockResolvedValue({ ifLogin: false, status: false });
    const { dispatch, page } = createPage();

    await page.cancelAdd(341);

    expect(loginRedirectMock).toHaveBeenCalled();
    expect(dispatch).not.toHaveBeenCalled();
    expect(page.state.questionList[0].inQuestionBasket).toBe(false);
  });
});
