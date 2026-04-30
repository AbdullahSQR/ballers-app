import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

const BASE_PLAYERS = 14;
const MAX_SUBS = 4;

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function generateDates() {
  const dates: Date[] = [];
  const today = new Date();
  for (let i = 1; i <= 14; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    dates.push(d);
  }
  return dates;
}

export default function CreateScreen() {
  const dates = useMemo(() => generateDates(), []);

  const [matchType, setMatchType] = useState<'Casual' | 'Competitive'>('Casual');
  const [extraSubs, setExtraSubs] = useState(0);
  const [selectedDate, setSelectedDate] = useState(dates[0]);
  const [inviteInput, setInviteInput] = useState('');
  const [invitedPlayers, setInvitedPlayers] = useState<string[]>([]);
  const [fillFromApp, setFillFromApp] = useState(false);
  const [created, setCreated] = useState(false);

  const totalSlots = BASE_PLAYERS + extraSubs;

  const addPlayer = () => {
    const name = inviteInput.trim();
    if (!name || invitedPlayers.includes(name)) return;
    if (invitedPlayers.length >= totalSlots) return;
    setInvitedPlayers([...invitedPlayers, name]);
    setInviteInput('');
  };

  const removePlayer = (name: string) => {
    setInvitedPlayers(invitedPlayers.filter((p) => p !== name));
  };

  const spotsLeft = totalSlots - invitedPlayers.length;

  const handleCreate = () => setCreated(true);

  const handleReset = () => {
    setCreated(false);
    setMatchType('Casual');
    setExtraSubs(0);
    setSelectedDate(dates[0]);
    setInvitedPlayers([]);
    setFillFromApp(false);
  };

  if (created) {
    return (
      <LinearGradient colors={['#2a2a2a', '#000000']} style={styles.container}>
        <StatusBar barStyle="light-content" />
        <View style={styles.successWrap}>
          <View style={styles.successIcon}>
            <Ionicons name="checkmark" size={44} color="white" />
          </View>
          <Text style={styles.successTitle}>Match Created!</Text>
          <Text style={styles.successSub}>
            Your {matchType.toLowerCase()} 7v7 match is set for{' '}
            {DAY_NAMES[selectedDate.getDay()]}, {MONTH_NAMES[selectedDate.getMonth()]} {selectedDate.getDate()}.
            {invitedPlayers.length > 0
              ? `\n${invitedPlayers.length} player${invitedPlayers.length > 1 ? 's' : ''} invited.`
              : ''}
            {extraSubs > 0 ? `\n${extraSubs} substitute slot${extraSubs > 1 ? 's' : ''} added.` : ''}
            {fillFromApp ? '\nOpen spots will be filled from the community.' : ''}
          </Text>
          <TouchableOpacity style={styles.successBtn} onPress={handleReset}>
            <Text style={styles.successBtnText}>Create Another</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.replace('/(tabs)')}>
            <Text style={styles.goHomeText}>Back to Home</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#2a2a2a', '#000000']} style={styles.container}>
      <StatusBar barStyle="light-content" />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >

          <View style={styles.header}>
            <Text style={styles.headTitle}>Create a Match</Text>
            <Text style={styles.headSub}>Invite your people, fill the rest from the app.</Text>
          </View>

          {/* Match Type */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Match Type</Text>
            <View style={styles.toggle}>
              {(['Casual', 'Competitive'] as const).map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[styles.toggleBtn, matchType === t && styles.toggleOn]}
                  onPress={() => setMatchType(t)}
                >
                  <Ionicons
                    name={t === 'Casual' ? 'football-outline' : 'trophy-outline'}
                    size={15}
                    color={matchType === t ? 'white' : '#666'}
                  />
                  <Text style={[styles.toggleText, matchType === t && styles.toggleTextOn]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Format — fixed 7v7 */}
          <View style={styles.formatCard}>
            <View style={styles.formatLeft}>
              <Ionicons name="football-outline" size={20} color="white" />
              <View style={{ gap: 2 }}>
                <Text style={styles.formatLabel}>7v7 — 14 players</Text>
                <Text style={styles.formatSub}>Standard format for all matches on Ballers.</Text>
              </View>
            </View>
          </View>

          {/* Substitute slots */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Substitute Slots</Text>
            <View style={styles.subsCard}>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={styles.subsTitle}>Extra players beyond 14</Text>
                <Text style={styles.subsSub}>
                  {extraSubs === 0
                    ? 'No substitutes — tap + to add up to 4 extra spots.'
                    : `${extraSubs} sub slot${extraSubs > 1 ? 's' : ''} · ${totalSlots} total players`}
                </Text>
              </View>
              <View style={styles.subsCounter}>
                <TouchableOpacity
                  style={[styles.counterBtn, extraSubs === 0 && { opacity: 0.3 }]}
                  onPress={() => setExtraSubs((s) => Math.max(0, s - 1))}
                  disabled={extraSubs === 0}
                >
                  <Ionicons name="remove" size={18} color="white" />
                </TouchableOpacity>
                <Text style={styles.counterVal}>{extraSubs}</Text>
                <TouchableOpacity
                  style={[styles.counterBtn, extraSubs === MAX_SUBS && { opacity: 0.3 }]}
                  onPress={() => setExtraSubs((s) => Math.min(MAX_SUBS, s + 1))}
                  disabled={extraSubs === MAX_SUBS}
                >
                  <Ionicons name="add" size={18} color="white" />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Location */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Venue</Text>
            <View style={styles.comingSoonCard}>
              <Ionicons name="location-outline" size={20} color="#555" />
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={styles.comingSoonTitle}>Venue selection coming soon</Text>
                <Text style={styles.comingSoonSub}>We'll show available venues and their schedules once they're set up.</Text>
              </View>
            </View>
          </View>

          {/* Date */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Date</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dateRow}>
              {dates.map((d, i) => {
                const isSelected = d.toDateString() === selectedDate.toDateString();
                return (
                  <TouchableOpacity
                    key={i}
                    style={[styles.dateChip, isSelected && styles.dateChipOn]}
                    onPress={() => setSelectedDate(d)}
                  >
                    <Text style={[styles.dateDayName, isSelected && styles.dateDayNameOn]}>
                      {DAY_NAMES[d.getDay()]}
                    </Text>
                    <Text style={[styles.dateNum, isSelected && styles.dateNumOn]}>
                      {d.getDate()}
                    </Text>
                    <Text style={[styles.dateMon, isSelected && { color: '#bbb' }]}>
                      {MONTH_NAMES[d.getMonth()]}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Time */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Time Slot</Text>
            <View style={styles.comingSoonCard}>
              <Ionicons name="time-outline" size={20} color="#555" />
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={styles.comingSoonTitle}>Available slots shown after venue selection</Text>
                <Text style={styles.comingSoonSub}>Time slots will match the chosen venue's open schedule.</Text>
              </View>
            </View>
          </View>

          {/* Invite Players */}
          <View style={styles.section}>
            <View style={styles.sectionRow}>
              <Text style={styles.sectionLabel}>Invite Players</Text>
              <Text style={styles.sectionCount}>
                {invitedPlayers.length}/{totalSlots}
              </Text>
            </View>

            <View style={styles.inviteInputWrap}>
              <Ionicons name="person-add-outline" size={18} color="#666" />
              <TextInput
                style={styles.inviteInput}
                placeholder="Enter username"
                placeholderTextColor="#555"
                value={inviteInput}
                onChangeText={setInviteInput}
                onSubmitEditing={addPlayer}
                returnKeyType="done"
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={[styles.addBtn, !inviteInput.trim() && { opacity: 0.3 }]}
                onPress={addPlayer}
                disabled={!inviteInput.trim()}
              >
                <Text style={styles.addBtnText}>Add</Text>
              </TouchableOpacity>
            </View>

            {invitedPlayers.length > 0 && (
              <View style={styles.playerList}>
                {invitedPlayers.map((name, i) => (
                  <View key={name} style={styles.playerRow}>
                    <View style={styles.playerAvatar}>
                      <Ionicons name="person" size={15} color="white" />
                    </View>
                    <Text style={styles.playerName}>{name}</Text>
                    <TouchableOpacity onPress={() => removePlayer(name)} style={styles.removeBtn}>
                      <Ionicons name="close" size={16} color="#666" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            {invitedPlayers.length === 0 && (
              <Text style={styles.inviteHint}>Add players by their username to send them an invite.</Text>
            )}
          </View>

          {/* Fill from app toggle */}
          <View style={styles.fillCard}>
            <View style={styles.fillLeft}>
              <Ionicons name="people-outline" size={20} color={fillFromApp ? 'white' : '#555'} />
              <View style={{ flex: 1, gap: 3 }}>
                <Text style={[styles.fillTitle, fillFromApp && { color: 'white' }]}>
                  Fill remaining spots from the community
                </Text>
                <Text style={styles.fillSub}>
                  {spotsLeft > 0
                    ? `${spotsLeft} open spot${spotsLeft > 1 ? 's' : ''} — ballers on the app can request to join.`
                    : 'Your squad is full, no open spots.'}
                </Text>
              </View>
            </View>
            <Switch
              value={fillFromApp}
              onValueChange={setFillFromApp}
              trackColor={{ false: 'rgba(255,255,255,0.1)', true: 'rgba(255,255,255,0.4)' }}
              thumbColor={fillFromApp ? 'white' : '#555'}
              disabled={spotsLeft === 0}
            />
          </View>

          {/* Summary */}
          <View style={styles.summary}>
            <View style={styles.summaryRow}>
              <Ionicons name="football-outline" size={14} color="#555" />
              <Text style={styles.summaryText}>
                {matchType} · 7v7 {extraSubs > 0 ? `+${extraSubs} sub${extraSubs > 1 ? 's' : ''}` : ''}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Ionicons name="calendar-outline" size={14} color="#555" />
              <Text style={styles.summaryText}>
                {DAY_NAMES[selectedDate.getDay()]}, {MONTH_NAMES[selectedDate.getMonth()]} {selectedDate.getDate()}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Ionicons name="people-outline" size={14} color="#555" />
              <Text style={styles.summaryText}>
                {invitedPlayers.length}/{totalSlots} invited · {spotsLeft} spot{spotsLeft !== 1 ? 's' : ''} open
              </Text>
            </View>
          </View>

          <TouchableOpacity style={styles.createBtn} onPress={handleCreate}>
            <Ionicons name="flash" size={20} color="black" />
            <Text style={styles.createText}>Create Match</Text>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: {
    paddingTop: 65,
    paddingHorizontal: 22,
    paddingBottom: 120,
    gap: 22,
  },
  header: { gap: 4 },
  headTitle: {
    fontWeight: '900',
    fontSize: 26,
    color: 'white',
    letterSpacing: 0.3,
  },
  headSub: { color: '#888', fontSize: 13, fontWeight: '500' },
  section: { gap: 10 },
  sectionLabel: {
    fontWeight: '700',
    fontSize: 13,
    color: '#aaa',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionCount: {
    fontWeight: '700',
    fontSize: 13,
    color: '#666',
  },
  toggle: {
    flexDirection: 'row',
    gap: 4,
    borderRadius: 14,
    padding: 4,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  toggleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 11,
    borderRadius: 10,
  },
  toggleOn: { backgroundColor: 'rgba(255,255,255,0.15)' },
  toggleText: { fontWeight: '600', color: '#666', fontSize: 14 },
  toggleTextOn: { color: 'white', fontWeight: '700' },
  formatCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderColor: 'rgba(255,255,255,0.15)',
  },
  formatLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  formatLabel: { fontWeight: '800', color: 'white', fontSize: 15 },
  formatSub: { color: '#555', fontSize: 12 },
  subsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderColor: 'rgba(255,255,255,0.1)',
  },
  subsTitle: { fontWeight: '700', color: 'white', fontSize: 14 },
  subsSub: { color: '#555', fontSize: 12, lineHeight: 17 },
  subsCounter: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  counterBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  counterVal: { fontWeight: '800', color: 'white', fontSize: 18, minWidth: 16, textAlign: 'center' },
  comingSoonCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderStyle: 'dashed',
  },
  comingSoonTitle: { color: '#666', fontSize: 13, fontWeight: '600' },
  comingSoonSub: { color: '#444', fontSize: 11, lineHeight: 16 },
  dateRow: {
    gap: 8,
    paddingRight: 8,
  },
  dateChip: {
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    gap: 2,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.06)',
    minWidth: 56,
  },
  dateChipOn: {
    borderColor: 'rgba(255,255,255,0.45)',
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  dateDayName: { fontSize: 11, color: '#555', fontWeight: '600' },
  dateDayNameOn: { color: '#bbb' },
  dateNum: { fontSize: 18, fontWeight: '800', color: '#555' },
  dateNumOn: { color: 'white' },
  dateMon: { fontSize: 10, color: '#444', fontWeight: '500' },
  inviteInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderColor: 'rgba(255,255,255,0.1)',
  },
  inviteInput: { flex: 1, color: 'white', fontSize: 15 },
  addBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  addBtnText: { color: 'white', fontWeight: '700', fontSize: 13 },
  playerList: { gap: 8 },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderColor: 'rgba(255,255,255,0.08)',
  },
  playerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playerName: { flex: 1, color: 'white', fontWeight: '600', fontSize: 14 },
  removeBtn: { padding: 4 },
  inviteHint: { color: '#444', fontSize: 12, fontWeight: '500' },
  fillCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderColor: 'rgba(255,255,255,0.1)',
  },
  fillLeft: { flex: 1, flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  fillTitle: { fontSize: 14, fontWeight: '700', color: '#666' },
  fillSub: { fontSize: 11, color: '#444', lineHeight: 16 },
  summary: {
    borderRadius: 14,
    padding: 14,
    gap: 8,
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderColor: 'rgba(255,255,255,0.08)',
  },
  summaryRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  summaryText: { color: '#777', fontSize: 13, fontWeight: '500' },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: 18,
    borderRadius: 26,
    backgroundColor: 'white',
  },
  createText: { fontWeight: '800', fontSize: 17, color: 'black' },
  successWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 18,
  },
  successIcon: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  successTitle: { fontWeight: '900', fontSize: 28, color: 'white', letterSpacing: 0.5 },
  successSub: { color: '#888', fontSize: 14, textAlign: 'center', lineHeight: 22 },
  successBtn: {
    marginTop: 8,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  successBtnText: { color: 'white', fontWeight: '700', fontSize: 15 },
  goHomeText: { color: '#555', fontWeight: '600', fontSize: 14, textAlign: 'center' },
});
