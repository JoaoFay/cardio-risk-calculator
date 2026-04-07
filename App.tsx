import React, { useState } from 'react';
import { SafeAreaView, StatusBar, StyleSheet } from 'react-native';
import HomeScreen from './src/screens/HomeScreen';
import FormScreen from './src/screens/FormScreen';
import ResultScreen from './src/screens/ResultScreen';
import HemogramaFormScreen from './src/screens/HemogramaFormScreen';
import HemogramaResultScreen from './src/screens/HemogramaResultScreen';
import LipidogramaFormScreen from './src/screens/LipidogramaFormScreen';
import LipidogramaResultScreen from './src/screens/LipidogramaResultScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import HistoryDetailScreen from './src/screens/HistoryDetailScreen';
import { RiskResult, HemogramaResult, LipidogramaResult, PatientInput, HemogramaInput, LipidogramaInput, SavedExam } from './src/types';

type AppScreen =
  | { screen: 'home' }
  | { screen: 'cardio-form' }
  | { screen: 'cardio-result'; result: RiskResult; input: PatientInput }
  | { screen: 'hemograma-form' }
  | { screen: 'hemograma-result'; result: HemogramaResult; input: HemogramaInput }
  | { screen: 'lipidograma-form' }
  | { screen: 'lipidograma-result'; result: LipidogramaResult; input: LipidogramaInput }
  | { screen: 'history' }
  | { screen: 'history-detail'; exam: SavedExam };

export default function App() {
  const [nav, setNav] = useState<AppScreen>({ screen: 'home' });

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f5f5f5" />

      {nav.screen === 'home' && (
        <HomeScreen
          onSelectCardio={() => setNav({ screen: 'cardio-form' })}
          onSelectHemograma={() => setNav({ screen: 'hemograma-form' })}
          onSelectLipidograma={() => setNav({ screen: 'lipidograma-form' })}
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
