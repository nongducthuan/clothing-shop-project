import { BrowserRouter, Routes, Route } from "react-router-dom";

// Context Providers
import { CartProvider } from "./context/CartContext.tsx";
import { AuthProvider } from "./context/AuthContext.tsx";
import { AIChatProvider } from "./context/AIChatContext.tsx";

// Components
import ProtectedRoute from "./components/auth/ProtectedRoute.tsx";
import Navbar from "./components/customer/layout/Navbar.tsx";

import AIChatBubble from "./components/customer/chatbot/AIChatBubble.tsx";

// Pages - Public
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

// Pages - Admin
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


function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <AIChatProvider>
          <BrowserRouter>
            <Navbar />

            <main className="pt-16 min-h-screen flex flex-col">
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

                {/* --- PROTECTED USER ROUTES --- */}
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <Profile />
                    </ProtectedRoute>
                  }
                />

                {/* --- ADMIN ROUTES --- */}
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute roleRequired="admin">
                      <Dashboard />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/admin/banners"
                  element={
                    <ProtectedRoute roleRequired="admin">
                      <BannerManager />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/admin/products"
                  element={
                    <ProtectedRoute roleRequired="admin">
                      <ProductManager />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/admin/orders"
                  element={
                    <ProtectedRoute roleRequired="admin">
                      <OrderManager />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/admin/products/:id"
                  element={
                    <ProtectedRoute roleRequired="admin">
                      <ProductDetailManager />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/admin/report"
                  element={
                    <ProtectedRoute roleRequired="admin">
                      <Report />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/admin/categories"
                  element={
                    <ProtectedRoute roleRequired="admin">
                      <CategoryManager />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/admin/vouchers"
                  element={
                    <ProtectedRoute roleRequired="admin">
                      <VoucherManager />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/admin/sales"
                  element={
                    <ProtectedRoute roleRequired="admin">
                      <SaleManager />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/admin/promotions"
                  element={
                    <ProtectedRoute roleRequired="admin">
                      <PromotionManager />
                    </ProtectedRoute>
                  }
                />
              </Routes>
            </main>

            <AIChatBubble />
          </BrowserRouter>
        </AIChatProvider>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
