import { act, render, screen } from "@testing-library/react";

import StartingCountdownPanel from "../components/StartingCountdownPanel";

describe("StartingCountdownPanel", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it("counts down for three seconds before starting", () => {
    const onComplete = jest.fn();
    render(<StartingCountdownPanel onComplete={onComplete} />);
    expect(screen.getByText("3")).toBeInTheDocument();
    act(() => jest.advanceTimersByTime(1000));
    act(() => jest.advanceTimersByTime(1000));
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(onComplete).not.toHaveBeenCalled();
    act(() => jest.advanceTimersByTime(1000));
    expect(onComplete).toHaveBeenCalledTimes(1);
  });
});
