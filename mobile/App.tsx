import "react-native-gesture-handler";
import { useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { trpc, trpcClient } from "@/api/trpc";
import { MenuScreen } from "@/screens/MenuScreen";
import { CartScreen } from "@/screens/CartScreen";
import { OrdersScreen } from "@/screens/OrdersScreen";
import { AddressesScreen } from "@/screens/AddressesScreen";
import { AuthScreen } from "@/screens/AuthScreen";
import { AdminOrdersScreen } from "@/screens/AdminOrdersScreen";

export type RootTabParamList = {
  Menu: undefined;
  Cart: undefined;
  Orders: undefined;
  Addresses: undefined;
  Auth: undefined;
  Admin: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();

export default function App() {
  const [queryClient] = useState(() => new QueryClient());
  const [client] = useState(() => trpcClient);

  return (
    <SafeAreaProvider>
      <trpc.Provider client={client} queryClient={queryClient}>
        <QueryClientProvider client={queryClient}>
          <NavigationContainer>
            <StatusBar style="dark" />
            <Tab.Navigator>
              <Tab.Screen name="Menu" component={MenuScreen} options={{ title: "Меню" }} />
              <Tab.Screen name="Cart" component={CartScreen} options={{ title: "Корзина" }} />
              <Tab.Screen name="Orders" component={OrdersScreen} options={{ title: "Заказы" }} />
              <Tab.Screen name="Addresses" component={AddressesScreen} options={{ title: "Адреса" }} />
              <Tab.Screen name="Auth" component={AuthScreen} options={{ title: "Профиль" }} />
              <Tab.Screen name="Admin" component={AdminOrdersScreen} options={{ title: "Админ" }} />
            </Tab.Navigator>
          </NavigationContainer>
        </QueryClientProvider>
      </trpc.Provider>
    </SafeAreaProvider>
  );
}
