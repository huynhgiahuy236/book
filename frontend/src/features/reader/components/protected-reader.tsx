"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { ArrowLeft, ArrowRight, BookOpen, Check, ChevronLeft, ChevronRight, Library, List, LockKeyhole, Minus, Moon, Plus, RefreshCw, Settings2, Sun, X } from "lucide-react";
import { api, getToken } from "@/shared/lib/api";

type Chapter = { label: string; title: string; kicker: string; paragraphs: string[] };
type ReaderPayload = { book: { id: string; title: string; authors: string[] }; chapters: Chapter[]; progress: { chapter: number; percent: number } };
type Theme = "paper" | "sepia" | "night";

export function ProtectedReader({ bookId }: { bookId: string }) {
  const [data, setData] = useState<ReaderPayload | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "unauthorized" | "forbidden" | "error">("loading");
  const [chapter, setChapter] = useState(0);
  const [fontSize, setFontSize] = useState(20);
  const [theme, setTheme] = useState<Theme>("paper");
  const [tocOpen, setTocOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    if (!getToken()) { window.setTimeout(() => setStatus("unauthorized"), 0); return; }
    void api<ReaderPayload>(`/library/${encodeURIComponent(bookId)}/read`, {}, true)
      .then((payload) => { setData(payload); setChapter(Math.min(payload.progress.chapter, payload.chapters.length - 1)); setStatus("ready"); })
      .catch((cause: Error) => setStatus(cause.message.includes("chưa sở hữu") ? "forbidden" : "error"));
  }, [bookId]);

  const progress = useMemo(() => data ? Math.round(((chapter + 1) / data.chapters.length) * 100) : 0, [chapter, data]);

  const goTo = (index: number) => {
    if (!data || index < 0 || index >= data.chapters.length) return;
    setChapter(index); setTocOpen(false); window.scrollTo({top:0,behavior:"smooth"});
    void api(`/library/${encodeURIComponent(bookId)}/progress`, {method:"PATCH",body:JSON.stringify({chapter:index,percent:Math.round(((index+1)/data.chapters.length)*100)})}, true).catch(() => undefined);
  };

  if (status === "loading") return <main className="reader-gate"><RefreshCw className="spin" size={28}/><h1>Đang xác minh quyền đọc...</h1><p>Reader đang kiểm tra tài khoản và ReadingRight.</p></main>;
  if (status !== "ready" || !data) return <main className="reader-gate"><div className="state-icon"><LockKeyhole size={30}/></div><span className="eyebrow">Nội dung được bảo vệ</span><h1>{status === "unauthorized" ? "Bạn cần đăng nhập" : status === "forbidden" ? "Bạn chưa sở hữu sách này" : "Chưa thể mở trình đọc"}</h1><p>{status === "unauthorized" ? "Đăng nhập để backend xác minh quyền đọc của tài khoản." : "Mua hoặc test mua local từ trang chi tiết sách rồi quay lại."}</p><Link className="button button-primary" href={status === "unauthorized" ? `/auth?next=/read/${encodeURIComponent(bookId)}` : `/books/${encodeURIComponent(bookId)}`}>{status === "unauthorized" ? "Đăng nhập" : "Xem chi tiết sách"}<ArrowRight size={18}/></Link><Link className="text-button" href="/library">Về thư viện</Link></main>;

  const active = data.chapters[chapter];
  return <main className={`reader-shell reader-${theme}`} style={{"--reader-font-size":`${fontSize}px`} as CSSProperties}>
    <div className="reader-progress" style={{width:`${progress}%`}}/>
    <header className="reader-header"><div className="reader-header-side"><Link href="/library" className="reader-icon-button" aria-label="Về thư viện"><ArrowLeft size={20}/></Link><Link href="/library" className="reader-brand"><span><BookOpen size={18}/></span>CapstoneBook</Link></div><div className="reader-book-title"><strong>{data.book.title}</strong><span>{data.book.authors[0] ?? "Ebook"}</span></div><div className="reader-header-side reader-header-actions"><Link className="reader-icon-button" href="/library" aria-label="Thư viện"><Library size={19}/></Link><button className="reader-icon-button" onClick={() => setTocOpen(true)} aria-label="Mở mục lục"><List size={20}/></button><button className={`reader-icon-button ${settingsOpen?"is-active":""}`} onClick={() => setSettingsOpen(!settingsOpen)} aria-label="Tùy chỉnh"><Settings2 size={20}/></button></div></header>
    {settingsOpen && <section className="reader-settings"><div><span>Cỡ chữ</span><div className="reader-setting-group"><button onClick={() => setFontSize(Math.max(16,fontSize-2))}><Minus size={17}/></button><b>{fontSize}</b><button onClick={() => setFontSize(Math.min(28,fontSize+2))}><Plus size={17}/></button></div></div><div><span>Nền đọc</span><div className="reader-theme-group"><button className={theme==="paper"?"active":""} onClick={() => setTheme("paper")}><Sun size={16}/> Sáng</button><button className={theme==="sepia"?"active":""} onClick={() => setTheme("sepia")}><BookOpen size={16}/> Giấy</button><button className={theme==="night"?"active":""} onClick={() => setTheme("night")}><Moon size={16}/> Tối</button></div></div></section>}
    <article className="reader-page"><div className="reader-chapter-meta"><span>{active.kicker}</span><span>{chapter+1} / {data.chapters.length}</span></div><h1>{active.title}</h1><div className="reader-ornament"><span/><BookOpen size={18}/><span/></div><div className="reader-copy">{active.paragraphs.map((paragraph,index)=><p key={index}>{paragraph}</p>)}</div><div className="reader-end-mark">• • •</div></article>
    <nav className="reader-navigation"><button disabled={chapter===0} onClick={() => goTo(chapter-1)}><ChevronLeft size={19}/><span><small>Chương trước</small>{chapter>0?data.chapters[chapter-1].label:"Đầu sách"}</span></button><span className="reader-percentage">{progress}% · đã đồng bộ</span><button disabled={chapter===data.chapters.length-1} onClick={() => goTo(chapter+1)}><span><small>Chương sau</small>{chapter<data.chapters.length-1?data.chapters[chapter+1].label:"Hoàn thành"}</span><ChevronRight size={19}/></button></nav>
    <aside className={`reader-toc ${tocOpen?"open":""}`} aria-hidden={!tocOpen}><header><div><span>Quyền đọc đã xác minh</span><h2>Mục lục</h2></div><button className="reader-icon-button" onClick={() => setTocOpen(false)}><X size={20}/></button></header><div className="reader-toc-list">{data.chapters.map((item,index)=><button key={item.label} className={index===chapter?"active":""} onClick={() => goTo(index)}><span>{String(index+1).padStart(2,"0")}</span><div><small>{item.label}</small><strong>{item.title}</strong></div>{index<chapter?<Check size={18}/>:index===chapter?<ArrowRight size={18}/>:null}</button>)}</div><footer><span>Tiến độ đồng bộ</span><strong>{progress}%</strong><div><i style={{width:`${progress}%`}}/></div><p>Lưu trong MongoDB theo tài khoản hiện tại.</p></footer></aside><button className={`reader-scrim ${tocOpen?"show":""}`} onClick={() => setTocOpen(false)} aria-label="Đóng mục lục"/>
  </main>;
}
