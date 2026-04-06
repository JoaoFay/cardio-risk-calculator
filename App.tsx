import React, { useState } from 'react';
import { SafeAreaView, StatusBar, StyleSheet } from 'react-native';
import FormScreen from './src/screens/FormScreen';
import ResultScreen from './src/screens/ResultScreen';
import { RiskResult } from './src/types';

export default function App() {
  const [result, setResult] = useState<RiskResult | null>(null);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f5f5f5" />
      {result ? (
        <ResultScreen result={result} onBack={() => setResult(null)} />
      ) : (
        <FormScreen onResult={setResult} />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
});
