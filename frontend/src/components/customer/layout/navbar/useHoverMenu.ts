import { useState, useRef } from "react";

// Hook to manage delayed hover effects (Debounce)
export function useHoverDelay(delay = 200) {
  const [isOpen, setIsOpen] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const open = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setIsOpen(true);
  };

  const close = () => {
    timerRef.current = setTimeout(() => setIsOpen(false), delay);
  };

  const closeImmediately = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setIsOpen(false);
  };

  const cancelClose = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  };

  return { isOpen, open, close, closeImmediately, cancelClose };
}
