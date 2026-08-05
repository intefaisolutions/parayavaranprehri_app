import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import OtpScreen from '../screens/OtpScreen';
import MainLayout from '../screens/MainLayout';
import { RootStackParamList } from './types';
import {
  authService,
  clearSession,
  getAccessToken,
  getRefreshToken,
  getStoredPhone,
  setTokens,
  usersService,
} from '../api';

const Stack = createNativeStackNavigator<RootStackParamList>();

type BootState =
  | { ready: false }
  | {
      ready: true;
      initialRoute: 'Login' | 'MainLayout';
      phoneNumber?: string;
    };

async function restoreSession(): Promise<{
  ok: boolean;
  phoneNumber?: string;
}> {
  const access = await getAccessToken();
  const refresh = await getRefreshToken();
  const phone = (await getStoredPhone()) || undefined;

  if (!access && !refresh) {
    return { ok: false };
  }

  // Prefer validating with a lightweight authenticated call
  try {
    if (access) {
      await usersService.getMe();
      return { ok: true, phoneNumber: phone };
    }
  } catch {
    // fall through to refresh
  }

  if (!refresh) {
    await clearSession();
    return { ok: false };
  }

  try {
    const tokens = await authService.refresh(refresh);
    await setTokens(tokens.accessToken, tokens.refreshToken);
    await usersService.getMe();
    return { ok: true, phoneNumber: phone };
  } catch {
    await clearSession();
    return { ok: false };
  }
}

export default function AppNavigator() {
  const [boot, setBoot] = useState<BootState>({ ready: false });

  useEffect(() => {
    let mounted = true;
    (async () => {
      const session = await restoreSession();
      if (!mounted) return;
      if (session.ok) {
        setBoot({
          ready: true,
          initialRoute: 'MainLayout',
          phoneNumber: session.phoneNumber,
        });
      } else {
        setBoot({ ready: true, initialRoute: 'Login' });
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  if (!boot.ready) {
    return (
      <View style={styles.boot}>
        <ActivityIndicator size="large" color="#136e35" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={boot.initialRoute}
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
        }}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="Otp" component={OtpScreen} />
        <Stack.Screen
          name="MainLayout"
          component={MainLayout}
          initialParams={
            boot.initialRoute === 'MainLayout'
              ? { phoneNumber: boot.phoneNumber }
              : undefined
          }
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  boot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f4f9f4',
  },
});
