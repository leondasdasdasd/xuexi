import { closeCurrentPage } from "../navigation";

describe("closeCurrentPage", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("closes the current browser tab", () => {
    const close = jest.spyOn(window, "close").mockImplementation(() => {});

    closeCurrentPage();

    expect(close).toHaveBeenCalledTimes(1);
  });
});
