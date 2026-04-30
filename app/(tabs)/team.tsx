import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { DAY_NAMES, MONTH_NAMES, OPPONENT_TEAMS, POSITIONS, POS_SHORT, generateDates } from '../../lib/constants';

type Member = { id: number; name: string; position: string; ovr: number; captain?: boolean };
type Team = { id: string; name: string; ovr: number; wins: number; draws: number; losses: number; captain: boolean; members: Member[] };

const INITIAL_TEAMS: Team[] = [
  {
    id: '1', name: 'FC Wolves', ovr: 88.4, wins: 12, draws: 3, losses: 5, captain: true,
    members: [
      { id: 1, name: 'Pedri Gonzalez', position: 'Midfielder', ovr: 93.3, captain: true },
      { id: 2, name: 'Ahmed Al Balushi', position: 'Forward', ovr: 88.1 },
      { id: 3, name: 'Khalid Al Farsi', position: 'Defender', ovr: 85.6 },
      { id: 4, name: 'Omar Al Rashdi', position: 'Goalkeeper', ovr: 87.2 },
      { id: 5, name: 'Salim Al Habsi', position: 'Midfielder', ovr: 84.9 },
    ],
  },
  {
    id: '2', name: 'Desert Eagles', ovr: 85.1, wins: 7, draws: 5, losses: 8, captain: false,
    members: [
      { id: 1, name: 'Faisal Al Khaifi', position: 'Forward', ovr: 91.0, captain: true },
      { id: 2, name: 'Pedri Gonzalez', position: 'Midfielder', ovr: 93.3 },
      { id: 3, name: 'Tariq Al Siyabi', position: 'Defender', ovr: 82.4 },
    ],
  },
];

const DATES = generateDates(7);

export default function TeamScreen() {
  const [teams, setTeams] = useState<Team[]>(INITIAL_TEAMS);

  const [showCreate, setShowCreate] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');

  const [inviteTeamId, setInviteTeamId] = useState<string | null>(null);
  const [inviteUsername, setInviteUsername] = useState('');
  const [invitePosition, setInvitePosition] = useState('Midfielder');
  const [inviteDone, setInviteDone] = useState(false);

  const [challengeTeamId, setChallengeTeamId] = useState<string | null>(null);
  const [selectedOpponent, setSelectedOpponent] = useState('');
  const [challengeDate, setChallengeDate] = useState(DATES[0]);
  const [challengeDone, setChallengeDone] = useState(false);

  const handleCreateTeam = () => {
    if (!newTeamName.trim()) return;
    setTeams(prev => [...prev, {
      id: `new_${Date.now()}`,
      name: newTeamName.trim(),
      ovr: 70.0, wins: 0, draws: 0, losses: 0,
      captain: true, members: [],
    }]);
    setNewTeamName('');
    setShowCreate(false);
  };

  const handleInvite = () => {
    if (!inviteUsername.trim() || !inviteTeamId) return;
    setTeams(prev => prev.map(t => {
      if (t.id !== inviteTeamId) return t;
      return { ...t, members: [...t.members, { id: t.members.length + 1, name: inviteUsername.trim(), position: invitePosition, ovr: 70.0 }] };
    }));
    setInviteDone(true);
  };

  const closeInvite = () => {
    setInviteTeamId(null);
    setInviteUsername('');
    setInvitePosition('Midfielder');
    setInviteDone(false);
  };

  const handleChallenge = () => { if (selectedOpponent) setChallengeDone(true); };

  const closeChallenge = () => {
    setChallengeTeamId(null);
    setSelectedOpponent('');
    setChallengeDate(DATES[0]);
    setChallengeDone(false);
  };

  const challengingTeam = teams.find(t => t.id === challengeTeamId);
  const challengedOpponent = OPPONENT_TEAMS.find(o => o.id === selectedOpponent);

  return (
    <LinearGradient colors={['#2a2a2a', '#000000']} style={styles.container}>
      <StatusBar barStyle="light-content" />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

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
              onPress={() => router.push({ pathname: '/team-details', params: { id: team.id, name: team.name } })}
            >
              <View style={styles.teamTop}>
                <View style={styles.teamIcon}>
                  <Ionicons name="shield" size={28} color="white" />
                </View>
                <View style={styles.teamInfo}>
                  <View style={styles.nameRow}>
                    <Text style={styles.teamName}>{team.name}</Text>
                    {team.captain && (
                      <View style={styles.capBadge}>
                        <Text style={styles.capText}>Captain</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.teamOvr}>{team.ovr} OVR · {team.members.length} members</Text>
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

              {team.members.length > 0 ? (
                <View style={styles.memList}>
                  {team.members.slice(0, 4).map((member) => (
                    <View key={member.id} style={styles.memRow}>
                      <View style={styles.memAvatar}>
                        <Ionicons name="person" size={14} color="white" />
                      </View>
                      <View style={styles.memInfo}>
                        <View style={styles.memNameRow}>
                          <Text style={styles.memName}>{member.name}</Text>
                          {member.captain && <Ionicons name="star" size={11} color="#FFD700" />}
                        </View>
                        <Text style={styles.memPos}>{member.position}</Text>
                      </View>
                      <Text style={styles.memOvr}>{member.ovr}</Text>
                    </View>
                  ))}
                  {team.members.length > 4 && (
                    <Text style={styles.moreMembers}>+{team.members.length - 4} more</Text>
                  )}
                </View>
              ) : (
                <Text style={styles.noMembers}>No members yet — invite players to get started.</Text>
              )}
            </TouchableOpacity>

            <View style={styles.teamActions}>
              {team.captain && (
                <TouchableOpacity style={styles.inviteBtn} onPress={() => setInviteTeamId(team.id)}>
                  <Ionicons name="person-add-outline" size={15} color="white" />
                  <Text style={styles.invite}>Invite</Text>
                </TouchableOpacity>
              )}
              {team.captain && (
                <TouchableOpacity style={styles.challengeBtn} onPress={() => setChallengeTeamId(team.id)}>
                  <Ionicons name="shield-outline" size={15} color="white" />
                  <Text style={styles.challenge}>Challenge</Text>
                </TouchableOpacity>
              )}
            </View>

          </View>
        ))}

      </ScrollView>

      {/* Create Team Modal */}
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
              style={[styles.primaryBtn, !newTeamName.trim() && { opacity: 0.3 }]}
              onPress={handleCreateTeam}
              disabled={!newTeamName.trim()}
            >
              <Text style={styles.primaryText}>Create Team</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secBtn} onPress={() => { setShowCreate(false); setNewTeamName(''); }}>
              <Text style={styles.secText}>Cancel</Text>
            </TouchableOpacity>
          </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* Invite Player Modal */}
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
                <Text style={styles.fieldLabel}>Position</Text>
                <View style={styles.posRow}>
                  {POSITIONS.map((p) => (
                    <TouchableOpacity
                      key={p}
                      style={[styles.posChip, invitePosition === p && styles.posChipOn]}
                      onPress={() => setInvitePosition(p)}
                    >
                      <Text style={[styles.posText, invitePosition === p && { color: 'white' }]}>{POS_SHORT[p]}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <TouchableOpacity
                  style={[styles.primaryBtn, !inviteUsername.trim() && { opacity: 0.3 }]}
                  onPress={handleInvite}
                  disabled={!inviteUsername.trim()}
                >
                  <Text style={styles.primaryText}>Send Invite</Text>
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
                <Text style={styles.sheetTitle}>Invite Sent!</Text>
                <Text style={styles.sheetSub}>{inviteUsername} will get a notification to join your team.</Text>
                <TouchableOpacity style={styles.primaryBtn} onPress={closeInvite}>
                  <Text style={styles.primaryText}>Done</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* Challenge Modal */}
      <Modal visible={!!challengeTeamId} transparent animationType="slide">
        <View style={styles.overlay}>
          <ScrollView contentContainerStyle={styles.sheetScroll} showsVerticalScrollIndicator={false}>
            <View style={styles.sheet}>
              <View style={styles.handle} />
              {!challengeDone ? (
                <>
                  <Text style={styles.sheetTitle}>Challenge a Team</Text>
                  <Text style={styles.sheetSub}>
                    Representing <Text style={{ color: 'white', fontWeight: '700' }}>{challengingTeam?.name}</Text>
                  </Text>
                  <Text style={styles.fieldLabel}>Pick your opponent</Text>
                  <View style={styles.opponentList}>
                    {OPPONENT_TEAMS.map((opp) => (
                      <TouchableOpacity
                        key={opp.id}
                        style={[styles.opponentRow, selectedOpponent === opp.id && styles.opponentRowOn]}
                        onPress={() => setSelectedOpponent(opp.id)}
                      >
                        <View style={styles.oppAvatar}>
                          <Ionicons name="shield" size={16} color="white" />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.oppName}>{opp.name}</Text>
                          <Text style={styles.oppOvr}>{opp.ovr} OVR</Text>
                        </View>
                        {selectedOpponent === opp.id && <Ionicons name="checkmark-circle" size={20} color="white" />}
                      </TouchableOpacity>
                    ))}
                  </View>
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
                    style={[styles.primaryBtn, { marginTop: 8 }, !selectedOpponent && { opacity: 0.3 }]}
                    onPress={handleChallenge}
                    disabled={!selectedOpponent}
                  >
                    <Text style={styles.primaryText}>Send Challenge</Text>
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
                    {challengedOpponent?.name} has been challenged for{'\n'}
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

const styles = StyleSheet.create({
  container: { flex: 1 },
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
  memList: { gap: 8 },
  memRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  memAvatar: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.1)' },
  memInfo: { flex: 1, gap: 1 },
  memNameRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  memName: { fontWeight: '600', fontSize: 13, color: 'white' },
  memPos: { color: '#666', fontSize: 11 },
  memOvr: { fontWeight: '700', color: '#aaa', fontSize: 12 },
  moreMembers: { color: '#555', fontSize: 12, fontWeight: '500', marginTop: 2 },
  noMembers: { color: '#444', fontSize: 12, fontStyle: 'italic' },
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
  posRow: { flexDirection: 'row', gap: 8 },
  posChip: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', backgroundColor: 'rgba(255,255,255,0.05)' },
  posChipOn: { borderColor: 'rgba(255,255,255,0.4)', backgroundColor: 'rgba(255,255,255,0.15)' },
  posText: { fontWeight: '700', fontSize: 12, color: '#555' },
  primaryBtn: { padding: 16, borderRadius: 24, alignItems: 'center', backgroundColor: 'white' },
  primaryText: { fontWeight: '800', fontSize: 16, color: 'black' },
  secBtn: { padding: 14, borderRadius: 24, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  secText: { fontWeight: '600', color: '#666', fontSize: 15 },
  successIcon: { width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center', alignSelf: 'center', marginBottom: 4 },
  opponentList: { gap: 8 },
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
