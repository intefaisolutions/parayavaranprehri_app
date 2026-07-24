export type RootStackParamList = {
  Login: undefined;
  Otp: { phoneNumber: string };
  MainLayout: { phoneNumber?: string } | undefined;
};
