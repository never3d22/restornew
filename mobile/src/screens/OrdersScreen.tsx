import { View, Text, FlatList, StyleSheet, RefreshControl } from "react-native";
import { trpc } from "@/api/trpc";
import { useAuthStore } from "@/store/auth";

export function OrdersScreen() {
  const customerId = useAuthStore((state) => state.customerId);
  const { data, isLoading, refetch } = trpc.orders.history.useQuery(undefined, {
    enabled: Boolean(customerId)
  });

  if (!customerId) {
    return (
      <View style={styles.center}>
        <Text style={styles.helper}>Авторизуйтесь, чтобы увидеть историю заказов.</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={data ?? []}
      keyExtractor={(item) => `${item.id}`}
      refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
      contentContainerStyle={styles.list}
      ListEmptyComponent={<Text style={styles.helper}>Заказов пока нет</Text>}
      renderItem={({ item }) => (
        <View style={styles.card}>
          <Text style={styles.title}>Заказ #{item.id}</Text>
          <Text style={styles.subtitle}>Статус: {item.status}</Text>
          <Text style={styles.subtitle}>Сумма: {Number(item.total).toFixed(2)} ₽</Text>
          <View style={styles.items}>
            {item.items.map((line) => (
              <Text key={line.id} style={styles.itemText}>
                {line.quantity} x {line.dish.name}
              </Text>
            ))}
          </View>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
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
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24
  },
  helper: {
    color: "#666",
    textAlign: "center"
  }
});
