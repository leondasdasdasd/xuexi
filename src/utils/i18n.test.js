/** @jest-environment node */

import { trans } from "./i18n";

describe("i18n", () => {
  afterEach(() => {
    delete global.window;
    delete global.navigator;
  });

  it("uses the English catalog when browser globals are unavailable", () => {
    expect(trans("global.cancle")).toBe("Cancel");
  });

  it("normalizes an English browser locale to the English catalog", () => {
    global.navigator = { language: "en-US" };

    expect(trans("twoWayTest.confirmAssociation")).toBe("Confirm association");
  });

  it("normalizes configured underscore locales", () => {
    global.window = { globalLange: "en_US", location: { search: "" } };

    expect(trans("global.cancle")).toBe("Cancel");
  });

  it("uses the Chinese catalog and replaces placeholders", () => {
    global.window = { globalLange: "zh-CN", location: { search: "" } };

    expect(
      trans("twoWayTest.mapsToPaperQuestion", undefined, { number: 3 }),
    ).toBe("对应当前第 3 题");
    expect(
      trans("twoWayTest.mapsToPaperQuestion", undefined, { number: 0 }),
    ).toBe("对应当前第 0 题");
  });
});
