import { useState } from "react";
import { View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { trpc } from "@/api/trpc";
import { useAuthStore } from "@/store/auth";

export function AddressesScreen() {
  const customerId = useAuthStore((state) => state.customerId);
  const utils = trpc.useUtils();
  const { data } = trpc.addresses.list.useQuery(undefined, {
    enabled: Boolean(customerId)
  });
  const mutation = trpc.addresses.create.useMutation({
    onSuccess: () => utils.addresses.list.invalidate()
  });

  const [form, setForm] = useState({
    label: "",
    street: "",
    city: "",
    entrance: "",
    floor: "",
    apartment: ""
  });

  if (!customerId) {
    return (
      <View style={styles.center}>
        <Text style={styles.helper}>Авторизуйтесь, чтобы управлять адресами.</Text>
      </View>
    );
  }

  const updateField = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const submit = () => {
    mutation.mutate(
      {
        label: form.label,
        street: form.street,
        city: form.city,
        entrance: form.entrance || undefined,
        floor: form.floor || undefined,
        apartment: form.apartment || undefined
      },
      {
        onSuccess: () => {
          setForm({ label: "", street: "", city: "", entrance: "", floor: "", apartment: "" });
          Alert.alert("Готово", "Адрес сохранен");
        },
        onError: (error) => Alert.alert("Ошибка", error.message)
      }
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={data ?? []}
        keyExtractor={(item) => `${item.id}`}
        ListEmptyComponent={<Text style={styles.helper}>Добавьте ваш первый адрес</Text>}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.title}>{item.label}</Text>
            <Text style={styles.subtitle}>
              {item.city}, {item.street}
            </Text>
            <Text style={styles.subtitle}>
              Подъезд {item.entrance ?? "-"}, этаж {item.floor ?? "-"}, квартира {item.apartment ?? "-"}
            </Text>
          </View>
        )}
      />
      <View style={styles.form}>
        <Text style={styles.formTitle}>Добавить адрес</Text>
        {Object.entries(form).map(([key, value]) => (
          <TextInput
            key={key}
            style={styles.input}
            placeholder={key}
            value={value}
            onChangeText={(text) => updateField(key as keyof typeof form, text)}
          />
        ))}
        <TouchableOpacity style={styles.submit} onPress={submit} disabled={mutation.isLoading}>
          <Text style={styles.submitText}>
            {mutation.isLoading ? "Сохраняем..." : "Сохранить"}
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
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24
  },
  helper: {
    color: "#666",
    textAlign: "center"
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
    fontSize: 16,
    fontWeight: "600"
  },
  subtitle: {
    color: "#555",
    marginTop: 4
  },
  form: {
    marginTop: 16,
    backgroundColor: "#f9f9f9",
    padding: 16,
    borderRadius: 12
  },
  formTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    marginBottom: 8
  },
  submit: {
    backgroundColor: "#2196f3",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center"
  },
  submitText: {
    color: "#fff",
    fontWeight: "600"
  }
});
