import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { Provider as PaperProvider } from 'react-native-paper';
import { Provider as ReduxProvider } from 'react-redux';
import { SafeAreaView } from 'react-native-safe-area-context';
import store from './app/redux/store';
import StackNavigator from './app/Navigations/StackNavigator';
import ToastComponent from './app/Config/Toast';
import themeContext from './app/constants/themeContext';
import { LightTheme, CustomDarkTheme } from './app/constants/CustomTheme';

export default function App() {
  const [darkTheme, setDarkTheme] = useState(false);

  const toggleTheme = () => setDarkTheme(prev => !prev);

  return (
    <ReduxProvider store={store}>
      <themeContext.Provider value={{ darkTheme, toggleTheme }}>
        <PaperProvider>
          <SafeAreaView style={{ flex: 1 }}>
            <NavigationContainer theme={darkTheme ? CustomDarkTheme : LightTheme}>
              <ToastComponent />
              <StackNavigator />
            </NavigationContainer>
          </SafeAreaView>
        </PaperProvider>
      </themeContext.Provider>
    </ReduxProvider>
  );
}
