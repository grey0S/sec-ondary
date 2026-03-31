"use client";

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

export function SessionGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const publicPage = pathname === "/instalar-ios" || pathname === "/instalar-pwa";
  const [ready, setReady] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const ensure = useCallback(async () => {
    let res = await fetch("/api/me", { credentials: "include" });
    if (res.status === 401) {
      await fetch("/api/auth/bootstrap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({}),
      });
      res = await fetch("/api/me", { credentials: "include" });
    }
    if (!res.ok) {
      setErr("No se pudo iniciar sesión local.");
      setReady(true);
      return;
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (publicPage) {
      setReady(true);
      return;
    }
    void ensure();
  }, [ensure, publicPage]);

  if (publicPage) {
    return <>{children}</>;
  }

  if (!ready) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <div className="h-10 w-10 rounded-full border-2 border-[#00f5c8]/40 border-t-[#00f5c8] animate-spin" />
        <p className="text-sm text-[#7a7da3] font-display tracking-widest uppercase">Sincronizando…</p>
      </div>
    );
  }

  if (err) {
    return (
      <div className="rounded-2xl border border-[#ff3d7a]/40 bg-[#ff3d7a]/10 p-4 text-center text-sm">{err}</div>
    );
  }

  return <>{children}</>;
}
