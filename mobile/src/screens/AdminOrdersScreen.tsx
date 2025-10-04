import { useState } from "react";
import { View, Text, FlatList, StyleSheet, TouchableOpacity, RefreshControl, Alert } from "react-native";
import { trpc } from "@/api/trpc";

const STATUSES = ["pending", "confirmed", "delivered", "cancelled"] as const;

type Status = (typeof STATUSES)[number];

export function AdminOrdersScreen() {
  const [adminSecret] = useState<string | undefined>(process.env.EXPO_PUBLIC_ADMIN_SECRET);

  const { data, isLoading, refetch } = trpc.admin.orders.useQuery(undefined, {
    enabled: Boolean(adminSecret),
    trpc: {
      context: {
        headers: {
          "x-admin-secret": adminSecret ?? ""
        }
      }
    }
  });

  const mutation = trpc.admin.updateOrderStatus.useMutation({
    onSuccess: () => refetch()
  });

  const updateStatus = (orderId: number, status: Status) => {
    if (!adminSecret) {
      Alert.alert("Нет доступа", "Укажите EXPO_PUBLIC_ADMIN_SECRET");
      return;
    }
    mutation.mutate(
      { orderId, status },
      {
        trpc: {
          context: {
            headers: {
              "x-admin-secret": adminSecret
            }
          }
        },
        onSuccess: () => Alert.alert("Успех", "Статус заказа обновлен"),
        onError: (error) => Alert.alert("Ошибка", error.message)
      }
    );
  };

  if (!adminSecret) {
    return (
      <View style={styles.center}>
        <Text style={styles.helper}>
          Укажите секрет администратора через переменную окружения EXPO_PUBLIC_ADMIN_SECRET.
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={data ?? []}
      keyExtractor={(item) => `${item.id}`}
      refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
      contentContainerStyle={styles.list}
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
    color: "#666"
  },
  list: {
    padding: 16
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
  statusText: {
    color: "#555",
    textTransform: "capitalize"
  },
  statusTextActive: {
    color: "#fff"
  }
});
