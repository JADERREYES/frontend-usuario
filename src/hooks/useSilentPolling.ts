import { useEffect, useRef } from 'react';

type UseSilentPollingOptions = {
  enabled?: boolean;
  intervalMs?: number | null;
  runOnMount?: boolean;
  runOnFocus?: boolean;
  pauseWhen?: boolean;
};

export function useSilentPolling(
  callback: () => void | Promise<void>,
  options?: UseSilentPollingOptions,
) {
  const {
    enabled = true,
    intervalMs = 15000,
    runOnMount = true,
    runOnFocus = true,
    pauseWhen = false,
  } = options ?? {};
  const callbackRef = useRef(callback);
  const runningRef = useRef(false);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const run = () => {
      if (runningRef.current || pauseWhen) {
        return;
      }

      runningRef.current = true;
      const result = callbackRef.current();
      Promise.resolve(result)
        .catch(() => undefined)
        .finally(() => {
          runningRef.current = false;
        });
    };

    if (runOnMount && !pauseWhen) {
      run();
    }

    const intervalId =
      intervalMs && intervalMs > 0
        ? window.setInterval(() => {
            if (document.visibilityState === 'visible') {
              run();
            }
          }, intervalMs)
        : null;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && runOnFocus) {
        run();
      }
    };

    const handleFocus = () => {
      if (runOnFocus && document.visibilityState === 'visible') {
        run();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      if (intervalId) {
        window.clearInterval(intervalId);
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [enabled, intervalMs, pauseWhen, runOnFocus, runOnMount]);
}
