import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import AppIcon from '../components/AppIcon';
import { AddedVehicle, generateVehicleId } from '../data/vehiclesData';
import { getBottomInset, getTopInset } from '../utils/layout';
import {
  ApiError,
  getStoredPhone,
  getStoredUser,
  personsService,
  vehiclesService,
} from '../api';
import { mapApiVehicleToUi } from '../api/mappers';

type Props = {
  onBack: () => void;
  onRegisterVehicle: (vehicle: AddedVehicle) => void;
  onComplete: () => void;
};

const TOTAL_STEPS = 5;
const GRADIENT = ['#0c4820', '#2b964f'];

const INSURANCE_OPTIONS = [
  {
    id: 'shieldsure',
    name: 'ShieldSure General',
    policy: 'Linked via insurance check',
  },
  {
    id: 'icici',
    name: 'ICICI Lombard',
    policy: 'Linked via insurance check',
  },
  {
    id: 'other',
    name: 'Other / Not listed',
    policy: 'Will be verified by officer',
  },
];

export default function AddVehicleScreen({
  onBack,
  onRegisterVehicle,
  onComplete,
}: Props) {
  const [step, setStep] = useState(1);
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [vehicleName, setVehicleName] = useState('My Vehicle');
  const [fuelType, setFuelType] = useState('Petrol');
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const [selectedInsurance, setSelectedInsurance] = useState('shieldsure');
  const [registering, setRegistering] = useState(false);
  const [registerError, setRegisterError] = useState('');
  const [ownerName, setOwnerName] = useState('Citizen');
  const [personId, setPersonId] = useState('—');
  const [phoneHint, setPhoneHint] = useState('');
  const [registeredVhId, setRegisteredVhId] = useState('');
  const [treeCount, setTreeCount] = useState(0);
  const otpRef = useRef<TextInput>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const [user, phone] = await Promise.all([
        getStoredUser(),
        getStoredPhone(),
      ]);
      if (!mounted) return;
      if (user) {
        const full = `${user.firstName || ''} ${user.lastName || ''}`.trim();
        if (full) setOwnerName(full);
        if (user.id) setPersonId(user.id);
      }
      if (phone) {
        const digits = phone.replace(/\D/g, '');
        const last4 = digits.slice(-4);
        setPhoneHint(
          digits.length >= 4
            ? `+91 ••••••${last4}`
            : `+91 ${phone}`,
        );
      }
      try {
        const me = await personsService.getMe();
        if (!mounted || !me) return;
        if (me.name) setOwnerName(me.name);
        if (me.personId) setPersonId(me.personId);
        if (typeof me.treesAssigned === 'number') {
          setTreeCount(me.treesAssigned);
        }
      } catch {
        // optional person profile
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const insuranceName = useMemo(
    () =>
      INSURANCE_OPTIONS.find(o => o.id === selectedInsurance)?.name ||
      'Insurance',
    [selectedInsurance],
  );

  const plateDisplay = vehicleNumber.trim().toUpperCase() || '—';
  const todayLabel = useMemo(
    () =>
      new Date().toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }),
    [],
  );

  const certMessage = useMemo(
    () =>
      [
        'Paryavaran Prahri — Mission 2047',
        'Digital Environmental Contribution Certificate',
        '',
        `Citizen: ${ownerName}`,
        `Person ID: ${personId}`,
        `Vehicle: ${vehicleName} · ${plateDisplay}`,
        `Insurance: ${insuranceName}`,
        `Trees: ${treeCount || 'pending assignment'}`,
        `Date: ${todayLabel}`,
      ].join('\n'),
    [
      ownerName,
      personId,
      vehicleName,
      plateDisplay,
      insuranceName,
      treeCount,
      todayLabel,
    ],
  );

  const goNext = () => setStep(prev => Math.min(prev + 1, TOTAL_STEPS));
  const goBack = () => {
    if (step === 1) {
      onBack();
      return;
    }
    // Skip OTP step when going back from insurance
    if (step === 3) {
      setStep(1);
      return;
    }
    setStep(prev => prev - 1);
  };

  const handleFetchVerify = () => {
    const plate = vehicleNumber.trim();
    if (plate.length < 6) {
      Alert.alert('Invalid plate', 'Enter a valid vehicle number (min 6 characters).');
      return;
    }
    setVehicleNumber(plate.toUpperCase());
    if (!vehicleName || vehicleName === 'My Vehicle') {
      setVehicleName(plate.toUpperCase());
    }
    setStep(2);
  };

  const handleVerifyOtp = async () => {
    setOtpError('');
    if (otp.length !== 4) {
      setOtpError('Enter the 4-digit OTP sent to your RC mobile.');
      return;
    }
    const phone = await getStoredPhone();
    const last4 = (phone || '').replace(/\D/g, '').slice(-4);
    // Accept login phone last-4 OR static test OTP 1234 (matches backend STATIC_OTP)
    if (otp === '1234' || (last4 && otp === last4)) {
      goNext();
      return;
    }
    setOtpError(
      last4
        ? `Invalid OTP. Use last 4 digits of your mobile (••••${last4}) or test code 1234.`
        : 'Invalid OTP. Use test code 1234.',
    );
  };

  const handleRegisterVehicle = async () => {
    if (registering) return;

    const plate = vehicleNumber.trim().toUpperCase();
    if (plate.length < 6) {
      setRegisterError('Enter a valid vehicle number first.');
      return;
    }

    const vhId = generateVehicleId();
    const payload = {
      plate,
      name: vehicleName.trim() || plate,
      vhId,
      fuel: fuelType,
      insuranceId: selectedInsurance,
    };

    setRegistering(true);
    setRegisterError('');
    try {
      const created = await vehiclesService.create(payload);
      const mapped = mapApiVehicleToUi(created);
      setRegisteredVhId(mapped.vhId || vhId);
      onRegisterVehicle({
        id: mapped.id,
        plate: mapped.plate,
        name: mapped.name,
        vhId: mapped.vhId,
        fuel: mapped.fuel,
      });
      goNext();
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : 'Failed to register vehicle';
      setRegisterError(message);
    } finally {
      setRegistering(false);
    }
  };

  const handleShareCert = async () => {
    try {
      await Share.share({ message: certMessage, title: 'Vehicle Certificate' });
    } catch {
      Alert.alert('Share failed', 'Could not open share sheet.');
    }
  };

  const handleDownloadCert = async () => {
    // No PDF backend yet — share sheet doubles as save/export on device
    try {
      await Share.share({
        message: certMessage,
        title: 'Save Vehicle Certificate',
      });
    } catch {
      Alert.alert('Download', 'Certificate text is ready — use Share to save.');
    }
  };

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <>
            <Text style={styles.cardTitle}>Enter vehicle number</Text>
            <Text style={styles.cardSubtitle}>
              Must be registered to your mobile number.
            </Text>
            <TextInput
              style={styles.vehicleInput}
              value={vehicleNumber}
              onChangeText={setVehicleNumber}
              placeholder="MP09 KK 8810"
              placeholderTextColor="#9ca3af"
              autoCapitalize="characters"
            />
            <TextInput
              style={[styles.vehicleInput, { marginTop: 10 }]}
              value={vehicleName}
              onChangeText={setVehicleName}
              placeholder="Vehicle name (e.g. Thar, Nexon)"
              placeholderTextColor="#9ca3af"
            />
            <View style={styles.fuelRow}>
              {['Petrol', 'Diesel', 'CNG', 'Electric'].map(f => (
                <Pressable
                  key={f}
                  style={[
                    styles.fuelChip,
                    fuelType === f && styles.fuelChipActive,
                  ]}
                  onPress={() => setFuelType(f)}>
                  <Text
                    style={[
                      styles.fuelChipText,
                      fuelType === f && styles.fuelChipTextActive,
                    ]}>
                    {f}
                  </Text>
                </Pressable>
              ))}
            </View>
            <GradientButton label="Fetch & verify" onPress={handleFetchVerify} />
          </>
        );

      case 2:
        return (
          <>
            <Text style={styles.cardTitle}>Confirm with OTP</Text>
            <Text style={styles.cardSubtitle}>
              {phoneHint
                ? `Enter last 4 digits of ${phoneHint} (or test OTP 1234)`
                : 'Enter test OTP 1234'}
            </Text>
            <Pressable style={styles.otpRow} onPress={() => otpRef.current?.focus()}>
              {[0, 1, 2, 3].map(index => (
                <View
                  key={index}
                  style={[
                    styles.otpBox,
                    otp.length === index && styles.otpBoxActive,
                  ]}>
                  <Text style={styles.otpDigit}>{otp[index] ?? ''}</Text>
                </View>
              ))}
              <TextInput
                ref={otpRef}
                value={otp}
                onChangeText={v => {
                  setOtpError('');
                  setOtp(v.replace(/\D/g, '').slice(0, 4));
                }}
                keyboardType="number-pad"
                maxLength={4}
                style={styles.otpHidden}
                autoFocus
                caretHidden
              />
            </Pressable>
            {otpError ? <Text style={styles.registerError}>{otpError}</Text> : null}
            <GradientButton
              label="Verify"
              onPress={() => void handleVerifyOtp()}
              disabled={otp.length !== 4}
            />
          </>
        );

      case 3:
        return (
          <>
            <Text style={styles.cardTitle}>Map insurance</Text>
            <Text style={styles.cardSubtitle}>
              Select your insurer (linked via ShieldSure check when available).
            </Text>
            {INSURANCE_OPTIONS.map(option => {
              const selected = selectedInsurance === option.id;
              return (
                <Pressable
                  key={option.id}
                  style={[styles.insuranceRow, selected && styles.insuranceRowActive]}
                  onPress={() => setSelectedInsurance(option.id)}>
                  <View style={[styles.radio, selected && styles.radioActive]}>
                    {selected ? <View style={styles.radioInner} /> : null}
                  </View>
                  <View style={styles.insuranceInfo}>
                    <Text style={styles.insuranceName}>{option.name}</Text>
                    <Text style={styles.insurancePolicy}>{option.policy}</Text>
                  </View>
                  <Text style={styles.shieldIcon}>🛡️</Text>
                </Pressable>
              );
            })}
            <GradientButton label="Continue" onPress={goNext} />
          </>
        );

      case 4:
        return (
          <>
            <Text style={styles.cardTitle}>Confirm vehicle</Text>
            <View style={styles.confirmBox}>
              <View style={styles.confirmHeader}>
                <View style={styles.carIconWrap}>
                  <AppIcon name="car-side" size={36} color="#126e35" />
                </View>
                <View style={styles.confirmHeaderText}>
                  <Text style={styles.confirmVehicleName}>{vehicleName}</Text>
                  <Text style={styles.confirmVehicleMeta}>
                    {plateDisplay} · {ownerName}
                  </Text>
                </View>
              </View>
              <View style={styles.detailGrid}>
                {[
                  { icon: '🛡️', label: 'Insurance', value: insuranceName },
                  { icon: '⛽', label: 'Fuel', value: fuelType },
                  { icon: '🌿', label: 'Owner', value: ownerName },
                  { icon: '📅', label: 'Plate', value: plateDisplay },
                ].map(item => (
                  <View key={item.label} style={styles.detailCell}>
                    <Text style={styles.detailIcon}>{item.icon}</Text>
                    <Text style={styles.detailLabel}>{item.label}</Text>
                    <Text style={styles.detailValue}>{item.value}</Text>
                  </View>
                ))}
              </View>
            </View>
            <View style={styles.verifyBanner}>
              <Text style={styles.verifyBannerText}>
                ✓ Ready to register · Trees will be auto-assigned by your district
                green officer.
              </Text>
            </View>
            {registerError ? (
              <Text style={styles.registerError}>{registerError}</Text>
            ) : null}
            <GradientButton
              label="Register vehicle"
              onPress={handleRegisterVehicle}
              disabled={registering}
              loading={registering}
            />
          </>
        );

      case 5:
        return (
          <>
            <Text style={styles.successTitle}>🎉 Vehicle registered!</Text>
            <LinearGradient
              colors={['#f27e20', '#2bb373']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.certBorder}>
              <View style={styles.certCard}>
                <View style={styles.certBadge}>
                  <Text style={styles.certBadgeText}>
                    🏅 MISSION 2047 · NET ZERO BHARAT
                  </Text>
                </View>
                <Text style={styles.certTitle}>
                  Digital Environmental{'\n'}Contribution Certificate
                </Text>
                <Text style={styles.certSub}>This is to certify that</Text>
                <Text style={styles.certName}>{ownerName}</Text>
                <Text style={styles.certId}>Person ID: {personId}</Text>
                <Text style={styles.certSub}>has successfully registered</Text>
                <Text style={styles.certVehicle}>
                  {vehicleName} · {plateDisplay}
                </Text>
                <Text style={styles.certMeta}>
                  {treeCount > 0
                    ? `${treeCount} tree(s) on record`
                    : 'Trees pending assignment'}{' '}
                  · {todayLabel}
                </Text>
                {registeredVhId ? (
                  <Text style={styles.certId}>Vehicle ID: {registeredVhId}</Text>
                ) : null}
                <Text style={styles.certFooter}>PARYAVARAN PRAHRI IN</Text>
              </View>
            </LinearGradient>

            <View style={styles.actionRow}>
              <Pressable
                style={styles.actionBtnGreen}
                onPress={() => void handleDownloadCert()}>
                <Text style={styles.actionBtnTextWhite}>⬇ Download</Text>
              </Pressable>
              <Pressable
                style={styles.actionBtnOrange}
                onPress={() => void handleShareCert()}>
                <Text style={styles.actionBtnTextWhite}>🖨 Print</Text>
              </Pressable>
              <Pressable
                style={styles.actionBtnOutline}
                onPress={() => void handleShareCert()}>
                <Text style={styles.actionBtnTextDark}>↗ Share</Text>
              </Pressable>
            </View>

            <Pressable style={styles.outlineBtn} onPress={onComplete}>
              <Text style={styles.outlineBtnText}>Go to My Vehicles</Text>
            </Pressable>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: getTopInset(10) }]}>
        <Pressable style={styles.headerBtn} onPress={goBack}>
          <Text style={styles.backIcon}>←</Text>
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Add New Vehicle</Text>
          <Text style={styles.headerSubtitle}>Owner-verified onboarding</Text>
        </View>
        <Pressable style={styles.headerBtn}>
          <Text style={styles.bellIcon}>🔔</Text>
        </Pressable>
      </View>

      <Stepper currentStep={step} totalSteps={TOTAL_STEPS} />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: getBottomInset(32) },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View style={styles.card}>{renderStepContent()}</View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

function Stepper({
  currentStep,
  totalSteps,
}: {
  currentStep: number;
  totalSteps: number;
}) {
  return (
    <View style={styles.stepper}>
      {Array.from({ length: totalSteps }).map((_, index) => {
        const stepNum = index + 1;
        const completed = stepNum < currentStep;
        const active = stepNum === currentStep;

        return (
          <React.Fragment key={stepNum}>
            <View
              style={[
                styles.stepCircle,
                (completed || active) && styles.stepCircleActive,
              ]}>
              <Text
                style={[
                  styles.stepText,
                  (completed || active) && styles.stepTextActive,
                ]}>
                {completed ? '✓' : stepNum}
              </Text>
            </View>
            {stepNum < totalSteps ? (
              <View
                style={[
                  styles.stepLine,
                  stepNum < currentStep && styles.stepLineActive,
                ]}
              />
            ) : null}
          </React.Fragment>
        );
      })}
    </View>
  );
}

function GradientButton({
  label,
  onPress,
  disabled,
  loading,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[styles.btnWrap, disabled && styles.btnDisabled]}>
      <LinearGradient
        colors={disabled ? ['#a8c4b0', '#b8d4be'] : GRADIENT}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.gradientBtn}>
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.gradientBtnText}>{label}</Text>
        )}
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#f4f9f4',
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#fff',
  },
  headerBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    fontSize: 20,
    color: '#111827',
    fontWeight: '600',
  },
  bellIcon: {
    fontSize: 18,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0a3617',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eef2ef',
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCircleActive: {
    backgroundColor: '#00a859',
  },
  stepText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#9ca3af',
  },
  stepTextActive: {
    color: '#fff',
  },
  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#e5e7eb',
    marginHorizontal: 4,
    maxWidth: 40,
  },
  stepLineActive: {
    backgroundColor: '#00a859',
  },
  scrollContent: {
    padding: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 28,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 4,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0a3617',
    marginBottom: 8,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 20,
  },
  vehicleInput: {
    backgroundColor: '#f0f7f2',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#dce8df',
    paddingHorizontal: 18,
    height: 56,
    fontSize: 18,
    fontWeight: '700',
    color: '#0a3617',
    marginBottom: 12,
    letterSpacing: 1,
  },
  fuelRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  fuelChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f7f2',
    borderWidth: 1,
    borderColor: '#dce8df',
  },
  fuelChipActive: {
    backgroundColor: '#126e35',
    borderColor: '#126e35',
  },
  fuelChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  fuelChipTextActive: {
    color: '#fff',
  },
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    position: 'relative',
  },
  otpBox: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: '#f0f7f2',
    borderWidth: 1.5,
    borderColor: '#dce8df',
    alignItems: 'center',
    justifyContent: 'center',
  },
  otpBoxActive: {
    borderColor: '#00a859',
  },
  otpDigit: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0a3617',
  },
  otpHidden: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0,
  },
  insuranceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  insuranceRowActive: {
    borderColor: '#00a859',
    backgroundColor: '#f0faf4',
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#d1d5db',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  radioActive: {
    borderColor: '#00a859',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#00a859',
  },
  insuranceInfo: {
    flex: 1,
  },
  insuranceName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0a3617',
    marginBottom: 2,
  },
  insurancePolicy: {
    fontSize: 12,
    color: '#6b7280',
  },
  shieldIcon: {
    fontSize: 20,
    opacity: 0.7,
  },
  confirmBox: {
    backgroundColor: '#f0f7f2',
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
  },
  confirmHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  carIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  carIcon: {
    fontSize: 22,
  },
  confirmHeaderText: {
    flex: 1,
  },
  confirmVehicleName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0a3617',
    marginBottom: 2,
  },
  confirmVehicleMeta: {
    fontSize: 12,
    color: '#6b7280',
  },
  detailGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  detailCell: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 12,
  },
  detailIcon: {
    fontSize: 14,
    marginBottom: 4,
  },
  detailLabel: {
    fontSize: 10,
    color: '#6b7280',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0a3617',
  },
  verifyBanner: {
    backgroundColor: '#e6f7ed',
    borderRadius: 14,
    padding: 12,
    marginBottom: 20,
  },
  verifyBannerText: {
    fontSize: 12,
    color: '#126e35',
    lineHeight: 18,
  },
  registerError: {
    color: '#d32f2f',
    fontSize: 13,
    marginBottom: 10,
    textAlign: 'center',
  },
  successTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0a3617',
    marginBottom: 16,
  },
  certBorder: {
    borderRadius: 22,
    padding: 2,
    marginBottom: 20,
  },
  certCard: {
    backgroundColor: '#fffef8',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
  },
  certBadge: {
    backgroundColor: '#e6f7ed',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    marginBottom: 14,
  },
  certBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#126e35',
    letterSpacing: 0.5,
  },
  certTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0c4820',
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 14,
  },
  certSub: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  certName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0c4820',
    marginBottom: 4,
  },
  certId: {
    fontSize: 11,
    color: '#9ca3af',
    marginBottom: 12,
  },
  certVehicle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0a3617',
    textAlign: 'center',
    marginBottom: 4,
  },
  certMeta: {
    fontSize: 11,
    color: '#6b7280',
    marginBottom: 16,
  },
  certFooter: {
    fontSize: 10,
    fontWeight: '800',
    color: '#00a859',
    letterSpacing: 1,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  actionBtnGreen: {
    flex: 1,
    backgroundColor: '#00a859',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
  },
  actionBtnOrange: {
    flex: 1,
    backgroundColor: '#f27e20',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
  },
  actionBtnOutline: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  actionBtnTextWhite: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  actionBtnTextDark: {
    color: '#0a3617',
    fontSize: 12,
    fontWeight: '700',
  },
  outlineBtn: {
    borderWidth: 1.5,
    borderColor: '#dce8df',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  outlineBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0a3617',
  },
  btnWrap: {
    borderRadius: 28,
    overflow: 'hidden',
  },
  btnDisabled: {
    opacity: 0.7,
  },
  gradientBtn: {
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 28,
  },
  gradientBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
