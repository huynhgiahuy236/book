"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Cloud,
  FileCheck2,
  FileQuestion,
  Link2,
  RefreshCw,
  TriangleAlert,
} from "lucide-react";
import { api } from "@/shared/lib/api";

type R2Book = {
  id: string;
  slug: string;
  title: string;
  coverUrl?: string;
  hasPdf: boolean;
};
type R2Item = {
  objectKey: string;
  fileName: string;
  size: number;
  lastModified: string | null;
  state: "LINKED" | "UNLINKED" | "DUPLICATE" | "CONFLICT";
  linkedBook: R2Book | null;
  candidateBooks: R2Book[];
};
type LibraryPayload = {
  summary: {
    total: number;
    linked: number;
    unlinked: number;
    missing: number;
    conflicts: number;
  };
  items: R2Item[];
  missingFiles: Array<{ book: R2Book }>;
  books: R2Book[];
};

export function R2LibraryPanel() {
  const [data, setData] = useState<LibraryPayload | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState("");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Record<string, string>>({});
  const load = async () => {
    setError("");
    try {
      setData(await api<LibraryPayload>("/admin/pdf-library", {}, true));
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Không thể đọc kho PDF R2",
      );
    }
  };
  useEffect(() => {
    void Promise.resolve().then(load);
  }, []);
  const books = useMemo(
    () =>
      data?.books.filter((book) =>
        `${book.title} ${book.slug}`
          .toLocaleLowerCase("vi")
          .includes(query.toLocaleLowerCase("vi")),
      ) ?? [],
    [data, query],
  );
  const link = async (item: R2Item) => {
    const bookId = selected[item.objectKey];
    if (!bookId) {
      setError("Hãy chọn sách cần liên kết.");
      return;
    }
    const target = data?.books.find((book) => book.id === bookId);
    const replaceExisting = Boolean(target?.hasPdf);
    if (
      replaceExisting &&
      !window.confirm(`“${target?.title}” đã có PDF. Xác nhận thay liên kết?`)
    )
      return;
    setBusy(item.objectKey);
    setError("");
    setNotice("");
    try {
      await api(
        `/admin/pdf-library/${encodeURIComponent(bookId)}/link`,
        {
          method: "POST",
          body: JSON.stringify({ objectKey: item.objectKey, replaceExisting }),
        },
        true,
      );
      setNotice(`Đã liên kết ${item.fileName} với ${target?.title}.`);
      await load();
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Không thể liên kết PDF",
      );
    } finally {
      setBusy("");
    }
  };
  const createDraft = async (item: R2Item) => {
    if (!window.confirm(`Tạo bản nháp sách mới từ “${item.fileName}”?`)) return;
    setBusy(item.objectKey);
    setError("");
    setNotice("");
    try {
      await api(
        "/admin/pdf-library/drafts",
        { method: "POST", body: JSON.stringify({ objectKey: item.objectKey }) },
        true,
      );
      setNotice(
        "Đã tạo bản nháp. Hãy bổ sung metadata trước khi chuyển ACTIVE.",
      );
      await load();
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Không thể tạo bản nháp",
      );
    } finally {
      setBusy("");
    }
  };
  return (
    <section className="r2-panel" aria-labelledby="r2-panel-title">
      <header>
        <div>
          <span className="eyebrow">
            <Cloud size={15} /> Cloudflare R2
          </span>
          <h2 id="r2-panel-title">Kho PDF đọc trực tuyến</h2>
        </div>
        <button
          className="button button-secondary"
          onClick={() => void load()}
          disabled={busy !== ""}
        >
          <RefreshCw size={16} /> Kiểm tra lại
        </button>
      </header>
      {error && (
        <div className="admin-alert error" role="alert">
          {error}
        </div>
      )}
      {notice && (
        <div className="admin-alert success" role="status">
          {notice}
        </div>
      )}
      {!data ? (
        <div className="r2-loading">
          <RefreshCw className="spin" /> Đang đối chiếu R2 và MongoDB…
        </div>
      ) : (
        <>
          <div className="r2-stats">
            {[
              ["Tổng PDF", data.summary.total],
              ["Đã liên kết", data.summary.linked],
              ["Chưa liên kết", data.summary.unlinked],
              ["Thiếu file", data.summary.missing],
              ["Xung đột", data.summary.conflicts],
            ].map(([label, value]) => (
              <div key={String(label)}>
                <strong>{value}</strong>
                <span>{label}</span>
              </div>
            ))}
          </div>
          <label className="r2-search">
            <span>Tìm sách để liên kết</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Tên sách hoặc slug…"
            />
          </label>
          <div className="r2-list">
            {data.items.length === 0 ? (
              <div className="r2-empty">
                <FileQuestion />
                <strong>Chưa có PDF trong folder ebooks/</strong>
              </div>
            ) : (
              data.items.map((item) => (
                <article key={item.objectKey}>
                  <div className="r2-file-icon">
                    {item.state === "LINKED" ? (
                      <FileCheck2 />
                    ) : (
                      <FileQuestion />
                    )}
                  </div>
                  <div className="r2-file-copy">
                    <strong>{item.fileName}</strong>
                    <code>{item.objectKey}</code>
                    <small>
                      {(item.size / 1024 / 1024).toFixed(2)} MB
                      {item.lastModified
                        ? ` · ${new Date(item.lastModified).toLocaleString("vi-VN")}`
                        : ""}
                    </small>
                  </div>
                  <span className={`r2-state ${item.state.toLowerCase()}`}>
                    {item.state}
                  </span>
                  <div className="r2-actions">
                    {item.linkedBook ? (
                      <strong>
                        <Link2 size={14} /> {item.linkedBook.title}
                      </strong>
                    ) : (
                      <>
                        <select
                          aria-label={`Chọn sách cho ${item.fileName}`}
                          value={selected[item.objectKey] ?? ""}
                          onChange={(event) =>
                            setSelected((state) => ({
                              ...state,
                              [item.objectKey]: event.target.value,
                            }))
                          }
                        >
                          <option value="">Chọn sách hiện có…</option>
                          {books.map((book) => (
                            <option key={book.id} value={book.id}>
                              {book.title} · {book.slug}
                              {book.hasPdf ? " · đã có PDF" : ""}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={() => void link(item)}
                          disabled={busy === item.objectKey}
                        >
                          Liên kết
                        </button>
                        <button
                          onClick={() => void createDraft(item)}
                          disabled={busy === item.objectKey}
                        >
                          Tạo bản nháp
                        </button>
                      </>
                    )}
                  </div>
                </article>
              ))
            )}
          </div>
          {data.missingFiles.length > 0 && (
            <div className="r2-missing">
              <TriangleAlert size={18} />
              <div>
                <strong>Sách có liên kết nhưng thiếu object R2</strong>
                {data.missingFiles.map((entry) => (
                  <span key={entry.book.id}>{entry.book.title}</span>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
}
