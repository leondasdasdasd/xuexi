import { Dropdown } from "antd";

import { AreaHeaderComponent } from "./index";

describe("AreaHeaderComponent 导出入口", () => {
  beforeEach(() => {
    window.globalLange = "zh-CN";
  });

  it("未传 exportMenuItems 时保持旧的单按钮导出行为", () => {
    const onClickExport = jest.fn();
    const component = new AreaHeaderComponent({
      onClickExport,
    });

    const view = component.renderExport();
    view.props.onClick();

    expect(onClickExport).toHaveBeenCalledTimes(1);
  });

  it("传入 exportMenuItems 时展示下拉菜单并按菜单项触发导出动作", () => {
    const onClickExport = jest.fn();
    const exportDetail = jest.fn();
    const exportOriginalVolume = jest.fn();
    const component = new AreaHeaderComponent({
      onClickExport,
      exportMenuItems: [
        {
          key: "detail",
          label: "导出明细",
          onClick: exportDetail,
        },
        {
          key: "originalVolume",
          label: "导出原卷",
          onClick: exportOriginalVolume,
        },
      ],
    });

    const view = component.renderExport();
    view.props.overlay.props.onClick({ key: "originalVolume" });

    expect(view.type).toBe(Dropdown);
    expect(view.props.trigger).toEqual(["click"]);
    expect(onClickExport).not.toHaveBeenCalled();
    expect(exportDetail).not.toHaveBeenCalled();
    expect(exportOriginalVolume).toHaveBeenCalledTimes(1);
  });
});
