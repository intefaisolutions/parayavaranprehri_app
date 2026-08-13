import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { getBottomInset, getTopInset } from '../utils/layout';
import { NewsItem, TAG_STYLES, NewsTag } from '../data/newsData';
import { ApiError, newsService, unwrapList, type NewsItemApi } from '../api';

type Props = {
  onBack: () => void;
  onNotifications?: () => void;
};

function mapApiNews(items: NewsItemApi[]): NewsItem[] {
  const tagMap: Record<string, NewsTag> = {
    Environment: 'Environment',
    Events: 'Mission 2047',
    Government: 'Government',
    Awareness: 'Media',
    Plantation: 'Plantation',
  };
  return items.map(item => ({
    id: item._id,
    icon: '🌱',
    tag: tagMap[item.category ?? ''] ?? 'Plantation',
    timeAgo: item.publishedDate
      ? new Date(item.publishedDate).toLocaleDateString('en-GB')
      : item.createdAt
        ? new Date(item.createdAt).toLocaleDateString('en-GB')
        : '',
    title: item.title,
    description: item.content,
  }));
}

export default function NewsScreen({ onBack, onNotifications }: Props) {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const real = await newsService.list({
          page: 1,
          limit: 20,
          status: 'Published',
        });
        const list = unwrapList(real);
        if (mounted) {
          setItems(list.length > 0 ? mapApiNews(list) : []);
          setErrorMsg('');
        }
      } catch (error) {
        if (mounted) {
          setErrorMsg(
            error instanceof ApiError ? error.message : 'Failed to load news',
          );
          setItems([]);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: getTopInset(10) }]}>
        <Pressable style={styles.headerBtn} onPress={onBack}>
          <Text style={styles.backIcon}>←</Text>
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>News & Updates</Text>
          <Text style={styles.headerSubtitle}>
            Environmental & mission coverage
          </Text>
        </View>
        <Pressable style={styles.headerBtn} onPress={onNotifications}>
          <Text style={styles.bellIcon}>🔔</Text>
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
          <Text style={styles.statusLabel}>From News CMS</Text>
          {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}
          {!errorMsg && items.length === 0 ? (
            <Text style={styles.emptyText}>No published news yet.</Text>
          ) : null}

          {items.map(item => {
            const tagStyle = TAG_STYLES[item.tag];
            return (
              <View key={item.id} style={styles.newsCard}>
                <View style={styles.iconCircle}>
                  <Text style={styles.iconEmoji}>{item.icon}</Text>
                </View>
                <View style={styles.cardContent}>
                  <View style={styles.cardTopRow}>
                    <View
                      style={[styles.tag, { backgroundColor: tagStyle.bg }]}>
                      <Text style={[styles.tagText, { color: tagStyle.text }]}>
                        {item.tag}
                      </Text>
                    </View>
                    <Text style={styles.timeAgo}>{item.timeAgo}</Text>
                  </View>
                  <Text style={styles.cardTitle}>{item.title}</Text>
                  <Text style={styles.cardDescription}>{item.description}</Text>
                </View>
              </View>
            );
          })}
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
  scrollContent: {
    padding: 16,
    gap: 12,
  },
  statusLabel: {
    fontSize: 12,
    color: '#9ca3af',
    fontWeight: '600',
    marginBottom: 4,
  },
  newsCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    gap: 12,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#ecfdf5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconEmoji: {
    fontSize: 20,
  },
  cardContent: {
    flex: 1,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '700',
  },
  timeAgo: {
    fontSize: 11,
    color: '#9ca3af',
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 12,
    color: '#6b7280',
    lineHeight: 18,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    color: '#d32f2f',
    fontSize: 12,
    marginBottom: 8,
  },
  emptyText: {
    color: '#6b7280',
    fontSize: 13,
    marginBottom: 12,
    textAlign: 'center',
  },
});
