import { FormEvent, useMemo, useState } from "react";
import { trpc } from "@/api/trpc";
import { useAdminStore } from "@/store/admin";
import type { RouterOutputs, TrpcClientError } from "@/types/trpc";

type OrderStatus = "pending" | "confirmed" | "delivered" | "cancelled";

const statusLabels: Record<OrderStatus, string> = {
  pending: "Новый",
  confirmed: "Подтверждён",
  delivered: "Доставлен",
  cancelled: "Отменён"
};

type CategoryOption = { value: number; label: string };

type CategoryForm = {
  name: string;
  description: string;
};

type DishForm = {
  name: string;
  description: string;
  price: string;
  categoryId: string;
  imageUrl: string;
  isAvailable: boolean;
};

export function AdminPage() {
  const adminSecret = useAdminStore((state) => state.adminSecret);

  const [categoryForm, setCategoryForm] = useState<CategoryForm>({ name: "", description: "" });
  const [dishForm, setDishForm] = useState<DishForm>({
    name: "",
    description: "",
    price: "",
    categoryId: "",
    imageUrl: "",
    isAvailable: true
  });
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const ordersQuery = trpc.admin.orders.useQuery(undefined, {
    enabled: Boolean(adminSecret)
  });
  const menuQuery = trpc.menu.list.useQuery(undefined, {
    enabled: Boolean(adminSecret)
  });

  const orderStatuses: OrderStatus[] = ["pending", "confirmed", "delivered", "cancelled"];

  const createCategory = trpc.admin.createCategory.useMutation({
    onSuccess: () => {
      setCategoryForm({ name: "", description: "" });
      setStatusMessage("Категория создана");
      setErrorMessage(null);
      menuQuery.refetch();
    },
    onError: (mutationError: TrpcClientError) => {
      setErrorMessage(mutationError.message);
      setStatusMessage(null);
    }
  });

  const createDish = trpc.admin.dishes.useMutation({
    onSuccess: () => {
      setDishForm({ name: "", description: "", price: "", categoryId: "", imageUrl: "", isAvailable: true });
      setStatusMessage("Блюдо добавлено");
      setErrorMessage(null);
      menuQuery.refetch();
    },
    onError: (mutationError: TrpcClientError) => {
      setErrorMessage(mutationError.message);
      setStatusMessage(null);
    }
  });

  const updateStatus = trpc.admin.updateOrderStatus.useMutation({
    onSuccess: () => {
      ordersQuery.refetch();
      setStatusMessage("Статус заказа обновлён");
      setErrorMessage(null);
    },
    onError: (mutationError: TrpcClientError) => {
      setErrorMessage(mutationError.message);
      setStatusMessage(null);
    }
  });

  const categoryOptions = useMemo<CategoryOption[]>(() => {
    return (menuQuery.data ?? []).map((category: RouterOutputs["menu"]["list"][number]) => ({
      value: category.id,
      label: category.name
    }));
  }, [menuQuery.data]);

  const handleCategorySubmit = (event: FormEvent) => {
    event.preventDefault();
    createCategory.mutate({
      name: categoryForm.name,
      description: categoryForm.description || undefined
    });
  };

  const handleDishSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!dishForm.categoryId) {
      setErrorMessage("Выберите категорию");
      return;
    }
    const price = Number(dishForm.price);
    if (Number.isNaN(price) || price <= 0) {
      setErrorMessage("Введите корректную цену");
      return;
    }
    createDish.mutate({
      name: dishForm.name,
      description: dishForm.description,
      price,
      categoryId: Number(dishForm.categoryId),
      imageUrl: dishForm.imageUrl || undefined,
      isAvailable: dishForm.isAvailable
    });
  };

  if (!adminSecret) {
    return (
      <div className="card">
        <h1 className="cardTitle">Админ-панель</h1>
        <p className="cardSubtitle">
          Введите админ-секрет в шапке, чтобы просматривать заказы и управлять меню.
        </p>
      </div>
    );
  }

  return (
    <div className="card">
      <h1 className="cardTitle">Админ-панель</h1>
      <p className="cardSubtitle">Управление меню и заказами ресторана.</p>
      <div className="grid">
        <section className="card" style={{ padding: 20 }}>
          <h2 className="sectionTitle">Новая категория</h2>
          <form className="inputRow" style={{ flexDirection: "column", gap: 12 }} onSubmit={handleCategorySubmit}>
            <input
              placeholder="Название"
              value={categoryForm.name}
              onChange={(event) => setCategoryForm((prev) => ({ ...prev, name: event.target.value }))}
              required
            />
            <textarea
              placeholder="Описание"
              value={categoryForm.description}
              onChange={(event) => setCategoryForm((prev) => ({ ...prev, description: event.target.value }))}
              rows={3}
            />
            <button className="button" type="submit" disabled={createCategory.isPending}>
              {createCategory.isPending ? "Создаём..." : "Создать"}
            </button>
          </form>
        </section>
        <section className="card" style={{ padding: 20 }}>
          <h2 className="sectionTitle">Новое блюдо</h2>
          <form className="inputRow" style={{ flexDirection: "column", gap: 12 }} onSubmit={handleDishSubmit}>
            <input
              placeholder="Название"
              value={dishForm.name}
              onChange={(event) => setDishForm((prev) => ({ ...prev, name: event.target.value }))}
              required
            />
            <textarea
              placeholder="Описание"
              value={dishForm.description}
              onChange={(event) => setDishForm((prev) => ({ ...prev, description: event.target.value }))}
              rows={3}
              required
            />
            <div className="inputRow">
              <input
                placeholder="Цена"
                value={dishForm.price}
                onChange={(event) => setDishForm((prev) => ({ ...prev, price: event.target.value }))}
                required
              />
              <select
                value={dishForm.categoryId}
                onChange={(event) => setDishForm((prev) => ({ ...prev, categoryId: event.target.value }))}
                required
              >
                <option value="">Категория</option>
                {categoryOptions.map((category) => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
            </div>
            <input
              placeholder="Ссылка на изображение (необязательно)"
              value={dishForm.imageUrl}
              onChange={(event) => setDishForm((prev) => ({ ...prev, imageUrl: event.target.value }))}
            />
            <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input
                type="checkbox"
                checked={dishForm.isAvailable}
                onChange={(event) => setDishForm((prev) => ({ ...prev, isAvailable: event.target.checked }))}
              />
              Доступно для заказа
            </label>
            <button className="button" type="submit" disabled={createDish.isPending}>
              {createDish.isPending ? "Сохраняем..." : "Добавить блюдо"}
            </button>
          </form>
        </section>
      </div>
      {statusMessage ? <p style={{ color: "#047857" }}>{statusMessage}</p> : null}
      {errorMessage ? <p style={{ color: "#dc2626" }}>{errorMessage}</p> : null}
      <section>
        <h2 className="sectionTitle">Заказы</h2>
        <div className="actionsRow">
          <button className="button secondary" type="button" onClick={() => ordersQuery.refetch()} disabled={ordersQuery.isLoading}>
            Обновить
          </button>
        </div>
        {ordersQuery.isLoading ? <p>Загружаем заказы...</p> : null}
        {ordersQuery.isError ? (
          <p style={{ color: "#dc2626" }}>{ordersQuery.error.message}</p>
        ) : null}
        <div className="grid">
          {ordersQuery.data?.map((order: RouterOutputs["admin"]["orders"][number]) => (
            <article key={order.id} className="card" style={{ padding: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3 style={{ margin: 0 }}>Заказ №{order.id}</h3>
                <select
                  value={order.status as OrderStatus}
                  onChange={(event) =>
                    updateStatus.mutate({ orderId: order.id, status: event.target.value as OrderStatus })
                  }
                >
                  {orderStatuses.map((value) => (
                    <option key={value} value={value}>
                      {statusLabels[value]}
                    </option>
                  ))}
                </select>
              </div>
              <p style={{ margin: "8px 0", color: "#475569" }}>
                Клиент: {order.customer?.phone ?? "неизвестно"} • Сумма {Number(order.total).toFixed(2)} ₽
              </p>
              <p style={{ margin: "4px 0", color: "#94a3b8" }}>
                Создан: {new Date(order.createdAt).toLocaleString("ru-RU")}
              </p>
              <p style={{ margin: "4px 0", color: "#94a3b8" }}>
                {order.address
                  ? `${order.address.label} — ${order.address.city}, ${order.address.street}`
                  : "Самовывоз"}
              </p>
              <ul style={{ margin: "12px 0 0", paddingLeft: 18 }}>
                {order.items.map((item: RouterOutputs["admin"]["orders"][number]["items"][number]) => (
                  <li key={item.id}>
                    {item.dish?.name ?? "Блюдо удалено"} — {item.quantity} × {Number(item.price).toFixed(2)} ₽
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
