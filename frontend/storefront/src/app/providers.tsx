"use client";

import "@/lib/shared-config";
import React, { useState, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@shop/shared/context/ThemeProvider";
import { LanguageProvider } from "@shop/shared/context/LanguageProvider";
import { ToastProvider } from "@shop/shared/context/ToastProvider";
import { AuthProvider } from "@shop/shared/context/AuthProvider";
import PageLoader from "@shop/shared/components/common/PageLoader";
import { CartProvider } from "@/context/CartProvider";
import { AIChatProvider } from "@/context/AIChatProvider";
import Navbar from "@/components/customer/layout/Navbar";
import Footer from "@/components/customer/layout/Footer";
import AIChatBubble from "@/components/customer/chatbot/AIChatBubble";
import AosInit from "@/components/customer/common/AosInit";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <LanguageProvider>
          <ToastProvider>
            <AuthProvider>
              <CartProvider>
                <AIChatProvider>
                  <AosInit />
                  <div className="flex flex-col min-h-screen bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 transition-colors duration-300">
                    <Suspense fallback={null}>
                      <Navbar />
                    </Suspense>
                    <main className="pt-16 flex-1 flex flex-col">
                      <Suspense fallback={<PageLoader />}>{children}</Suspense>
                    </main>
                    <Suspense fallback={null}>
                      <Footer />
                    </Suspense>
                    <AIChatBubble />
                  </div>
                </AIChatProvider>
              </CartProvider>
            </AuthProvider>
          </ToastProvider>
        </LanguageProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
