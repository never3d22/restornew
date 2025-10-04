import { FormEvent, useState } from "react";
import { trpc } from "@/api/trpc";
import { useAuthStore } from "@/store/auth";

const initialForm = {
  label: "",
  street: "",
  city: "",
  entrance: "",
  floor: "",
  apartment: ""
};

type FormState = typeof initialForm;

export function AddressesPage() {
  const customerId = useAuthStore((state) => state.customerId);
  const [form, setForm] = useState<FormState>(initialForm);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const addressesQuery = trpc.addresses.list.useQuery(undefined, {
    enabled: Boolean(customerId)
  });

  const createAddress = trpc.addresses.create.useMutation({
    onSuccess: () => {
      setForm(initialForm);
      setStatus("Адрес сохранён");
      setError(null);
      addressesQuery.refetch();
    },
    onError: (mutationError) => {
      setError(mutationError.message);
      setStatus(null);
    }
  });

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    createAddress.mutate({
      label: form.label,
      street: form.street,
      city: form.city,
      entrance: form.entrance || undefined,
      floor: form.floor || undefined,
      apartment: form.apartment || undefined
    });
  };

  return (
    <div className="card">
      <h1 className="cardTitle">Мои адреса</h1>
      <p className="cardSubtitle">Сохраняйте адреса доставки, чтобы быстро оформлять заказы.</p>
      <form className="inputRow" style={{ flexDirection: "column", gap: 16 }} onSubmit={handleSubmit}>
        <div className="inputRow">
          <input
            placeholder="Название адреса (дом, офис)"
            value={form.label}
            onChange={(event) => setForm((prev) => ({ ...prev, label: event.target.value }))}
            required
          />
          <input
            placeholder="Город"
            value={form.city}
            onChange={(event) => setForm((prev) => ({ ...prev, city: event.target.value }))}
            required
          />
          <input
            placeholder="Улица, дом"
            value={form.street}
            onChange={(event) => setForm((prev) => ({ ...prev, street: event.target.value }))}
            required
          />
        </div>
        <div className="inputRow">
          <input
            placeholder="Подъезд"
            value={form.entrance}
            onChange={(event) => setForm((prev) => ({ ...prev, entrance: event.target.value }))}
          />
          <input
            placeholder="Этаж"
            value={form.floor}
            onChange={(event) => setForm((prev) => ({ ...prev, floor: event.target.value }))}
          />
          <input
            placeholder="Квартира"
            value={form.apartment}
            onChange={(event) => setForm((prev) => ({ ...prev, apartment: event.target.value }))}
          />
        </div>
        <button className="button" type="submit" disabled={createAddress.isPending}>
          {createAddress.isPending ? "Сохраняем..." : "Добавить адрес"}
        </button>
        {status ? <span style={{ color: "#047857" }}>{status}</span> : null}
        {error ? <span style={{ color: "#dc2626" }}>{error}</span> : null}
      </form>
      <div>
        <h2 className="sectionTitle">Сохранённые адреса</h2>
        {addressesQuery.isLoading ? <p>Загружаем...</p> : null}
        {addressesQuery.isError ? (
          <p style={{ color: "#dc2626" }}>{addressesQuery.error.message}</p>
        ) : null}
        {addressesQuery.data && addressesQuery.data.length === 0 ? (
          <p>Адресов пока нет.</p>
        ) : null}
        <div className="grid">
          {addressesQuery.data?.map((address) => (
            <article key={address.id} className="card" style={{ padding: 20 }}>
              <h3 style={{ marginTop: 0 }}>{address.label}</h3>
              <p style={{ margin: "4px 0", color: "#475569" }}>
                {address.city}, {address.street}
              </p>
              <p style={{ margin: "4px 0", color: "#94a3b8" }}>
                {[address.entrance && `Подъезд ${address.entrance}`, address.floor && `Этаж ${address.floor}`, address.apartment && `Кв. ${address.apartment}`]
                  .filter(Boolean)
                  .join(" • ") || "Без дополнительных деталей"}
              </p>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
