import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

export type BookRecord = {
  id: string;
  slug?: string;
  externalId: string;
  source: 'OPEN_LIBRARY';
  sourceUrl: string;
  title: string;
  subtitle: string;
  authors: string[];
  publisher: string;
  publishedDate: string | null;
  description: string;
  isbn10: string | null;
  isbn13: string | null;
  pageCount: number | null;
  language: string;
  categories: string[];
  coverUrl: string;
  previewUrl: string;
  averageRating: number | null;
  ratingsCount: number;
  format: 'EBOOK' | 'PHYSICAL';
  premium: boolean;
  accessType?: 'FREE' | 'PREMIUM' | 'PURCHASE';
  status?: 'ACTIVE' | 'DRAFT' | 'ARCHIVED';
  readingEnabled?: boolean;
  price: number;
  pricingNote: 'DEMO_PRICE_NOT_RETAIL';
  importedAt: string;
};

const candidates = [
  resolve(process.cwd(), 'data/books.real.json'),
  resolve(process.cwd(), 'backend/data/books.real.json'),
];
const snapshotPath = candidates.find(existsSync);
if (!snapshotPath)
  throw new Error(
    'Không tìm thấy backend/data/books.real.json. Chạy npm run import:books.',
  );

export const BOOKS = JSON.parse(
  readFileSync(snapshotPath, 'utf8'),
) as BookRecord[];
