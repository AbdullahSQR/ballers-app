import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAuth } from '@/lib/auth-context';

export default function SignInScreen() {
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSignIn = async () => {
    setError('');

    if (!email || !pass) {
      setError('Please fill in all fields.');
      return;
    }

    setLoading(true);
    try {
      await login(email.trim().toLowerCase(), pass);
      // AuthGate in _layout.tsx handles routing based on role automatically
    } catch (err: any) {
      if (err.code === 'INVALID_CREDENTIALS') {
        setError('Invalid email or password.');
      } else if (err.code === 'EMAIL_NOT_VERIFIED') {
        router.push({ pathname: '/verification', params: { email: email.trim().toLowerCase() } });
      } else {
        setError(err.message ?? 'Something went wrong. Try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={['#2a2a2a', '#000000']} style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <StatusBar barStyle="light-content" />
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >

          <TouchableOpacity style={styles.backBtn} onPress={() => router.replace('/')}>
            <Text style={styles.back}>←</Text>
          </TouchableOpacity>

          <Text style={styles.title}>LETS SIGN YOU{'\n'}RIGHT IN</Text>
          <Text style={styles.subtitle}>Welcome back baller, time to get back at it!</Text>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <View style={styles.inputs}>
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#9b9b9b"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#9b9b9b"
              value={pass}
              onChangeText={setPass}
              secureTextEntry
            />
          </View>

          <TouchableOpacity style={styles.signInBt} onPress={handleSignIn} disabled={loading}>
            <Text style={styles.signIn}>{loading ? 'Signing in...' : 'Sign In'}</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push('/register')}>
            <Text style={styles.reg}>
              Don't have an account?{' '}
              <Text style={styles.regLink}>Register Now</Text>
            </Text>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    paddingHorizontal: 28,
    paddingTop: 60,
    paddingBottom: 40,
  },
  backBtn: {
    marginBottom: 24,
  },
  title: {
    fontSize: 36,
    fontWeight: '900',
    color: 'white',
    letterSpacing: 2,
    lineHeight: 44,
    marginBottom: 8,
  },
  inputs: {
    gap: 16,
    marginBottom: 24,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    padding: 16,
    color: 'white',
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#2e2e2e',
  },
  back: {
    color: 'white',
    fontSize: 24,
  },
  signInBt: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 26,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  signIn: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
  },
  reg: {
    color: '#999',
    fontSize: 13,
    textAlign: 'center',
  },
  regLink: {
    color: 'white',
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    marginBottom: 32,
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 13,
    marginBottom: 12,
    textAlign: 'center',
  },
})