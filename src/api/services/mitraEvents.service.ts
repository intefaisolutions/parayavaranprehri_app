import { apiRequest } from '../client';
import { getStoredMitraId } from '../storage';

export type MitraEventApi = {
  _id: string;
  title: string;
  eventType?: "Offline" | "Online" | "Hybrid";
  date: string;
  time?: string;
  endTime?: string;
  location?: string;
  organizer?: string;
  description?: string;
  offlineDetails?: {
    venue?: string;
    address?: string;
    city?: string;
  };
  onlineDetails?: {
    platform?: string;
    meetingUrl?: string;
    meetingId?: string;
    passcode?: string;
  };
  bannerImage?: string;
  attendanceMarked?: boolean;
};

export const mitraEventsService = {
  listMine() {
    return apiRequest<MitraEventApi[]>('/mitra-events/me');
  },

  list() {
    return apiRequest<MitraEventApi[]>('/mitra-events');
  },

  async markAttendance(eventId: string, payload: { notes?: string; mitraId?: string } = {}) {
    const localMitraId = await getStoredMitraId();
    return apiRequest(`/mitra-events/${eventId}/attendance`, {
      method: 'POST',
      body: {
        ...payload,
        mitraId: payload.mitraId || localMitraId || undefined,
      },
    });
  },
};
