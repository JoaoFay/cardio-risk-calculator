import React, { useState, useEffect } from 'react';
import { SafeAreaView, StatusBar, StyleSheet } from 'react-native';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import * as SplashScreen from 'expo-splash-screen';
import * as Sentry from '@sentry/react-native';
import HomeScreen from './src/screens/HomeScreen';
import FormScreen from './src/screens/FormScreen';
import ResultScreen from './src/screens/ResultScreen';
import HemogramaFormScreen from './src/screens/HemogramaFormScreen';
import HemogramaResultScreen from './src/screens/HemogramaResultScreen';
import LipidogramaFormScreen from './src/screens/LipidogramaFormScreen';
import LipidogramaResultScreen from './src/screens/LipidogramaResultScreen';
import MetabolicFormScreen from './src/screens/MetabolicFormScreen';
import MetabolicResultScreen from './src/screens/MetabolicResultScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import HistoryDetailScreen from './src/screens/HistoryDetailScreen';
import { RiskResult, HemogramaResult, LipidogramaResult, MetabolicResult, PatientInput, HemogramaInput, LipidogramaInput, MetabolicInput, SavedExam } from './src/types';

Sentry.init({ dsn: process.env.EXPO_PUBLIC_SENTRY_DSN || '' });

SplashScreen.preventAutoHideAsync();

type AppScreen =
  | { screen: 'home' }
  | { screen: 'cardio-form' }
  | { screen: 'cardio-result'; result: RiskResult; input: PatientInput }
  | { screen: 'hemograma-form' }
  | { screen: 'hemograma-result'; result: HemogramaResult; input: HemogramaInput }
  | { screen: 'lipidograma-form' }
  | { screen: 'lipidograma-result'; result: LipidogramaResult; input: LipidogramaInput }
  | { screen: 'metabolico-form' }
  | { screen: 'metabolico-result'; result: MetabolicResult; input: MetabolicInput }
  | { screen: 'history' }
  | { screen: 'history-detail'; exam: SavedExam };

export default function App() {
  const [nav, setNav] = useState<AppScreen>({ screen: 'home' });

  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f5f5f5" />

      {nav.screen === 'home' && (
        <HomeScreen
          onSelectCardio={() => setNav({ screen: 'cardio-form' })}
          onSelectHemograma={() => setNav({ screen: 'hemograma-form' })}
          onSelectLipidograma={() => setNav({ screen: 'lipidograma-form' })}
          onSelectMetabolico={() => setNav({ screen: 'metabolico-form' })}
          onSelectHistory={() => setNav({ screen: 'history' })}
        />
      )}

      {nav.screen === 'cardio-form' && (
        <FormScreen
          onResult={(result, input) => setNav({ screen: 'cardio-result', result, input })}
          onBack={() => setNav({ screen: 'home' })}
        />
      )}

      {nav.screen === 'cardio-result' && (
        <ResultScreen
          result={nav.result}
          input={nav.input}
          onBack={() => setNav({ screen: 'home' })}
        />
      )}

      {nav.screen === 'hemograma-form' && (
        <HemogramaFormScreen
          onResult={(result, input) => setNav({ screen: 'hemograma-result', result, input })}
          onBack={() => setNav({ screen: 'home' })}
        />
      )}

      {nav.screen === 'hemograma-result' && (
        <HemogramaResultScreen
          result={nav.result}
          input={nav.input}
          onBack={() => setNav({ screen: 'home' })}
        />
      )}

      {nav.screen === 'lipidograma-form' && (
        <LipidogramaFormScreen
          onResult={(result, input) => setNav({ screen: 'lipidograma-result', result, input })}
          onBack={() => setNav({ screen: 'home' })}
        />
      )}

      {nav.screen === 'lipidograma-result' && (
        <LipidogramaResultScreen
          result={nav.result}
          input={nav.input}
          onBack={() => setNav({ screen: 'home' })}
        />
      )}

      {nav.screen === 'metabolico-form' && (
        <MetabolicFormScreen
          onResult={(result, input) => setNav({ screen: 'metabolico-result', result, input })}
          onBack={() => setNav({ screen: 'home' })}
        />
      )}

      {nav.screen === 'metabolico-result' && (
        <MetabolicResultScreen
          result={nav.result}
          input={nav.input}
          onBack={() => setNav({ screen: 'home' })}
        />
      )}

      {nav.screen === 'history' && (
        <HistoryScreen
          onViewDetail={(exam) => setNav({ screen: 'history-detail', exam })}
          onBack={() => setNav({ screen: 'home' })}
        />
      )}

      {nav.screen === 'history-detail' && (
        <HistoryDetailScreen
          exam={nav.exam}
          onBack={() => setNav({ screen: 'history' })}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
});
