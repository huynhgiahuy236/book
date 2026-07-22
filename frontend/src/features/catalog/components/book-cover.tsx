import type { CSSProperties } from "react";
import type { Book } from "@/features/catalog/lib/books";

type BookCoverProps = {
  book: Book;
  large?: boolean;
  className?: string;
};

export function BookCover({
  book,
  large = false,
  className = "",
}: BookCoverProps) {
  const background = book.coverUrl
    ? ({ backgroundImage: `url("${book.coverUrl}")` } as CSSProperties)
    : undefined;

  return (
    <div
      className={`book-cover tone-${book.accent} ${book.coverUrl ? "real-cover" : ""} ${large ? "book-cover-large" : ""} ${className}`.trim()}
      style={background}
      role="img"
      aria-label={`Bìa sách ${book.title}`}
    >
      <span className="cover-kicker">CAPSTONE EDITION</span>
      <strong>
        {book.cover.split("\n").map((line) => (
          <span key={line}>{line}</span>
        ))}
      </strong>
      <small>{book.author}</small>
    </div>
  );
}
