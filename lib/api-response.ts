export type ApiResponse<T> =
  | { data: T; error: null }
  | { data: null; error: { message: string; code: string; debug?: unknown } };

export function ok<T>(data: T): ApiResponse<T> {
  return { data, error: null };
}

export function fail(code: string, message: string, debug?: unknown): ApiResponse<never> {
  return { data: null, error: { code, message, ...(debug !== undefined ? { debug } : {}) } };
}
