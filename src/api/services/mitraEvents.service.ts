import { apiRequest } from '../client';

export type MitraEventApi = {
  _id: string;
  title: string;
  date: string;
  time?: string;
  location: string;
  organizer?: string;
  description?: string;
  attendanceMarked?: boolean;
};

export const mitraEventsService = {
  listMine() {
    return apiRequest<MitraEventApi[]>('/mitra-events/me');
  },

  list() {
    return apiRequest<MitraEventApi[]>('/mitra-events');
  },

  markAttendance(eventId: string, payload: { notes?: string } = {}) {
    return apiRequest(`/mitra-events/${eventId}/attendance`, {
      method: 'POST',
      body: payload,
    });
  },
};
