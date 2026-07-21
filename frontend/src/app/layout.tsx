import type { Metadata } from "next";
import { Nunito_Sans, Varela_Round } from "next/font/google";
import "./globals.css";

const nunito = Nunito_Sans({
  variable: "--font-body",
  subsets: ["latin"],
});

const varela = Varela_Round({
  weight: "400",
  variable: "--font-display",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "CapstoneBook — Đọc theo cách của bạn",
    template: "%s · CapstoneBook",
  },
  description:
    "Nhà sách hiện đại cho sách giấy, Ebook và trải nghiệm đọc Premium.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="vi"
      className={`${nunito.variable} ${varela.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
