import React, { Component, useState } from 'react';
import { StatusBar, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import LoginScreen from './src/screens/LoginScreen';
import OtpScreen from './src/screens/OtpScreen';
import MainLayout from './src/screens/MainLayout';

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

import { setApiToken } from './src/utils/api';

function App() {
  const [screen, setScreen] = useState<'login' | 'otp' | 'dashboard'>('login');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [authData, setAuthData] = useState<any>(null);

  return (
    <ErrorBoundary>
      <SafeAreaProvider style={styles.root}>
        <StatusBar
          barStyle="light-content"
          backgroundColor="transparent"
          translucent
        />
        {screen === 'login' ? (
          <LoginScreen
            onSendOtp={phone => {
              setPhoneNumber(phone);
              setScreen('otp');
            }}
          />
        ) : screen === 'otp' ? (
          <OtpScreen
            phoneNumber={phoneNumber}
            onBack={() => setScreen('login')}
            onVerify={(data) => {
              setApiToken(data.accessToken);
              setAuthData(data);
              setScreen('dashboard');
            }}
          />
        ) : (
          <MainLayout
            user={authData?.user}
            onLogout={() => {
              setApiToken(null);
              setAuthData(null);
              setScreen('login');
              setPhoneNumber('');
            }}
          />
        )}
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
