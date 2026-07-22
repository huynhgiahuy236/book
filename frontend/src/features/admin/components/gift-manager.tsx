"use client";

import { useEffect, useState, type FormEvent } from "react";
import Image from "next/image";
import { Gift as GiftIcon, ImagePlus, Plus, RefreshCw } from "lucide-react";
import { api } from "@/shared/lib/api";

type Gift = {
  _id: string;
  name: string;
  slug: string;
  type: "PHYSICAL" | "DIGITAL";
  stock: number;
  lowStockThreshold: number;
  status: "ACTIVE" | "INACTIVE";
  description?: string;
  imageUrl?: string;
};
type GiftPage = { items: Gift[]; totalItems: number };

export function GiftManager() {
  const [data, setData] = useState<GiftPage>({ items: [], totalItems: 0 });
  const [open, setOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const load = () =>
    api<GiftPage>("/admin/gifts?page=1&limit=12", {}, true).then(setData);
  useEffect(() => {
    void Promise.resolve().then(load);
  }, []);
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget));
    await api(
      "/admin/gifts",
      {
        method: "POST",
        body: JSON.stringify({
          ...values,
          stock: Number(values.stock),
          lowStockThreshold: Number(values.lowStockThreshold),
        }),
      },
      true,
    );
    setNotice("Đã tạo quà tặng.");
    setOpen(false);
    await load();
  };
  const uploadImage = async (gift: Gift, file?: File) => {
    if (!file) return;
    const body = new FormData();
    body.append("file", file);
    await api(`/admin/gifts/${gift._id}/image`, { method: "POST", body }, true);
    setNotice(`Đã tải ảnh cho “${gift.name}”.`);
    await load();
  };
  return (
    <section className="admin-panel gift-manager" id="gifts">
      <header>
        <div>
          <span className="eyebrow">Kho quà tặng</span>
          <h2>Quà tặng</h2>
        </div>
        <div className="panel-actions">
          <button onClick={() => void load()} aria-label="Làm mới">
            <RefreshCw size={16} />
          </button>
          <button onClick={() => setOpen(!open)}>
            <Plus size={16} /> Tạo quà tặng
          </button>
        </div>
      </header>
      {notice && <div className="admin-alert success">{notice}</div>}
      {open && (
        <form className="gift-form" onSubmit={(event) => void submit(event)}>
          <label>
            Tên
            <input name="name" required minLength={2} />
          </label>
          <label>
            Slug
            <input name="slug" required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" />
          </label>
          <label>
            Loại
            <select name="type">
              <option value="PHYSICAL">Vật lý</option>
              <option value="DIGITAL">Kỹ thuật số</option>
            </select>
          </label>
          <label>
            Tồn kho
            <input name="stock" type="number" min="0" defaultValue="0" />
          </label>
          <label>
            Ngưỡng sắp hết
            <input
              name="lowStockThreshold"
              type="number"
              min="0"
              defaultValue="5"
            />
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
            <textarea name="description" rows={2} />
          </label>
          <button type="submit">Lưu quà tặng</button>
        </form>
      )}
      <div className="gift-list">
        {data.items.length ? (
          data.items.map((gift) => (
            <article key={gift._id}>
              <span>
                {gift.imageUrl ? (
                  <Image
                    src={gift.imageUrl}
                    alt=""
                    width={38}
                    height={38}
                    unoptimized
                  />
                ) : (
                  <GiftIcon size={18} />
                )}
              </span>
              <div>
                <strong>{gift.name}</strong>
                <small>
                  {gift.slug} · {gift.type}
                </small>
              </div>
              <b>
                {gift.type === "PHYSICAL"
                  ? `${gift.stock} còn lại`
                  : "Không giới hạn"}
              </b>
              <em className={gift.status.toLowerCase()}>
                {gift.status === "ACTIVE" ? "Hoạt động" : "Tạm ẩn"}
              </em>
              <label className="gift-image-upload">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(event) => {
                    void uploadImage(gift, event.target.files?.[0]);
                    event.currentTarget.value = "";
                  }}
                />
                <ImagePlus size={15} /> Tải ảnh
              </label>
            </article>
          ))
        ) : (
          <p>Chưa có quà tặng. Hãy tạo quà tặng trước khi liên kết với sách.</p>
        )}
      </div>
    </section>
  );
}
