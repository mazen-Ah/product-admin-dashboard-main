import Providers from "@/app/providers";
import { cn } from "@/utils/cn";
import type { Metadata } from "next";
import { ThemeProvider } from "next-themes";
import { IBM_Plex_Sans_Arabic, Inter } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const ibmPlexArabic = IBM_Plex_Sans_Arabic({
  variable: "--font-arabic",
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    template: "%s | نظام إدارة مشاريع الطرق",
    default: "نظام إدارة مشاريع الطرق",
  },
  description: "إدارة ومحاسبة مشاريع إنشاء وتأهيل وصيانة الطرق",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      suppressHydrationWarning
      lang="ar"
      dir="rtl"
      className={cn(
        "h-full overflow-hidden antialiased font-arabic",
        ibmPlexArabic.variable,
        inter.variable,
        ibmPlexArabic.className,
      )}
    >
      <body className="h-full overflow-hidden bg-background-gray-secondary_alt_2 [.font-arabic_&]:font-[family-name:var(--font-arabic)] [.font-latin_&]:font-[family-name:var(--font-inter)] font-[family-name:var(--font-arabic)]">
        <ThemeProvider defaultTheme="light" enableSystem>
          <Providers>{children}</Providers>
        </ThemeProvider>
        <Toaster />
      </body>
    </html>
  );
}
