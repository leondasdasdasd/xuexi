import react from "@vitejs/plugin-react-swc";
import { nodePolyfills } from "vite-plugin-node-polyfills";
import { defineConfig, loadEnv } from "vite";
import type { ProxyOptions } from "vite";
import type { Options as SwcOptions } from "@swc/core";
import path from "node:path";
import prefixSelector from "postcss-prefix-selector";

import { mockMiddleware } from "./build/vite/mockMiddleware.mjs";
import { parseModeEnvironment } from "./build/vite/mode-config";
import { createProxy } from "./build/vite/proxy.mjs";

type MutableSwcOptions = {
  jsc?: {
    parser?: {
      decorators?: boolean;
    };
    transform?: Record<string, unknown>;
  };
};

const projectRootPath = process.cwd();
const resolvePath = (...segments: string[]) =>
  path.resolve(projectRootPath, ...segments);

const adaptiveLearningStyleRoot = ".adaptive-learning-root";

const scopeAdaptiveLearningSelector = (
  prefix: string,
  selector: string,
  prefixedSelector: string,
  filePath: string,
) => {
  if (!filePath.includes("/src/adaptiveLearning/")) {
    return selector;
  }

  // CSS Modules 的类名已经由构建工具隔离，再追加应用前缀会把前缀也模块化，
  // 最终生成页面中不存在的祖先类名，导致草稿纸等模块样式无法命中。
  if (filePath.endsWith(".module.css")) {
    return selector;
  }

  // 自适应学习样式来自独立应用，这里把页面根选择器显式映射到模块容器。
  if ([":root", "html", "body", "#root"].includes(selector)) {
    return adaptiveLearningStyleRoot;
  }

  return prefixedSelector
    .replace(`${prefix} :root`, adaptiveLearningStyleRoot)
    .replace(`${prefix} html`, adaptiveLearningStyleRoot)
    .replace(`${prefix} body`, adaptiveLearningStyleRoot)
    .replace(`${prefix} #root`, adaptiveLearningStyleRoot);
};

const theme = {
  "primary-color": "#0445FC",
  "text-color": "#01113D",
  "border-radius-base": "7px",
  "border-color-base": "#E6E7EC",
  "text-color-secondary": "rgba(1, 17, 61, .45)",
};

const configureLegacyDecorators = (options: SwcOptions) => {
  const mutableOptions = options as MutableSwcOptions;

  if (mutableOptions.jsc?.parser) {
    mutableOptions.jsc.parser.decorators = true;
  }
  if (!mutableOptions.jsc) {
    mutableOptions.jsc = {};
  }
  mutableOptions.jsc.transform = {
    ...mutableOptions.jsc.transform,
    decoratorMetadata: false,
    legacyDecorator: true,
    useDefineForClassFields: false,
  };
};

export default defineConfig(({ command, mode }) => {
  const modeConfig = parseModeEnvironment(
    command,
    mode,
    loadEnv(mode, projectRootPath, ["APP_", "DEV_"]),
  );
  const developmentServer =
    modeConfig.command === "serve" ? modeConfig.devServer : undefined;
  const proxy =
    developmentServer?.dataSource === "proxy"
      ? createProxy(developmentServer.proxyTargets)
      : {};

  return {
    // 后端模板从 question-test/${staticVer}/ 加载静态资源，构建产物内部引用需保持相对路径。
    // 未来后端改为消费 Vite HTML/manifest 后，可恢复默认 base。
    base: modeConfig.baseUrl,
    // 生产包移除调试与普通信息日志，同时保留 warn/error 供线上问题定位。
    esbuild:
      command === "build"
        ? {
            pure: ["console.log", "console.debug", "console.info"],
          }
        : undefined,
    plugins: [
      nodePolyfills({
        globals: {
          Buffer: false,
          global: true,
          process: false,
        },
        protocolImports: false,
      }),
      react({
        plugins: [],
        useAtYourOwnRisk_mutateSwcOptions: configureLegacyDecorators,
      }),
      mockMiddleware({ enabled: developmentServer?.dataSource === "mock" }),
    ],
    resolve: {
      alias: {
        "@ant-design/icons/lib/dist": "@ant-design/icons/lib/index.es.js",
        "@": resolvePath("src"),
        components: resolvePath("src/components"),
        utils: resolvePath("src/utils"),
      },
    },
    css: {
      modules: {
        localsConvention: "camelCase",
      },
      postcss: {
        plugins: [
          prefixSelector({
            prefix: adaptiveLearningStyleRoot,
            transform: scopeAdaptiveLearningSelector,
          }),
        ],
      },
      preprocessorOptions: {
        less: {
          javascriptEnabled: true,
          math: "always",
          modifyVars: theme,
        },
      },
    },
    build: {
      assetsDir: "",
      cssCodeSplit: false,
      // 老版 antd/rc-* 依赖存在 ESM 文件内混用 require 的情况，生产包必须统一转换，避免浏览器执行时报 require 未定义。
      commonjsOptions: {
        transformMixedEsModules: true,
      },
      rollupOptions: {
        output: {
          entryFileNames: "index.js",
          chunkFileNames: "assets/[name]-[hash].js",
          assetFileNames: (assetInfo) =>
            assetInfo.name?.endsWith(".css")
              ? "index.css"
              : "assets/[name]-[hash][extname]",
        },
      },
    },
    // build: {
    //   assetsDir: "",
    //   // 后端 examIndex.html 固定以 classic script 加载 question-test/${staticVer}/index.js。
    //   // 这里保持 IIFE 输出以兼容该模板；未来后端改为消费 Vite HTML/manifest 后应恢复默认 module 拆包。
    //   // Vite 在 IIFE 输出下会把样式注入 JS；关闭 CSS 拆包以继续导出后端模板固定引用的 index.css。
    //   // 未来后端改为消费 Vite HTML/manifest 后，可恢复默认 CSS 拆包策略。
    //   cssCodeSplit: false,
    //   // 老版 antd/rc-* 依赖存在 ESM 文件内混用 require 的情况，生产包必须统一转换，避免浏览器 classic script 执行时报 require 未定义。
    //   commonjsOptions: {
    //     transformMixedEsModules: true,
    //   },
    //   rollupOptions: {
    //     output: {
    //       format: "iife",
    //       // 后端模板固定读取版本目录下的 index.js，不能输出带顶层 export/import 的 module 入口。
    //       entryFileNames: "index.js",
    //       chunkFileNames: "assets/[name]-[hash].js",
    //       // 后端模板固定读取版本目录下的 index.css，因此生产构建需要保留这个兼容文件名。
    //       assetFileNames: (assetInfo) =>
    //         assetInfo.name?.endsWith(".css")
    //           ? "index.css"
    //           : "assets/[name]-[hash][extname]",
    //     },
    //   },
    // },
    server: {
      host: "0.0.0.0",
      allowedHosts: ["leon.local.yungu-inc.org", "task.local.yungu-inc.org"],
      port: 8000,
      proxy: proxy as Record<string, string | ProxyOptions>,
    },
  };
});
