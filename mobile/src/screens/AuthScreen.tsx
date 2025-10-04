import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { trpc } from "@/api/trpc";
import { useAuthStore } from "@/store/auth";

export function AuthScreen() {
  const { phone, codeSent, setPhone, setCustomer, setCodeSent, reset } = useAuthStore();
  const [code, setCode] = useState("");
  const requestCode = trpc.auth.requestCode.useMutation();
  const verifyCode = trpc.auth.verifyCode.useMutation();

  const handleRequest = () => {
    if (!phone) {
      Alert.alert("Введите номер", "Укажите телефон в международном формате");
      return;
    }
    requestCode.mutate(
      { phone },
      {
        onSuccess: () => {
          setCodeSent(true);
          Alert.alert("Код отправлен", "Используйте 1234 для входа");
        },
        onError: (error) => Alert.alert("Ошибка", error.message)
      }
    );
  };

  const handleVerify = () => {
    if (!phone || !code) {
      Alert.alert("Недостаточно данных", "Введите номер и код из SMS");
      return;
    }
    verifyCode.mutate(
      { phone, code },
      {
        onSuccess: (data) => {
          setCustomer(data.customerId);
          setCodeSent(false);
          setCode("");
          Alert.alert("Успех", "Вы успешно авторизованы");
        },
        onError: (error) => Alert.alert("Ошибка", error.message)
      }
    );
  };

  const handleLogout = () => {
    reset();
    setCode("");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Вход по SMS</Text>
      <TextInput
        value={phone ?? ""}
        onChangeText={setPhone}
        placeholder="Номер телефона"
        keyboardType="phone-pad"
        style={styles.input}
      />
      {codeSent && (
        <TextInput
          value={code}
          onChangeText={setCode}
          placeholder="Код из SMS"
          keyboardType="number-pad"
          style={styles.input}
        />
      )}
      {!codeSent ? (
        <TouchableOpacity
          style={[styles.button, requestCode.isLoading && { opacity: 0.7 }]}
          onPress={handleRequest}
          disabled={requestCode.isLoading}
        >
          <Text style={styles.buttonText}>
            {requestCode.isLoading ? "Отправляем..." : "Получить код"}
          </Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={[styles.button, verifyCode.isLoading && { opacity: 0.7 }]}
          onPress={handleVerify}
          disabled={verifyCode.isLoading}
        >
          <Text style={styles.buttonText}>
            {verifyCode.isLoading ? "Проверяем..." : "Подтвердить"}
          </Text>
        </TouchableOpacity>
      )}
      <TouchableOpacity style={styles.secondary} onPress={handleLogout}>
        <Text style={styles.secondaryText}>Выйти</Text>
      </TouchableOpacity>
      <Text style={styles.helper}>Тестовый код: 1234</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 24
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 24
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12
  },
  button: {
    backgroundColor: "#ff7043",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center"
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16
  },
  secondary: {
    marginTop: 12,
    alignItems: "center"
  },
  secondaryText: {
    color: "#999"
  },
  helper: {
    marginTop: 16,
    textAlign: "center",
    color: "#666"
  }
});
