import React, { useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { getBottomInset, getTopInset } from '../utils/layout';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/types';
import { ApiError, authService } from '../api';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// Precise colors from the target design
const COLORS = {
  gradientStart: '#136e35',
  gradientEnd: '#55c970',
  logoBg: '#11542a',
  background: '#f4f9f4',
  white: '#ffffff',
  textDark: '#1a1f24',
  textMuted: '#6b7280',
  inputBg: '#f2f8f2',
  inputBorder: '#e0e8e0',
  error: '#d32f2f',
};

export default function LoginScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [phone, setPhone] = useState('');
  const [touched, setTouched] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const digitsOnly = phone.replace(/\D/g, '');
  const isValid = digitsOnly.length === 10;
  const showError = (touched && digitsOnly.length > 0 && !isValid) || errorMsg.length > 0;

  // Format to: 98260 12345
  const formattedPhone =
    digitsOnly.length > 5
      ? `${digitsOnly.slice(0, 5)} ${digitsOnly.slice(5)}`
      : digitsOnly;

  const handlePhoneChange = (value: string) => {
    setErrorMsg('');
    setPhone(value);
  };

  const handleSendOtp = async () => {
    setTouched(true);
    if (!isValid || loading) return;

    setLoading(true);
    setErrorMsg('');
    try {
      await authService.requestOtp({ phone: digitsOnly });
      navigation.navigate('Otp', { phoneNumber: digitsOnly });
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : 'Failed to send OTP. Please try again.';
      setErrorMsg(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* ABSOLUTE BACKGROUND GRADIENT (Top 50%) */}
      <LinearGradient
        colors={[COLORS.gradientStart, COLORS.gradientEnd]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.headerBackground}
      />

      {/* BODY WITH CENTERED CARD */}
      <KeyboardAvoidingView
        style={styles.body}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* HEADER CONTENT (Now inside ScrollView so it scrolls) */}
          <View style={[styles.brandRow, { marginTop: getTopInset(20) }]}>
            <View style={styles.logoCircle}>
              <Text style={styles.logoLeaf}>🌿</Text>
            </View>
            <View>
              <Text style={styles.brandName}>Prayavarn Prehri</Text>
              <Text style={styles.brandTagline}>Drive Green. Grow Future.</Text>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.title}>
              Welcome back <Text style={styles.titleLeaf}>🌿</Text>
            </Text>

            <Text style={styles.subtitle}>
              Sign in with the mobile number registered on your vehicle RC.
            </Text>

            <Text style={styles.label}>Mobile number</Text>
            <View style={[styles.inputWrap, showError && styles.inputError]}>
              <Text style={styles.countryCode}>+91</Text>
              <Text style={styles.phoneIcon}>📞</Text>
              <TextInput
                style={styles.input}
                value={formattedPhone}
                onChangeText={handlePhoneChange}
                onBlur={() => setTouched(true)}
                placeholder="98260 12345"
                placeholderTextColor={COLORS.textMuted}
                keyboardType="number-pad"
                maxLength={11} // 10 digits + 1 space
                returnKeyType="done"
              />
            </View>

            {showError && (
              <Text style={styles.errorText}>
                {errorMsg || 'Please enter a valid 10-digit number'}
              </Text>
            )}

            {/* SEND OTP BUTTON */}
            <Pressable
              onPress={handleSendOtp}
              disabled={!isValid || loading}
              style={({ pressed }) => [
                styles.buttonOuter,
                isValid && pressed && { opacity: 0.8 },
              ]}
            >
              {isValid ? (
                <LinearGradient
                  colors={[COLORS.gradientStart, COLORS.gradientEnd]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.buttonInner}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.buttonText}>Send OTP</Text>
                  )}
                </LinearGradient>
              ) : (
                <View style={[styles.buttonInner, styles.buttonDisabled]}>
                  <Text style={styles.buttonText}>Send OTP</Text>
                </View>
              )}
            </Pressable>

            {/* FOOTER */}
            <View style={styles.footerRow}>
              <Text style={styles.shieldIcon}>🛡️</Text>
              <Text style={styles.footerText}>Govt-verified · Encrypted</Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  headerBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 40,
    zIndex: 20,
  },
  logoCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: COLORS.logoBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  logoLeaf: {
    fontSize: 22,
  },
  brandName: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '500',
    opacity: 0.9,
  },
  brandTagline: {
    color: COLORS.white,
    fontSize: 22,
    fontWeight: '700',
    marginTop: 2,
    letterSpacing: -0.3,
  },
  body: {
    flex: 1,
    zIndex: 10,
    elevation: 10,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
    justifyContent: 'center', 
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 28,
    // Shadow for iOS
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    // Elevation for Android
    elevation: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.textDark,
    marginBottom: 10,
    letterSpacing: -0.5,
  },
  titleLeaf: {
    fontSize: 24,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: COLORS.textMuted,
    marginBottom: 28,
  },
  label: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginBottom: 8,
    fontWeight: '500',
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.inputBg,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
    paddingHorizontal: 16,
    height: 58,
  },
  inputError: {
    borderColor: COLORS.error,
  },
  countryCode: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textDark,
    marginRight: 10,
  },
  phoneIcon: {
    fontSize: 18,
    marginRight: 10,
    opacity: 0.5,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: COLORS.textDark,
    paddingVertical: 0,
    height: '100%',
  },
  errorText: {
    color: COLORS.error,
    fontSize: 13,
    marginTop: 6,
    marginLeft: 4,
  },
  buttonOuter: {
    marginTop: 24,
    borderRadius: 29,
    overflow: 'hidden',
    // Button shadow
    shadowColor: COLORS.gradientStart,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },
  buttonInner: {
    height: 58,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#b5d4bc',
  },
  buttonText: {
    color: COLORS.white,
    fontSize: 17,
    fontWeight: '700',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    gap: 6,
  },
  shieldIcon: {
    fontSize: 14,
    opacity: 0.6,
  },
  footerText: {
    fontSize: 13,
    color: '#8b968f',
    fontWeight: '500',
  },
});
