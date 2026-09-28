import { Stack } from 'expo-router';

export default function StadiumManagerLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
    </Stack>
  );
}
