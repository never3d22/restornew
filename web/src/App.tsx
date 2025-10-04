import { NavLink, Route, Routes } from "react-router-dom";
import { useMemo } from "react";
import { MenuPage } from "@/pages/MenuPage";
import { CartPage } from "@/pages/CartPage";
import { AddressesPage } from "@/pages/AddressesPage";
import { OrdersPage } from "@/pages/OrdersPage";
import { AdminPage } from "@/pages/AdminPage";
import { LoginPanel } from "@/components/LoginPanel";
import { AdminSecretPanel } from "@/components/AdminSecretPanel";
import { useCartStore } from "@/store/cart";
import { useAuthStore } from "@/store/auth";
import "./App.css";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const customerId = useAuthStore((state) => state.customerId);

  if (!customerId) {
    return (
      <div className="card">
        <h2 className="cardTitle">Требуется вход</h2>
        <p className="cardSubtitle">
          Войдите по номеру телефона вверху, чтобы получить доступ к этой странице.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}

export default function App() {
  const items = useCartStore((state) => state.items);

  const cartCount = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items]
  );

  return (
    <div className="app">
      <header className="header">
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <span className="brand">RestorNew</span>
          <span style={{ color: "#64748b", fontSize: 13 }}>
            Онлайн-заказы для клиентов и администраторов
          </span>
        </div>
        <nav className="nav">
          <NavLink to="/" end>
            Меню
          </NavLink>
          <NavLink to="/cart">
            Корзина{cartCount > 0 ? ` (${cartCount})` : ""}
          </NavLink>
          <NavLink to="/addresses">Адреса</NavLink>
          <NavLink to="/orders">Мои заказы</NavLink>
          <NavLink to="/admin">Админ</NavLink>
        </nav>
        <div className="headerActions">
          <LoginPanel />
          <AdminSecretPanel />
        </div>
      </header>
      <main className="main">
        <div className="content">
          <Routes>
            <Route index element={<MenuPage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route
              path="/addresses"
              element={
                <ProtectedRoute>
                  <AddressesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/orders"
              element={
                <ProtectedRoute>
                  <OrdersPage />
                </ProtectedRoute>
              }
            />
            <Route path="/admin" element={<AdminPage />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}
