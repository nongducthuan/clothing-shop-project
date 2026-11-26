import { useState, useEffect, useCallback } from 'react';

/**
 * Returns a live countdown string "M:SS" until the order is auto-cancelled,
 * or null if the deadline has already passed (order may already be cancelled).
 *
 * @param createdAt  - order.created_at ISO string
 * @param timeoutMin - grace period in minutes (must match UNPAID_ONLINE_TIMEOUT_MINUTES on backend, default 30)
 */
export function useAutoCancelCountdown(
  createdAt: string | undefined | null,
  timeoutMin = 30,
): string | null {
  const getRemaining = useCallback((): number => {
    if (!createdAt) return 0;
    const ts = new Date(createdAt).getTime();
    // F-2: guard NaN from invalid date strings
    if (!Number.isFinite(ts)) return 0;
    const deadline = ts + timeoutMin * 60 * 1000;
    return Math.max(0, deadline - Date.now());
  }, [createdAt, timeoutMin]);

  const [remaining, setRemaining] = useState<number>(getRemaining);

  useEffect(() => {
    // F-2: reset countdown when createdAt becomes null/undefined
    if (!createdAt) {
      setRemaining(0);
      return;
    }
    setRemaining(getRemaining());

    const timer = setInterval(() => {
      const r = getRemaining();
      setRemaining(r);
      if (r <= 0) clearInterval(timer);
    }, 1000);

    return () => clearInterval(timer);
  }, [createdAt, getRemaining]);

  if (remaining <= 0) return null;

  const totalSeconds = Math.floor(remaining / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}
