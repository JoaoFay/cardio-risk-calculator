import React, { useState } from 'react';
import { SafeAreaView, StatusBar, StyleSheet } from 'react-native';
import HomeScreen from './src/screens/HomeScreen';
import FormScreen from './src/screens/FormScreen';
import ResultScreen from './src/screens/ResultScreen';
import HemogramaFormScreen from './src/screens/HemogramaFormScreen';
import HemogramaResultScreen from './src/screens/HemogramaResultScreen';
import { RiskResult, HemogramaResult } from './src/types';

type AppScreen =
  | { screen: 'home' }
  | { screen: 'cardio-form' }
  | { screen: 'cardio-result'; result: RiskResult }
  | { screen: 'hemograma-form' }
  | { screen: 'hemograma-result'; result: HemogramaResult };

export default function App() {
  const [nav, setNav] = useState<AppScreen>({ screen: 'home' });

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f5f5f5" />

      {nav.screen === 'home' && (
        <HomeScreen
          onSelectCardio={() => setNav({ screen: 'cardio-form' })}
          onSelectHemograma={() => setNav({ screen: 'hemograma-form' })}
        />
      )}

      {nav.screen === 'cardio-form' && (
        <FormScreen
          onResult={(result) => setNav({ screen: 'cardio-result', result })}
          onBack={() => setNav({ screen: 'home' })}
        />
      )}

      {nav.screen === 'cardio-result' && (
        <ResultScreen
          result={nav.result}
          onBack={() => setNav({ screen: 'home' })}
        />
      )}

      {nav.screen === 'hemograma-form' && (
        <HemogramaFormScreen
          onResult={(result) => setNav({ screen: 'hemograma-result', result })}
          onBack={() => setNav({ screen: 'home' })}
        />
      )}

      {nav.screen === 'hemograma-result' && (
        <HemogramaResultScreen
          result={nav.result}
          onBack={() => setNav({ screen: 'home' })}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
});
