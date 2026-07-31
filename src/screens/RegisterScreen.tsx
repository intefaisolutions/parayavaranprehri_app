import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
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
import { useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/types';
import { ApiError, authService } from '../api';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

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
  success: '#0f766e',
};

const GENDERS = ['Male', 'Female', 'Other'] as const;
type Gender = (typeof GENDERS)[number];

export default function RegisterScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const scrollRef = useRef<ScrollView>(null);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [gender, setGender] = useState<Gender | ''>('');
  const [address, setAddress] = useState('');
  const [touched, setTouched] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const digitsOnly = phone.replace(/\D/g, '');
  const firstOk = firstName.trim().length >= 2;
  const lastOk = lastName.trim().length >= 1;
  const phoneOk = digitsOnly.length === 10;
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const genderOk = gender !== '';
  const addressOk = address.trim().length >= 5;
  const isValid =
    firstOk && lastOk && phoneOk && emailOk && genderOk && addressOk;

  const formattedPhone =
    digitsOnly.length > 5
      ? `${digitsOnly.slice(0, 5)} ${digitsOnly.slice(5)}`
      : digitsOnly;

  const clearError = () => setErrorMsg('');

  const handleRegister = async () => {
    setTouched(true);
    if (loading) return;

    if (!isValid) {
      const reasons: string[] = [];
      if (!firstOk) reasons.push('First name: at least 2 characters');
      if (!lastOk) reasons.push('Last name: required');
      if (!phoneOk) reasons.push('Mobile: enter a valid 10-digit number');
      if (!emailOk) reasons.push('Email: enter a valid email address');
      if (!genderOk) reasons.push('Gender: please select Male, Female or Other');
      if (!addressOk) reasons.push('Address: at least 5 characters');
      setErrorMsg(reasons.join('\n'));
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setInfoMsg('');
    try {
      const result = await authService.register({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        mobile: digitsOnly,
        email: email.trim(),
        gender: gender as Gender,
        address: address.trim(),
      });
      navigation.replace('Login', {
        registered: true,
        phoneNumber: result.phone || digitsOnly,
        message: 'You registered successfully',
      });
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : 'Registration failed. Please try again.';
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
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}>
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
          bounces>
          <View style={[styles.brandRow, { marginTop: getTopInset(16) }]}>
            <View style={styles.logoCircle}>
              <Text style={styles.logoLeaf}>🌿</Text>
            </View>
            <View>
              <Text style={styles.brandName}>Prayavarn Prehri</Text>
              <Text style={styles.brandTagline}>Drive Green. Grow Future.</Text>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.title}>Create account</Text>
            <Text style={styles.subtitle}>
              Fill your details. We verify ShieldSure insurance — if none is
              found, vehicle slots stay empty.
            </Text>

            <Text style={styles.label}>First name</Text>
            <View
              style={[
                styles.inputWrap,
                touched && !firstOk && styles.inputError,
              ]}>
              <TextInput
                style={styles.input}
                value={firstName}
                onChangeText={v => {
                  clearError();
                  setFirstName(v);
                }}
                placeholder="First name"
                placeholderTextColor={COLORS.textMuted}
                autoCapitalize="words"
                returnKeyType="next"
              />
            </View>

            <Text style={styles.label}>Last name</Text>
            <View
              style={[
                styles.inputWrap,
                touched && !lastOk && styles.inputError,
              ]}>
              <TextInput
                style={styles.input}
                value={lastName}
                onChangeText={v => {
                  clearError();
                  setLastName(v);
                }}
                placeholder="Last name"
                placeholderTextColor={COLORS.textMuted}
                autoCapitalize="words"
                returnKeyType="next"
              />
            </View>

            <Text style={styles.label}>Mobile number</Text>
            <View
              style={[
                styles.inputWrap,
                touched && !phoneOk && styles.inputError,
              ]}>
              <Text style={styles.countryCode}>+91</Text>
              <TextInput
                style={styles.input}
                value={formattedPhone}
                onChangeText={v => {
                  clearError();
                  setPhone(v);
                }}
                placeholder="98260 12345"
                placeholderTextColor={COLORS.textMuted}
                keyboardType="number-pad"
                maxLength={11}
                returnKeyType="next"
              />
            </View>

            <Text style={styles.label}>Email</Text>
            <View
              style={[
                styles.inputWrap,
                touched && !emailOk && styles.inputError,
              ]}>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={v => {
                  clearError();
                  setEmail(v);
                }}
                placeholder="you@example.com"
                placeholderTextColor={COLORS.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
              />
            </View>

            <Text style={styles.label}>Gender</Text>
            <View
              style={[
                styles.genderRow,
                touched && !genderOk && styles.inputError,
              ]}>
              {GENDERS.map(option => {
                const selected = gender === option;
                return (
                  <TouchableOpacity
                    key={option}
                    activeOpacity={0.7}
                    onPress={() => {
                      clearError();
                      setGender(option);
                    }}
                    style={[
                      styles.genderChip,
                      selected && styles.genderChipSelected,
                    ]}>
                    <Text
                      style={[
                        styles.genderChipText,
                        selected && styles.genderChipTextSelected,
                      ]}>
                      {option}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.label}>Address</Text>
            <View
              style={[
                styles.inputWrap,
                styles.addressWrap,
                touched && !addressOk && styles.inputError,
              ]}>
              <TextInput
                style={[styles.input, styles.addressInput]}
                value={address}
                onChangeText={v => {
                  clearError();
                  setAddress(v);
                }}
                placeholder="House no, street, city"
                placeholderTextColor={COLORS.textMuted}
                autoCapitalize="sentences"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                returnKeyType="done"
                onFocus={() => {
                  setTimeout(() => {
                    scrollRef.current?.scrollToEnd({ animated: true });
                  }, 250);
                }}
              />
            </View>

            {errorMsg ? (
              <Text style={styles.errorText}>{errorMsg}</Text>
            ) : null}
            {infoMsg ? <Text style={styles.infoText}>{infoMsg}</Text> : null}

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleRegister}
              disabled={loading}
              style={[
                styles.buttonOuter,
                loading && styles.buttonOuterDisabled,
              ]}>
              {isValid && !loading ? (
                <LinearGradient
                  colors={[COLORS.gradientStart, COLORS.gradientEnd]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.buttonInner}>
                  <Text style={styles.buttonText}>Register</Text>
                </LinearGradient>
              ) : (
                <View
                  style={[
                    styles.buttonInner,
                    !isValid || loading ? styles.buttonDisabled : null,
                  ]}>
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.buttonText}>Register</Text>
                  )}
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => navigation.navigate('Login')}
              style={styles.loginLink}>
              <Text style={styles.loginLinkText}>
                Already registered?{' '}
                <Text style={styles.loginLinkBold}>Login</Text>
              </Text>
            </TouchableOpacity>
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
    marginBottom: 24,
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
    paddingBottom: getBottomInset(48),
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 28,
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
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: COLORS.textMuted,
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginBottom: 8,
    marginTop: 12,
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
    minHeight: 58,
  },
  addressWrap: {
    alignItems: 'flex-start',
    paddingVertical: 12,
    minHeight: 96,
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
  input: {
    flex: 1,
    fontSize: 16,
    color: COLORS.textDark,
    paddingVertical: 0,
    minHeight: 48,
  },
  addressInput: {
    minHeight: 72,
    paddingTop: 4,
  },
  genderRow: {
    flexDirection: 'row',
    gap: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'transparent',
    padding: 2,
  },
  genderChip: {
    flex: 1,
    height: 48,
    borderRadius: 16,
    backgroundColor: COLORS.inputBg,
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  genderChipSelected: {
    backgroundColor: '#e8f7ee',
    borderColor: COLORS.gradientStart,
  },
  genderChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  genderChipTextSelected: {
    color: COLORS.gradientStart,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 13,
    marginTop: 10,
    marginLeft: 4,
    lineHeight: 20,
  },
  infoText: {
    color: COLORS.success,
    fontSize: 13,
    marginTop: 10,
    marginLeft: 4,
    lineHeight: 18,
  },
  buttonOuter: {
    marginTop: 24,
    borderRadius: 29,
    overflow: 'hidden',
    shadowColor: COLORS.gradientStart,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },
  buttonOuterDisabled: {
    shadowOpacity: 0,
    elevation: 0,
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
  loginLink: {
    marginTop: 20,
    alignItems: 'center',
    paddingVertical: 8,
  },
  loginLinkText: {
    fontSize: 14,
    color: COLORS.textMuted,
  },
  loginLinkBold: {
    color: COLORS.gradientStart,
    fontWeight: '700',
  },
});
