import {
  MATCH_FILTER_ALL_VALUE,
  buildRecordTypeFilterOptions,
  getRecordMatchProfile,
  getRecordTypeProfile,
  matchesRecordFilters,
  matchesRecordTypeFilter,
} from "./examStructureMatcher";

describe("examStructureMatcher", () => {
  beforeEach(() => {
    window.globalLange = "zh-CN";
  });

  it("builds stage and subject profile from grade and subject fields", () => {
    expect(
      getRecordMatchProfile({
        gradeId: 12,
        gradeName: "五年级",
        subjectId: 15,
        subjectName: "英语",
      }),
    ).toEqual(
      expect.objectContaining({
        stageKey: "primary",
        stageLabel: "小学",
        subjectKey: "id:15",
        subjectLabel: "英语",
      }),
    );
  });

  it("matches records by stage and subject filters", () => {
    const record = {
      gradeName: "八年级",
      subjectId: 13,
      subjectName: "语文",
    };

    expect(
      matchesRecordFilters(record, {
        stageKey: "junior",
        subjectKey: "id:13",
      }),
    ).toBe(true);
    expect(
      matchesRecordFilters(record, {
        stageKey: MATCH_FILTER_ALL_VALUE,
        subjectKey: MATCH_FILTER_ALL_VALUE,
      }),
    ).toBe(true);
    expect(
      matchesRecordFilters(record, {
        stageKey: "primary",
        subjectKey: "id:13",
      }),
    ).toBe(false);
  });

  it("builds stable paper type filter options", () => {
    expect(
      buildRecordTypeFilterOptions([
        { examTypeName: "期中考试" },
        { paperTypeName: "期末考试" },
        { typeName: "期中考试" },
      ]),
    ).toEqual([
      {
        label: "全部类型",
        value: MATCH_FILTER_ALL_VALUE,
      },
      {
        label: "期中考试",
        value: "type:期中考试",
      },
      {
        label: "期末考试",
        value: "type:期末考试",
      },
    ]);
  });

  it("matches records by paper type filter", () => {
    const record = {
      examTypeName: "周测",
    };

    expect(getRecordTypeProfile(record)).toEqual({
      typeKey: "type:周测",
      typeLabel: "周测",
    });
    expect(matchesRecordTypeFilter(record, "type:周测")).toBe(true);
    expect(matchesRecordTypeFilter(record, MATCH_FILTER_ALL_VALUE)).toBe(true);
    expect(matchesRecordTypeFilter(record, "type:期中考试")).toBe(false);
  });
});
