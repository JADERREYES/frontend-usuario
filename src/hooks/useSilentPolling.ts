import { useEffect, useRef } from 'react';

type UseSilentPollingOptions = {
  enabled?: boolean;
  intervalMs?: number;
  runOnMount?: boolean;
  runOnFocus?: boolean;
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
  } = options ?? {};
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const run = () => {
      void callbackRef.current();
    };

    if (runOnMount) {
      run();
    }

    const intervalId = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        run();
      }
    }, intervalMs);

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
      window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [enabled, intervalMs, runOnFocus, runOnMount]);
}
