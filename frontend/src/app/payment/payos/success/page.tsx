"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, BookOpen, CheckCircle2, Clock3, Library, RefreshCw } from "lucide-react";
import { api } from "@/shared/lib/api";

type PaymentStatus = "PENDING_PAYMENT" | "PAID" | "CANCELLED" | "EXPIRED" | "FAILED";

export default function PayOSSuccessPage() {
  const [status, setStatus] = useState<PaymentStatus>("PENDING_PAYMENT");
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const orderCode = new URLSearchParams(window.location.search).get("orderCode");
    if (!orderCode) {
      const timer = window.setTimeout(() => setChecking(false), 0);
      return () => window.clearTimeout(timer);
    }
    let attempts = 0;
    const check = async () => {
      attempts += 1;
      const result = await api<{ status: PaymentStatus }>(`/payments/payos/${encodeURIComponent(orderCode)}`, {}, true).catch(() => null);
      if (result) setStatus(result.status);
      if (result?.status === "PAID" || attempts >= 15) { setChecking(false); return; }
      window.setTimeout(() => void check(), 2000);
    };
    void check();
  }, []);

  const paid = status === "PAID";
  return <main className="payment-page"><Link href="/" className="brand payment-brand"><span className="brand-mark"><BookOpen size={20}/></span><span>Capstone<span>Book</span></span></Link><section className="payment-card"><div className={`status-icon ${paid ? "success" : "pending"}`}>{paid ? <CheckCircle2 size={30}/> : <Clock3 size={30}/>}</div><span className="eyebrow">PayOS · {paid ? "Đã xác nhận" : "Đang đối soát"}</span><h1>{paid ? <>Thanh toán thành công.<br/>Sách đã vào thư viện.</> : <>Chúng tôi đang xác nhận<br/>giao dịch của bạn.</>}</h1><p>{paid ? "Webhook hợp lệ đã được backend kiểm tra và cấp quyền đọc." : "Trang quay về không tự đánh dấu thanh toán. Hệ thống đang chờ webhook có chữ ký hợp lệ từ PayOS."}</p><div className="status-steps"><div className="done"><CheckCircle2 size={18}/><span><b>Đã quay về CapstoneBook</b><small>Redirect đã được tiếp nhận</small></span></div><div className={paid ? "done" : "active"}>{checking ? <RefreshCw className="spin" size={18}/> : <CheckCircle2 size={18}/>}<span><b>{paid ? "PayOS đã xác nhận" : "Đang chờ ngân hàng xác nhận"}</b><small>{status}</small></span></div><div className={paid ? "done" : ""}><Library size={18}/><span><b>Cấp quyền và hoàn tất</b><small>Ebook xuất hiện trong thư viện sau webhook</small></span></div></div><div className="payment-actions"><Link className="button button-primary" href="/library">Kiểm tra thư viện <ArrowRight size={18}/></Link><Link className="text-button" href="/#books">Tiếp tục xem sách</Link></div></section></main>;
}
