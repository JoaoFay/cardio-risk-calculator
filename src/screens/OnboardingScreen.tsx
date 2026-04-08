import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Dimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

const SLIDES = [
  {
    id: '1',
    icon: '🔬',
    title: 'Bem-vindo ao LabIA',
    text: 'Entenda seus exames de forma simples e educativa, com o apoio da inteligência artificial.',
    isDisclaimer: false,
  },
  {
    id: '2',
    icon: '🤖',
    title: 'IA como seu guia educativo',
    text: 'Insira os valores dos seus exames e receba uma explicação clara e personalizada sobre o que cada resultado significa para sua saúde.',
    isDisclaimer: false,
  },
  {
    id: '3',
    icon: '⚕️',
    title: 'Importante',
    text: 'O LabIA é um aplicativo educativo e não substitui a avaliação de um médico ou profissional de saúde. As interpretações geradas pela IA têm fins informativos apenas. Sempre consulte um profissional qualificado para diagnóstico e tratamento.',
    isDisclaimer: true,
  },
];

interface Props {
  onComplete: () => void;
}

export default function OnboardingScreen({ onComplete }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const isLastSlide = currentIndex === SLIDES.length - 1;

  function handleNext() {
    const nextIndex = currentIndex + 1;
    flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
    setCurrentIndex(nextIndex);
  }

  async function handleComplete() {
    await AsyncStorage.setItem('labia:onboarding_completed', 'true');
    onComplete();
  }

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={item => item.id}
        onMomentumScrollEnd={e => {
          const index = Math.round(e.nativeEvent.contentOffset.x / width);
          setCurrentIndex(index);
        }}
        renderItem={({ item }) => (
          <View style={styles.slide}>
            <Text style={styles.icon}>{item.icon}</Text>
            <Text style={styles.title}>{item.title}</Text>
            {item.isDisclaimer ? (
              <View style={styles.disclaimerBox}>
                <Text style={styles.disclaimerText}>{item.text}</Text>
              </View>
            ) : (
              <Text style={styles.text}>{item.text}</Text>
            )}
          </View>
        )}
      />

      <View style={styles.footer}>
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <View key={i} style={[styles.dot, i === currentIndex && styles.dotActive]} />
          ))}
        </View>

        <TouchableOpacity
          style={[styles.button, isLastSlide && styles.buttonLast]}
          onPress={isLastSlide ? handleComplete : handleNext}
          accessibilityLabel={isLastSlide ? 'Entendi e quero começar' : 'Próximo slide'}
          accessibilityRole="button"
        >
          <Text style={styles.buttonText}>
            {isLastSlide ? 'Entendi e quero começar' : 'Próximo  →'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  slide: {
    width,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 36,
    paddingBottom: 40,
  },
  icon: {
    fontSize: 72,
    marginBottom: 32,
  },
  title: {
    fontSize: 26,
    fontFamily: 'Inter_700Bold',
    color: '#2c3e50',
    textAlign: 'center',
    marginBottom: 20,
  },
  text: {
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    color: '#555',
    textAlign: 'center',
    lineHeight: 26,
  },
  disclaimerBox: {
    backgroundColor: '#fff8e1',
    borderLeftWidth: 4,
    borderLeftColor: '#f39c12',
    borderRadius: 8,
    padding: 16,
    width: '100%',
  },
  disclaimerText: {
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    color: '#7d5a00',
    lineHeight: 24,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 16,
    backgroundColor: '#fff',
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 24,
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ddd',
  },
  dotActive: {
    backgroundColor: '#2c3e50',
    width: 24,
  },
  button: {
    backgroundColor: '#2c3e50',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonLast: {
    backgroundColor: '#c0392b',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
  },
});
