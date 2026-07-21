"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { ArrowLeft, BookOpen, Check, CreditCard, Eye, Library, LogIn, MessageSquare, ShieldCheck, Sparkles, Star } from "lucide-react";
import { api, getCurrentUser, type SessionUser } from "@/shared/lib/api";
import { bookFromApi, books as fallbackBooks, money, type ApiBook, type Book } from "@/features/catalog/lib/books";
import { BookCover } from "./book-cover";

type BookAccess = {
  owned: boolean;
  canRead: boolean;
  source?: "PURCHASE" | "DEMO" | "ADMIN" | "FREE";
  progress: { currentPage?: number; totalPages?: number; progressPercentage?: number };
};
type Review = { _id: string; authorName: string; rating: number; content: string; createdAt?: string };

export function BookDetail({ bookId }: { bookId: string }) {
  const [book, setBook] = useState<Book | null>(() => fallbackBooks.find((item) => item.id === bookId) ?? null);
  const [pageState, setPageState] = useState<"loading" | "ready" | "not-found">("loading");
  const [user, setUser] = useState<SessionUser | null>(null);
  const [owned, setOwned] = useState(false);
  const [access, setAccess] = useState<BookAccess | null>(null);
  const [loading, setLoading] = useState<"payos" | "demo" | null>(null);
  const [error, setError] = useState("");
  const [reviews, setReviews] = useState<Review[]>([]);

  useEffect(() => {
    let active = true;
    void Promise.all([
      api<ApiBook>(`/books/${encodeURIComponent(bookId)}`).catch(() => null),
      getCurrentUser(),
      api<Review[]>(`/books/${encodeURIComponent(bookId)}/reviews`).catch(() => []),
    ]).then(async ([remoteBook, profile, reviewItems]) => {
      if (!active) return;
      if (remoteBook) setBook(bookFromApi(remoteBook));
      setPageState(remoteBook || fallbackBooks.some((item) => item.id === bookId) ? "ready" : "not-found");
      setUser(profile);
      setReviews(reviewItems);
      if (profile) {
        const permission = await api<BookAccess>(`/library/${encodeURIComponent(bookId)}/access`, {}, true).catch(() => null);
        if (active && permission) {
          setAccess(permission);
          setOwned(permission.owned || permission.canRead);
        }
      }
    });
    return () => { active = false; };
  }, [bookId]);

  if (pageState === "loading" && !book) return <main className="detail-empty"><div className="detail-loading"/><h1>Đang mở trang sách…</h1></main>;
  if (pageState === "not-found" || !book) return <main className="detail-empty"><BookOpen size={38}/><h1>Không tìm thấy sách</h1><Link className="button button-primary" href="/">Về nhà sách</Link></main>;

  const purchase = async (mode: "payos" | "demo") => {
    if (!user) { window.location.assign(`/auth?next=/books/${encodeURIComponent(book.id)}`); return; }
    setLoading(mode); setError("");
    try {
      const body = JSON.stringify({ bookIds: [book.id], clientRequestId: crypto.randomUUID() });
      if (mode === "demo") {
        await api("/payments/payos/demo", { method: "POST", body }, true);
        window.location.assign(`/library?new=${encodeURIComponent(book.id)}`);
      } else {
        const payment = await api<{ checkoutUrl?: string }>("/payments/payos", { method: "POST", body }, true);
        if (!payment.checkoutUrl) throw new Error("Giao dịch cũ không còn liên kết thanh toán");
        window.location.assign(payment.checkoutUrl);
      }
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Không thể xử lý"); setLoading(null); }
  };

  const submitReview = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setError("");
    const form = event.currentTarget;
    const values = Object.fromEntries(new FormData(form));
    try {
      const review = await api<Review>(`/books/${encodeURIComponent(book.id)}/reviews`, { method: "POST", body: JSON.stringify({ rating: Number(values.rating), content: values.content }) }, true);
      setReviews((items) => [review, ...items]); form.reset();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Không thể gửi đánh giá"); }
  };

  return <main className="detail-page">
    <header className="detail-header"><Link href="/" className="brand"><span className="brand-mark"><BookOpen size={20}/></span><span>Capstone<span>Book</span></span></Link><nav><Link href="/"><ArrowLeft size={17}/> Nhà sách</Link><Link href="/library"><Library size={17}/> Thư viện</Link>{user ? <span>Xin chào, {user.name.split(" ").at(-1)}</span> : <Link href={`/auth?next=/books/${encodeURIComponent(book.id)}`}><LogIn size={17}/> Đăng nhập</Link>}</nav></header>
    <section className="detail-hero">
      <div className="detail-cover-stage"><BookCover book={book} large/><span className="detail-format">{book.format}</span></div>
      <div className="detail-copy"><div className="detail-badges"><span>{book.category}</span><span><Sparkles size={13}/> {book.accessType === "FREE" ? "Miễn phí" : book.accessType === "PREMIUM" ? "Premium" : "Mua một lần"}</span></div><h1>{book.title}</h1><p className="detail-author">bởi <strong>{book.author}</strong></p><div className="detail-rating"><span><Star size={16} fill="currentColor"/> {book.rating || "Chưa có đánh giá"}</span><i/><span>ISBN {book.isbn13 ?? "Đang cập nhật"}</span></div><p className="detail-description">{book.description || "Một tựa sách được tuyển chọn cho thư viện CapstoneBook. Nội dung và quyền đọc được quản lý tập trung từ cơ sở dữ liệu."}</p><dl><div><dt>Nhà xuất bản</dt><dd>{book.publisher || "Đang cập nhật"}</dd></div><div><dt>Định dạng</dt><dd>{book.format}</dd></div><div><dt>Đọc online</dt><dd>{book.readingEnabled ? "Có bản PDF bảo vệ" : "Chưa hỗ trợ"}</dd></div></dl>
        <div className="detail-purchase"><div><span>Giá Ebook</span><strong>{money(book.price)}</strong>{access?.canRead && <small className="detail-owned-note"><ShieldCheck size={14}/> Bạn có quyền đọc Ebook này</small>}</div>{!user ? <Link className="button button-primary" href={`/auth?next=/books/${encodeURIComponent(book.id)}`}><LogIn size={18}/> Đăng nhập để mua</Link> : owned ? <Link className="button button-primary" href={`/read/${encodeURIComponent(book.id)}`}><Eye size={18}/> {(access?.progress.currentPage ?? 1) > 1 ? `Tiếp tục đọc – Trang ${access?.progress.currentPage}` : "Đọc sách ngay"}</Link> : <div className="detail-actions"><button className="button button-primary" disabled={loading !== null} onClick={() => void purchase("payos")}><CreditCard size={18}/>{loading === "payos" ? "Đang tạo PayOS…" : "Mua qua PayOS"}</button>{process.env.NODE_ENV === "development" && <button className="button button-secondary" disabled={loading !== null} onClick={() => void purchase("demo")}>{loading === "demo" ? "Đang cấp quyền…" : "Cấp quyền local"}</button>}</div>}</div>
        {error && <p className="checkout-error" role="alert">{error}</p>}
        <div className="detail-assurance"><span><ShieldCheck size={17}/> Webhook PayOS xác nhận quyền</span><span><Check size={17}/> Tiến độ lưu theo tài khoản</span><span><Check size={17}/> Watermark cá nhân khi đọc</span></div>
      </div>
    </section>
    <section className="detail-reviews"><header><div><span className="eyebrow"><MessageSquare size={14}/> Cộng đồng đọc</span><h2>Đánh giá từ độc giả</h2></div><strong>{reviews.length} đánh giá</strong></header>{owned && <form onSubmit={submitReview}><label><span>Số sao</span><select name="rating" defaultValue="5"><option value="5">5 sao</option><option value="4">4 sao</option><option value="3">3 sao</option><option value="2">2 sao</option><option value="1">1 sao</option></select></label><label><span>Cảm nhận của bạn</span><textarea name="content" minLength={3} maxLength={1200} required placeholder="Chia sẻ điều bạn tâm đắc…"/></label><button className="button button-primary">Gửi đánh giá</button></form>}{reviews.length ? <div className="review-list">{reviews.map((review) => <article key={review._id}><div><strong>{review.authorName}</strong><span><Star size={14} fill="currentColor"/> {review.rating}/5</span></div><p>{review.content}</p></article>)}</div> : <div className="empty-state"><MessageSquare size={28}/><h3>Chưa có đánh giá</h3><p>Hãy là người đầu tiên chia sẻ cảm nhận sau khi sở hữu sách.</p></div>}</section>
  </main>;
}
