"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import {
  ArrowLeft, ArrowRight, BookOpen, Check, ChevronLeft, ChevronRight,
  List, Minus, Moon, Plus, Settings2, Sun, X,
} from "lucide-react";

const chapters = [
  {
    label: "Lời mở đầu", title: "Một khoảng lặng cho riêng mình", kicker: "Đọc thử · 01",
    paragraphs: [
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Một buổi sáng yên tĩnh bắt đầu từ những điều rất nhỏ: tiếng giấy khẽ chạm vào nhau, một tách cà phê còn ấm và vài phút không bị những thông báo làm gián đoạn.",
      "Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ta đọc không chỉ để biết thêm một câu chuyện, mà còn để nhận ra những khoảng trống trong chính suy nghĩ của mình. Mỗi trang sách là một lời mời đi chậm lại.",
      "Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris. Khi mắt lướt qua từng dòng chữ, thế giới bên ngoài dịu xuống. Những ý tưởng tưởng như xa lạ dần trở nên gần gũi, có hình dáng và có tiếng nói.",
    ],
  },
  {
    label: "Chương 1", title: "Những trang đầu tiên", kicker: "Khởi hành · 02",
    paragraphs: [
      "Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore. Cuốn sách được mở ra như một cánh cửa, không hứa rằng con đường phía trước luôn bằng phẳng, chỉ hứa rằng ta sẽ nhìn thấy nhiều hơn khi bước qua.",
      "Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Người đọc mang theo trải nghiệm của mình, vì vậy không có hai hành trình đọc nào hoàn toàn giống nhau.",
      "Curabitur pretium tincidunt lacus. Nulla gravida orci a odio. Có câu chữ cần được đọc nhanh để bắt lấy nhịp điệu, cũng có câu nên dừng lại thật lâu để nghe phần im lặng nằm giữa các từ.",
    ],
  },
  {
    label: "Chương 2", title: "Thành phố của ký ức", kicker: "Ghi nhớ · 03",
    paragraphs: [
      "Praesent dapibus, neque id cursus faucibus, tortor neque egestas augue. Thành phố trong ký ức không được xây bằng gạch đá. Nó được dựng nên từ mùi mưa, ánh đèn bên cửa sổ và những cuộc trò chuyện ta từng nghĩ mình đã quên.",
      "Aliquam erat volutpat. Nam dui mi, tincidunt quis, accumsan porttitor. Có những con đường chỉ xuất hiện khi ta nhắm mắt, có những căn phòng chỉ mở cửa khi một câu văn vô tình chạm đúng chiếc chìa khóa cũ.",
      "Phasellus ultrices nulla quis nibh. Quisque a lectus. Đọc là cách ta trở về những nơi ấy mà không cần hành lý, rồi quay lại hiện tại với một góc nhìn khác đi đôi chút.",
    ],
  },
  {
    label: "Kết chương", title: "Hẹn gặp ở trang kế tiếp", kicker: "Tạm khép · 04",
    paragraphs: [
      "Donec consectetuer ligula vulputate sem tristique cursus. Một chương kết thúc không có nghĩa câu chuyện dừng lại. Nó chỉ tạo ra một khoảng nghỉ vừa đủ để ta mang những điều vừa đọc vào đời sống.",
      "Nam nulla quam, gravida non, commodo a, sodales sit amet, nisi. Hãy đánh dấu trang này, đặt cuốn sách xuống và nhìn quanh. Có thể một chi tiết rất bình thường giờ đã mang thêm một ý nghĩa mới.",
      "Integer in mauris eu nibh euismod gravida. Cảm ơn bạn đã dùng thử trình đọc CapstoneBook. Tiến độ demo được lưu ngay trên trình duyệt này để bạn có thể tiếp tục vào lần sau.",
    ],
  },
];

type ReaderTheme = "paper" | "sepia" | "night";

export function ReaderDemo() {
  const [chapter, setChapter] = useState(0);
  const [fontSize, setFontSize] = useState(20);
  const [theme, setTheme] = useState<ReaderTheme>("paper");
  const [tocOpen, setTocOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    const saved = Number(window.localStorage.getItem("capstone-reader-progress"));
    if (!Number.isInteger(saved) || saved < 0 || saved >= chapters.length) return;
    const restoreProgress = window.setTimeout(() => setChapter(saved), 0);
    return () => window.clearTimeout(restoreProgress);
  }, []);

  useEffect(() => {
    window.localStorage.setItem("capstone-reader-progress", String(chapter));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [chapter]);

  const progress = useMemo(() => Math.round(((chapter + 1) / chapters.length) * 100), [chapter]);
  const active = chapters[chapter];

  const chooseChapter = (index: number) => {
    setChapter(index);
    setTocOpen(false);
  };

  return (
    <main className={`reader-shell reader-${theme}`} style={{ "--reader-font-size": `${fontSize}px` } as CSSProperties}>
      <div className="reader-progress" style={{ width: `${progress}%` }} aria-hidden="true" />
      <header className="reader-header">
        <div className="reader-header-side">
          <Link href="/" className="reader-icon-button" aria-label="Quay về nhà sách"><ArrowLeft size={20}/></Link>
          <Link href="/" className="reader-brand"><span><BookOpen size={18}/></span>CapstoneBook</Link>
        </div>
        <div className="reader-book-title"><strong>Một khoảng lặng</strong><span>Demo đọc online</span></div>
        <div className="reader-header-side reader-header-actions">
          <button className="reader-icon-button" onClick={() => setTocOpen(true)} aria-label="Mở mục lục"><List size={20}/></button>
          <button className={`reader-icon-button ${settingsOpen ? "is-active" : ""}`} onClick={() => setSettingsOpen(!settingsOpen)} aria-label="Tùy chỉnh trình đọc"><Settings2 size={20}/></button>
        </div>
      </header>

      {settingsOpen && <section className="reader-settings" aria-label="Tùy chỉnh đọc">
        <div><span>Cỡ chữ</span><div className="reader-setting-group"><button onClick={() => setFontSize(Math.max(16, fontSize - 2))} aria-label="Giảm cỡ chữ"><Minus size={17}/></button><b>{fontSize}</b><button onClick={() => setFontSize(Math.min(28, fontSize + 2))} aria-label="Tăng cỡ chữ"><Plus size={17}/></button></div></div>
        <div><span>Nền đọc</span><div className="reader-theme-group"><button className={theme === "paper" ? "active" : ""} onClick={() => setTheme("paper")}><Sun size={16}/> Sáng</button><button className={theme === "sepia" ? "active" : ""} onClick={() => setTheme("sepia")}><BookOpen size={16}/> Giấy</button><button className={theme === "night" ? "active" : ""} onClick={() => setTheme("night")}><Moon size={16}/> Tối</button></div></div>
      </section>}

      <article className="reader-page">
        <div className="reader-chapter-meta"><span>{active.kicker}</span><span>{chapter + 1} / {chapters.length}</span></div>
        <h1>{active.title}</h1>
        <div className="reader-ornament"><span/><BookOpen size={18}/><span/></div>
        <div className="reader-copy">{active.paragraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>)}</div>
        <div className="reader-end-mark">• • •</div>
      </article>

      <nav className="reader-navigation" aria-label="Chuyển chương">
        <button disabled={chapter === 0} onClick={() => setChapter(chapter - 1)}><ChevronLeft size={19}/><span><small>Chương trước</small>{chapter > 0 ? chapters[chapter - 1].label : "Đầu sách"}</span></button>
        <span className="reader-percentage">{progress}% đã đọc</span>
        <button disabled={chapter === chapters.length - 1} onClick={() => setChapter(chapter + 1)}><span><small>Chương sau</small>{chapter < chapters.length - 1 ? chapters[chapter + 1].label : "Hoàn thành"}</span><ChevronRight size={19}/></button>
      </nav>

      <aside className={`reader-toc ${tocOpen ? "open" : ""}`} aria-hidden={!tocOpen}>
        <header><div><span>Đọc thử miễn phí</span><h2>Mục lục</h2></div><button className="reader-icon-button" onClick={() => setTocOpen(false)} aria-label="Đóng mục lục"><X size={20}/></button></header>
        <div className="reader-toc-list">{chapters.map((item, index) => <button key={item.label} className={index === chapter ? "active" : ""} onClick={() => chooseChapter(index)}><span>{String(index + 1).padStart(2, "0")}</span><div><small>{item.label}</small><strong>{item.title}</strong></div>{index < chapter ? <Check size={18}/> : index === chapter ? <ArrowRight size={18}/> : null}</button>)}</div>
        <footer><span>Tiến độ đọc</span><strong>{progress}%</strong><div><i style={{ width: `${progress}%` }}/></div><p>Tiến độ được lưu tự động trên thiết bị.</p></footer>
      </aside>
      <button className={`reader-scrim ${tocOpen ? "show" : ""}`} onClick={() => setTocOpen(false)} aria-label="Đóng mục lục" />
    </main>
  );
}
