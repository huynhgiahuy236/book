import type { Metadata } from "next";
import { ReaderDemo } from "@/features/reader/components/reader-demo";

export const metadata: Metadata = {
  title: "Đọc thử Ebook",
  description: "Trình đọc Ebook mẫu của CapstoneBook.",
};

export default function DemoReaderPage() {
  return <ReaderDemo />;
}
