import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAuth } from '@/lib/auth-context';
import api from '@/lib/api';

// ─── Types ────────────────────────────────────────────────────────────────────

type PlayerEntry = {
  rank: number;
  user: { id: string; username: string; avatar_url: string | null };
  position: string;
  skill_level: string;
  ovr: number;
  matches_played: number;
  wins: number;
  draws: number;
  losses: number;
  goals_scored: number;
};

type TeamEntry = {
  rank: number;
  id: string;
  name: string;
  logo_url: string | null;
  ovr: number;
  wins: number;
  draws: number;
  losses: number;
  member_count: number;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const POSITION_LABELS: Record<string, string> = {
  GK: 'Goalkeeper',
  DEF: 'Defender',
  MID: 'Midfielder',
  ATT: 'Forward',
};

const podiumColors: Record<number, string> = {
  1: '#FFD700',
  2: '#C0C0C0',
  3: '#CD7F32',
};

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function RankingsScreen() {
  const { user } = useAuth();

  const [tab, setTab] = useState<'individual' | 'team'>('individual');
  const [query, setQuery] = useState('');
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerEntry | null>(null);

  const [players, setPlayers] = useState<PlayerEntry[]>([]);
  const [teams, setTeams] = useState<TeamEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLeaderboards = useCallback(async () => {
    try {
      setError(null);
      const [pRes, tRes] = await Promise.all([
        api.get('/leaderboard/players'),
        api.get('/leaderboard/teams'),
      ]);
      setPlayers(pRes.data.data ?? []);
      setTeams(tRes.data.data ?? []);
    } catch (err: any) {
      setError(err.message ?? 'Failed to load leaderboard');
    }
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await fetchLeaderboards();
      setLoading(false);
    })();
  }, [fetchLeaderboards]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchLeaderboards();
    setRefreshing(false);
  }, [fetchLeaderboards]);

  // ─── Derived ──────────────────────────────────────────────────────────────

  const searching = query.length > 0;

  const filteredPlayers = searching
    ? players.filter((p) => p.user.username.toLowerCase().includes(query.toLowerCase()))
    : players.slice(3);

  const filteredTeams = searching
    ? teams.filter((t) => t.name.toLowerCase().includes(query.toLowerCase()))
    : teams.slice(3);

  const top3Players = players.slice(0, 3);
  const top3Teams = teams.slice(0, 3);

  // ─── Render ───────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <LinearGradient colors={['#2a2a2a', '#000000']} style={styles.center}>
        <ActivityIndicator color="#FFD700" size="large" />
      </LinearGradient>
    );
  }

  if (error) {
    return (
      <LinearGradient colors={['#2a2a2a', '#000000']} style={styles.center}>
        <Ionicons name="alert-circle-outline" size={48} color="#444" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => { setLoading(true); fetchLeaderboards().finally(() => setLoading(false)); }}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#2a2a2a', '#000000']} style={styles.container}>
      <StatusBar barStyle="light-content" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FFD700" />}
      >

        <View style={styles.header}>
          <Text style={styles.headTitle}>Rankings</Text>
          <Text style={styles.headSub}>Monthly leaderboard</Text>
        </View>

        {/* Toggle */}
        <View style={styles.toggle}>
          <TouchableOpacity
            style={[styles.toggleBtn, tab === 'individual' && styles.toggleOn]}
            onPress={() => { setTab('individual'); setQuery(''); }}
          >
            <Text style={[styles.toggleText, tab === 'individual' && styles.toggleTextOn]}>
              Individual
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleBtn, tab === 'team' && styles.toggleOn]}
            onPress={() => { setTab('team'); setQuery(''); }}
          >
            <Text style={[styles.toggleText, tab === 'team' && styles.toggleTextOn]}>
              Teams
            </Text>
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={18} color="#666" />
          <TextInput
            style={styles.searchInput}
            placeholder={tab === 'individual' ? 'Search players...' : 'Search teams...'}
            placeholderTextColor="#666"
            value={query}
            onChangeText={setQuery}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')}>
              <Ionicons name="close-circle" size={18} color="#666" />
            </TouchableOpacity>
          )}
        </View>

        {/* Podium */}
        {!searching && tab === 'individual' && top3Players.length >= 3 && (
          <View style={styles.podium}>
            {/* 2nd */}
            <View style={styles.podiumItem}>
              <View style={[styles.podiumAvatar, { borderColor: podiumColors[2] }]}>
                <Ionicons name="person" size={22} color="white" />
              </View>
              <Text style={styles.podiumName} numberOfLines={1}>{top3Players[1]?.user.username}</Text>
              <Text style={styles.podiumOvr}>{top3Players[1]?.ovr.toFixed(1)} OVR</Text>
              <View style={[styles.podiumBase, { height: 60, backgroundColor: 'rgba(192,192,192,0.2)', borderColor: podiumColors[2] }]}>
                <Text style={[styles.podiumRank, { color: podiumColors[2] }]}>2nd</Text>
              </View>
            </View>
            {/* 1st */}
            <View style={styles.podiumItem}>
              <Ionicons name="trophy" size={20} color="#FFD700" style={{ marginBottom: 4 }} />
              <View style={[styles.podiumAvatar, styles.podiumBig, { borderColor: podiumColors[1] }]}>
                <Ionicons name="person" size={28} color="white" />
              </View>
              <Text style={styles.podiumName} numberOfLines={1}>{top3Players[0]?.user.username}</Text>
              <Text style={styles.podiumOvr}>{top3Players[0]?.ovr.toFixed(1)} OVR</Text>
              <View style={[styles.podiumBase, { height: 80, backgroundColor: 'rgba(255,215,0,0.2)', borderColor: podiumColors[1] }]}>
                <Text style={[styles.podiumRank, { color: podiumColors[1] }]}>1st</Text>
              </View>
            </View>
            {/* 3rd */}
            <View style={styles.podiumItem}>
              <View style={[styles.podiumAvatar, { borderColor: podiumColors[3] }]}>
                <Ionicons name="person" size={22} color="white" />
              </View>
              <Text style={styles.podiumName} numberOfLines={1}>{top3Players[2]?.user.username}</Text>
              <Text style={styles.podiumOvr}>{top3Players[2]?.ovr.toFixed(1)} OVR</Text>
              <View style={[styles.podiumBase, { height: 45, backgroundColor: 'rgba(205,127,50,0.2)', borderColor: podiumColors[3] }]}>
                <Text style={[styles.podiumRank, { color: podiumColors[3] }]}>3rd</Text>
              </View>
            </View>
          </View>
        )}

        {!searching && tab === 'team' && top3Teams.length >= 3 && (
          <View style={styles.podium}>
            <View style={styles.podiumItem}>
              <View style={[styles.podiumAvatar, { borderColor: podiumColors[2] }]}>
                <Ionicons name="shield" size={22} color="white" />
              </View>
              <Text style={styles.podiumName} numberOfLines={1}>{top3Teams[1]?.name}</Text>
              <Text style={styles.podiumOvr}>{top3Teams[1]?.ovr.toFixed(1)} OVR</Text>
              <View style={[styles.podiumBase, { height: 60, backgroundColor: 'rgba(192,192,192,0.2)', borderColor: podiumColors[2] }]}>
                <Text style={[styles.podiumRank, { color: podiumColors[2] }]}>2nd</Text>
              </View>
            </View>
            <View style={styles.podiumItem}>
              <Ionicons name="trophy" size={20} color="#FFD700" style={{ marginBottom: 4 }} />
              <View style={[styles.podiumAvatar, styles.podiumBig, { borderColor: podiumColors[1] }]}>
                <Ionicons name="shield" size={28} color="white" />
              </View>
              <Text style={styles.podiumName} numberOfLines={1}>{top3Teams[0]?.name}</Text>
              <Text style={styles.podiumOvr}>{top3Teams[0]?.ovr.toFixed(1)} OVR</Text>
              <View style={[styles.podiumBase, { height: 80, backgroundColor: 'rgba(255,215,0,0.2)', borderColor: podiumColors[1] }]}>
                <Text style={[styles.podiumRank, { color: podiumColors[1] }]}>1st</Text>
              </View>
            </View>
            <View style={styles.podiumItem}>
              <View style={[styles.podiumAvatar, { borderColor: podiumColors[3] }]}>
                <Ionicons name="shield" size={22} color="white" />
              </View>
              <Text style={styles.podiumName} numberOfLines={1}>{top3Teams[2]?.name}</Text>
              <Text style={styles.podiumOvr}>{top3Teams[2]?.ovr.toFixed(1)} OVR</Text>
              <View style={[styles.podiumBase, { height: 45, backgroundColor: 'rgba(205,127,50,0.2)', borderColor: podiumColors[3] }]}>
                <Text style={[styles.podiumRank, { color: podiumColors[3] }]}>3rd</Text>
              </View>
            </View>
          </View>
        )}

        {/* List */}
        <View style={styles.list}>
          {tab === 'individual' && (
            <>
              {searching && filteredPlayers.length === 0 && (
                <View style={styles.empty}>
                  <Ionicons name="search-outline" size={40} color="#444" />
                  <Text style={styles.emptyText}>No players found</Text>
                </View>
              )}
              {filteredPlayers.map((item) => {
                const isMe = item.user.id === user?.id;
                return (
                  <TouchableOpacity
                    key={item.user.id}
                    style={[styles.row, isMe && styles.rowMe]}
                    onPress={() => setSelectedPlayer(item)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.rankBox, isMe && styles.rankBoxMe]}>
                      <Text style={[styles.rankText, isMe && { color: 'white' }]}>{item.rank}</Text>
                    </View>
                    <View style={[styles.rowAvatar, isMe && styles.rowAvatarMe]}>
                      <Ionicons name="person" size={18} color="white" />
                    </View>
                    <View style={styles.rowInfo}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={styles.rowName}>{item.user.username}</Text>
                        {isMe && <Text style={styles.youBadge}>You</Text>}
                      </View>
                      <Text style={styles.rowWins}>{item.wins} wins · {POSITION_LABELS[item.position] ?? item.position}</Text>
                    </View>
                    <Text style={[styles.rowOvr, isMe && { color: 'white' }]}>{item.ovr.toFixed(1)} OVR</Text>
                  </TouchableOpacity>
                );
              })}
            </>
          )}

          {tab === 'team' && (
            <>
              {searching && filteredTeams.length === 0 && (
                <View style={styles.empty}>
                  <Ionicons name="search-outline" size={40} color="#444" />
                  <Text style={styles.emptyText}>No teams found</Text>
                </View>
              )}
              {filteredTeams.map((item) => (
                <View key={item.id} style={styles.row}>
                  <View style={styles.rankBox}>
                    <Text style={styles.rankText}>{item.rank}</Text>
                  </View>
                  <View style={styles.rowAvatar}>
                    <Ionicons name="shield" size={18} color="white" />
                  </View>
                  <View style={styles.rowInfo}>
                    <Text style={styles.rowName}>{item.name}</Text>
                    <Text style={styles.rowWins}>{item.wins} wins · {item.member_count} members</Text>
                  </View>
                  <Text style={styles.rowOvr}>{item.ovr.toFixed(1)} OVR</Text>
                </View>
              ))}
            </>
          )}
        </View>

        {/* View Your Rank */}
        {!searching && tab === 'individual' && user && (
          <TouchableOpacity style={styles.viewRankBtn} onPress={() => setQuery(user.username)}>
            <Text style={styles.viewRank}>View Your Rank</Text>
            <Ionicons name="arrow-forward" size={16} color="white" />
          </TouchableOpacity>
        )}

      </ScrollView>

      {/* Player Card Modal */}
      <Modal visible={!!selectedPlayer} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <View style={styles.handle} />
            {selectedPlayer && (
              <>
                <View style={styles.cardAvatar}>
                  <Ionicons name="person" size={36} color="white" />
                </View>
                <Text style={styles.cardName}>{selectedPlayer.user.username}</Text>
                <Text style={styles.cardPosition}>
                  {POSITION_LABELS[selectedPlayer.position] ?? selectedPlayer.position}
                </Text>
                <View style={styles.cardStats}>
                  <View style={styles.cardStat}>
                    <Text style={styles.cardStatVal}>{selectedPlayer.ovr.toFixed(1)}</Text>
                    <Text style={styles.cardStatLab}>OVR</Text>
                  </View>
                  <View style={styles.cardDivider} />
                  <View style={styles.cardStat}>
                    <Text style={styles.cardStatVal}>{selectedPlayer.wins}</Text>
                    <Text style={styles.cardStatLab}>Wins</Text>
                  </View>
                  <View style={styles.cardDivider} />
                  <View style={styles.cardStat}>
                    <Text style={styles.cardStatVal}>{selectedPlayer.rank}</Text>
                    <Text style={styles.cardStatLab}>Rank</Text>
                  </View>
                </View>
                <View style={styles.cardExtraRow}>
                  <View style={styles.cardExtra}>
                    <Text style={styles.cardExtraVal}>{selectedPlayer.matches_played}</Text>
                    <Text style={styles.cardExtraLab}>Matches</Text>
                  </View>
                  <View style={styles.cardExtra}>
                    <Text style={styles.cardExtraVal}>{selectedPlayer.goals_scored}</Text>
                    <Text style={styles.cardExtraLab}>Goals</Text>
                  </View>
                  <View style={styles.cardExtra}>
                    <Text style={styles.cardExtraVal}>{selectedPlayer.losses}</Text>
                    <Text style={styles.cardExtraLab}>Losses</Text>
                  </View>
                </View>
                <TouchableOpacity style={styles.closeBtn} onPress={() => setSelectedPlayer(null)}>
                  <Text style={styles.closeBtnText}>Close</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>

    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 },
  scroll: {
    paddingTop: 65,
    paddingHorizontal: 22,
    gap: 20,
    paddingBottom: 110,
  },
  header: { gap: 4 },
  headTitle: { fontWeight: '900', fontSize: 26, color: 'white', letterSpacing: 0.3 },
  headSub: { color: '#888', fontSize: 13, fontWeight: '500' },
  toggle: {
    gap: 4, flexDirection: 'row', borderRadius: 14, padding: 4,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  toggleBtn: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 10 },
  toggleOn: { backgroundColor: 'rgba(255,255,255,0.15)' },
  toggleText: { fontWeight: '600', color: '#666', fontSize: 14 },
  toggleTextOn: { color: 'white', fontWeight: '700' },
  searchBox: {
    gap: 10, flexDirection: 'row', alignItems: 'center', borderRadius: 14,
    paddingHorizontal: 14, paddingVertical: 12, borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.1)',
  },
  searchInput: { flex: 1, color: 'white', fontSize: 15 },
  podium: {
    gap: 8, flexDirection: 'row', paddingHorizontal: 8,
    alignItems: 'flex-end', justifyContent: 'center',
  },
  podiumItem: { flex: 1, gap: 6, alignItems: 'center' },
  podiumAvatar: {
    borderWidth: 2, width: 52, height: 52, borderRadius: 26,
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  podiumBig: { width: 64, height: 64, borderRadius: 32 },
  podiumName: { fontWeight: '700', color: 'white', fontSize: 12, textAlign: 'center' },
  podiumOvr: { fontSize: 10, color: '#888', textAlign: 'center' },
  podiumBase: { width: '100%', borderWidth: 1, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  podiumRank: { fontWeight: '800', fontSize: 13 },
  list: { gap: 10 },
  empty: { gap: 12, alignItems: 'center', paddingVertical: 40 },
  emptyText: { fontWeight: '600', color: '#444', fontSize: 15 },
  errorText: { color: '#888', fontSize: 15, fontWeight: '500', textAlign: 'center', paddingHorizontal: 32 },
  retryBtn: {
    paddingHorizontal: 24, paddingVertical: 10, borderRadius: 20,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
  },
  retryText: { color: 'white', fontWeight: '600', fontSize: 14 },
  row: {
    gap: 12, flexDirection: 'row', alignItems: 'center', borderRadius: 14,
    padding: 12, borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.08)',
  },
  rankBox: {
    width: 32, height: 32, borderRadius: 10, justifyContent: 'center',
    alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.1)',
  },
  rankText: { fontWeight: '700', color: '#888', fontSize: 13 },
  rowAvatar: {
    width: 38, height: 38, borderRadius: 19, justifyContent: 'center',
    alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.1)',
  },
  rowInfo: { flex: 1, gap: 2 },
  rowName: { fontWeight: '600', color: 'white', fontSize: 14 },
  rowWins: { color: '#888', fontSize: 12 },
  rowOvr: { fontWeight: '700', color: '#aaa', fontSize: 13 },
  rowMe: { borderColor: 'rgba(255,255,255,0.35)', backgroundColor: 'rgba(255,255,255,0.12)' },
  rankBoxMe: { backgroundColor: 'rgba(255,255,255,0.2)' },
  rowAvatarMe: { backgroundColor: 'rgba(255,255,255,0.2)' },
  youBadge: {
    fontSize: 10, fontWeight: '700', color: '#aaa',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)',
    borderRadius: 6, paddingHorizontal: 6, paddingVertical: 1,
  },
  viewRankBtn: {
    gap: 8, flexDirection: 'row', alignItems: 'center', borderRadius: 14,
    padding: 14, borderWidth: 1, justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)', borderColor: 'rgba(255,255,255,0.15)',
  },
  viewRank: { fontWeight: '700', color: 'white', fontSize: 15 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#1a1a1a', borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 24, paddingBottom: 48, gap: 12, alignItems: 'center',
    borderTopWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.2)', marginBottom: 8 },
  cardAvatar: {
    width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)', borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)', marginBottom: 4,
  },
  cardName: { fontWeight: '900', fontSize: 22, color: 'white', textAlign: 'center' },
  cardPosition: { fontSize: 13, color: '#888', fontWeight: '500' },
  cardStats: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 16,
    paddingVertical: 16, paddingHorizontal: 24, width: '100%', marginTop: 8,
  },
  cardStat: { flex: 1, alignItems: 'center', gap: 4 },
  cardStatVal: { fontWeight: '800', fontSize: 20, color: 'white' },
  cardStatLab: { fontSize: 11, color: '#888', fontWeight: '500' },
  cardDivider: { width: 1, height: 30, backgroundColor: 'rgba(255,255,255,0.1)' },
  cardExtraRow: { flexDirection: 'row', width: '100%', gap: 8 },
  cardExtra: {
    flex: 1, alignItems: 'center', gap: 4, paddingVertical: 12,
    backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  cardExtraVal: { fontWeight: '700', fontSize: 16, color: 'white' },
  cardExtraLab: { fontSize: 11, color: '#666', fontWeight: '500' },
  closeBtn: {
    width: '100%', padding: 14, borderRadius: 24, alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', marginTop: 4,
  },
  closeBtnText: { fontWeight: '600', color: '#666', fontSize: 15 },
});
