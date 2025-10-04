import { useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Alert,
  TextInput
} from "react-native";
import { trpc } from "@/api/trpc";
import { useAdminStore } from "@/store/admin";

const STATUSES = ["pending", "confirmed", "delivered", "cancelled"] as const;

type Status = (typeof STATUSES)[number];

export function AdminOrdersScreen() {
  const adminSecret = useAdminStore((state) => state.adminSecret);
  const setAdminSecret = useAdminStore((state) => state.setAdminSecret);
  const clearAdminSecret = useAdminStore((state) => state.clearAdminSecret);
  const [secretInput, setSecretInput] = useState(adminSecret ?? "");

  const { data, isLoading, refetch } = trpc.admin.orders.useQuery(undefined, {
    enabled: Boolean(adminSecret)
  });

  const mutation = trpc.admin.updateOrderStatus.useMutation({
    onSuccess: () => refetch()
  });

  const updateStatus = (orderId: number, status: Status) => {
    if (!adminSecret) {
      Alert.alert("Нет доступа", "Введите секрет администратора");
      return;
    }
    mutation.mutate(
      { orderId, status },
      {
        onSuccess: () => Alert.alert("Успех", "Статус заказа обновлен"),
        onError: (error) => Alert.alert("Ошибка", error.message)
      }
    );
  };

  if (!adminSecret) {
    return (
      <View style={styles.center}>
        <Text style={styles.helper}>
          Введите секрет администратора, чтобы просматривать и обновлять заказы.
        </Text>
        <TextInput
          value={secretInput}
          onChangeText={setSecretInput}
          placeholder="Админский секрет"
          placeholderTextColor="#999"
          secureTextEntry
          autoCapitalize="none"
          style={styles.input}
        />
        <TouchableOpacity
          style={[styles.statusButton, styles.primaryButton]}
          onPress={() => setAdminSecret(secretInput)}
        >
          <Text style={[styles.statusText, styles.primaryButtonText]}>Сохранить</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <FlatList
      data={data ?? []}
      keyExtractor={(item) => `${item.id}`}
      refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
      contentContainerStyle={styles.list}
      ListHeaderComponent={
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.changeSecret}
            onPress={() => {
              clearAdminSecret();
              setSecretInput("");
            }}
          >
            <Text style={styles.changeSecretText}>Сменить секрет</Text>
          </TouchableOpacity>
        </View>
      }
      renderItem={({ item }) => (
        <View style={styles.card}>
          <Text style={styles.title}>Заказ #{item.id}</Text>
          <Text style={styles.subtitle}>Клиент: {item.customer?.phone}</Text>
          <Text style={styles.subtitle}>Сумма: {Number(item.total).toFixed(2)} ₽</Text>
          <View style={styles.items}>
            {item.items.map((line) => (
              <Text key={line.id} style={styles.itemText}>
                {line.quantity} x {line.dish.name}
              </Text>
            ))}
          </View>
          <View style={styles.statusRow}>
            {STATUSES.map((status) => (
              <TouchableOpacity
                key={status}
                style={[
                  styles.statusButton,
                  item.status === status && styles.statusButtonActive
                ]}
                onPress={() => updateStatus(item.id, status)}
              >
                <Text
                  style={[
                    styles.statusText,
                    item.status === status && styles.statusTextActive
                  ]}
                >
                  {status}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
      ListEmptyComponent={<Text style={styles.helper}>Заказов пока нет</Text>}
    />
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24
  },
  helper: {
    textAlign: "center",
    color: "#666",
    marginBottom: 16
  },
  input: {
    width: "100%",
    maxWidth: 320,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: "#333",
    marginTop: 12,
    marginBottom: 16
  },
  list: {
    padding: 16
  },
  header: {
    width: "100%",
    alignItems: "flex-end",
    marginBottom: 12
  },
  card: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2
  },
  changeSecret: {
    alignSelf: "flex-end"
  },
  changeSecretText: {
    color: "#ff7043",
    marginBottom: 8
  },
  title: {
    fontSize: 18,
    fontWeight: "600"
  },
  subtitle: {
    color: "#555",
    marginTop: 4
  },
  items: {
    marginTop: 12
  },
  itemText: {
    color: "#333"
  },
  statusRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 12,
    gap: 8
  },
  statusButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd"
  },
  statusButtonActive: {
    backgroundColor: "#ff7043",
    borderColor: "#ff7043"
  },
  primaryButton: {
    backgroundColor: "#ff7043",
    borderColor: "#ff7043"
  },
  primaryButtonText: {
    color: "#fff"
  },
  statusText: {
    color: "#555",
    textTransform: "capitalize"
  },
  statusTextActive: {
    color: "#fff"
  }
});
