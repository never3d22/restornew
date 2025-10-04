import { useMemo } from "react";
import { trpc } from "@/api/trpc";
import { useCartStore } from "@/store/cart";

export function MenuPage() {
  const { data, isLoading, isError, refetch, error } = trpc.menu.list.useQuery();
  const addItem = useCartStore((state) => state.addItem);

  const dishes = useMemo(() => {
    if (!data) return [];
    return data.flatMap((category) =>
      category.dishes
        .filter((dish) => dish.isAvailable)
        .map((dish) => ({
          ...dish,
          categoryName: category.name
        }))
    );
  }, [data]);

  return (
    <div className="card">
      <h1 className="cardTitle">Меню</h1>
      <p className="cardSubtitle">
        Добавляйте блюда в корзину и оформляйте заказ. Данные синхронизированы с мобильным приложением.
      </p>
      {isLoading ? <p>Загружаем меню...</p> : null}
      {isError ? <p style={{ color: "#dc2626" }}>{error?.message ?? "Не удалось загрузить меню"}</p> : null}
      <div className="actionsRow">
        <button className="button secondary" type="button" onClick={() => refetch()} disabled={isLoading}>
          Обновить
        </button>
      </div>
      {dishes.length === 0 && !isLoading ? (
        <p style={{ color: "#6b7280" }}>
          Меню пока пустое. Создайте категории и блюда в админ-панели.
        </p>
      ) : null}
      <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))" }}>
        {dishes.map((dish) => (
          <article key={dish.id} className="card" style={{ padding: 20 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <span className="badge">{dish.categoryName}</span>
              <h3 style={{ margin: 0 }}>{dish.name}</h3>
              {dish.description ? (
                <p style={{ margin: 0, color: "#64748b" }}>{dish.description}</p>
              ) : null}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <strong>{Number(dish.price).toFixed(2)} ₽</strong>
                <button
                  className="button"
                  type="button"
                  onClick={() =>
                    addItem({ dishId: dish.id, name: dish.name, price: Number(dish.price) })
                  }
                >
                  В корзину
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
