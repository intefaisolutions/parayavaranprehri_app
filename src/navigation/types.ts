export type RootStackParamList = {
  Login:
  | {
    registered?: boolean;
    phoneNumber?: string;
    message?: string;
  }
  | undefined;
  Register: undefined;
  MitraRegister: undefined;
  Otp: { phoneNumber: string };
  MainLayout: { phoneNumber?: string } | undefined;
  EventDetail: { event: any; onMarkAttendance?: (eventId: string) => void };
};