export type ApiResponse<T> =
  | { data: T; error: null }
  | { data: null; error: { message: string; code: string } };

export function ok<T>(data: T): ApiResponse<T> {
  return { data, error: null };
}

export function fail(code: string, message: string): ApiResponse<never> {
  return { data: null, error: { code, message } };
}
