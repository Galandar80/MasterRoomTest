"use client";

import { useMemo } from "react";
import Link from "next/link";
import { CheckCircle2, Copy, ExternalLink, ShieldAlert } from "lucide-react";
import { getAuthRedirectUrl, getGoogleCallbackUrl, getSupabaseProjectRef, getSupabaseProjectUrl } from "@/lib/auth-config";

function copyText(value: string) {
  if (!value) return;
  navigator.clipboard?.writeText(value).catch(() => undefined);
}

export default function OAuthSetupPage() {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const siteUrl = getAuthRedirectUrl(origin);
  const supabaseUrl = getSupabaseProjectUrl();
  const projectRef = getSupabaseProjectRef();
  const googleCallback = getGoogleCallbackUrl();
  const redirectUrls = useMemo(() => [`${siteUrl}/**`, "http://localhost:3000/**", "https://*.vercel.app/**"], [siteUrl]);

  return (
    <main className="min-h-screen bg-[#07080d] px-5 py-8 text-slate-100">
      <section className="mx-auto grid max-w-5xl gap-5">
        <div className="rounded-2xl border border-amber-400/25 bg-black/40 p-6 shadow-[0_30px_100px_rgba(0,0,0,0.45)]">
          <p className="mb-3 text-xs uppercase tracking-[0.28em] text-amber-300">GDR Master Room</p>
          <h1 className="font-serif text-4xl font-semibold">Configurazione Google OAuth</h1>
          <p className="mt-3 max-w-3xl text-slate-300">
            Usa questa pagina per copiare gli URL corretti. L&apos;errore <strong>redirect_uri_mismatch</strong> si risolve aggiungendo il callback
            Supabase nel client OAuth di Google.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <SetupCard title="Google Cloud Console" badge="Obbligatorio">
            <p className="text-sm text-slate-300">Nel tuo OAuth Client Google aggiungi questo valore in Authorized redirect URIs:</p>
            <CopyBox value={googleCallback || "NEXT_PUBLIC_SUPABASE_URL mancante"} />
            <p className="text-sm text-slate-300">In Authorized JavaScript origins aggiungi:</p>
            <CopyBox value={siteUrl || "NEXT_PUBLIC_SITE_URL oppure dominio corrente mancante"} />
            <CopyBox value="http://localhost:3000" />
          </SetupCard>

          <SetupCard title="Supabase URL Configuration" badge="Auth">
            <p className="text-sm text-slate-300">Site URL:</p>
            <CopyBox value={siteUrl || "NEXT_PUBLIC_SITE_URL oppure dominio corrente mancante"} />
            <p className="text-sm text-slate-300">Redirect URLs:</p>
            {redirectUrls.map((url) => (
              <CopyBox key={url} value={url} />
            ))}
          </SetupCard>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-5">
          <div className="flex items-center gap-2 text-amber-200">
            <ShieldAlert size={18} />
            <h2 className="font-serif text-2xl">Controlli rapidi</h2>
          </div>
          <ul className="mt-4 grid gap-2 text-sm text-slate-300">
            <StatusLine label="Supabase URL" value={supabaseUrl || "Mancante"} ok={Boolean(supabaseUrl)} />
            <StatusLine label="Project ref" value={projectRef || "Mancante"} ok={Boolean(projectRef)} />
            <StatusLine label="Callback Google" value={googleCallback || "Mancante"} ok={Boolean(googleCallback)} />
            <StatusLine label="URL redirect app" value={siteUrl || "Mancante"} ok={Boolean(siteUrl)} />
          </ul>
        </div>

        <Link
          className="inline-flex w-fit items-center gap-2 rounded-xl border border-amber-400/25 bg-amber-500/10 px-4 py-3 text-sm font-semibold text-amber-100 hover:bg-amber-500/15"
          href="/"
        >
          Torna all&apos;app
          <ExternalLink size={15} />
        </Link>
      </section>
    </main>
  );
}

function SetupCard({ title, badge, children }: { title: string; badge: string; children: React.ReactNode }) {
  return (
    <article className="rounded-2xl border border-white/10 bg-white/[0.035] p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="font-serif text-2xl">{title}</h2>
        <span className="rounded-full border border-amber-400/25 bg-amber-400/10 px-3 py-1 text-xs uppercase tracking-[0.18em] text-amber-200">
          {badge}
        </span>
      </div>
      <div className="grid gap-3">{children}</div>
    </article>
  );
}

function CopyBox({ value }: { value: string }) {
  return (
    <button
      type="button"
      onClick={() => copyText(value)}
      className="flex min-w-0 items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/35 px-3 py-3 text-left text-sm text-slate-100 hover:border-amber-400/40"
    >
      <code className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap">{value}</code>
      <Copy size={16} className="shrink-0 text-amber-200" />
    </button>
  );
}

function StatusLine({ label, value, ok }: { label: string; value: string; ok: boolean }) {
  return (
    <li className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/25 px-3 py-2">
      <span className="inline-flex items-center gap-2">
        <CheckCircle2 size={15} className={ok ? "text-emerald-300" : "text-rose-300"} />
        {label}
      </span>
      <code className="max-w-full overflow-hidden text-ellipsis whitespace-nowrap text-slate-400">{value}</code>
    </li>
  );
}
