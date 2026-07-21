import type { Metadata } from "next";
import { AuthScreen } from "@/features/auth/components/auth-screen";

export const metadata: Metadata = { title: "Đăng nhập", description: "Đăng nhập hoặc tạo tài khoản CapstoneBook." };

export default async function AuthPage({ searchParams }: PageProps<"/auth">) {
  const params = await searchParams;
  const next = typeof params.next === "string" && params.next.startsWith("/") ? params.next : "/library";
  return <AuthScreen nextPath={next} />;
}
