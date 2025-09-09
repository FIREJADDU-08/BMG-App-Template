import React, { useState, useEffect } from "react";
import { Platform } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { Provider as PaperProvider } from "react-native-paper";
import { Provider as ReduxProvider } from "react-redux";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Notifications from "expo-notifications";

import store from "./app/redux/store";
import StackNavigator from "./app/Navigations/StackNavigator";
import ToastComponent from "./app/Config/Toast";
import themeContext from "./app/constants/themeContext";
import { LightTheme, CustomDarkTheme } from "./app/constants/CustomTheme";

// ⚡ Foreground notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export default function App() {
  const [darkTheme, setDarkTheme] = useState(false);

  const toggleTheme = () => setDarkTheme((prev) => !prev);

  useEffect(() => {
    // ✅ Android notification channel
    if (Platform.OS === "android") {
      Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
        sound: "default",
      });
    }

    // ✅ Listeners
    const subscription = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log("📩 Notification received:", notification);
      }
    );

    const responseSub =
      Notifications.addNotificationResponseReceivedListener((response) => {
        console.log("👆 Notification tapped:", response);
      });

    return () => {
      subscription.remove();
      responseSub.remove();
    };
  }, []);

  return (
    <ReduxProvider store={store}>
      <themeContext.Provider value={{ darkTheme, toggleTheme }}>
        <PaperProvider>
          <SafeAreaView style={{ flex: 1 }}>
            <NavigationContainer
              theme={darkTheme ? CustomDarkTheme : LightTheme}
            >
              <ToastComponent />
              <StackNavigator />
            </NavigationContainer>
          </SafeAreaView>
        </PaperProvider>
      </themeContext.Provider>
    </ReduxProvider>
  );
}
