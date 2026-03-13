import { useEffect, useRef, useState } from "react";

const pad = (value: number) => value.toString().padStart(2, "0");

export const OTP_EXPIRATION_SECONDS = 5 * 60;

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${pad(mins)}:${pad(secs)}`;
};

export const useOtpTimer = (durationInSeconds: number = OTP_EXPIRATION_SECONDS) => {
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const start = () => {
    const target = Date.now() + durationInSeconds * 1000;
    setExpiresAt(target);
  };

  const reset = () => {
    setExpiresAt(null);
    setTimeLeft(0);
  };

  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (!expiresAt) {
      setTimeLeft(0);
      return;
    }

    const update = () => {
      const left = Math.max(0, Math.round((expiresAt - Date.now()) / 1000));
      setTimeLeft(left);
      if (left <= 0 && intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
        setExpiresAt(null);
      }
    };

    update();
    intervalRef.current = setInterval(update, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [expiresAt]);

  return {
    start,
    reset,
    isRunning: timeLeft > 0,
    timeLeft,
    formattedTime: formatTime(timeLeft),
  };
};
