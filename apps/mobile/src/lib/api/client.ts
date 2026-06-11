import { supabase } from "@/lib/supabase/client";

const API_URL = process.env.EXPO_PUBLIC_API_URL;

type ApiRequestOptions = {
  authenticated?: boolean;
  headers?: Record<string, string>;
};


// ApiRequest wrapper function for authenticating 
async function apiRequest<TResponse>(
  path: string,
  init: RequestInit = {},
  options: ApiRequestOptions = {},
): Promise<TResponse> {
  const authenticated = options.authenticated ?? true;

  const headers: Record<string, string> = {
    Accept: "application/json",
    ...options.headers,
  };

  if (authenticated) {
    headers.Authorization = `Bearer ${await getAccessToken()}`;
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      ...headers,
      ...init.headers,
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`API request failed (${response.status}): ${body}`);
  }

  return response.json() as Promise<TResponse>;
}

async function getAccessToken(): Promise<string> {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error) {
    throw error;
  }

  if (!session) {
    throw new Error("No authenticated Supabase session");
  }

  return session.access_token;
}

export async function apiGet<T>(
  path: string,
  options: { authenticated?: boolean } = {},
): Promise<T> {
  return apiRequest(path, {method: "GET"}, options);
}

export async function apiPost<T>(path: string, body: any, options?: ApiRequestOptions): Promise<T> {
  return apiRequest(
    path, 
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      }, 
    body: JSON.stringify(body)
    }, 
    options
  )
}