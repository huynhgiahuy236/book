import importedBooks from "@/features/catalog/data/books.real.json";

export type Book = {
  id: string;
  title: string;
  author: string;
  price: number;
  oldPrice?: number;
  category: string;
  format: "Ebook" | "Sách giấy";
  premium?: boolean;
  cover: string;
  coverUrl?: string;
  accent: string;
  rating: number;
  isbn13?: string | null;
  publisher?: string;
  sourceUrl?: string;
  description?: string;
  accessType?: "FREE" | "PREMIUM" | "PURCHASE";
  readingEnabled?: boolean;
  isReadableOnline?: boolean;
  stock?: number;
  ebookPrice?: number;
  physicalPrice?: number;
};

export type ApiBook = {
  id: string;
  title: string;
  authors: string[];
  price: number;
  categories: string[];
  format: "EBOOK" | "PHYSICAL";
  premium?: boolean;
  coverUrl?: string;
  averageRating?: number | null;
  isbn13?: string | null;
  publisher?: string;
  sourceUrl?: string;
  description?: string;
  accessType?: "FREE" | "PREMIUM" | "PURCHASE";
  readingEnabled?: boolean;
  isReadableOnline?: boolean;
  stock?: number;
  ebookPrice?: number;
  physicalPrice?: number;
};

const accents = [
  "coral",
  "gold",
  "blue",
  "green",
  "ink",
  "purple",
  "red",
  "forest",
];
const coverTitle = (title: string) =>
  title.split(/\s+/).slice(0, 5).join("\n").toLocaleUpperCase("vi");

export const dacNhanTamBook: Book = {
  id: "dac-nhan-tam",
  title: "Đắc Nhân Tâm",
  author: "Dale Carnegie",
  price: 69000,
  oldPrice: 99000,
  category: "Kỹ năng sống",
  format: "Ebook",
  premium: false,
  cover: "ĐẮC\nNHÂN\nTÂM",
  accent: "forest",
  rating: 4.9,
  publisher: "CapstoneBook demo",
  description:
    "Tác phẩm kinh điển về nghệ thuật giao tiếp, thấu hiểu con người và xây dựng những mối quan hệ bền vững.",
  accessType: "PURCHASE",
  readingEnabled: true,
  stock: 0,
  ebookPrice: 69000,
  physicalPrice: 0,
};

export const books: Book[] = [
  dacNhanTamBook,
  ...importedBooks.slice(0, 23).map<Book>((book, index) => ({
    id: book.id,
    title: book.title,
    author: book.authors[0] ?? "Chưa rõ tác giả",
    price: book.price,
    oldPrice: index % 4 === 0 ? book.price + 30000 : undefined,
    category: book.categories[0] ?? "Khác",
    format: book.format === "EBOOK" ? "Ebook" : "Sách giấy",
    premium: book.premium,
    cover: coverTitle(book.title),
    coverUrl: book.coverUrl,
    accent: accents[index % accents.length],
    rating: book.averageRating
      ? Number(book.averageRating.toFixed(1))
      : 4.6 + (index % 4) / 10,
    isbn13: book.isbn13,
    publisher: book.publisher,
    sourceUrl: book.sourceUrl,
  })),
];

export const bookFromApi = (book: ApiBook, index = 0): Book => ({
  id: book.id,
  title: book.title,
  author: book.authors[0] ?? "Chưa rõ tác giả",
  price: book.ebookPrice ?? book.price,
  category: book.categories[0] ?? "Khác",
  format: book.format === "EBOOK" ? "Ebook" : "Sách giấy",
  premium: book.premium,
  cover: coverTitle(book.title),
  coverUrl: book.coverUrl,
  accent: accents[index % accents.length],
  rating: book.averageRating ? Number(book.averageRating.toFixed(1)) : 0,
  isbn13: book.isbn13,
  publisher: book.publisher,
  sourceUrl: book.sourceUrl,
  description: book.description,
  accessType: book.accessType,
  readingEnabled: book.readingEnabled,
  isReadableOnline: book.isReadableOnline,
  stock: book.stock,
  ebookPrice: book.ebookPrice,
  physicalPrice: book.physicalPrice,
});

export const money = (value: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
    value,
  );
