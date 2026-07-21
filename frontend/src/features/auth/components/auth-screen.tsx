"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { ArrowLeft, ArrowRight, BookOpen, Check, Eye, EyeOff, LockKeyhole, Mail, UserRound } from "lucide-react";
import { api, saveToken, type SessionUser } from "@/shared/lib/api";

type AuthResponse = { accessToken: string; user: SessionUser };

export function AuthScreen({ nextPath }: { nextPath: string }) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setLoading(true); setError("");
    const values = Object.fromEntries(new FormData(event.currentTarget));
    try {
      const result = await api<AuthResponse>(`/auth/${mode}`, { method: "POST", body: JSON.stringify(values) });
      saveToken(result.accessToken);
      window.location.assign(nextPath);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Không thể đăng nhập"); setLoading(false); }
  };

  return <main className="auth-page">
    <section className="auth-story">
      <Link href="/" className="auth-back"><ArrowLeft size={18}/> Về nhà sách</Link>
      <div className="auth-story-copy"><span className="eyebrow light">Không gian đọc của bạn</span><h1>Mang mọi câu chuyện<br/><em>đi cùng bạn.</em></h1><p>Mua Ebook, lưu tiến độ và tiếp tục đọc trên thư viện cá nhân.</p><ul><li><Check size={17}/> Quyền đọc được cấp sau thanh toán</li><li><Check size={17}/> Đồng bộ tiến độ theo tài khoản</li><li><Check size={17}/> Dữ liệu đăng nhập được mã hóa</li></ul></div>
      <div className="auth-quote"><BookOpen size={21}/><p>“Một căn phòng không có sách giống như một cơ thể không có linh hồn.”</p><span>— Cicero</span></div>
    </section>
    <section className="auth-panel">
      <Link href="/" className="brand"><span className="brand-mark"><BookOpen size={20}/></span><span>Capstone<span>Book</span></span></Link>
      <div className="auth-card">
        <span className="auth-kicker">{mode === "login" ? "Chào mừng trở lại" : "Bắt đầu hành trình"}</span>
        <h2>{mode === "login" ? "Đăng nhập" : "Tạo tài khoản"}</h2>
        <p>{mode === "login" ? "Tiếp tục thư viện và tiến độ đọc của bạn." : "Tạo tài khoản miễn phí trong chưa đầy một phút."}</p>
        <div className="auth-tabs"><button className={mode === "login" ? "active" : ""} onClick={() => {setMode("login");setError("")}}>Đăng nhập</button><button className={mode === "register" ? "active" : ""} onClick={() => {setMode("register");setError("")}}>Đăng ký</button></div>
        <form onSubmit={submit}>
          {mode === "register" && <label><span>Họ và tên</span><div><UserRound size={18}/><input name="name" minLength={2} maxLength={60} required placeholder="Nguyễn Minh Anh" autoComplete="name"/></div></label>}
          <label><span>Email</span><div><Mail size={18}/><input name="email" type="email" required placeholder="ban@example.com" autoComplete="email"/></div></label>
          <label><span>Mật khẩu</span><div><LockKeyhole size={18}/><input name="password" type={showPassword ? "text" : "password"} minLength={8} maxLength={72} required placeholder="Tối thiểu 8 ký tự" autoComplete={mode === "login" ? "current-password" : "new-password"}/><button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}>{showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}</button></div></label>
          {error && <div className="form-error" role="alert">{error}</div>}
          <button className="button button-primary auth-submit" disabled={loading}>{loading ? "Đang xử lý..." : mode === "login" ? "Đăng nhập" : "Tạo tài khoản"}<ArrowRight size={18}/></button>
        </form>
        <small>Bằng cách tiếp tục, bạn đồng ý đây là môi trường demo học thuật.</small>
      </div>
    </section>
  </main>;
}
