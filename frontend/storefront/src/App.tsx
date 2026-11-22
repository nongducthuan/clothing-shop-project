import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HelmetProvider } from "react-helmet-async";

import { ThemeProvider } from "@shop/shared/context/ThemeProvider";
import { LanguageProvider } from "@shop/shared/context/LanguageProvider";
import { AuthProvider } from "@shop/shared/context/AuthProvider";
import { ToastProvider } from "@shop/shared/context/ToastProvider";
import PageLoader from "@shop/shared/components/common/PageLoader";

import { CartProvider } from "./context/CartProvider";
import { AIChatProvider } from "./context/AIChatProvider";

import ProtectedRoute from "./components/auth/ProtectedRoute";
import Navbar from "./components/customer/layout/Navbar";
import Footer from "./components/customer/layout/Footer";
import AIChatBubble from "./components/customer/chatbot/AIChatBubble";

// Eager loaded for instant first page render
import Home from "./views/customer/Home";

// Customer & Auth Pages (Lazy loaded)
const Cart = lazy(() => import("./views/customer/Cart"));
const Login = lazy(() => import("./views/auth/Login"));
const Register = lazy(() => import("./views/auth/Register"));
const Checkout = lazy(() => import("./views/customer/Checkout"));
const Order = lazy(() => import("./views/customer/OrderLookup"));
const Search = lazy(() => import("./views/customer/Search"));
const ProductDetail = lazy(() => import("./views/customer/ProductDetail"));
const Category = lazy(() => import("./views/customer/Category"));
const Profile = lazy(() => import("./views/customer/Profile"));
const SalesPolicy = lazy(() => import("./views/customer/SalesPolicy"));
const PaymentReturn = lazy(() => import("./views/customer/PaymentReturn"));
const NotFound = lazy(() => import("./views/NotFound"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export default function App() {
  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <LanguageProvider>
            <ToastProvider>
              <AuthProvider>
                <CartProvider>
                  <AIChatProvider>
                    <BrowserRouter>
                      <div className="flex flex-col min-h-screen bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 transition-colors duration-300">
                        <Navbar />

                        <main className="pt-16 flex-1 flex flex-col">
                          <Suspense fallback={<PageLoader />}>
                            <Routes>
                              {/* --- PUBLIC ROUTES --- */}
                              <Route path="/" element={<Home />} />
                              <Route path="/products/:id" element={<ProductDetail />} />
                              <Route path="/category/:id" element={<Category />} />
                              <Route path="/search" element={<Search />} />
                              <Route path="/cart" element={<Cart />} />
                              <Route path="/checkout" element={<Checkout />} />
                              <Route path="/order" element={<Order />} />
                              <Route path="/login" element={<Login />} />
                              <Route path="/register" element={<Register />} />
                              <Route path="/sales-policy" element={<SalesPolicy />} />
                              <Route path="/payment-return" element={<PaymentReturn />} />

                              {/* --- PROTECTED USER ROUTES --- */}
                              <Route
                                path="/profile"
                                element={
                                  <ProtectedRoute>
                                    <Profile />
                                  </ProtectedRoute>
                                }
                              />

                              {/* --- 404 CATCH-ALL --- */}
                              <Route path="*" element={<NotFound />} />
                            </Routes>
                          </Suspense>
                        </main>

                        <Footer />
                        <AIChatBubble />
                      </div>
                    </BrowserRouter>
                  </AIChatProvider>
                </CartProvider>
              </AuthProvider>
            </ToastProvider>
          </LanguageProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
}
