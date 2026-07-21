"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BookOpen, ChevronRight, CircleDollarSign, LibraryBig, RefreshCw, ShoppingBag, Users } from "lucide-react";
import { api } from "@/shared/lib/api";

type Dashboard = { users: number; books: number; orders: number; revenue: number; recentOrders: Array<{ _id: string; orderCode: number; amount: number; status: string; provider: string }> };
type AdminBook = { id: string; title: string; authors: string[]; accessType: string; status: string; readingEnabled: boolean; ebookPrice: number; stock: number };
const money = (value: number) => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value);

export function AdminDashboard() {
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [books, setBooks] = useState<AdminBook[]>([]);
  const [error, setError] = useState("");
  useEffect(() => { void Promise.all([api<Dashboard>("/admin/dashboard", {}, true), api<AdminBook[]>("/admin/books", {}, true)]).then(([summary, list]) => { setDashboard(summary); setBooks(list); }).catch((cause: Error) => setError(cause.message)); }, []);
  const update = async (book: AdminBook, changes: Partial<AdminBook>) => {
    const previous = books; setBooks((items) => items.map((item) => item.id === book.id ? { ...item, ...changes } : item));
    try { await api(`/admin/books/${encodeURIComponent(book.id)}`, { method: "PATCH", body: JSON.stringify(changes) }, true); }
    catch (cause) { setBooks(previous); setError(cause instanceof Error ? cause.message : "Không thể cập nhật"); }
  };
  if (error && !dashboard) return <main className="admin-state"><LibraryBig size={32}/><h1>Không thể mở trang quản trị</h1><p>{error}</p><Link href="/">Về nhà sách</Link></main>;
  if (!dashboard) return <main className="admin-state"><RefreshCw className="spin" size={28}/><h1>Đang tải dữ liệu quản trị…</h1></main>;
  return <main className="admin-page"><header className="admin-header"><Link href="/" className="brand"><span className="brand-mark"><BookOpen size={20}/></span><span>Capstone<span>Admin</span></span></Link><Link href="/">Xem cửa hàng <ChevronRight size={17}/></Link></header><section className="admin-hero"><span className="eyebrow">Tổng quan vận hành</span><h1>Dữ liệu thật,<br/><em>quyết định rõ ràng.</em></h1><p>Dashboard đọc trực tiếp từ MongoDB, không dùng số liệu hard-code.</p></section><section className="admin-metrics">{[[Users,"Người dùng",dashboard.users],[LibraryBig,"Đầu sách",dashboard.books],[ShoppingBag,"Đơn hàng",dashboard.orders],[CircleDollarSign,"Doanh thu",money(dashboard.revenue)]].map(([Icon,label,value]) => { const MetricIcon = Icon as typeof Users; return <article key={String(label)}><span><MetricIcon size={21}/></span><div><small>{String(label)}</small><strong>{String(value)}</strong></div></article>; })}</section><section className="admin-grid"><article className="admin-panel"><header><div><span className="eyebrow">Catalog</span><h2>Quản lý sách</h2></div><small>{books.length} đầu sách</small></header><div className="admin-table"><div className="admin-row admin-row-head"><span>Sách</span><span>Quyền</span><span>Giá Ebook</span><span>Đọc online</span><span>Trạng thái</span></div>{books.map((book) => <div className="admin-row" key={book.id}><span><strong>{book.title}</strong><small>{book.authors[0] ?? "Chưa rõ tác giả"}</small></span><select value={book.accessType} onChange={(event) => void update(book,{accessType:event.target.value})}><option>FREE</option><option>PREMIUM</option><option>PURCHASE</option></select><span>{money(book.ebookPrice ?? 0)}</span><button className={book.readingEnabled ? "toggle active" : "toggle"} onClick={() => void update(book,{readingEnabled:!book.readingEnabled})} aria-label={`Bật tắt đọc online cho ${book.title}`}><i/></button><select value={book.status} onChange={(event) => void update(book,{status:event.target.value})}><option>ACTIVE</option><option>DRAFT</option><option>ARCHIVED</option></select></div>)}</div></article><article className="admin-panel admin-orders"><header><div><span className="eyebrow">Gần đây</span><h2>Giao dịch</h2></div></header>{dashboard.recentOrders.map((order) => <div key={order._id}><span><strong>#{order.orderCode}</strong><small>{order.provider}</small></span><b>{money(order.amount)}</b><em>{order.status}</em></div>)}</article></section></main>;
}
