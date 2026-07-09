/**
 * services/api.ts
 *
 * Thin client for calling FinZee Supabase Edge Functions from the Expo app.
 * Every call attaches the current user's access token so the function can
 * authenticate the request (the functions call supabase.auth.getUser).
 *
 * Functions live at `${SUPABASE_URL}/functions/v1/<name>`.
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { CONFIG } from '../constants/config';

let _client: SupabaseClient | null = null;

function client(): SupabaseClient {
  if (!_client) {
    _client = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY, {
      auth: { flowType: 'pkce', persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
    });
  }
  return _client;
}

export interface CallOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
  query?: Record<string, string | number | undefined>;
}

/**
 * Invoke an edge function by name. Returns the parsed JSON body.
 * Throws an Error with the function's message on non-2xx responses.
 */
export async function callFunction<T = any>(name: string, opts: CallOptions = {}): Promise<T> {
  const { method = 'GET', body, query } = opts;

  const { data: { session } } = await client().auth.getSession();
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
  const data = text ? JSON.parse(text) : {};
  if (!res.ok) {
    throw new Error(data?.error || `Request to ${name} failed (${res.status})`);
  }
  return data as T;
}

export const api = { call: callFunction };
