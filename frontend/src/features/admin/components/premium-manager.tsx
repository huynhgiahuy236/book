"use client";
import { useEffect, useState, type FormEvent } from "react";
import { Plus, RefreshCw } from "lucide-react";
import { api } from "@/shared/lib/api";
type Plan = {
  _id: string;
  name: string;
  slug: string;
  price: number;
  durationDays: number;
  status: string;
  description: string;
};
type Subscription = {
  _id: string;
  userId: string;
  planName: string;
  startsAt: string;
  endsAt: string;
  status: string;
};
export function PremiumManager() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [open, setOpen] = useState(false);
  const load = () =>
    Promise.all([
      api<Plan[]>("/admin/premium/plans", {}, true),
      api<Subscription[]>("/admin/premium/subscriptions", {}, true),
    ]).then(([p, s]) => {
      setPlans(p);
      setSubscriptions(s);
    });
  useEffect(() => {
    void Promise.resolve().then(load);
  }, []);
  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const v = Object.fromEntries(new FormData(e.currentTarget));
    await api(
      "/admin/premium/plans",
      {
        method: "POST",
        body: JSON.stringify({
          ...v,
          price: Number(v.price),
          durationDays: Number(v.durationDays),
        }),
      },
      true,
    );
    setOpen(false);
    await load();
  };
  return (
    <main className="admin-subpage">
      <header>
        <span className="eyebrow">Doanh thu định kỳ</span>
        <h1>Gói Premium</h1>
        <p>Quản lý gói, thời hạn và subscription còn hiệu lực.</p>
      </header>
      <section className="admin-data-card">
        <div className="admin-data-tools">
          <button onClick={() => setOpen(!open)}>
            <Plus size={16} /> Tạo gói
          </button>
          <button onClick={() => void load()}>
            <RefreshCw size={16} /> Làm mới
          </button>
        </div>
        {open && (
          <form className="gift-form" onSubmit={(e) => void submit(e)}>
            <label>
              Tên
              <input name="name" required />
            </label>
            <label>
              Slug
              <input name="slug" required pattern="[a-z0-9-]+" />
            </label>
            <label>
              Giá
              <input name="price" type="number" min="0" required />
            </label>
            <label>
              Số ngày
              <input name="durationDays" type="number" min="1" required />
            </label>
            <label>
              Trạng thái
              <select name="status">
                <option value="ACTIVE">Hoạt động</option>
                <option value="INACTIVE">Tạm ẩn</option>
              </select>
            </label>
            <label className="wide">
              Mô tả
              <textarea name="description" />
            </label>
            <button>Lưu gói</button>
          </form>
        )}
        <h2>Các gói</h2>
        <div className="premium-plans">
          {plans.map((p) => (
            <article key={p._id}>
              <strong>{p.name}</strong>
              <b>{new Intl.NumberFormat("vi-VN").format(p.price)} ₫</b>
              <span>{p.durationDays} ngày</span>
              <em>{p.status}</em>
            </article>
          ))}
        </div>
        <h2>Đăng ký gần đây</h2>
        <div className="admin-responsive-table">
          {subscriptions.map((s) => (
            <div className="admin-data-row premium" key={s._id}>
              <span>{s.userId}</span>
              <span>{s.planName}</span>
              <span>{new Date(s.startsAt).toLocaleDateString("vi-VN")}</span>
              <span>{new Date(s.endsAt).toLocaleDateString("vi-VN")}</span>
              <span>{s.status}</span>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
