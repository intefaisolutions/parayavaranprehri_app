import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Linking,
  SafeAreaView,
  StatusBar,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { mitraEventsService, ApiError } from '../api';
import { isEventStarted } from './MitraDashboardScreen';

type RootStackParamList = {
  EventDetail: { event: any; onMarkAttendance?: (eventId: string) => void };
};

type EventDetailRouteProp = RouteProp<RootStackParamList, 'EventDetail'>;

export const EventDetailScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<EventDetailRouteProp>();
  const { event, onMarkAttendance } = route.params;

  const [attendanceMarked, setAttendanceMarked] = useState(
    Boolean(event.attendanceMarked),
  );
  const [marking, setMarking] = useState(false);

  const getEventTypeColor = (type?: string) => {
    if (type === 'Online') return '#3b82f6';
    if (type === 'Hybrid') return '#8b5cf6';
    return '#10b981'; // Offline
  };

  const eventType = event.eventType || 'Offline';
  const typeColor = getEventTypeColor(eventType);
  const isOnline = eventType === 'Online' || eventType === 'Hybrid';
  const isOffline = eventType === 'Offline' || eventType === 'Hybrid';

  const handleOpenMap = () => {
    if (event.offlineDetails?.latitude && event.offlineDetails?.longitude) {
      const url = `https://www.google.com/maps/search/?api=1&query=${event.offlineDetails.latitude},${event.offlineDetails.longitude}`;
      Linking.openURL(url);
    } else if (event.offlineDetails?.address) {
      const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.offlineDetails.address)}`;
      Linking.openURL(url);
    } else if (event.location) {
      const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.location)}`;
      Linking.openURL(url);
    }
  };

  const handleJoinMeeting = () => {
    if (event.onlineDetails?.meetingUrl) {
      Linking.openURL(event.onlineDetails.meetingUrl);
    }
  };

  const handleMarkAttendance = async () => {
    if (!isEventStarted(event.date, event.time)) {
      Alert.alert(
        'Attendance Not Available',
        `Attendance can only be marked on or after the scheduled date and time of the event (${event.date}${event.time ? ' at ' + event.time : ''}).`,
      );
      return;
    }
    setMarking(true);
    try {
      await mitraEventsService.markAttendance(event.id);
      setAttendanceMarked(true);
      onMarkAttendance?.(event.id);
      Alert.alert('Attendance marked', 'Your attendance has been recorded.');
    } catch (error) {
      Alert.alert(
        'Attendance failed',
        error instanceof ApiError
          ? error.message
          : 'Could not mark attendance',
      );
    } finally {
      setMarking(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-back" size={24} color="#1e293b" />
        </Pressable>
        <Text style={styles.headerTitle}>Event Details</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        {event.bannerImage ? (
          <View style={styles.bannerPlaceholder}>
            <Text style={styles.bannerText}>Event Banner</Text>
          </View>
        ) : null}

        <View style={styles.mainInfo}>
          <View style={[styles.badge, { backgroundColor: typeColor + '20' }]}>
            <View style={[styles.badgeDot, { backgroundColor: typeColor }]} />
            <Text style={[styles.badgeText, { color: typeColor }]}>{eventType} Event</Text>
          </View>

          <Text style={styles.title}>{event.title}</Text>

          <View style={styles.infoRow}>
            <Icon name="calendar-outline" size={20} color="#64748b" />
            <Text style={styles.infoText}>{event.date}</Text>
          </View>

          <View style={styles.infoRow}>
            <Icon name="time-outline" size={20} color="#64748b" />
            <Text style={styles.infoText}>
              {event.time || 'TBA'} {event.endTime ? ` - ${event.endTime}` : ''}
            </Text>
          </View>
        </View>

        {event.description ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About Event</Text>
            <Text style={styles.description}>{event.description}</Text>
          </View>
        ) : null}

        {isOffline && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Location (Offline/Hybrid)</Text>
            <View style={styles.card}>
              <Icon name="location" size={24} color="#ef4444" style={styles.cardIcon} />
              <View style={styles.cardContent}>
                <Text style={styles.venueName}>
                  {event.offlineDetails?.venue || event.location || 'Venue details pending'}
                </Text>
                {event.offlineDetails?.address && (
                  <Text style={styles.addressText}>{event.offlineDetails.address}</Text>
                )}
                {event.offlineDetails?.city && (
                  <Text style={styles.addressText}>{event.offlineDetails.city}</Text>
                )}
              </View>
            </View>
            <Pressable style={styles.actionBtnOutline} onPress={handleOpenMap}>
              <Icon name="map-outline" size={18} color="#10b981" />
              <Text style={styles.actionBtnOutlineText}>Get Directions</Text>
            </Pressable>
          </View>
        )}

        {isOnline && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Online Meeting (Online/Hybrid)</Text>
            <View style={styles.card}>
              <Icon name="videocam" size={24} color="#3b82f6" style={styles.cardIcon} />
              <View style={styles.cardContent}>
                <Text style={styles.venueName}>
                  {event.onlineDetails?.platform || 'Online Meeting'}
                </Text>
                {event.onlineDetails?.meetingId ? (
                  <Text style={styles.addressText}>Meeting ID: {event.onlineDetails.meetingId}</Text>
                ) : null}
                {event.onlineDetails?.passcode ? (
                  <Text style={styles.addressText}>Passcode: {event.onlineDetails.passcode}</Text>
                ) : null}
              </View>
            </View>
            {event.onlineDetails?.meetingUrl ? (
              <Pressable style={[styles.actionBtn, { backgroundColor: '#3b82f6' }]} onPress={handleJoinMeeting}>
                <Icon name="link-outline" size={18} color="#ffffff" />
                <Text style={styles.actionBtnText}>Join Meeting</Text>
              </Pressable>
            ) : null}
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Attendance</Text>
          {attendanceMarked ? (
            <View style={styles.attendanceMarkedCard}>
              <Icon name="checkmark-circle" size={24} color="#10b981" />
              <Text style={styles.attendanceMarkedText}>Attendance Marked</Text>
            </View>
          ) : (
            <View>
              {!isEventStarted(event.date, event.time) && (
                <View style={styles.attendanceLockedNotice}>
                  <Icon name="lock-closed-outline" size={18} color="#64748b" style={{ marginRight: 6 }} />
                  <Text style={styles.attendanceLockedNoticeText}>
                    Attendance opens on {event.date} {event.time ? `at ${event.time}` : ''}
                  </Text>
                </View>
              )}
              <Pressable
                style={[
                  styles.actionBtn,
                  isEventStarted(event.date, event.time)
                    ? { backgroundColor: '#10b981' }
                    : { backgroundColor: '#f1f5f9', borderWidth: 1, borderColor: '#cbd5e1' },
                ]}
                disabled={marking}
                onPress={handleMarkAttendance}
              >
                <Icon
                  name={isEventStarted(event.date, event.time) ? "checkmark-circle-outline" : "lock-closed-outline"}
                  size={18}
                  color={isEventStarted(event.date, event.time) ? "#ffffff" : "#64748b"}
                />
                <Text
                  style={[
                    styles.actionBtnText,
                    !isEventStarted(event.date, event.time) && { color: '#64748b' },
                  ]}
                >
                  {marking
                    ? 'Marking...'
                    : isEventStarted(event.date, event.time)
                    ? 'Mark Attendance'
                    : 'Attendance Locked'}
                </Text>
              </Pressable>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Organizer</Text>
          <View style={styles.organizerCard}>
            <View style={styles.organizerAvatar}>
              <Text style={styles.organizerInitial}>
                {event.organizer ? event.organizer.charAt(0) : 'P'}
              </Text>
            </View>
            <Text style={styles.organizerName}>{event.organizer || 'Paryavaran Prahri'}</Text>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f8fafc' },
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  backBtn: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Outfit-SemiBold',
    color: '#1e293b',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  bannerPlaceholder: {
    width: '100%',
    height: 200,
    backgroundColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bannerText: {
    color: '#94a3b8',
    fontFamily: 'Outfit-Medium',
  },
  mainInfo: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 12,
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  badgeText: {
    fontSize: 12,
    fontFamily: 'Outfit-Medium',
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 24,
    fontFamily: 'Outfit-Bold',
    color: '#0f172a',
    marginBottom: 16,
    lineHeight: 32,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoText: {
    marginLeft: 12,
    fontSize: 16,
    fontFamily: 'Outfit-Medium',
    color: '#475569',
  },
  section: {
    padding: 20,
    backgroundColor: '#ffffff',
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Outfit-SemiBold',
    color: '#1e293b',
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    fontFamily: 'Outfit-Regular',
    color: '#475569',
    lineHeight: 24,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  cardIcon: {
    marginRight: 16,
    marginTop: 2,
  },
  cardContent: {
    flex: 1,
  },
  venueName: {
    fontSize: 16,
    fontFamily: 'Outfit-SemiBold',
    color: '#1e293b',
    marginBottom: 4,
  },
  addressText: {
    fontSize: 14,
    fontFamily: 'Outfit-Regular',
    color: '#64748b',
    marginTop: 2,
  },
  actionBtnOutline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#10b981',
    borderRadius: 8,
  },
  actionBtnOutlineText: {
    marginLeft: 8,
    fontSize: 15,
    fontFamily: 'Outfit-SemiBold',
    color: '#10b981',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
  },
  actionBtnText: {
    marginLeft: 8,
    fontSize: 15,
    fontFamily: 'Outfit-SemiBold',
    color: '#ffffff',
  },
  attendanceMarkedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ecfdf5',
    borderColor: '#a7f3d0',
    borderWidth: 1,
    padding: 14,
    borderRadius: 8,
  },
  attendanceMarkedText: {
    marginLeft: 8,
    fontSize: 15,
    fontFamily: 'Outfit-SemiBold',
    color: '#065f46',
  },
  attendanceLockedNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    marginBottom: 10,
  },
  attendanceLockedNoticeText: {
    fontSize: 13,
    fontFamily: 'Outfit-Regular',
    color: '#64748b',
  },
  organizerCard: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  organizerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#10b98120',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  organizerInitial: {
    fontSize: 20,
    fontFamily: 'Outfit-Bold',
    color: '#10b981',
  },
  organizerName: {
    fontSize: 16,
    fontFamily: 'Outfit-SemiBold',
    color: '#1e293b',
  },
});

export default EventDetailScreen;
