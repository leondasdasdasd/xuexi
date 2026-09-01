import {
  MATH_FIELD_VIRTUAL_KEYBOARD_POLICY,
  bindMathFieldVirtualKeyboard,
  getMathFieldElementProperties,
} from "./mathFieldVirtualKeyboard";

const MATH_FIELD_CLASS = "math-field-class";

describe("mathFieldVirtualKeyboard", () => {
  it("uses sandboxed policy so keyboard renders inside iframe", () => {
    expect(getMathFieldElementProperties(MATH_FIELD_CLASS, false)).toEqual({
      class: MATH_FIELD_CLASS,
      disabled: undefined,
      "math-virtual-keyboard-policy": MATH_FIELD_VIRTUAL_KEYBOARD_POLICY,
      "smart-fence": "",
    });
    expect(MATH_FIELD_VIRTUAL_KEYBOARD_POLICY).toBe("sandboxed");
  });

  it("marks math-field disabled when disabled prop is true", () => {
    expect(getMathFieldElementProperties(MATH_FIELD_CLASS, true).disabled).toBe(
      "",
    );
  });

  it("shows and hides virtual keyboard on focusin and focusout", () => {
    const field = {
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    };
    const show = jest.fn();
    const hide = jest.fn();
    window.mathVirtualKeyboard = { show, hide };

    const unbind = bindMathFieldVirtualKeyboard(field);
    const focusInHandler = field.addEventListener.mock.calls.find(
      ([eventName]) => eventName === "focusin",
    )[1];
    const focusOutHandler = field.addEventListener.mock.calls.find(
      ([eventName]) => eventName === "focusout",
    )[1];

    focusInHandler();
    focusOutHandler();

    expect(show).toHaveBeenCalledTimes(1);
    expect(hide).toHaveBeenCalledTimes(1);

    unbind();
    expect(field.removeEventListener).toHaveBeenCalledWith(
      "focusin",
      focusInHandler,
    );
    expect(field.removeEventListener).toHaveBeenCalledWith(
      "focusout",
      focusOutHandler,
    );

    delete window.mathVirtualKeyboard;
  });

  it("does not throw when mathVirtualKeyboard is unavailable", () => {
    const field = {
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    };
    const previousKeyboard = window.mathVirtualKeyboard;
    delete window.mathVirtualKeyboard;

    bindMathFieldVirtualKeyboard(field);
    const focusInHandler = field.addEventListener.mock.calls.find(
      ([eventName]) => eventName === "focusin",
    )[1];

    expect(() => focusInHandler()).not.toThrow();

    if (previousKeyboard) {
      window.mathVirtualKeyboard = previousKeyboard;
    }
  });
});
