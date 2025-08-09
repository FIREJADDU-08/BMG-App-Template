import * as React from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { Provider as PaperProvider } from 'react-native-paper';
import { Provider as ReduxProvider } from 'react-redux';
import store from './app/redux/store';
import StackNavigator from './app/Navigations/StackNavigator';

export default function App() {
  return (
    <ReduxProvider store={store}>
      <PaperProvider>
        <NavigationContainer theme={DefaultTheme}>
          <StackNavigator />
        </NavigationContainer>
      </PaperProvider>
    </ReduxProvider>
  );
}
