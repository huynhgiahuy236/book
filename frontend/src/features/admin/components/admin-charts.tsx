"use client";
import { useEffect, useState } from "react";
import { api } from "@/shared/lib/api";
type Analytics = {
  revenue: Array<{ _id: string; value: number }>;
  statuses: Array<{ _id: string; value: number }>;
  days: number;
};
export function AdminCharts() {
  const [days, setDays] = useState(30);
  const [data, setData] = useState<Analytics>({
    revenue: [],
    statuses: [],
    days,
  });
  useEffect(() => {
    void api<Analytics>(`/admin/analytics?days=${days}`, {}, true).then(
      setData,
    );
  }, [days]);
  const max = Math.max(1, ...data.revenue.map((x) => x.value));
  const total = Math.max(
    1,
    data.statuses.reduce((s, x) => s + x.value, 0),
  );
  return (
    <section className="admin-charts">
      <article className="admin-panel">
        <header>
          <div>
            <span className="eyebrow">Doanh thu</span>
            <h2>Biến động theo ngày</h2>
          </div>
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
          >
            <option value={7}>7 ngày</option>
            <option value={30}>30 ngày</option>
            <option value={90}>3 tháng</option>
          </select>
        </header>
        <div className="revenue-bars" role="img" aria-label="Biểu đồ doanh thu">
          {data.revenue.map((item) => (
            <i
              key={item._id}
              style={{ height: `${Math.max(4, (item.value / max) * 100)}%` }}
              title={`${item._id}: ${new Intl.NumberFormat("vi-VN").format(item.value)} ₫`}
            >
              <span>{item._id.slice(5)}</span>
            </i>
          ))}
        </div>
      </article>
      <article className="admin-panel">
        <header>
          <div>
            <span className="eyebrow">Đơn hàng</span>
            <h2>Trạng thái</h2>
          </div>
        </header>
        <div className="status-chart">
          {data.statuses.map((item) => (
            <div key={item._id}>
              <span>{item._id}</span>
              <i>
                <b style={{ width: `${(item.value / total) * 100}%` }} />
              </i>
              <strong>{item.value}</strong>
            </div>
          ))}
        </div>
      </article>
    </section>
  );
}
