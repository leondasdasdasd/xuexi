/**
 * 根据已校验的 mode 配置创建代理，避免代理层读取 dotenv 或推断运行环境。
 * @param {{apiTarget: string, aiGatewayTarget: string, adaptiveBffTarget: string, openMaicTarget: string}} targets 代理目标
 * @returns {Record<string, import("vite").ProxyOptions>} 按请求路径组织的 Vite 代理配置
 */
const OPENMAIC_RUNTIME_PATHS = [
  "/api/anonymous-runtime",
  "/api/classroom-media",
  "/api/classroom",
  "/api/access-code",
  "/api/server-providers",
  "/api/quiz-grade",
  "/api/chat",
  "/api/generate/tts",
  "/avatars",
  "/logo-horizontal.png",
  "/favicon.ico",
  "/apple-icon.png",
];

const createOpenMaicRuntimeProxies = (openMaicTarget) =>
  Object.fromEntries(
    OPENMAIC_RUNTIME_PATHS.map((path) => [
      path,
      {
        target: openMaicTarget,
        changeOrigin: true,
      },
    ]),
  );

export const createProxy = ({
  apiTarget,
  aiGatewayTarget,
  adaptiveBffTarget,
  openMaicTarget,
}) => {
  return {
    // OpenMAIC 运行时使用绝对同源路径；这些独占路径必须先于测验项目通用 API 分流。
    ...createOpenMaicRuntimeProxies(openMaicTarget),
    "/adaptive-api": {
      target: adaptiveBffTarget,
      changeOrigin: true,
      ws: true,
      rewrite: (requestPath) => requestPath.replace(/^\/adaptive-api/, "/api"),
    },
    "/classroom-api": {
      // 8787 BFF 校验测验 SESSION 后签发短时主体断言，再访问内部 8788 服务。
      target: adaptiveBffTarget,
      changeOrigin: true,
    },
    "/openmaic": {
      target: openMaicTarget,
      changeOrigin: true,
      rewrite: (requestPath) => requestPath.replace(/^\/openmaic/, ""),
    },
    "/_next": {
      target: openMaicTarget,
      changeOrigin: true,
    },
    "/api": {
      target: apiTarget,
      changeOrigin: true,
      secure: false,
    },
    "/course/api": {
      target: apiTarget,
      changeOrigin: true,
      secure: false,
    },
    "/center/api": {
      target: aiGatewayTarget,
      changeOrigin: true,
    },
  };
};
