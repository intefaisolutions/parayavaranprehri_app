import React from 'react';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/types';
import MitraScreen from './MitraScreen';

export default function MitraRegisterScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <MitraScreen
      guestMode
      onBack={() => navigation.goBack()}
      onRegistered={async (_mitraId, mobile) => {
        navigation.reset({
          index: 0,
          routes: [
            {
              name: 'Login',
              params: {
                registered: true,
                phoneNumber: mobile,
                message:
                  'Mitra request submitted. Login with OTP. New user? Register first with the same number.',
              },
            },
          ],
        });
      }}
    />
  );
}
