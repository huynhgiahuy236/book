import type { Metadata } from "next";
import { BookDetail } from "@/features/catalog/components/book-detail";

export const metadata: Metadata = { title: "Chi tiết sách" };

export default async function BookDetailPage({ params }: PageProps<"/books/[id]">) {
  const { id } = await params;
  return <BookDetail bookId={id}/>;
}
