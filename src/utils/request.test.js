import fetch from "dva/fetch";

import request from "./request";

jest.mock("dva/fetch", () => jest.fn());

describe("request authentication semantics", () => {
  it.each([500, 503])(
    "keeps an HTTP %s failure authenticated",
    async (status) => {
      fetch.mockResolvedValue({ status, statusText: "Server error" });

      const response = await request("/api/example");

      expect(response.ifLogin).toBe(true);
      expect(response.err).toBeInstanceOf(Error);
    },
  );

  it("keeps a network failure authenticated", async () => {
    fetch.mockRejectedValue(new Error("Network failure"));

    const response = await request("/api/example");

    expect(response.ifLogin).toBe(true);
    expect(response.err).toBeInstanceOf(Error);
  });

  it("marks HTTP 401 as unauthenticated", async () => {
    fetch.mockResolvedValue({ status: 401, statusText: "Unauthorized" });

    const response = await request("/api/example");

    expect(response.ifLogin).toBe(false);
    expect(response.err).toBeInstanceOf(Error);
  });

  it("keeps an HTTP 403 authorization failure authenticated", async () => {
    fetch.mockResolvedValue({ status: 403, statusText: "Forbidden" });

    const response = await request("/api/example");

    expect(response.ifLogin).toBe(true);
    expect(response.err).toBeInstanceOf(Error);
  });

  it("preserves an explicit backend unauthenticated response", async () => {
    const body = { ifLogin: false, message: "login required", status: false };
    fetch.mockResolvedValue({
      json: jest.fn().mockResolvedValue(body),
      status: 200,
    });

    await expect(request("/api/example")).resolves.toBe(body);
  });
});
