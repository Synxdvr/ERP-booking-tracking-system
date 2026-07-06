import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/Toaster";

export const metadata: Metadata = {
  title: "S'thetic Systems",
  description: "Internal booking & scheduling system",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        {/* Global toast notifications */}
        <Toaster />
      </body>
    </html>
  );
}
