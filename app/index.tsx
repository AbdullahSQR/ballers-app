import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState } from 'react';
import { Dimensions, Image, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import SplashScreen from './SplashScreen';

const { width, height } = Dimensions.get('window');

export default function LandingScreen() {
  const [showSplash, setShowSplash] = useState(true);

  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  return (
    <LinearGradient colors={['#2a2a2a', '#000000']} style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.pageHeading}>
        <Text style={styles.title}>BALLERS</Text>
        <View style={styles.titleLine} />
        <Text style={styles.subText}>
          YOUR{'\n'}
          <Text style={styles.subTextBold}>FOOTBALL{'\n'}CAREER</Text>
          {'\n'}STARTS HERE!
        </Text>
      </View>
      <View style={styles.pageButtons}>
        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.arrowButton} onPress={() => router.push('/register')}>
            <Text style={styles.arrowText}>↗</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.getStartedButton} onPress={() => router.push('/register')}>
            <Text style={styles.getStartedText}>Get Started</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity onPress={() => router.push('/signin')}>
          <Text style={styles.loginText}>
            Already a member?{' '}
            <Text style={styles.loginLink}>Log in</Text>
          </Text>
        </TouchableOpacity>
      </View>
      <Image
        source={require('../assets/images/messi.png')}
        style={styles.messiImage}
        resizeMode="contain"
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'flex-start',
  },
  pageHeading: {
    paddingHorizontal: 28,
    paddingTop: 70,
    gap: 8,
  },
  title: {
    fontSize: 52,
    fontWeight: '900',
    color: 'white',
    letterSpacing: 6,
    alignSelf: 'flex-end',
  },
  titleLine: {
    width: 50,
    height: 3,
    backgroundColor: 'white',
    marginBottom: 8,
    alignSelf: 'flex-end',
  },
  subText: {
    fontSize: 22,
    color: '#bbb',
    lineHeight: 28,
    fontWeight: '500',
    letterSpacing: 1,
  },
  subTextBold: {
    fontSize: 24,
    color: 'white',
    fontWeight: '800',
    letterSpacing: 1,
  },
  pageButtons: {
    paddingHorizontal: 28,
    paddingVertical: 24,
    gap: 12,
    zIndex: 10,
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  arrowButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.45)',
  },
  arrowText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 20,
  },
  getStartedButton: {
    flex: 1,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.45)',
  },
  getStartedText: {
    color: 'white',
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: 1,
  },
  loginText: {
    color: '#999',
    fontSize: 13,
    textAlign: 'center',
  },
  loginLink: {
    color: '#ffffffc9',
    fontWeight: 'bold',
  },
  messiImage: {
    width: width,
    height: height * 0.55,
    alignSelf: 'center',
    transform: [{ scale: 1.3 }, { scaleX: -1 }, { translateX: 30 }],
  },
});