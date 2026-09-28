import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
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
import { DAY_NAMES, MONTH_NAMES, generateDates } from '../../lib/constants';
import api from '@/lib/api';

// ─── Constants ────────────────────────────────────────────────────────────────

const BASE_PLAYERS = 14;
const MAX_SUBS     = 4;
const DATES        = generateDates(14);

// ─── Types ────────────────────────────────────────────────────────────────────

type Stadium = {
  id: string;
  name: string;
  address: string;
  description: string | null;
  distance_km: number | null;
};

type AvailableSlot = {
  hour: number;
  start_time: string;
  end_time: string;
};

type ActiveMatch = {
  id: string;
  match_type: string;
  status: string;
  scheduled_at: string;
  max_players: number;
  players_joined: number;
  stadium: { name: string; address: string } | null;
  is_creator: boolean;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt12h(hour: number): string {
  if (hour === 12) return '12:00 PM';
  if (hour === 0)  return '12:00 AM';
  return hour < 12 ? `${hour}:00 AM` : `${hour - 12}:00 PM`;
}

/** Format a Date as 'YYYY-MM-DD' in Oman time (UTC+4) for the API */
function toOmanDateStr(d: Date): string {
  const oman = new Date(d.getTime() + 4 * 60 * 60 * 1000);
  const y = oman.getUTCFullYear();
  const m = String(oman.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(oman.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function CreateScreen() {
  // ── Form state ───────────────────────────────────────────────────────────────
  const [matchType,    setMatchType]    = useState<'Casual' | 'Competitive'>('Casual');
  const [extraSubs,    setExtraSubs]    = useState(0);
  const [selectedDate, setSelectedDate] = useState(DATES[0]);
  const [selectedStadium, setSelectedStadium] = useState<Stadium | null>(null);
  const [selectedSlot,    setSelectedSlot]    = useState<AvailableSlot | null>(null);

  // ── API data ─────────────────────────────────────────────────────────────────
  const [stadiums,       setStadiums]       = useState<Stadium[]>([]);
  const [stadiumsLoading, setStadiumsLoading] = useState(true);
  const [slots,          setSlots]          = useState<AvailableSlot[]>([]);
  const [slotsLoading,   setSlotsLoading]   = useState(false);

  // ── UI state ─────────────────────────────────────────────────────────────────
  const [creating,    setCreating]    = useState(false);
  const [created,     setCreated]     = useState(false);
  const [createdInfo, setCreatedInfo] = useState({ stadiumName: '', slotHour: 0, date: DATES[0] });
  const [activeMatch, setActiveMatch] = useState<ActiveMatch | null | 'loading'>('loading');

  // ── Invite state ─────────────────────────────────────────────────────────────
  const [invitedPlayers,    setInvitedPlayers]    = useState<string[]>([]);
  const [inviteInput,       setInviteInput]       = useState('');
  const [inviteInputLoading, setInviteInputLoading] = useState(false);
  const [inviteError,       setInviteError]       = useState('');

  const totalSlots = BASE_PLAYERS + extraSubs;

  // ── Fetch stadiums once on mount ─────────────────────────────────────────────

  useEffect(() => {
    api.get('/stadiums')
      .then(res => setStadiums(res.data.data ?? []))
      .catch(() => setStadiums([]))
      .finally(() => setStadiumsLoading(false));
  }, []);

  // ── Re-check active match every time this tab comes into focus ────────────────
  // This prevents showing the create form when the user already has an active match
  // (e.g. they joined via matchmaking on the home tab, then switched here)

  useFocusEffect(
    useCallback(() => {
      setActiveMatch('loading');
      api.get('/users/me/active-match')
        .then(res => {
          const m = res.data.data ?? null;
          setActiveMatch(m);
          // If no active match, clear the success screen so the form shows fresh
          if (!m) setCreated(false);
        })
        .catch(() => { setActiveMatch(null); setCreated(false); });
    }, [])
  );

  // ── Fetch slots when stadium or date changes ─────────────────────────────────

  useEffect(() => {
    if (!selectedStadium) { setSlots([]); return; }

    setSelectedSlot(null);
    setSlotsLoading(true);

    const dateStr = toOmanDateStr(selectedDate);

    api.get(`/stadiums/${selectedStadium.id}/available-slots?date=${dateStr}`)
      .then(res => setSlots(res.data.data ?? []))
      .catch(() => setSlots([]))
      .finally(() => setSlotsLoading(false));
  }, [selectedStadium, selectedDate]);

  // ── Submit ───────────────────────────────────────────────────────────────────

  const handleCreate = async () => {
    if (!selectedStadium) {
      Alert.alert('Select a venue', 'Please choose a stadium before creating your match.');
      return;
    }
    if (!selectedSlot) {
      Alert.alert('Select a time slot', 'Please choose an available time slot.');
      return;
    }

    setCreating(true);
    try {
      const res = await api.post('/matches', {
        match_type:   'friendly',
        scheduled_at: selectedSlot.start_time,
        max_players:  totalSlots,
        stadium_id:   selectedStadium.id,
      });

      const newMatchId: string | undefined = res.data.data?.id;

      // Fire invites in background — don't block success screen on failure
      if (newMatchId && invitedPlayers.length > 0) {
        invitedPlayers.forEach(username => {
          api.post(`/matches/${newMatchId}/invite`, { username }).catch(() => {});
        });
      }

      setCreatedInfo({
        stadiumName: selectedStadium.name,
        slotHour:    selectedSlot.hour,
        date:        selectedDate,
      });
      setCreated(true);
    } catch (err: any) {
      // The backend may have succeeded even if the response didn't reach us
      // (e.g. network timeout after slot+match were already written to DB).
      // Re-check before showing an error so we don't mislead the user.
      try {
        const activeRes = await api.get('/users/me/active-match');
        const m = activeRes.data.data;
        if (m) {
          // Match was created — show success state
          setCreatedInfo({
            stadiumName: m.stadium?.name ?? selectedStadium.name,
            slotHour:    selectedSlot.hour,
            date:        selectedDate,
          });
          setCreated(true);
          return;
        }
      } catch { /* ignore — will fall through to error handling below */ }

      const code = err?.code;
      if (code === 'SLOT_UNAVAILABLE') {
        Alert.alert('Slot taken', 'That slot was just booked by someone else. Please pick another time.');
        const dateStr = toOmanDateStr(selectedDate);
        const res = await api.get(`/stadiums/${selectedStadium.id}/available-slots?date=${dateStr}`).catch(() => null);
        if (res) { setSlots(res.data.data ?? []); setSelectedSlot(null); }
      } else {
        Alert.alert('Error', err?.message ?? 'Could not create match.');
      }
    } finally {
      setCreating(false);
    }
  };

  const addInvite = async () => {
    const username = inviteInput.trim();
    if (!username) return;
    if (invitedPlayers.includes(username)) {
      setInviteError('Already added');
      return;
    }
    setInviteError('');
    setInviteInputLoading(true);
    try {
      await api.get(`/users/${username}`);
      setInvitedPlayers(prev => [...prev, username]);
      setInviteInput('');
    } catch {
      setInviteError('Player not found');
    } finally {
      setInviteInputLoading(false);
    }
  };

  const handleReset = async () => {
    setMatchType('Casual');
    setExtraSubs(0);
    setSelectedDate(DATES[0]);
    setSelectedStadium(null);
    setSelectedSlot(null);
    setSlots([]);
    setInvitedPlayers([]);
    setInviteInput('');
    setInviteError('');
    // Re-check active match before showing the form again —
    // the match we just created is now active so this will show
    // the "already in a match" screen instead of the blank form
    setActiveMatch('loading');
    setCreated(false);
    try {
      const res = await api.get('/users/me/active-match');
      setActiveMatch(res.data.data ?? null);
    } catch {
      setActiveMatch(null);
    }
  };

  // ── Already-in-a-match screen ────────────────────────────────────────────────

  if (activeMatch && activeMatch !== 'loading') {
    const m = activeMatch;
    const d = new Date(m.scheduled_at);
    return (
      <LinearGradient colors={['#2a2a2a', '#000000']} style={styles.container}>
        <StatusBar barStyle="light-content" />
        <View style={styles.successWrap}>
          <View style={[styles.successIcon, { backgroundColor: 'rgba(255,215,0,0.1)', borderWidth: 1, borderColor: 'rgba(255,215,0,0.3)' }]}>
            <Ionicons name="football" size={40} color="#FFD700" />
          </View>
          <Text style={styles.successTitle}>
            {m.is_creator ? 'Your Match' : 'Already In a Match'}
          </Text>
          <Text style={styles.successSub}>
            {m.is_creator
              ? "You've already created a match. You can only have one active match at a time."
              : "You're currently in a match. Leave it first if you want to create a new one."}
          </Text>

          {/* Match info box */}
          <View style={styles.activeMatchBox}>
            <View style={styles.activeMatchRow}>
              <Ionicons name="business-outline" size={15} color="#888" />
              <Text style={styles.activeMatchText}>{m.stadium?.name ?? 'Venue TBD'}</Text>
            </View>
            <View style={styles.activeMatchRow}>
              <Ionicons name="calendar-outline" size={15} color="#888" />
              <Text style={styles.activeMatchText}>
                {DAY_NAMES[d.getDay()]}, {MONTH_NAMES[d.getMonth()]} {d.getDate()} · {d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
            <View style={styles.activeMatchRow}>
              <Ionicons name="people-outline" size={15} color="#888" />
              <Text style={styles.activeMatchText}>{m.players_joined}/{m.max_players} players joined</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.successBtn} onPress={() => router.replace('/(tabs)')}>
            <Text style={styles.successBtnText}>Go to Home to View Details</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  }

  // ── Success screen ───────────────────────────────────────────────────────────

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
            {matchType} · 7v7{extraSubs > 0 ? ` +${extraSubs} sub${extraSubs > 1 ? 's' : ''}` : ''}{'\n'}
            {createdInfo.stadiumName}{'\n'}
            {DAY_NAMES[createdInfo.date.getDay()]}, {MONTH_NAMES[createdInfo.date.getMonth()]} {createdInfo.date.getDate()} · {fmt12h(createdInfo.slotHour)}
          </Text>
          <TouchableOpacity style={styles.successBtn} onPress={() => router.replace('/(tabs)')}>
            <Text style={styles.successBtnText}>View Match on Home</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  }

  // ── Form ─────────────────────────────────────────────────────────────────────

  return (
    <LinearGradient colors={['#2a2a2a', '#000000']} style={styles.container}>
      <StatusBar barStyle="light-content" />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headTitle}>Create a Match</Text>
            <Text style={styles.headSub}>Pick a venue, choose your slot, and play.</Text>
          </View>

          {/* ── Match Type ── */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Match Type</Text>
            <View style={styles.toggle}>
              {(['Casual', 'Competitive'] as const).map(t => (
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

          {/* ── Format ── */}
          <View style={styles.formatCard}>
            <View style={styles.formatLeft}>
              <Ionicons name="football-outline" size={20} color="white" />
              <View style={{ gap: 2 }}>
                <Text style={styles.formatLabel}>7v7 — 14 players</Text>
                <Text style={styles.formatSub}>Standard format for all matches on Ballers.</Text>
              </View>
            </View>
          </View>

          {/* ── Substitute Slots ── */}
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
                  onPress={() => setExtraSubs(s => Math.max(0, s - 1))}
                  disabled={extraSubs === 0}
                >
                  <Ionicons name="remove" size={18} color="white" />
                </TouchableOpacity>
                <Text style={styles.counterVal}>{extraSubs}</Text>
                <TouchableOpacity
                  style={[styles.counterBtn, extraSubs === MAX_SUBS && { opacity: 0.3 }]}
                  onPress={() => setExtraSubs(s => Math.min(MAX_SUBS, s + 1))}
                  disabled={extraSubs === MAX_SUBS}
                >
                  <Ionicons name="add" size={18} color="white" />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* ── Venue ── */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Venue</Text>

            {stadiumsLoading ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator color="#FFD700" size="small" />
                <Text style={styles.loadingText}>Loading venues…</Text>
              </View>
            ) : stadiums.length === 0 ? (
              <View style={styles.emptyBox}>
                <Ionicons name="business-outline" size={24} color="#333" />
                <Text style={styles.emptyText}>No venues available yet</Text>
              </View>
            ) : (
              <View style={styles.venueList}>
                {stadiums.map(s => {
                  const selected = selectedStadium?.id === s.id;
                  return (
                    <TouchableOpacity
                      key={s.id}
                      style={[styles.venueCard, selected && styles.venueCardOn]}
                      onPress={() => setSelectedStadium(selected ? null : s)}
                      activeOpacity={0.8}
                    >
                      <View style={[styles.venueIconWrap, selected && { backgroundColor: 'rgba(255,215,0,0.15)' }]}>
                        <Ionicons name="business" size={18} color={selected ? '#FFD700' : '#666'} />
                      </View>
                      <View style={{ flex: 1, gap: 2 }}>
                        <Text style={[styles.venueName, selected && { color: '#FFD700' }]}>{s.name}</Text>
                        <View style={styles.venueAddrRow}>
                          <Ionicons name="location-outline" size={11} color="#555" />
                          <Text style={styles.venueAddr}>{s.address}</Text>
                        </View>
                        {s.distance_km !== null && (
                          <Text style={[styles.venueAddr, { color: selected ? '#FFD700' : '#555' }]}>
                            {s.distance_km} km away
                          </Text>
                        )}
                      </View>
                      {selected && <Ionicons name="checkmark-circle" size={20} color="#FFD700" />}
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>

          {/* ── Date ── */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Date</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dateRow}>
              {DATES.map((d, i) => {
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

          {/* ── Time Slot ── */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Time Slot</Text>

            {!selectedStadium ? (
              <View style={styles.emptyBox}>
                <Ionicons name="time-outline" size={22} color="#333" />
                <Text style={styles.emptyText}>Select a venue first to see available slots</Text>
              </View>
            ) : slotsLoading ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator color="#FFD700" size="small" />
                <Text style={styles.loadingText}>Checking availability…</Text>
              </View>
            ) : slots.length === 0 ? (
              <View style={styles.emptyBox}>
                <Ionicons name="calendar-outline" size={22} color="#333" />
                <Text style={styles.emptyText}>No slots available on this day</Text>
                <Text style={styles.emptySub}>Try a different date or venue</Text>
              </View>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.slotRow}>
                {slots.map(slot => {
                  const selected = selectedSlot?.hour === slot.hour;
                  return (
                    <TouchableOpacity
                      key={slot.hour}
                      style={[styles.slotChip, selected && styles.slotChipOn]}
                      onPress={() => setSelectedSlot(selected ? null : slot)}
                    >
                      <Text style={[styles.slotTime, selected && styles.slotTimeOn]}>
                        {fmt12h(slot.hour)}
                      </Text>
                      <Text style={[styles.slotEnd, selected && { color: '#ccc' }]}>
                        – {fmt12h(slot.hour + 1)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}
          </View>

          {/* ── Invite Players ── */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Invite Players <Text style={{ color: '#555', textTransform: 'none', fontSize: 11 }}>(optional)</Text></Text>
            <View style={styles.inviteRow}>
              <TextInput
                style={styles.inviteInput}
                placeholder="Search by username"
                placeholderTextColor="#444"
                value={inviteInput}
                onChangeText={t => { setInviteInput(t); setInviteError(''); }}
                onSubmitEditing={addInvite}
                autoCapitalize="none"
                returnKeyType="done"
              />
              <TouchableOpacity
                style={[styles.inviteAddBtn, (!inviteInput.trim() || inviteInputLoading) && { opacity: 0.4 }]}
                onPress={addInvite}
                disabled={!inviteInput.trim() || inviteInputLoading}
              >
                {inviteInputLoading
                  ? <ActivityIndicator color="black" size="small" />
                  : <Ionicons name="add" size={20} color="black" />}
              </TouchableOpacity>
            </View>
            {!!inviteError && <Text style={styles.inviteErr}>{inviteError}</Text>}
            {invitedPlayers.length > 0 && (
              <View style={styles.inviteChips}>
                {invitedPlayers.map(u => (
                  <View key={u} style={styles.inviteChip}>
                    <Text style={styles.inviteChipText}>{u}</Text>
                    <TouchableOpacity onPress={() => setInvitedPlayers(prev => prev.filter(p => p !== u))}>
                      <Ionicons name="close-circle" size={16} color="#888" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* ── Summary ── */}
          <View style={styles.summary}>
            <View style={styles.summaryRow}>
              <Ionicons name="football-outline" size={14} color="#555" />
              <Text style={styles.summaryText}>
                {matchType} · 7v7{extraSubs > 0 ? ` +${extraSubs} sub${extraSubs > 1 ? 's' : ''}` : ''}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Ionicons name="business-outline" size={14} color="#555" />
              <Text style={styles.summaryText}>
                {selectedStadium?.name ?? 'No venue selected'}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Ionicons name="calendar-outline" size={14} color="#555" />
              <Text style={styles.summaryText}>
                {DAY_NAMES[selectedDate.getDay()]}, {MONTH_NAMES[selectedDate.getMonth()]} {selectedDate.getDate()}
                {selectedSlot ? ` · ${fmt12h(selectedSlot.hour)}` : ' · No time selected'}
              </Text>
            </View>
          </View>

          {/* ── Create button ── */}
          <TouchableOpacity
            style={[
              styles.createMatchBtn,
              (!selectedStadium || !selectedSlot || creating) && { opacity: 0.5 },
            ]}
            onPress={handleCreate}
            disabled={!selectedStadium || !selectedSlot || creating}
          >
            {creating
              ? <ActivityIndicator color="black" size="small" />
              : <Ionicons name="flash" size={20} color="black" />}
            <Text style={styles.createText}>{creating ? 'Creating…' : 'Create Match'}</Text>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingTop: 65, paddingHorizontal: 22, paddingBottom: 120, gap: 22 },

  header:    { gap: 4 },
  headTitle: { fontWeight: '900', fontSize: 26, color: 'white', letterSpacing: 0.3 },
  headSub:   { color: '#888', fontSize: 13, fontWeight: '500' },

  section:      { gap: 10 },
  sectionLabel: { fontWeight: '700', fontSize: 13, color: '#aaa', letterSpacing: 0.5, textTransform: 'uppercase' },

  toggle:      { flexDirection: 'row', gap: 4, borderRadius: 14, padding: 4, backgroundColor: 'rgba(255,255,255,0.08)' },
  toggleBtn:   { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 11, borderRadius: 10 },
  toggleOn:    { backgroundColor: 'rgba(255,255,255,0.15)' },
  toggleText:  { fontWeight: '600', color: '#666', fontSize: 14 },
  toggleTextOn:{ color: 'white', fontWeight: '700' },

  formatCard:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: 14, padding: 16, borderWidth: 1, backgroundColor: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.15)' },
  formatLeft:  { flexDirection: 'row', alignItems: 'center', gap: 12 },
  formatLabel: { fontWeight: '800', color: 'white', fontSize: 15 },
  formatSub:   { color: '#555', fontSize: 12 },

  subsCard:    { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 14, padding: 16, borderWidth: 1, backgroundColor: 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.1)' },
  subsTitle:   { fontWeight: '700', color: 'white', fontSize: 14 },
  subsSub:     { color: '#555', fontSize: 12, lineHeight: 17 },
  subsCounter: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  counterBtn:  { width: 32, height: 32, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.12)', justifyContent: 'center', alignItems: 'center' },
  counterVal:  { fontWeight: '800', color: 'white', fontSize: 18, minWidth: 16, textAlign: 'center' },

  loadingBox:  { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 16, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  loadingText: { color: '#555', fontSize: 13 },
  emptyBox:    { alignItems: 'center', padding: 24, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', gap: 6 },
  emptyText:   { color: '#555', fontSize: 13, fontWeight: '600', textAlign: 'center' },
  emptySub:    { color: '#3a3a3a', fontSize: 11 },

  venueList:     { gap: 10 },
  venueCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 16,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  venueCardOn: { borderColor: 'rgba(255,215,0,0.5)', backgroundColor: 'rgba(255,215,0,0.08)' },
  venueIconWrap: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.08)', justifyContent: 'center', alignItems: 'center' },
  venueName:    { fontWeight: '700', color: 'white', fontSize: 14 },
  venueAddrRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  venueAddr:    { color: '#555', fontSize: 11 },

  dateRow:     { gap: 8, paddingRight: 8 },
  dateChip:    { alignItems: 'center', paddingVertical: 12, paddingHorizontal: 14, borderRadius: 14, gap: 2, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', backgroundColor: 'rgba(255,255,255,0.06)', minWidth: 56 },
  dateChipOn:  { borderColor: 'rgba(255,255,255,0.45)', backgroundColor: 'rgba(255,255,255,0.18)' },
  dateDayName: { fontSize: 11, color: '#555', fontWeight: '600' },
  dateDayNameOn:{ color: '#bbb' },
  dateNum:     { fontSize: 18, fontWeight: '800', color: '#555' },
  dateNumOn:   { color: 'white' },
  dateMon:     { fontSize: 10, color: '#444', fontWeight: '500' },

  slotRow:    { gap: 8, paddingRight: 8, paddingBottom: 4 },
  slotChip: {
    alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 14,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.06)', gap: 2, minWidth: 80,
  },
  slotChipOn:  { borderColor: 'rgba(255,215,0,0.6)', backgroundColor: 'rgba(255,215,0,0.1)' },
  slotTime:    { fontWeight: '800', color: '#888', fontSize: 14 },
  slotTimeOn:  { color: '#FFD700' },
  slotEnd:     { color: '#444', fontSize: 11 },

  summary:     { borderRadius: 14, padding: 14, gap: 8, borderWidth: 1, backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.08)' },
  summaryRow:  { flexDirection: 'row', alignItems: 'center', gap: 8 },
  summaryText: { color: '#777', fontSize: 13, fontWeight: '500', flex: 1 },

  inviteRow:     { flexDirection: 'row', gap: 8, alignItems: 'center' },
  inviteInput:   { flex: 1, height: 46, borderRadius: 12, paddingHorizontal: 14, backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', color: 'white', fontSize: 14 },
  inviteAddBtn:  { width: 46, height: 46, borderRadius: 12, backgroundColor: 'white', justifyContent: 'center', alignItems: 'center' },
  inviteErr:     { color: '#ff6b6b', fontSize: 12, fontWeight: '600' },
  inviteChips:   { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  inviteChip:    { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20, backgroundColor: 'rgba(255,215,0,0.1)', borderWidth: 1, borderColor: 'rgba(255,215,0,0.3)' },
  inviteChipText:{ color: '#FFD700', fontSize: 13, fontWeight: '600' },

  createMatchBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 18, borderRadius: 26, backgroundColor: 'white' },
  createText:     { fontWeight: '800', fontSize: 17, color: 'black' },

  activeMatchBox: { width: '100%', borderRadius: 16, padding: 16, gap: 10, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  activeMatchRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  activeMatchText:{ color: '#aaa', fontSize: 13, fontWeight: '500', flex: 1 },

  successWrap:  { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 18 },
  successIcon:  { width: 90, height: 90, borderRadius: 45, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  successTitle: { fontWeight: '900', fontSize: 28, color: 'white', letterSpacing: 0.5 },
  successSub:   { color: '#888', fontSize: 14, textAlign: 'center', lineHeight: 24 },
  successBtn:   { marginTop: 8, paddingHorizontal: 32, paddingVertical: 14, borderRadius: 26, backgroundColor: 'rgba(255,255,255,0.15)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)' },
  successBtnText: { color: 'white', fontWeight: '700', fontSize: 15 },
  goHomeText:   { color: '#555', fontWeight: '600', fontSize: 14, textAlign: 'center' },
});
