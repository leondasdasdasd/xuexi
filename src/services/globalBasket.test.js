import request from "../utils/request";
import { addToBasket, cancelToBasket } from "./global";

jest.mock("../utils/request", () => jest.fn());

describe("legacy question basket service", () => {
  beforeEach(() => request.mockReset());

  it("adds and removes a v2 question id through the legacy basket endpoints", async () => {
    await addToBasket({ gradeId: 7, questionId: 341, subjectId: 2 });
    await cancelToBasket({ questionId: 341 });

    expect(request).toHaveBeenNthCalledWith(
      1,
      "/api/question/basket/add?gradeId=7&questionId=341&subjectId=2",
    );
    expect(request).toHaveBeenNthCalledWith(
      2,
      "/api/question/basket/unbind?questionId=341",
    );
  });
});
