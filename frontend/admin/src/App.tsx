import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@shop/shared/context/ThemeProvider";
import { LanguageProvider } from "@shop/shared/context/LanguageProvider";
import { AuthProvider } from "@shop/shared/context/AuthProvider";
import { ToastProvider } from "@shop/shared/context/ToastProvider";
import PageLoader from "@shop/shared/components/common/PageLoader";

import ProtectedRoute from "./components/auth/ProtectedRoute";
import AdminLayout from "./components/layout/AdminLayout";
import Login from "./pages/auth/Login";
import NotFound from "./pages/NotFound";

// Admin Pages (Lazy loaded)
const Dashboard = lazy(() => import("./pages/Dashboard"));
const ProductDetailManager = lazy(() => import("./pages/ProductDetailManager"));
const BannerManager = lazy(() => import("./pages/BannerManager"));
const ProductManager = lazy(() => import("./pages/ProductManager"));
const OrderManager = lazy(() => import("./pages/OrderManager"));
const CategoryManager = lazy(() => import("./pages/CategoryManager"));
const Report = lazy(() => import("./pages/Report"));
const SaleManager = lazy(() => import("./pages/SaleManager"));
const VoucherManager = lazy(() => import("./pages/VoucherManager"));
const PromotionManager = lazy(() => import("./pages/PromotionManager"));
const UserManager = lazy(() => import("./pages/UserManager"));

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
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <LanguageProvider>
          <ToastProvider>
            <AuthProvider>
              <BrowserRouter>
                <Suspense fallback={<PageLoader />}>
                  <Routes>
                    <Route path="/login" element={<Login />} />

                    <Route
                      path="/"
                      element={
                        <ProtectedRoute roleRequired="admin">
                          <AdminLayout />
                        </ProtectedRoute>
                      }
                    >
                      <Route index element={<Dashboard />} />
                      <Route path="banners" element={<BannerManager />} />
                      <Route path="products" element={<ProductManager />} />
                      <Route path="products/:id" element={<ProductDetailManager />} />
                      <Route path="orders" element={<OrderManager />} />
                      <Route path="categories" element={<CategoryManager />} />
                      <Route path="report" element={<Report />} />
                      <Route path="vouchers" element={<VoucherManager />} />
                      <Route path="sales" element={<SaleManager />} />
                      <Route path="promotions" element={<PromotionManager />} />
                      <Route path="users" element={<UserManager />} />
                    </Route>

                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Suspense>
              </BrowserRouter>
            </AuthProvider>
          </ToastProvider>
        </LanguageProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
