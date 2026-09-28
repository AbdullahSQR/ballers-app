import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAuth } from '@/lib/auth-context';
import api from '@/lib/api';

// ─── Constants ────────────────────────────────────────────────────────────────

// Hours available for play (6 AM – 10 PM Oman, each slot is 1 hour)
const PLAYING_HOURS = [6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22];

const DAY_NAMES   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

// Oman Standard Time = UTC+4, no DST ever
const OMAN_OFFSET_MS = 4 * 60 * 60 * 1000;

// ─── Types ────────────────────────────────────────────────────────────────────

type DbSlot = {
  id: string;
  start_time: string; // ISO UTC
  end_time: string;
  status: 'available' | 'blocked' | 'booked';
};

type Stadium = {
  id: string;
  name: string;
  address: string;
  description: string | null;
  _count: { matches: number };
  time_slots: DbSlot[];
};

// ─── Oman timezone helpers ────────────────────────────────────────────────────

/**
 * Shifts now() so that UTC fields (getUTCHours, getUTCDate, …)
 * represent Oman local time. Device timezone is irrelevant.
 */
function omanNow(): Date {
  return new Date(Date.now() + OMAN_OFFSET_MS);
}

/** Current hour 0-23 in Oman time. */
function getOmanHour(): number {
  return omanNow().getUTCHours();
}

/**
 * Returns a "display date" where UTC fields equal the Oman local date
 * for (today + offset) days. Use .getUTCDate() / .getUTCDay() / .getUTCMonth()
 * for all display purposes.
 */
function omanDayFromOffset(offset: number): Date {
  const n = omanNow();
  return new Date(Date.UTC(
    n.getUTCFullYear(),
    n.getUTCMonth(),
    n.getUTCDate() + offset,
    0, 0, 0, 0,
  ));
}

/**
 * Converts a display-day + Oman hour into the real UTC Date.
 *
 * displayDay is "Oman midnight expressed as UTC midnight" (getUTCDate = Oman date),
 * so subtracting OMAN_OFFSET_MS gives the actual UTC moment for Oman midnight,
 * then adding `hour` hours gives Oman hour:00 in UTC.
 *
 * Example: displayDay = May 19 00:00 UTC (= Oman midnight May 19), hour = 6
 *   → May 19 00:00 UTC − 4h + 6h = May 19 02:00 UTC = 06:00 Oman ✓
 */
function omanSlotStart(displayDay: Date, hour: number): Date {
  return new Date(displayDay.getTime() - OMAN_OFFSET_MS + hour * 60 * 60 * 1000);
}

/** "YYYY-MM-DDTHH" key in UTC — used to match frontend virtual slots to DB records. */
function slotKey(displayDay: Date, hour: number): string {
  return omanSlotStart(displayDay, hour).toISOString().slice(0, 13);
}

function dbSlotKey(iso: string): string {
  return new Date(iso).toISOString().slice(0, 13);
}

// ─── Formatting ───────────────────────────────────────────────────────────────

function fmt12h(hour: number): string {
  if (hour === 0 || hour === 24) return '12:00 AM';
  if (hour === 12) return '12:00 PM';
  return hour < 12 ? `${hour}:00 AM` : `${hour - 12}:00 PM`;
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function StadiumManagerScreen() {
  const { user, logout } = useAuth();

  const [stadium,      setStadium]      = useState<Stadium | null>(null);
  const [loading,      setLoading]      = useState(true);
  const [refreshing,   setRefreshing]   = useState(false);
  const [dayOffset,    setDayOffset]    = useState(0);
  const [togglingSlot, setTogglingSlot] = useState<string | null>(null);

  // ── Fetch ─────────────────────────────────────────────────────────────────

  const fetchStadium = useCallback(async () => {
    try {
      const res = await api.get('/stadiums/my');
      setStadium(res.data.data);
    } catch {
      setStadium(null);
    }
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await fetchStadium();
      setLoading(false);
    })();
  }, [fetchStadium]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchStadium();
    setRefreshing(false);
  }, [fetchStadium]);

  // ── Slot helpers ──────────────────────────────────────────────────────────

  function findDbSlot(displayDay: Date, hour: number): DbSlot | undefined {
    if (!stadium) return undefined;
    const key = slotKey(displayDay, hour);
    return stadium.time_slots.find(s => dbSlotKey(s.start_time) === key);
  }

  // ── Block / unblock ───────────────────────────────────────────────────────

  async function blockSlot(displayDay: Date, hour: number) {
    if (!stadium) return;
    const key = slotKey(displayDay, hour);
    setTogglingSlot(key);
    try {
      const start = omanSlotStart(displayDay, hour);
      const end   = omanSlotStart(displayDay, hour + 1);
      await api.post(`/stadiums/${stadium.id}/slots`, {
        start_time: start.toISOString(),
        end_time:   end.toISOString(),
        status: 'blocked',
      });
      await fetchStadium();
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? err?.message ?? 'Could not block slot.';
      Alert.alert('Error', msg);
    } finally {
      setTogglingSlot(null);
    }
  }

  async function unblockSlot(slot: DbSlot) {
    if (!stadium) return;
    setTogglingSlot(slot.id);
    try {
      await api.delete(`/stadiums/${stadium.id}/slots/${slot.id}`);
      await fetchStadium();
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? err?.message ?? 'Could not restore slot.';
      Alert.alert('Error', msg);
    } finally {
      setTogglingSlot(null);
    }
  }

  function handleSlotTap(displayDay: Date, hour: number) {
    const db = findDbSlot(displayDay, hour);
    if (!db) {
      Alert.alert(
        'Block Slot',
        `Mark ${fmt12h(hour)} – ${fmt12h(hour + 1)} as unavailable?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Block', style: 'destructive', onPress: () => blockSlot(displayDay, hour) },
        ],
      );
    } else if (db.status === 'blocked') {
      Alert.alert(
        'Restore Slot',
        `Restore ${fmt12h(hour)} – ${fmt12h(hour + 1)} to available?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Restore', onPress: () => unblockSlot(db) },
        ],
      );
    }
    // booked → read-only, no action
  }

  // ── Stats ─────────────────────────────────────────────────────────────────

  function countTodayAvailable(): number {
    const today = omanDayFromOffset(0);
    const now   = Date.now();
    return PLAYING_HOURS.filter(h => {
      if (omanSlotStart(today, h).getTime() <= now) return false; // already started
      const db = findDbSlot(today, h);
      return !db || db.status === 'available';
    }).length;
  }

  // ── Render ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <LinearGradient colors={['#1a1a1a', '#000000']} style={styles.center}>
        <ActivityIndicator color="#FFD700" size="large" />
      </LinearGradient>
    );
  }

  const selectedDay = omanDayFromOffset(dayOffset);
  const nowMs       = Date.now(); // used to check if a slot's start has already passed

  return (
    <LinearGradient colors={['#1a1a1a', '#000000']} style={styles.container}>
      <StatusBar barStyle="light-content" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FFD700" />
        }
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Stadium Manager</Text>
            <Text style={styles.username}>{user?.username}</Text>
          </View>
          <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
            <Ionicons name="log-out-outline" size={20} color="#888" />
          </TouchableOpacity>
        </View>

        {/* ── No stadium ── */}
        {!stadium && (
          <View style={styles.noStadium}>
            <Ionicons name="business-outline" size={56} color="#333" />
            <Text style={styles.noStadiumTitle}>No stadium assigned yet</Text>
            <Text style={styles.noStadiumSub}>
              Your account has been approved.{'\n'}An admin will assign your stadium shortly.
            </Text>
          </View>
        )}

        {stadium && (
          <>
            {/* ── Stadium card ── */}
            <View style={styles.stadiumCard}>
              <View style={styles.stadiumIconWrap}>
                <Ionicons name="business" size={28} color="white" />
              </View>
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={styles.stadiumName}>{stadium.name}</Text>
                <View style={styles.addressRow}>
                  <Ionicons name="location-outline" size={13} color="#888" />
                  <Text style={styles.stadiumAddress}>{stadium.address}</Text>
                </View>
              </View>
            </View>

            {/* ── Stats ── */}
            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <Text style={styles.statVal}>{stadium._count.matches}</Text>
                <Text style={styles.statLab}>Matches Hosted</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={[styles.statVal, { color: '#69db7c' }]}>{countTodayAvailable()}</Text>
                <Text style={styles.statLab}>Open Today</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={[styles.statVal, { color: '#ff6b6b' }]}>
                  {stadium.time_slots.filter(s => s.status === 'blocked').length}
                </Text>
                <Text style={styles.statLab}>Blocked</Text>
              </View>
            </View>

            {/* ── Legend ── */}
            <View style={styles.legend}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#69db7c' }]} />
                <Text style={styles.legendText}>Open</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#ff6b6b' }]} />
                <Text style={styles.legendText}>Blocked</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#FFD700' }]} />
                <Text style={styles.legendText}>Match Scheduled</Text>
              </View>
            </View>
            <Text style={styles.legendNote}>
              Tap any open slot to block it. Tap a blocked slot to restore it.{'\n'}
              "Match Scheduled" slots are set automatically by the system.
            </Text>

            {/* ── Day picker ── */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.dayRow}
            >
              {Array.from({ length: 14 }, (_, i) => {
                const d        = omanDayFromOffset(i);
                const selected = dayOffset === i;
                return (
                  <TouchableOpacity
                    key={i}
                    style={[styles.dayChip, selected && styles.dayChipOn]}
                    onPress={() => setDayOffset(i)}
                  >
                    <Text style={[styles.dayChipName, selected && { color: '#bbb' }]}>
                      {i === 0 ? 'Today' : DAY_NAMES[d.getUTCDay()]}
                    </Text>
                    <Text style={[styles.dayChipNum, selected && { color: 'white' }]}>
                      {d.getUTCDate()}
                    </Text>
                    <Text style={[styles.dayChipMon, selected && { color: '#aaa' }]}>
                      {MONTH_NAMES[d.getUTCMonth()]}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* ── Slot grid — all hours shown, past ones grayed out ── */}
            <View style={styles.slotGrid}>
              {PLAYING_HOURS.map((hour) => {
                // A slot is "past" once its start time has already passed
                const isPast = dayOffset === 0 && omanSlotStart(selectedDay, hour).getTime() <= nowMs;
                const db         = isPast ? undefined : findDbSlot(selectedDay, hour);
                const key        = slotKey(selectedDay, hour);
                const isToggling = !isPast && (togglingSlot === key || togglingSlot === db?.id);

                const status        = db?.status ?? 'available';
                const isBooked      = !isPast && status === 'booked';
                const isBlocked     = !isPast && status === 'blocked';
                const isInteractive = !isPast && !isBooked && !isToggling;

                const bg = isPast
                  ? 'rgba(255,255,255,0.02)'
                  : isBooked  ? 'rgba(255,215,0,0.10)'
                  : isBlocked ? 'rgba(255,107,107,0.10)'
                  :             'rgba(105,219,124,0.07)';

                const borderColor = isPast
                  ? 'rgba(255,255,255,0.05)'
                  : isBooked  ? 'rgba(255,215,0,0.30)'
                  : isBlocked ? 'rgba(255,107,107,0.30)'
                  :             'rgba(105,219,124,0.22)';

                const dotColor = isPast
                  ? '#2a2a2a'
                  : isBooked  ? '#FFD700'
                  : isBlocked ? '#ff6b6b'
                  :             '#69db7c';

                const label = isPast
                  ? 'Passed'
                  : isBooked  ? 'Match scheduled — set by system'
                  : isBlocked ? 'Blocked by you — tap to restore'
                  :             'Open — tap to block';

                const labelColor = isPast
                  ? '#333'
                  : isBooked  ? '#FFD700'
                  : isBlocked ? '#ff6b6b'
                  :             '#69db7c';

                return (
                  <TouchableOpacity
                    key={hour}
                    style={[styles.slotRow, { backgroundColor: bg, borderColor }]}
                    onPress={() => isInteractive && handleSlotTap(selectedDay, hour)}
                    activeOpacity={isInteractive ? 0.7 : 1}
                    disabled={!isInteractive}
                  >
                    <View style={[styles.slotDot, { backgroundColor: dotColor }]} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.slotTime, isPast && styles.slotTimePast]}>
                        {fmt12h(hour)} – {fmt12h(hour + 1)}
                      </Text>
                      <Text style={[styles.slotLabel, { color: labelColor }]}>
                        {label}
                      </Text>
                    </View>
                    {isToggling ? (
                      <ActivityIndicator size="small" color="#888" />
                    ) : isPast ? null
                      : isBlocked ? (
                      <Ionicons name="lock-closed" size={15} color="#ff6b6b" />
                    ) : isBooked ? (
                      <Ionicons name="calendar" size={15} color="#FFD700" />
                    ) : (
                      <Ionicons name="lock-open-outline" size={15} color="rgba(255,255,255,0.18)" />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        )}
      </ScrollView>
    </LinearGradient>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  center:    { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll:    { paddingTop: 65, paddingHorizontal: 22, gap: 20, paddingBottom: 60 },

  header:   { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  greeting: { fontSize: 13, color: '#888', fontWeight: '500', marginBottom: 2 },
  username: { fontWeight: '900', fontSize: 26, color: 'white', letterSpacing: 0.3 },
  logoutBtn: {
    width: 42, height: 42, borderRadius: 21,
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
  },

  noStadium:      { alignItems: 'center', paddingVertical: 80, gap: 14 },
  noStadiumTitle: { fontWeight: '800', color: '#555', fontSize: 18 },
  noStadiumSub:   { color: '#444', fontSize: 13, textAlign: 'center', lineHeight: 20 },

  stadiumCard: {
    flexDirection: 'row', gap: 14, borderRadius: 18, padding: 16,
    borderWidth: 1, backgroundColor: 'rgba(255,255,255,0.08)',
    borderColor: 'rgba(255,255,255,0.12)', alignItems: 'center',
  },
  stadiumIconWrap: {
    width: 48, height: 48, borderRadius: 24,
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  stadiumName:    { fontWeight: '800', color: 'white', fontSize: 17 },
  addressRow:     { flexDirection: 'row', alignItems: 'center', gap: 4 },
  stadiumAddress: { color: '#888', fontSize: 12 },

  statsRow: { flexDirection: 'row', gap: 10 },
  statCard: {
    flex: 1, padding: 14, borderRadius: 14, borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center', gap: 4,
  },
  statVal: { fontWeight: '800', color: 'white', fontSize: 22 },
  statLab: { color: '#888', fontSize: 10, fontWeight: '500', textAlign: 'center' },

  legend:     { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 2 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot:  { width: 8, height: 8, borderRadius: 4 },
  legendText: { color: '#888', fontSize: 12, fontWeight: '500' },
  legendNote: { color: '#555', fontSize: 11, lineHeight: 17, paddingHorizontal: 2, marginTop: -8 },

  dayRow:       { gap: 8, paddingRight: 4 },
  dayChip: {
    alignItems: 'center', paddingVertical: 10, paddingHorizontal: 12,
    borderRadius: 12, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    gap: 2, minWidth: 52,
  },
  dayChipOn:   { borderColor: 'rgba(255,255,255,0.4)', backgroundColor: 'rgba(255,255,255,0.15)' },
  dayChipName: { fontSize: 10, color: '#555', fontWeight: '600' },
  dayChipNum:  { fontSize: 17, fontWeight: '800', color: '#555' },
  dayChipMon:  { fontSize: 9, color: '#444', fontWeight: '500' },

  slotGrid:     { gap: 8 },
  slotRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderRadius: 12, padding: 14, borderWidth: 1,
  },
  slotDot:      { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  slotTime:     { color: 'white', fontWeight: '700', fontSize: 15 },
  slotTimePast: { color: '#333' },
  slotLabel:    { fontSize: 11, fontWeight: '500', marginTop: 2 },
});
