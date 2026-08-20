import React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AppIcon from '../components/AppIcon';
import { Vehicle } from '../data/vehiclesData';
import { getVehicleIconName } from '../utils/vehicleIcons';

type Props = {
  vehicles: Vehicle[];
  onViewDetails: (vehicle: Vehicle) => void;
  onNotifications?: () => void;
};

export default function VehiclesScreen({
  vehicles,
  onViewDetails,
  onNotifications,
}: Props) {
  const activeCount = vehicles.filter(v => v.status === 'Active').length;
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>My Vehicles</Text>
          <Text style={styles.headerSubtitle}>
            {activeCount} active · Net Zero contributors
          </Text>
        </View>
        <Pressable style={styles.bellButton} onPress={onNotifications}>
          <AppIcon name="bell-outline" size={20} color="#0a3617" />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <View style={styles.listContainer}>
          {vehicles.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No vehicles found in your number</Text>
              <Text style={styles.emptySubtitle}>
               Only insured vehicles linked to this number are shown here.

              </Text>
            </View>
          ) : (
            vehicles.map(vehicle => (
              <View key={vehicle.id} style={styles.vehicleCard}>
              <View style={styles.cardHeader}>
                <View style={styles.vehicleAvatar}>
                  <AppIcon
                    name={getVehicleIconName(vehicle)}
                    size={28}
                    color="#126e35"
                  />
                </View>

                <View style={styles.vehicleInfo}>
                  <View style={styles.nameRow}>
                    <Text style={styles.vehicleName} numberOfLines={1}>
                      {vehicle.name}
                    </Text>
                    <View style={styles.activeBadge}>
                      <AppIcon name="check-circle" size={14} color="#10b981" />
                      <Text style={styles.activeBadgeText}>{vehicle.status}</Text>
                    </View>
                  </View>
                  <Text style={styles.vehicleText}>{vehicle.plate}</Text>
                  <Text style={styles.vehicleText}>{vehicle.vhId}</Text>
                  <View style={styles.fuelRow}>
                    <AppIcon name="gas-station" size={14} color="#6b7280" />
                    <Text style={styles.vehicleTextLight}>
                      {vehicle.fuel} · Reg {vehicle.regDate}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.statsRow}>
                <View style={[styles.statPill, styles.statPillGreen]}>
                  <AppIcon name="tree" size={16} color="#10b981" />
                  <Text style={[styles.statLabel, styles.statTextGreen]}>
                    Trees
                  </Text>
                  <Text style={[styles.statValue, styles.statTextGreen]}>
                    {vehicle.trees}
                  </Text>
                </View>

                <View style={[styles.statPill, styles.statPillBlue]}>
                  <AppIcon name="cloud-outline" size={16} color="#3b82f6" />
                  <Text style={[styles.statLabel, styles.statTextBlue]}>CO₂</Text>
                  <Text style={[styles.statValue, styles.statTextBlue]}>
                    {vehicle.co2}kg
                  </Text>
                </View>

                <View style={[styles.statPill, styles.statPillOrange]}>
                  <AppIcon name="heart-pulse" size={16} color="#f97316" />
                  <Text style={[styles.statLabel, styles.statTextOrange]}>
                    Survival
                  </Text>
                  <Text style={[styles.statValue, styles.statTextOrange]}>
                    {vehicle.survival}
                  </Text>
                </View>
              </View>

              <View style={styles.actionRow}>
                <Pressable
                  style={styles.viewTreesBtn}
                  onPress={() => onViewDetails(vehicle)}>
                  <Text style={styles.viewTreesText}>View Trees</Text>
                  <Text style={styles.viewTreesArrow}>›</Text>
                </Pressable>
                <Pressable
                  style={styles.viewDetailsBtn}
                  onPress={() => onViewDetails(vehicle)}>
                  <Text style={styles.viewDetailsText}>View Details</Text>
                  <Text style={styles.viewDetailsArrow}>›</Text>
                </Pressable>
              </View>
            </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#f4f9f4',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eef2ef',
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0a3617',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
  },
  bellButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellIcon: {
    fontSize: 18,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 120,
  },
  listContainer: {
    gap: 16,
  },
  emptyState: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: '#e8eee9',
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0a3617',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: '#6b7280',
  },
  vehicleCard: {
    backgroundColor: '#fff',
    borderRadius: 32,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  vehicleAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#eaf4ee',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  vehicleImage: {
    width: 40,
    height: 40,
  },
  vehicleInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  vehicleName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '800',
    color: '#0a3617',
    marginRight: 8,
  },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#d1fae5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  checkIcon: {
    width: 10,
    height: 10,
    marginRight: 4,
  },
  activeBadgeText: {
    color: '#047857',
    fontSize: 10,
    fontWeight: '600',
  },
  vehicleText: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 2,
  },
  fuelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 6,
  },
  tinyIcon: {
    width: 12,
    height: 12,
    marginRight: 6,
    tintColor: '#6b7280',
  },
  vehicleTextLight: {
    fontSize: 11,
    color: '#9ca3af',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statPill: {
    flex: 1,
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  statPillGreen: {
    backgroundColor: '#ecfdf5',
  },
  statPillBlue: {
    backgroundColor: '#eff6ff',
  },
  statPillOrange: {
    backgroundColor: '#fff7ed',
  },
  statIconGreen: {
    width: 16,
    height: 16,
    marginBottom: 4,
  },
  statIconBlue: {
    width: 16,
    height: 16,
    marginBottom: 4,
  },
  statIconOrange: {
    width: 16,
    height: 16,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '600',
    marginBottom: 2,
  },
  statTextGreen: {
    color: '#059669',
  },
  statTextBlue: {
    color: '#2563eb',
  },
  statTextOrange: {
    color: '#ea580c',
  },
  statValue: {
    fontSize: 14,
    fontWeight: '800',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  viewTreesBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ecfdf5',
    borderRadius: 24,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#b2f0c7',
  },
  viewTreesText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#059669',
    marginRight: 4,
  },
  viewTreesArrow: {
    fontSize: 18,
    color: '#059669',
    fontWeight: '600',
    marginTop: -1,
  },
  viewDetailsBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0c4820',
    borderRadius: 24,
    paddingVertical: 14,
    paddingHorizontal: 12,
  },
  viewDetailsText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
    marginRight: 4,
  },
  viewDetailsArrow: {
    fontSize: 18,
    color: '#fff',
    fontWeight: '600',
    marginTop: -1,
  },
});
