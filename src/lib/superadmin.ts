import type { Profile } from "@/lib/types";

export function configuredSuperadminEmails() {
  return (process.env.NEXT_PUBLIC_SUPERADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function isConfiguredSuperadmin(profile?: Pick<Profile, "email"> | null) {
  if (!profile?.email) return false;
  return configuredSuperadminEmails().includes(profile.email.toLowerCase());
}
