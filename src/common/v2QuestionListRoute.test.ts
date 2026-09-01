/** @jest-environment node */

import { readFileSync } from "node:fs";

import { createV2QuestionListRoute } from "./v2QuestionListRoute";

const readSource = (path: string) => readFileSync(path, "utf8");

it("registers the V2 question list public route contract", () => {
  const component = Symbol("V2QuestionListPage");

  expect(createV2QuestionListRoute(component)).toEqual({
    name: "V2QuestionList",
    path: "/V2QuestionList",
    mainPage: true,
    component,
  });
});

it("binds the public route to the V2 page and legacy entry", () => {
  const routesSource = readSource(`${process.cwd()}/src/common/routes.js`);
  const legacyPageSource = readSource(
    `${process.cwd()}/src/routes/MyQuestion/index.jsx`,
  );

  expect(routesSource).toContain("createV2QuestionListRoute(");
  expect(routesSource).toContain('import("../routes/V2QuestionList")');
  expect(routesSource).toContain('path: "/myQuestion"');
  expect(routesSource).toContain("component: redirectToV2QuestionList");
  expect(legacyPageSource).toContain(
    "this.props.history.push(V2_QUESTION_LIST_ROUTE.path)",
  );
});
