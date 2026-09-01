/* global describe, expect, it */

import {
  convertQualityDialogTreeData,
  convertQualityTreeData,
} from "./treeData";

describe("TwoWayTest tree data converters", () => {
  const sourceTree = [
    {
      id: "root",
      name: "Root",
      pinyin: "root",
      indicatorSon: [
        {
          id: "child",
          name: "Child",
          pinyin: "child",
        },
      ],
    },
  ];

  it("converts quality dialog nodes with name and pinyin values", () => {
    expect(convertQualityDialogTreeData(sourceTree)).toEqual([
      {
        title: "Root",
        value: "Root-root",
        key: "root",
        children: [
          {
            title: "Child",
            value: "Child-child",
            key: "child",
            children: null,
          },
        ],
      },
    ]);
  });

  it("converts quality selector nodes with id values and pinyin", () => {
    expect(convertQualityTreeData(sourceTree)).toEqual([
      {
        title: "Root",
        value: "root",
        key: "root",
        pinyin: "root",
        children: [
          {
            title: "Child",
            value: "child",
            key: "child",
            pinyin: "child",
            children: null,
          },
        ],
      },
    ]);
  });
});
