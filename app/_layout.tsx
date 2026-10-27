import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <View style={styles.container}>
        <StatusBar style="light" backgroundColor="#09090b" />
        <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: '#09090b' },
              animation: 'fade',
            }}
          />
        </SafeAreaView>
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#09090b',
  },
  safeArea: {
    flex: 1,
    backgroundColor: '#09090b',
  },
});