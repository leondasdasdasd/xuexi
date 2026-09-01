const MODE_COMMANDS = {
  daily: "build",
  "daily-local": "serve",
  "local-backend": "serve",
  mock: "serve",
  production: "build",
  "production-local": "serve",
} as const;

type ModeEnvironment = Readonly<Record<string, string>>;
type ModeCommand = "build" | "serve";

export type ProxyTargets = Readonly<{
  apiTarget: string;
  aiGatewayTarget: string;
  adaptiveBffTarget: string;
  openMaicTarget: string;
}>;

export type DevServerConfig =
  | Readonly<{ dataSource: "mock" }>
  | Readonly<{ dataSource: "proxy"; proxyTargets: ProxyTargets }>;

export type ModeConfig =
  | Readonly<{ baseUrl: string; command: "build" }>
  | Readonly<{
      baseUrl: string;
      command: "serve";
      devServer: DevServerConfig;
    }>;

const readRequiredValue = (environment: ModeEnvironment, key: string) => {
  const value = environment[key];

  if (!value) {
    throw new Error(`Mode environment is missing ${key}`);
  }

  return value;
};

const readHttpUrl = (
  environment: ModeEnvironment,
  key: string,
  fallback?: string,
) => {
  const value =
    environment[key] || fallback || readRequiredValue(environment, key);

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`Mode environment has an invalid ${key}: ${value}`);
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error(`Mode environment requires an HTTP(S) ${key}: ${value}`);
  }

  return value;
};

/**
 * 将命令、mode 与 dotenv 字符串收敛为 Vite 使用的唯一配置形状。
 * 构建配置不会携带开发服务器字段，避免构建流程依赖无关的代理细节。
 */
export const parseModeEnvironment = (
  command: ModeCommand,
  mode: string,
  environment: ModeEnvironment,
): ModeConfig => {
  const expectedCommand = MODE_COMMANDS[mode as keyof typeof MODE_COMMANDS];

  if (!expectedCommand) {
    throw new Error(`Unsupported Vite mode: ${mode}`);
  }

  if (command !== expectedCommand) {
    throw new Error(
      `Vite mode ${mode} requires the ${expectedCommand} command`,
    );
  }

  const baseUrl = readRequiredValue(environment, "APP_BASE_URL");

  if (command === "build") {
    return { baseUrl, command };
  }

  if (environment.DEV_DATA_SOURCE === "mock") {
    return { baseUrl, command, devServer: { dataSource: "mock" } };
  }

  if (environment.DEV_DATA_SOURCE !== "proxy") {
    throw new Error(
      `Mode environment has an invalid DEV_DATA_SOURCE: ${environment.DEV_DATA_SOURCE || "<empty>"}`,
    );
  }

  return {
    baseUrl,
    command,
    devServer: {
      dataSource: "proxy",
      proxyTargets: {
        apiTarget: readHttpUrl(environment, "DEV_API_PROXY_TARGET"),
        aiGatewayTarget: readHttpUrl(
          environment,
          "DEV_AI_GATEWAY_PROXY_TARGET",
        ),
        adaptiveBffTarget: readHttpUrl(
          environment,
          "DEV_ADAPTIVE_BFF_PROXY_TARGET",
          "http://127.0.0.1:8787",
        ),
        openMaicTarget: readHttpUrl(
          environment,
          "DEV_OPENMAIC_PROXY_TARGET",
          "http://127.0.0.1:3100",
        ),
      },
    },
  };
};
