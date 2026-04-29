import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState } from 'react';
import { StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const roles: { [key: string]: { question: string; options: { name: string; description: string }[] } } = {
  Goalkeeper: {
    question: "What is your style in goal?",
    options: [
      { name: 'Alisson Becker', description: 'Calm, just gets it done quietly' },
      { name: 'Manuel Neuer', description: 'Plays like an outfield player honestly' },
      { name: 'Thibaut Courtois', description: 'Big saves when it matters most' },
    ],
  },
  Defender: {
    question: "What is your style in defense?",
    options: [
      { name: 'Virgil Van Dijk', description: 'Never panics, always in control' },
      { name: 'Trent Alexander-Arnold', description: 'More of an attacker from the back' },
      { name: 'Sergio Ramos', description: 'Will do whatever it takes to win' },
    ],
  },
  Midfielder: {
    question: "What is your role in midfield?",
    options: [
      { name: 'Sergio Busquets', description: 'Slows it down and picks the right pass' },
      { name: 'Kevin De Bruyne', description: 'The guy everyone wants in their team' },
      { name: "N'Golo Kante", description: 'Everywhere at once, never gets tired' },
      { name: 'Luka Modric', description: 'Makes it look easy when it really isnt' },
    ],
  },
  Forward: {
    question: "What is your attacking style?",
    options: [
      { name: 'Erling Haaland', description: 'In the box, ball, goal, simple' },
      { name: 'Kylian Mbappe', description: 'Just runs in behind, impossible to catch' },
      { name: 'Lionel Messi', description: 'Gets the ball and something always happens' },
      { name: 'Neymar Junior', description: 'Give him space and he will embarrass you' },
    ],
  },
}

const questions = [
  {
    question: "What is your main playing position?",
    options: ['Goalkeeper', 'Defender', 'Midfielder', 'Forward'],
    type: 'position',
  },
  {
    question: 'How would you rate your skill level?',
    options: ['Beginner', 'Intermediate', 'Advanced'],
    type: 'standard',
  },
  {
    question: 'How often do you usually play football?',
    options: ['Rarely', 'Sometimes', 'Weekly', 'Quite Often'],
    type: 'standard',
  },
  {
    question: 'What type of games do you prefer?',
    options: ['Casual', 'Competitive', 'Both'],
    type: 'standard',
  },
  {
    question: 'What days are you available to play?',
    options: ['Weekdays', 'Weekends', 'Both'],
    type: 'standard',
  },
  {
    question: 'Will be Set later!',
    options: ['Morning', 'Afternoon', 'Evening'],
    type: 'standard',
  },
  {
    question: 'How far are you willing to travel?',
    options: ['1 to 3 km', '5 km', '10+ km'],
    type: 'standard',
  },
  {
    question: 'Friends or new players?',
    options: ['Friends', 'New players', 'Both'],
    type: 'standard',
  },
  {
    question: "Main goal for using Ballers?",
    options: ['Staying Fit', 'Improve Abilities and Skills', 'Compete and Rank Up', 'Just Have Fun'],
    type: 'standard',
  },
];

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

  const handleNext = async () => {
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