import type { Metadata } from "next";
import { SystemGuide } from "@/features/system/components/system-guide";

export const metadata: Metadata = {
  title: "Kiến trúc hệ thống",
  description: "Luồng nghiệp vụ, module và biến môi trường CapstoneBook.",
};

export default function SystemPage() {
  return <SystemGuide />;
}
