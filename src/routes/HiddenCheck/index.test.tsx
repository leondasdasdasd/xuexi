import { render, screen } from "@testing-library/react";

import HiddenCheck from "./index";

describe("HiddenCheck", () => {
  it("renders route-only status in the active language", () => {
    render(<HiddenCheck />);

    expect(screen.getByText("状态检查")).toBeInTheDocument();
    expect(screen.getByText("就绪")).toBeInTheDocument();
    expect(screen.getByText("隐藏")).toBeInTheDocument();
  });
});
