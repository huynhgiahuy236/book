"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  Check,
  ChevronLeft,
  ChevronRight,
  Eye,
  Heart,
  Info,
  Library,
  LogIn,
  Menu,
  Search,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Star,
  X,
} from "lucide-react";
import {
  bookFromApi,
  books as fallbackBooks,
  money,
  type ApiBook,
  type Book,
} from "@/features/catalog/lib/books";
import { api, getCurrentUser, type SessionUser } from "@/shared/lib/api";
import { BookCover } from "./book-cover";

export function Storefront() {
  const [catalog, setCatalog] = useState<Book[]>(fallbackBooks);
  const [category, setCategory] = useState("Tất cả");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [featuredOnline, setFeaturedOnline] = useState<Book[]>([]);
  const [cart, setCart] = useState<Book[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [checkoutState, setCheckoutState] = useState<
    "idle" | "loading" | "error"
  >("idle");
  const [user, setUser] = useState<SessionUser | null>(null);
  const [library, setLibrary] = useState<
    Record<string, { currentPage: number }>
  >({});
  const checkoutRequestId = useRef<string | null>(null);
  const modalRef = useRef<HTMLElement>(null);
  const modalCloseRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    void getCurrentUser().then((profile) => {
      setUser(profile);
      if (profile) {
        void api<Array<{ bookId: string }>>("/favorites", {}, true)
          .then((items) => setFavorites(items.map((item) => item.bookId)))
          .catch(() => undefined);
        void api<
          Array<{ book: { id: string }; progress: { currentPage?: number } }>
        >("/library", {}, true)
          .then((items) =>
            setLibrary(
              Object.fromEntries(
                items.map((item) => [
                  item.book.id,
                  { currentPage: item.progress.currentPage ?? 1 },
                ]),
              ),
            ),
          )
          .catch(() => undefined);
      }
    });
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const params = new URLSearchParams({ page: String(page), limit: "10" });
      if (query.trim()) params.set("query", query.trim());
      if (category !== "Tất cả") params.set("category", category);
      void api<{ items: ApiBook[]; totalPages: number; totalItems: number }>(
        `/books?${params}`,
      )
        .then((result) => {
          const items = result.items.map(bookFromApi);
          setCatalog(items);
          setTotalPages(result.totalPages);
          setTotalItems(result.totalItems);
          if (page === 1 && category === "Tất cả" && !query.trim())
            setFeaturedOnline(
              items.filter((book) => book.isReadableOnline).slice(0, 2),
            );
        })
        .catch(() => undefined);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [category, page, query]);

  useEffect(() => {
    if (!selectedBook) return;
    previousFocusRef.current = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    const handleModalKeyboard = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSelectedBook(null);
        return;
      }
      if (event.key !== "Tab" || !modalRef.current) return;
      const focusable = Array.from(
        modalRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      );
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable.at(-1)!;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleModalKeyboard);
    window.requestAnimationFrame(() => modalCloseRef.current?.focus());
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleModalKeyboard);
      previousFocusRef.current?.focus();
    };
  }, [selectedBook]);

  const filtered = catalog;
  const onlineBooks = featuredOnline;
  const canRead = (book: Book) =>
    Boolean(
      user &&
      (user.role === "ADMIN" || book.accessType === "FREE" || library[book.id]),
    );
  const readCta = (book: Book) =>
    !user
      ? "Đăng nhập để đọc"
      : canRead(book)
        ? library[book.id]?.currentPage > 1
          ? `Tiếp tục đọc · Trang ${library[book.id].currentPage}`
          : "Đọc ngay"
        : "Xem chi tiết";
  const readHref = (book: Book) =>
    !user
      ? `/auth?next=/read/${encodeURIComponent(book.id)}`
      : canRead(book)
        ? `/read/${encodeURIComponent(book.id)}`
        : `/books/${encodeURIComponent(book.id)}`;

  const addToCart = (book: Book) => {
    setCart((current) =>
      current.some((item) => item.id === book.id)
        ? current
        : [...current, book],
    );
    setCartOpen(true);
  };

  const toggleFavorite = async (bookId: string) => {
    if (!user) {
      window.location.assign(`/auth?next=/#books`);
      return;
    }
    const wasFavorite = favorites.includes(bookId);
    setFavorites((items) =>
      wasFavorite ? items.filter((id) => id !== bookId) : [...items, bookId],
    );
    try {
      await api(
        `/favorites/${encodeURIComponent(bookId)}`,
        { method: wasFavorite ? "DELETE" : "POST" },
        true,
      );
    } catch {
      setFavorites((items) =>
        wasFavorite
          ? [...new Set([...items, bookId])]
          : items.filter((id) => id !== bookId),
      );
    }
  };

  const cartTotal = cart.reduce((sum, book) => sum + book.price, 0);

  const startCheckout = async () => {
    if (!user) {
      window.location.assign("/auth?next=/");
      return;
    }
    setCheckoutState("loading");
    try {
      const payment = await api<{ checkoutUrl: string }>(
        "/payments/payos",
        {
          method: "POST",
          body: JSON.stringify({
            bookIds: cart.map((book) => book.id),
            clientRequestId: (checkoutRequestId.current ??=
              crypto.randomUUID()),
          }),
        },
        true,
      );
      window.location.assign(payment.checkoutUrl);
    } catch {
      setCheckoutState("error");
    }
  };

  return (
    <div className="site-shell">
      <div className="announcement">
        <span>Miễn phí vận chuyển cho đơn từ 299.000đ</span>
        <span className="announcement-side">
          Ebook đọc ngay · Thanh toán an toàn qua PayOS
        </span>
      </div>
      <header className="site-header">
        <Link href="/" className="brand" aria-label="CapstoneBook trang chủ">
          <span className="brand-mark">
            <BookOpen size={20} />
          </span>
          <span>
            Capstone<span>Book</span>
          </span>
        </Link>
        <nav
          className={`main-nav ${menuOpen ? "is-open" : ""}`}
          aria-label="Điều hướng chính"
        >
          <Link href="#books">Sách</Link>
          <Link href="/read/demo">Đọc thử</Link>
          <Link href="/library">Thư viện</Link>
          <Link href="#premium">Premium</Link>
          <Link href="#about">Về chúng tôi</Link>
        </nav>
        <div className="header-actions">
          <label className="search-field">
            <Search size={18} />
            <input
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setPage(1);
              }}
              placeholder="Tìm sách, tác giả..."
              aria-label="Tìm sách"
            />
          </label>
          {user?.role === "ADMIN" && (
            <Link className="admin-entry" href="/admin">
              <ShieldCheck size={18} />
              <span>Quản trị</span>
            </Link>
          )}
          <Link
            className="icon-btn account-btn"
            href={user ? "/library" : "/auth"}
            aria-label={user ? `Thư viện của ${user.name}` : "Đăng nhập"}
          >
            {user ? <Library size={20} /> : <LogIn size={20} />}
          </Link>
          <button
            className="icon-btn cart-btn"
            onClick={() => setCartOpen(true)}
            aria-label={`Giỏ hàng có ${cart.length} sản phẩm`}
          >
            <ShoppingBag size={20} />
            {cart.length > 0 && <span>{cart.length}</span>}
          </button>
          <button
            className="icon-btn menu-btn"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Mở menu"
          >
            {menuOpen ? <X size={21} /> : <Menu size={21} />}
          </button>
        </div>
      </header>

      <main>
        <section className="hero-section">
          <div className="hero-copy">
            <span className="eyebrow">
              <Sparkles size={15} /> Bộ sưu tập được tuyển chọn
            </span>
            <h1>
              Mỗi trang sách,
              <br />
              <em>một thế giới mới.</em>
            </h1>
            <p>
              Khám phá những cuốn sách đáng đọc nhất, sở hữu bản in tinh tế hoặc
              bắt đầu Ebook chỉ trong vài giây.
            </p>
            <div className="hero-actions">
              <a className="button button-primary" href="#books">
                Khám phá ngay <ArrowRight size={18} />
              </a>
              <Link className="text-button" href="/read/demo">
                Đọc Ebook mẫu <ChevronRight size={17} />
              </Link>
            </div>
            <div className="trust-row">
              <span>
                <Check size={15} /> Hơn 12.000 đầu sách
              </span>
              <span>
                <Check size={15} /> Bản quyền chính hãng
              </span>
            </div>
          </div>
          <div className="hero-visual">
            <div className="hero-orb orb-one"></div>
            <div className="hero-orb orb-two"></div>
            <div className="book-stack">
              <div className="stack-back">
                <BookCover book={catalog[1] ?? catalog[0]} large />
              </div>
              <div className="stack-front">
                <BookCover book={catalog[0]} large />
              </div>
            </div>
            <div className="floating-note">
              <span className="avatar-group">
                <i>A</i>
                <i>M</i>
                <i>K</i>
              </span>
              <p>
                <strong>4.9/5</strong>
                <br />
                từ cộng đồng đọc
              </p>
            </div>
          </div>
        </section>

        {onlineBooks.length > 0 && (
          <section
            className="online-books-section"
            aria-labelledby="online-books-title"
          >
            <div className="section-head">
              <div className="section-intro">
                <span className="eyebrow">
                  <Eye size={15} /> Thư viện R2
                </span>
                <h2 id="online-books-title">Đọc sách trực tuyến</h2>
                <p>
                  Những tựa sách đã có bản đọc bảo vệ và sẵn sàng trên hệ thống.
                </p>
              </div>
            </div>
            <div className="online-books-grid">
              {onlineBooks.map((book) => (
                <article key={book.id} className="online-book-card">
                  <div className="online-book-cover">
                    <BookCover book={book} />
                    <span>
                      <BookOpen size={13} /> Có bản đọc online
                    </span>
                  </div>
                  <div>
                    <span className="eyebrow">
                      {book.accessType === "FREE"
                        ? "Miễn phí"
                        : library[book.id]
                          ? "Đã sở hữu"
                          : book.accessType === "PREMIUM"
                            ? "Premium"
                            : "Ebook"}
                    </span>
                    <h3>{book.title}</h3>
                    <p>{book.author}</p>
                    <div className="online-rating">
                      <Star size={14} fill="currentColor" />{" "}
                      {book.rating || "Mới"}
                    </div>
                    <Link
                      className="button button-primary"
                      href={readHref(book)}
                    >
                      <Eye size={17} />
                      {readCta(book)}
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        <section className="category-section" aria-label="Danh mục sách">
          <div className="section-intro compact">
            <span className="eyebrow">Đọc theo cảm hứng</span>
            <h2>Hôm nay bạn muốn đọc gì?</h2>
          </div>
          <div className="category-list">
            {[
              "Tất cả",
              ...Array.from(
                new Set(catalog.map((book) => book.category)),
              ).slice(0, 6),
            ].map((item) => (
              <button
                key={item}
                className={category === item ? "active" : ""}
                onClick={() => {
                  setCategory(item);
                  setPage(1);
                }}
              >
                {item}
              </button>
            ))}
          </div>
        </section>

        <section className="books-section" id="books">
          <div className="section-head">
            <div className="section-intro">
              <span className="eyebrow">Được yêu thích</span>
              <h2>Sách dành cho bạn</h2>
              <p>
                Những tựa sách được độc giả CapstoneBook lựa chọn nhiều nhất
                tuần này.
              </p>
            </div>
            <span className="result-count">{totalItems} tựa sách</span>
          </div>
          {filtered.length ? (
            <>
              <div className="book-grid">
                {filtered.map((book) => (
                  <article className="book-card" key={book.id}>
                    <div className="cover-wrap">
                      <button
                        className="book-preview-trigger"
                        onClick={() => setSelectedBook(book)}
                        aria-label={`Xem nhanh chi tiết ${book.title}`}
                      >
                        <BookCover book={book} />
                        <span>
                          <Info size={16} /> Xem chi tiết
                        </span>
                      </button>
                      <button
                        className={`favorite ${favorites.includes(book.id) ? "active" : ""}`}
                        onClick={() => void toggleFavorite(book.id)}
                        aria-label={
                          favorites.includes(book.id)
                            ? "Bỏ khỏi yêu thích"
                            : "Thêm vào yêu thích"
                        }
                      >
                        <Heart
                          size={18}
                          fill={
                            favorites.includes(book.id)
                              ? "currentColor"
                              : "none"
                          }
                        />
                      </button>
                      {book.premium && (
                        <span className="premium-badge">
                          <Sparkles size={12} /> Premium
                        </span>
                      )}
                    </div>
                    <div className="book-info">
                      <div className="book-meta">
                        <span>{book.format}</span>
                        <span>
                          <Star size={13} fill="currentColor" />{" "}
                          {book.rating || "Mới"}
                        </span>
                      </div>
                      <h3>
                        <button
                          className="book-title-button"
                          onClick={() => setSelectedBook(book)}
                        >
                          {book.title}
                        </button>
                      </h3>
                      <p>{book.author}</p>
                      {book.isReadableOnline && (
                        <Link
                          className="sample-read-link"
                          href={readHref(book)}
                        >
                          <Eye size={16} />
                          {readCta(book)}
                        </Link>
                      )}
                      <div className="book-buy">
                        <div>
                          <strong>{money(book.price)}</strong>
                          {book.oldPrice && <del>{money(book.oldPrice)}</del>}
                        </div>
                        <button
                          onClick={() => addToCart(book)}
                          aria-label={`Thêm ${book.title} vào giỏ`}
                        >
                          <ShoppingBag size={18} />
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
              <nav className="catalog-pagination" aria-label="Phân trang sách">
                <button
                  disabled={page === 1}
                  onClick={() => {
                    setPage((value) => value - 1);
                    document.querySelector("#books")?.scrollIntoView();
                  }}
                >
                  <ChevronLeft size={17} /> Trước
                </button>
                <span>
                  Trang <strong>{page}</strong> / {totalPages}
                </span>
                <button
                  disabled={page >= totalPages}
                  onClick={() => {
                    setPage((value) => value + 1);
                    document.querySelector("#books")?.scrollIntoView();
                  }}
                >
                  Sau <ChevronRight size={17} />
                </button>
              </nav>
            </>
          ) : (
            <div className="empty-state">
              <Search size={28} />
              <h3>Chưa tìm thấy cuốn sách phù hợp</h3>
              <p>Thử từ khóa khác hoặc xem lại toàn bộ danh mục.</p>
              <button
                className="button button-secondary"
                onClick={() => {
                  setQuery("");
                  setCategory("Tất cả");
                  setPage(1);
                }}
              >
                Xem tất cả sách
              </button>
            </div>
          )}
        </section>

        <section className="premium-section" id="premium">
          <div className="premium-copy">
            <span className="eyebrow light">
              <Sparkles size={15} /> Capstone Premium
            </span>
            <h2>
              Một gói đọc.
              <br />
              Ngàn câu chuyện.
            </h2>
            <p>
              Đọc không giới hạn kho Ebook tuyển chọn, đồng bộ tiến độ và nhận
              ưu đãi riêng cho thành viên.
            </p>
            <ul>
              <li>
                <Check size={17} /> Đọc Ebook Premium không giới hạn
              </li>
              <li>
                <Check size={17} /> Không quảng cáo, không gián đoạn
              </li>
              <li>
                <Check size={17} /> Hủy bất cứ lúc nào
              </li>
            </ul>
            <button className="button button-light">
              Dùng thử 7 ngày <ArrowRight size={18} />
            </button>
          </div>
          <div className="premium-card">
            <div>
              <span>Gói được yêu thích</span>
              <strong>
                49.000<small>đ / tháng</small>
              </strong>
              <p>Trọn vẹn trải nghiệm đọc của bạn.</p>
            </div>
            <div className="mini-covers">
              {catalog.slice(1, 4).map((book) => (
                <BookCover key={book.id} book={book} />
              ))}
            </div>
          </div>
        </section>

        <section className="promise-section" id="about">
          <div>
            <span>01</span>
            <h3>Sách chính hãng</h3>
            <p>Nguồn sách minh bạch từ nhà xuất bản và đối tác uy tín.</p>
          </div>
          <div>
            <span>02</span>
            <h3>Đọc ngay tức thì</h3>
            <p>Ebook được cấp quyền tự động sau thanh toán hợp lệ.</p>
          </div>
          <div>
            <span>03</span>
            <h3>Hỗ trợ tận tâm</h3>
            <p>Luôn có người đồng hành khi trải nghiệm chưa trọn vẹn.</p>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <Link href="/" className="brand footer-brand">
          <span className="brand-mark">
            <BookOpen size={19} />
          </span>
          <span>
            Capstone<span>Book</span>
          </span>
        </Link>
        <p>Đọc sâu hơn. Sống rộng hơn.</p>
        <div>
          <a href="#books">Sách</a>
          <a href="#premium">Premium</a>
          <Link href="/system">Kiến trúc hệ thống</Link>
          {user?.role === "ADMIN" && <Link href="/admin">Quản trị</Link>}
        </div>
        <small>© 2026 CapstoneBook. Demo học thuật.</small>
      </footer>

      {selectedBook && (
        <div
          className="book-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setSelectedBook(null);
          }}
        >
          <section
            ref={modalRef}
            className="book-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="book-modal-title"
            aria-describedby="book-modal-description"
          >
            <button
              ref={modalCloseRef}
              className="book-modal-close"
              onClick={() => setSelectedBook(null)}
              aria-label="Đóng chi tiết sách"
            >
              <X size={22} />
            </button>
            <div className="book-modal-visual">
              <div className="book-modal-glow" aria-hidden="true" />
              <BookCover book={selectedBook} large />
              {selectedBook.readingEnabled && (
                <span className="book-modal-online">
                  <span /> Sẵn sàng đọc online
                </span>
              )}
            </div>
            <div className="book-modal-content">
              <div className="book-modal-badges">
                <span>{selectedBook.category}</span>
                <span>{selectedBook.format}</span>
                {selectedBook.premium && (
                  <span className="is-premium">
                    <Sparkles size={12} /> Premium
                  </span>
                )}
              </div>
              <h2 id="book-modal-title">{selectedBook.title}</h2>
              <p className="book-modal-author">
                Tác giả <strong>{selectedBook.author}</strong>
              </p>
              <div className="book-modal-rating">
                <Star size={17} fill="currentColor" />
                <strong>{selectedBook.rating || "Mới"}</strong>
                <span>Đánh giá từ cộng đồng CapstoneBook</span>
              </div>
              <p id="book-modal-description" className="book-modal-description">
                {selectedBook.description ||
                  "Một tựa sách được tuyển chọn cho thư viện CapstoneBook, với thông tin xuất bản minh bạch và trải nghiệm mua hoặc đọc online liền mạch."}
              </p>
              <dl className="book-modal-facts">
                <div>
                  <dt>Nhà xuất bản</dt>
                  <dd>{selectedBook.publisher || "Đang cập nhật"}</dd>
                </div>
                <div>
                  <dt>Quyền truy cập</dt>
                  <dd>
                    {selectedBook.accessType === "FREE"
                      ? "Miễn phí"
                      : selectedBook.accessType === "PREMIUM"
                        ? "Premium"
                        : "Mua một lần"}
                  </dd>
                </div>
                <div>
                  <dt>Đọc online</dt>
                  <dd>
                    {selectedBook.readingEnabled
                      ? "Có bản PDF bảo vệ"
                      : "Chưa hỗ trợ"}
                  </dd>
                </div>
              </dl>
              <div className="book-modal-purchase">
                <div>
                  <span>Giá Ebook</span>
                  <strong>{money(selectedBook.price)}</strong>
                  {selectedBook.oldPrice && (
                    <del>{money(selectedBook.oldPrice)}</del>
                  )}
                </div>
                <button
                  className="button button-secondary"
                  onClick={() => {
                    addToCart(selectedBook);
                    setSelectedBook(null);
                  }}
                >
                  <ShoppingBag size={18} /> Thêm vào giỏ
                </button>
              </div>
              <div className="book-modal-actions">
                {selectedBook.isReadableOnline && (
                  <Link
                    className="button button-primary"
                    href={readHref(selectedBook)}
                    onClick={() => setSelectedBook(null)}
                  >
                    <Eye size={18} />
                    {readCta(selectedBook)}
                  </Link>
                )}
                <Link
                  className="button button-secondary"
                  href={`/books/${encodeURIComponent(selectedBook.id)}`}
                  onClick={() => setSelectedBook(null)}
                >
                  Trang chi tiết <ArrowRight size={18} />
                </Link>
              </div>
            </div>
          </section>
        </div>
      )}

      <div
        className={`drawer-backdrop ${cartOpen ? "show" : ""}`}
        onClick={() => setCartOpen(false)}
      ></div>
      <aside
        className={`cart-drawer ${cartOpen ? "open" : ""}`}
        aria-hidden={!cartOpen}
      >
        <header>
          <div>
            <span className="eyebrow">Giỏ hàng của bạn</span>
            <h2>{cart.length} sản phẩm</h2>
          </div>
          <button
            className="icon-btn"
            onClick={() => setCartOpen(false)}
            aria-label="Đóng giỏ hàng"
          >
            <X size={21} />
          </button>
        </header>
        <div className="cart-items">
          {cart.length ? (
            cart.map((book) => (
              <div className="cart-item" key={book.id}>
                <BookCover book={book} />
                <div>
                  <strong>{book.title}</strong>
                  <span>{book.format}</span>
                  <b>{money(book.price)}</b>
                </div>
                <button
                  onClick={() =>
                    setCart((items) =>
                      items.filter((item) => item.id !== book.id),
                    )
                  }
                  aria-label={`Xóa ${book.title}`}
                >
                  <X size={17} />
                </button>
              </div>
            ))
          ) : (
            <div className="cart-empty">
              <ShoppingBag size={34} />
              <h3>Giỏ hàng đang trống</h3>
              <p>Một cuốn sách hay đang chờ bạn khám phá.</p>
              <button
                className="button button-secondary"
                onClick={() => setCartOpen(false)}
              >
                Tiếp tục xem sách
              </button>
            </div>
          )}
        </div>
        {cart.length > 0 && (
          <footer>
            <div>
              <span>Tạm tính</span>
              <strong>{money(cartTotal)}</strong>
            </div>
            <p>
              {user
                ? `Thanh toán với tài khoản ${user.email}.`
                : "Bạn sẽ được yêu cầu đăng nhập trước khi thanh toán."}
            </p>
            {checkoutState === "error" && (
              <p className="checkout-error">
                Chưa tạo được giao dịch. Kiểm tra API/PayOS rồi thử lại.
              </p>
            )}
            <button
              className="button button-primary"
              disabled={checkoutState === "loading"}
              onClick={startCheckout}
            >
              {checkoutState === "loading"
                ? "Đang tạo mã thanh toán..."
                : user
                  ? "Thanh toán qua PayOS"
                  : "Đăng nhập để thanh toán"}{" "}
              <ArrowRight size={18} />
            </button>
          </footer>
        )}
      </aside>
    </div>
  );
}
