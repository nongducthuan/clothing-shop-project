import { BrowserRouter, Routes, Route } from "react-router-dom";

// Context Providers
import { CartProvider } from "./context/CartContext.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import { AIChatProvider } from "./context/AIChatContext.jsx";

// Components
import ProtectedRoute from "./components/auth/ProtectedRoute.jsx";
import Navbar from "./components/client/layout/Navbar.jsx";
import AIChatBubble from "./components/client/chatbot/AIChatBubble.jsx";

// Pages - Public
import Home from "./pages/client/Home.jsx";
import Cart from "./pages/client/Cart.jsx";
import Login from "./pages/auth/Login.jsx";
import Register from "./pages/auth/Register.jsx";
import Checkout from "./pages/client/Checkout.jsx";
import Order from "./pages/client/OrderLookup.jsx";
import Search from "./pages/client/Search.jsx";
import ProductDetail from "./pages/client/ProductDetail.jsx";
import Category from "./pages/client/Category.jsx";
import Profile from "./pages/client/Profile.jsx";
import SalesPolicy from "./pages/client/SalesPolicy.jsx";

// Pages - Admin
import Dashboard from "./pages/admin/Dashboard.jsx";
import ProductDetailManager from "./pages/admin/ProductDetailManager.jsx";
import BannerManager from "./pages/admin/BannerManager.jsx";
import ProductManager from "./pages/admin/ProductManager.jsx";
import OrderManager from "./pages/admin/OrderManager.jsx";
import CategoryManager from "./pages/admin/CategoryManager.jsx";
import Report from "./pages/admin/Report.jsx";
import SaleManager from "./pages/admin/SaleManager";
import VoucherManager from "./pages/admin/VoucherManager";
import PromotionManager from "./pages/admin/PromotionManager.jsx";

// Styles
import "./styles/style.css";

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
