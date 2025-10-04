import { useMemo, useState } from "react";
import { trpc } from "@/api/trpc";
import { useCartStore } from "@/store/cart";
import { useAuthStore } from "@/store/auth";

export function CartPage() {
  const items = useCartStore((state) => state.items);
  const clear = useCartStore((state) => state.clear);
  const increment = useCartStore((state) => state.increment);
  const decrement = useCartStore((state) => state.decrement);
  const removeItem = useCartStore((state) => state.removeItem);
  const customerId = useAuthStore((state) => state.customerId);

  const total = useMemo(
    () => items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [items]
  );

  const [selectedAddress, setSelectedAddress] = useState<number | "pickup" | undefined>();
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const addressesQuery = trpc.addresses.list.useQuery(undefined, {
    enabled: Boolean(customerId)
  });

  const createOrder = trpc.orders.create.useMutation({
    onSuccess: ({ orderId }) => {
      setStatus(`Заказ №${orderId} оформлен`);
      setError(null);
      clear();
    },
    onError: (mutationError) => {
      setError(mutationError.message);
      setStatus(null);
    }
  });

  const canCheckout = Boolean(customerId) && items.length > 0;

  const handleCheckout = () => {
    if (!canCheckout) return;
    const addressId = selectedAddress && selectedAddress !== "pickup" ? selectedAddress : undefined;
    createOrder.mutate({
      addressId,
      items: items.map((item) => ({ dishId: item.dishId, quantity: item.quantity }))
    });
  };

  return (
    <div className="card">
      <h1 className="cardTitle">Корзина</h1>
      <p className="cardSubtitle">Проверьте содержимое корзины и выберите адрес доставки.</p>
      {items.length === 0 ? <p>Корзина пуста. Добавьте блюда из меню.</p> : null}
      {items.length > 0 ? (
        <table className="table">
          <thead>
            <tr>
              <th>Блюдо</th>
              <th>Цена</th>
              <th>Кол-во</th>
              <th>Сумма</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.dishId}>
                <td>{item.name}</td>
                <td>{item.price.toFixed(2)} ₽</td>
                <td>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <button className="button secondary" type="button" onClick={() => decrement(item.dishId)}>
                      −
                    </button>
                    <span>{item.quantity}</span>
                    <button className="button secondary" type="button" onClick={() => increment(item.dishId)}>
                      +
                    </button>
                  </div>
                </td>
                <td>{(item.price * item.quantity).toFixed(2)} ₽</td>
                <td>
                  <button className="button secondary" type="button" onClick={() => removeItem(item.dishId)}>
                    Удалить
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}
      <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 24 }}>
        <strong style={{ fontSize: 18 }}>Итого: {total.toFixed(2)} ₽</strong>
        {customerId ? (
          <>
            <label htmlFor="address-select" style={{ fontWeight: 600 }}>
              Адрес доставки
            </label>
            <select
              id="address-select"
              value={selectedAddress ?? "pickup"}
              onChange={(event) => {
                const value = event.target.value;
                setSelectedAddress(value === "pickup" ? "pickup" : Number(value));
              }}
            >
              <option value="pickup">Самовывоз / без адреса</option>
              {addressesQuery.data?.map((address) => (
                <option key={address.id} value={address.id}>
                  {address.label} — {address.city}, {address.street}
                </option>
              ))}
            </select>
            <button
              className="button"
              type="button"
              disabled={!canCheckout || createOrder.isPending}
              onClick={handleCheckout}
            >
              {createOrder.isPending ? "Оформляем..." : "Оформить заказ"}
            </button>
          </>
        ) : (
          <p style={{ color: "#6b7280" }}>Авторизуйтесь выше, чтобы оформить заказ и выбрать адрес.</p>
        )}
        {status ? <span style={{ color: "#047857" }}>{status}</span> : null}
        {error ? <span style={{ color: "#dc2626" }}>{error}</span> : null}
      </div>
    </div>
  );
}
