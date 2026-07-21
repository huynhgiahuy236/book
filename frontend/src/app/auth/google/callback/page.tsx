"use client";

import { useEffect } from "react";
import { RefreshCw } from "lucide-react";
import { saveToken } from "@/shared/lib/api";

export default function GoogleCallbackPage() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.slice(1));
    const token = params.get("accessToken");
    const next = params.get("next");
    if (token) { saveToken(token); window.location.replace(next?.startsWith("/") && !next.startsWith("//") ? next : "/library"); }
    else window.location.replace("/auth");
  }, []);
  return <main className="library-state"><RefreshCw className="spin" size={28}/><h1>Đang hoàn tất đăng nhập Google…</h1></main>;
}
