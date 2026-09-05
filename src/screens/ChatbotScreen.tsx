import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { colors } from '../theme/colors';
import {
  ChatMessage,
  ChatSession,
  sendMessage,
  fetchSessions,
  fetchSessionHistory,
  confirmAction,
  cancelAction,
} from '../api/chatbot';
import { getBottomInset, getTopInset } from '../utils/layout';

export default function ChatbotScreen() {
  const navigation = useNavigation();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | undefined>();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      const data = await fetchSessions();
      setSessions(data);
      if (data.length > 0) {
        setCurrentSessionId(data[0].sessionId);
        loadHistory(data[0].sessionId);
      }
    } catch (err) {
      console.error('Failed to load chat sessions', err);
    }
  };

  const loadHistory = async (sessionId: string) => {
    try {
      setLoading(true);
      const data = await fetchSessionHistory(sessionId);
      // Filter out system and raw tool messages for the UI
      const displayMessages = data.filter(
        (m) => m.role === 'user' || m.role === 'assistant'
      );
      setMessages(displayMessages);
    } catch (err) {
      console.error('Failed to load history', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!inputText.trim()) return;
    const text = inputText.trim();
    setInputText('');

    const tempUserMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, tempUserMsg]);
    setLoading(true);

    try {
      const res: any = await sendMessage(text, currentSessionId);
      const activeSessionId = res?.sessionId || res?.data?.sessionId || currentSessionId;
      if (!currentSessionId && activeSessionId) {
        setCurrentSessionId(activeSessionId);
        fetchSessions().then(setSessions).catch(() => {});
      }

      const replyContent =
        res?.message ||
        res?.data?.message ||
        (typeof res === 'string' ? res : 'No response content');

      const action = res?.pendingAction || res?.data?.pendingAction;

      const tempAssistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: replyContent,
        createdAt: new Date().toISOString(),
        pendingAction: action,
      };

      setMessages((prev) => [...prev, tempAssistantMsg]);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (pendingActionId: string) => {
    setLoading(true);
    try {
      const res = await confirmAction(pendingActionId);
      if (res.success) {
        Alert.alert('Success', res.message);
        // Optionally inject a success message from the system
        const sysMsg: ChatMessage = {
          id: Date.now().toString(),
          role: 'assistant',
          content: `✅ Action Confirmed: ${res.message}`,
          createdAt: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, sysMsg]);
      } else {
        Alert.alert('Notice', res.message || 'Action could not be confirmed');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to confirm action');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (pendingActionId: string) => {
    setLoading(true);
    try {
      const res = await cancelAction(pendingActionId);
      if (res.success) {
        // Inject cancellation message
        const sysMsg: ChatMessage = {
          id: Date.now().toString(),
          role: 'assistant',
          content: `❌ Action Cancelled.`,
          createdAt: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, sysMsg]);
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to cancel action');
    } finally {
      setLoading(false);
    }
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isUser = item.role === 'user';
    const hasPendingAction = !!item.pendingAction;

    return (
      <View
        style={[
          styles.messageRow,
          isUser ? styles.messageRowUser : styles.messageRowAi,
        ]}
      >
        {!isUser && (
          <View style={styles.aiAvatar}>
            <MaterialCommunityIcons name="robot" size={18} color="#059669" />
          </View>
        )}

        <View
          style={[
            styles.bubble,
            isUser ? styles.bubbleUser : styles.bubbleAi,
          ]}
        >
          {!isUser && (
            <Text style={styles.aiSenderLabel}>Prahri AI</Text>
          )}

          <Text
            style={[
              styles.messageText,
              isUser ? styles.messageTextUser : styles.messageTextAi,
            ]}
          >
            {item.content}
          </Text>

          {hasPendingAction && item.pendingAction?.status === 'PENDING' && (
            <View style={styles.actionCard}>
              <Text style={styles.actionTitle}>Pending Action</Text>
              <Text style={styles.actionSummary}>{item.pendingAction.summary}</Text>
              <View style={styles.actionButtonsRow}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.confirmButton]}
                  onPress={() => handleConfirm(item.pendingAction!.id)}
                >
                  <MaterialCommunityIcons name="check" size={20} color="#fff" />
                  <Text style={styles.actionButtonText}>Confirm</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.cancelButton]}
                  onPress={() => handleCancel(item.pendingAction!.id)}
                >
                  <MaterialCommunityIcons name="close" size={20} color="#fff" />
                  <Text style={styles.actionButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: getTopInset() + 16 }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Prahri Assistant</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Chat Area */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item, index) => item.id || index.toString()}
        renderItem={renderMessage}
        contentContainerStyle={styles.listContent}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />

      {/* Input Area */}
      <View style={[styles.inputContainer, { paddingBottom: getBottomInset() + 16 }]}>
        <TextInput
          style={styles.textInput}
          placeholder="Ask a question..."
          placeholderTextColor="#6B7280"
          value={inputText}
          onChangeText={setInputText}
          multiline
        />
        <TouchableOpacity
          style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={!inputText.trim() || loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <MaterialCommunityIcons name="send" size={20} color="#fff" />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#126E35',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  listContent: {
    padding: 16,
    flexGrow: 1,
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  messageRowUser: {
    justifyContent: 'flex-end',
  },
  messageRowAi: {
    justifyContent: 'flex-start',
  },
  aiAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    marginTop: 2,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  aiSenderLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#059669',
    marginBottom: 4,
  },
  bubble: {
    maxWidth: '82%',
    padding: 12,
    borderRadius: 16,
  },
  bubbleUser: {
    backgroundColor: '#126E35',
    borderBottomRightRadius: 4,
  },
  bubbleAi: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4,
    borderWidth: 1.5,
    borderColor: '#D1FAE5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
  },
  messageTextUser: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  messageTextAi: {
    color: '#111827', // Crisp, high-contrast dark charcoal text
    fontWeight: '500',
  },
  actionCard: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#F0F9F4',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primaryLight,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 4,
  },
  actionSummary: {
    fontSize: 14,
    color: '#111827',
    marginBottom: 12,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 6,
    gap: 4,
  },
  confirmButton: {
    backgroundColor: colors.primary,
  },
  cancelButton: {
    backgroundColor: colors.error,
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#EEE',
  },
  textInput: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    maxHeight: 100,
    fontSize: 15,
    color: '#111827',
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  sendButtonDisabled: {
    backgroundColor: '#A0D8B3',
  },
});
