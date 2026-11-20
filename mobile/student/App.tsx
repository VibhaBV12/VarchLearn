import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import { StudentDataProvider } from './src/context/StudentDataContext';
import { RootNavigator } from './src/navigation/RootNavigator';

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StudentDataProvider>
          <StatusBar style="dark" />
          <RootNavigator />
        </StudentDataProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
