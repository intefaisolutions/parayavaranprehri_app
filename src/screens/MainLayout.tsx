import React, { useCallback, useEffect, useState } from 'react';
import { View, StyleSheet, BackHandler, ActivityIndicator, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DashboardScreen from './DashboardScreen';
import VehiclesScreen from './VehiclesScreen';
import ProfileScreen from './ProfileScreen';
import RanksScreen from './RanksScreen';
import MapScreen from './MapScreen';
import JourneyAchievementsScreen from './JourneyAchievementsScreen';
import AddVehicleScreen from './AddVehicleScreen';
import PersonIdentityScreen from './PersonIdentityScreen';
import GreenSelfieScreen from './GreenSelfieScreen';
import RashiVanScreen from './RashiVanScreen';
import NewsScreen from './NewsScreen';
import SupportScreen from './SupportScreen';
import MitraScreen from './MitraScreen';
import MitraDashboardScreen from './MitraDashboardScreen';
import OfferLandScreen from './OfferLandScreen';
import AboutInitiativeScreen from './AboutInitiativeScreen';
import AdminPreviewScreen from './AdminPreviewScreen';
import VehicleDetailScreen from './VehicleDetailScreen';
import BottomNav from '../components/BottomNav';
import {
  AddedVehicle,
  createVehicleFromAdded,
  Vehicle,
} from '../data/vehiclesData';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/types';
import {
  ApiError,
  authService,
  clearSession,
  getRefreshToken,
  usersService,
  vehiclesService,
} from '../api';
import { mapApiVehicleToUi, mapInsuranceListToUi } from '../api/mappers';

type Tab = 'home' | 'vehicles' | 'map' | 'ranks' | 'profile';

type OverlayScreen =
  | 'journey'
  | 'addVehicle'
  | 'identity'
  | 'greenSelfie'
  | 'rashiVan'
  | 'news'
  | 'support'
  | 'mitra'
  | 'offerLand'
  | 'aboutInitiative'
  | 'adminPreview'
  | 'vehicleDetail';

export default function MainLayout() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [overlay, setOverlay] = useState<OverlayScreen | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [loadingVehicles, setLoadingVehicles] = useState(true);
  const [vehiclesError, setVehiclesError] = useState('');

  const route = useRoute<RouteProp<RootStackParamList, 'MainLayout'>>();
  const phoneNumber = route.params?.phoneNumber;
  const isMitra = phoneNumber === '8817678133';

  const insets = useSafeAreaInsets();

  const loadVehicles = useCallback(async () => {
    setLoadingVehicles(true);
    setVehiclesError('');
    try {
      // Prefer ShieldSure insurance vehicles; fall back to app-registered ones.
      let insuranceVehicles: Vehicle[] = [];
      try {
        const insuranceRaw = await usersService.getMyVehicles();
        insuranceVehicles = mapInsuranceListToUi(insuranceRaw);
      } catch {
        insuranceVehicles = [];
      }

      let appVehicles: Vehicle[] = [];
      try {
        const list = await vehiclesService.list();
        appVehicles = (Array.isArray(list) ? list : []).map(mapApiVehicleToUi);
      } catch {
        appVehicles = [];
      }

      const byPlate = new Map<string, Vehicle>();
      [...insuranceVehicles, ...appVehicles].forEach(v => {
        const key = (v.plate || v.id).toUpperCase();
        if (!byPlate.has(key)) byPlate.set(key, v);
      });
      setVehicles(Array.from(byPlate.values()));
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : 'Failed to load vehicles';
      setVehiclesError(message);
      setVehicles([]);
    } finally {
      setLoadingVehicles(false);
    }
  }, []);

  useEffect(() => {
    loadVehicles();
  }, [loadVehicles]);

  useEffect(() => {
    const onBackPress = () => {
      if (overlay) {
        closeOverlay();
        return true;
      }
      if (activeTab !== 'home') {
        setActiveTab('home');
        return true;
      }
      return false;
    };

    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      onBackPress,
    );
    return () => subscription.remove();
  }, [overlay, activeTab]);

  const closeOverlay = () => {
    setOverlay(null);
    setSelectedVehicle(null);
  };
  const openAddVehicle = () => setOverlay('addVehicle');
  const openVehicleDetail = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setOverlay('vehicleDetail');
  };

  const registerVehicle = (added: AddedVehicle) => {
    setVehicles(prev => {
      const normalized = added.plate.replace(/\s/g, '').toUpperCase();
      const exists = prev.some(
        v => v.plate.replace(/\s/g, '').toUpperCase() === normalized,
      );
      if (exists) {
        return prev;
      }
      return [...prev, createVehicleFromAdded(added)];
    });
  };

  const handleAddVehicleComplete = () => {
    closeOverlay();
    setActiveTab('vehicles');
    loadVehicles();
  };

  const handleLogout = async () => {
    try {
      const refreshToken = await getRefreshToken();
      if (refreshToken) {
        await authService.logout(refreshToken);
      }
    } catch {
      // Clear local session even if logout API fails
    } finally {
      await clearSession();
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    }
  };

  const renderScreen = () => {
    if (loadingVehicles && activeTab === 'vehicles') {
      return (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#136e35" />
          <Text style={styles.loadingText}>Loading vehicles…</Text>
        </View>
      );
    }

    switch (activeTab) {
      case 'home':
        if (isMitra) {
          return <MitraDashboardScreen onLogout={handleLogout} />;
        }
        return (
          <DashboardScreen
            vehicles={vehicles}
            onViewJourney={() => setOverlay('journey')}
            onAddVehicle={openAddVehicle}
            onMyIdentity={() => setOverlay('identity')}
            onGreenSelfie={() => setOverlay('greenSelfie')}
            onRashiVan={() => setOverlay('rashiVan')}
            onNews={() => setOverlay('news')}
            onSupport={() => setOverlay('support')}
            onMitra={() => setOverlay('mitra')}
            onOfferLand={() => setOverlay('offerLand')}
            onAboutInitiative={() => setOverlay('aboutInitiative')}
            onAdminPreview={() => setOverlay('adminPreview')}
          />
        );
      case 'vehicles':
        return (
          <VehiclesScreen
            vehicles={vehicles}
            onAddVehicle={openAddVehicle}
            onViewDetails={openVehicleDetail}
          />
        );
      case 'map':
        return <MapScreen />;
      case 'ranks':
        return <RanksScreen />;
      case 'profile':
        return (
          <ProfileScreen
            vehicles={vehicles}
            onLogout={handleLogout}
            onMyVehicles={() => setActiveTab('vehicles')}
            onVehicleIdentity={() => setOverlay('identity')}
            onRashiVan={() => setOverlay('rashiVan')}
            onAdminPreview={() => setOverlay('adminPreview')}
          />
        );
      default:
        return (
          <DashboardScreen
            vehicles={vehicles}
            onViewJourney={() => setOverlay('journey')}
            onAddVehicle={openAddVehicle}
            onMyIdentity={() => setOverlay('identity')}
            onGreenSelfie={() => setOverlay('greenSelfie')}
            onRashiVan={() => setOverlay('rashiVan')}
            onNews={() => setOverlay('news')}
            onSupport={() => setOverlay('support')}
            onMitra={() => setOverlay('mitra')}
            onOfferLand={() => setOverlay('offerLand')}
            onAboutInitiative={() => setOverlay('aboutInitiative')}
            onAdminPreview={() => setOverlay('adminPreview')}
          />
        );
    }
  };

  const renderOverlay = () => {
    switch (overlay) {
      case 'vehicleDetail':
        return selectedVehicle ? (
          <VehicleDetailScreen
            vehicle={selectedVehicle}
            onBack={closeOverlay}
          />
        ) : null;
      case 'adminPreview':
        return <AdminPreviewScreen onBack={closeOverlay} />;
      case 'aboutInitiative':
        return (
          <AboutInitiativeScreen
            onBack={closeOverlay}
            onViewJourney={() => setOverlay('journey')}
          />
        );
      case 'offerLand':
        return <OfferLandScreen onBack={closeOverlay} />;
      case 'mitra':
        return <MitraScreen onBack={closeOverlay} />;
      case 'support':
        return <SupportScreen onBack={closeOverlay} />;
      case 'news':
        return <NewsScreen onBack={closeOverlay} />;
      case 'rashiVan':
        return <RashiVanScreen onBack={closeOverlay} />;
      case 'greenSelfie':
        return <GreenSelfieScreen onBack={closeOverlay} />;
      case 'identity':
        return <PersonIdentityScreen onBack={closeOverlay} />;
      case 'addVehicle':
        return (
          <AddVehicleScreen
            onBack={closeOverlay}
            onRegisterVehicle={registerVehicle}
            onComplete={handleAddVehicleComplete}
          />
        );
      case 'journey':
        return <JourneyAchievementsScreen onBack={closeOverlay} />;
      default:
        return null;
    }
  };

  if (overlay) {
    return (
      <View style={[styles.root, { paddingBottom: insets.bottom }]}>
        {renderOverlay()}
      </View>
    );
  }

  return (
    <View style={[styles.root, { paddingBottom: insets.bottom }]}>
      {vehiclesError && activeTab === 'home' ? (
        <View style={styles.banner}>
          <Text style={styles.bannerText}>{vehiclesError}</Text>
        </View>
      ) : null}
      {renderScreen()}
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#f4f9f4',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    color: '#6b7280',
    fontSize: 14,
  },
  banner: {
    backgroundColor: '#fef2f2',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  bannerText: {
    color: '#b91c1c',
    fontSize: 12,
    textAlign: 'center',
  },
});
