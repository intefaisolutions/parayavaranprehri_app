import React, { useMemo, useRef, useState } from 'react';
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
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/types';
import { ApiError, authService, saveSession } from '../api';

const OTP_LENGTH = 4;
const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// Precise colors matching LoginScreen
const COLORS = {
  gradientStart: '#136e35',
  gradientEnd: '#55c970',
  background: '#f4f9f4',
  white: '#ffffff',
  textDark: '#1a1f24',
  textMuted: '#6b7280',
  inputBg: '#f2f8f2',
  inputBorder: '#e0e8e0',
  error: '#d32f2f',
};

export default function OtpScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'Otp'>>();
  const { phoneNumber } = route.params;
  const [otp, setOtp] = useState('');
  const [touched, setTouched] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const isValid = otp.length === OTP_LENGTH;
  const showError = (touched && otp.length > 0 && !isValid) || errorMsg.length > 0;

  const maskedPhone = useMemo(() => {
    if (phoneNumber.length !== 10) {
      return phoneNumber;
    }
    return `+91 ${phoneNumber.slice(0, 2)}XXXXX${phoneNumber.slice(7)}`;
  }, [phoneNumber]);

  const handleOtpChange = (value: string) => {
    setErrorMsg('');
    const cleaned = value.replace(/\D/g, '').slice(0, OTP_LENGTH);
    setOtp(cleaned);
  };

  const handleVerify = async () => {
    setTouched(true);
    if (!isValid || loading) return;

    setLoading(true);
    setErrorMsg('');
    try {
      const result = await authService.verifyOtp({
        phone: phoneNumber,
        code: otp,
      });
      await saveSession({
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        user: result.user,
        phone: phoneNumber,
      });
      navigation.reset({
        index: 0,
        routes: [{ name: 'MainLayout', params: { phoneNumber } }],
      });
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : 'Invalid OTP. Please try again.';
      setErrorMsg(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      {/* ABSOLUTE BACKGROUND GRADIENT (Top 50%) */}
      <LinearGradient
        colors={[COLORS.gradientStart, COLORS.gradientEnd]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.headerBackground}
      />

      {/* BACK BUTTON (Absolute at top) */}
      <Pressable
        onPress={() => navigation.goBack()}
        style={[styles.backBtn, { top: getTopInset(20) }]}
      >
        <Text style={styles.backText}>← Back</Text>
      </Pressable>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: getBottomInset(40) },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.card}>
            <Text style={styles.title}>Enter OTP</Text>
            <Text style={styles.subtitle}>
              Sent to +91 {phoneNumber.slice(0, 5)} {phoneNumber.slice(5)}
            </Text>

            <Pressable
              style={styles.otpRow}
              onPress={() => inputRef.current?.focus()}
            >
              {Array.from({ length: OTP_LENGTH }).map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.otpBox,
                    otp.length === index && styles.otpBoxActive,
                    showError && styles.otpBoxError,
                  ]}
                >
                  <Text style={styles.otpDigit}>{otp[index] ?? ''}</Text>
                </View>
              ))}
              <TextInput
                ref={inputRef}
                value={otp}
                onChangeText={handleOtpChange}
                onBlur={() => setTouched(true)}
                keyboardType="number-pad"
                maxLength={OTP_LENGTH}
                style={styles.otpInputOverlay}
                autoFocus
                caretHidden
              />
            </Pressable>

            {showError && (
              <Text style={styles.errorText}>
                {errorMsg || 'Please enter the complete 4-digit OTP'}
              </Text>
            )}

            <Pressable
              onPress={handleVerify}
              disabled={!isValid || loading}
              style={({ pressed }) => [
                styles.buttonOuter,
                isValid && pressed && { opacity: 0.8 },
              ]}
            >
              {isValid ? (
                <LinearGradient
                  colors={[COLORS.gradientStart, COLORS.gradientEnd]}
                  start={{ x: 0, y: 0.5 }}
                  end={{ x: 1, y: 0.5 }}
                  style={styles.buttonInner}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.buttonText}>Verify & Continue</Text>
                  )}
                </LinearGradient>
              ) : (
                <View style={[styles.buttonInner, styles.buttonDisabled]}>
                  <Text style={styles.buttonText}>Verify & Continue</Text>
                </View>
              )}
            </Pressable>

            <View style={styles.resendRow}>
              <Pressable onPress={() => navigation.goBack()}>
                <Text style={styles.resendText}>Change number</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  flex: {
    flex: 1,
    zIndex: 10,
    elevation: 10,
  },
  headerBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 80, // Pushes the center point slightly higher
    justifyContent: 'center', 
  },
  backBtn: {
    position: 'absolute',
    left: 20,
    zIndex: 20,
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  backText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
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
  subtitle: {
    fontSize: 15,
    lineHeight: 24,
    color: COLORS.textMuted,
    marginBottom: 28,
  },
  phoneHighlight: {
    color: COLORS.gradientStart,
    fontWeight: '700',
  },
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    position: 'relative',
    gap: 12,
  },
  otpBox: {
    flex: 1,
    aspectRatio: 1, // Makes the box perfectly square automatically based on width
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: COLORS.inputBorder,
    backgroundColor: COLORS.inputBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  otpBoxActive: {
    borderColor: COLORS.gradientEnd,
    // Keep borderWidth same so box size doesn't jump
    borderWidth: 1.5, 
  },
  otpBoxError: {
    borderColor: COLORS.error,
  },
  otpDigit: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.textDark,
  },
  otpInputOverlay: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 13,
    marginBottom: 12,
  },
  buttonOuter: {
    marginTop: 20,
    borderRadius: 29,
    overflow: 'hidden',
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
  resendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  resendText: {
    fontSize: 15,
    color: COLORS.textMuted,
  },
});
