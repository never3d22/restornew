import { useMemo } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { trpc } from "@/api/trpc";
import { useCartStore } from "@/store/cart";
import { useAuthStore } from "@/store/auth";

export function CartScreen() {
  const { items, increment, decrement, clear } = useCartStore();
  const customerId = useAuthStore((state) => state.customerId);
  const mutation = trpc.orders.create.useMutation();

  const total = useMemo(
    () => items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [items]
  );

  const submitOrder = () => {
    if (!customerId) {
      Alert.alert("Требуется авторизация", "Войдите через вкладку \"Профиль\"");
      return;
    }
    mutation.mutate(
      {
        items: items.map((item) => ({ dishId: item.dishId, quantity: item.quantity }))
      },
      {
        onSuccess: () => {
          clear();
          Alert.alert("Заказ создан", "Мы приступили к приготовлению!");
        },
        onError: (error) => {
          Alert.alert("Ошибка", error.message);
        }
      }
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={items}
        keyExtractor={(item) => `${item.dishId}`}
        ListEmptyComponent={<Text style={styles.helper}>Корзина пуста</Text>}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <View>
              <Text style={styles.title}>{item.name}</Text>
              <Text style={styles.subtitle}>{item.price.toFixed(2)} ₽</Text>
            </View>
            <View style={styles.counter}>
              <TouchableOpacity onPress={() => decrement(item.dishId)} style={styles.counterButton}>
                <Text style={styles.counterText}>-</Text>
              </TouchableOpacity>
              <Text style={styles.counterValue}>{item.quantity}</Text>
              <TouchableOpacity onPress={() => increment(item.dishId)} style={styles.counterButton}>
                <Text style={styles.counterText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
      <View style={styles.footer}>
        <Text style={styles.total}>Итого: {total.toFixed(2)} ₽</Text>
        <TouchableOpacity
          style={[styles.submit, mutation.isLoading && { opacity: 0.7 }]}
          disabled={items.length === 0 || mutation.isLoading}
          onPress={submitOrder}
        >
          <Text style={styles.submitText}>
            {mutation.isLoading ? "Отправляем..." : "Оформить заказ"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16
  },
  helper: {
    textAlign: "center",
    color: "#666",
    marginTop: 32
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: "#eee"
  },
  title: {
    fontSize: 16,
    fontWeight: "600"
  },
  subtitle: {
    color: "#666"
  },
  counter: {
    flexDirection: "row",
    alignItems: "center"
  },
  counterButton: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8
  },
  counterText: {
    fontSize: 18,
    fontWeight: "600"
  },
  counterValue: {
    marginHorizontal: 12,
    fontSize: 16
  },
  footer: {
    marginTop: 16
  },
  total: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8
  },
  submit: {
    backgroundColor: "#4caf50",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center"
  },
  submitText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16
  }
});
