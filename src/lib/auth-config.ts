export function getSupabaseProjectUrl() {
  return normalizeSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
}

export function getSupabaseProjectRef() {
  const url = getSupabaseProjectUrl();
  if (!url) return "";

  try {
    return new URL(url).hostname.split(".")[0] ?? "";
  } catch {
    return "";
  }
}

export function getGoogleCallbackUrl() {
  const ref = getSupabaseProjectRef();
  return ref ? `https://${ref}.supabase.co/auth/v1/callback` : "";
}

export function getAuthRedirectUrl(origin?: string) {
  const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "");
  return configuredUrl || origin || "";
}

export function normalizeSupabaseUrl(url?: string) {
  return url?.replace(/\/rest\/v1\/?$/, "").replace(/\/$/, "") ?? "";
}
