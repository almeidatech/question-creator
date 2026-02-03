import { useState, useEffect, useCallback, useRef } from 'react';

interface UseTimerReturn {
  remaining: number;
  isExpired: boolean;
  timeDisplay: string;
  pause: () => void;
  resume: () => void;
  isPaused: boolean;
}

const formatTime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

export const useTimer = (
  durationSeconds: number,
  onExpire?: () => void,
  onWarning?: () => void
): UseTimerReturn => {
  const [remaining, setRemaining] = useState(durationSeconds);
  const [isExpired, setIsExpired] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const warningTriggeredRef = useRef(false);

  const pause = useCallback(() => {
    setIsPaused(true);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const resume = useCallback(() => {
    setIsPaused(false);
  }, []);

  useEffect(() => {
    if (isPaused || isExpired) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = setInterval(() => {
      setRemaining(prev => {
        const next = prev - 1;

        if (next <= 0) {
          setIsExpired(true);
          onExpire?.();
          return 0;
        }

        // 5-minute warning (300 seconds)
        if (next === 300 && !warningTriggeredRef.current) {
          warningTriggeredRef.current = true;
          onWarning?.();
        }

        return next;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPaused, isExpired, onExpire, onWarning]);

  return {
    remaining,
    isExpired,
    timeDisplay: formatTime(remaining),
    pause,
    resume,
    isPaused,
  };
};

