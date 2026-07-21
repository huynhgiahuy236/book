import Link from "next/link";
import { ArrowRight, BookOpen, CheckCircle2, Clock3, Library } from "lucide-react";

export const metadata = { title: "Đang xác nhận thanh toán" };

export default function PayOSSuccessPage() {
  return (
    <main className="payment-page">
      <Link href="/" className="brand payment-brand"><span className="brand-mark"><BookOpen size={20}/></span><span>Capstone<span>Book</span></span></Link>
      <section className="payment-card">
        <div className="status-icon pending"><Clock3 size={30}/></div>
        <span className="eyebrow">PayOS · Đang đối soát</span>
        <h1>Chúng tôi đang xác nhận<br/>giao dịch của bạn.</h1>
        <p>Trang này chỉ là tín hiệu quay về từ cổng thanh toán. Quyền đọc hoặc đơn hàng sẽ được kích hoạt sau khi máy chủ nhận webhook hợp lệ từ PayOS.</p>
        <div className="status-steps"><div className="done"><CheckCircle2 size={18}/><span><b>Đã quay về CapstoneBook</b><small>Thông tin redirect đã được tiếp nhận</small></span></div><div className="active"><span className="pulse"></span><span><b>Đang chờ ngân hàng xác nhận</b><small>Thường chỉ mất vài giây</small></span></div><div><Library size={18}/><span><b>Cấp quyền và hoàn tất</b><small>Ebook sẽ xuất hiện trong thư viện</small></span></div></div>
        <div className="payment-actions"><Link className="button button-primary" href="/library">Kiểm tra thư viện <ArrowRight size={18}/></Link><Link className="text-button" href="/#books">Tiếp tục xem sách</Link></div>
      </section>
      <p className="payment-help">Nếu trạng thái chưa thay đổi sau vài phút, hãy kiểm tra lịch sử giao dịch hoặc liên hệ hỗ trợ.</p>
    </main>
  );
}
