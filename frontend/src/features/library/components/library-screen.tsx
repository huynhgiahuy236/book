"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, BookOpen, Library, LogOut, RefreshCw, ShieldCheck } from "lucide-react";
import { api, clearToken, getCurrentUser, type SessionUser } from "@/shared/lib/api";

type LibraryItem = {
  right: { source: "PURCHASE" | "DEMO"; createdAt?: string };
  book: { id: string; title: string; authors: string[]; coverUrl: string; categories: string[] };
  progress: { currentPage?: number; totalPages?: number; progressPercentage?: number; percent?: number };
};

export function LibraryScreen() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "guest" | "error">("loading");

  useEffect(() => {
    void getCurrentUser().then(async (profile) => {
      if (!profile) { setStatus("guest"); return; }
      setUser(profile);
      try { setItems(await api<LibraryItem[]>("/library", {}, true)); setStatus("ready"); }
      catch { setStatus("error"); }
    });
  }, []);

  if (status === "loading") return <main className="library-state"><RefreshCw className="spin" size={28}/><h1>Đang mở thư viện...</h1></main>;
  if (status === "guest") return <main className="library-state"><div className="state-icon"><Library size={30}/></div><span className="eyebrow">Thư viện cá nhân</span><h1>Đăng nhập để xem sách của bạn</h1><p>Quyền đọc và tiến độ được lưu an toàn theo tài khoản.</p><Link className="button button-primary" href="/auth?next=/library">Đăng nhập <ArrowRight size={18}/></Link><Link className="text-button" href="/">Về nhà sách</Link></main>;

  return <main className="library-page">
    <header className="library-header"><Link href="/" className="brand"><span className="brand-mark"><BookOpen size={20}/></span><span>Capstone<span>Book</span></span></Link><nav><Link href="/">Nhà sách</Link><span>{user?.name}</span><button onClick={() => { void api("/auth/logout", { method: "POST" }).finally(() => { clearToken(); window.location.assign("/"); }); }}><LogOut size={17}/> Đăng xuất</button></nav></header>
    <section className="library-hero"><div><span className="eyebrow"><Library size={15}/> Không gian của bạn</span><h1>Thư viện<br/><em>đang đọc.</em></h1><p>Mọi cuốn sách đã được cấp quyền và tiến độ gần nhất đều nằm ở đây.</p></div><div className="library-stats"><div><strong>{items.length}</strong><span>Sách sở hữu</span></div><div><strong>{items.filter((item) => (item.progress.progressPercentage ?? item.progress.percent ?? 0) > 0).length}</strong><span>Đang đọc</span></div><div><strong>{items.filter((item) => (item.progress.progressPercentage ?? item.progress.percent ?? 0) === 100).length}</strong><span>Hoàn thành</span></div></div></section>
    <section className="library-content"><div className="section-head"><div className="section-intro"><span className="eyebrow">Bộ sưu tập</span><h2>Sách của tôi</h2></div><span className="result-count"><ShieldCheck size={14}/> Quyền đọc từ backend</span></div>
      {status === "error" ? <div className="empty-state"><h3>Chưa tải được thư viện</h3><p>Kiểm tra API local rồi tải lại trang.</p></div> : items.length === 0 ? <div className="empty-state"><Library size={30}/><h3>Thư viện đang trống</h3><p>Test mua một Ebook để xem trọn luồng cấp quyền.</p><Link className="button button-primary" href="/#books">Khám phá sách</Link></div> : <div className="library-grid">{items.map((item) => { const progress = item.progress.progressPercentage ?? item.progress.percent ?? 0; return <article className="library-card" key={item.book.id}><div className="library-cover" style={{backgroundImage:`url("${item.book.coverUrl}")`}}><span>{item.right.source === "DEMO" ? "LOCAL DEMO" : "ĐÃ MUA"}</span></div><div className="library-card-copy"><span>{item.book.categories[0] ?? "Ebook"}</span><h3>{item.book.title}</h3><p>{item.book.authors[0] ?? "Chưa rõ tác giả"}</p><div className="library-progress-label"><span>Tiến độ</span><strong>{progress}%</strong></div><div className="library-progress-bar"><i style={{width:`${progress}%`}}/></div><Link className="button button-secondary" href={`/read/${encodeURIComponent(item.book.id)}`}>{progress ? "Đọc tiếp" : "Bắt đầu đọc"}<ArrowRight size={17}/></Link></div></article>; })}</div>}
    </section>
  </main>;
}
