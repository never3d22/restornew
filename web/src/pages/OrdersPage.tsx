import { trpc } from "@/api/trpc";
import { useAuthStore } from "@/store/auth";
import type { RouterOutputs } from "@/types/trpc";

export function OrdersPage() {
  const customerId = useAuthStore((state) => state.customerId);
  const { data, isLoading, isError, error, refetch } = trpc.orders.history.useQuery(undefined, {
    enabled: Boolean(customerId)
  });

  return (
    <div className="card">
      <h1 className="cardTitle">История заказов</h1>
      <p className="cardSubtitle">Просматривайте текущие и завершённые заказы.</p>
      <div className="actionsRow">
        <button className="button secondary" type="button" onClick={() => refetch()} disabled={isLoading}>
          Обновить
        </button>
      </div>
      {isLoading ? <p>Загружаем...</p> : null}
      {isError ? <p style={{ color: "#dc2626" }}>{error?.message ?? "Не удалось получить заказы"}</p> : null}
      {data && data.length === 0 && !isLoading ? <p>Заказов пока нет.</p> : null}
      <div className="grid">
        {data?.map((order: RouterOutputs["orders"]["history"][number]) => (
          <article key={order.id} className="card" style={{ padding: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0 }}>Заказ №{order.id}</h3>
              <span className="badge">{order.status}</span>
            </div>
            <p style={{ margin: "8px 0", color: "#475569" }}>
              Сумма: {Number(order.total).toFixed(2)} ₽ — {new Date(order.createdAt).toLocaleString("ru-RU")}
            </p>
            {order.address ? (
              <p style={{ margin: "4px 0", color: "#94a3b8" }}>
                Доставка: {order.address.label} ({order.address.city}, {order.address.street})
              </p>
            ) : (
              <p style={{ margin: "4px 0", color: "#94a3b8" }}>Самовывоз</p>
            )}
            <ul style={{ margin: "12px 0 0", paddingLeft: 18 }}>
              {order.items.map((item: RouterOutputs["orders"]["history"][number]["items"][number]) => (
                <li key={item.id} style={{ marginBottom: 4 }}>
                  {item.dish?.name ?? "Блюдо удалено"} — {item.quantity} шт. × {Number(item.price).toFixed(2)} ₽
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </div>
  );
}
