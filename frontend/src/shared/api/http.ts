import { z } from 'zod';

import { useUiStore } from '../../app/store';
import { notifyError, notifyWarning } from '../ui';

const LOCAL_DEV_API_PORT = '8000';
const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1']);
const fallbackWarningsShown = new Set<string>();

export interface AdapterRequestOptions {
  signal?: AbortSignal;
  notifyOnError?: boolean;
}

type QueryValue = string | number | boolean | null | undefined;

interface RequestJsonOptions<T> extends AdapterRequestOptions {
  path: string;
  schema: z.ZodType<T>;
  method?: 'GET' | 'POST';
  query?: Record<string, QueryValue>;
  body?: unknown;
}

type ApiErrorKind = 'aborted' | 'network' | 'http' | 'parse';

interface ApiClientErrorInput {
  kind: ApiErrorKind;
  message: string;
  url: string;
  status?: number;
  detail?: unknown;
}

export class ApiClientError extends Error {
  readonly kind: ApiErrorKind;
  readonly url: string;
  readonly status?: number;
  readonly detail?: unknown;

  constructor(input: ApiClientErrorInput) {
    super(input.message);
    this.name = 'ApiClientError';
    this.kind = input.kind;
    this.url = input.url;
    this.status = input.status;
    this.detail = input.detail;
  }
}

export function resolveApiBaseUrl(): string {
  const configured = normalizeBaseUrl(import.meta.env.VITE_API_BASE_URL);
  if (configured != null) {
    return configured;
  }

  if (typeof window === 'undefined') {
    return '';
  }

  const { hostname, port, protocol } = window.location;
  if (LOCAL_HOSTS.has(hostname) && port.length > 0 && port !== LOCAL_DEV_API_PORT) {
    return `${protocol}//${hostname}:${LOCAL_DEV_API_PORT}`;
  }

  return '';
}

export function isAbortError(error: unknown): boolean {
  return error instanceof ApiClientError && error.kind === 'aborted';
}

export function shouldUseApiFallback(error: unknown): boolean {
  if (!(error instanceof ApiClientError)) {
    return false;
  }

  if (error.kind === 'network') {
    return true;
  }

  return error.kind === 'http' && [502, 503, 504].includes(error.status ?? 0);
}

export function notifyApiError(scope: string, error: unknown) {
  if (isAbortError(error)) {
    return;
  }

  notifyError({
    title: getCatalogApiMessages().requestFailedTitle,
    details: [`${scope}: ${getApiErrorDetail(error)}`],
  });
}

export function notifyApiFallbackOnce(scopeKey: string, scope: string, error: unknown) {
  if (isAbortError(error) || fallbackWarningsShown.has(scopeKey)) {
    return;
  }

  fallbackWarningsShown.add(scopeKey);

  const messages = getCatalogApiMessages();
  notifyWarning({
    title: messages.fallbackTitle,
    details: [`${scope}: ${getApiErrorDetail(error)}`, messages.fallbackDetail],
  });
}

export async function requestJson<T>(options: RequestJsonOptions<T>): Promise<T> {
  const method = options.method ?? 'GET';
  const url = buildApiUrl(options.path, options.query);

  if (options.signal?.aborted === true) {
    throw new ApiClientError({
      kind: 'aborted',
      message: getCatalogApiMessages().aborted,
      url,
    });
  }

  try {
    const response = await fetch(url, {
      method,
      signal: options.signal,
      headers: buildHeaders(options.body),
      body: options.body == null ? undefined : JSON.stringify(options.body),
    });

    const responseText = await response.text();
    let payload: unknown;

    try {
      payload = parseResponsePayload(responseText, response.headers.get('content-type'));
    } catch (error) {
      throw new ApiClientError({
        kind: 'parse',
        message: getCatalogApiMessages().unexpectedResponse,
        url,
        detail: error,
      });
    }

    if (!response.ok) {
      throw new ApiClientError({
        kind: 'http',
        message: buildHttpErrorMessage(response.status, payload),
        url,
        status: response.status,
        detail: payload,
      });
    }

    try {
      return options.schema.parse(payload);
    } catch (error) {
      throw new ApiClientError({
        kind: 'parse',
        message: getCatalogApiMessages().unexpectedResponse,
        url,
        detail: error,
      });
    }
  } catch (error) {
    if (error instanceof ApiClientError) {
      throw error;
    }

    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new ApiClientError({
        kind: 'aborted',
        message: getCatalogApiMessages().aborted,
        url,
      });
    }

    throw new ApiClientError({
      kind: 'network',
      message: getCatalogApiMessages().networkUnavailable,
      url,
      detail: error,
    });
  }
}

function buildApiUrl(path: string, query: Record<string, QueryValue> | undefined): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const baseUrl = resolveApiBaseUrl();
  const origin =
    baseUrl.length > 0
      ? ensureTrailingSlash(baseUrl)
      : typeof window !== 'undefined'
        ? window.location.origin
        : 'http://localhost';
  const url = new URL(normalizedPath, origin);

  if (query != null) {
    for (const [key, value] of Object.entries(query)) {
      if (value == null) {
        continue;
      }

      url.searchParams.set(key, String(value));
    }
  }

  return url.toString();
}

function buildHeaders(body: unknown): HeadersInit | undefined {
  if (body == null) {
    return undefined;
  }

  return {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };
}

function parseResponsePayload(responseText: string, contentType: string | null): unknown {
  if (responseText.trim().length === 0) {
    return null;
  }

  if (contentType?.includes('application/json') === true) {
    return JSON.parse(responseText) as unknown;
  }

  return responseText;
}

function buildHttpErrorMessage(status: number, payload: unknown): string {
  const detail = extractDetailMessage(payload);
  if (detail != null) {
    return detail;
  }

  return `${getCatalogApiMessages().httpStatusPrefix} ${status}`;
}

function extractDetailMessage(payload: unknown): string | null {
  if (typeof payload === 'string') {
    const normalized = payload.trim();
    return normalized.length > 0 ? normalized : null;
  }

  if (Array.isArray(payload)) {
    const messages = payload
      .map((item) => extractDetailMessage(item))
      .filter((item): item is string => item != null);
    return messages.length > 0 ? messages.join('; ') : null;
  }

  if (payload != null && typeof payload === 'object') {
    const detail = (payload as Record<string, unknown>).detail;
    if (detail !== undefined) {
      const nestedDetail = extractDetailMessage(detail);
      if (nestedDetail != null) {
        return nestedDetail;
      }
    }
  }

  return null;
}

function getApiErrorDetail(error: unknown): string {
  const messages = getCatalogApiMessages();

  if (error instanceof ApiClientError) {
    return error.message;
  }

  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return messages.unknownError;
}

function normalizeBaseUrl(value: string | undefined): string | null {
  const normalized = value?.trim();
  if (normalized == null || normalized.length === 0) {
    return null;
  }

  return normalized.replace(/\/+$/u, '');
}

function ensureTrailingSlash(value: string): string {
  return value.endsWith('/') ? value : `${value}/`;
}

function getCatalogApiMessages() {
  const language = useUiStore.getState().language;

  if (language === 'ru') {
    return {
      aborted: 'Запрос был отменен.',
      fallbackDetail: 'Использован локальный fallback-каталог.',
      fallbackTitle: 'Backend-каталог недоступен',
      httpStatusPrefix: 'HTTP',
      networkUnavailable: 'Не удалось связаться с backend API.',
      requestFailedTitle: 'Ошибка загрузки каталога',
      unexpectedResponse: 'Сервер вернул неожиданный ответ.',
      unknownError: 'Неизвестная ошибка.',
    };
  }

  return {
    aborted: 'The request was aborted.',
    fallbackDetail: 'A local fallback catalog was used.',
    fallbackTitle: 'Catalog backend is unavailable',
    httpStatusPrefix: 'HTTP',
    networkUnavailable: 'Unable to reach the backend API.',
    requestFailedTitle: 'Catalog request failed',
    unexpectedResponse: 'The server returned an unexpected response.',
    unknownError: 'Unknown error.',
  };
}
