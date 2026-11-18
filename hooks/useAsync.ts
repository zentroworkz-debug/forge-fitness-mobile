import { useCallback, useEffect, useRef, useState } from 'react';
import { niceError } from '@/lib/supabase';

export function useAsync<T>(fn: () => Promise<T>, deps: any[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const fnRef = useRef(fn); fnRef.current = fn;
  const run = useCallback(async (pull = false) => {
    pull ? setRefreshing(true) : setLoading(true);
    try { setData(await fnRef.current()); setError(null); }
    catch (e) { setError(niceError(e)); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { run(); }, deps);
  return { data, error, loading, refreshing, reload: () => run(), refresh: () => run(true) };
}
