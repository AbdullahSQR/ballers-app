import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { questions, roles } from '../lib/questions';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

// ─── Maps ─────────────────────────────────────────────────────────────────────

const POSITION_MAP: Record<string, string> = {
  Goalkeeper: 'GK',
  Defender:   'DEF',
  Midfielder: 'MID',
  Forward:    'ATT',
};

const SKILL_MAP: Record<string, string> = {
  Beginner:     'beginner',
  Intermediate: 'intermediate',
  Advanced:     'advanced',
};

// Alternative position options (labels shown to user)
const ALT_POSITIONS = ['Goalkeeper', 'Defender', 'Midfielder', 'Forward'];

// ─── Flow phases ──────────────────────────────────────────────────────────────
// position → playstyle → alt_position → questions (1-6) → location → submit

type Phase = 'position' | 'playstyle' | 'alt_position' | 'questions' | 'location';

// Total steps for progress bar:
// 1=position, 2=playstyle, 3=alt_position, 4-9=questions[1-6], 10=location
const TOTAL_STEPS = 10;

function stepNumber(phase: Phase, qIndex: number): number {
  if (phase === 'position')    return 1;
  if (phase === 'playstyle')   return 2;
  if (phase === 'alt_position') return 3;
  if (phase === 'questions')   return 3 + qIndex; // questions[0] is skipped (it's position)
  return TOTAL_STEPS; // location
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function QuestionsScreen() {
  const { refreshUser } = useAuth();

  // Phase tracking
  const [phase, setPhase]     = useState<Phase>('position');
  const [qIndex, setQIndex]   = useState(1); // starts at 1 because questions[0] is position

  // Answer storage
  const [primaryPos,   setPrimaryPos]   = useState('');
  const [playstyle,    setPlaystyle]    = useState('');
  const [altPos,       setAltPos]       = useState('');
  const [qAnswers,     setQAnswers]     = useState<string[]>([]); // answers for questions[1..6]

  // Current selection state
  const [selected, setSelected]         = useState<string | null>(null);

  // Location
  const [locationKnown,  setLocationKnown]  = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [coords, setCoords]             = useState<{ lat: number; lon: number } | null>(null);

  // Submit
  const [submitting, setSubmitting]     = useState(false);
  const [error, setError]               = useState('');

  // ── Derived ────────────────────────────────────────────────────────────────

  const step     = stepNumber(phase, qIndex);
  const progress = step / TOTAL_STEPS;

  const currentQuestion = phase === 'questions' ? questions[qIndex] : null;
  const isLastQuestion  = phase === 'questions' && qIndex === questions.length - 1;

  // ── Navigation helpers ─────────────────────────────────────────────────────

  const goBack = () => {
    setSelected(null);
    setError('');
    if (phase === 'playstyle')    { setPhase('position');    return; }
    if (phase === 'alt_position') { setPhase('playstyle');   return; }
    if (phase === 'questions') {
      if (qIndex === 1) { setPhase('alt_position'); return; }
      setQIndex(i => i - 1);
      setSelected(qAnswers[qAnswers.length - 1] ?? null);
      setQAnswers(a => a.slice(0, -1));
      return;
    }
    if (phase === 'location') { setPhase('questions'); setQIndex(questions.length - 1); }
  };

  const hasBack = phase !== 'position';

  // ── Location request ───────────────────────────────────────────────────────

  const requestLocation = async () => {
    setLocationLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Location Permission',
          'Location access was denied. You can still continue — matchmaking will work without it, but nearby stadiums will not be prioritised.',
          [{ text: 'Continue anyway', onPress: () => submitOnboarding() }],
        );
        return;
      }
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setCoords({ lat: loc.coords.latitude, lon: loc.coords.longitude });
      setLocationKnown(true);
    } catch {
      Alert.alert('Could not get location', 'Location unavailable. Continuing without it.', [
        { text: 'OK', onPress: () => submitOnboarding() },
      ]);
    } finally {
      setLocationLoading(false);
    }
  };

  // ── Submit ─────────────────────────────────────────────────────────────────

  const submitOnboarding = async (overrideCoords?: { lat: number; lon: number } | null) => {
    const finalCoords = overrideCoords !== undefined ? overrideCoords : coords;
    setSubmitting(true);
    setError('');
    try {
      // qAnswers = [skill_level, frequency, game_type, days, time, goals]
      await api.post('/users/me/onboarding', {
        position:             POSITION_MAP[primaryPos] ?? 'MID',
        alternative_position: altPos ? (POSITION_MAP[altPos] ?? undefined) : undefined,
        skill_level:          SKILL_MAP[qAnswers[0]] ?? 'beginner',
        playstyle,
        availability: {
          frequency: qAnswers[1],
          game_type: qAnswers[2],
          days:      qAnswers[3],
          time:      qAnswers[4],
        },
        goals:     qAnswers[5],
        latitude:  finalCoords?.lat ?? undefined,
        longitude: finalCoords?.lon ?? undefined,
      });
      await refreshUser();
      router.replace('/(tabs)');
    } catch {
      setError('Something went wrong. Please try again.');
      setSubmitting(false);
    }
  };

  // ── Advance ────────────────────────────────────────────────────────────────

  const handleNext = () => {
    if (!selected && phase !== 'location') return;

    if (phase === 'position') {
      setPrimaryPos(selected!);
      setSelected(null);
      setPhase('playstyle');
      return;
    }

    if (phase === 'playstyle') {
      setPlaystyle(selected!);
      setSelected(null);
      setPhase('alt_position');
      return;
    }

    if (phase === 'alt_position') {
      setAltPos(selected!);
      setSelected(null);
      setPhase('questions');
      setQIndex(1); // questions[0] is position — skip it
      return;
    }

    if (phase === 'questions') {
      const newAnswers = [...qAnswers, selected!];
      setQAnswers(newAnswers);
      setSelected(null);
      if (isLastQuestion) {
        setPhase('location');
      } else {
        setQIndex(i => i + 1);
      }
      return;
    }

    // phase === 'location' — handled by button in render
  };

  // ── Render helpers ─────────────────────────────────────────────────────────

  const renderOptions = (options: string[], withRadio = true) =>
    options.map(option => (
      <TouchableOpacity
        key={option}
        style={[styles.option, selected === option && styles.optionOn]}
        onPress={() => setSelected(option)}
      >
        <View style={styles.optionRow}>
          {withRadio && (
            <View style={[styles.radio, selected === option && styles.radioOn]} />
          )}
          <Text style={styles.optionText}>{option}</Text>
        </View>
      </TouchableOpacity>
    ));

  const renderRoleOptions = () => {
    const roleData = roles[primaryPos];
    if (!roleData) return null;
    return roleData.options.map(opt => (
      <TouchableOpacity
        key={opt.name}
        style={[styles.option, selected === opt.name && styles.optionOn]}
        onPress={() => setSelected(opt.name)}
      >
        <View style={styles.optionRow}>
          <View style={[styles.radio, selected === opt.name && styles.radioOn]} />
          <View style={{ flex: 1, gap: 3 }}>
            <Text style={styles.optionName}>{opt.name}</Text>
            <Text style={styles.optionDesc}>{opt.description}</Text>
          </View>
        </View>
      </TouchableOpacity>
    ));
  };

  // ── Current question text ──────────────────────────────────────────────────

  const questionText = () => {
    if (phase === 'position')    return questions[0].question;
    if (phase === 'playstyle')   return roles[primaryPos]?.question ?? '';
    if (phase === 'alt_position') return 'Pick your alternative position — used when your primary slot is full.';
    if (phase === 'questions')   return currentQuestion?.question ?? '';
    return 'Allow Ballers to access your location for better stadium and match recommendations.';
  };

  // ── Alt position options: exclude the chosen primary ──────────────────────
  const altPositionOptions = ALT_POSITIONS.filter(p => p !== primaryPos);

  // ── Location screen ────────────────────────────────────────────────────────

  const renderLocationScreen = () => (
    <View style={{ gap: 16 }}>
      <View style={[styles.option, { alignItems: 'center', paddingVertical: 28, gap: 14 }]}>
        <View style={styles.locationIcon}>
          <Ionicons name="location" size={32} color="#FFD700" />
        </View>
        <Text style={[styles.optionText, { textAlign: 'center', fontSize: 14, lineHeight: 22 }]}>
          Ballers uses your location to sort nearby stadiums and find matches closest to you.
          {'\n\n'}Your coordinates are stored securely and never shared publicly.
        </Text>
      </View>

      {locationKnown ? (
        <View style={[styles.option, styles.optionOn, { alignItems: 'center', gap: 6 }]}>
          <Ionicons name="checkmark-circle" size={22} color="#69db7c" />
          <Text style={[styles.optionText, { color: '#69db7c' }]}>Location saved!</Text>
        </View>
      ) : (
        <TouchableOpacity
          style={[styles.option, { alignItems: 'center', gap: 8, flexDirection: 'row', justifyContent: 'center' }]}
          onPress={requestLocation}
          disabled={locationLoading}
        >
          {locationLoading
            ? <ActivityIndicator color="white" size="small" />
            : <Ionicons name="locate-outline" size={20} color="white" />}
          <Text style={styles.optionText}>
            {locationLoading ? 'Getting location…' : 'Allow location access'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <LinearGradient colors={['#2a2a2a', '#000000']} style={styles.container}>
      <StatusBar barStyle="light-content" />

      <View style={styles.header}>
        {hasBack && !submitting && (
          <TouchableOpacity onPress={goBack}>
            <Text style={styles.back}>←</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.content}>
        <Text style={styles.main}>You're Almost There Baller!</Text>
        <Text style={styles.subtitle}>
          Answer a few questions to get the best experience on Ballers.
        </Text>

        {/* Progress */}
        <View style={styles.questionBox}>
          <View style={styles.progressBack}>
            <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
          </View>
          <Text style={styles.progressText}>{step}/{TOTAL_STEPS}</Text>
          <Text style={styles.questionText}>{questionText()}</Text>
        </View>

        {/* Options */}
        <View style={{ gap: 12 }}>
          {phase === 'position'    && renderOptions(questions[0].options)}
          {phase === 'playstyle'   && renderRoleOptions()}
          {phase === 'alt_position' && renderOptions(altPositionOptions)}
          {phase === 'questions'   && currentQuestion && renderOptions(currentQuestion.options)}
          {phase === 'location'    && renderLocationScreen()}
        </View>
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {/* Footer button */}
      <View style={styles.footer}>
        {phase === 'location' ? (
          // Location phase: show "Finish" button (enabled immediately, location optional)
          <TouchableOpacity
            style={[styles.next, submitting && { opacity: 0.3 }]}
            onPress={() => submitOnboarding()}
            disabled={submitting}
          >
            {submitting
              ? <ActivityIndicator color="white" size="small" />
              : <Text style={styles.nextText}>Finish</Text>}
          </TouchableOpacity>
        ) : (
          // All other phases: "→" enabled when something is selected
          <TouchableOpacity
            style={[styles.next, !selected && { opacity: 0.3 }]}
            onPress={handleNext}
            disabled={!selected || submitting}
          >
            <Text style={styles.nextText}>→</Text>
          </TouchableOpacity>
        )}
      </View>
    </LinearGradient>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container:    { flex: 1 },
  content:      { gap: 20, flex: 1, paddingHorizontal: 28 },
  header:       { height: 100, paddingHorizontal: 28, justifyContent: 'center', paddingTop: 60 },
  back:         { fontSize: 24, color: 'white' },
  main:         { color: 'white', fontSize: 28, letterSpacing: 1, fontWeight: '900' },
  subtitle:     { lineHeight: 22, fontSize: 14, color: '#666' },

  questionBox:  { borderColor: '#2e2e2e', borderRadius: 16, padding: 20, backgroundColor: 'rgba(255,255,255,0.1)', gap: 10, borderWidth: 1 },
  questionText: { lineHeight: 26, color: 'white', fontSize: 18, fontWeight: '700' },
  progressBack: { overflow: 'hidden', borderRadius: 3, height: 6, backgroundColor: 'rgba(255,255,255,0.15)' },
  progressFill: { borderRadius: 3, height: '100%', backgroundColor: 'white' },
  progressText: { textAlign: 'right', fontSize: 12, color: '#666' },

  option:       { borderColor: '#2e2e2e', padding: 16, borderRadius: 12, borderWidth: 1, backgroundColor: 'rgba(255,255,255,0.08)' },
  optionOn:     { borderColor: 'rgba(255,255,255,0.5)', backgroundColor: 'rgba(255,255,255,0.2)' },
  optionRow:    { gap: 12, flexDirection: 'row', alignItems: 'center' },
  optionText:   { fontWeight: '500', fontSize: 15, color: 'white', flex: 1 },
  optionName:   { fontWeight: '700', color: 'white', fontSize: 15 },
  optionDesc:   { fontSize: 12, color: '#888' },

  radio:        { borderRadius: 10, height: 20, borderWidth: 2, width: 20, borderColor: '#666' },
  radioOn:      { backgroundColor: 'white', borderColor: 'white' },

  locationIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(255,215,0,0.15)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,215,0,0.3)' },

  errorText:    { color: '#ff6b6b', fontSize: 13, textAlign: 'center', paddingHorizontal: 28, marginBottom: 8 },
  footer:       { paddingBottom: 50, alignItems: 'flex-end', paddingHorizontal: 28 },
  next:         { borderRadius: 28, width: 56, alignItems: 'center', height: 56, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)' },
  nextText:     { fontWeight: '700', fontSize: 16, color: 'white' },
});
