import { apiCall } from './index';

export interface ChatMessage {
  id: string; // or _id
  role: 'user' | 'assistant' | 'tool' | 'system';
  content: string;
  createdAt: string;
  pendingAction?: PendingAction; // Injected on the frontend if present in response
}

export interface PendingAction {
  id: string;
  type: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'CANCELLED' | 'EXPIRED';
  summary: string;
}

export interface ChatSession {
  sessionId: string;
  title?: string;
  updatedAt: string;
}

export async function sendMessage(
  message: string,
  sessionId?: string,
): Promise<{ message: string; sessionId: string; pendingAction?: PendingAction }> {
  const result = await apiCall<{ message: string; sessionId: string; pendingAction?: PendingAction }>(
    '/api/chat',
    'POST',
    { message, sessionId },
  );
  return result;
}

export async function fetchSessions(): Promise<ChatSession[]> {
  return apiCall<ChatSession[]>('/api/chat/sessions', 'GET');
}

export async function fetchSessionHistory(sessionId: string): Promise<ChatMessage[]> {
  return apiCall<ChatMessage[]>(`/api/chat/history/${sessionId}`, 'GET');
}

export async function confirmAction(pendingActionId: string): Promise<{ success: boolean; message: string }> {
  return apiCall<{ success: boolean; message: string }>(
    `/api/chat/actions/${pendingActionId}/confirm`,
    'POST',
  );
}

export async function cancelAction(pendingActionId: string): Promise<{ success: boolean; message: string }> {
  return apiCall<{ success: boolean; message: string }>(
    `/api/chat/actions/${pendingActionId}/cancel`,
    'POST',
  );
}
