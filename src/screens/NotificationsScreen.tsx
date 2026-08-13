import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { getBottomInset, getTopInset } from '../utils/layout';
import { ApiError, notificationsService } from '../api';

type Props = {
  onBack: () => void;
};

type InboxItem = {
  _id: string;
  notificationTitle: string;
  message: string;
  sentAt?: string | null;
  createdAt?: string;
  isRead: boolean;
};

export default function NotificationsScreen({ onBack }: Props) {
  const [items, setItems] = useState<InboxItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [markingAll, setMarkingAll] = useState(false);

  const load = useCallback(async () => {
    try {
      const inbox = await notificationsService.getInbox(50);
      setItems(inbox.items || []);
      setUnreadCount(inbox.unreadCount || 0);
      setErrorMsg('');
    } catch (error) {
      setErrorMsg(
        error instanceof ApiError
          ? error.message
          : 'Failed to load notifications',
      );
      setItems([]);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const onOpenItem = async (item: InboxItem) => {
    if (item.isRead) return;
    setItems(prev =>
      prev.map(n => (n._id === item._id ? { ...n, isRead: true } : n)),
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
    try {
      await notificationsService.markRead(item._id);
    } catch {
      // keep optimistic UI
    }
  };

  const onMarkAll = async () => {
    if (markingAll || unreadCount === 0) return;
    setMarkingAll(true);
    try {
      await notificationsService.markAllRead();
      setItems(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      setErrorMsg(
        error instanceof ApiError
          ? error.message
          : 'Could not mark all as read',
      );
    } finally {
      setMarkingAll(false);
    }
  };

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: getTopInset(10) }]}>
        <Pressable style={styles.headerBtn} onPress={onBack}>
          <Text style={styles.backIcon}>←</Text>
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Notifications</Text>
          <Text style={styles.headerSubtitle}>
            {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
          </Text>
        </View>
        <Pressable
          style={styles.headerBtn}
          onPress={() => void onMarkAll()}
          disabled={markingAll || unreadCount === 0}>
          {markingAll ? (
            <ActivityIndicator size="small" color="#126e35" />
          ) : (
            <Text style={styles.markAll}>Read</Text>
          )}
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#136e35" />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: getBottomInset(32) },
          ]}
          showsVerticalScrollIndicator={false}>
          {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}
          {items.length === 0 ? (
            <Text style={styles.emptyText}>No notifications yet.</Text>
          ) : (
            items.map(item => (
              <Pressable
                key={item._id}
                style={[styles.card, !item.isRead && styles.cardUnread]}
                onPress={() => void onOpenItem(item)}>
                <View style={styles.cardTop}>
                  <Text style={styles.cardTitle} numberOfLines={2}>
                    {item.notificationTitle}
                  </Text>
                  {!item.isRead ? <View style={styles.dot} /> : null}
                </View>
                <Text style={styles.cardBody} numberOfLines={3}>
                  {item.message}
                </Text>
                <Text style={styles.cardTime}>
                  {item.sentAt || item.createdAt
                    ? new Date(
                        item.sentAt || item.createdAt || '',
                      ).toLocaleString('en-GB')
                    : ''}
                </Text>
              </Pressable>
            ))
          )}
        </ScrollView>
      )}
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
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eef2ef',
  },
  headerBtn: {
    minWidth: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  backIcon: {
    fontSize: 20,
    color: '#111827',
    fontWeight: '600',
  },
  markAll: {
    fontSize: 12,
    fontWeight: '700',
    color: '#126e35',
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
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: 16,
    gap: 10,
  },
  errorText: {
    color: '#d32f2f',
    fontSize: 12,
    marginBottom: 8,
  },
  emptyText: {
    textAlign: 'center',
    color: '#6b7280',
    fontSize: 13,
    marginTop: 40,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e8eee9',
  },
  cardUnread: {
    borderColor: '#b2f0c7',
    backgroundColor: '#f0fdf6',
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 6,
  },
  cardTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: '#0a3617',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#059669',
    marginTop: 5,
  },
  cardBody: {
    fontSize: 13,
    color: '#4b5563',
    lineHeight: 18,
  },
  cardTime: {
    marginTop: 8,
    fontSize: 11,
    color: '#9ca3af',
  },
});
