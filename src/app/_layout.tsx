import { BarlowCondensed_700Bold, BarlowCondensed_800ExtraBold_Italic } from '@expo-google-fonts/barlow-condensed';
import { BeVietnamPro_400Regular, BeVietnamPro_500Medium, BeVietnamPro_600SemiBold, BeVietnamPro_700Bold } from '@expo-google-fonts/be-vietnam-pro';
import { useFonts } from 'expo-font';
import { DarkTheme, Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StoreProvider } from '@/store';
import { colors, fonts } from '@/theme';

const theme = {
  ...DarkTheme,
  colors: { ...DarkTheme.colors, background: colors.bg, card: colors.bg, primary: colors.accent, text: colors.text, border: colors.border },
};

export default function RootLayout() {
  // keys are the family names used in theme.ts
  const [loaded, error] = useFonts({
    [fonts.display]: BarlowCondensed_800ExtraBold_Italic,
    [fonts.cond]: BarlowCondensed_700Bold,
    [fonts.body]: BeVietnamPro_400Regular,
    [fonts.medium]: BeVietnamPro_500Medium,
    [fonts.semi]: BeVietnamPro_600SemiBold,
    [fonts.bold]: BeVietnamPro_700Bold,
  });
  // a font that fails to load falls back to the system font rather than blocking the app
  if (!loaded && !error) return null;

  return (
    <StoreProvider>
      <ThemeProvider value={theme}>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerTintColor: colors.text,
            headerStyle: { backgroundColor: colors.bg },
            headerTitleStyle: { fontFamily: fonts.cond, fontSize: 19 },
            headerShadowVisible: false,
            contentStyle: { backgroundColor: colors.bg },
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="exercise/[id]" options={{ title: '', headerBackButtonDisplayMode: 'minimal' }} />
          <Stack.Screen name="program/[id]" options={{ title: '', headerBackButtonDisplayMode: 'minimal', headerTransparent: true, headerStyle: { backgroundColor: 'transparent' } }} />
          <Stack.Screen name="builder" options={{ title: '', headerBackButtonDisplayMode: 'minimal' }} />
          <Stack.Screen name="workout/[id]" options={{ headerShown: false, presentation: 'fullScreenModal', gestureEnabled: false }} />
        </Stack>
      </ThemeProvider>
    </StoreProvider>
  );
}
