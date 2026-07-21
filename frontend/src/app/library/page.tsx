import type { Metadata } from "next";
import { LibraryScreen } from "@/features/library/components/library-screen";

export const metadata: Metadata = { title: "Thư viện của tôi" };
export default function LibraryPage() { return <LibraryScreen/>; }
