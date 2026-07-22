"use client";

import { useRef, useState, type FormEvent } from "react";
import { CheckCircle2, ImagePlus, Save, Send, X } from "lucide-react";
import { api } from "@/shared/lib/api";

export type EditableBook = {
  id: string;
  title: string;
  description?: string;
  authors: string[];
  categories?: string[];
  publisher?: string;
  language?: string;
  ebookPrice: number;
  accessType: string;
  status: string;
  coverUrl?: string;
};

export function BookEditor({
  book,
  onClose,
}: {
  book: EditableBook;
  onClose: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const publishIntent = useRef(false);
  const save = async (event: FormEvent<HTMLFormElement>, publish = false) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    setSaved(false);
    const values = Object.fromEntries(new FormData(event.currentTarget));
    try {
      await api(
        `/admin/books/${encodeURIComponent(book.id)}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            title: values.title,
            description: values.description,
            authors: String(values.authors)
              .split(",")
              .map((v) => v.trim())
              .filter(Boolean),
            categories: String(values.categories)
              .split(",")
              .map((v) => v.trim())
              .filter(Boolean),
            publisher: values.publisher,
            language: values.language,
            ebookPrice: Number(values.ebookPrice),
            accessType: values.accessType,
          }),
        },
        true,
      );
      if (file) {
        const body = new FormData();
        body.append("file", file);
        await api(
          `/admin/books/${encodeURIComponent(book.id)}/cover`,
          { method: "POST", body },
          true,
        );
      }
      if (publish)
        await api(
          `/admin/books/${encodeURIComponent(book.id)}/publish`,
          { method: "POST" },
          true,
        );
      setSaved(true);
      if (publish) window.setTimeout(() => window.location.reload(), 600);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Không thể lưu sách");
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="editor-backdrop">
      <section
        className="book-editor"
        role="dialog"
        aria-modal="true"
        aria-labelledby="editor-title"
      >
        <header>
          <div>
            <span className="eyebrow">Thông tin MongoDB Atlas</span>
            <h2 id="editor-title">Hoàn thiện sách</h2>
          </div>
          <button onClick={onClose} aria-label="Đóng">
            <X />
          </button>
        </header>
        <form onSubmit={(event) => void save(event, publishIntent.current)}>
          <div className="editor-grid">
            <label>
              <span>Tiêu đề</span>
              <input
                name="title"
                defaultValue={book.title}
                required
                minLength={2}
              />
            </label>
            <label>
              <span>Tác giả (phân cách dấu phẩy)</span>
              <input
                name="authors"
                defaultValue={book.authors.join(", ")}
                required
              />
            </label>
            <label className="wide">
              <span>Mô tả</span>
              <textarea
                name="description"
                defaultValue={book.description}
                required
                rows={4}
              />
            </label>
            <label>
              <span>Thể loại</span>
              <input
                name="categories"
                defaultValue={book.categories?.join(", ")}
                required
              />
            </label>
            <label>
              <span>Nhà xuất bản</span>
              <input name="publisher" defaultValue={book.publisher} />
            </label>
            <label>
              <span>Ngôn ngữ</span>
              <input name="language" defaultValue={book.language ?? "vie"} />
            </label>
            <label>
              <span>Giá Ebook</span>
              <input
                name="ebookPrice"
                type="number"
                min="0"
                defaultValue={book.ebookPrice}
              />
            </label>
            <label>
              <span>Quyền đọc</span>
              <select name="accessType" defaultValue={book.accessType}>
                <option value="FREE">Miễn phí</option>
                <option value="PURCHASE">Mua một lần</option>
                <option value="PREMIUM">Premium</option>
              </select>
            </label>
            <label className="wide cover-picker">
              <span>Ảnh bìa tải lên Cloudinary</span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              />
              <i>
                <ImagePlus size={18} />
                {file?.name ??
                  (book.coverUrl
                    ? "Giữ ảnh bìa hiện tại"
                    : "Chọn JPG, PNG hoặc WebP")}
              </i>
            </label>
          </div>
          {error && (
            <div className="admin-alert error" role="alert">
              {error}
            </div>
          )}
          {saved && (
            <div className="admin-alert success">
              <CheckCircle2 size={16} /> Đã lưu thông tin.
            </div>
          )}
          <footer>
            <button
              type="submit"
              disabled={busy}
              onClick={() => {
                publishIntent.current = false;
              }}
            >
              <Save size={17} /> Lưu bản nháp
            </button>
            <button
              type="submit"
              className="publish"
              disabled={busy}
              onClick={() => {
                publishIntent.current = true;
              }}
            >
              <Send size={17} /> Xuất bản
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
}
