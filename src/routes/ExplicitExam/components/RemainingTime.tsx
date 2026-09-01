import { useEffect, useRef, useState } from "react";

import { trans } from "../../../utils/i18n";

type Properties = {
  deadline: number | null;
  onExpire: () => void;
};

const getRemainingSeconds = (deadline: number) =>
  Math.max(0, Math.ceil((deadline - Date.now()) / 1000));

const formatRemainingTime = (seconds: number) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  return [hours, minutes, remainingSeconds]
    .map((value) => String(value).padStart(2, "0"))
    .join(":");
};

const RemainingTime = ({ deadline, onExpire }: Properties) => {
  const [seconds, setSeconds] = useState(() =>
    deadline === null ? 0 : getRemainingSeconds(deadline),
  );
  const expired = useRef(false);
  const onExpireRef = useRef(onExpire);

  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  useEffect(() => {
    expired.current = false;
    if (deadline === null) {
      setSeconds(0);
      return;
    }
    const update = () => {
      const nextSeconds = getRemainingSeconds(deadline);
      setSeconds(nextSeconds);
      if (nextSeconds === 0 && !expired.current) {
        expired.current = true;
        onExpireRef.current();
      }
    };
    update();
    const interval = window.setInterval(update, 250);
    return () => window.clearInterval(interval);
  }, [deadline]);

  return (
    <span aria-live="polite">
      {deadline === null
        ? trans("explicitExam.unlimited", "不限时长")
        : formatRemainingTime(seconds)}
    </span>
  );
};

export default RemainingTime;
