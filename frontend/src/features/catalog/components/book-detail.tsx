"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, BookOpen, Check, CreditCard, Library, LogIn, ShieldCheck, Sparkles, Star } from "lucide-react";
import { api, getCurrentUser, type SessionUser } from "@/shared/lib/api";
import { books, money } from "@/features/catalog/lib/books";
import { BookCover } from "./book-cover";

type LibraryItem = { book: { id: string }; progress: { percent: number } };

export function BookDetail({ bookId }: { bookId: string }) {
  const book = useMemo(() => books.find((item) => item.id === bookId), [bookId]);
  const [user, setUser] = useState<SessionUser | null>(null);
  const [owned, setOwned] = useState(false);
  const [loading, setLoading] = useState<"payos" | "demo" | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    void getCurrentUser().then(async (profile) => {
      setUser(profile);
      if (profile) {
        const library = await api<LibraryItem[]>("/library", {}, true).catch(() => []);
        setOwned(library.some((item) => item.book.id === bookId));
      }
    });
  }, [bookId]);

  if (!book) return <main className="detail-empty"><BookOpen size={38}/><h1>Không tìm thấy sách</h1><Link className="button button-primary" href="/">Về nhà sách</Link></main>;

  const purchase = async (mode: "payos" | "demo") => {
    setLoading(mode); setError("");
    try {
      if (mode === "demo") {
        await api("/payments/payos/demo", { method: "POST", body: JSON.stringify({ bookIds: [book.id] }) }, true);
        window.location.assign(`/library?new=${encodeURIComponent(book.id)}`);
      } else {
        const payment = await api<{ checkoutUrl: string }>("/payments/payos", { method: "POST", body: JSON.stringify({ bookIds: [book.id] }) }, true);
        window.location.assign(payment.checkoutUrl);
      }
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Không thể xử lý"); setLoading(null); }
  };

  return <main className="detail-page">
    <header className="detail-header"><Link href="/" className="brand"><span className="brand-mark"><BookOpen size={20}/></span><span>Capstone<span>Book</span></span></Link><nav><Link href="/"><ArrowLeft size={17}/> Nhà sách</Link><Link href="/library"><Library size={17}/> Thư viện</Link>{user ? <span>Xin chào, {user.name.split(" ").at(-1)}</span> : <Link href={`/auth?next=/books/${encodeURIComponent(book.id)}`}><LogIn size={17}/> Đăng nhập</Link>}</nav></header>
    <section className="detail-hero">
      <div className="detail-cover-stage"><BookCover book={book} large/><span className="detail-format">{book.format}</span></div>
      <div className="detail-copy"><div className="detail-badges"><span>{book.category}</span>{book.premium && <span><Sparkles size={13}/> Premium</span>}</div><h1>{book.title}</h1><p className="detail-author">bởi <strong>{book.author}</strong></p><div className="detail-rating"><span><Star size={16} fill="currentColor"/> {book.rating}</span><i/> <span>ISBN {book.isbn13 ?? "Đang cập nhật"}</span></div><p className="detail-description">Một tựa sách được tuyển chọn cho thư viện CapstoneBook. Metadata được đồng bộ từ Open Library; phần nội dung đọc trong vertical slice là văn bản mẫu để kiểm thử quyền sở hữu và tiến độ.</p><dl><div><dt>Nhà xuất bản</dt><dd>{book.publisher || "Đang cập nhật"}</dd></div><div><dt>Định dạng</dt><dd>{book.format}</dd></div><div><dt>Quyền truy cập</dt><dd>Gắn với tài khoản</dd></div></dl>
        <div className="detail-purchase"><div><span>Giá Ebook demo</span><strong>{money(book.price)}</strong>{book.oldPrice && <del>{money(book.oldPrice)}</del>}</div>
          {owned ? <Link className="button button-primary" href={`/read/${encodeURIComponent(book.id)}`}>Đọc ngay <ArrowRight size={18}/></Link> : user ? <div className="detail-actions"><button className="button button-primary" disabled={loading !== null} onClick={() => purchase("payos")}><CreditCard size={18}/>{loading === "payos" ? "Đang tạo PayOS..." : "Mua qua PayOS"}</button><button className="button button-secondary" disabled={loading !== null} onClick={() => purchase("demo")}><Check size={18}/>{loading === "demo" ? "Đang cấp quyền..." : "Test mua local"}</button></div> : <Link className="button button-primary" href={`/auth?next=/books/${encodeURIComponent(book.id)}`}>Đăng nhập để mua <ArrowRight size={18}/></Link>}
        </div>{error && <div className="form-error detail-error" role="alert">{error}</div>}<div className="detail-safety"><ShieldCheck size={19}/><span><strong>Luồng quyền đọc an toàn</strong><small>Reader chỉ mở sau khi backend xác nhận ReadingRight.</small></span></div>
      </div>
    </section>
  </main>;
}
