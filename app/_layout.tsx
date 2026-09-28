import { useColorScheme } from '@/hooks/use-color-scheme';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { AuthProvider, useAuth } from '@/lib/auth-context';
import { Redirect } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';

// ─── Auth Gate ────────────────────────────────────────────────────────────────
// Handles redirects based on auth state and user role

function AuthGate() {
  const { user, isLoading } = useAuth();
  const segments = useSegments();

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color="#FFD700" />
      </View>
    );
  }

  const inAuthGroup = segments[0] === '(tabs)';
  const inStadiumManager = segments[0] === 'stadium-manager';
  const hasProfile = user?.has_profile || !!user?.player_profile;

  // Not logged in — send to signin
  if (!user && (inAuthGroup || inStadiumManager)) {
    return <Redirect href="/signin" />;
  }

  // Logged in — stadium manager
  if (user?.role === 'stadium_manager' && !inStadiumManager) {
    return <Redirect href="/stadium-manager" />;
  }

  // Logged in — no profile yet → onboarding
  if (user && user.role !== 'stadium_manager' && !hasProfile && segments[0] !== 'questions') {
    return <Redirect href="/questions" />;
  }

  // Logged in — has profile but not in tabs → send to tabs
  if (user && hasProfile && !inAuthGroup && user.role !== 'stadium_manager') {
    return <Redirect href="/(tabs)" />;
  }

  return null;
}

// ─── Root Layout ──────────────────────────────────────────────────────────────

function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AuthGate />
      <Stack initialRouteName="index">
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="register" options={{ headerShown: false }} />
        <Stack.Screen name="signin" options={{ headerShown: false, gestureEnabled: false }} />
        <Stack.Screen name="verification" options={{ headerShown: false }} />
        <Stack.Screen name="questions" options={{ headerShown: false }} />
        <Stack.Screen name="apply-stadium" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="team-details" options={{ headerShown: false }} />
        <Stack.Screen name="stadium-manager" options={{ headerShown: false }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

export default function StackLayout() {
  return (
    <AuthProvider>
      <RootLayout />
    </AuthProvider>
  );
}
