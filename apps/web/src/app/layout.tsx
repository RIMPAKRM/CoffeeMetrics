import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { AppSidebar } from "@/components/app-sidebar";
import { Providers } from "@/components/providers";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "cyrillic"],
});

export const metadata: Metadata = {
  title: "CoffeeMetrics — аналитика кофеен",
  description: "Дашборд выручки, заказов и меню сети кофеен",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ru" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full bg-background text-foreground">
        <Providers>
          <div className="flex min-h-screen">
            <AppSidebar />
            <main className="min-w-0 flex-1">{children}</main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
