import { FormEvent, useState } from "react";
import { useAdminStore } from "@/store/admin";

export function AdminSecretPanel() {
  const { adminSecret, setSecret, reset } = useAdminStore();
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!value.trim()) {
      setError("Введите секрет");
      return;
    }
    setSecret(value.trim());
    setValue("");
    setError(null);
  };

  if (adminSecret) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span className="badge">Админ режим</span>
        <button className="button secondary" type="button" onClick={() => reset()}>
          Выйти
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="inputRow"
      style={{ alignItems: "flex-end", minHeight: 68 }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <label htmlFor="admin-secret" style={{ fontSize: 13, fontWeight: 600, color: "#4b5563" }}>
          Админ секрет
        </label>
        <input
          id="admin-secret"
          type="password"
          placeholder="Введите секрет"
          value={value}
          onChange={(event) => setValue(event.target.value)}
        />
      </div>
      <button className="button secondary" type="submit">
        Войти
      </button>
      <div style={{ minHeight: 20, fontSize: 12 }}>
        {error ? <span style={{ color: "#dc2626" }}>{error}</span> : null}
      </div>
    </form>
  );
}
