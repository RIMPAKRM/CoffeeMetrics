import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { AppSidebar } from "@/components/app-sidebar";
import { MobileNav } from "@/components/mobile-nav";
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
            <div className="min-w-0 flex-1">
              <MobileNav />
              <main className="pb-[calc(64px+env(safe-area-inset-bottom))] lg:pb-0">
                {children}
              </main>
            </div>
          </div>
        </Providers>
      </body>
    </html>
  );
}
