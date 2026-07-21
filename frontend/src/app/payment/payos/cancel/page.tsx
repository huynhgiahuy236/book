import Link from "next/link";
import { ArrowLeft, BookOpen, CircleX } from "lucide-react";

export const metadata = { title: "Thanh toán đã hủy" };

export default function PayOSCancelPage() {
  return (
    <main className="payment-page">
      <Link href="/" className="brand payment-brand"><span className="brand-mark"><BookOpen size={20}/></span><span>Capstone<span>Book</span></span></Link>
      <section className="payment-card compact-card">
        <div className="status-icon cancelled"><CircleX size={30}/></div>
        <span className="eyebrow">Thanh toán chưa hoàn tất</span>
        <h1>Bạn đã rời khỏi<br/>trang thanh toán.</h1>
        <p>Không sao cả. Sản phẩm vẫn ở trong giỏ để bạn xem lại. CapstoneBook sẽ kiểm tra trạng thái với PayOS trước khi xác định giao dịch đã hủy.</p>
        <div className="notice-box"><b>Bạn chưa bị tính phí từ phía CapstoneBook.</b><span>Nếu tài khoản ngân hàng đã trừ tiền, đừng thanh toán lại ngay — hãy chờ hệ thống đối soát.</span></div>
        <div className="payment-actions"><Link className="button button-primary" href="/"><ArrowLeft size={18}/> Quay lại cửa hàng</Link></div>
      </section>
    </main>
  );
}
