import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth";
import AppShell from "@/components/AppShell";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "SKB Education Ecosystem",
  description: "Multi-Tenant EdTech Platform — Schools, Colleges, Coaching Centers",
  manifest: "/skb-education-ecosystem/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "SKB",
  },
};

export const viewport: Viewport = {
  themeColor: "#10b981",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <AuthProvider>
          <AppShell>{children}</AppShell>
          <Toaster position="top-right" richColors closeButton />
        </AuthProvider>
      </body>
    </html>
  );
}
