"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, BookOpen, Check, ChevronRight, Eye, Heart, Library, LogIn, Menu, Search, ShoppingBag, Sparkles, Star, X } from "lucide-react";
import { books, money, type Book } from "@/features/catalog/lib/books";
import { api, getCurrentUser, type SessionUser } from "@/shared/lib/api";
import { BookCover } from "./book-cover";

export function Storefront() {
  const [category, setCategory] = useState("Tất cả");
  const [query, setQuery] = useState("");
  const [cart, setCart] = useState<Book[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [checkoutState, setCheckoutState] = useState<"idle" | "loading" | "error">("idle");
  const [user, setUser] = useState<SessionUser | null>(null);

  useEffect(() => { void getCurrentUser().then(setUser); }, []);

  const filtered = useMemo(() => books.filter((book) => {
    const inCategory = category === "Tất cả" || book.category === category;
    const q = query.trim().toLocaleLowerCase("vi");
    return inCategory && (!q || `${book.title} ${book.author}`.toLocaleLowerCase("vi").includes(q));
  }), [category, query]);

  const addToCart = (book: Book) => {
    setCart((current) => current.some((item) => item.id === book.id) ? current : [...current, book]);
    setCartOpen(true);
  };

  const cartTotal = cart.reduce((sum, book) => sum + book.price, 0);

  const startCheckout = async () => {
    if (!user) { window.location.assign("/auth?next=/"); return; }
    setCheckoutState("loading");
    try {
      const payment = await api<{ checkoutUrl: string }>("/payments/payos", {
        method: "POST",
        body: JSON.stringify({ bookIds: cart.map((book) => book.id) }),
      }, true);
      window.location.assign(payment.checkoutUrl);
    } catch {
      setCheckoutState("error");
    }
  };

  return (
    <div className="site-shell">
      <div className="announcement"><span>Miễn phí vận chuyển cho đơn từ 299.000đ</span><span className="announcement-side">Ebook đọc ngay · Thanh toán an toàn qua PayOS</span></div>
      <header className="site-header">
        <Link href="/" className="brand" aria-label="CapstoneBook trang chủ"><span className="brand-mark"><BookOpen size={20}/></span><span>Capstone<span>Book</span></span></Link>
        <nav className={`main-nav ${menuOpen ? "is-open" : ""}`} aria-label="Điều hướng chính">
          <Link href="#books">Sách</Link><Link href="/read/demo">Đọc thử</Link><Link href="/library">Thư viện</Link><Link href="#premium">Premium</Link><Link href="#about">Về chúng tôi</Link>
        </nav>
        <div className="header-actions">
          <label className="search-field"><Search size={18}/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm sách, tác giả..." aria-label="Tìm sách"/></label>
          <Link className="icon-btn account-btn" href={user ? "/library" : "/auth"} aria-label={user ? `Thư viện của ${user.name}` : "Đăng nhập"}>{user ? <Library size={20}/> : <LogIn size={20}/>}</Link>
          <button className="icon-btn cart-btn" onClick={() => setCartOpen(true)} aria-label={`Giỏ hàng có ${cart.length} sản phẩm`}><ShoppingBag size={20}/>{cart.length > 0 && <span>{cart.length}</span>}</button>
          <button className="icon-btn menu-btn" onClick={() => setMenuOpen(!menuOpen)} aria-label="Mở menu">{menuOpen ? <X size={21}/> : <Menu size={21}/>}</button>
        </div>
      </header>

      <main>
        <section className="hero-section">
          <div className="hero-copy">
            <span className="eyebrow"><Sparkles size={15}/> Bộ sưu tập được tuyển chọn</span>
            <h1>Mỗi trang sách,<br/><em>một thế giới mới.</em></h1>
            <p>Khám phá những cuốn sách đáng đọc nhất, sở hữu bản in tinh tế hoặc bắt đầu Ebook chỉ trong vài giây.</p>
            <div className="hero-actions"><a className="button button-primary" href="#books">Khám phá ngay <ArrowRight size={18}/></a><Link className="text-button" href="/read/demo">Đọc Ebook mẫu <ChevronRight size={17}/></Link></div>
            <div className="trust-row"><span><Check size={15}/> Hơn 12.000 đầu sách</span><span><Check size={15}/> Bản quyền chính hãng</span></div>
          </div>
          <div className="hero-visual">
            <div className="hero-orb orb-one"></div><div className="hero-orb orb-two"></div>
            <div className="book-stack"><div className="stack-back"><BookCover book={books[1]} large/></div><div className="stack-front"><BookCover book={books[0]} large/></div></div>
            <div className="floating-note"><span className="avatar-group"><i>A</i><i>M</i><i>K</i></span><p><strong>4.9/5</strong><br/>từ cộng đồng đọc</p></div>
          </div>
        </section>

        <section className="category-section" aria-label="Danh mục sách">
          <div className="section-intro compact"><span className="eyebrow">Đọc theo cảm hứng</span><h2>Hôm nay bạn muốn đọc gì?</h2></div>
          <div className="category-list">{["Tất cả", ...Array.from(new Set(books.map((book) => book.category))).slice(0, 6)].map((item) => <button key={item} className={category === item ? "active" : ""} onClick={() => setCategory(item)}>{item}</button>)}</div>
        </section>

        <section className="books-section" id="books">
          <div className="section-head"><div className="section-intro"><span className="eyebrow">Được yêu thích</span><h2>Sách dành cho bạn</h2><p>Những tựa sách được độc giả CapstoneBook lựa chọn nhiều nhất tuần này.</p></div><span className="result-count">{filtered.length} tựa sách</span></div>
          {filtered.length ? <div className="book-grid">{filtered.map((book) => (
            <article className="book-card" key={book.id}>
              <div className="cover-wrap"><BookCover book={book}/><button className={`favorite ${favorites.includes(book.id) ? "active" : ""}`} onClick={() => setFavorites((items) => items.includes(book.id) ? items.filter((id) => id !== book.id) : [...items, book.id])} aria-label="Thêm vào yêu thích"><Heart size={18} fill={favorites.includes(book.id) ? "currentColor" : "none"}/></button>{book.premium && <span className="premium-badge"><Sparkles size={12}/> Premium</span>}</div>
              <div className="book-info"><div className="book-meta"><span>{book.format}</span><span><Star size={13} fill="currentColor"/> {book.rating}</span></div><h3><Link href={`/books/${encodeURIComponent(book.id)}`}>{book.title}</Link></h3><p>{book.author}</p>{book.id === books[0].id && <Link className="sample-read-link" href="/read/demo"><Eye size={16}/> Đọc thử online</Link>}<div className="book-buy"><div><strong>{money(book.price)}</strong>{book.oldPrice && <del>{money(book.oldPrice)}</del>}</div><button onClick={() => addToCart(book)} aria-label={`Thêm ${book.title} vào giỏ`}><ShoppingBag size={18}/></button></div></div>
            </article>
          ))}</div> : <div className="empty-state"><Search size={28}/><h3>Chưa tìm thấy cuốn sách phù hợp</h3><p>Thử từ khóa khác hoặc xem lại toàn bộ danh mục.</p><button className="button button-secondary" onClick={() => {setQuery("");setCategory("Tất cả")}}>Xem tất cả sách</button></div>}
        </section>

        <section className="premium-section" id="premium"><div className="premium-copy"><span className="eyebrow light"><Sparkles size={15}/> Capstone Premium</span><h2>Một gói đọc.<br/>Ngàn câu chuyện.</h2><p>Đọc không giới hạn kho Ebook tuyển chọn, đồng bộ tiến độ và nhận ưu đãi riêng cho thành viên.</p><ul><li><Check size={17}/> Đọc Ebook Premium không giới hạn</li><li><Check size={17}/> Không quảng cáo, không gián đoạn</li><li><Check size={17}/> Hủy bất cứ lúc nào</li></ul><button className="button button-light">Dùng thử 7 ngày <ArrowRight size={18}/></button></div><div className="premium-card"><div><span>Gói được yêu thích</span><strong>49.000<small>đ / tháng</small></strong><p>Trọn vẹn trải nghiệm đọc của bạn.</p></div><div className="mini-covers">{books.slice(1,4).map((book) => <BookCover key={book.id} book={book}/>)}</div></div></section>

        <section className="promise-section" id="about"><div><span>01</span><h3>Sách chính hãng</h3><p>Nguồn sách minh bạch từ nhà xuất bản và đối tác uy tín.</p></div><div><span>02</span><h3>Đọc ngay tức thì</h3><p>Ebook được cấp quyền tự động sau thanh toán hợp lệ.</p></div><div><span>03</span><h3>Hỗ trợ tận tâm</h3><p>Luôn có người đồng hành khi trải nghiệm chưa trọn vẹn.</p></div></section>
      </main>

      <footer className="site-footer"><Link href="/" className="brand footer-brand"><span className="brand-mark"><BookOpen size={19}/></span><span>Capstone<span>Book</span></span></Link><p>Đọc sâu hơn. Sống rộng hơn.</p><div><a href="#books">Sách</a><a href="#premium">Premium</a><Link href="/system">Kiến trúc hệ thống</Link></div><small>© 2026 CapstoneBook. Demo học thuật.</small></footer>

      <div className={`drawer-backdrop ${cartOpen ? "show" : ""}`} onClick={() => setCartOpen(false)}></div>
      <aside className={`cart-drawer ${cartOpen ? "open" : ""}`} aria-hidden={!cartOpen}>
        <header><div><span className="eyebrow">Giỏ hàng của bạn</span><h2>{cart.length} sản phẩm</h2></div><button className="icon-btn" onClick={() => setCartOpen(false)} aria-label="Đóng giỏ hàng"><X size={21}/></button></header>
        <div className="cart-items">{cart.length ? cart.map((book) => <div className="cart-item" key={book.id}><BookCover book={book}/><div><strong>{book.title}</strong><span>{book.format}</span><b>{money(book.price)}</b></div><button onClick={() => setCart((items) => items.filter((item) => item.id !== book.id))} aria-label={`Xóa ${book.title}`}><X size={17}/></button></div>) : <div className="cart-empty"><ShoppingBag size={34}/><h3>Giỏ hàng đang trống</h3><p>Một cuốn sách hay đang chờ bạn khám phá.</p><button className="button button-secondary" onClick={() => setCartOpen(false)}>Tiếp tục xem sách</button></div>}</div>
        {cart.length > 0 && <footer><div><span>Tạm tính</span><strong>{money(cartTotal)}</strong></div><p>{user ? `Thanh toán với tài khoản ${user.email}.` : "Bạn sẽ được yêu cầu đăng nhập trước khi thanh toán."}</p>{checkoutState === "error" && <p className="checkout-error">Chưa tạo được giao dịch. Kiểm tra API/PayOS rồi thử lại.</p>}<button className="button button-primary" disabled={checkoutState === "loading"} onClick={startCheckout}>{checkoutState === "loading" ? "Đang tạo mã thanh toán..." : user ? "Thanh toán qua PayOS" : "Đăng nhập để thanh toán"} <ArrowRight size={18}/></button></footer>}
      </aside>
    </div>
  );
}
