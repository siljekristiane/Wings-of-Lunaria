import { useCallback, useRef } from 'react';

const SAVE_KEY = 'wingsOfLunaria.save.v1';

export function loadSave() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function writeSave(data) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  } catch {
    // storage unavailable — ignore, prototype still playable this session
  }
}

export function clearSave() {
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch {
    /* noop */
  }
}

// Debounced saver so frequent position updates don't thrash localStorage
export function useDebouncedSave(delay = 400) {
  const timer = useRef(null);
  return useCallback(
    (data) => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => writeSave(data), delay);
    },
    [delay]
  );
}
