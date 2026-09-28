import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import api from '@/lib/api';

export default function VerificationScreen() {
  const [loading, setLoading] = useState(false);
  const [resent, setResent] = useState(false);
  const [error, setError] = useState('');
  const { email } = useLocalSearchParams<{ email: string }>();

  const checkVerification = async () => {
    if (!email) {
      setError('Email not found. Please go back and try again.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      // Try to resend — if ALREADY_VERIFIED, email is confirmed
      await api.post('/auth/resend-verification', { email });
      // If it didn't throw, email is NOT verified yet (a new link was sent)
      setError('Not verified yet. We just sent you a fresh link — check your inbox.');
    } catch (err: any) {
      if (err.code === 'ALREADY_VERIFIED') {
        // Email is verified — send to sign in
        router.replace('/signin');
      } else {
        setError(err.message ?? 'Something went wrong. Try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const resendEmail = async () => {
    if (!email) {
      setError('Email not found. Please go back and try again.');
      return;
    }
    setError('');
    try {
      await api.post('/auth/resend-verification', { email });
      setResent(true);
    } catch (err: any) {
      setError(err.message ?? 'Failed to resend. Try again.');
    }
  };

  return (
    <LinearGradient colors={['#2a2a2a', '#000000']} style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <StatusBar barStyle="light-content" />

        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.back}>←</Text>
        </TouchableOpacity>

        <View style={styles.content}>

          <View style={styles.iconBox}>
            <Ionicons name="mail-outline" size={44} color="white" />
          </View>

          <Text style={styles.title}>Check Your Email</Text>
          <Text style={styles.subtitle}>
            We sent a verification link to your email address.
          </Text>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          {resent ? <Text style={styles.successText}>Email resent successfully!</Text> : null}

          <TouchableOpacity style={styles.submitBtn} onPress={checkVerification} disabled={loading}>
            <Text style={styles.submit}>{loading ? 'Checking...' : "I've Verified My Email"}</Text>
          </TouchableOpacity>


          <TouchableOpacity style={styles.resendBtn} onPress={resendEmail}>
            <Text style={styles.resend}>Send Again</Text>
          </TouchableOpacity>

        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backBtn: {
    paddingTop: 60,
    paddingHorizontal: 28,
    marginBottom: 8,
  },
  back: {
    fontSize: 24,
    color: 'white',
  },
  content: {
    gap: 16,
    flex: 1,
    paddingHorizontal: 28,
    paddingBottom: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBox: {
    height: 90,
    width: 90,
    borderRadius: 45,
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontWeight: '900',
    fontSize: 28,
    color: 'white',
    textAlign: 'center',
    letterSpacing: 1,
  },
  subtitle: {
    color: '#666',
    fontSize: 15,
    lineHeight: 24,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 13,
    textAlign: 'center',
  },
  successText: {
    color: '#69db7c',
    fontSize: 13,
    textAlign: 'center',
  },
  submitBtn: {
    padding: 16,
    width: '100%',
    borderRadius: 26,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  submit: {
    fontWeight: '700',
    color: 'white',
    fontSize: 18,
  },
  resendBtn: {
    width: '100%',
    borderWidth: 1,
    padding: 16,
    alignItems: 'center',
    borderRadius: 26,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  resend: {
    fontSize: 18,
    color: 'white',
    fontWeight: '600',
  },
})