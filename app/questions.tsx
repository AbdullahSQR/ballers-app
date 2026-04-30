import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState } from 'react';
import { StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { questions, roles } from '../lib/questions';

export default function QuestionsScreen() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [answers, setAnswers] = useState<string[]>([]);
  const [showNext, setShowNext] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState<string | null>(null);
  const [selectedNext, setSelectedNext] = useState<string | null>(null);

  const question = questions[currentQuestion];
  const isPosition = question.type === 'position';

  const current = showNext ? 2 : currentQuestion + 1;
  const progress = current / (questions.length + 1);

  const handleNext = () => {
    if (isPosition && !showNext) {
      if (!selectedAnswer) return;
      setSelectedPosition(selectedAnswer);
      const newAnswers = [...answers, selectedAnswer];
      setAnswers(newAnswers);
      setSelectedAnswer(null);
      setShowNext(true);
      return;
    }

    if (showNext) {
      if (!selectedNext) return;
      const newAnswers = [...answers, selectedNext];
      setAnswers(newAnswers);
      setSelectedNext(null);
      setShowNext(false);
      setCurrentQuestion(1);
      return;
    }

    if (!selectedAnswer) return;
    const newAnswers = [...answers, selectedAnswer];
    setAnswers(newAnswers);
    setSelectedAnswer(null);

    if (currentQuestion + 1 === questions.length) {
      router.push('/(tabs)' as any);
    } else {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const goBack = () => {
    if (showNext) {
      setShowNext(false);
      setSelectedNext(null);
      setCurrentQuestion(0);
      setAnswers(answers.slice(0, -1));
      return;
    }
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
      setSelectedAnswer(null);
    }
  };

  const isLast = !showNext && currentQuestion + 1 === questions.length;
  const hasBack = showNext || currentQuestion > 0;

  const nextData = selectedPosition ? roles[selectedPosition] : null;

  return (
    <LinearGradient colors={['#2a2a2a', '#000000']} style={styles.container}>
      <StatusBar barStyle="light-content" />

      <View style={styles.header}>
        {hasBack && (
          <TouchableOpacity onPress={goBack}>
            <Text style={styles.back}>←</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.content}>

        <Text style={styles.main}>You're Almost There Baller!</Text>
        <Text style={styles.subtitle}>
          You will now be asked a few questions to give you the best experience on the Ballers app.
        </Text>

        <View style={styles.questionBox}>
          <View style={styles.progressBack}>
            <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
          </View>
          <Text style={styles.progressText}>
            {current}/{questions.length + 1}
          </Text>
          <Text style={styles.questions}>
            {showNext ? nextData?.question : question.question}
          </Text>
        </View>

        <View style={{ gap: 12 }}>

          {showNext && nextData ? (
            nextData.options.map((option) => (
              <TouchableOpacity
                key={option.name}
                style={[
                  styles.options,
                  selectedNext === option.name && styles.optionChoose,
                ]}
                onPress={() => setSelectedNext(option.name)}
              >
                <View style={styles.optionRow}>
                  <View style={[
                    styles.moveOn,
                    selectedNext === option.name && styles.moveOnSelected,
                  ]} />
                  <View style={styles.optionBox}>
                    <Text style={styles.optionName}>{option.name}</Text>
                    <Text style={styles.optionDesc}>{option.description}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            question.options.map((option) => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.options,
                  selectedAnswer === option && styles.optionChoose,
                ]}
                onPress={() => setSelectedAnswer(option)}
              >
                <View style={styles.optionRow}>
                  <View style={[
                    styles.moveOn,
                    selectedAnswer === option && styles.moveOnSelected,
                  ]} />
                  <Text style={styles.optionText}>{option}</Text>
                </View>
              </TouchableOpacity>
            ))
          )}

        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.next, (showNext ? !selectedNext : !selectedAnswer) && { opacity: 0.3 }]}
          onPress={handleNext}
        >
          <Text style={styles.nextText}>
            {isLast ? 'Finish' : '→'}
          </Text>
        </TouchableOpacity>
      </View>

    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    gap: 20,
    flex: 1,
    paddingHorizontal: 28,
  },
  header: {
    height: 100,
    paddingHorizontal: 28,
    justifyContent: 'center',
    paddingTop: 60,
  },
  back: {
    fontSize: 24,
    color: 'white',
  },
  main: {
    color: 'white',
    fontSize: 28,
    letterSpacing: 1,
    fontWeight: '900',
  },
  subtitle: {
    lineHeight: 22,
    fontSize: 14,
    color: '#666',
  },
  questionBox: {
    borderColor: '#2e2e2e',
    borderRadius: 16,
    padding: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    gap: 10,
    borderWidth: 1,
  },
  questions: {
    lineHeight: 26,
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
  },
  progressBack: {
    overflow: 'hidden',
    borderRadius: 3,
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  progressFill: {
    borderRadius: 3,
    height: '100%',
    backgroundColor: 'white',
  },
  progressText: {
    textAlign: 'right',
    fontSize: 12,
    color: '#666',
  },
  options: {
    borderColor: '#2e2e2e',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  optionChoose: {
    borderColor: 'rgba(255,255,255,0.5)',
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  optionRow: {
    gap: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionText: {
    fontWeight: '500',
    fontSize: 15,
    color: 'white',
  },
  optionBox: {
    gap: 3,
    flex: 1,
  },
  optionName: {
    fontWeight: '700',
    color: 'white',
    fontSize: 15,
  },
  optionDesc: {
    fontSize: 12,
    color: '#888',
  },
  moveOn: {
    borderRadius: 10,
    height: 20,
    borderWidth: 2,
    width: 20,
    borderColor: '#666',
  },
  moveOnSelected: {
    backgroundColor: 'white',
    borderColor: 'white',
  },
  footer: {
    paddingBottom: 50,
    alignItems: 'flex-end',
    paddingHorizontal: 28,
  },
  next: {
    borderRadius: 28,
    width: 56,
    alignItems: 'center',
    height: 56,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  nextText: {
    fontWeight: '700',
    fontSize: 16,
    color: 'white',
  },
})