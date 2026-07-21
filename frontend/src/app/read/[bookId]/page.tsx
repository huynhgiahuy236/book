import type { Metadata } from "next";
import { ProtectedReader } from "@/features/reader/components/protected-reader";

export const metadata: Metadata = { title: "Đọc Ebook" };

export default async function ReaderPage({ params }: PageProps<"/read/[bookId]">) {
  const { bookId } = await params;
  return <ProtectedReader bookId={bookId}/>;
}
