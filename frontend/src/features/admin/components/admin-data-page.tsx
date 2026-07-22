"use client";
import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, RefreshCw, Search } from "lucide-react";
import { api } from "@/shared/lib/api";

type Row = Record<string, unknown> & {
  _id?: string;
  status?: string;
  orderCode?: number;
};
type Page = {
  items: Row[];
  page: number;
  totalPages: number;
  totalItems: number;
};
const configs = {
  orders: {
    title: "Đơn hàng & PayOS",
    description: "Theo dõi thanh toán, trạng thái xử lý và quà tặng theo đơn.",
    endpoint: "/admin/orders",
    fields: [
      ["orderCode", "Mã đơn"],
      ["userId", "Người dùng"],
      ["amount", "Số tiền"],
      ["status", "Trạng thái"],
      ["provider", "Thanh toán"],
    ],
  },
  users: {
    title: "Người dùng",
    description: "Tài khoản, nhà cung cấp đăng nhập, vai trò và trạng thái.",
    endpoint: "/admin/users",
    fields: [
      ["name", "Tên"],
      ["email", "Email"],
      ["provider", "Đăng nhập"],
      ["role", "Vai trò"],
      ["status", "Trạng thái"],
    ],
  },
  rights: {
    title: "Quyền đọc",
    description: "Quyền sở hữu ebook từ mua hàng hoặc cấp thủ công.",
    endpoint: "/admin/rights",
    fields: [
      ["userId", "Người dùng"],
      ["bookId", "Sách"],
      ["source", "Nguồn"],
      ["status", "Trạng thái"],
      ["orderCode", "Đơn hàng"],
    ],
  },
  progress: {
    title: "Tiến độ đọc",
    description: "Trang hiện tại, tỷ lệ hoàn thành và hoạt động gần nhất.",
    endpoint: "/admin/progress",
    fields: [
      ["userId", "Người dùng"],
      ["bookId", "Sách"],
      ["currentPage", "Trang"],
      ["totalPages", "Tổng trang"],
      ["progressPercentage", "Tiến độ"],
    ],
  },
  reviews: {
    title: "Đánh giá",
    description: "Kiểm duyệt đánh giá và nội dung từ độc giả.",
    endpoint: "/admin/reviews",
    fields: [
      ["authorName", "Người viết"],
      ["bookId", "Sách"],
      ["rating", "Điểm"],
      ["content", "Nội dung"],
      ["status", "Trạng thái"],
    ],
  },
  returns: {
    title: "Đổi trả & hoàn tiền",
    description: "Duyệt yêu cầu, hoàn kho quà và lưu lịch sử xử lý.",
    endpoint: "/admin/returns",
    fields: [
      ["orderCode", "Đơn hàng"],
      ["userId", "Người dùng"],
      ["reason", "Lý do"],
      ["status", "Trạng thái"],
      ["adminNote", "Ghi chú"],
    ],
  },
  audit: {
    title: "Nhật ký hệ thống",
    description: "Theo dõi các thao tác quản trị nhạy cảm.",
    endpoint: "/admin/audit-logs",
    fields: [
      ["createdAt", "Thời gian"],
      ["actorEmail", "Quản trị viên"],
      ["action", "Hành động"],
      ["entityType", "Đối tượng"],
      ["entityId", "Mã"],
    ],
  },
} as const;

export function AdminDataPage({ kind }: { kind: keyof typeof configs }) {
  const config = configs[kind];
  const [data, setData] = useState<Page>({
    items: [],
    page: 1,
    totalPages: 1,
    totalItems: 0,
  });
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const load = useCallback(
    () =>
      api<Page>(
        `${config.endpoint}?page=${page}&limit=12&query=${encodeURIComponent(query)}`,
        {},
        true,
      )
        .then(setData)
        .catch((e: Error) => setError(e.message)),
    [config.endpoint, page, query],
  );
  useEffect(() => {
    void Promise.resolve().then(load);
  }, [load]);
  const act = async (row: Row, status: string) => {
    const reason = window.prompt("Nhập lý do cho thao tác này:");
    if (!reason) return;
    let path = "";
    if (kind === "orders") path = `/admin/orders/${row.orderCode}/status`;
    if (kind === "users") path = `/admin/users/${row._id}/status`;
    if (kind === "rights") path = `/admin/rights/${row._id}/revoke`;
    if (kind === "reviews") path = `/admin/reviews/${row._id}/status`;
    if (kind === "returns") path = `/admin/returns/${row._id}/status`;
    const body = kind === "rights" ? { reason } : { status, reason };
    await api(path, { method: "PATCH", body: JSON.stringify(body) }, true);
    await load();
  };
  return (
    <main className="admin-subpage">
      <header>
        <span className="eyebrow">Quản trị vận hành</span>
        <h1>{config.title}</h1>
        <p>{config.description}</p>
      </header>
      <section className="admin-data-card">
        <div className="admin-data-tools">
          <label>
            <Search size={16} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && load()}
              placeholder="Tìm kiếm..."
            />
          </label>
          <button onClick={() => void load()}>
            <RefreshCw size={16} /> Làm mới
          </button>
        </div>
        {error && <div className="admin-alert error">{error}</div>}
        <div className="admin-responsive-table">
          <div className="admin-data-row head">
            {config.fields.map(([, label]) => (
              <b key={label}>{label}</b>
            ))}
            <b>Thao tác</b>
          </div>
          {data.items.map((row, i) => (
            <div className="admin-data-row" key={String(row._id ?? i)}>
              {config.fields.map(([field, label]) => (
                <span key={field} data-label={label}>
                  {format(row[field])}
                </span>
              ))}
              <span className="row-actions">
                {kind === "orders" && (
                  <button onClick={() => void act(row, "CANCELLED")}>
                    Hủy
                  </button>
                )}
                {kind === "users" && (
                  <button
                    onClick={() =>
                      void act(
                        row,
                        row.status === "ACTIVE" ? "LOCKED" : "ACTIVE",
                      )
                    }
                  >
                    {row.status === "ACTIVE" ? "Khóa" : "Mở"}
                  </button>
                )}
                {kind === "rights" && row.status !== "REVOKED" && (
                  <button onClick={() => void act(row, "REVOKED")}>
                    Thu hồi
                  </button>
                )}
                {kind === "reviews" && (
                  <button
                    onClick={() =>
                      void act(
                        row,
                        row.status === "HIDDEN" ? "PUBLISHED" : "HIDDEN",
                      )
                    }
                  >
                    {row.status === "HIDDEN" ? "Hiện" : "Ẩn"}
                  </button>
                )}
                {kind === "returns" && row.status === "PENDING" && (
                  <>
                    <button onClick={() => void act(row, "APPROVED")}>
                      Duyệt
                    </button>
                    <button onClick={() => void act(row, "REJECTED")}>
                      Từ chối
                    </button>
                  </>
                )}
              </span>
            </div>
          ))}
        </div>
        {!data.items.length && (
          <div className="admin-empty">Chưa có dữ liệu phù hợp.</div>
        )}
        <footer className="admin-pager">
          <span>{data.totalItems} bản ghi</span>
          <button disabled={page <= 1} onClick={() => setPage(page - 1)}>
            <ChevronLeft />
          </button>
          <b>
            {page}/{Math.max(1, data.totalPages)}
          </b>
          <button
            disabled={page >= data.totalPages}
            onClick={() => setPage(page + 1)}
          >
            <ChevronRight />
          </button>
        </footer>
      </section>
    </main>
  );
}
function format(value: unknown) {
  if (value == null || value === "") return "—";
  if (typeof value === "number")
    return new Intl.NumberFormat("vi-VN").format(value);
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}T/.test(value))
    return new Date(value).toLocaleString("vi-VN");
  return String(value);
}
