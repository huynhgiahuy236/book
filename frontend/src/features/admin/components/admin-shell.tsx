"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { BookOpen, LogOut, Menu, Search, X } from "lucide-react";
import { clearToken, getCurrentUser } from "@/shared/lib/api";

const nav = [
  ["/admin", "Tổng quan"],
  ["/admin#books", "Quản lý sách"],
  ["/admin#r2-library", "Kho PDF R2"],
  ["/admin/orders", "Đơn hàng"],
  ["/admin/orders", "Thanh toán PayOS"],
  ["/admin/rights", "Quyền đọc"],
  ["/admin/progress", "Tiến độ đọc"],
  ["/admin/users", "Người dùng"],
  ["/admin/reviews", "Đánh giá"],
  ["/admin/returns", "Đổi trả"],
  ["/admin/premium", "Gói Premium"],
  ["/admin#gifts", "Quà tặng"],
  ["/admin/audit-logs", "Nhật ký hệ thống"],
] as const;

export function AdminShell({ children }: { children: ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  useEffect(() => {
    void getCurrentUser().then((user) => {
      if (!user || user.role !== "ADMIN") router.replace("/auth?mode=login");
    });
  }, [router]);
  return (
    <div className="admin-shell">
      <button
        className="admin-mobile-menu"
        onClick={() => setOpen(true)}
        aria-label="Mở menu quản trị"
      >
        <Menu />
      </button>
      {open && (
        <button
          className="admin-drawer-backdrop"
          onClick={() => setOpen(false)}
          aria-label="Đóng menu"
        />
      )}
      <aside
        className={`admin-sidebar ${open ? "open" : ""}`}
        aria-label="Điều hướng quản trị"
      >
        <header>
          <Link href="/admin" className="admin-sidebar-brand">
            <BookOpen size={20} />
            <span>Capstone Admin</span>
          </Link>
          <button onClick={() => setOpen(false)} aria-label="Đóng">
            <X />
          </button>
        </header>
        <label className="admin-global-search">
          <Search size={16} />
          <input placeholder="Tìm sách, đơn hàng, người dùng..." />
        </label>
        <nav>
          {nav.map(([href, label], index) => (
            <Link
              key={`${href}-${index}`}
              href={href}
              className={
                path === href || (href !== "/admin" && path.startsWith(href))
                  ? "active"
                  : ""
              }
              onClick={() => setOpen(false)}
            >
              {label}
            </Link>
          ))}
        </nav>
        <button
          className="admin-logout"
          onClick={() => {
            clearToken();
            router.replace("/auth?mode=login");
          }}
        >
          <LogOut size={16} /> Đăng xuất
        </button>
      </aside>
      <div className="admin-shell-content">{children}</div>
    </div>
  );
}
