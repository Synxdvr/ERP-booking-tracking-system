import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "S'thetic Systems",
  description: "Internal booking & scheduling system",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
