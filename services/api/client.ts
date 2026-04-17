import { Platform } from 'react-native';

function getBaseUrl(): string {
  if (Platform.OS === 'web') {
    return '';
  }

  return 'http://localhost:8081';
}

const BASE_URL = getBaseUrl();

export interface ApiResponse<T> {
  data: T;
  error?: never;
}

export interface ApiError {
  data?: never;
  error: {
    message: string;
    status: number;
  };
}

export type ApiResult<T> = ApiResponse<T> | ApiError;

/**
 * Type-safe fetch wrapper for internal API routes.
 * Automatically handles JSON parsing and error normalization.
 */
export async function apiFetch<T>(
  endpoint: string,
  options?: RequestInit,
): Promise<ApiResult<T>> {
  const url = `${BASE_URL}${endpoint}`;

  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });

    if (!response.ok) {
      return {
        error: {
          message: `Request failed: ${response.statusText}`,
          status: response.status,
        },
      };
    }

    const data: T = await response.json();
    return { data };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown network error';
    return {
      error: {
        message,
        status: 0,
      },
    };
  }
}
