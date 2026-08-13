import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { getBottomInset, getTopInset } from '../utils/layout';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
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
  successBg: '#e8f7ee',
  successText: '#0f766e',
  successBorder: '#86efac',
};

export default function LoginScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'Login'>>();
  const [phone, setPhone] = useState('');
  const [touched, setTouched] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (route.params?.registered) {
      setSuccessMsg(route.params.message || 'You registered successfully');
      if (route.params.phoneNumber) {
        setPhone(route.params.phoneNumber.replace(/\D/g, '').slice(0, 10));
      }
    }
  }, [route.params]);

  const digitsOnly = phone.replace(/\D/g, '');
  const isValid = digitsOnly.length === 10;
  const showError =
    (touched && digitsOnly.length > 0 && !isValid) || errorMsg.length > 0;

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
      setSuccessMsg('');
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
      <LinearGradient
        colors={[COLORS.gradientStart, COLORS.gradientEnd]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.headerBackground}
      />

      <KeyboardAvoidingView
        style={styles.body}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
          bounces
          nestedScrollEnabled>
          <View style={[styles.brandRow, { marginTop: getTopInset(20) }]}>
            <Image
              source={require('../assets/images/app_logo.png')}
              style={styles.logoImage}
              resizeMode="cover"
              accessibilityLabel="Paryavaran Prahri logo"
            />
            <View>
              <Text style={styles.brandName}>Paryavaran Prahri</Text>
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

            {successMsg ? (
              <View style={styles.successBanner}>
                <Text style={styles.successBannerText}>{successMsg}</Text>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setSuccessMsg('')}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Text style={styles.successDismiss}>✕</Text>
                </TouchableOpacity>
              </View>
            ) : null}

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
                maxLength={11}
                returnKeyType="done"
              />
            </View>

            {showError && (
              <Text style={styles.errorText}>
                {errorMsg || 'Please enter a valid 10-digit number'}
              </Text>
            )}

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleSendOtp}
              disabled={!isValid || loading}
              style={styles.buttonOuter}>
              {isValid && !loading ? (
                <LinearGradient
                  colors={[COLORS.gradientStart, COLORS.gradientEnd]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.buttonInner}>
                  <Text style={styles.buttonText}>Send OTP</Text>
                </LinearGradient>
              ) : (
                <View style={[styles.buttonInner, styles.buttonDisabled]}>
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.buttonText}>Send OTP</Text>
                  )}
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => navigation.navigate('Register')}
              style={styles.registerLink}>
              <Text style={styles.registerLinkText}>
                New user?{' '}
                <Text style={styles.registerLinkBold}>Register</Text>
              </Text>
            </TouchableOpacity>

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
    height: SCREEN_HEIGHT * 0.42,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 28,
    zIndex: 20,
  },
  logoImage: {
    width: 52,
    height: 52,
    borderRadius: 26,
    marginRight: 14,
    backgroundColor: COLORS.white,
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
    paddingBottom: getBottomInset(48),
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 28,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
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
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.successBg,
    borderWidth: 1,
    borderColor: COLORS.successBorder,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 20,
    gap: 10,
  },
  successBannerText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.successText,
    lineHeight: 20,
  },
  successDismiss: {
    fontSize: 14,
    color: COLORS.successText,
    fontWeight: '700',
    opacity: 0.7,
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
  registerLink: {
    marginTop: 20,
    alignItems: 'center',
  },
  registerLinkText: {
    fontSize: 14,
    color: COLORS.textMuted,
  },
  registerLinkBold: {
    color: COLORS.gradientStart,
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
