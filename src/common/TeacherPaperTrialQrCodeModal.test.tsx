import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";

import TeacherPaperTrialQrCodeModal from "./TeacherPaperTrialQrCodeModal";

jest.mock("qrcode.react", () => ({
  QRCodeSVG: ({
    "aria-label": label,
    value,
  }: {
    "aria-label": string;
    value: string;
  }) => (
    <div data-testid="teacher-paper-trial-qrcode" data-value={value}>
      {label}
    </div>
  ),
}));

describe("TeacherPaperTrialQrCodeModal", () => {
  it("renders the current paper trial URL and closes through the modal action", () => {
    const onClose = jest.fn();
    render(<TeacherPaperTrialQrCodeModal onClose={onClose} paperId={99} />);

    expect(screen.getByTestId("teacher-paper-trial-qrcode")).toHaveAttribute(
      "data-value",
      "http://localhost/#/teacher/papers/99/trial",
    );
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent(
      "Try this paper on iPad",
    );
    expect(
      screen.getByRole("dialog", { name: "Try this paper on iPad" }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("does not render a QR code without a paper", () => {
    render(<TeacherPaperTrialQrCodeModal onClose={jest.fn()} />);

    expect(
      screen.queryByTestId("teacher-paper-trial-qrcode"),
    ).not.toBeInTheDocument();
  });
});
