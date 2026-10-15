import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SKB Education Ecosystem",
  description: "Multi-Tenant EdTech Platform — Schools, Colleges, Coaching Centers",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
