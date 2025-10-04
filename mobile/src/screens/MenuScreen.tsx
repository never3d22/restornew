import { useMemo } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { trpc } from "@/api/trpc";
import { useCartStore } from "@/store/cart";

export function MenuScreen() {
  const { data, isLoading, refetch } = trpc.menu.list.useQuery();
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

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
        <Text style={styles.helper}>Загружаем меню...</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={dishes}
      onRefresh={refetch}
      refreshing={isLoading}
      keyExtractor={(item) => `${item.id}`}
      contentContainerStyle={styles.list}
      renderItem={({ item }) => (
        <View style={styles.card}>
          <Text style={styles.category}>{item.categoryName}</Text>
          <Text style={styles.title}>{item.name}</Text>
          {item.description ? <Text style={styles.description}>{item.description}</Text> : null}
          <View style={styles.bottomRow}>
            <Text style={styles.price}>{Number(item.price).toFixed(2)} ₽</Text>
            <TouchableOpacity
              style={styles.button}
              onPress={() =>
                addItem({ dishId: item.id, name: item.name, price: Number(item.price) })
              }
            >
              <Text style={styles.buttonText}>В корзину</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
      ListEmptyComponent={() => (
        <View style={styles.center}>
          <Text style={styles.helper}>Меню пока пустое. Добавьте блюда в админ-панели.</Text>
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
    marginBottom: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2
  },
  category: {
    fontSize: 12,
    color: "#888",
    marginBottom: 4
  },
  title: {
    fontSize: 18,
    fontWeight: "600"
  },
  description: {
    fontSize: 14,
    color: "#555",
    marginVertical: 8
  },
  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  price: {
    fontSize: 16,
    fontWeight: "bold"
  },
  button: {
    backgroundColor: "#ff7043",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600"
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24
  },
  helper: {
    marginTop: 12,
    color: "#555",
    textAlign: "center"
  }
});
