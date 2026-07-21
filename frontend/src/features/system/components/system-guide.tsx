import Link from "next/link";
import { ArrowLeft, BookOpen, CheckCircle2, Database, KeyRound, Server, WalletCards } from "lucide-react";

const envGroups = [
  { icon: Database, title: "Database", required: true, values: ["DATABASE_URL"], note: "Kết nối MongoDB; local override nằm trong backend/.env.local." },
  { icon: KeyRound, title: "Authentication", required: true, values: ["JWT_ACCESS_SECRET", "JWT_ACCESS_EXPIRES_IN"], note: "Ký và giới hạn thời gian sống của access token." },
  { icon: WalletCards, title: "PayOS", required: true, values: ["PAYOS_CLIENT_ID", "PAYOS_API_KEY", "PAYOS_CHECKSUM_KEY", "PAYOS_RETURN_URL", "PAYOS_CANCEL_URL"], note: "Tạo payment link và xác minh chữ ký webhook." },
  { icon: Server, title: "Runtime", required: false, values: ["NODE_ENV", "PORT", "CLIENT_URL"], note: "Cổng API, CORS và việc bật/tắt endpoint test local." },
];

export function SystemGuide() {
  return <main className="system-page">
    <header className="system-header"><Link href="/" className="brand"><span className="brand-mark"><BookOpen size={20}/></span><span>Capstone<span>Book</span></span></Link><Link href="/"><ArrowLeft size={17}/> Về nhà sách</Link></header>
    <section className="system-hero"><span className="eyebrow">System handbook</span><h1>Một source tree.<br/><em>Ranh giới rõ ràng.</em></h1><p>Frontend theo feature, backend theo domain module; dữ liệu và secret luôn đi đúng tầng chịu trách nhiệm.</p></section>
    <section className="system-section"><div className="section-intro"><span className="eyebrow">Luồng chính</span><h2>Vertical slice Ebook</h2></div><div className="system-flow">{["Đăng nhập", "Chi tiết sách", "Order", "PayOS / Local", "ReadingRight", "Thư viện", "Reader"].map((step,index)=><div key={step}><span>{String(index+1).padStart(2,"0")}</span><strong>{step}</strong>{index<6 && <i>→</i>}</div>)}</div></section>
    <section className="system-section"><div className="section-intro"><span className="eyebrow">Environment</span><h2>Biến nào dùng ở đâu?</h2><p>Frontend không bao giờ nhận MongoDB URI, JWT secret hoặc khóa PayOS.</p></div><div className="env-grid">{envGroups.map(({icon:Icon,...group})=><article key={group.title}><header><span><Icon size={20}/></span><div><h3>{group.title}</h3><small>{group.required ? "Bắt buộc" : "Có mặc định"}</small></div></header><div>{group.values.map(value=><code key={value}>{value}</code>)}</div><p>{group.note}</p></article>)}</div></section>
    <section className="system-rule"><CheckCircle2 size={24}/><div><strong>Quy tắc cấp quyền</strong><p>Redirect từ PayOS không cấp Ebook. Chỉ webhook đã xác minh chữ ký và đối chiếu số tiền mới tạo ReadingRight.</p></div></section>
  </main>;
}
