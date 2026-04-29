import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';


export default function RegisterScreen() {
  const [user, setUser] = useState('');
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [confirm, setConfirm] = useState('');
  const [day, setDay] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    setError('');

    if (!user || !email || !pass || !confirm || !day || !month || !year) {
      setError('Please fill in all fields.');
      return;
    }
    if (pass !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    if (pass.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    router.push('/verification');
    setLoading(false);
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

          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.back}>←</Text>
          </TouchableOpacity>

          <Text style={styles.title}>LETS REGISTER{'\n'}YOUR{'\n'}ACCOUNT</Text>
          <Text style={styles.subtitle}>Please fill the information below.</Text>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <View style={styles.inputs}>
            <TextInput style={styles.input} placeholder="Username" value={user} onChangeText={setUser} placeholderTextColor="#9b9b9b" />
            <TextInput style={styles.input} placeholder="Email" value={email} onChangeText={setEmail} placeholderTextColor="#9b9b9b" keyboardType="email-address" autoCapitalize="none" />
            <TextInput style={styles.input} placeholder="Password" value={pass} onChangeText={setPass} placeholderTextColor="#9b9b9b" secureTextEntry />
            <TextInput style={styles.input} placeholder="Confirm Password" value={confirm} onChangeText={setConfirm} placeholderTextColor="#9b9b9b" secureTextEntry />
          </View>

          <View style={styles.dob}>
            <TextInput style={styles.dobSec} placeholder="DD" placeholderTextColor="#9b9b9b" value={day} onChangeText={setDay} keyboardType="number-pad" maxLength={2} />
            <TextInput style={styles.dobSec} placeholder="MM" placeholderTextColor="#9b9b9b" value={month} onChangeText={setMonth} keyboardType="number-pad" maxLength={2} />
            <TextInput style={styles.dobYear} placeholder="YYYY" placeholderTextColor="#9b9b9b" value={year} onChangeText={setYear} keyboardType="number-pad" maxLength={4} />
          </View>

          <TouchableOpacity style={styles.signUpBtn} onPress={handleRegister} disabled={loading}>
            <Text style={styles.signUp}>{loading ? 'Creating account...' : 'Sign Up'}</Text>
          </TouchableOpacity>

          <Text style={styles.terms}>By signing up you agree to all terms and conditions from Ballers.</Text>

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
    paddingTop: 60,
    paddingHorizontal: 28,
    paddingBottom: 40,
  },
  backBtn: {
    marginBottom: 24,
  },
  back: {
    fontSize: 24,
    color: 'white',
  },
  title: {
    color: 'white',
    fontSize: 36,
    marginBottom: 8,
    fontWeight: '900',
    lineHeight: 44,
    letterSpacing: 2,
  },
  subtitle: {
    color: '#666',
    marginBottom: 32,
    fontSize: 18,
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 13,
    marginBottom: 12,
    textAlign: 'center',
  },
  inputs: {
    marginBottom: 16,
    gap: 16,
  },
  input: {
    borderColor: '#2e2e2e',
    padding: 16,
    color: 'white',
    borderRadius: 12,
    fontSize: 15,
    borderWidth: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  dob: {
    marginTop: 8,
    flexDirection: 'row',
    marginBottom: 28,
    gap: 12,
  },
  dobSec: {
    borderColor: '#2e2e2e',
    flex: 1,
    textAlign: 'center',
    padding: 16,
    borderRadius: 12,
    color: 'white',
    borderWidth: 1,
    fontSize: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  dobYear: {
    textAlign: 'center',
    flex: 2,
    borderWidth: 1,
    padding: 16,
    color: 'white',
    borderColor: '#2e2e2e',
    fontSize: 15,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  signUpBtn: {
    padding: 16,
    marginBottom: 16,
    borderRadius: 26,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  signUp: {
    fontWeight: '700',
    fontSize: 18,
    color: 'white',
  },
  terms: {
    lineHeight: 18,
    color: '#555',
    textAlign: 'center',
    fontSize: 12,
  },
})