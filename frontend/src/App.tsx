import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { ThemeProvider } from "./context/ThemeContext.tsx";
import { LanguageProvider } from "./context/LanguageContext.tsx";
import { CartProvider } from "./context/CartContext.tsx";
import { AuthProvider } from "./context/AuthContext.tsx";
import { AIChatProvider } from "./context/AIChatContext.tsx";
import { ToastProvider } from "./context/ToastContext.tsx";

import ProtectedRoute from "./components/auth/ProtectedRoute.tsx";
import Navbar from "./components/customer/layout/Navbar.tsx";
import Footer from "./components/customer/layout/Footer.tsx";
import AIChatBubble from "./components/customer/chatbot/AIChatBubble.tsx";
import AdminLayout from "./components/admin/layout/AdminLayout.tsx";

import Home from "./pages/customer/Home.tsx";
import Cart from "./pages/customer/Cart.tsx";
import Login from "./pages/auth/Login.tsx";
import Register from "./pages/auth/Register.tsx";
import Checkout from "./pages/customer/Checkout.tsx";
import Order from "./pages/customer/OrderLookup.tsx";
import Search from "./pages/customer/Search.tsx";
import ProductDetail from "./pages/customer/ProductDetail.tsx";
import Category from "./pages/customer/Category.tsx";
import Profile from "./pages/customer/Profile.tsx";
import SalesPolicy from "./pages/customer/SalesPolicy.tsx";
import PaymentReturn from "./pages/customer/PaymentReturn.tsx";
import NotFound from "./pages/NotFound.tsx";

import Dashboard from "./pages/admin/Dashboard.tsx";
import ProductDetailManager from "./pages/admin/ProductDetailManager.tsx";
import BannerManager from "./pages/admin/BannerManager.tsx";
import ProductManager from "./pages/admin/ProductManager.tsx";
import OrderManager from "./pages/admin/OrderManager.tsx";
import CategoryManager from "./pages/admin/CategoryManager.tsx";
import Report from "./pages/admin/Report.tsx";
import SaleManager from "./pages/admin/SaleManager.tsx";
import VoucherManager from "./pages/admin/VoucherManager.tsx";
import PromotionManager from "./pages/admin/PromotionManager.tsx";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // Cache for 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
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

                          {/* --- ADMIN ROUTES (shared AdminLayout + single ProtectedRoute) --- */}
                          <Route
                            element={
                              <ProtectedRoute roleRequired="admin">
                                <AdminLayout />
                              </ProtectedRoute>
                            }
                          >
                            <Route path="/admin" element={<Dashboard />} />
                            <Route path="/admin/banners" element={<BannerManager />} />
                            <Route path="/admin/products" element={<ProductManager />} />
                            <Route path="/admin/products/:id" element={<ProductDetailManager />} />
                            <Route path="/admin/orders" element={<OrderManager />} />
                            <Route path="/admin/categories" element={<CategoryManager />} />
                            <Route path="/admin/report" element={<Report />} />
                            <Route path="/admin/vouchers" element={<VoucherManager />} />
                            <Route path="/admin/sales" element={<SaleManager />} />
                            <Route path="/admin/promotions" element={<PromotionManager />} />
                          </Route>

                          {/* --- 404 CATCH-ALL --- */}
                          <Route path="*" element={<NotFound />} />
                        </Routes>
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
  );
}

export default App;
