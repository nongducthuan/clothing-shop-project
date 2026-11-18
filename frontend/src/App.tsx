import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HelmetProvider } from "react-helmet-async";

import { ThemeProvider } from "./context/ThemeProvider.tsx";
import { LanguageProvider } from "./context/LanguageProvider.tsx";
import { CartProvider } from "./context/CartProvider.tsx";
import { AuthProvider } from "./context/AuthProvider.tsx";
import { AIChatProvider } from "./context/AIChatProvider.tsx";
import { ToastProvider } from "./context/ToastProvider.tsx";

import ProtectedRoute from "./components/auth/ProtectedRoute.tsx";
import Navbar from "./components/customer/layout/Navbar.tsx";
import Footer from "./components/customer/layout/Footer.tsx";
import AIChatBubble from "./components/customer/chatbot/AIChatBubble.tsx";
import AdminLayout from "./components/admin/layout/AdminLayout.tsx";
import PageLoader from "./components/common/PageLoader.tsx";

// Eager loaded for instant first page render
import Home from "./pages/customer/Home.tsx";

// Customer & Auth Pages (Lazy loaded)
const Cart = lazy(() => import("./pages/customer/Cart.tsx"));
const Login = lazy(() => import("./pages/auth/Login.tsx"));
const Register = lazy(() => import("./pages/auth/Register.tsx"));
const Checkout = lazy(() => import("./pages/customer/Checkout.tsx"));
const Order = lazy(() => import("./pages/customer/OrderLookup.tsx"));
const Search = lazy(() => import("./pages/customer/Search.tsx"));
const ProductDetail = lazy(() => import("./pages/customer/ProductDetail.tsx"));
const Category = lazy(() => import("./pages/customer/Category.tsx"));
const Profile = lazy(() => import("./pages/customer/Profile.tsx"));
const SalesPolicy = lazy(() => import("./pages/customer/SalesPolicy.tsx"));
const PaymentReturn = lazy(() => import("./pages/customer/PaymentReturn.tsx"));
const NotFound = lazy(() => import("./pages/NotFound.tsx"));

// Admin Pages (Lazy loaded - saves heavy bundles like charts & management grids)
const Dashboard = lazy(() => import("./pages/admin/Dashboard.tsx"));
const ProductDetailManager = lazy(() => import("./pages/admin/ProductDetailManager.tsx"));
const BannerManager = lazy(() => import("./pages/admin/BannerManager.tsx"));
const ProductManager = lazy(() => import("./pages/admin/ProductManager.tsx"));
const OrderManager = lazy(() => import("./pages/admin/OrderManager.tsx"));
const CategoryManager = lazy(() => import("./pages/admin/CategoryManager.tsx"));
const Report = lazy(() => import("./pages/admin/Report.tsx"));
const SaleManager = lazy(() => import("./pages/admin/SaleManager.tsx"));
const VoucherManager = lazy(() => import("./pages/admin/VoucherManager.tsx"));
const PromotionManager = lazy(() => import("./pages/admin/PromotionManager.tsx"));
const UserManager = lazy(() => import("./pages/admin/UserManager.tsx"));

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
                                <Route path="/admin/users" element={<UserManager />} />
                              </Route>

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

export default App;
