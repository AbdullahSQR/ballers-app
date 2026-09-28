import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
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

const POSITION_LABELS: Record<string, string> = {
  GK: 'Goalkeeper', DEF: 'Defender', MID: 'Midfielder', ATT: 'Forward',
};

type TeamMember = {
  user: {
    id: string;
    username: string;
    avatar_url: string | null;
    player_profile: { position: string; ovr: number } | null;
  };
};

type Team = {
  id: string;
  name: string;
  ovr: number;
  wins: number;
  draws: number;
  losses: number;
  captain_id: string;
  captain: { id: string; username: string; avatar_url: string | null };
  members: TeamMember[];
  created_at: string;
};

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function TeamDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();

  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);

  // Invite modal
  const [showInvite, setShowInvite] = useState(false);
  const [inviteUsername, setInviteUsername] = useState('');
  const [inviteDone, setInviteDone] = useState(false);
  const [inviting, setInviting] = useState(false);

  // Member card modal
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);

  // ── Fetch ─────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      try {
        const res = await api.get(`/teams/${id}`);
        setTeam(res.data.data);
      } catch (err: any) {
        Alert.alert('Error', err.message ?? 'Could not load team.');
        router.back();
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  // ── Computed ──────────────────────────────────────────────────────────────

  const isCaptain = team ? team.captain_id === user?.id : false;
  const matchesPlayed = team ? team.wins + team.draws + team.losses : 0;
  const winRate = matchesPlayed > 0 ? Math.round((team!.wins / matchesPlayed) * 100) : 0;

  // ── Invite ────────────────────────────────────────────────────────────────

  const handleInvite = async () => {
    if (!inviteUsername.trim() || !id) return;
    setInviting(true);
    try {
      await api.post(`/teams/${id}/members`, { username: inviteUsername.trim() });
      setInviteDone(true);
      // refresh
      const res = await api.get(`/teams/${id}`);
      setTeam(res.data.data);
    } catch (err: any) {
      Alert.alert(
        'Error',
        err.code === 'USER_NOT_FOUND' ? 'Player not found.' :
        err.code === 'ALREADY_MEMBER' ? 'That player is already in your team.' :
        err.message ?? 'Could not add player.'
      );
    } finally {
      setInviting(false);
    }
  };

  const closeInvite = () => {
    setShowInvite(false);
    setInviteUsername('');
    setInviteDone(false);
    setInviting(false);
  };

  // ── Leave ─────────────────────────────────────────────────────────────────

  const confirmLeave = () => {
    Alert.alert(
      'Leave Team',
      `Are you sure you want to leave ${team?.name}? You'll need to be re-added to rejoin.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/teams/${id}/leave`);
              router.back();
            } catch (err: any) {
              Alert.alert('Error', err.message ?? 'Could not leave team.');
            }
          },
        },
      ]
    );
  };

  // ── Remove member (captain only) ──────────────────────────────────────────

  const confirmRemove = (member: TeamMember) => {
    if (!isCaptain || member.user.id === user?.id) return;
    Alert.alert(
      'Remove Member',
      `Remove ${member.user.username} from the team?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/teams/${id}/members/${member.user.id}`);
              const res = await api.get(`/teams/${id}`);
              setTeam(res.data.data);
              setSelectedMember(null);
            } catch (err: any) {
              Alert.alert('Error', err.message ?? 'Could not remove member.');
            }
          },
        },
      ]
    );
  };

  // ── Render ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <LinearGradient colors={['#2a2a2a', '#000000']} style={styles.center}>
        <ActivityIndicator color="#FFD700" size="large" />
      </LinearGradient>
    );
  }

  if (!team) return null;

  const formed = new Date(team.created_at).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });

  return (
    <LinearGradient colors={['#2a2a2a', '#000000']} style={styles.container}>
      <StatusBar barStyle="light-content" />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.back}>←</Text>
        </TouchableOpacity>

        {/* Header */}
        <View style={styles.teamHeader}>
          <View style={styles.teamIcon}>
            <Ionicons name="shield" size={40} color="white" />
          </View>
          <View style={styles.nameRow}>
            <Text style={styles.teamName}>{team.name}</Text>
            {isCaptain && (
              <View style={styles.capBadge}>
                <Text style={styles.capBadgeText}>Captain</Text>
              </View>
            )}
          </View>
          <Text style={styles.ovr}>{team.ovr.toFixed(1)} OVR</Text>
          <Text style={styles.formed}>Formed {formed}</Text>
        </View>

        {/* Stats */}
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
          <View style={styles.statDiv} />
          <View style={styles.statBox}>
            <Text style={styles.statVal}>{winRate}%</Text>
            <Text style={styles.statLab}>Win Rate</Text>
          </View>
        </View>

        {/* Members */}
        <View style={styles.section}>
          <View style={styles.secHeader}>
            <Text style={styles.secTitle}>Members</Text>
            <Text style={styles.memCount}>{team.members.length}/12</Text>
          </View>
          <View style={styles.progBack}>
            <View style={[styles.progFill, { width: `${(team.members.length / 12) * 100}%` }]} />
          </View>
          <View style={styles.memList}>
            {team.members.map((m) => {
              const isCapt = m.user.id === team.captain_id;
              const pos = m.user.player_profile?.position;
              const ovr = m.user.player_profile?.ovr;
              return (
                <TouchableOpacity
                  key={m.user.id}
                  style={styles.memRow}
                  activeOpacity={0.7}
                  onPress={() => setSelectedMember(m)}
                >
                  <View style={styles.memAvatar}>
                    <Ionicons name="person" size={18} color="white" />
                  </View>
                  <View style={styles.memInfo}>
                    <View style={styles.memNameRow}>
                      <Text style={styles.memName}>{m.user.username}</Text>
                      {isCapt && <Ionicons name="star" size={12} color="#FFD700" />}
                    </View>
                    <Text style={styles.memPos}>{pos ? POSITION_LABELS[pos] ?? pos : 'Unknown'}</Text>
                  </View>
                  <Text style={styles.memOvr}>{ovr ?? '—'} OVR</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          {isCaptain && (
            <TouchableOpacity style={styles.inviteBtn} onPress={() => setShowInvite(true)}>
              <Ionicons name="person-add-outline" size={18} color="white" />
              <Text style={styles.invite}>Invite Player</Text>
            </TouchableOpacity>
          )}
          {!isCaptain && (
            <TouchableOpacity style={styles.leaveBtn} onPress={confirmLeave}>
              <Text style={styles.leave}>Leave Team</Text>
            </TouchableOpacity>
          )}
        </View>

      </ScrollView>

      {/* ── Invite Modal ── */}
      <Modal visible={showInvite} transparent animationType="slide">
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
                  <Text style={styles.sheetSub}>{inviteUsername} has been added to the team.</Text>
                  <TouchableOpacity style={styles.primaryBtn} onPress={closeInvite}>
                    <Text style={styles.primaryText}>Done</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* ── Member Card Modal ── */}
      <Modal visible={!!selectedMember} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={[styles.sheet, { alignItems: 'center' }]}>
            <View style={styles.handle} />
            {selectedMember && (() => {
              const m = selectedMember;
              const isCapt = m.user.id === team.captain_id;
              const pos = m.user.player_profile?.position;
              const ovr = m.user.player_profile?.ovr;
              return (
                <>
                  <View style={styles.memberCardAvatar}>
                    <Ionicons name="person" size={36} color="white" />
                    {isCapt && (
                      <View style={styles.captainBadge}>
                        <Ionicons name="star" size={10} color="#FFD700" />
                      </View>
                    )}
                  </View>
                  <Text style={styles.sheetTitle}>{m.user.username}</Text>
                  <Text style={styles.sheetSub}>{pos ? POSITION_LABELS[pos] ?? pos : 'Unknown position'}</Text>
                  <View style={styles.memberCardStats}>
                    <View style={styles.memberCardStat}>
                      <Text style={styles.memberCardVal}>{ovr ?? '—'}</Text>
                      <Text style={styles.memberCardLab}>OVR</Text>
                    </View>
                    <View style={styles.statDiv} />
                    <View style={styles.memberCardStat}>
                      <Text style={styles.memberCardVal}>{pos ?? '—'}</Text>
                      <Text style={styles.memberCardLab}>Position</Text>
                    </View>
                    <View style={styles.statDiv} />
                    <View style={styles.memberCardStat}>
                      <Text style={styles.memberCardVal}>{isCapt ? 'Yes' : 'No'}</Text>
                      <Text style={styles.memberCardLab}>Captain</Text>
                    </View>
                  </View>
                  {isCaptain && m.user.id !== user?.id && (
                    <TouchableOpacity style={styles.removeFromTeamBtn} onPress={() => confirmRemove(m)}>
                      <Text style={styles.removeFromTeamText}>Remove from Team</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity style={[styles.secBtn, { width: '100%' }]} onPress={() => setSelectedMember(null)}>
                    <Text style={styles.secText}>Close</Text>
                  </TouchableOpacity>
                </>
              );
            })()}
          </View>
        </View>
      </Modal>

    </LinearGradient>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { paddingTop: 60, paddingHorizontal: 22, gap: 16, paddingBottom: 110 },
  backBtn: { marginBottom: 8 },
  back: { fontSize: 24, color: 'white' },
  teamHeader: { gap: 8, paddingVertical: 16, alignItems: 'center' },
  teamIcon: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.1)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', marginBottom: 8 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  teamName: { fontWeight: '900', color: 'white', fontSize: 26, letterSpacing: 0.5 },
  capBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, backgroundColor: 'rgba(255,215,0,0.2)', borderWidth: 1, borderColor: 'rgba(255,215,0,0.4)' },
  capBadgeText: { fontWeight: '700', color: '#FFD700', fontSize: 10 },
  ovr: { fontSize: 15, color: '#aaa', fontWeight: '600' },
  formed: { color: '#666', fontSize: 12 },
  stats: { flexDirection: 'row', padding: 16, borderRadius: 16, alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.08)', justifyContent: 'space-between', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' },
  statBox: { alignItems: 'center', flex: 1, gap: 4 },
  statVal: { fontWeight: '800', fontSize: 18, color: 'white' },
  statLab: { fontSize: 11, color: '#888', fontWeight: '500' },
  statDiv: { height: 30, width: 1, backgroundColor: 'rgba(255,255,255,0.1)' },
  section: { gap: 12 },
  secHeader: { justifyContent: 'space-between', flexDirection: 'row', alignItems: 'center' },
  secTitle: { fontSize: 16, color: 'white', fontWeight: '800' },
  memCount: { fontWeight: '600', color: '#888', fontSize: 13 },
  progBack: { borderRadius: 2, height: 4, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.1)' },
  progFill: { height: '100%', borderRadius: 2, backgroundColor: 'white' },
  memList: { gap: 12 },
  memRow: { borderRadius: 12, flexDirection: 'row', alignItems: 'center', padding: 12, gap: 12, backgroundColor: 'rgba(255,255,255,0.05)' },
  memAvatar: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.1)' },
  memInfo: { gap: 2, flex: 1 },
  memNameRow: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  memName: { fontWeight: '600', fontSize: 14, color: 'white' },
  memPos: { fontSize: 12, color: '#888' },
  memOvr: { color: '#aaa', fontWeight: '700', fontSize: 13 },
  actions: { gap: 10 },
  inviteBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 14, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  invite: { fontSize: 15, color: 'white', fontWeight: '600' },
  leaveBtn: { padding: 14, alignItems: 'center', borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,0,0,0.3)' },
  leave: { fontSize: 15, fontWeight: '600', color: '#ff6b6b' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#1a1a1a', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 48, gap: 14, borderTopWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.2)', alignSelf: 'center', marginBottom: 8 },
  sheetTitle: { fontWeight: '900', fontSize: 22, color: 'white' },
  sheetSub: { color: '#666', fontSize: 13, lineHeight: 20 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 13, borderWidth: 1, backgroundColor: 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.12)' },
  input: { flex: 1, color: 'white', fontSize: 15 },
  primaryBtn: { padding: 16, borderRadius: 24, alignItems: 'center', backgroundColor: 'white' },
  primaryText: { fontWeight: '800', fontSize: 16, color: 'black' },
  secBtn: { padding: 14, borderRadius: 24, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  secText: { fontWeight: '600', color: '#666', fontSize: 15 },
  successIcon: { width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center', alignSelf: 'center', marginBottom: 4 },
  memberCardAvatar: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.1)', borderWidth: 2, borderColor: 'rgba(255,255,255,0.2)', marginBottom: 4, position: 'relative' },
  captainBadge: { position: 'absolute', bottom: 2, right: 2, width: 20, height: 20, borderRadius: 10, backgroundColor: 'rgba(255,215,0,0.2)', borderWidth: 1, borderColor: 'rgba(255,215,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  memberCardStats: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 16, paddingVertical: 16, paddingHorizontal: 24, width: '100%', marginTop: 4 },
  memberCardStat: { flex: 1, alignItems: 'center', gap: 4 },
  memberCardVal: { fontWeight: '800', fontSize: 20, color: 'white' },
  memberCardLab: { fontSize: 11, color: '#888', fontWeight: '500' },
  removeFromTeamBtn: { width: '100%', padding: 14, borderRadius: 24, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,80,80,0.3)', backgroundColor: 'rgba(255,80,80,0.08)' },
  removeFromTeamText: { fontWeight: '700', color: '#ff6b6b', fontSize: 14 },
});
