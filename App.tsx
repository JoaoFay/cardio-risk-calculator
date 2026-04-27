import React, { useState, useEffect, useCallback, useRef } from 'react';
import { StatusBar, StyleSheet, BackHandler } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import * as SplashScreen from 'expo-splash-screen';
import * as Sentry from '@sentry/react-native';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import OnboardingScreen from './src/screens/OnboardingScreen';
import HomeScreen from './src/screens/HomeScreen';
import FormScreen from './src/screens/FormScreen';
import ResultScreen from './src/screens/ResultScreen';
import HemogramaFormScreen from './src/screens/HemogramaFormScreen';
import HemogramaResultScreen from './src/screens/HemogramaResultScreen';
import LipidogramaFormScreen from './src/screens/LipidogramaFormScreen';
import LipidogramaResultScreen from './src/screens/LipidogramaResultScreen';
import MetabolicFormScreen from './src/screens/MetabolicFormScreen';
import MetabolicResultScreen from './src/screens/MetabolicResultScreen';
import TireoideFormScreen from './src/screens/TireoideFormScreen';
import TireoideResultScreen from './src/screens/TireoideResultScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import HistoryDetailScreen from './src/screens/HistoryDetailScreen';
import EditExamScreen from './src/screens/EditExamScreen';
import PremiumScreen from './src/screens/PremiumScreen';
import RemindersScreen from './src/screens/RemindersScreen';
import ExamPrepGuideScreen from './src/screens/ExamPrepGuideScreen';
import GlossaryScreen from './src/screens/GlossaryScreen';
import UpgradeModal from './src/components/UpgradeModal';
import { RiskResult, HemogramaResult, LipidogramaResult, MetabolicResult, TireoideResult, PatientInput, HemogramaInput, LipidogramaInput, MetabolicInput, TireoideInput, SavedExam, ExamType } from './src/types';
import { getTodayCount } from './src/storage/usageStorage';
import { isPremium } from './src/storage/premiumStorage';
import { getModuleFromNotificationData } from './src/services/notificationService';
import { getReminderByModule, updateReminder } from './src/storage/reminderStorage';
import { getLastExamByType } from './src/storage/examStorage';

Sentry.init({ dsn: process.env.EXPO_PUBLIC_SENTRY_DSN || '' });

SplashScreen.preventAutoHideAsync();

type AppScreen =
  | { screen: 'onboarding' }
  | { screen: 'home' }
  | { screen: 'cardio-form' }
  | { screen: 'cardio-result'; result: RiskResult; input: PatientInput }
  | { screen: 'hemograma-form' }
  | { screen: 'hemograma-result'; result: HemogramaResult; input: HemogramaInput }
  | { screen: 'lipidograma-form' }
  | { screen: 'lipidograma-result'; result: LipidogramaResult; input: LipidogramaInput }
  | { screen: 'metabolico-form' }
  | { screen: 'metabolico-result'; result: MetabolicResult; input: MetabolicInput }
  | { screen: 'tireoide-form' }
  | { screen: 'tireoide-result'; result: TireoideResult; input: TireoideInput }
  | { screen: 'history' }
  | { screen: 'history-detail'; exam: SavedExam }
  | { screen: 'edit-exam'; exam: SavedExam }
  | { screen: 'premium' }
  | { screen: 'reminders' }
  | { screen: 'exam-prep-guide' }
  | { screen: 'glossary' };

const MODULE_FORM_SCREEN: Record<ExamType, AppScreen['screen']> = {
  cardio: 'cardio-form',
  hemograma: 'hemograma-form',
  lipidograma: 'lipidograma-form',
  metabolico: 'metabolico-form',
  tireoide: 'tireoide-form',
};

const STALE_KEY = 'labia:stale_exams';

export default function App() {
  const [nav, setNav] = useState<AppScreen>({ screen: 'home' });
  const [appReady, setAppReady] = useState(false);
  const [staleExamIds, setStaleExamIds] = useState<Set<string>>(new Set());
  const [dailyCount, setDailyCount] = useState<number | undefined>(undefined);
  const [showHistoryUpgrade, setShowHistoryUpgrade] = useState(false);
  const notificationResponseListener = useRef<Notifications.EventSubscription | null>(null);

  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  const refreshHomeData = useCallback(async () => {
    const [count, premium] = await Promise.all([getTodayCount(), isPremium()]);
    setDailyCount(premium ? undefined : count);
  }, []);

  useEffect(() => {
    const init = async () => {
      const [onboarding, staleRaw] = await Promise.all([
        AsyncStorage.getItem('labia:onboarding_completed'),
        AsyncStorage.getItem(STALE_KEY),
      ]);
      if (onboarding !== 'true') {
        setNav({ screen: 'onboarding' });
      }
      if (staleRaw) {
        try {
          const ids: string[] = JSON.parse(staleRaw);
          setStaleExamIds(new Set(ids));
        } catch { /* ignore */ }
      }
      setAppReady(true);
    };
    init();
  }, []);

  useEffect(() => {
    if (nav.screen === 'home') {
      refreshHomeData();
    }
  }, [nav.screen, refreshHomeData]);

  async function markStale(id: string) {
    setStaleExamIds(prev => {
      const next = new Set(prev);
      next.add(id);
      AsyncStorage.setItem(STALE_KEY, JSON.stringify([...next]));
      return next;
    });
  }

  async function clearStale(id: string) {
    setStaleExamIds(prev => {
      const next = new Set(prev);
      next.delete(id);
      AsyncStorage.setItem(STALE_KEY, JSON.stringify([...next]));
      return next;
    });
  }

  useEffect(() => {
    if ((fontsLoaded || fontError) && appReady) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError, appReady]);

  // Handle hardware back button on Android
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      const currentScreen = nav.screen;
      
      // Allow default back behavior on onboarding (exit app)
      if (currentScreen === 'onboarding') {
        return false;
      }
      
      // Navigate back within app instead of exiting to home
      if (currentScreen.startsWith('edit-exam') || currentScreen.startsWith('history-detail')) {
        setNav({ screen: 'history' });
        return true;
      }
      
      if (currentScreen.endsWith('-result') || currentScreen.endsWith('-form')) {
        setNav({ screen: 'home' });
        return true;
      }
      
      if (currentScreen === 'history' || currentScreen === 'premium' || 
          currentScreen === 'reminders' || currentScreen === 'exam-prep-guide' || 
          currentScreen === 'glossary') {
        setNav({ screen: 'home' });
        return true;
      }
      
      return false;
    });
    
    return () => backHandler.remove();
  }, [nav.screen]);

  // StatusBar: hide on non-home screens to avoid overlap with back button
  const statusBarHidden = nav.screen !== 'home' && nav.screen !== 'onboarding';

  // Sync last exam dates into reminder configs so notifications are calculated correctly
  useEffect(() => {
    const syncLastExamDates = async () => {
      const moduleTypes: ExamType[] = ['cardio', 'hemograma', 'lipidograma', 'metabolico', 'tireoide'];
      await Promise.all(moduleTypes.map(async (moduleType) => {
        const lastExam = await getLastExamByType(moduleType);
        if (lastExam) {
          const config = await getReminderByModule(moduleType);
          if (config.lastExamDate !== lastExam.examDate) {
            await updateReminder(moduleType, { lastExamDate: lastExam.examDate });
          }
        }
      }));
    };
    syncLastExamDates();
  }, []);

  // Handle notification taps — navigate to the relevant module form
  useEffect(() => {
    notificationResponseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data as Record<string, unknown>;
      const moduleType = getModuleFromNotificationData(data);
      if (moduleType) {
        const targetScreen = MODULE_FORM_SCREEN[moduleType];
        setNav({ screen: targetScreen } as AppScreen);
      }
    });
    return () => {
      notificationResponseListener.current?.remove();
    };
  }, []);

  if ((!fontsLoaded && !fontError) || !appReady) return null;

  return (
    <SafeAreaProvider>
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" hidden={statusBarHidden} />

      {nav.screen === 'onboarding' && (
        <OnboardingScreen onComplete={() => setNav({ screen: 'home' })} />
      )}

      {nav.screen === 'home' && (
        <HomeScreen
          onSelectCardio={() => setNav({ screen: 'cardio-form' })}
          onSelectHemograma={() => setNav({ screen: 'hemograma-form' })}
          onSelectLipidograma={() => setNav({ screen: 'lipidograma-form' })}
          onSelectMetabolico={() => setNav({ screen: 'metabolico-form' })}
          onSelectTireoide={() => setNav({ screen: 'tireoide-form' })}
          onSelectHistory={() => setNav({ screen: 'history' })}
          onSelectPremium={() => setNav({ screen: 'premium' })}
          onSelectReminders={() => setNav({ screen: 'reminders' })}
          onSelectExamPrepGuide={() => setNav({ screen: 'exam-prep-guide' })}
          onSelectGlossary={() => setNav({ screen: 'glossary' })}
          dailyCount={dailyCount}
        />
      )}

      {nav.screen === 'cardio-form' && (
        <FormScreen
          onResult={(result, input) => setNav({ screen: 'cardio-result', result, input })}
          onBack={() => setNav({ screen: 'home' })}
          onGoToPremium={() => setNav({ screen: 'premium' })}
        />
      )}

      {nav.screen === 'cardio-result' && (
        <ResultScreen
          result={nav.result}
          input={nav.input}
          onBack={() => setNav({ screen: 'home' })}
          onGoToPremium={() => setNav({ screen: 'premium' })}
          onHistoryLimitReached={() => setShowHistoryUpgrade(true)}
        />
      )}

      {nav.screen === 'hemograma-form' && (
        <HemogramaFormScreen
          onResult={(result, input) => setNav({ screen: 'hemograma-result', result, input })}
          onBack={() => setNav({ screen: 'home' })}
          onGoToPremium={() => setNav({ screen: 'premium' })}
        />
      )}

      {nav.screen === 'hemograma-result' && (
        <HemogramaResultScreen
          result={nav.result}
          input={nav.input}
          onBack={() => setNav({ screen: 'home' })}
          onGoToPremium={() => setNav({ screen: 'premium' })}
          onHistoryLimitReached={() => setShowHistoryUpgrade(true)}
        />
      )}

      {nav.screen === 'lipidograma-form' && (
        <LipidogramaFormScreen
          onResult={(result, input) => setNav({ screen: 'lipidograma-result', result, input })}
          onBack={() => setNav({ screen: 'home' })}
          onGoToPremium={() => setNav({ screen: 'premium' })}
        />
      )}

      {nav.screen === 'lipidograma-result' && (
        <LipidogramaResultScreen
          result={nav.result}
          input={nav.input}
          onBack={() => setNav({ screen: 'home' })}
          onGoToPremium={() => setNav({ screen: 'premium' })}
          onHistoryLimitReached={() => setShowHistoryUpgrade(true)}
        />
      )}

      {nav.screen === 'metabolico-form' && (
        <MetabolicFormScreen
          onResult={(result, input) => setNav({ screen: 'metabolico-result', result, input })}
          onBack={() => setNav({ screen: 'home' })}
          onGoToPremium={() => setNav({ screen: 'premium' })}
        />
      )}

      {nav.screen === 'metabolico-result' && (
        <MetabolicResultScreen
          result={nav.result}
          input={nav.input}
          onBack={() => setNav({ screen: 'home' })}
          onGoToPremium={() => setNav({ screen: 'premium' })}
          onHistoryLimitReached={() => setShowHistoryUpgrade(true)}
        />
      )}

      {nav.screen === 'tireoide-form' && (
        <TireoideFormScreen
          onResult={(result, input) => setNav({ screen: 'tireoide-result', result, input })}
          onBack={() => setNav({ screen: 'home' })}
          onGoToPremium={() => setNav({ screen: 'premium' })}
        />
      )}

      {nav.screen === 'tireoide-result' && (
        <TireoideResultScreen
          result={nav.result}
          input={nav.input}
          onBack={() => setNav({ screen: 'home' })}
          onGoToPremium={() => setNav({ screen: 'premium' })}
          onHistoryLimitReached={() => setShowHistoryUpgrade(true)}
        />
      )}

      {nav.screen === 'history' && (
        <HistoryScreen
          onViewDetail={(exam) => setNav({ screen: 'history-detail', exam })}
          onEdit={(exam) => setNav({ screen: 'edit-exam', exam })}
          onBack={() => setNav({ screen: 'home' })}
          onGoToPremium={() => setNav({ screen: 'premium' })}
        />
      )}

      {nav.screen === 'history-detail' && (
        <HistoryDetailScreen
          exam={nav.exam}
          onBack={() => setNav({ screen: 'history' })}
          onEdit={(exam) => setNav({ screen: 'edit-exam', exam })}
          showStaleWarning={staleExamIds.has(nav.exam.id)}
          onRefresh={(updated) => setNav({ screen: 'history-detail', exam: updated })}
          onClearStale={clearStale}
        />
      )}

      {nav.screen === 'edit-exam' && (
        <EditExamScreen
          exam={nav.exam}
          onBack={() => setNav({ screen: 'history-detail', exam: nav.exam })}
          onSaved={(updated, isStale) => {
            if (isStale) {
              markStale(updated.id);
            } else {
              clearStale(updated.id);
            }
            setNav({ screen: 'history-detail', exam: updated });
          }}
        />
      )}

      {nav.screen === 'premium' && (
        <PremiumScreen onBack={() => setNav({ screen: 'home' })} />
      )}

      {nav.screen === 'reminders' && (
        <RemindersScreen onBack={() => setNav({ screen: 'home' })} />
      )}

      {nav.screen === 'exam-prep-guide' && (
        <ExamPrepGuideScreen onBack={() => setNav({ screen: 'home' })} />
      )}

      {nav.screen === 'glossary' && (
        <GlossaryScreen onBack={() => setNav({ screen: 'home' })} />
      )}

      <UpgradeModal
        visible={showHistoryUpgrade}
        onClose={() => setShowHistoryUpgrade(false)}
        onLearnMore={() => { setShowHistoryUpgrade(false); setNav({ screen: 'premium' }); }}
        reason="history"
      />
    </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A1628' },
});
