import { getToken } from "./authToken";
import { apiErrorMessage } from "@/utils/apiErrorMessage";
import {
  PAGINATION_HEADER,
  pageResultFromHeader,
  type PageResult,
} from "@/models/pagination";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:5050";

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "HttpError";
  }
}

async function request(
  path: string,
  options: RequestInit = {},
): Promise<Response> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  const token = getToken();
  if (token && !headers.Authorization) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let body: unknown;
    try {
      body = await response.json();
    } catch {
      body = undefined;
    }
    throw new HttpError(
      response.status,
      apiErrorMessage(body, response.statusText || "Erro na requisição"),
    );
  }

  return response;
}

export async function http<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await request(path, options);

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

/** GET that returns PageResult from array body + Pagination header. */
export async function httpPaged<T>(
  path: string,
  options: RequestInit = {},
): Promise<PageResult<T>> {
  const response = await request(path, options);
  const items = (await response.json()) as T[];
  const header =
    response.headers.get(PAGINATION_HEADER) ??
    response.headers.get(PAGINATION_HEADER.toLowerCase());
  return pageResultFromHeader(items, header);
}
