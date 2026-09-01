// iframe / 跨域嵌套时不能把虚拟键盘代理到 window.top，需在 iframe 内独立渲染。
export const MATH_FIELD_VIRTUAL_KEYBOARD_POLICY = "sandboxed";

export const getMathFieldElementProperties = (className, disabled) => ({
  class: className,
  disabled: disabled ? "" : undefined,
  "math-virtual-keyboard-policy": MATH_FIELD_VIRTUAL_KEYBOARD_POLICY,
  "smart-fence": "",
});

export const showMathFieldVirtualKeyboard = (event) => {
  void event;
  const keyboard =
    typeof window === "undefined" ? undefined : window.mathVirtualKeyboard;
  if (keyboard && typeof keyboard.show === "function") {
    keyboard.show();
  }
};

export const hideMathFieldVirtualKeyboard = (event) => {
  void event;
  const keyboard =
    typeof window === "undefined" ? undefined : window.mathVirtualKeyboard;
  if (keyboard && typeof keyboard.hide === "function") {
    keyboard.hide();
  }
};

export const unbindMathFieldVirtualKeyboard = (field) => {
  void field;
};

export const bindMathFieldVirtualKeyboard = (field) => {
  if (!field) {
    return unbindMathFieldVirtualKeyboard;
  }

  field.addEventListener("focusin", showMathFieldVirtualKeyboard);
  field.addEventListener("focusout", hideMathFieldVirtualKeyboard);

  return function unbindBoundMathFieldVirtualKeyboard(unbindToken) {
    void unbindToken;
    field.removeEventListener("focusin", showMathFieldVirtualKeyboard);
    field.removeEventListener("focusout", hideMathFieldVirtualKeyboard);
  };
};
