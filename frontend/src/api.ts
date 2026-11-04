export class ApiError extends Error {
  constructor(
    public status: number,
    public fields: Record<string, string[] | string>,
  ) {
    super(
      typeof fields.detail === 'string'
        ? fields.detail
        : 'Check the highlighted fields and try again.',
    );
  }
}

export async function api<T>(path: string, userId?: number, options: RequestInit = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`/api${path}`, {
      ...options,
      signal: options.signal
        ? AbortSignal.any([options.signal, AbortSignal.timeout(15000)])
        : AbortSignal.timeout(15000),
      headers: {
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...(userId ? { 'X-Demo-User': String(userId) } : {}),
        ...options.headers,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') throw error;
    throw new Error(
      options.method === 'POST'
        ? 'Connection interrupted. Check the ticket list or history before retrying; your change may have been saved.'
        : 'Unable to reach the server. Check your connection and try again.',
    );
  }
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new ApiError(
      response.status,
      data ?? { detail: 'The server could not complete this request. Please try again.' },
    );
  }
  return data as T;
}

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Something went wrong. Please try again.';
}

export function fieldError(error: unknown, field: string): string | undefined {
  if (!(error instanceof ApiError)) return undefined;
  const value = error.fields[field];
  return Array.isArray(value) ? value.join(' ') : value;
}
