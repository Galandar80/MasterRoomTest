"use client";

import { createClient as createSupabaseClient, type SupabaseClient } from "@supabase/supabase-js";
import { normalizeSupabaseUrl } from "@/lib/auth-config";

let browserClient: SupabaseClient | null = null;

export function createClient() {
  const url = normalizeSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return null;
  }

  if (!browserClient) {
    browserClient = createSupabaseClient(url, anonKey, {
      auth: {
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: "implicit",
        persistSession: true
      }
    });
  }

  return browserClient;
}

export function clearSupabaseAuthStorage() {
  if (typeof window === "undefined") return;

  const url = normalizeSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const projectRef = url ? new URL(url).hostname.split(".")[0] : "";
  const knownKeys = [
    "supabase.auth.token",
    projectRef ? `sb-${projectRef}-auth-token` : "",
    projectRef ? `sb-${projectRef}-code-verifier` : "",
    "oauth_provider_token",
    "oauth_provider_refresh_token"
  ].filter(Boolean);

  knownKeys.forEach((key) => {
    window.localStorage.removeItem(key);
    window.sessionStorage.removeItem(key);
  });

  for (let index = window.localStorage.length - 1; index >= 0; index -= 1) {
    const key = window.localStorage.key(index);
    if (key?.startsWith("sb-") && (key.endsWith("-auth-token") || key.endsWith("-code-verifier"))) {
      window.localStorage.removeItem(key);
    }
  }
}

export const demoMode =
  process.env.NEXT_PUBLIC_DEMO_MODE === "true" ||
  !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
