import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import api from '@/lib/api';

// ─── Types ────────────────────────────────────────────────────────────────────

const STADIUM_TYPES = [
  { id: '5v5',  label: '5v5',  sub: 'Small-sided pitch' },
  { id: '7v7',  label: '7v7',  sub: 'Most popular format' },
  { id: '11v11',label: '11v11',sub: 'Full-size pitch' },
  { id: 'multi',label: 'Multi',sub: 'Multiple formats' },
];

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function ApplyStadiumScreen() {
  const { user } = useAuth();

  // ── Form fields ─────────────────────────────────────────────────────────────
  const [stadiumName,    setStadiumName]    = useState('');
  const [address,        setAddress]        = useState('');
  const [city,           setCity]           = useState('');
  const [phoneNumber,    setPhoneNumber]    = useState('');
  const [stadiumType,    setStadiumType]    = useState('');
  const [capacity,       setCapacity]       = useState('');
  const [facilities,     setFacilities]     = useState('');
  const [additionalInfo, setAdditionalInfo] = useState('');

  // ── UI state ─────────────────────────────────────────────────────────────────
  const [submitting, setSubmitting] = useState(false);
  const [submitted,  setSubmitted]  = useState(false);

  // ── Refs for focus chaining ───────────────────────────────────────────────────
  const addressRef    = useRef<TextInput>(null);
  const cityRef       = useRef<TextInput>(null);
  const phoneRef      = useRef<TextInput>(null);
  const capacityRef   = useRef<TextInput>(null);
  const facilitiesRef = useRef<TextInput>(null);
  const notesRef      = useRef<TextInput>(null);

  // ── Validation ────────────────────────────────────────────────────────────────

  function validate(): string | null {
    if (stadiumName.trim().length < 2)   return 'Stadium name must be at least 2 characters.';
    if (address.trim().length < 5)       return 'Please enter a full street address.';
    if (city.trim().length < 2)          return 'Please enter the city.';
    if (!stadiumType)                    return 'Please select the stadium type.';
    if (phoneNumber.trim().length < 7)   return 'Please enter a valid contact phone number.';
    return null;
  }

  // ── Submit ────────────────────────────────────────────────────────────────────

  async function handleSubmit() {
    // If not logged in, prompt to create an account first
    if (!user) {
      Alert.alert(
        'Account Required',
        'You need a Ballers account to submit an application. It only takes a minute to sign up!',
        [
          { text: 'Sign Up', onPress: () => router.push('/register' as any) },
          { text: 'Log In',  onPress: () => router.push('/signin'   as any) },
          { text: 'Cancel', style: 'cancel' },
        ],
      );
      return;
    }

    const err = validate();
    if (err) { Alert.alert('Missing info', err); return; }

    setSubmitting(true);
    try {
      const fullAddress = `${address.trim()}, ${city.trim()}`;

      // Build notes from optional extra fields
      const notesParts: string[] = [];
      if (capacity.trim())       notesParts.push(`Capacity: ${capacity.trim()}`);
      if (facilities.trim())     notesParts.push(`Facilities: ${facilities.trim()}`);
      if (additionalInfo.trim()) notesParts.push(`Additional info: ${additionalInfo.trim()}`);

      await api.post('/stadiums/apply', {
        stadium_name:     stadiumName.trim(),
        proposed_address: fullAddress,
        phone_number:     phoneNumber.trim(),
        stadium_type:     stadiumType,
        notes:            notesParts.length > 0 ? notesParts.join(' | ') : undefined,
      });

      setSubmitted(true);
    } catch (e: any) {
      const code = e?.response?.data?.code;
      if (code === 'APPLICATION_PENDING') {
        Alert.alert(
          'Application Already Submitted',
          'You already have a pending application. Our team will review it and contact you by email.',
        );
      } else {
        const msg = e?.response?.data?.message ?? e?.message ?? 'Something went wrong.';
        Alert.alert('Error', msg);
      }
    } finally {
      setSubmitting(false);
    }
  }

  // ── Success screen ────────────────────────────────────────────────────────────

  if (submitted) {
    return (
      <LinearGradient colors={['#1a1a1a', '#000000']} style={styles.successContainer}>
        <StatusBar barStyle="light-content" />
        <View style={styles.successContent}>
          <View style={styles.successIconWrap}>
            <Ionicons name="checkmark-circle" size={72} color="#FFD700" />
          </View>
          <Text style={styles.successTitle}>Application Submitted!</Text>
          <Text style={styles.successBody}>
            Thank you for applying to manage a stadium on Ballers. Our team will carefully
            review your application and get back to you{' '}
            <Text style={{ color: '#FFD700', fontWeight: '700' }}>within one week</Text> via
            the email address linked to your account.
          </Text>

          <View style={styles.successNote}>
            <Ionicons name="mail-outline" size={18} color="#FFD700" />
            <Text style={styles.successNoteText}>
              Keep an eye on your inbox — including your spam folder.
            </Text>
          </View>

          <TouchableOpacity style={styles.doneBtn} onPress={() => router.back()}>
            <Text style={styles.doneBtnText}>Back to Home</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  }

  // ── Form ──────────────────────────────────────────────────────────────────────

  return (
    <LinearGradient colors={['#1a1a1a', '#000000']} style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="white" />
        </TouchableOpacity>
        <Text style={styles.topTitle}>Stadium Application</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >

          {/* Intro */}
          <View style={styles.introBox}>
            <View style={styles.introIconWrap}>
              <Ionicons name="business" size={28} color="#FFD700" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.introTitle}>Become a Stadium Partner</Text>
              <Text style={styles.introSub}>
                List your venue on Ballers and connect with hundreds of players looking to book a pitch.
              </Text>
            </View>
          </View>

          {/* ── Section 1: Stadium Info ── */}
          <SectionHeader icon="business-outline" title="Stadium Details" />

          <Field label="Stadium Name *" hint="The public name players will see">
            <TextInput
              style={styles.input}
              placeholder="e.g. Al Arouba Sports Complex"
              placeholderTextColor="#444"
              value={stadiumName}
              onChangeText={setStadiumName}
              returnKeyType="next"
              onSubmitEditing={() => addressRef.current?.focus()}
            />
          </Field>

          <Field label="Street Address *" hint="Full address including street and area">
            <TextInput
              ref={addressRef}
              style={styles.input}
              placeholder="e.g. 12 Sultan Qaboos St, Madinat Al-Irfan"
              placeholderTextColor="#444"
              value={address}
              onChangeText={setAddress}
              returnKeyType="next"
              onSubmitEditing={() => cityRef.current?.focus()}
            />
          </Field>

          <Field label="City / Governorate *">
            <TextInput
              ref={cityRef}
              style={styles.input}
              placeholder="e.g. Muscat"
              placeholderTextColor="#444"
              value={city}
              onChangeText={setCity}
              returnKeyType="next"
              onSubmitEditing={() => phoneRef.current?.focus()}
            />
          </Field>

          {/* ── Section 2: Pitch Type ── */}
          <SectionHeader icon="football-outline" title="Pitch Format *" />
          <Text style={styles.typeHint}>Select the format your stadium primarily supports</Text>

          <View style={styles.typeGrid}>
            {STADIUM_TYPES.map(t => {
              const selected = stadiumType === t.id;
              return (
                <TouchableOpacity
                  key={t.id}
                  style={[styles.typeChip, selected && styles.typeChipOn]}
                  onPress={() => setStadiumType(t.id)}
                >
                  <Text style={[styles.typeChipLabel, selected && styles.typeChipLabelOn]}>
                    {t.label}
                  </Text>
                  <Text style={[styles.typeChipSub, selected && { color: '#FFD700' }]}>
                    {t.sub}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* ── Section 3: Contact ── */}
          <SectionHeader icon="call-outline" title="Contact Information" />

          <Field label="Phone Number *" hint="We'll use this to reach you about your application">
            <TextInput
              ref={phoneRef}
              style={styles.input}
              placeholder="e.g. +968 9123 4567"
              placeholderTextColor="#444"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              keyboardType="phone-pad"
              returnKeyType="next"
              onSubmitEditing={() => capacityRef.current?.focus()}
            />
          </Field>

          {/* ── Section 4: Venue Details ── */}
          <SectionHeader icon="list-outline" title="Venue Details" />
          <Text style={styles.sectionNote}>Optional — helps us understand your stadium better</Text>

          <Field label="Player Capacity" hint="How many players can use the stadium at once?">
            <TextInput
              ref={capacityRef}
              style={styles.input}
              placeholder="e.g. 22"
              placeholderTextColor="#444"
              value={capacity}
              onChangeText={setCapacity}
              keyboardType="numeric"
              returnKeyType="next"
              onSubmitEditing={() => facilitiesRef.current?.focus()}
            />
          </Field>

          <Field label="Facilities Available" hint="e.g. Floodlights, changing rooms, parking, café">
            <TextInput
              ref={facilitiesRef}
              style={[styles.input, styles.textArea]}
              placeholder="Describe the facilities your stadium offers..."
              placeholderTextColor="#444"
              value={facilities}
              onChangeText={setFacilities}
              multiline
              numberOfLines={3}
              returnKeyType="next"
              onSubmitEditing={() => notesRef.current?.focus()}
            />
          </Field>

          {/* ── Section 5: Additional Info ── */}
          <SectionHeader icon="chatbubble-outline" title="Anything Else?" />

          <Field label="Additional Information" hint="Opening hours, pricing expectations, special notes...">
            <TextInput
              ref={notesRef}
              style={[styles.input, styles.textArea]}
              placeholder="Share anything else you'd like us to know about your stadium..."
              placeholderTextColor="#444"
              value={additionalInfo}
              onChangeText={setAdditionalInfo}
              multiline
              numberOfLines={4}
            />
          </Field>

          {/* What happens next */}
          <View style={styles.nextStepsBox}>
            <Text style={styles.nextStepsTitle}>What happens next?</Text>
            <Step icon="mail-outline"    text="You'll receive a confirmation email immediately after submitting." />
            <Step icon="search-outline"  text="Our team reviews your application within one week." />
            <Step icon="checkmark-outline" text="If approved, your stadium goes live and players can start booking." />
          </View>

          {/* Submit */}
          <TouchableOpacity
            style={[styles.submitBtn, submitting && { opacity: 0.6 }]}
            onPress={handleSubmit}
            disabled={submitting}
            activeOpacity={0.85}
          >
            {submitting
              ? <ActivityIndicator color="#000" />
              : <Text style={styles.submitText}>Submit Application</Text>}
          </TouchableOpacity>

          <Text style={styles.footerNote}>
            * Required fields. By submitting you agree that the information provided is accurate.
          </Text>

        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionHeader({ icon, title }: { icon: string; title: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Ionicons name={icon as any} size={16} color="#FFD700" />
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
}

function Field({
  label, hint, children,
}: {
  label: string; hint?: string; children: React.ReactNode;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {hint && <Text style={styles.fieldHint}>{hint}</Text>}
      {children}
    </View>
  );
}

function Step({ icon, text }: { icon: string; text: string }) {
  return (
    <View style={styles.step}>
      <View style={styles.stepIconWrap}>
        <Ionicons name={icon as any} size={14} color="#FFD700" />
      </View>
      <Text style={styles.stepText}>{text}</Text>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container:        { flex: 1 },
  successContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 28 },
  successContent:   { alignItems: 'center', gap: 18 },
  successIconWrap:  { width: 110, height: 110, borderRadius: 55, backgroundColor: 'rgba(255,215,0,0.1)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,215,0,0.3)' },
  successTitle:     { fontSize: 26, fontWeight: '900', color: 'white', textAlign: 'center' },
  successBody:      { fontSize: 15, color: '#aaa', textAlign: 'center', lineHeight: 24 },
  successNote:      { flexDirection: 'row', gap: 10, alignItems: 'flex-start', backgroundColor: 'rgba(255,215,0,0.07)', borderWidth: 1, borderColor: 'rgba(255,215,0,0.2)', borderRadius: 14, padding: 14 },
  successNoteText:  { color: '#ccc', fontSize: 13, flex: 1, lineHeight: 19 },
  doneBtn:          { marginTop: 8, paddingHorizontal: 40, paddingVertical: 16, borderRadius: 16, backgroundColor: '#FFD700' },
  doneBtnText:      { color: '#000', fontWeight: '800', fontSize: 16 },

  topBar:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 60, paddingHorizontal: 20, paddingBottom: 12 },
  backBtn:     { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.08)' },
  topTitle:    { color: 'white', fontWeight: '800', fontSize: 17 },

  scroll: { paddingHorizontal: 22, paddingBottom: 60, gap: 14 },

  introBox:      { flexDirection: 'row', gap: 14, alignItems: 'flex-start', backgroundColor: 'rgba(255,215,0,0.07)', borderWidth: 1, borderColor: 'rgba(255,215,0,0.2)', borderRadius: 18, padding: 18 },
  introIconWrap: { width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(255,215,0,0.1)', justifyContent: 'center', alignItems: 'center' },
  introTitle:    { color: 'white', fontWeight: '800', fontSize: 16, marginBottom: 5 },
  introSub:      { color: '#aaa', fontSize: 12, lineHeight: 18 },

  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  sectionTitle:  { color: 'white', fontWeight: '800', fontSize: 14, letterSpacing: 0.2 },
  sectionNote:   { color: '#555', fontSize: 11, marginTop: -8 },
  typeHint:      { color: '#555', fontSize: 11, marginTop: -8 },

  field:      { gap: 5 },
  fieldLabel: { color: '#ccc', fontWeight: '700', fontSize: 13 },
  fieldHint:  { color: '#555', fontSize: 11 },
  input: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 13,
    color: 'white',
    fontSize: 14,
  },
  textArea: { minHeight: 80, textAlignVertical: 'top', paddingTop: 13 },

  typeGrid:       { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  typeChip: {
    flex: 1, minWidth: '45%', padding: 14, borderRadius: 14, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    gap: 3, alignItems: 'center',
  },
  typeChipOn:       { borderColor: 'rgba(255,215,0,0.6)', backgroundColor: 'rgba(255,215,0,0.1)' },
  typeChipLabel:    { color: '#aaa', fontWeight: '800', fontSize: 16 },
  typeChipLabelOn:  { color: '#FFD700' },
  typeChipSub:      { color: '#555', fontSize: 11 },

  nextStepsBox:   { backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 18, padding: 18, gap: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', marginTop: 8 },
  nextStepsTitle: { color: 'white', fontWeight: '800', fontSize: 14, marginBottom: 2 },
  step:           { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  stepIconWrap:   { width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(255,215,0,0.1)', justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  stepText:       { color: '#999', fontSize: 13, lineHeight: 19, flex: 1 },

  submitBtn:    { backgroundColor: '#FFD700', borderRadius: 16, paddingVertical: 17, alignItems: 'center', marginTop: 8 },
  submitText:   { color: '#000', fontWeight: '800', fontSize: 16 },
  footerNote:   { color: '#444', fontSize: 11, textAlign: 'center', lineHeight: 17 },
});
