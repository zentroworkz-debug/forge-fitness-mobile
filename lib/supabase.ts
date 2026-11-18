import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';

// Same Supabase project as the website. Only the public anon/publishable key belongs here.
// Never put the service-role key or DATABASE_URL in the app.
const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
export const configured = Boolean(url && key);

// SecureStore warns above ~2 KB per value, and a session JSON can be larger, so store it in chunks.
const CHUNK = 1800;
const secureStorage = {
  async getItem(k: string) {
    const n = await SecureStore.getItemAsync(`${k}.n`);
    if (!n) return SecureStore.getItemAsync(k);
    const parts: string[] = [];
    for (let i = 0; i < Number(n); i++) parts.push((await SecureStore.getItemAsync(`${k}.${i}`)) ?? '');
    return parts.join('');
  },
  async setItem(k: string, v: string) {
    await secureStorage.removeItem(k);
    const n = Math.ceil(v.length / CHUNK);
    for (let i = 0; i < n; i++) await SecureStore.setItemAsync(`${k}.${i}`, v.slice(i * CHUNK, (i + 1) * CHUNK));
    await SecureStore.setItemAsync(`${k}.n`, String(n));
  },
  async removeItem(k: string) {
    const n = await SecureStore.getItemAsync(`${k}.n`);
    for (let i = 0; i < Number(n ?? 0); i++) await SecureStore.deleteItemAsync(`${k}.${i}`);
    await SecureStore.deleteItemAsync(`${k}.n`);
    await SecureStore.deleteItemAsync(k);
  },
};

export const supabase = createClient(url || 'http://localhost:54321', key || 'not-configured', {
  auth: { storage: secureStorage, autoRefreshToken: true, persistSession: true, detectSessionInUrl: false },
});

export async function q<T>(p: PromiseLike<{ data: T; error: any }>): Promise<T extends (infer U)[] | null ? U[] : T> {
  const { data, error } = await p;
  if (error) throw error;
  return (data ?? []) as any;
}

export function niceError(e: any): string {
  const m: string = e?.message || e?.error_description || String(e);
  if (/Network request failed|Failed to fetch/i.test(m)) return 'No connection. Check your internet and try again.';
  if (/exclusion constraint/i.test(m)) return 'That time conflicts with another session.';
  if (/row-level security/i.test(m)) return 'You do not have permission to do that.';
  if (/duplicate key/i.test(m)) return 'That record already exists.';
  if (/Invalid login credentials/i.test(m)) return 'Incorrect email or password.';
  if (/Email not confirmed/i.test(m)) return 'Please verify your email first.';
  return m;
}

export const todayIST = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
