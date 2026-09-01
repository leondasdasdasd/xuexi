/**
 * @jest-environment node
 */

import { TableHeader } from "./tableHeader";

describe("TableHeader", () => {
  it("forwards the controlled selection props and reserves the operation column", () => {
    const onCheckAllTable = jest.fn();
    const header = new TableHeader({
      allChecked: true,
      onCheckAllTable,
    }).render();
    const headerCells = header.props.children;
    const checkbox = headerCells[0].props.children[0];
    const operationColumn = headerCells.at(-1);

    expect(headerCells).toHaveLength(13);
    expect(checkbox.props.checked).toBe(true);
    expect(checkbox.props.onChange).toBe(onCheckAllTable);
    expect(operationColumn.props["aria-hidden"]).toBe("true");
  });
});
