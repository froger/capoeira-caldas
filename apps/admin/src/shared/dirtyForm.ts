import { useCallback, useMemo, useState } from 'react';
import { isDirty } from '../core/dirty';

export function useDirtyForm<T>(initial: T) {
  const [snapshot, setSnapshot] = useState(initial);
  const [value, setValue] = useState(initial);

  const dirty = useMemo(() => isDirty(value, snapshot), [value, snapshot]);

  const reset = useCallback((next: T) => {
    setSnapshot(next);
    setValue(next);
  }, []);

  const markSaved = useCallback(() => {
    setSnapshot(value);
  }, [value]);

  return { value, setValue, dirty, reset, markSaved, snapshot };
}
