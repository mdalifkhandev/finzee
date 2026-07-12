/**
 * services/api.ts
 *
 * Thin client for calling FinZee Supabase Edge Functions from the Expo app.
 * Every call attaches the current user's access token so the function can
 * authenticate the request (the functions call supabase.auth.getUser).
 *
 * Functions live at `${SUPABASE_URL}/functions/v1/<name>`.
 */
import { CONFIG } from '../constants/config';
import { supabase } from './supabaseClient';

export interface CallOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
  query?: Record<string, string | number | undefined>;
}

function extractReadableErrorMessage(payload: unknown, fallback: string): string {
  const seen = new Set<unknown>();

  const normalize = (value: unknown): string | null => {
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (!trimmed) return null;

      const jsonStart = trimmed.indexOf('{');
      const jsonCandidate = jsonStart >= 0 ? trimmed.slice(jsonStart) : trimmed;

      try {
        return normalize(JSON.parse(jsonCandidate));
      } catch {
        return trimmed;
      }
    }

    if (!value || typeof value !== 'object' || seen.has(value)) return null;
    seen.add(value);

    const record = value as Record<string, any>;
    const nestedCandidates = [
      record?.error?.message,
      record?.error?.error?.message,
      record?.error,
      record?.message,
      record?.raw,
      record?.detail,
      record?.msg,
    ];

    for (const candidate of nestedCandidates) {
      const result = normalize(candidate);
      if (result) return result;
    }

    return null;
  };

  return normalize(payload) ?? fallback;
}

/**
 * Invoke an edge function by name. Returns the parsed JSON body.
 * Throws an Error with the function's message on non-2xx responses.
 */
export async function callFunction<T = any>(name: string, opts: CallOptions = {}): Promise<T> {
  const { method = 'GET', body, query } = opts;

  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token ?? CONFIG.SUPABASE_ANON_KEY;

  let url = `${CONFIG.SUPABASE_URL}/functions/v1/${name}`;
  if (query) {
    const qs = Object.entries(query)
      .filter(([, v]) => v !== undefined)
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
      .join('&');
    if (qs) url += `?${qs}`;
  }

  const res = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      apikey: CONFIG.SUPABASE_ANON_KEY,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  let data: any = {};
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text };
    }
  }
  if (!res.ok) {
    const fallback = `Request to ${name} failed (${res.status})`;
    throw new Error(
      extractReadableErrorMessage(data, extractReadableErrorMessage(text, fallback))
    );
  }
  return data as T;
}

export const api = { call: callFunction };
