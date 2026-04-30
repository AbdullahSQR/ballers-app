import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { POSITIONS, POS_SHORT } from '../lib/constants';

type Member = { id: number; name: string; position: string; ovr: number; captain?: boolean };
type Team = { id: number; name: string; ovr: number; wins: number; draws: number; losses: number; captain: boolean; formed: string; matchesPlayed: number; members: Member[] };

const teamsData: { [key: string]: Team } = {
  '1': {
    id: 1, name: 'FC Wolves', ovr: 88.4, wins: 12, draws: 3, losses: 5,
    captain: true, formed: 'January 2024', matchesPlayed: 20,
    members: [
      { id: 1, name: 'Pedri Gonzalez', position: 'Midfielder', ovr: 93.3, captain: true },
      { id: 2, name: 'Ahmed Al Balushi', position: 'Forward', ovr: 88.1 },
      { id: 3, name: 'Khalid Al Farsi', position: 'Defender', ovr: 85.6 },
      { id: 4, name: 'Omar Al Rashdi', position: 'Goalkeeper', ovr: 87.2 },
      { id: 5, name: 'Salim Al Habsi', position: 'Midfielder', ovr: 84.9 },
    ],
  },
  '2': {
    id: 2, name: 'Desert Eagles', ovr: 85.1, wins: 7, draws: 5, losses: 8,
    captain: false, formed: 'March 2024', matchesPlayed: 20,
    members: [
      { id: 1, name: 'Faisal Al Maqbali', position: 'Forward', ovr: 91.0, captain: true },
      { id: 2, name: 'Pedri Gonzalez', position: 'Midfielder', ovr: 93.3 },
      { id: 3, name: 'Tariq Al Siyabi', position: 'Defender', ovr: 82.4 },
    ],
  },
};



export default function TeamDetailsScreen() {
  const { id, name } = useLocalSearchParams<{ id: string; name?: string }>();
  const team = teamsData[id];

  const [showInvite, setShowInvite] = useState(false);
  const [inviteUsername, setInviteUsername] = useState('');
  const [invitePosition, setInvitePosition] = useState('Midfielder');
  const [inviteDone, setInviteDone] = useState(false);

  const [showLeave, setShowLeave] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

  const closeInvite = () => { setShowInvite(false); setInviteUsername(''); setInvitePosition('Midfielder'); setInviteDone(false); };

  if (!team) {
    return (
      <LinearGradient colors={['#2a2a2a', '#000000']} style={styles.container}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.back}>←</Text>
          </TouchableOpacity>
          <View style={styles.teamHeader}>
            <View style={styles.teamIcon}>
              <Ionicons name="shield" size={40} color="white" />
            </View>
            <Text style={styles.teamName}>{name ?? 'New Team'}</Text>
            <View style={styles.capBadge}><Text style={styles.capBadgeText}>Captain</Text></View>
            <Text style={styles.formed}>Just created</Text>
          </View>
          <View style={styles.emptyTeam}>
            <Ionicons name="people-outline" size={44} color="#333" />
            <Text style={styles.emptyTitle}>No members yet</Text>
            <Text style={styles.emptySub}>Go back to your teams and invite players to get started.</Text>
          </View>
        </ScrollView>
      </LinearGradient>
    );
  }

  const winRate = Math.round((team.wins / team.matchesPlayed) * 100);

  return (
    <LinearGradient colors={['#2a2a2a', '#000000']} style={styles.container}>
      <StatusBar barStyle="light-content" />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.back}>←</Text>
        </TouchableOpacity>

        <View style={styles.teamHeader}>
          <View style={styles.teamIcon}>
            <Ionicons name="shield" size={40} color="white" />
          </View>
          <View style={styles.nameRow}>
            <Text style={styles.teamName}>{team.name}</Text>
            {team.captain && (
              <View style={styles.capBadge}>
                <Text style={styles.capBadgeText}>Captain</Text>
              </View>
            )}
          </View>
          <Text style={styles.ovr}>{team.ovr} OVR</Text>
          <Text style={styles.formed}>Formed {team.formed}</Text>
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
          <View style={styles.statDiv} />
          <View style={styles.statBox}>
            <Text style={styles.statVal}>{winRate}%</Text>
            <Text style={styles.statLab}>Win Rate</Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.secHeader}>
            <Text style={styles.secTitle}>Members</Text>
            <Text style={styles.memCount}>{team.members.length}/12</Text>
          </View>
          <View style={styles.progBack}>
            <View style={[styles.progFill, { width: `${(team.members.length / 12) * 100}%` }]} />
          </View>
          <View style={styles.memList}>
            {team.members.map((member) => (
              <TouchableOpacity key={member.id} style={styles.memRow} activeOpacity={0.7} onPress={() => setSelectedMember(member)}>
                <View style={styles.memAvatar}>
                  <Ionicons name="person" size={18} color="white" />
                </View>
                <View style={styles.memInfo}>
                  <View style={styles.memNameRow}>
                    <Text style={styles.memName}>{member.name}</Text>
                    {member.captain && <Ionicons name="star" size={12} color="#FFD700" />}
                  </View>
                  <Text style={styles.memPos}>{member.position}</Text>
                </View>
                <Text style={styles.memOvr}>{member.ovr} OVR</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.actions}>
          {team.captain && (
            <TouchableOpacity style={styles.inviteBtn} onPress={() => setShowInvite(true)}>
              <Ionicons name="person-add-outline" size={18} color="white" />
              <Text style={styles.invite}>Invite Player</Text>
            </TouchableOpacity>
          )}
          {!team.captain && (
            <TouchableOpacity style={styles.leaveBtn} onPress={() => setShowLeave(true)}>
              <Text style={styles.leave}>Leave Team</Text>
            </TouchableOpacity>
          )}
        </View>

      </ScrollView>

      {/* Invite Player Modal */}
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
                    onPress={() => { if (inviteUsername.trim()) setInviteDone(true); }}
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

      {/* Leave Team Confirmation Modal */}
      <Modal visible={showLeave} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={[styles.sheet, { gap: 16 }]}>
            <View style={styles.handle} />
            <Text style={styles.sheetTitle}>Leave Team?</Text>
            <Text style={styles.sheetSub}>
              Are you sure you want to leave <Text style={{ color: 'white', fontWeight: '700' }}>{team.name}</Text>? You'll need to be re-invited to rejoin.
            </Text>
            <TouchableOpacity style={styles.leaveConfirmBtn} onPress={() => { setShowLeave(false); router.back(); }}>
              <Text style={styles.leaveConfirmText}>Yes, Leave Team</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secBtn} onPress={() => setShowLeave(false)}>
              <Text style={styles.secText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Member Card Modal */}
      <Modal visible={!!selectedMember} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={[styles.sheet, { alignItems: 'center' }]}>
            <View style={styles.handle} />
            {selectedMember && (
              <>
                <View style={styles.memberCardAvatar}>
                  <Ionicons name="person" size={36} color="white" />
                  {selectedMember.captain && (
                    <View style={styles.captainBadge}>
                      <Ionicons name="star" size={10} color="#FFD700" />
                    </View>
                  )}
                </View>
                <Text style={styles.sheetTitle}>{selectedMember.name}</Text>
                <Text style={styles.sheetSub}>{selectedMember.position}</Text>
                <View style={styles.memberCardStats}>
                  <View style={styles.memberCardStat}>
                    <Text style={styles.memberCardVal}>{selectedMember.ovr}</Text>
                    <Text style={styles.memberCardLab}>OVR</Text>
                  </View>
                  <View style={styles.statDiv} />
                  <View style={styles.memberCardStat}>
                    <Text style={styles.memberCardVal}>{POS_SHORT[selectedMember.position]}</Text>
                    <Text style={styles.memberCardLab}>Position</Text>
                  </View>
                  <View style={styles.statDiv} />
                  <View style={styles.memberCardStat}>
                    <Text style={styles.memberCardVal}>{selectedMember.captain ? 'Yes' : 'No'}</Text>
                    <Text style={styles.memberCardLab}>Captain</Text>
                  </View>
                </View>
                <TouchableOpacity style={[styles.secBtn, { width: '100%' }]} onPress={() => setSelectedMember(null)}>
                  <Text style={styles.secText}>Close</Text>
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
  emptyTeam: { alignItems: 'center', paddingVertical: 60, gap: 12 },
  emptyTitle: { fontWeight: '800', color: '#555', fontSize: 18 },
  emptySub: { color: '#444', fontSize: 13, textAlign: 'center', lineHeight: 20, paddingHorizontal: 16 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#1a1a1a', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 48, gap: 14, borderTopWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.2)', alignSelf: 'center', marginBottom: 8 },
  sheetTitle: { fontWeight: '900', fontSize: 22, color: 'white' },
  sheetSub: { color: '#666', fontSize: 13, lineHeight: 20 },
  fieldLabel: { fontWeight: '700', fontSize: 12, color: '#666', textTransform: 'uppercase', letterSpacing: 0.5 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 13, borderWidth: 1, backgroundColor: 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.12)' },
  input: { flex: 1, color: 'white', fontSize: 15 },
  posRow: { flexDirection: 'row', gap: 8 },
  posChip: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', backgroundColor: 'rgba(255,255,255,0.05)' },
  posChipOn: { borderColor: 'rgba(255,255,255,0.4)', backgroundColor: 'rgba(255,255,255,0.15)' },
  posText: { fontWeight: '700', fontSize: 12, color: '#555' },
  primaryBtn: { padding: 16, borderRadius: 24, alignItems: 'center', backgroundColor: 'white' },
  primaryText: { fontWeight: '800', fontSize: 16, color: 'black' },
  secBtn: { padding: 14, borderRadius: 24, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  secText: { fontWeight: '600', color: '#666', fontSize: 15 },
  successIcon: { width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center', alignSelf: 'center', marginBottom: 4 },
  leaveConfirmBtn: { padding: 16, borderRadius: 24, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,80,80,0.3)', backgroundColor: 'rgba(255,80,80,0.1)' },
  leaveConfirmText: { fontWeight: '700', color: '#ff6b6b', fontSize: 15 },
  memberCardAvatar: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.1)', borderWidth: 2, borderColor: 'rgba(255,255,255,0.2)', marginBottom: 4, position: 'relative' },
  captainBadge: { position: 'absolute', bottom: 2, right: 2, width: 20, height: 20, borderRadius: 10, backgroundColor: 'rgba(255,215,0,0.2)', borderWidth: 1, borderColor: 'rgba(255,215,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  memberCardStats: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 16, paddingVertical: 16, paddingHorizontal: 24, width: '100%', marginTop: 4 },
  memberCardStat: { flex: 1, alignItems: 'center', gap: 4 },
  memberCardVal: { fontWeight: '800', fontSize: 20, color: 'white' },
  memberCardLab: { fontSize: 11, color: '#888', fontWeight: '500' },
});
