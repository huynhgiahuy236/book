"use client";

import Link from "next/link";
import type { PDFDocumentLoadingTask, PDFDocumentProxy, RenderTask } from "pdfjs-dist";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { ArrowLeft, ChevronLeft, ChevronRight, Columns3, Expand, Library, List, LockKeyhole, Maximize2, Minus, Plus, RefreshCw, ShieldCheck, X } from "lucide-react";
import { API_URL, ApiError, api, getToken } from "@/shared/lib/api";

type ReaderPayload = {
  book: { id: string; title: string; authors: string[] };
  document: { contentUrl: string; mimeType: string; pageCount: number | null };
  progress: { currentPage?: number; totalPages?: number; progressPercentage?: number };
  watermark: { name: string; maskedEmail: string; shortUserId: string; issuedAt: string };
};

type FitMode = "width" | "page";

export function ProtectedReader({ bookId }: { bookId: string }) {
  const [session, setSession] = useState<ReaderPayload | null>(null);
  const [pdf, setPdf] = useState<PDFDocumentProxy | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "unauthorized" | "forbidden" | "error">("loading");
  const [message, setMessage] = useState("");
  const [pageNumber, setPageNumber] = useState(1);
  const [pageInput, setPageInput] = useState("1");
  const [scale, setScale] = useState(1);
  const [fitMode, setFitMode] = useState<FitMode>("width");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [rendering, setRendering] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const renderTaskRef = useRef<RenderTask | null>(null);

  useEffect(() => {
    let cancelled = false;
    let loadingTask: PDFDocumentLoadingTask | null = null;
    const load = async () => {
      try {
        const payload = await api<ReaderPayload>(`/library/${encodeURIComponent(bookId)}/read`, {}, true);
        if (cancelled) return;
        const pdfjs = await import("pdfjs-dist");
        pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();
        const token = getToken();
        const task = pdfjs.getDocument({
          url: `${API_URL}${payload.document.contentUrl}`,
          httpHeaders: token ? { Authorization: `Bearer ${token}` } : undefined,
          withCredentials: true,
          rangeChunkSize: 128 * 1024,
        });
        loadingTask = task;
        const document = await task.promise;
        if (cancelled) return;
        const savedPage = Math.min(Math.max(payload.progress.currentPage ?? 1, 1), document.numPages);
        setSession(payload); setPdf(document); setPageNumber(savedPage); setPageInput(String(savedPage)); setStatus("ready");
      } catch (error) {
        if (cancelled) return;
        const apiError = error as ApiError;
        setStatus(apiError.status === 401 ? "unauthorized" : apiError.status === 403 ? "forbidden" : "error");
        setMessage(error instanceof Error ? error.message : "Không thể mở tài liệu");
      }
    };
    void load();
    return () => { cancelled = true; renderTaskRef.current?.cancel(); if (loadingTask) void loadingTask.destroy(); };
  }, [bookId]);

  const renderPage = useCallback(async () => {
    if (!pdf || !canvasRef.current || !stageRef.current) return;
    setRendering(true);
    const page = await pdf.getPage(pageNumber);
    const base = page.getViewport({ scale: 1 });
    const stageWidth = Math.max(stageRef.current.clientWidth - 56, 280);
    const stageHeight = Math.max(window.innerHeight - 150, 420);
    const fitted = fitMode === "width" ? stageWidth / base.width : Math.min(stageWidth / base.width, stageHeight / base.height);
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    const viewport = page.getViewport({ scale: fitted * scale * ratio });
    const canvas = canvasRef.current;
    canvas.width = Math.floor(viewport.width); canvas.height = Math.floor(viewport.height);
    canvas.style.width = `${Math.floor(viewport.width / ratio)}px`; canvas.style.height = `${Math.floor(viewport.height / ratio)}px`;
    renderTaskRef.current?.cancel();
    const task = page.render({ canvas, viewport });
    renderTaskRef.current = task;
    try { await task.promise; setRendering(false); }
    catch (error) { if (!(error instanceof Error) || error.name !== "RenderingCancelledException") throw error; }
  }, [fitMode, pageNumber, pdf, scale]);

  useEffect(() => {
    void renderPage().catch((error) => { setMessage(error instanceof Error ? error.message : "Không thể dựng trang PDF"); setStatus("error"); });
    return () => renderTaskRef.current?.cancel();
  }, [renderPage]);
  useEffect(() => {
    if (!pdf || status !== "ready") return;
    const timer = window.setTimeout(() => {
      void api(`/library/${encodeURIComponent(bookId)}/progress`, {
        method: "PATCH", body: JSON.stringify({ currentPage: pageNumber, totalPages: pdf.numPages }),
      }, true).catch(() => undefined);
    }, 800);
    return () => window.clearTimeout(timer);
  }, [bookId, pageNumber, pdf, status]);

  const goTo = useCallback((target: number) => {
    if (!pdf) return;
    const next = Math.min(Math.max(target, 1), pdf.numPages);
    setPageNumber(next); setPageInput(String(next));
    stageRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, [pdf]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && ["p", "s"].includes(event.key.toLowerCase())) { event.preventDefault(); return; }
      if (event.key === "ArrowRight" || event.key === "PageDown") goTo(pageNumber + 1);
      if (event.key === "ArrowLeft" || event.key === "PageUp") goTo(pageNumber - 1);
      if (event.key === "+" || event.key === "=") setScale((value) => Math.min(2.5, value + .15));
      if (event.key === "-") setScale((value) => Math.max(.6, value - .15));
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [goTo, pageNumber]);

  if (status === "loading") return <ReaderGate icon={<RefreshCw className="spin" size={28}/>} title="Đang chuẩn bị trang đọc" detail="Đang xác minh quyền và tải tài liệu bảo vệ…"/>;
  if (status !== "ready" || !session || !pdf) {
    const title = status === "unauthorized" ? "Bạn cần đăng nhập" : status === "forbidden" ? "Bạn chưa có quyền đọc" : "Chưa thể mở tài liệu";
    return <ReaderGate icon={<LockKeyhole size={30}/>} title={title} detail={message || "Vui lòng quay lại trang sách để kiểm tra quyền truy cập."} actionHref={status === "unauthorized" ? `/auth?next=/read/${encodeURIComponent(bookId)}` : `/books/${encodeURIComponent(bookId)}`}/>;
  }

  const progress = Math.round((pageNumber / pdf.numPages) * 100);
  const watermark = `${session.watermark.name} · ${session.watermark.maskedEmail} · ${session.watermark.shortUserId}`;
  return <main className="pdf-reader" onContextMenu={(event) => event.preventDefault()}>
    <header className="pdf-toolbar">
      <div className="pdf-toolbar-group"><Link href="/library" className="reader-icon-button" aria-label="Về thư viện"><ArrowLeft size={20}/></Link><button className="reader-icon-button" onClick={() => setSidebarOpen(!sidebarOpen)} aria-label="Bật tắt danh sách trang" aria-expanded={sidebarOpen}><List size={20}/></button><div className="pdf-title"><strong>{session.book.title}</strong><span>{session.book.authors[0] ?? "Ebook"}</span></div></div>
      <div className="pdf-toolbar-group pdf-page-control"><button onClick={() => goTo(pageNumber - 1)} disabled={pageNumber === 1} aria-label="Trang trước"><ChevronLeft size={18}/></button><label><span className="sr-only">Trang hiện tại</span><input value={pageInput} inputMode="numeric" onChange={(event) => setPageInput(event.target.value.replace(/\D/g, ""))} onBlur={() => goTo(Number(pageInput) || pageNumber)} onKeyDown={(event) => { if (event.key === "Enter") goTo(Number(pageInput) || pageNumber); }}/></label><span>/ {pdf.numPages}</span><button onClick={() => goTo(pageNumber + 1)} disabled={pageNumber === pdf.numPages} aria-label="Trang sau"><ChevronRight size={18}/></button></div>
      <div className="pdf-toolbar-group pdf-tools"><button onClick={() => setScale((v) => Math.max(.6, v - .15))} aria-label="Thu nhỏ"><Minus size={18}/></button><span>{Math.round(scale * 100)}%</span><button onClick={() => setScale((v) => Math.min(2.5, v + .15))} aria-label="Phóng to"><Plus size={18}/></button><button className={fitMode === "width" ? "active" : ""} onClick={() => setFitMode("width")} aria-label="Vừa chiều rộng"><Columns3 size={18}/></button><button className={fitMode === "page" ? "active" : ""} onClick={() => setFitMode("page")} aria-label="Vừa trang"><Maximize2 size={18}/></button><button onClick={() => void document.documentElement.requestFullscreen()} aria-label="Toàn màn hình"><Expand size={18}/></button></div>
    </header>
    <div className="pdf-progress-track"><i style={{ width: `${progress}%` }}/></div>
    <div className="pdf-workspace">
      <aside className={`pdf-sidebar ${sidebarOpen ? "open" : ""}`}><header><div><span>Mục lục trực quan</span><strong>{pdf.numPages} trang</strong></div><button onClick={() => setSidebarOpen(false)} aria-label="Đóng danh sách trang"><X size={18}/></button></header><div className="pdf-thumbnails">{Array.from({ length: pdf.numPages }, (_, index) => index + 1).map((page) => <button key={page} className={page === pageNumber ? "active" : ""} onClick={() => goTo(page)} aria-current={page === pageNumber ? "page" : undefined}><span className="pdf-mini-page"><i>{page}</i></span><small>Trang {page}</small></button>)}</div></aside>
      <section className="pdf-stage" ref={stageRef} aria-busy={rendering}><div className="pdf-canvas-shell">{rendering && <div className="pdf-skeleton" aria-label="Đang dựng trang PDF"/>}<canvas ref={canvasRef}/><div className="pdf-watermarks" aria-hidden="true">{Array.from({ length: 9 }, (_, index) => <span key={index}>{watermark}<small>{new Date(session.watermark.issuedAt).toLocaleString("vi-VN")}</small></span>)}</div></div></section>
    </div>
    <footer className="pdf-statusbar"><span><ShieldCheck size={15}/> Bản đọc cá nhân có watermark</span><strong>Trang {pageNumber}/{pdf.numPages} · {progress}%</strong><span>Phím ← → để chuyển trang</span></footer>
  </main>;
}

function ReaderGate({ icon, title, detail, actionHref }: { icon: ReactNode; title: string; detail: string; actionHref?: string }) {
  return <main className="reader-gate"><div className="state-icon">{icon}</div><span className="eyebrow">Nội dung được bảo vệ</span><h1>{title}</h1><p>{detail}</p>{actionHref && <Link className="button button-primary" href={actionHref}>Tiếp tục <ChevronRight size={18}/></Link>}<Link className="text-button" href="/library"><Library size={17}/> Về thư viện</Link></main>;
}
