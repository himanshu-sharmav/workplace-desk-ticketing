import { useEffect, useState } from 'react';
import { api, errorMessage } from './api';

export function useResource<T>(path: string, userId?: number) {
  const [revision, setRevision] = useState(0);
  const key = `${userId ?? ''}:${path}:${revision}`;
  const [state, setState] = useState<{ key: string; data?: T; error?: string }>({ key: '' });
  useEffect(() => {
    const controller = new AbortController();
    api<T>(path, userId, { signal: controller.signal })
      .then((data) => {
        if (!controller.signal.aborted) setState({ key, data });
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted) setState({ key, error: errorMessage(error) });
      });
    return () => controller.abort();
  }, [path, userId, key]);
  const current = state.key === key ? state : undefined;
  return {
    data: current?.data,
    error: current?.error,
    loading: !current,
    retry: () => setRevision((value) => value + 1),
    replace: (data: T) => setState({ key, data }),
  };
}
