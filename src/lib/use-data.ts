import { useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useRef, useState } from 'react';

import type { Db } from '@/db/types';

export function useDb(): Db {
  return useSQLiteContext();
}

/**
 * Runs `loader` whenever the screen gains focus (so lists refresh after a form closes)
 * and whenever `loader` changes. Wrap the loader in useCallback with its inputs as deps.
 */
export function useData<T>(loader: (db: Db) => Promise<T>): {
  data: T | undefined;
  error: Error | undefined;
  reload: () => void;
} {
  const db = useDb();
  const [data, setData] = useState<T>();
  const [error, setError] = useState<Error>();
  const seq = useRef(0);

  const run = useCallback(() => {
    const id = ++seq.current;
    loader(db)
      .then((d) => {
        if (id === seq.current) {
          setData(d);
          setError(undefined);
        }
      })
      .catch((e: Error) => {
        if (id === seq.current) setError(e);
      });
  }, [db, loader]);

  useFocusEffect(run);
  return { data, error, reload: run };
}
