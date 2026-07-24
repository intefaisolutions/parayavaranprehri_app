import React, { Component } from 'react';
import { StatusBar, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';

type ErrorBoundaryState = {
  error: Error | null;
};

class ErrorBoundary extends Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <View style={styles.errorWrap}>
          <Text style={styles.errorTitle}>App Error</Text>
          <Text style={styles.errorText}>{this.state.error.message}</Text>
        </View>
      );
    }
    return this.props.children;
  }
}

function App() {
  return (
    <ErrorBoundary>
      <SafeAreaProvider style={styles.root}>
        <StatusBar
          barStyle="light-content"
          backgroundColor="transparent"
          translucent
        />
        <AppNavigator />
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F7FAF7',
  },
  errorWrap: {
    flex: 1,
    backgroundColor: '#1A2E1F',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  errorTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
  },
  errorText: {
    color: '#FFCDD2',
    fontSize: 14,
    textAlign: 'center',
  },
});

export default App;
