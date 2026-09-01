/** @jest-environment node */ // eslint-disable-line jsdoc/check-tag-names
/* eslint-disable jsdoc/check-tag-names */
/* global describe, expect, test */

import { parseModeEnvironment } from "./mode-config";
import { createProxy } from "./proxy.mjs";

describe("Vite local service proxy", () => {
  const apiTarget = "https://question-test.example.test";
  const aiGatewayTarget = "https://ai.example.test";
  const adaptiveBffTarget = "http://127.0.0.1:8787";
  const openMaicTarget = "http://127.0.0.1:3100";
  const proxy = createProxy({
    apiTarget,
    aiGatewayTarget,
    adaptiveBffTarget,
    openMaicTarget,
  });
  const classroomProxy = proxy["/classroom-api"];

  test("keeps adaptive and question-test APIs on independent targets", () => {
    expect(proxy["/adaptive-api"].target).toBe(adaptiveBffTarget);
    expect(proxy["/adaptive-api"].rewrite("/adaptive-api/answers/grade")).toBe(
      "/api/answers/grade",
    );
    expect(proxy["/api"].target).toBe(apiTarget);
  });

  test("routes classroom and OpenMAIC runtime paths to their owners", () => {
    expect(classroomProxy.target).toBe(adaptiveBffTarget);
    expect(classroomProxy.rewrite).toBeUndefined();
    expect(proxy["/openmaic"].rewrite("/openmaic/classroom/demo")).toBe(
      "/classroom/demo",
    );
    expect(proxy["/_next"].target).toBe(openMaicTarget);
    expect(proxy["/api/anonymous-runtime"].target).toBe(openMaicTarget);
    expect(proxy["/api/classroom"].target).toBe(openMaicTarget);
    expect(proxy["/api/classroom-media"].target).toBe(openMaicTarget);
    expect(proxy["/api/quiz-grade"].target).toBe(openMaicTarget);
    expect(proxy["/api/chat"].target).toBe(openMaicTarget);
    expect(proxy["/avatars"].target).toBe(openMaicTarget);
    expect(proxy["/logo-horizontal.png"].target).toBe(openMaicTarget);
  });

  test("delegates classroom identity and assertion handling to the trusted BFF", () => {
    expect(classroomProxy.configure).toBeUndefined();
    expect(JSON.stringify(classroomProxy)).not.toMatch(
      /X-Teacher-Api-Key|X-Yungu-Teacher-Assertion|local-teacher-key/,
    );
  });

  test("ignores obsolete direct-classroom credentials from local environments", () => {
    const modeConfig = parseModeEnvironment("serve", "local-backend", {
      APP_BASE_URL: "./",
      DEV_DATA_SOURCE: "proxy",
      DEV_API_PROXY_TARGET: apiTarget,
      DEV_AI_GATEWAY_PROXY_TARGET: aiGatewayTarget,
      DEV_ADAPTIVE_BFF_PROXY_TARGET: adaptiveBffTarget,
      DEV_CLASSROOM_PROXY_TARGET: "http://attacker.example.test:8788",
      DEV_CLASSROOM_TEACHER_API_KEY: "browser-visible-service-key",
      DEV_OPENMAIC_PROXY_TARGET: openMaicTarget,
    });

    expect(modeConfig.command).toBe("serve");
    if (modeConfig.command !== "serve") throw new Error("Expected serve mode");
    expect(modeConfig.devServer.dataSource).toBe("proxy");
    if (modeConfig.devServer.dataSource !== "proxy") {
      throw new Error("Expected proxy data source");
    }
    expect(modeConfig.devServer.proxyTargets).toEqual({
      apiTarget,
      aiGatewayTarget,
      adaptiveBffTarget,
      openMaicTarget,
    });
  });
});
