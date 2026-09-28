import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { DAY_NAMES, MONTH_NAMES, generateDates } from '../../lib/constants';
import { useAuth } from '@/lib/auth-context';
import api from '@/lib/api';

// ─── Types ────────────────────────────────────────────────────────────────────

type MyTeam = {
  id: string;
  name: string;
  logo_url: string | null;
  is_captain: boolean;
  member_count: number;
  ovr: number;
  wins: number;
  draws: number;
  losses: number;
};

type LeaderboardTeam = {
  rank: number;
  id: string;
  name: string;
  ovr: number;
};

const DATES = generateDates(14);

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function TeamScreen() {
  const { user } = useAuth();

  const [teams, setTeams] = useState<MyTeam[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Create team modal
  const [showCreate, setShowCreate] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [creating, setCreating] = useState(false);

  // Invite modal
  const [inviteTeamId, setInviteTeamId] = useState<string | null>(null);
  const [inviteUsername, setInviteUsername] = useState('');
  const [inviteDone, setInviteDone] = useState(false);
  const [inviting, setInviting] = useState(false);

  // Challenge modal
  const [challengeTeam, setChallengeTeam] = useState<MyTeam | null>(null);
  const [opponents, setOpponents] = useState<LeaderboardTeam[]>([]);
  const [opponentId, setOpponentId] = useState('');
  const [challengeDate, setChallengeDate] = useState(DATES[0]);
  const [challengeDone, setChallengeDone] = useState(false);
  const [challengeSending, setChallengeSending] = useState(false);
  const [challengedName, setChallengedName] = useState('');

  // ── Data ─────────────────────────────────────────────────────────────────

  const fetchTeams = useCallback(async () => {
    try {
      const res = await api.get('/teams');
      setTeams(res.data.data ?? []);
    } catch {
      // silently fail
    }
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await fetchTeams();
      setLoading(false);
    })();
  }, [fetchTeams]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchTeams();
    setRefreshing(false);
  }, [fetchTeams]);

  // ── Create team ───────────────────────────────────────────────────────────

  const handleCreateTeam = async () => {
    if (!newTeamName.trim()) return;
    setCreating(true);
    try {
      await api.post('/teams', { name: newTeamName.trim() });
      setNewTeamName('');
      setShowCreate(false);
      await fetchTeams();
    } catch (err: any) {
      Alert.alert('Error', err.message ?? 'Could not create team.');
    } finally {
      setCreating(false);
    }
  };

  // ── Invite ────────────────────────────────────────────────────────────────

  const handleInvite = async () => {
    if (!inviteUsername.trim() || !inviteTeamId) return;
    setInviting(true);
    try {
      await api.post(`/teams/${inviteTeamId}/members`, { username: inviteUsername.trim() });
      setInviteDone(true);
      await fetchTeams();
    } catch (err: any) {
      Alert.alert(
        'Error',
        err.code === 'USER_NOT_FOUND' ? 'Player not found.' :
        err.code === 'ALREADY_MEMBER' ? 'That player is already in your team.' :
        err.message ?? 'Could not send invite.'
      );
    } finally {
      setInviting(false);
    }
  };

  const closeInvite = () => {
    setInviteTeamId(null);
    setInviteUsername('');
    setInviteDone(false);
    setInviting(false);
  };

  // ── Challenge ─────────────────────────────────────────────────────────────

  const openChallenge = async (team: MyTeam) => {
    setChallengeTeam(team);
    setOpponentId('');
    setChallengeDate(DATES[0]);
    setChallengeDone(false);

    try {
      const res = await api.get('/leaderboard/teams');
      const all: LeaderboardTeam[] = res.data.data ?? [];
      const myIds = new Set(teams.map(t => t.id));
      setOpponents(all.filter(t => !myIds.has(t.id)));
    } catch {
      setOpponents([]);
    }
  };

  const closeChallenge = () => {
    setChallengeTeam(null);
    setOpponentId('');
    setChallengeDone(false);
    setChallengeSending(false);
  };

  const sendChallenge = async () => {
    if (!challengeTeam || !opponentId) return;
    setChallengeSending(true);
    try {
      const date = new Date(challengeDate);
      date.setHours(18, 0, 0, 0);
      await api.post('/challenges', {
        my_team_id: challengeTeam.id,
        opponent_team_id: opponentId,
        scheduled_at: date.toISOString(),
      });
      const opp = opponents.find(t => t.id === opponentId);
      setChallengedName(opp?.name ?? 'the team');
      setChallengeDone(true);
    } catch (err: any) {
      Alert.alert(
        'Error',
        err.code === 'CHALLENGE_PENDING' ? 'A challenge is already pending against this team.' :
        err.message ?? 'Could not send challenge.'
      );
    } finally {
      setChallengeSending(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <LinearGradient colors={['#2a2a2a', '#000000']} style={styles.center}>
        <ActivityIndicator color="#FFD700" size="large" />
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
          <View>
            <Text style={styles.headTitle}>My Teams</Text>
            <Text style={styles.headSub}>{teams.length}/3 teams</Text>
          </View>
          {teams.length < 3 && (
            <TouchableOpacity style={styles.createBtn} onPress={() => setShowCreate(true)}>
              <Ionicons name="add" size={20} color="black" />
              <Text style={styles.createText}>New Team</Text>
            </TouchableOpacity>
          )}
        </View>

        {teams.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="shield-outline" size={48} color="#333" />
            <Text style={styles.emptyTitle}>No teams yet</Text>
            <Text style={styles.emptySub}>Create your first team and start competing.</Text>
          </View>
        )}

        {teams.map((team) => (
          <View key={team.id} style={styles.teamCard}>

            <TouchableOpacity
              activeOpacity={0.7}
              style={{ gap: 14 }}
              onPress={() => router.push({ pathname: '/team-details', params: { id: team.id } })}
            >
              <View style={styles.teamTop}>
                <View style={styles.teamIcon}>
                  <Ionicons name="shield" size={28} color="white" />
                </View>
                <View style={styles.teamInfo}>
                  <View style={styles.nameRow}>
                    <Text style={styles.teamName}>{team.name}</Text>
                    {team.is_captain && (
                      <View style={styles.capBadge}>
                        <Text style={styles.capText}>Captain</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.teamOvr}>{team.ovr.toFixed(1)} OVR · {team.member_count} members</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#444" />
              </View>

              <View style={styles.stats}>
                <View style={styles.statBox}>
                  <Text style={styles.statVal}>{team.wins}</Text>
                  <Text style={styles.statLab}>Wins</Text>
                </View>
                <View style={styles.statDiv} />
                <View style={styles.statBox}>
                  <Text style={styles.statVal}>{team.draws}</Text>
                  <Text style={styles.statLab}>Draws</Text>
                </View>
                <View style={styles.statDiv} />
                <View style={styles.statBox}>
                  <Text style={styles.statVal}>{team.losses}</Text>
                  <Text style={styles.statLab}>Losses</Text>
                </View>
              </View>
            </TouchableOpacity>

            {team.is_captain && (
              <View style={styles.teamActions}>
                <TouchableOpacity style={styles.inviteBtn} onPress={() => { setInviteTeamId(team.id); setInviteDone(false); }}>
                  <Ionicons name="person-add-outline" size={15} color="white" />
                  <Text style={styles.invite}>Invite</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.challengeBtn} onPress={() => openChallenge(team)}>
                  <Ionicons name="shield-outline" size={15} color="white" />
                  <Text style={styles.challenge}>Challenge</Text>
                </TouchableOpacity>
              </View>
            )}

          </View>
        ))}
      </ScrollView>

      {/* ── Create Team Modal ── */}
      <Modal visible={showCreate} transparent animationType="slide">
        <View style={styles.overlay}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <View style={styles.sheet}>
              <View style={styles.handle} />
              <Text style={styles.sheetTitle}>New Team</Text>
              <Text style={styles.sheetSub}>You'll be set as captain automatically.</Text>
              <View style={styles.inputWrap}>
                <TextInput
                  style={styles.input}
                  placeholder="Team name"
                  placeholderTextColor="#555"
                  value={newTeamName}
                  onChangeText={setNewTeamName}
                  autoFocus
                />
              </View>
              <TouchableOpacity
                style={[styles.primaryBtn, (!newTeamName.trim() || creating) && { opacity: 0.3 }]}
                onPress={handleCreateTeam}
                disabled={!newTeamName.trim() || creating}
              >
                {creating
                  ? <ActivityIndicator color="black" />
                  : <Text style={styles.primaryText}>Create Team</Text>
                }
              </TouchableOpacity>
              <TouchableOpacity style={styles.secBtn} onPress={() => { setShowCreate(false); setNewTeamName(''); }}>
                <Text style={styles.secText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* ── Invite Player Modal ── */}
      <Modal visible={!!inviteTeamId} transparent animationType="slide">
        <View style={styles.overlay}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <View style={styles.sheet}>
              <View style={styles.handle} />
              {!inviteDone ? (
                <>
                  <Text style={styles.sheetTitle}>Invite Player</Text>
                  <Text style={styles.sheetSub}>Enter their Ballers username.</Text>
                  <View style={styles.inputWrap}>
                    <Ionicons name="person-outline" size={16} color="#555" />
                    <TextInput
                      style={styles.input}
                      placeholder="Username"
                      placeholderTextColor="#555"
                      value={inviteUsername}
                      onChangeText={setInviteUsername}
                      autoCapitalize="none"
                      autoFocus
                    />
                  </View>
                  <TouchableOpacity
                    style={[styles.primaryBtn, (!inviteUsername.trim() || inviting) && { opacity: 0.3 }]}
                    onPress={handleInvite}
                    disabled={!inviteUsername.trim() || inviting}
                  >
                    {inviting
                      ? <ActivityIndicator color="black" />
                      : <Text style={styles.primaryText}>Add to Team</Text>
                    }
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.secBtn} onPress={closeInvite}>
                    <Text style={styles.secText}>Cancel</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <View style={styles.successIcon}>
                    <Ionicons name="checkmark" size={32} color="white" />
                  </View>
                  <Text style={styles.sheetTitle}>Player Added!</Text>
                  <Text style={styles.sheetSub}>{inviteUsername} has been added to your team.</Text>
                  <TouchableOpacity style={styles.primaryBtn} onPress={closeInvite}>
                    <Text style={styles.primaryText}>Done</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* ── Challenge Modal ── */}
      <Modal visible={!!challengeTeam} transparent animationType="slide">
        <View style={styles.overlay}>
          <ScrollView contentContainerStyle={styles.sheetScroll} showsVerticalScrollIndicator={false}>
            <View style={styles.sheet}>
              <View style={styles.handle} />
              {!challengeDone ? (
                <>
                  <Text style={styles.sheetTitle}>Challenge a Team</Text>
                  <Text style={styles.sheetSub}>
                    Representing <Text style={{ color: 'white', fontWeight: '700' }}>{challengeTeam?.name}</Text>
                  </Text>
                  {opponents.length === 0 ? (
                    <View style={styles.emptyState}>
                      <Ionicons name="search-outline" size={36} color="#333" />
                      <Text style={styles.emptySub}>No other teams available yet.</Text>
                    </View>
                  ) : (
                    <View style={{ gap: 8 }}>
                      {opponents.map((opp) => (
                        <TouchableOpacity
                          key={opp.id}
                          style={[styles.opponentRow, opponentId === opp.id && styles.opponentRowOn]}
                          onPress={() => setOpponentId(opp.id)}
                        >
                          <View style={styles.oppAvatar}>
                            <Ionicons name="shield" size={16} color="white" />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.oppName}>{opp.name}</Text>
                            <Text style={styles.oppOvr}>{opp.ovr.toFixed(1)} OVR · Rank #{opp.rank}</Text>
                          </View>
                          {opponentId === opp.id && <Ionicons name="checkmark-circle" size={20} color="white" />}
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                  <Text style={styles.fieldLabel}>Preferred date</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 4 }}>
                    {DATES.map((d, i) => {
                      const on = d.toDateString() === challengeDate.toDateString();
                      return (
                        <TouchableOpacity key={i} style={[styles.dateChip, on && styles.dateChipOn]} onPress={() => setChallengeDate(d)}>
                          <Text style={[styles.dayName, on && { color: '#bbb' }]}>{DAY_NAMES[d.getDay()]}</Text>
                          <Text style={[styles.dayNum, on && { color: 'white' }]}>{d.getDate()}</Text>
                          <Text style={[styles.dayMon, on && { color: '#aaa' }]}>{MONTH_NAMES[d.getMonth()]}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                  <TouchableOpacity
                    style={[styles.primaryBtn, (!opponentId || challengeSending) && { opacity: 0.3 }]}
                    onPress={sendChallenge}
                    disabled={!opponentId || challengeSending}
                  >
                    {challengeSending
                      ? <ActivityIndicator color="black" />
                      : <Text style={styles.primaryText}>Send Challenge</Text>
                    }
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.secBtn} onPress={closeChallenge}>
                    <Text style={styles.secText}>Cancel</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <View style={styles.successIcon}>
                    <Ionicons name="checkmark" size={32} color="white" />
                  </View>
                  <Text style={styles.sheetTitle}>Challenge Sent!</Text>
                  <Text style={styles.sheetSub}>
                    {challengedName} has been challenged for{'\n'}
                    {DAY_NAMES[challengeDate.getDay()]}, {MONTH_NAMES[challengeDate.getMonth()]} {challengeDate.getDate()}.
                  </Text>
                  <TouchableOpacity style={styles.primaryBtn} onPress={closeChallenge}>
                    <Text style={styles.primaryText}>Done</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </ScrollView>
        </View>
      </Modal>

    </LinearGradient>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { paddingTop: 65, paddingHorizontal: 22, gap: 16, paddingBottom: 110 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  headTitle: { fontWeight: '900', fontSize: 26, color: 'white', letterSpacing: 0.3 },
  headSub: { marginTop: 2, color: '#888', fontSize: 13 },
  createBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, backgroundColor: 'white' },
  createText: { fontWeight: '700', color: 'black', fontSize: 13 },
  emptyState: { alignItems: 'center', paddingVertical: 60, gap: 12 },
  emptyTitle: { fontWeight: '800', color: '#555', fontSize: 18 },
  emptySub: { color: '#444', fontSize: 13, textAlign: 'center' },
  teamCard: { borderWidth: 1, borderRadius: 20, padding: 18, gap: 14, backgroundColor: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.12)' },
  teamTop: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  teamIcon: { width: 52, height: 52, borderRadius: 26, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.1)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
  teamInfo: { flex: 1, gap: 4 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  teamName: { fontWeight: '800', color: 'white', fontSize: 17 },
  capBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, backgroundColor: 'rgba(255,215,0,0.2)', borderWidth: 1, borderColor: 'rgba(255,215,0,0.4)' },
  capText: { fontWeight: '700', color: '#FFD700', fontSize: 10 },
  teamOvr: { fontSize: 12, color: '#888', fontWeight: '500' },
  stats: { flexDirection: 'row', padding: 12, borderRadius: 12, alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'space-between' },
  statBox: { flex: 1, alignItems: 'center', gap: 3 },
  statVal: { fontWeight: '800', fontSize: 17, color: 'white' },
  statLab: { color: '#888', fontWeight: '500', fontSize: 11 },
  statDiv: { height: 28, width: 1, backgroundColor: 'rgba(255,255,255,0.1)' },
  teamActions: { flexDirection: 'row', gap: 10, marginTop: 2 },
  inviteBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, padding: 11, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  invite: { fontWeight: '600', color: 'white', fontSize: 13 },
  challengeBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, padding: 11, borderRadius: 12, borderWidth: 1, backgroundColor: 'rgba(255,255,255,0.12)', borderColor: 'rgba(255,255,255,0.2)' },
  challenge: { fontWeight: '600', color: 'white', fontSize: 13 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  sheetScroll: { justifyContent: 'flex-end', flexGrow: 1 },
  sheet: { backgroundColor: '#1a1a1a', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 48, gap: 14, borderTopWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.2)', alignSelf: 'center', marginBottom: 8 },
  sheetTitle: { fontWeight: '900', fontSize: 22, color: 'white' },
  sheetSub: { color: '#666', fontSize: 13, lineHeight: 20 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 13, borderWidth: 1, backgroundColor: 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.12)' },
  input: { flex: 1, color: 'white', fontSize: 15 },
  fieldLabel: { fontWeight: '700', fontSize: 12, color: '#666', textTransform: 'uppercase', letterSpacing: 0.5 },
  primaryBtn: { padding: 16, borderRadius: 24, alignItems: 'center', backgroundColor: 'white' },
  primaryText: { fontWeight: '800', fontSize: 16, color: 'black' },
  secBtn: { padding: 14, borderRadius: 24, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  secText: { fontWeight: '600', color: '#666', fontSize: 15 },
  successIcon: { width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center', alignSelf: 'center', marginBottom: 4 },
  opponentRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', backgroundColor: 'rgba(255,255,255,0.05)' },
  opponentRowOn: { borderColor: 'rgba(255,255,255,0.4)', backgroundColor: 'rgba(255,255,255,0.12)' },
  oppAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
  oppName: { fontWeight: '700', color: 'white', fontSize: 14 },
  oppOvr: { color: '#666', fontSize: 12 },
  dateChip: { alignItems: 'center', paddingVertical: 10, paddingHorizontal: 12, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', backgroundColor: 'rgba(255,255,255,0.05)', gap: 2 },
  dateChipOn: { borderColor: 'rgba(255,255,255,0.4)', backgroundColor: 'rgba(255,255,255,0.15)' },
  dayName: { fontSize: 10, color: '#555', fontWeight: '600' },
  dayNum: { fontSize: 16, fontWeight: '800', color: '#555' },
  dayMon: { fontSize: 9, color: '#444', fontWeight: '500' },
});
