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
};