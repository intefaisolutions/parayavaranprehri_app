import { apiRequest } from './client';

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
  return apiRequest<{ message: string; sessionId: string; pendingAction?: PendingAction }>(
    '/chat',
    { method: 'POST', body: { message, sessionId } },
  );
}

export async function fetchSessions(): Promise<ChatSession[]> {
  return apiRequest<ChatSession[]>('/chat/sessions');
}

export async function fetchSessionHistory(sessionId: string): Promise<ChatMessage[]> {
  return apiRequest<ChatMessage[]>(`/chat/history/${sessionId}`);
}

export async function confirmAction(pendingActionId: string): Promise<{ success: boolean; message: string }> {
  return apiRequest<{ success: boolean; message: string }>(
    `/chat/actions/${pendingActionId}/confirm`,
    { method: 'POST' },
  );
}

export async function cancelAction(pendingActionId: string): Promise<{ success: boolean; message: string }> {
  return apiRequest<{ success: boolean; message: string }>(
    `/chat/actions/${pendingActionId}/cancel`,
    { method: 'POST' },
  );
}
