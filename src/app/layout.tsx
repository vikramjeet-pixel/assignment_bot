import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "SuccessEngine — Academic Roadmap",
  description: "AI-powered academic roadmap tool. Upload your assignments, get a smart timeline.",
  keywords: ["academic", "AI", "roadmap", "assignments", "deadlines"],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full`}
      suppressHydrationWarning
    >
      <body className="min-h-full bg-[#F9FAFB] text-[#111827] antialiased">
        <AuthProvider>
          {children}
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                background: "#FFFFFF",
                border: "1px solid #E5E7EB",
                borderRadius: "12px",
                boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                color: "#111827",
                fontSize: "13px",
              },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
