import { FormEvent, useMemo, useState } from "react";
import { trpc } from "@/api/trpc";
import { useAuthStore } from "@/store/auth";
import type { RouterOutputs, TrpcClientError } from "@/types/trpc";

export function LoginPanel() {
  const { customerId, phone, codeSent, setPhone, setCustomer, setCodeSent, reset } =
    useAuthStore();
  const [localPhone, setLocalPhone] = useState(phone ?? "");
  const [code, setCode] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const requestCode = trpc.auth.requestCode.useMutation({
    onSuccess: () => {
      setCodeSent(true);
      setMessage("Код отправлен. Введите 1234 для тестового входа.");
      setError(null);
    },
    onError: (mutationError: TrpcClientError) => {
      setError(mutationError.message);
      setMessage(null);
    }
  });

  const verifyCode = trpc.auth.verifyCode.useMutation({
    onSuccess: ({ customerId: id }: RouterOutputs["auth"]["verifyCode"]) => {
      setCustomer(id);
      setCodeSent(false);
      setMessage("Вы вошли в систему");
      setError(null);
      setCode("");
    },
    onError: (mutationError: TrpcClientError) => {
      setError(mutationError.message);
      setMessage(null);
    }
  });

  const disabled = useMemo(() => !localPhone || requestCode.isPending, [localPhone, requestCode.isPending]);

  const handleSend = (event: FormEvent) => {
    event.preventDefault();
    if (!localPhone) return;
    setPhone(localPhone);
    requestCode.mutate({ phone: localPhone });
  };

  const handleVerify = (event: FormEvent) => {
    event.preventDefault();
    if (!phone || !code) return;
    verifyCode.mutate({ phone, code });
  };

  if (customerId) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span className="badge">ID клиента: {customerId}</span>
        <button className="button secondary" type="button" onClick={() => reset()}>
          Выйти
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSend}
      className="inputRow"
      style={{ alignItems: "flex-end", minHeight: 68 }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <label htmlFor="phone" style={{ fontSize: 13, fontWeight: 600, color: "#4b5563" }}>
          Телефон
        </label>
        <input
          id="phone"
          type="tel"
          placeholder="79001234567"
          value={localPhone}
          onChange={(event) => setLocalPhone(event.target.value)}
          required
        />
      </div>
      {codeSent ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <label htmlFor="code" style={{ fontSize: 13, fontWeight: 600, color: "#4b5563" }}>
            Код из SMS
          </label>
          <input
            id="code"
            type="text"
            placeholder="1234"
            value={code}
            onChange={(event) => setCode(event.target.value)}
            required
          />
        </div>
      ) : null}
      <div style={{ display: "flex", gap: 8 }}>
        <button className="button secondary" type="submit" disabled={disabled}>
          {requestCode.isPending ? "Отправляем..." : "Получить код"}
        </button>
        {codeSent ? (
          <button
            className="button"
            type="button"
            onClick={handleVerify}
            disabled={!code || verifyCode.isPending}
          >
            {verifyCode.isPending ? "Входим..." : "Подтвердить"}
          </button>
        ) : null}
      </div>
      <div style={{ minHeight: 20, fontSize: 12 }}>
        {message ? <span style={{ color: "#047857" }}>{message}</span> : null}
        {error ? <span style={{ color: "#dc2626" }}>{error}</span> : null}
      </div>
    </form>
  );
}
