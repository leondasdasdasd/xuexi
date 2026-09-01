import { routes, mockDelayMs } from "../../mock/index.mjs";

const readBody = (request) =>
  new Promise((resolve, reject) => {
    const chunks = [];
    request.on("data", (chunk) => chunks.push(chunk));
    request.on("end", () => resolve(Buffer.concat(chunks)));
    request.on("error", reject);
  });

const parseBody = (buffer, contentType = "") => {
  if (buffer.length === 0) return {};
  const text = buffer.toString("utf8");
  if (contentType.includes("application/json")) {
    try {
      return JSON.parse(text);
    } catch {
      return {};
    }
  }
  if (contentType.includes("application/x-www-form-urlencoded")) {
    return Object.fromEntries(new URLSearchParams(text));
  }

  return {};
};

const sendJson = (response, data) => {
  response.statusCode = 200;
  response.setHeader("content-type", "application/json; charset=utf-8");
  response.end(JSON.stringify(data));
};

const sendBinary = (response, result) => {
  response.statusCode = result.status || 200;
  for (const [key, value] of Object.entries(result.headers || {})) {
    response.setHeader(key, value);
  }
  response.end(result.body);
};

const resolveRoute = (method, pathname) =>
  routes.find((route) => route.method === method && route.path === pathname);

const sleep = (duration) =>
  new Promise((resolve) => {
    setTimeout(resolve, duration);
  });

const routeKeys = new Set();
for (const route of routes) {
  const key = `${route.method} ${route.path}`;
  if (routeKeys.has(key)) {
    throw new Error(`Duplicate mock route: ${key}`);
  }
  routeKeys.add(key);
}

/**
 * Mock 是否启用由 mode 配置统一决定，middleware 不再读取进程环境变量。
 * @param {{enabled: boolean}} options Mock 开关
 * @returns {import("vite").Plugin} Vite Mock middleware 插件
 */
export const mockMiddleware = ({ enabled }) => ({
  name: "question-test:mock",
  configureServer(server) {
    if (!enabled) return;

    server.middlewares.use(async (request, response, next) => {
      const requestUrl = new URL(request.url || "/", "http://mock.local");
      const route = resolveRoute(request.method || "GET", requestUrl.pathname);
      if (!route) {
        next();
        return;
      }

      const bodyBuffer = await readBody(request);
      const body = parseBody(bodyBuffer, request.headers["content-type"]);
      const context = {
        query: Object.fromEntries(requestUrl.searchParams),
        body,
        headers: request.headers,
      };
      const result =
        typeof route.handler === "function"
          ? await route.handler(context)
          : route.handler;

      if (mockDelayMs) {
        await sleep(mockDelayMs);
      }

      if (result?.type === "binary") {
        sendBinary(response, result);
        return;
      }

      sendJson(response, result?.type === "json" ? result.body : result);
    });
  },
});
