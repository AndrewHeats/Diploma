import React from 'react';
import 'react-native-gesture-handler'; 
import { NavigationContainer } from '@react-navigation/native';
import { AppProvider } from './src/store/appContext'; // ПРОВАЙДЕР
import { AppNavigator } from './src/navigation/AppNavigator';

export default function App() {
  return (
    <AppProvider> 
      <NavigationContainer>
        <AppNavigator />
      </NavigationContainer>
    </AppProvider>
  );
}