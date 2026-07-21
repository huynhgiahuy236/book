import importedBooks from "@/features/catalog/data/books.real.json";

export type Book = {
  id: string; title: string; author: string; price: number; oldPrice?: number;
  category: string; format: "Ebook" | "Sách giấy"; premium?: boolean;
  cover: string; coverUrl?: string; accent: string; rating: number;
  isbn13?: string | null; publisher?: string; sourceUrl?: string;
};

const accents = ["coral", "gold", "blue", "green", "ink", "purple", "red", "forest"];
const coverTitle = (title: string) => title.split(/\s+/).slice(0, 5).join("\n").toLocaleUpperCase("vi");

export const books: Book[] = importedBooks.slice(0, 24).map((book, index) => ({
  id: book.id, title: book.title, author: book.authors[0] ?? "Chưa rõ tác giả",
  price: book.price, oldPrice: index % 4 === 0 ? book.price + 30000 : undefined,
  category: book.categories[0] ?? "Khác", format: book.format === "EBOOK" ? "Ebook" : "Sách giấy",
  premium: book.premium, cover: coverTitle(book.title), coverUrl: book.coverUrl,
  accent: accents[index % accents.length],
  rating: book.averageRating ? Number(book.averageRating.toFixed(1)) : 4.6 + (index % 4) / 10,
  isbn13: book.isbn13, publisher: book.publisher, sourceUrl: book.sourceUrl,
}));

export const money = (value: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value);
