import { buildHashRouteUrl } from "./hashRoute";

describe("hashRoute", () => {
  const originalLocation = window.location;

  beforeEach(() => {
    delete window.location;
    window.location = {
      hash: "",
      href: "",
      origin: "https://task.local.yungu-inc.org",
      pathname: "/exam/",
    };
  });

  afterAll(() => {
    window.location = originalLocation;
  });

  it("builds an exam hash route without losing the current base path", () => {
    expect(buildHashRouteUrl("twoWayTest/123")).toBe(
      "https://task.local.yungu-inc.org/exam#/twoWayTest/123",
    );
  });
});
